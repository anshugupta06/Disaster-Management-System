import os
import joblib
import numpy as np

MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'ml_model', 'disaster_model.pkl')

class DisasterModel:
    def __init__(self):
        self.model = self.load_model()

    def load_model(self):
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model not found at {MODEL_PATH}")
        return joblib.load(MODEL_PATH)

    def predict(self, input_data):
        # input_data: dict with keys: temperature, humidity, rainfall, etc.
        features = np.array([[input_data.get('temperature', 0),
                              input_data.get('humidity', 0),
                              input_data.get('rainfall', 0)]])
        prediction = self.model.predict(features)
        prob = self.model.predict_proba(features) if hasattr(self.model, 'predict_proba') else None
        risk = prediction[0]
        confidence = max(prob[0]) if prob is not None else None
        return {'risk': risk, 'confidence': confidence}

disaster_model = DisasterModel()
