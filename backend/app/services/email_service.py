import smtplib
from email.message import EmailMessage
from app.core.config import settings

def send_email_background_task(title: str, body: str, recipient: str):
    """
    Sends an email notification via a background task so it does not block the API
    Configured via SMTP settings in the project (.env)
    """
    print(f"Attempting to send email to {recipient} with title: {title}")
    if not settings.SMTP_SERVER or not settings.SMTP_USER:
        print(f"DEBUG: SMTP_SERVER={settings.SMTP_SERVER}, SMTP_USER={settings.SMTP_USER}")
        print(f"SMTP not configured, skipping email to {recipient}: {title}")
        return

    try:
        msg = EmailMessage()
        msg.set_content(body)
        msg['Subject'] = title
        msg['From'] = settings.SMTP_USER
        msg['To'] = recipient

        print(f"Connecting to {settings.SMTP_SERVER}:{settings.SMTP_PORT}...")
        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
            print("Starting TLS...")
            server.starttls()
            # Strip any accidental spaces from the password
            pwd = settings.SMTP_PASSWORD.replace(" ", "") if settings.SMTP_PASSWORD else ""
            print(f"Logging in as {settings.SMTP_USER}...")
            server.login(settings.SMTP_USER, pwd)
            print("Sending message...")
            server.send_message(msg)
            print(f"Email sent successfully to {recipient}")
    except Exception as e:
        print(f"CRITICAL ERROR sending email to {recipient}: {str(e)}")
        import traceback
        traceback.print_exc()
