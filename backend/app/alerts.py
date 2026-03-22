"""Email alerting service for service/device status changes."""

import asyncio
import logging
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from os import getenv
from typing import List, Optional

import aiosmtplib

logger = logging.getLogger(__name__)

# SMTP Configuration from environment
SMTP_HOST = getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(getenv("SMTP_PORT", "587"))
SMTP_USER = getenv("SMTP_USER")
SMTP_PASS = getenv("SMTP_PASS")
SMTP_FROM_EMAIL = getenv("SMTP_FROM_EMAIL")
ADMIN_EMAIL = getenv("ADMIN_EMAIL")
PUBLIC_DASHBOARD_URL = getenv("PUBLIC_DASHBOARD_URL", "http://localhost:3000/public")

# Max retry attempts for transient SMTP failures
MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 2


def validate_smtp_config() -> dict:
    """
    Validate SMTP configuration at startup.

    Returns:
        Dictionary with 'configured' bool and list of 'missing' env vars
    """
    required = {
        "SMTP_HOST": SMTP_HOST,
        "SMTP_PORT": SMTP_PORT,
        "SMTP_USER": SMTP_USER,
        "SMTP_PASS": SMTP_PASS,
        "SMTP_FROM_EMAIL": SMTP_FROM_EMAIL,
    }
    missing = [k for k, v in required.items() if not v]

    if missing:
        logger.warning(
            f"SMTP not fully configured — missing env vars: {', '.join(missing)}. "
            "Email alerts will be disabled until these are set."
        )
        return {"configured": False, "missing": missing}

    logger.info(
        f"SMTP configured: host={SMTP_HOST}, port={SMTP_PORT}, "
        f"user={SMTP_USER}, from={SMTP_FROM_EMAIL}"
    )
    return {"configured": True, "missing": []}


# Run validation on module import so it logs at startup
_smtp_status = validate_smtp_config()


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
    Send alert email to recipient with retry logic.

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
    if not _smtp_status["configured"]:
        logger.warning(
            f"Skipping email to {recipient} — SMTP not configured "
            f"(missing: {', '.join(_smtp_status['missing'])})"
        )
        return False

    subject, html_body = create_alert_email(
        service_name, status, timestamp, service_id, error_message
    )

    # Create email message
    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = SMTP_FROM_EMAIL
    message["To"] = recipient

    html_part = MIMEText(html_body, "html")
    message.attach(html_part)

    last_exception = None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            logger.info(
                f"Sending alert email to {recipient} "
                f"(attempt {attempt}/{MAX_RETRIES}): {service_name} {status}"
            )

            # Use start_tls=True for port 587 (STARTTLS), use_tls=True for port 465 (SSL)
            use_tls = SMTP_PORT == 465
            start_tls = SMTP_PORT == 587

            async with aiosmtplib.SMTP(
                hostname=SMTP_HOST,
                port=SMTP_PORT,
                use_tls=use_tls,
                start_tls=start_tls,
                timeout=30,
            ) as smtp:
                await smtp.login(SMTP_USER, SMTP_PASS)
                await smtp.send_message(message)

            logger.info(
                f"✅ Alert email sent successfully to {recipient}: "
                f"{service_name} {status} (attempt {attempt})"
            )
            return True

        except aiosmtplib.SMTPAuthenticationError as e:
            logger.error(
                f"❌ SMTP authentication failed for {recipient}: {e}. "
                "Check SMTP_USER/SMTP_PASS credentials. Not retrying."
            )
            return False

        except (aiosmtplib.SMTPConnectError, aiosmtplib.SMTPConnectTimeoutError) as e:
            last_exception = e
            logger.warning(
                f"⚠️ SMTP connection error on attempt {attempt}/{MAX_RETRIES} "
                f"to {recipient}: {e}"
            )

        except aiosmtplib.SMTPException as e:
            last_exception = e
            logger.warning(
                f"⚠️ SMTP error on attempt {attempt}/{MAX_RETRIES} "
                f"to {recipient}: {e}"
            )

        except Exception as e:
            last_exception = e
            logger.error(
                f"❌ Unexpected error sending email to {recipient} "
                f"on attempt {attempt}/{MAX_RETRIES}: {type(e).__name__}: {e}"
            )

        # Wait before retrying (except on last attempt)
        if attempt < MAX_RETRIES:
            delay = RETRY_DELAY_SECONDS * attempt
            logger.info(f"Retrying in {delay}s...")
            await asyncio.sleep(delay)

    logger.error(
        f"❌ Failed to send alert email to {recipient} after {MAX_RETRIES} attempts. "
        f"Last error: {last_exception}"
    )
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

    # Log individual results and count successes
    successful = 0
    for recipient, result in zip(recipients, results):
        if isinstance(result, Exception):
            logger.error(
                f"❌ Unhandled exception sending alert to {recipient}: "
                f"{type(result).__name__}: {result}"
            )
        elif result is True:
            successful += 1
        else:
            logger.warning(f"⚠️ Alert to {recipient} returned failure (result={result})")

    logger.info(
        f"Alert dispatch complete for {service_name}: "
        f"{successful}/{len(recipients)} sent successfully"
    )
    return successful
