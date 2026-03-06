"""
Run this script to test email sending directly:
  cd backend
  python test_email.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.core.config import settings
from app.services.email_service import send_email_background_task

print("=== Email Test ===")
print(f"SMTP_SERVER  : {settings.SMTP_SERVER}")
print(f"SMTP_PORT    : {settings.SMTP_PORT}")
print(f"SMTP_USER    : {settings.SMTP_USER}")
print(f"SMTP_PASSWORD: {'*' * len(settings.SMTP_PASSWORD.replace(' ','')) if settings.SMTP_PASSWORD else 'NOT SET'}")

TEST_RECIPIENT = settings.SMTP_USER   # send to self for testing

print(f"\nSending test email to: {TEST_RECIPIENT}")
send_email_background_task(
    title="PAL Inventory System - Email Test",
    body="This is a test email from the PAL Inventory System email service. If you received this, SMTP is working correctly!",
    recipient=TEST_RECIPIENT
)
print("Done.")
