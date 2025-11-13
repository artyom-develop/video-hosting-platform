#!/usr/bin/env python3
import requests
import json

BASE_URL = "http://localhost:8000/api"

# 1. Регистрация
print("1. Registering user...")
reg_data = {
    "username": "videouploader",
    "email": "uploader@test.com",
    "password": "Upload1234!",
    "full_name": "Video Uploader"
}

try:
    reg_response = requests.post(f"{BASE_URL}/auth/register", json=reg_data)
    print(f"   Status: {reg_response.status_code}")
    if reg_response.status_code in [200, 201]:
        user_data = reg_response.json()
        print(f"   User ID: {user_data.get('id')}")
        user_id = user_data.get('id')
    else:
        print(f"   Response: {reg_response.json()}")
except Exception as e:
    print(f"   Error: {e}")

# 2. Login
print("\n2. Logging in...")
session = requests.Session()
login_response = session.post(f"{BASE_URL}/auth/login?username=videouploader&password=Upload1234!")
print(f"   Status: {login_response.status_code}")
if login_response.status_code == 200:
    print("   Logged in successfully")
else:
    print(f"   Error: {login_response.json()}")

# 3. Create channel
print("\n3. Creating channel...")
channel_data = {
    "title": "Test Upload Channel",
    "description": "Channel for uploading test videos"
}

channel_response = session.post(f"{BASE_URL}/channels", json=channel_data)
print(f"   Status: {channel_response.status_code}")
if channel_response.status_code in [200, 201]:
    channel = channel_response.json()
    channel_id = channel.get('id')
    print(f"   Channel ID: {channel_id}")
else:
    print(f"   Response: {channel_response.json()}")

# 4. Upload video (using one of the test videos)
print("\n4. Uploading video...")
video_path = "backend/uploads/streams/1763058470.720132_20251113_2109_01k9x2vh6wexv97dzg8717snp7.mp4"

try:
    with open(video_path, 'rb') as f:
        files = {
            'video': ('test_video.mp4', f, 'video/mp4')
        }
        data = {
            'title': 'Test Video Upload',
            'description': 'This is a test video'
        }
        
        upload_response = session.post(
            f"{BASE_URL}/streams/{channel_id}/upload-video",
            files=files,
            data=data
        )
        
        print(f"   Status: {upload_response.status_code}")
        if upload_response.status_code in [200, 201]:
            stream = upload_response.json()
            print(f"   Video ID: {stream.get('id')}")
            print(f"   Title: {stream.get('title')}")
            print(f"   URL: {stream.get('video_url')}")
        else:
            print(f"   Response: {upload_response.json()}")
except FileNotFoundError:
    print(f"   Error: Video file not found at {video_path}")
except Exception as e:
    print(f"   Error: {e}")

print("\nDone!")
