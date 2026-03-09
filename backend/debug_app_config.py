import sys
import os

# Add the current directory to sys.path so we can import 'app'
sys.path.append(os.getcwd())

try:
    from app.core.config import settings
    print(f"APP_SETTINGS_SERVER: {settings.SMTP_SERVER}")
    print(f"APP_SETTINGS_USER: {settings.SMTP_USER}")
    
    from app.services.email_service import send_email_background_task
    # We won't actually send, just see if it passes the config check
    # But wait, send_email_background_task will try to send if config is present.
    # Let's just check the settings object.
    
except Exception as e:
    print(f"ERR: {e}")
    import traceback
    traceback.print_exc()
