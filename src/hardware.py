import cv2
import requests
from .config import UNIHIKER_IP, OLLAMA_URL

def check_webcam():
    """Returns True if webcam opens successfully."""
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        return False, "Webcam not detected."
    cap.release()
    return True, "Webcam connected."

def check_unihiker():
    """Checks if Unihiker server is responding."""
    try:
        response = requests.get(UNIHIKER_IP, timeout=3)
        if response.status_code == 200:
            return True, "Unihiker connected."
        return False, f"Unihiker returned status {response.status_code}."
    except requests.exceptions.RequestException:
        return False, "Unihiker not reachable."


def fetch_heart_rate():
    """Fetches latest heart rate from Unihiker endpoint."""
    try:
        response = requests.get(UNIHIKER_IP, timeout=2)
        response.raise_for_status()

        # Supports either JSON payload {"hr": 88} / {"bpm": 88}
        # or plain text payload "88".
        content_type = response.headers.get("Content-Type", "").lower()
        if "application/json" in content_type:
            payload = response.json()
            value = payload.get("hr", payload.get("bpm"))
        else:
            text = response.text.strip()
            value = text

        hr = int(float(value))
        if hr <= 0:
            raise ValueError("Invalid heart rate value")
        return hr
    except Exception:
        return None

def check_ollama():
    """Checks if Ollama is running locally."""
    try:
        # Simple GET request to check if Ollama is up
        url = OLLAMA_URL.replace("/api/generate", "/")
        response = requests.get(url, timeout=3)
        if response.status_code == 200:
            return True, "Local AI (Ollama) is ready."
        return False, f"Ollama returned status {response.status_code}."
    except requests.exceptions.RequestException:
        return False, "Local AI (Ollama) not running."

def run_hardware_handshake():
    """Runs all checks and returns a dict of statuses."""
    status = {}
    
    webcam_ok, webcam_msg = check_webcam()
    status['Webcam'] = {'ok': webcam_ok, 'msg': webcam_msg}
    
    unihiker_ok, unihiker_msg = check_unihiker()
    status['Unihiker'] = {'ok': unihiker_ok, 'msg': unihiker_msg}
    
    ollama_ok, ollama_msg = check_ollama()
    status['Ollama'] = {'ok': ollama_ok, 'msg': ollama_msg}
    
    all_ok = webcam_ok and unihiker_ok and ollama_ok
    
    return all_ok, status
