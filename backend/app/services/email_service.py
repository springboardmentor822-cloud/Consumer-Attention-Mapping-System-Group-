"""
Minimal email service.

By default this just logs the message — there's no SMTP server configured
in this environment. To send real emails in production, set SMTP_HOST /
SMTP_USER / SMTP_PASSWORD in .env and swap the body of `send_email` for a
real smtplib/boto3-SES call.
"""
import logging

from app.core.config import settings

logger = logging.getLogger("email_service")


def send_email(to: str, subject: str, body: str) -> None:
    if not settings.SMTP_HOST:
        logger.info("[EMAIL STUB] To: %s | Subject: %s | Body: %s", to, subject, body)
        return
    # Example real implementation (uncomment and configure):
    #
    # import smtplib
    # from email.mime.text import MIMEText
    # msg = MIMEText(body)
    # msg["Subject"] = subject
    # msg["From"] = settings.EMAIL_FROM
    # msg["To"] = to
    # with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
    #     server.starttls()
    #     server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
    #     server.sendmail(settings.EMAIL_FROM, [to], msg.as_string())
    raise NotImplementedError("Configure a real SMTP/SES client for production use.")


def send_verification_email(to: str, token: str) -> None:
    send_email(
        to=to,
        subject="Verify your Consumer Attention Mapping account",
        body=f"Your email verification token is: {token}",
    )


def send_password_reset_email(to: str, token: str) -> None:
    send_email(
        to=to,
        subject="Password reset requested",
        body=f"Your password reset token is: {token}",
    )
