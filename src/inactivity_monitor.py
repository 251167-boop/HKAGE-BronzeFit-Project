import time
import pyttsx3
from twilio.rest import Client
from .database import get_last_session_time
from .config import INACTIVITY_HOURS, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER, FAMILY_PHONE_NUMBER

def check_inactivity():
    last_time = get_last_session_time()
    
    # If there's no session at all, we might skip or warn. Let's assume warning if no session in 24h
    current_time = time.time()
    
    # Check if > 24 hours (24 * 3600 seconds)
    if last_time is None or (current_time - last_time) > (INACTIVITY_HOURS * 3600):
        trigger_voice_alert()
        trigger_sms_alert()

def trigger_voice_alert():
    try:
        engine = pyttsx3.init()
        engine.setProperty('rate', 130)  # Slower for elderly
        engine.say("Hello. It's time for your daily exercise. Please start your yoga session to keep your muscles strong.")
        engine.runAndWait()
    except Exception as e:
        print(f"Voice alert failed: {e}")

def trigger_sms_alert():
    default_msg = (
        "SilverFit Alert: The user hasn't completed their daily exercise in over 24 hours. "
        "Please remind them to stay active!"
    )
    send_sms_message(default_msg)


def send_sms_message(body):
    try:
        if "your_account_sid" in TWILIO_ACCOUNT_SID:
            print("Twilio not configured, skipping SMS alert.")
            return

        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            body=body,
            from_=TWILIO_FROM_NUMBER,
            to=FAMILY_PHONE_NUMBER,
        )
        print(f"SMS Alert sent: {message.sid}")
    except Exception as e:
        print(f"SMS alert failed: {e}")
