from sqlalchemy import inspect, text

from app.db.base import Base
from app.db.session import engine


def ensure_owner_columns(bind=engine) -> None:
    inspector = inspect(bind)
    for table_name in ("log_entries", "alerts", "detection_rules"):
        columns = {column["name"] for column in inspector.get_columns(table_name)}
        if "owner_id" not in columns:
            with bind.begin() as connection:
                connection.execute(
                    text(f"ALTER TABLE {table_name} ADD COLUMN owner_id INTEGER REFERENCES users(id)")
                )
        with bind.begin() as connection:
            connection.execute(
                text(f"CREATE INDEX IF NOT EXISTS ix_{table_name}_owner_id ON {table_name}(owner_id)")
            )
        inspector = inspect(bind)

    rule_indexes = inspect(bind).get_indexes("detection_rules")
    legacy_name_index = next(
        (
            index
            for index in rule_indexes
            if index.get("unique") and index.get("column_names") == ["name"]
        ),
        None,
    )
    if legacy_name_index:
        quoted_index_name = bind.dialect.identifier_preparer.quote(legacy_name_index["name"])
        with bind.begin() as connection:
            connection.execute(text(f"DROP INDEX {quoted_index_name}"))
            connection.execute(text("CREATE INDEX IF NOT EXISTS ix_detection_rules_name ON detection_rules(name)"))
    inspector = inspect(bind)
    owner_name_constraint = any(
        constraint.get("column_names") == ["owner_id", "name"]
        for constraint in inspector.get_unique_constraints("detection_rules")
    )
    owner_name_index = any(
        index.get("unique") and index.get("column_names") == ["owner_id", "name"]
        for index in inspector.get_indexes("detection_rules")
    )
    if not owner_name_constraint and not owner_name_index:
        with bind.begin() as connection:
            connection.execute(
                text("CREATE UNIQUE INDEX IF NOT EXISTS uq_detection_rules_owner_name ON detection_rules(owner_id, name)")
            )


def init_db() -> None:
    from app.models.alert import Alert  # noqa: F401
    from app.models.detection_rule import DetectionRule  # noqa: F401
    from app.models.log_entry import LogEntry  # noqa: F401
    from app.models.user import User  # noqa: F401

    Base.metadata.create_all(bind=engine)
    ensure_owner_columns(engine)
