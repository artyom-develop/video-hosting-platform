import requests
import json

BASE_URL = "http://localhost:8000/api"

# Get video details
response = requests.get(f"{BASE_URL}/streams/17")
print(f"Status: {response.status_code}")
data = response.json()
print(json.dumps(data, indent=2))
