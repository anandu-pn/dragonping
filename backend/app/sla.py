from app.config import SLA_ENABLED
from app.models import Service, Check
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

def calculate_sla(service: Service, db: Session,
                  days: int = 30) -> dict | None:
    """
    Returns SLA compliance dict or None if:
    - SLA feature is disabled globally
    - Service has no SLA targets set
    """
    if not SLA_ENABLED:
        return None
    if service.sla_uptime_target is None \
            and service.sla_response_target is None:
        return None

    since = datetime.utcnow() - timedelta(days=days)
    checks = db.query(Check).filter(
        Check.service_id == service.id,
        Check.checked_at >= since
    ).all()

    if len(checks) < 10:
        return {"error": "insufficient data", "checks": len(checks)}

    total = len(checks)
    up = sum(1 for c in checks if c.status == "UP")
    uptime_pct = round((up / total) * 100, 2)

    response_times = [c.response_time_ms for c in checks
                      if c.response_time_ms is not None]
    avg_response = round(
        sum(response_times) / len(response_times), 1
    ) if response_times else None

    uptime_ok = None
    if service.sla_uptime_target is not None:
        uptime_ok = uptime_pct >= service.sla_uptime_target

    response_ok = None
    if service.sla_response_target is not None and avg_response:
        response_ok = avg_response <= service.sla_response_target

    breaching = (uptime_ok is False) or (response_ok is False)

    return {
        "enabled": True,
        "period_days": days,
        "uptime_pct": uptime_pct,
        "uptime_target": service.sla_uptime_target,
        "uptime_ok": uptime_ok,
        "avg_response_ms": avg_response,
        "response_target": service.sla_response_target,
        "response_ok": response_ok,
        "breaching": breaching,
        "total_checks": total
    }
