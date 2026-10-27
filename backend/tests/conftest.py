import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.dependencies import get_db
from app.db.base import Base
from app.main import app

os.environ["DATABASE_URL"] = "sqlite:///./test_backend.db"

engine = create_engine("sqlite:///./test_backend.db", connect_args={"check_same_thread": False}, future=True)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def reset_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


@pytest.fixture()
def client():
    with TestClient(app) as client:
        yield client


@pytest.fixture()
def auth_headers(client):
    response = client.post("/api/v1/auth/register", json={"email": "user@example.com", "username": "demo-user", "password": "secretpass123"})
    assert response.status_code == 201, response.text
    token = client.post("/api/v1/auth/login", json={"username": "demo-user", "password": "secretpass123"}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
