from collections import defaultdict
from datetime import datetime
from typing import Any

from app.dsa.frequency_counter import FrequencyCounter
from app.dsa.graph_analysis import GraphAnalyzer
from app.dsa.sliding_window import SlidingWindowCounter
from app.dsa.suspicious_ip_tracker import SuspiciousIPTracker
from app.dsa.top_k_anomalies import TopKAnomalies


def detect_threats(logs: list[dict[str, Any]], failed_attempt_threshold: int = 3, sliding_window_seconds: int = 300, suspicious_pattern: str | None = None) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    failed_ip_counter = FrequencyCounter()
    failed_username_counter = FrequencyCounter()
    sliding_ip_counter = SlidingWindowCounter(sliding_window_seconds)
    suspicious_ips = SuspiciousIPTracker()
    top_k = TopKAnomalies(5)
    graph = GraphAnalyzer()
    graph_inputs: list[tuple[str, list[str]]] = []

    alerts: list[dict[str, Any]] = []
    seen_alerts: set[str] = set()
    for record in logs:
        source_ip = record.get("source_ip")
        username = record.get("username")
        event_type = str(record.get("event_type") or "info")
        message = str(record.get("message") or "")
        if event_type == "failed_login" and source_ip:
            failed_ip_counter.add(source_ip)
            sliding_ip_counter.add_event(source_ip, record["timestamp"])
            if failure_count := failed_ip_counter.get(source_ip):
                top_k.push(source_ip, float(failure_count), {"count": failure_count, "window_seconds": sliding_window_seconds})
                if failure_count >= failed_attempt_threshold:
                    suspicious_ips.add(source_ip)
                    alert_key = f"repeated_failures_ip:{source_ip}"
                    if alert_key not in seen_alerts:
                        alerts.append({
                            "title": "Repeated failed login attempts from a single IP",
                            "description": f"IP {source_ip} generated {failure_count} failed login attempts within the configured analysis window.",
                            "severity": "high",
                            "confidence": min(0.95, 0.45 + (failure_count * 0.12)),
                            "source_ip": source_ip,
                            "username": username,
                            "detection_type": "repeated_failed_logins_ip",
                            "rule_name": "failed_login_threshold",
                            "status": "open",
                            "related_log_ids": [record.get("id")],
                            "recommended_action": "Review firewall or IAM controls for the source IP and consider rate-limiting or blocking if the activity is unauthorized.",
                        })
                        seen_alerts.add(alert_key)
        if event_type == "failed_login" and username:
            failed_username_counter.add(username)
            if failure_count := failed_username_counter.get(username):
                if failure_count >= failed_attempt_threshold:
                    alert_key = f"repeated_failures_user:{username}"
                    if alert_key not in seen_alerts:
                        alerts.append({
                            "title": "Repeated failed logins against a single account",
                            "description": f"User '{username}' received {failure_count} failed login attempts in the analysis window.",
                            "severity": "medium",
                            "confidence": min(0.9, 0.5 + (failure_count * 0.1)),
                            "source_ip": source_ip,
                            "username": username,
                            "detection_type": "repeated_failed_logins_user",
                            "rule_name": "account_targeting",
                            "status": "open",
                            "recommended_action": "Verify whether the account is under attack and instruct the user to reset credentials or enable MFA.",
                        })
                        seen_alerts.add(alert_key)
        if event_type == "successful_login" and source_ip:
            prior_failures = failed_ip_counter.get(source_ip)
            if prior_failures >= failed_attempt_threshold:
                alert_key = f"success_after_failures:{source_ip}:{username}"
                if alert_key not in seen_alerts:
                    alerts.append({
                        "title": "Successful login following repeated failures",
                        "description": f"A successful login from {source_ip} followed {prior_failures} prior failures, which may indicate password guessing or session takeover.",
                        "severity": "high",
                        "confidence": 0.86,
                        "source_ip": source_ip,
                        "username": username,
                        "detection_type": "success_after_failures",
                        "rule_name": "post_failure_success",
                        "status": "open",
                        "recommended_action": "Review the account for unusual activity, verify the user, and inspect session logs for suspicious access.",
                    })
                    seen_alerts.add(alert_key)
        if source_ip and username:
            graph_inputs.append((source_ip, [username]))
        if suspicious_pattern and suspicious_pattern.lower() in message.lower():
            alert_key = f"pattern_match:{source_ip or 'unknown'}:{username or 'unknown'}"
            if alert_key not in seen_alerts:
                alerts.append({
                    "title": "Event matched suspicious pattern",
                    "description": f"Message matched configured suspicious pattern '{suspicious_pattern}'.",
                    "severity": "medium",
                    "confidence": 0.7,
                    "source_ip": source_ip,
                    "username": username,
                    "detection_type": "pattern_match",
                    "rule_name": "suspicious_pattern",
                    "status": "open",
                    "recommended_action": "Inspect the associated logs and validate whether the pattern reflects a targeted intrusion attempt.",
                })
                seen_alerts.add(alert_key)
        if event_type in {"security", "error"} and not source_ip and not username:
            alert_key = f"malformed_event:{record.get('id') or record.get('timestamp') }"
            if alert_key not in seen_alerts:
                alerts.append({
                    "title": "Malformed or anomalous event",
                    "description": "An event lacked clear identity data and deserves investigation as a malformed or suspicious event.",
                    "severity": "medium",
                    "confidence": 0.55,
                    "source_ip": source_ip,
                    "username": username,
                    "detection_type": "malformed_event",
                    "rule_name": "anomaly_review",
                    "status": "open",
                    "recommended_action": "Inspect the raw event payload and confirm whether it was generated by a trusted source.",
                })
                seen_alerts.add(alert_key)

    related_components = graph.correlate(graph_inputs)
    suspicious_ips_list = suspicious_ips.all()
    algorithm_summary = {
        "failed_login_frequency_by_ip": failed_ip_counter.as_dict(),
        "failed_login_frequency_by_username": failed_username_counter.as_dict(),
        "window_count_by_ip": sliding_ip_counter.snapshot(),
        "suspicious_ips": suspicious_ips_list,
        "top_k_suspicious_entities": top_k.top(),
        "correlated_components": related_components,
    }
    return alerts, algorithm_summary
