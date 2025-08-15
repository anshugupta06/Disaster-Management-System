from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity # Keep if other routes need it
from models import SensorData, DisasterAlert
from extensions import db
from datetime import datetime
import pandas as pd # Ensure pandas is imported if used here
import re # Import regex for location parsing if needed
import requests # Import requests for making HTTP calls to external APIs
import json # Import json for handling JSON data
import time # Import time for exponential backoff

# Define Blueprint
api_bp = Blueprint('api', __name__)

# --- API Routes ---

# Sensor Data Routes (can remain here as they are generic)
@api_bp.route('/sensor-data', methods=['POST'])
@jwt_required()
def add_sensor_data():
    data = request.get_json()
    sensor = SensorData(
        sensor_type=data.get('sensor_type'),
        value=data.get('value'),
        latitude=data.get('latitude'),
        longitude=data.get('longitude')
    )
    db.session.add(sensor)
    db.session.commit()
    return jsonify({"msg": "Sensor data saved"})

@api_bp.route('/sensor-data', methods=['GET'])
@jwt_required()
def get_sensor_data():
    sensor_type = request.args.get('sensor_type')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    query = SensorData.query

    if sensor_type:
        query = query.filter(SensorData.sensor_type == sensor_type)

    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
            query = query.filter(SensorData.timestamp >= start_dt)
        except ValueError:
            return jsonify({"error": "Invalid start_date format"}), 400

    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
            query = query.filter(SensorData.timestamp <= end_dt)
        except ValueError:
            return jsonify({"error": "Invalid end_date format"}), 400

    data = query.order_by(SensorData.timestamp.desc()).limit(100).all()

    results = [{
        "sensor_type": d.sensor_type,
        "value": d.value,
        "latitude": d.latitude,
        "longitude": d.longitude,
        "timestamp": d.timestamp.isoformat()
    } for d in data]

    return jsonify(results)

# Alerts Route (GET)
@api_bp.route('/alerts', methods=['GET'])
# @jwt_required() # TEMPORARILY COMMENTED OUT FOR DEBUGGING. RE-ADD IF AUTH IS REQUIRED.
def get_alerts_paginated():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    pagination = DisasterAlert.query.order_by(DisasterAlert.issued_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    alerts = pagination.items

    results = [{
        "alert_id": a.id, # Ensure 'id' is used for unique key
        "alert_type": a.alert_type,
        "severity": a.severity,
        "description": a.description,
        "issued_at": a.issued_at.isoformat(),
        "latitude": a.latitude,
        "longitude": a.longitude,
        "location": a.location # Ensure location is returned
    } for a in alerts]

    return jsonify({
        "alerts": results,
        "total": pagination.total,
        "page": page,
        "per_page": per_page,
        "pages": pagination.pages
    })

# Endpoint for reporting alerts (POST)
@api_bp.route('/alerts/report', methods=['POST'])
# @jwt_required() # Add this back if you want to require authentication to report alerts
def report_alert():
    data = request.get_json()
    alert_type = data.get('alert_type')
    severity = data.get('severity')
    description = data.get('description')
    location_name = data.get('location') # Location name from user input

    if not all([alert_type, severity, description, location_name]):
        return jsonify({"error": "Missing required alert fields"}), 400

    # Geocode the location provided by the user using the app's geocoding function
    # Ensure current_app.get_coordinates is available and works
    latitude, longitude = current_app.get_coordinates(location_name)

    if latitude is None or longitude is None:
        return jsonify({"error": f"Could not determine coordinates for location: {location_name}"}), 400

    new_alert = DisasterAlert(
        alert_type=alert_type,
        severity=severity,
        description=description,
        latitude=latitude,
        longitude=longitude,
        location=location_name, # Store the location name as well
        issued_at=datetime.utcnow()
    )
    db.session.add(new_alert)
    try:
        db.session.commit()
        return jsonify({"message": "Alert reported successfully", "alert_id": new_alert.id}), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error reporting alert: {e}")
        return jsonify({"error": "Failed to report alert due to database error"}), 500


# Risk Zones (Heatmap Data) Endpoint - Now uses current_app.disaster_df
@api_bp.route('/risk_zones', methods=['GET'])
def get_risk_zones():
    risk_data = []
    processed_df = current_app.disaster_df

    for loc_name in processed_df['Location'].unique():
        coords = current_app.location_coords.get(loc_name, [None, None])
        if coords[0] is not None and coords[1] is not None:
            loc_df = processed_df[processed_df['Location'] == loc_name]
            
            detected_types_for_location = set()
            if not loc_df.empty:
                for types_list in loc_df['DetectedDisasterTypes']:
                    if types_list:
                       detected_types_for_location.update(types_list)
            
            if 'Other' in detected_types_for_location and len(detected_types_for_location) > 1:
                detected_types_for_location.remove('Other')
            elif 'Other' in detected_types_for_location and len(detected_types_for_location) == 1:
                detected_types_for_location = set()

            risk_data.append({
                'location': loc_name,
                'latitude': float(coords[0]),
                'longitude': float(coords[1]),
                'disaster_types': sorted(list(detected_types_for_location))
            })
    return jsonify(risk_data)

# NEW: Chatbot Endpoint
@api_bp.route('/chatbot', methods=['POST'])
def chatbot_interaction():
    user_message = request.json.get('message')
    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    prompt = f"""
    You are a helpful disaster management assistant. Your goal is to understand the user's need for help during a disaster and provide a concise, empathetic, and actionable response.
    If the user indicates they are in danger or need immediate help, prioritize acknowledging their emergency and suggesting they contact local emergency services.
    If they mention a specific resource (e.g., "food", "water", "medical aid", "shelter"), acknowledge it.
    Keep responses brief and to the point.

    User: {user_message}
    """

    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.7,
            "topK": 40,
            "topP": 0.95,
            "maxOutputTokens": 150,
        }
    }

    # IMPORTANT: Replace "YOUR_GEMINI_API_KEY_HERE" with your actual API key
    # This is for local testing ONLY. DO NOT COMMIT THIS TO PUBLIC REPOS.
    api_key = "AIzaSyBxoZD4hA50idFZE-Z60vufv4Xk-tqIaBQ" # <--- YOUR API KEY IS NOW HERE
    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key={api_key}"

    try:
        retries = 3
        for i in range(retries):
            response = requests.post(api_url, headers={'Content-Type': 'application/json'}, data=json.dumps(payload))
            if response.status_code == 429:
                sleep_time = 2 ** i
                current_app.logger.warning(f"Rate limit hit. Retrying in {sleep_time} seconds...")
                time.sleep(sleep_time)
            elif response.ok:
                llm_response = response.json()
                if llm_response and llm_response.get('candidates'):
                    generated_text = llm_response['candidates'][0]['content']['parts'][0]['text']
                    return jsonify({"response": generated_text}), 200
                else:
                    current_app.logger.error(f"LLM response structure unexpected: {llm_response}")
                    return jsonify({"error": "Failed to get a valid response from the AI assistant."}), 500
            else:
                current_app.logger.error(f"LLM API error: {response.status_code} - {response.text}")
                # If it's a 403, specifically mention API key issue
                if response.status_code == 403:
                    return jsonify({"error": f"AI assistant API error: {response.status_code} (Forbidden - Check your API key and permissions)"}), 500
                else:
                    return jsonify({"error": f"AI assistant API error: {response.status_code}"}), 500
        
        return jsonify({"error": "Failed to get response from AI assistant after multiple retries due to rate limiting or other issues."}), 500

    except requests.exceptions.RequestException as e:
        current_app.logger.error(f"Network error communicating with LLM: {e}")
        return jsonify({"error": f"Network error communicating with AI assistant: {e}"}), 500
    except Exception as e:
        current_app.logger.error(f"Unexpected error in chatbot endpoint: {e}")
        return jsonify({"error": f"An unexpected error occurred: {e}"}), 500


