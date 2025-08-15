# backend/app.py

from flask_cors import CORS
from flask import Flask, jsonify, request, current_app
from config import Config
from extensions import db, bcrypt, jwt, migrate
from routes.auth import auth_bp
from routes.api import api_bp # api_bp contains /api/alerts and /api/alerts/report
from services.audit import audit_log_middleware
import json
import pandas as pd
from models import Resource, Volunteer, Assignment, DisasterAlert, SensorData
from datetime import datetime
import os
# Removed joblib and numpy imports as ML models are no longer used directly by app routes
from geopy.geocoders import Nominatim
import time
import re # Import regex for more robust city extraction

# Define a mapping of general disaster types to keywords found in 'Disaster_Info'
DISASTER_TYPE_KEYWORDS = {
    "Flood": ['flood', 'rainfall', 'heavy rain', 'cyclone', 'storm', 'inundation', 'waterlogging'],
    "Earthquake": ['earthquake', 'seismic', 'tremor', 'quake'],
    "Cyclone": ['cyclone', 'storm', 'hurricane', 'typhoon', 'gale', 'wind'],
    "Drought": ['drought', 'dry spell', 'water scarcity', 'famine'],
    "Landslide": ['landslide', 'mudslide', 'landslip', 'debris flow'],
    "Heatwave": ['heatwave', 'hot weather', 'extreme heat', 'scorching'],
    "Cold Wave": ['cold wave', 'extreme cold', 'frost'],
    "Tsunami": ['tsunami', 'tidal wave', 'sea wave'],
    "Hailstorm": ['hailstorm', 'hail'],
    "Lightning": ['lightning', 'thunderstorm', 'bolt'],
    "Avalanche": ['avalanch', 'snowslide'],
    "Forest Fire": ['forest fire', 'wildfire', 'bushfire'],
    "Cloudburst": ['cloudburst'],
    "Epidemic": ['epidemic', 'disease outbreak', 'health crisis']
}
ALL_DISASTER_TYPES = list(DISASTER_TYPE_KEYWORDS.keys()) # For frontend dropdown

def create_app():
    app = Flask(__name__)
    CORS(app)
    app.config.from_object(Config)

    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(api_bp, url_prefix='/api') # api_bp contains /api/alerts and /api/alerts/report

    app.before_request(audit_log_middleware)

    with app.app_context():
        db.create_all()

    # --- Geolocator setup and function attachment ---
    app.geolocator = Nominatim(user_agent="disaster-app")
    app.location_coords_cache = {}

    def get_coordinates(location):
        if location in app.location_coords_cache:
            return app.location_coords_cache[location]
        try:
            loc = app.geolocator.geocode(location, timeout=10) # Increased timeout
            if loc:
                coords = (loc.latitude, loc.longitude)
            else:
                coords = (None, None)
        except Exception as e:
            current_app.logger.error(f"Geocode error for {location}: {e}")
            coords = (None, None)
        app.location_coords_cache[location] = coords
        time.sleep(1) # Adhere to Nominatim rate limit
        return coords
    app.get_coordinates = get_coordinates # Attach to app context


    # --- Load static data (location coordinates and disaster data) once on app startup ---
    DATA_DIR = os.path.dirname(__file__)

    try:
        with open(os.path.join(DATA_DIR, 'location_coords.json')) as f:
            app.location_coords = json.load(f)
        print("location_coords.json loaded successfully.")
    except FileNotFoundError:
        print("Warning: location_coords.json not found. Heatmap data might be incomplete.")
        app.location_coords = {}
    except Exception as e:
        print(f"An unexpected error occurred while loading location_coords.json: {e}")
        app.location_coords = {}

    try:
        app.disaster_df = pd.read_csv(os.path.join(DATA_DIR, 'india_disaster_data.csv'))

        if app.disaster_df.columns[0] == 'Unnamed: 0':
            app.disaster_df = app.disaster_df.drop(columns=app.disaster_df.columns[0])

        app.disaster_df['Date'] = pd.to_datetime(app.disaster_df['Date'], errors='coerce')

        # Use the sorted KNOWN_LOCATIONS from app.location_coords for inference
        KNOWN_LOCATIONS = sorted(list(app.location_coords.keys()), key=len, reverse=True)

        def infer_location_from_text(row_text):
            if pd.isna(row_text):
                return None
            text_lower = str(row_text).lower()
            for loc_name in KNOWN_LOCATIONS:
                # Use word boundaries for more accurate matching
                if re.search(r'\b' + re.escape(loc_name.lower()) + r'\b', text_lower):
                    return loc_name
            return None

        # Apply location inference to Title and then to Disaster_Info if Title doesn't yield a match
        app.disaster_df['InferredLocation'] = app.disaster_df['Title'].apply(infer_location_from_text)
        app.disaster_df['InferredLocation'] = app.disaster_df.apply(
            lambda row: row['InferredLocation'] if pd.notna(row['InferredLocation'])
            else infer_location_from_text(row['Disaster_Info']),
            axis=1
        )
        app.disaster_df.dropna(subset=['InferredLocation'], inplace=True)
        app.disaster_df.rename(columns={'InferredLocation': 'Location'}, inplace=True)

        def identify_disaster_types_from_info(info_text):
            detected_types = []
            info_text_lower = str(info_text).lower()
            for disaster_type, keywords in DISASTER_TYPE_KEYWORDS.items():
                if any(keyword in info_text_lower for keyword in keywords):
                    detected_types.append(disaster_type)
            return detected_types if detected_types else ['Other']

        app.disaster_df['DetectedDisasterTypes'] = app.disaster_df['Disaster_Info'].apply(identify_disaster_types_from_info)

        # Calculate severity based on count of specific disaster events
        app.severity_by_location = {}
        for loc in app.disaster_df['Location'].unique():
            loc_df = app.disaster_df[app.disaster_df['Location'] == loc]
            # Count rows where 'DetectedDisasterTypes' is not empty and does not contain only 'Other'
            specific_disasters_count = loc_df[loc_df['DetectedDisasterTypes'].apply(
                lambda x: bool(x) and not (len(x) == 1 and x[0] == 'Other')
            )].shape[0]
            app.severity_by_location[loc] = specific_disasters_count
        print("india_disaster_data.csv loaded and processed successfully.")

    except FileNotFoundError:
        print("Warning: india_disaster_data.csv not found. Data will be unavailable for some features.")
        app.disaster_df = pd.DataFrame()
        app.severity_by_location = {}
    except Exception as e:
        print(f"An unexpected error occurred while loading india_disaster_data.csv: {e}")
        app.disaster_df = pd.DataFrame()
        app.severity_by_location = {}


    # --- Application Routes (Main routes, API routes are in api_bp) ---

    @app.route('/')
    def home():
        return jsonify({"message": "🚨 Disaster Management Backend Running"})

    # Severity Map Data Endpoint
    @app.route('/api/heatmap-data')
    def heatmap_data():
        combined_data = []
        location_coords = app.location_coords
        severity_by_location = app.severity_by_location

        # Iterate over locations that were actually inferred from disaster_df
        for loc_name in app.disaster_df['Location'].unique():
            coords = location_coords.get(loc_name, [None, None])
            lat, lon = coords if coords != [None, None] else (None, None)

            if lat is not None and lon is not None:
                severity = severity_by_location.get(loc_name, 0)
                combined_data.append({
                    'location': loc_name,
                    'latitude': lat,
                    'longitude': lon,
                    'severity': severity
                })
        return jsonify(combined_data)

    # Risk Zones (All Disaster Types) Endpoint for Heatmap
    @app.route('/api/risk_zones')
    def risk_zones():
        risk_data = []
        # Use unique locations from the processed disaster_df
        unique_locations_in_disaster_data = app.disaster_df['Location'].unique()

        for loc_name in unique_locations_in_disaster_data:
            coords = app.location_coords.get(loc_name, [None, None])
            if coords[0] is not None and coords[1] is not None:
                loc_df = app.disaster_df[app.disaster_df['Location'] == loc_name]
                
                detected_types_for_location = set()
                if not loc_df.empty:
                    for types_list in loc_df['DetectedDisasterTypes']:
                        if types_list:
                           detected_types_for_location.update(types_list)
                
                if 'Other' in detected_types_for_location and len(detected_types_for_location) > 1:
                    detected_types_for_location.remove('Other')
                elif 'Other' in detected_types_for_location and len(detected_types_for_location) == 1:
                    detected_types_for_location = set() # If only 'Other', treat as no specific types

                risk_data.append({
                    'location': loc_name,
                    'latitude': float(coords[0]),
                    'longitude': float(coords[1]),
                    'disaster_types': sorted(list(detected_types_for_location))
                })
        return jsonify(risk_data)

    # Historical Risk Analyzer Endpoint
    @app.route('/api/historical-risk', methods=['GET'])
    def historical_risk_analysis():
        location_query = request.args.get('location')
        disaster_type_query = request.args.get('disaster_type')
        
        # New weather inputs for heuristic suggestion
        temp_input = request.args.get('temperature', type=float)
        humidity_input = request.args.get('humidity', type=float)
        rainfall_input = request.args.get('rainfall', type=float)
        windspeed_input = request.args.get('windspeed', type=float)

        filtered_df = app.disaster_df.copy()

        if location_query and location_query != 'All India':
            filtered_df = filtered_df[filtered_df['Location'].str.contains(location_query, case=False, na=False)]

        if disaster_type_query and disaster_type_query != 'All':
            filtered_df = filtered_df[filtered_df['DetectedDisasterTypes'].apply(lambda x: disaster_type_query in x)]
        
        total_events = len(filtered_df)
        
        # Heuristic for suggested disaster based on weather inputs and historical data
        suggested_disaster_type = "No specific disaster suggested based on weather inputs."
        if location_query and total_events > 0:
            common_disasters_at_location = filtered_df['DetectedDisasterTypes'].explode().value_counts().index.tolist()
            if 'Other' in common_disasters_at_location:
                common_disasters_at_location.remove('Other')

            if temp_input is not None and temp_input > 40 and 'Heatwave' in common_disasters_at_location:
                suggested_disaster_type = "High temperature suggests potential Heatwave risk."
            elif rainfall_input is not None and rainfall_input > 100 and 'Flood' in common_disasters_at_location:
                suggested_disaster_type = "High rainfall suggests potential Flood risk."
            elif windspeed_input is not None and windspeed_input > 50 and 'Cyclone' in common_disasters_at_location:
                suggested_disaster_type = "High wind speed suggests potential Cyclone risk."
            elif temp_input is not None and temp_input < 5 and 'Cold Wave' in common_disasters_at_location:
                suggested_disaster_type = "Low temperature suggests potential Cold Wave risk."
            elif 'Flood' in common_disasters_at_location:
                suggested_disaster_type = "Historically, Flood is common in this area."
            elif 'Earthquake' in common_disasters_at_location:
                suggested_disaster_type = "Historically, Earthquake is common in this area."
            elif 'Cyclone' in common_disasters_at_location:
                suggested_disaster_type = "Historically, Cyclone is common in this area."


        response_data = {
            'query_location': location_query if location_query else 'All India',
            'query_disaster_type': disaster_type_query if disaster_type_query else 'All Disasters',
            'total_historical_events_found': total_events,
            'details_by_type': {},
            'suggested_disaster_based_on_weather_input': suggested_disaster_type
        }

        if total_events > 0:
            all_detected_types = [item for sublist in filtered_df['DetectedDisasterTypes'] for item in sublist]
            type_counts = pd.Series(all_detected_types).value_counts().to_dict()

            if 'Other' in type_counts and len(type_counts) > 1:
                type_counts.pop('Other')
            elif 'Other' in type_counts and len(type_counts) == 1:
                type_counts = {'No Specific Types Identified': type_counts['Other']}
            
            response_data['details_by_type'] = type_counts
            
            if 'Year' in filtered_df.columns and not filtered_df['Year'].empty:
                min_year = filtered_df['Year'].min()
                max_year = filtered_df['Year'].max()
                num_years = max_year - min_year + 1
                if num_years > 0:
                    response_data['average_events_per_year'] = round(total_events / num_years, 2)
                else:
                    response_data['average_events_per_year'] = total_events

        return jsonify(response_data)


    # ===== Resource Management Routes =====
    @app.route('/resources', methods=['GET', 'POST'])
    def handle_resources():
        if request.method == 'POST':
            data = request.get_json()
            new_resource = Resource(
                resource_type=data['resource_type'],
                quantity=data['quantity'],
                location=data['location'],
            )
            db.session.add(new_resource)
            db.session.commit()
            return jsonify({'message': 'Resource created', 'id': new_resource.id}), 201
        else: # GET
            severity_threshold = float(request.args.get('severity_min', 0))
            resources = Resource.query.all()
            filtered_resources = []
            for r in resources:
                location_severity = app.severity_by_location.get(r.location, 0)
                if location_severity >= severity_threshold:
                    filtered_resources.append({
                        'id': r.id,
                        'resource_type': r.resource_type,
                        'quantity': r.quantity,
                        'location': r.location,
                        'assigned': r.assigned,
                        'created_at': r.created_at.isoformat(),
                        'location_severity': location_severity
                    })
            return jsonify(filtered_resources)

    # ===== Volunteer Management Routes =====
    @app.route('/volunteers', methods=['GET', 'POST'])
    def handle_volunteers():
        if request.method == 'POST':
            data = request.get_json()
            new_volunteer = Volunteer(
                name=data['name'],
                contact=data['contact'],
                location=data['location'],
                assigned_zone=data.get('assigned_zone'),
                available=True,
                assistance_type=data.get('assistance_type')
            )
            db.session.add(new_volunteer)
            db.session.commit()
            return jsonify({'message': 'Volunteer created', 'id': new_volunteer.id}), 201
        else: # GET
            severity_threshold = float(request.args.get('severity_min', 0))
            volunteers = Volunteer.query.all()
            filtered_volunteers = []
            for v in volunteers:
                location_severity = app.severity_by_location.get(v.location, 0)
                if location_severity >= severity_threshold:
                    filtered_volunteers.append({
                        'id': v.id,
                        'name': v.name,
                        'contact': v.contact,
                        'location': v.location,
                        'available': v.available,
                        'assigned_zone': v.assigned_zone,
                        'assistance_type': v.assistance_type,
                        'location_severity': location_severity
                    })
            return jsonify(filtered_volunteers)

    # ===== Assignment Routes =====
    @app.route('/assignments', methods=['GET', 'POST'])
    def handle_assignments():
        if request.method == 'POST':
            data = request.get_json()
            volunteer = Volunteer.query.get(data['volunteer_id'])
            resource = Resource.query.get(data['resource_id'])

            if volunteer and resource:
                new_assignment = Assignment(
                    zone=data['zone'],
                    volunteer_id=volunteer.id,
                    resource_id=resource.id
                )
                db.session.add(new_assignment)
                resource.assigned = True
                volunteer.assigned_zone = data['zone']
                db.session.commit()
                return jsonify({'message': 'Assignment created', 'id': new_assignment.id}), 201

            return jsonify({'message': 'No matching volunteer/resource available'}), 404
        else: # GET
            assignments = Assignment.query.all()
            result = []
            for a in assignments:
                volunteer = Volunteer.query.get(a.volunteer_id)
                resource = Resource.query.get(a.resource_id)
                result.append({
                    'id': a.id,
                    'zone': a.zone,
                    'assigned_at': a.assigned_at.isoformat(),
                    'volunteer_id': a.volunteer_id,
                    'volunteer': {'id': volunteer.id, 'name': volunteer.name, 'assistance_type': volunteer.assistance_type} if volunteer else None,
                    'resource_id': a.resource_id,
                    'resource': {'id': resource.id, 'resource_type': resource.resource_type} if resource else None,
                })
            return jsonify(result)

    # ===== Auto-assign Route =====
    @app.route('/auto-assign', methods=['POST'])
    def auto_assign():
        severity_by_location = app.severity_by_location
        
        sorted_zones = sorted(severity_by_location.items(), key=lambda x: x[1], reverse=True)

        for zone, severity in sorted_zones:
            volunteer = Volunteer.query.filter_by(location=zone, available=True).first()
            resource = Resource.query.filter_by(location=zone, assigned=False).first()

            if volunteer and resource:
                assignment = Assignment(
                    zone=zone,
                    resource_id=resource.id,
                    volunteer_id=volunteer.id,
                    assigned_at=datetime.utcnow()
                )
                db.session.add(assignment)

                volunteer.available = False
                volunteer.assigned_zone = zone
                resource.assigned = True

                try:
                    db.session.commit()
                    return jsonify({
                        'message': 'Auto-assignment successful',
                        'zone': zone,
                        'volunteer_id': volunteer.id,
                        'resource_id': resource.id,
                        'volunteer_name': volunteer.name,
                        'resource_type': resource.resource_type
                    }), 201
                except Exception as e:
                    db.session.rollback()
                    current_app.logger.error(f"Error during auto-assignment commit: {e}")
                    return jsonify({'error': 'Failed to auto-assign due to database error'}), 500

        return jsonify({'message': 'No matching volunteer/resource available for auto-assignment'}), 404


    # ===== Location Summary Route =====
    @app.route('/location-summary')
    def location_summary():
        result = []
        location_coords = app.location_coords
        severity_by_location = app.severity_by_location
        
        unique_locations_in_disaster_df = app.disaster_df['Location'].unique()

        for loc in unique_locations_in_disaster_df:
            volunteers_count = Volunteer.query.filter_by(location=loc).count()
            resources_count = Resource.query.filter_by(location=loc).count()
            assignments_count = Assignment.query.filter_by(zone=loc).count()
            severity = severity_by_location.get(loc, 0)

            coords = location_coords.get(loc, [None, None])

            result.append({
                'location': loc,
                'severity': severity,
                'volunteers_count': volunteers_count,
                'resources_count': resources_count,
                'assignments_count': assignments_count,
                'coords': coords
            })
        return jsonify(result)

    # ===== Sensor Data Routes =====
    @app.route('/sensor-data', methods=['GET', 'POST'])
    def handle_sensor_data():
        if request.method == 'POST':
            data = request.json
            if not all(k in data for k in ['sensor_type', 'value', 'latitude', 'longitude']):
                return jsonify({'error': 'Missing sensor data'}), 400
            
            new_sensor_data = SensorData(
                sensor_type=data['sensor_type'],
                value=data['value'],
                latitude=data['latitude'],
                longitude=data['longitude']
            )
            db.session.add(new_sensor_data)
            try:
                db.session.commit()
                return jsonify({'message': 'Sensor data added', 'id': new_sensor_data.id}), 201
            except Exception as e:
                db.session.rollback()
                current_app.logger.error(f"Error adding sensor data: {e}")
                return jsonify({'error': 'Failed to add sensor data'}), 500
        else: # GET
            sensor_data = SensorData.query.order_by(SensorData.timestamp.desc()).limit(100).all()
            return jsonify([{
                'id': s.id,
                'sensor_type': s.sensor_type,
                'value': s.value,
                'timestamp': s.timestamp.isoformat(),
                'latitude': s.latitude,
                'longitude': s.longitude
            } for s in sensor_data])


    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Resource not found', 'details': str(e)}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
