"""Request/response shapes for auth. Pydantic validates input and filters output,
so a password hash can never leak into a response."""

import uuid

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.core.security import MAX_PASSWORD_BYTES


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str = Field(min_length=1, max_length=120)

    @field_validator("password")
    @classmethod
    def fits_bcrypt(cls, value: str) -> str:
        # Bytes, not characters: bcrypt's 72 limit is on the UTF-8 encoding (an emoji is 4).
        if len(value.encode()) > MAX_PASSWORD_BYTES:
            raise ValueError(f"Password is too long (max {MAX_PASSWORD_BYTES} bytes)")
        return value


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=20, max_length=200)
    password: str = Field(min_length=8)

    @field_validator("password")
    @classmethod
    def fits_bcrypt(cls, value: str) -> str:
        if len(value.encode()) > MAX_PASSWORD_BYTES:
            raise ValueError(f"Password is too long (max {MAX_PASSWORD_BYTES} bytes)")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(max_length=256)  # longer can't be a real password; skip the work


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)  # build from an ORM object

    id: uuid.UUID
    email: EmailStr
    name: str
