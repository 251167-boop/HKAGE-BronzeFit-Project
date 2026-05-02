from src.database import init_db
from src.inactivity_monitor import check_inactivity
from src.ui import start_app

def main():
    # 1. Initialize local Database
    init_db()

    # 2. Phase 1: Check inactivity before UI starts (safer for TTS on macOS)
    check_inactivity()

    # 3. Phase 2: Start the Application UI (This will block until the app is closed)
    start_app()

if __name__ == "__main__":
    main()
