# backend/update_location_coords.py

import pandas as pd
import json
import os
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
import time
import re # Import regex for more robust city extraction

# --- Configuration ---
INDIA_DISASTER_DATA_PATH = 'india_disaster_data.csv'
LOCATION_COORDS_PATH = 'location_coords.json'

# Initialize Nominatim geolocator
geolocator = Nominatim(user_agent="disaster_app_geocoder")

# List of common Indian states/union territories to help filter relevant locations
# This helps avoid geocoding irrelevant words that might appear in disaster descriptions
INDIAN_STATES_AND_UTS = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Lakshadweep", "Delhi", "Puducherry", "Jammu and Kashmir", "Ladakh"
]
# Add major cities from your existing location_coords.json as well
MAJOR_INDIAN_CITIES = [
    "Mumbai", "Delhi", "Bengaluru", "Chennai", "Kolkata", "Hyderabad",
    "Ahmedabad", "Pune", "Jaipur", "Lucknow", "Chandigarh", "Bhopal",
    "Patna", "Ranchi", "Guwahati", "Srinagar", "Thiruvananthapuram",
    "Bhubaneswar", "Goa", "Visakhapatnam"
]
# Combine and make unique for comprehensive checking
ALL_INDIAN_LOCATIONS = sorted(list(set(INDIAN_STATES_AND_UTS + MAJOR_INDIAN_CITIES)), key=len, reverse=True)


def get_coordinates(location_name):
    """
    Fetches coordinates for a given location name with retry logic and rate limiting.
    """
    if not location_name or pd.isna(location_name):
        return None, None

    # Append "India" to improve geocoding accuracy for Indian cities/states
    query = f"{location_name}, India"
    
    retries = 3
    for i in range(retries):
        try:
            loc = geolocator.geocode(query, timeout=10) # Increased timeout
            if loc:
                print(f"  Geocoded '{location_name}': ({loc.latitude}, {loc.longitude})")
                return loc.latitude, loc.longitude
            else:
                print(f"  Could not geocode '{location_name}'.")
                return None, None
        except GeocoderTimedOut:
            print(f"  Geocoding timed out for '{location_name}'. Retrying ({i+1}/{retries})...")
            time.sleep(2 * (i + 1)) # Exponential backoff
        except GeocoderServiceError as e:
            print(f"  Geocoding service error for '{location_name}': {e}. Retrying ({i+1}/{retries})...")
            time.sleep(2 * (i + 1))
        except Exception as e:
            print(f"  An unexpected error occurred during geocoding '{location_name}': {e}")
            return None, None
    print(f"  Failed to geocode '{location_name}' after {retries} attempts.")
    return None, None


def infer_locations_from_text(text):
    """
    Infers locations from a given text by matching against known Indian locations.
    Returns a set of unique inferred locations.
    """
    inferred_locs = set()
    if pd.isna(text):
        return inferred_locs

    text_lower = str(text).lower()
    for loc_name in ALL_INDIAN_LOCATIONS:
        # Use word boundaries to avoid partial matches (e.g., "go" in "mango")
        if re.search(r'\b' + re.escape(loc_name.lower()) + r'\b', text_lower):
            inferred_locs.add(loc_name)
    return inferred_locs


def update_location_coordinates():
    print("Starting update of location_coords.json...")

    # Load existing location_coords.json
    existing_coords = {}
    if os.path.exists(LOCATION_COORDS_PATH):
        with open(LOCATION_COORDS_PATH, 'r') as f:
            try:
                existing_coords = json.load(f)
                print(f"Loaded existing {len(existing_coords)} locations from {LOCATION_COORDS_PATH}")
            except json.JSONDecodeError:
                print(f"Warning: {LOCATION_COORDS_PATH} is empty or invalid JSON. Starting fresh.")
    else:
        print(f"No existing {LOCATION_COORDS_PATH} found. A new one will be created.")

    # Load disaster data
    try:
        df = pd.read_csv(INDIA_DISASTER_DATA_PATH)
        if df.columns[0] == 'Unnamed: 0':
            df = df.drop(columns=df.columns[0])
        print(f"Loaded {len(df)} entries from {INDIA_DISASTER_DATA_PATH}.")
    except FileNotFoundError:
        print(f"Error: {INDIA_DISASTER_DATA_PATH} not found. Cannot infer new locations.")
        return
    except Exception as e:
        print(f"Error loading {INDIA_DISASTER_DATA_PATH}: {e}")
        return

    # Collect all unique potential locations from the CSV
    all_potential_csv_locations = set()
    for _, row in df.iterrows():
        all_potential_csv_locations.update(infer_locations_from_text(row.get('Title')))
        all_potential_csv_locations.update(infer_locations_from_text(row.get('Disaster_Info')))
    
    print(f"Found {len(all_potential_csv_locations)} unique potential locations in CSV data.")

    # Process locations: geocode new ones and re-geocode null ones
    updated_coords = existing_coords.copy()
    locations_to_geocode = set()

    # Add new locations from CSV to the list to be geocoded
    for loc in all_potential_csv_locations:
        if loc not in updated_coords:
            locations_to_geocode.add(loc)
        elif updated_coords[loc][0] is None or updated_coords[loc][1] is None:
            # Re-geocode if coordinates are null
            locations_to_geocode.add(loc)
    
    # Also ensure any existing locations in location_coords.json that were not in CSV but have null coords are re-geocoded
    for loc, coords in existing_coords.items():
        if coords[0] is None or coords[1] is None:
            locations_to_geocode.add(loc)

    print(f"Total locations to geocode/re-geocode: {len(locations_to_geocode)}")

    for loc_name in sorted(list(locations_to_geocode)): # Sort for consistent output
        print(f"Geocoding '{loc_name}'...")
        lat, lon = get_coordinates(loc_name)
        if lat is not None and lon is not None:
            updated_coords[loc_name] = [lat, lon]
        else:
            updated_coords[loc_name] = [None, None] # Ensure it's explicitly null if failed
        time.sleep(1) # Adhere to Nominatim rate limit

    # Save updated location_coords.json
    with open(LOCATION_COORDS_PATH, 'w') as f:
        json.dump(updated_coords, f, indent=4)
    
    print(f"\nUpdated {LOCATION_COORDS_PATH} with {len(updated_coords)} entries.")
    print("Please restart your backend (app.py) to load the new location data.")


if __name__ == "__main__":
    update_location_coordinates()
