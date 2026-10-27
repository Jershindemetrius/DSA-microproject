import json
import re
from datetime import datetime
from typing import Any, Iterable

from fastapi import UploadFile


ALLOWED_EXTENSIONS = {".json", ".jsonl", ".ndjson", ".log"}
SSH_RE = re.compile(r"(?P<host>\S+)?\s*(?:sshd\[\d+\]:\s*)?(?P<action>Failed|Accepted|Invalid|session|error)\s*(?:password|publickey|keyboard-interactive/pam)?\s*(?:for\s*(?:invalid user\s*)?(?P<user>\S+)\s*)?(?:from\s*(?P<src_ip>\d+\.\d+\.\d+\.\d+)\s*)?(?:port\s*(?P<port>\d+))?", re.IGNORECASE)


def _normalize_timestamp(value: Any) -> datetime | None:
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        text = value.strip()
        for fmt in ("%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S"):
            try:
                return datetime.strptime(text.replace("Z", "+00:00"), "%Y-%m-%dT%H:%M:%S%z") if "%z" in fmt else datetime.strptime(text, fmt)
            except ValueError:
                continue
    return None


def parse_log_object(payload: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise ValueError("Each log record must be a JSON object.")
    timestamp = _normalize_timestamp(payload.get("timestamp") or payload.get("time") or payload.get("datetime"))
    if timestamp is None:
        raise ValueError("Missing or invalid timestamp.")
    message = payload.get("message") or payload.get("msg") or payload.get("event") or ""
    if not isinstance(message, str) or not message.strip():
        raise ValueError("Missing message string.")
    event_type = str(payload.get("event_type") or payload.get("type") or "info")
    severity = str(payload.get("severity") or payload.get("level") or "info")
    metadata = payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {}
    record = {
        "timestamp": timestamp,
        "source_ip": payload.get("source_ip") or payload.get("src_ip") or payload.get("ip"),
        "destination_ip": payload.get("destination_ip") or payload.get("dst_ip"),
        "username": payload.get("username") or payload.get("user"),
        "event_type": event_type,
        "severity": severity,
        "message": message,
        "auth_result": payload.get("auth_result") or payload.get("result"),
        "source_host": payload.get("source_host") or payload.get("host"),
        "metadata": metadata,
        "raw_content": json.dumps(payload, sort_keys=True),
    }
    return record


def parse_text_log_line(line: str) -> dict[str, Any]:
    text = line.strip()
    if not text:
        raise ValueError("empty line")
    timestamp = _normalize_timestamp(text.split()[0])
    if timestamp is None:
        timestamp = datetime.utcnow()
    result = {
        "timestamp": timestamp,
        "source_ip": None,
        "destination_ip": None,
        "username": None,
        "event_type": "security",
        "severity": "info",
        "message": text,
        "auth_result": None,
        "source_host": None,
        "metadata": {},
        "raw_content": text,
    }
    match = SSH_RE.search(text)
    if match:
        result["source_ip"] = match.group("src_ip")
        result["username"] = match.group("user")
        action = (match.group("action") or "").lower()
        if "failed" in action:
            result["event_type"] = "failed_login"
            result["severity"] = "high"
            result["auth_result"] = "failed"
        elif "accepted" in action:
            result["event_type"] = "successful_login"
            result["severity"] = "info"
            result["auth_result"] = "success"
        elif "invalid" in action:
            result["event_type"] = "invalid_login"
            result["severity"] = "medium"
            result["auth_result"] = "invalid"
    if "failed password" in text.lower():
        result["event_type"] = "failed_login"
        result["severity"] = "high"
        result["auth_result"] = "failed"
    if "accepted password" in text.lower():
        result["event_type"] = "successful_login"
        result["severity"] = "info"
        result["auth_result"] = "success"
    if "authentication failure" in text.lower() and "invalid user" in text.lower():
        result["event_type"] = "failed_login"
        result["severity"] = "high"
        result["auth_result"] = "failed"
    return result


def parse_upload_content(filename: str, content: bytes, max_records: int = 5000, max_line_length: int = 20000) -> tuple[list[dict[str, Any]], int, int, list[str]]:
    ext = "." + filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Unsupported file type: {filename}")
    text = content.decode("utf-8", errors="strict")
    records: list[dict[str, Any]] = []
    valid = 0
    rejected = 0
    errors: list[str] = []
    for idx, raw_line in enumerate(text.splitlines(), start=1):
        if not raw_line.strip():
            continue
        if len(raw_line) > max_line_length:
            rejected += 1
            errors.append(f"Line {idx}: record exceeds maximum allowed line length")
            continue
        try:
            if ext in {".jsonl", ".ndjson"}:
                payload = json.loads(raw_line)
                record = parse_log_object(payload)
            elif ext == ".json":
                payload = json.loads(text)
                if isinstance(payload, list):
                    for item in payload:
                        if len(records) >= max_records:
                            break
                        try:
                            records.append(parse_log_object(item))
                        except ValueError as exc:
                            rejected += 1
                            errors.append(f"JSON record: {exc}")
                    return records, valid, rejected, errors
                record = parse_log_object(payload)
            else:
                record = parse_text_log_line(raw_line)
            records.append(record)
            valid += 1
            if valid >= max_records:
                break
        except (json.JSONDecodeError, ValueError, TypeError) as exc:
            rejected += 1
            errors.append(f"Line {idx}: {exc}")
    if ext == ".json" and isinstance(json.loads(text), list):
        return records, valid, rejected, errors
    return records, valid, rejected, errors


def parse_upload_file(upload: UploadFile, max_records: int = 5000) -> tuple[list[dict[str, Any]], int, int, list[str]]:
    content = upload.file.read()
    filename = upload.filename or "upload.log"
    if not filename:
        raise ValueError("Uploaded file is missing a filename.")
    return parse_upload_content(filename, content, max_records=max_records)
