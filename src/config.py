import os

# Configuration settings

# Database
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'silverfit.db')

# Twilio (Dummy credentials for now, can be updated later)
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "your_account_sid")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "your_auth_token")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER", "+1234567890")
FAMILY_PHONE_NUMBER = os.getenv("FAMILY_PHONE_NUMBER", "+0987654321")

# Unihiker
UNIHIKER_IP = "http://10.1.2.3:5000/hr"  # Example IP

# AI Server (Ollama local)
OLLAMA_URL = "http://localhost:11434/api/generate"
AI_MODEL = "qwen3.5:9b"  # or 4b

# Webdock VPS (Cloud Sync)
WEBDOCK_URL = "https://your-webdock-server.com/api/upload_session"

# Safety Thresholds
# Example for Age 65: 78-132 bpm
HR_MIN = 78
HR_MAX = 132

# Inactivity Threshold
INACTIVITY_HOURS = 24
