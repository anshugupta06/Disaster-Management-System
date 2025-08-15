import requests

data = {
    "Temperature": 33,
    "Humidity": 78,
    "Rainfall": 210,
    "WindSpeed": 15
}

res = requests.post("http://127.0.0.1:5000/api/predict", json=data)
print("🔍 Response:", res.json())
