from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRegisterRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    email: EmailStr
    username: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=8)


class UserLoginRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    username: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=8)


class TokenResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    username: str
    is_active: bool = True
