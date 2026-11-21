"""Outgoing email over plain SMTP (any provider: Brevo, Mailjet, Resend, Amazon SES, ...).

Only used for password reset. Python's own smtplib, in a worker thread (it blocks).
Not configured: in development the message is written to the server log (so the reset flow
can be tried locally); in production EmailNotConfigured is raised, and the caller answers 503.
"""

import asyncio
import logging
import smtplib
import ssl
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailNotConfigured(Exception):
    pass


def configured() -> bool:
    return bool(settings.smtp_host and settings.mail_from)


def _send_sync(message: EmailMessage) -> None:
    context = ssl.create_default_context()
    if settings.smtp_port == 465:  # TLS from the first byte
        with smtplib.SMTP_SSL(settings.smtp_host, 465, context=context, timeout=20) as smtp:
            if settings.smtp_user:
                smtp.login(settings.smtp_user, settings.smtp_password)
            smtp.send_message(message)
        return
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as smtp:
        smtp.starttls(context=context)  # never send credentials or links unencrypted
        if settings.smtp_user:
            smtp.login(settings.smtp_user, settings.smtp_password)
        smtp.send_message(message)


async def send(to: str, subject: str, text: str, html: str | None = None) -> None:
    if not configured():
        if settings.is_production:
            raise EmailNotConfigured("SMTP_HOST / MAIL_FROM are not set")
        # Development only: the message (with any link) goes to the log instead.
        logger.warning("Email not configured; would send to %s:\n%s\n%s", to, subject, text)
        return
    message = EmailMessage()
    message["From"], message["To"], message["Subject"] = settings.mail_from, to, subject
    message.set_content(text)
    if html:
        message.add_alternative(html, subtype="html")
    await asyncio.to_thread(_send_sync, message)
