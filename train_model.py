# backend/train_models.py

import pandas as pd
import numpy as np # Keep numpy for potential future numerical operations
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os
import json # Import json to load location_coords
import re # Import regex for more robust location matching

# --- Configuration ---
DISASTER_DATA_PATH = 'india_disaster_data.csv' # Your existing disaster data
ML_MODEL_DIR = 'ml_model' # Directory to save trained models

# Ensure the ML model directory exists
os.makedirs(ML_MODEL_DIR, exist_ok=True)

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
    "Avalanche": ['avalanch', 'snowslide'], # 'avalanch' for partial match
    "Forest Fire": ['forest fire', 'wildfire', 'bushfire'],
    "Cloudburst": ['cloudburst'],
    "Epidemic": ['epidemic', 'disease outbreak', 'health crisis']
}

# Load location_coords to get a list of known locations for matching
KNOWN_LOCATIONS = []
try:
    with open('location_coords.json') as f:
        location_coords = json.load(f)
    KNOWN_LOCATIONS = list(location_coords.keys())
    # Sort known locations by length descending to prioritize more specific matches
    KNOWN_LOCATIONS.sort(key=len, reverse=True)
    print("location_coords.json loaded for location matching.")
except FileNotFoundError:
    print("Warning: location_coords.json not found. Location matching in train_models.py might be limited.")
except Exception as e:
    print(f"An unexpected error occurred while loading location_coords.json: {e}")


# --- Step 1: Load Disaster Data ---
print(f"Loading disaster data from: {DISASTER_DATA_PATH}")
try:
    disaster_df = pd.read_csv(DISASTER_DATA_PATH)
    # Drop the first unnamed column if it exists (common with exported CSVs)
    if disaster_df.columns[0] == 'Unnamed: 0':
        disaster_df = disaster_df.drop(columns=disaster_df.columns[0])
    print("Disaster data loaded successfully.")
    print("Disaster data columns:", disaster_df.columns.tolist())
except FileNotFoundError:
    print(f"Error: {DISASTER_DATA_PATH} not found. Please ensure it's in the backend directory.")
    exit()
except Exception as e:
    print(f"Error loading disaster data: {e}")
    exit()

# --- Step 2: Preprocess Data and Create Labels (based on disaster info) ---

# Convert 'Date' column to datetime objects
disaster_df['Date'] = pd.to_datetime(disaster_df['Date'], errors='coerce')
disaster_df.dropna(subset=['Date'], inplace=True)

# Function to identify disaster types based on keywords in 'Disaster_Info'
def identify_disaster_types_from_info(info_text):
    detected_types = []
    if pd.isna(info_text):
        return []
    info_text_lower = str(info_text).lower()
    for disaster_type, keywords in DISASTER_TYPE_KEYWORDS.items():
        if any(keyword in info_text_lower for keyword in keywords):
            detected_types.append(disaster_type)
    return detected_types

disaster_df['DetectedDisasterTypes'] = disaster_df['Disaster_Info'].apply(identify_disaster_types_from_info)

# Create binary labels for Flood and Earthquake based on DetectedDisasterTypes
disaster_df['is_flood'] = disaster_df['DetectedDisasterTypes'].apply(lambda x: 1 if 'Flood' in x else 0)
disaster_df['is_earthquake'] = disaster_df['DetectedDisasterTypes'].apply(lambda x: 1 if 'Earthquake' in x else 0)

print("Finished labeling disaster events.")
print(f"Total flood events labeled: {disaster_df['is_flood'].sum()}")
print(f"Total earthquake events labeled: {disaster_df['is_earthquake'].sum()}")

# --- Step 3: Define Features and Target Variables for ML (Conceptual) ---
# IMPORTANT: With weather data removed, we no longer have numerical features
# like Temperature, Humidity, etc., to predict floods/earthquakes.
# If you want to train predictive models, you would need to:
# 1. Add other numerical features to your disaster_df (e.g., derived from location, time of year, historical frequency).
# 2. Use NLP techniques to extract features from 'Title' or 'Disaster_Info' text.
# For now, without numerical features, the RandomForestClassifier cannot be trained.

features = [] # No numerical features from weather anymore

# Example of how you might add conceptual features if available
# if 'SomeNumericalFeature' in disaster_df.columns:
#     features.append('SomeNumericalFeature')

if not features:
    print("\nWARNING: No numerical features defined for model training.")
    print("         The current models (Flood/Earthquake) were designed for weather features.")
    print("         Without suitable numerical features, these models cannot be effectively trained.")
    print("         If you wish to train models, consider adding relevant numerical data or using NLP for text features.")
    # We will proceed but expect training to be skipped or fail if no features.

training_df = disaster_df.copy() # Use disaster_df directly for training

# Drop rows with NaN in features if any (though 'features' is empty now)
if features: # Only attempt if features list is not empty
    training_df.dropna(subset=features, inplace=True)

if training_df.empty:
    print("Error: No valid training data after preprocessing. Check your CSVs and labeling logic.")
    exit()

# X will be empty or contain non-numerical data if no features are added
X = training_df[features]
y_flood = training_df['is_flood']
y_earthquake = training_df['is_earthquake']

print(f"\nFinal training data shape (X): {X.shape}")
print(f"Final Flood labels distribution:\n{y_flood.value_counts()}")
print(f"Final Earthquake labels distribution:\n{y_earthquake.value_counts()}")

# --- Step 4: Train Models (Conditional Training) ---

# Train Flood Prediction Model
print("\nTraining Flood Prediction Model...")
if not X.empty and len(y_flood.unique()) > 1:
    try:
        X_train_f, X_test_f, y_train_f, y_test_f = train_test_split(X, y_flood, test_size=0.2, random_state=42, stratify=y_flood)
        flood_model = RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')
        flood_model.fit(X_train_f, y_train_f)
        y_pred_f = flood_model.predict(X_test_f)
        print("Flood Model Accuracy:", accuracy_score(y_test_f, y_pred_f))
        print("Flood Model Classification Report:\n", classification_report(y_test_f, y_pred_f))
    except ValueError as e:
        print(f"Skipping Flood Model training: Error during training - {e}. Ensure X has valid numerical features.")
        flood_model = None
else:
    print("Skipping Flood Model training: Not enough data or no valid features for classification.")
    flood_model = None

# Train Earthquake Prediction Model
print("\nTraining Earthquake Prediction Model...")
if not X.empty and len(y_earthquake.unique()) > 1:
    try:
        X_train_e, X_test_e, y_train_e, y_test_e = train_test_split(X, y_earthquake, test_size=0.2, random_state=42, stratify=y_earthquake)
        eq_model = RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')
        eq_model.fit(X_train_e, y_train_e)
        y_pred_e = eq_model.predict(X_test_e)
        print("Earthquake Model Accuracy:", accuracy_score(y_test_e, y_pred_e))
        print("Earthquake Model Classification Report:\n", classification_report(y_test_e, y_pred_e))
    except ValueError as e:
        print(f"Skipping Earthquake Model training: Error during training - {e}. Ensure X has valid numerical features.")
        eq_model = None
else:
    print("Skipping Earthquake Model training: Not enough data or no valid features for classification.")
    eq_model = None


# --- Step 5: Save Models ---
print("\nSaving trained models...")
if flood_model:
    joblib.dump(flood_model, os.path.join(ML_MODEL_DIR, 'flood_model.pkl'))
    print(f"Flood model saved to '{ML_MODEL_DIR}/flood_model.pkl'.")
else:
    print("Flood model not trained or training skipped, skipping save.")

if eq_model:
    joblib.dump(eq_model, os.path.join(ML_MODEL_DIR, 'earthquake_model.pkl'))
    print(f"Earthquake model saved to '{ML_MODEL_DIR}/earthquake_model.pkl'.")
else:
    print("Earthquake model not trained or training skipped, skipping save.")

print("\nModel training and saving process complete. Note: Models were trained conditionally based on feature availability.")
