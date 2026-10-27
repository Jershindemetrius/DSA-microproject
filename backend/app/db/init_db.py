from app.db.base import Base
from app.db.session import engine


def init_db() -> None:
    from app.models.alert import Alert  # noqa: F401
    from app.models.detection_rule import DetectionRule  # noqa: F401
    from app.models.log_entry import LogEntry  # noqa: F401
    from app.models.user import User  # noqa: F401

    Base.metadata.create_all(bind=engine)
