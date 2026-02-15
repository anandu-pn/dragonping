"""Email alerting service for service/device status changes."""

import logging
import asyncio
from typing import List, Optional
from datetime import datetime, timezone
from os import getenv
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)

# SMTP Configuration from environment
SMTP_HOST = getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(getenv("SMTP_PORT", "587"))
SMTP_USER = getenv("SMTP_USER")
SMTP_PASS = getenv("SMTP_PASS")
SMTP_FROM_EMAIL = getenv("SMTP_FROM_EMAIL")
ADMIN_EMAIL = getenv("ADMIN_EMAIL")
PUBLIC_DASHBOARD_URL = getenv("PUBLIC_DASHBOARD_URL", "http://localhost:3000/public")


def create_alert_email(
    service_name: str,
    status: str,
    timestamp: datetime,
    service_id: int,
    error_message: Optional[str] = None,
) -> tuple:
    """
    Create alert email message.

    Args:
        service_name: Name of the service/device
        status: Status ("DOWN" or "UP")
        timestamp: When the event occurred
        service_id: Service ID for dashboard link
        error_message: Error details if service is down

    Returns:
        Tuple of (subject, html_body)
    """
    status_emoji = "🔴" if status == "DOWN" else "🟢"
    status_text = "is DOWN" if status == "DOWN" else "is UP"

    subject = f"{status_emoji} Alert: {service_name} {status_text}"

    dashboard_link = f"{PUBLIC_DASHBOARD_URL}?service_id={service_id}"

    error_details = ""
    if error_message and status == "DOWN":
        error_details = f"""
        <p><strong>Error Details:</strong></p>
        <pre style="background-color: #f5f5f5; padding: 10px; border-radius: 5px;">{error_message}</pre>
        """

    html_body = f"""
    <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: {'#dc3545' if status == 'DOWN' else '#28a745'}; color: white; padding: 20px; border-radius: 5px; }}
                .content {{ padding: 20px; }}
                .footer {{ color: #666; font-size: 12px; padding-top: 20px; border-top: 1px solid #ddd; }}
                .button {{ display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>{status_emoji} Service Alert</h2>
                    <p><strong>{service_name}</strong> {status_text}</p>
                </div>
                <div class="content">
                    <p><strong>Service:</strong> {service_name}</p>
                    <p><strong>Status:</strong> {status}</p>
                    <p><strong>Timestamp:</strong> {timestamp.strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
                    {error_details}
                    <p style="margin-top: 20px;">
                        <a href="{dashboard_link}" class="button">View Details</a>
                    </p>
                </div>
                <div class="footer">
                    <p>DragonPing Uptime Monitoring System</p>
                    <p>This is an automated alert from your monitoring system.</p>
                </div>
            </div>
        </body>
    </html>
    """

    return subject, html_body


async def send_alert_email(
    recipient: str,
    service_name: str,
    status: str,
    timestamp: datetime,
    service_id: int,
    error_message: Optional[str] = None,
) -> bool:
    """
    Send alert email to recipient.

    Args:
        recipient: Email address to send to
        service_name: Name of the service/device
        status: Status ("DOWN" or "UP")
        timestamp: When the event occurred
        service_id: Service ID for dashboard link
        error_message: Error details if service is down

    Returns:
        True if sent successfully, False otherwise
    """
    if not SMTP_USER or not SMTP_PASS or not SMTP_FROM_EMAIL:
        logger.warning("SMTP not configured, skipping email alert")
        return False

    try:
        subject, html_body = create_alert_email(
            service_name, status, timestamp, service_id, error_message
        )

        # Create email message
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = SMTP_FROM_EMAIL
        message["To"] = recipient

        # Attach HTML body
        html_part = MIMEText(html_body, "html")
        message.attach(html_part)

        # Send via SMTP
        async with aiosmtplib.SMTP(hostname=SMTP_HOST, port=SMTP_PORT) as smtp:
            await smtp.login(SMTP_USER, SMTP_PASS)
            await smtp.send_message(message)

        logger.info(f"Alert email sent to {recipient}: {service_name} {status}")
        return True

    except Exception as e:
        logger.error(f"Failed to send alert email to {recipient}: {str(e)}")
        return False


async def send_alerts(
    service_name: str,
    status: str,
    service_id: int,
    recipients: List[str],
    error_message: Optional[str] = None,
) -> int:
    """
    Send alerts to multiple recipients.

    Args:
        service_name: Name of the service/device
        status: Status ("DOWN" or "UP")
        service_id: Service ID
        recipients: List of email addresses
        error_message: Error details if service is down

    Returns:
        Number of successfully sent emails
    """
    if not recipients:
        logger.debug(f"No recipients for alert on {service_name}")
        return 0

    timestamp = datetime.now(timezone.utc)
    tasks = [
        send_alert_email(recipient, service_name, status, timestamp, service_id, error_message)
        for recipient in recipients
    ]

    results = await asyncio.gather(*tasks, return_exceptions=True)
    successful = sum(1 for r in results if r is True)

    logger.info(f"Alert complete: {successful}/{len(recipients)} sent for {service_name}")
    return successful
