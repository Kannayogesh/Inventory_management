import smtplib
from email.message import EmailMessage
from app.core.config import settings

def send_email_background_task(title: str, body: str, recipient: str):
    """
    Sends an email notification via a background task so it does not block the API
    Configured via SMTP settings in the project (.env)
    """
    if not settings.SMTP_SERVER or not settings.SMTP_USER:
        print(f"SMTP not configured, skipping email to {recipient}: {title}")
        return

    try:
        msg = EmailMessage()
        msg.set_content(body)
        msg['Subject'] = title
        msg['From'] = settings.SMTP_USER
        msg['To'] = recipient

        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
            print(f"Email sent successfully to {recipient}")
    except Exception as e:
        print(f"Failed to send email to {recipient}: {str(e)}")
