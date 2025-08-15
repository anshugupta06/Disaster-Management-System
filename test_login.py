import requests

# Step 1: Login to get token
login_url = "http://127.0.0.1:5000/auth/login"
login_data = {
    "username": "admin1",
    "password": "password123"
}
login_response = requests.post(login_url, json=login_data)
print("Login response:", login_response.json())

token = login_response.json().get("access_token")

if token:
    # Step 2: Use token to call predict API
    predict_url = "http://127.0.0.1:5000/api/predict"
    headers = {"Authorization": f"Bearer {token}"}
    predict_data = {
        "temperature": 33,
        "humidity": 80,
        "rainfall": 120
    }
    predict_response = requests.post(predict_url, headers=headers, json=predict_data)
    print("Prediction response:", predict_response.json())
else:
    print("Failed to get access token")
