"""Encryption for secrets we must be able to use again, such as a user's own Groq API key.

Passwords are HASHED (one-way): we only ever need to check them. An API key is different:
the server has to send the real key to Groq on the user's behalf, so it must be ENCRYPTED
(two-way) and decrypted only for the moment it's used.

Choices, and why:
- AES-256-GCM (authenticated encryption, `cryptography` library). Authenticated means a
  tampered ciphertext fails to decrypt instead of producing garbage.
- A fresh random 12-byte nonce per encryption: the same key saved twice gives different
  ciphertexts, so equal keys can't be spotted in the database.
- The user's id is bound in as "associated data": a ciphertext copied onto ANOTHER user's
  row fails to decrypt. A database leak or a buggy query can't move one person's key to
  another account.
- The encryption key (KEY_ENCRYPTION_KEY) lives in the environment, never in the database.
  A database dump alone (backup, leak) reveals nothing usable. It's separate from SECRET_KEY
  (which signs login tokens) so either can be rotated without the other.

Stored format: "v1:" + base64(nonce + ciphertext). The version prefix leaves room to change
the scheme later without guessing how old rows were written.
"""

import base64
import os
import uuid
from functools import lru_cache

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

from app.core.config import settings

VERSION = "v1"
NONCE_BYTES = 12  # the standard GCM nonce size


class DecryptionError(Exception):
    """Wrong encryption key, tampered data, or a ciphertext from another user's row."""


@lru_cache
def _aesgcm() -> AESGCM:
    if settings.key_encryption_key:
        key = base64.urlsafe_b64decode(settings.key_encryption_key)
        if len(key) != 32:
            raise ValueError("KEY_ENCRYPTION_KEY must be 32 bytes, base64-encoded")
    else:
        # Development only (production refuses to start without KEY_ENCRYPTION_KEY, see
        # config.py): derive a stable key from SECRET_KEY so saved keys survive restarts.
        key = HKDF(algorithm=hashes.SHA256(), length=32, salt=None,
                   info=b"crackit dev key-encryption key").derive(settings.secret_key.encode())
    return AESGCM(key)


def _context(user_id: uuid.UUID) -> bytes:
    return b"crackit:groq-key:" + user_id.bytes


def encrypt_secret(plaintext: str, user_id: uuid.UUID) -> str:
    nonce = os.urandom(NONCE_BYTES)
    ciphertext = _aesgcm().encrypt(nonce, plaintext.encode(), _context(user_id))
    return f"{VERSION}:" + base64.urlsafe_b64encode(nonce + ciphertext).decode()


def decrypt_secret(token: str, user_id: uuid.UUID) -> str:
    try:
        version, payload = token.split(":", 1)
        if version != VERSION:
            raise DecryptionError(f"Unknown format {version!r}")
        raw = base64.urlsafe_b64decode(payload)
        return _aesgcm().decrypt(raw[:NONCE_BYTES], raw[NONCE_BYTES:], _context(user_id)).decode()
    except (ValueError, InvalidTag) as exc:
        raise DecryptionError("Could not decrypt the stored secret") from exc


def new_key_encryption_key() -> str:
    """A fresh KEY_ENCRYPTION_KEY for .env:
    uv run python -c "from app.core.crypto import new_key_encryption_key as k; print(k())"
    """
    return base64.urlsafe_b64encode(os.urandom(32)).decode()
