"""Predictive downtime detection engine.

Uses three methods to assess risk of imminent downtime:
1. Threshold rules (response time spikes, high down rate, flapping, CPU/RAM)
2. EWMA deviation (latency significantly above exponentially weighted baseline)
3. Isolation Forest (unsupervised anomaly detection on feature vectors)

Results are stored as ServicePrediction rows and optionally trigger alerts.
"""

import logging
import time
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models import Service, Check, AlertLog, RegisteredAgent, AgentMetric, ServicePrediction

logger = logging.getLogger(__name__)

# Module-level cache for Isolation Forest models
# Key: service_id, Value: {"model": IsolationForest, "trained_at": float (time.time())}
_model_cache = {}


# ---------------------------------------------------------------------------
# 3b — EWMA helper
# ---------------------------------------------------------------------------
def compute_ewma(values: list, alpha: float = 0.3) -> tuple:
    """Compute EWMA and standard deviation of residuals.

    Args:
        values: list of float response times
        alpha: smoothing factor (0 < alpha <= 1)

    Returns:
        (final_ewma, std_of_residuals)
    """
    if not values:
        return (0.0, 0.0)

    ewma = values[0]
    residuals = []

    for v in values:
        residual = abs(v - ewma)
        residuals.append(residual)
        ewma = alpha * v + (1 - alpha) * ewma

    if len(residuals) < 2:
        return (ewma, 0.0)

    mean_r = sum(residuals) / len(residuals)
    variance = sum((r - mean_r) ** 2 for r in residuals) / len(residuals)
    std = variance ** 0.5

    return (ewma, std)


# ---------------------------------------------------------------------------
# 3a — Feature extraction
# ---------------------------------------------------------------------------
def extract_features(service_id: int, db: Session) -> dict | None:
    """Extract prediction features from the last 30 checks of a service.

    Returns None if fewer than 10 checks exist (not enough data).
    """
    checks = (
        db.query(Check)
        .filter(Check.service_id == service_id)
        .order_by(desc(Check.checked_at))
        .limit(30)
        .all()
    )

    if len(checks) < 10:
        return None

    # Reverse to chronological order (oldest first)
    checks = list(reversed(checks))

    # Response times (skip None)
    response_times = [c.response_time for c in checks if c.response_time is not None]
    statuses = [c.status for c in checks]

    if not response_times:
        response_times = [0.0]

    mean_response = sum(response_times) / len(response_times)

    # Standard deviation
    if len(response_times) > 1:
        variance = sum((r - mean_response) ** 2 for r in response_times) / len(response_times)
        std_response = variance ** 0.5
    else:
        std_response = 0.0

    # Trend: mean of last 10 minus mean of previous 10
    if len(response_times) >= 20:
        prev_mean = sum(response_times[:10]) / 10
        recent_mean = sum(response_times[-10:]) / 10
        trend = recent_mean - prev_mean
    elif len(response_times) >= 10:
        half = len(response_times) // 2
        prev_mean = sum(response_times[:half]) / half
        recent_mean = sum(response_times[half:]) / (len(response_times) - half)
        trend = recent_mean - prev_mean
    else:
        trend = 0.0

    # Down rate
    down_count = sum(1 for s in statuses if s == "DOWN")
    down_rate = down_count / len(statuses)

    # Flip count (UP→DOWN or DOWN→UP transitions)
    flip_count = 0
    for i in range(1, len(statuses)):
        if statuses[i] != statuses[i - 1]:
            flip_count += 1

    # Consecutive slow streak (response_time > 2× mean)
    threshold = 2 * mean_response if mean_response > 0 else float('inf')
    consecutive_slow = 0
    max_consecutive_slow = 0
    for rt in response_times:
        if rt > threshold:
            consecutive_slow += 1
            max_consecutive_slow = max(max_consecutive_slow, consecutive_slow)
        else:
            consecutive_slow = 0

    # Latest response
    latest_response = response_times[-1] if response_times else 0.0

    # EWMA
    ewma, ewma_std = compute_ewma(response_times, alpha=0.3)

    features = {
        "mean_response": mean_response,
        "std_response": std_response,
        "trend": trend,
        "down_rate": down_rate,
        "flip_count": flip_count,
        "consecutive_slow": max_consecutive_slow,
        "latest_response": latest_response,
        "ewma": ewma,
        "ewma_std": ewma_std,
        # Agent fields — defaults
        "cpu_mean": 0.0,
        "cpu_trend": 0.0,
        "ram_mean": 0.0,
        "ram_trend": 0.0,
        "net_saturation": 0.0,
        "agent_available": False,
    }

    # Try to find linked agent data
    try:
        service = db.query(Service).filter(Service.id == service_id).first()
        if service and service.user_id:
            from app.models import User
            user = db.query(User).filter(User.id == service.user_id).first()
            if user:
                agent = (
                    db.query(RegisteredAgent)
                    .filter(RegisteredAgent.owner_email == user.email)
                    .first()
                )
                if agent:
                    agent_metrics = (
                        db.query(AgentMetric)
                        .filter(AgentMetric.hostname == agent.hostname)
                        .order_by(desc(AgentMetric.recorded_at))
                        .limit(10)
                        .all()
                    )
                    if agent_metrics:
                        agent_metrics = list(reversed(agent_metrics))
                        cpus = [m.cpu_percent for m in agent_metrics]
                        rams = [m.ram_percent for m in agent_metrics]

                        features["cpu_mean"] = sum(cpus) / len(cpus)
                        features["ram_mean"] = sum(rams) / len(rams)
                        features["agent_available"] = True

                        if len(cpus) >= 10:
                            features["cpu_trend"] = sum(cpus[5:]) / 5 - sum(cpus[:5]) / 5
                            features["ram_trend"] = sum(rams[5:]) / 5 - sum(rams[:5]) / 5
                        elif len(cpus) >= 4:
                            h = len(cpus) // 2
                            features["cpu_trend"] = sum(cpus[h:]) / (len(cpus) - h) - sum(cpus[:h]) / h
                            features["ram_trend"] = sum(rams[h:]) / (len(rams) - h) - sum(rams[:h]) / h

                        net_total = sum(m.net_rx_bytes + m.net_tx_bytes for m in agent_metrics) / len(agent_metrics)
                        features["net_saturation"] = min(net_total / 1e8, 1.0)
    except Exception as e:
        logger.warning(f"Failed to extract agent features for service {service_id}: {e}")

    return features


# ---------------------------------------------------------------------------
# 3c — Three detection methods
# ---------------------------------------------------------------------------
def check_threshold_rules(features: dict) -> tuple:
    """Check rule-based thresholds for anomaly indicators.

    Returns (flagged: bool, reason: str).
    """
    reasons = []

    # 1. Response time spike
    if features["mean_response"] > 0 and features["latest_response"] > 3 * features["mean_response"]:
        ratio = features["latest_response"] / features["mean_response"]
        reasons.append(f"Response time {ratio:.1f}× above baseline")

    # 2. High down rate
    if features["down_rate"] > 0.2:
        pct = features["down_rate"] * 100
        reasons.append(f"{pct:.0f}% of recent checks were DOWN")

    # 3. Flapping
    if features["flip_count"] >= 4:
        reasons.append(f"Service flapping ({features['flip_count']} status changes)")

    # 4. Consecutive slow
    if features["consecutive_slow"] >= 5:
        reasons.append(f"{features['consecutive_slow']} consecutive slow responses")

    # 5. CPU overload (agent)
    if features["agent_available"] and features["cpu_mean"] > 88:
        reasons.append(f"CPU sustained at {features['cpu_mean']:.0f}%")

    # 6. RAM overload (agent)
    if features["agent_available"] and features["ram_mean"] > 90:
        reasons.append(f"RAM sustained at {features['ram_mean']:.0f}%")

    flagged = len(reasons) > 0
    reason = " · ".join(reasons) if reasons else ""
    return (flagged, reason)


def check_ewma_deviation(features: dict) -> tuple:
    """Check if latest response deviates significantly from EWMA baseline.

    Returns (flagged: bool, reason: str).
    """
    ewma = features["ewma"]
    ewma_std = features["ewma_std"]
    latest = features["latest_response"]

    if ewma_std <= 5:
        return (False, "")

    deviation = abs(latest - ewma)
    sigma = deviation / ewma_std if ewma_std > 0 else 0

    if deviation > 2.5 * ewma_std:
        reason = f"Latency {sigma:.1f}σ above EWMA baseline (EWMA={ewma:.0f}ms, current={latest:.0f}ms)"
        return (True, reason)

    return (False, "")


def check_isolation_forest(features: dict, model_cache: dict, service_id: int, db: Session) -> tuple:
    """Run Isolation Forest anomaly detection.

    Uses a cached model per service, retrained at most once per hour.
    scikit-learn is imported lazily to avoid startup failures.

    Returns (flagged: bool, reason: str).
    """
    try:
        # Lazy import — app still starts if sklearn not installed
        import numpy as np
        from sklearn.ensemble import IsolationForest
    except ImportError:
        logger.warning("scikit-learn not installed — skipping Isolation Forest")
        return (False, "")

    feature_keys = [
        "mean_response", "std_response", "trend", "down_rate",
        "flip_count", "consecutive_slow", "cpu_mean", "ram_mean", "net_saturation"
    ]
    current_vector = np.array([[features[k] for k in feature_keys]])

    # Check if we need to (re)train
    now = time.time()
    cached = model_cache.get(service_id)
    need_train = cached is None or (now - cached["trained_at"]) > 3600  # 1 hour

    if need_train:
        # Get last 200 checks for training
        checks = (
            db.query(Check)
            .filter(Check.service_id == service_id)
            .order_by(desc(Check.checked_at))
            .limit(200)
            .all()
        )

        if len(checks) < 50:
            return (False, "")  # Not enough data to train

        checks = list(reversed(checks))
        response_times = [c.response_time if c.response_time is not None else 0.0 for c in checks]
        statuses = [c.status for c in checks]

        # Build training matrix using sliding windows of 10
        training_vectors = []
        for i in range(10, len(checks)):
            window = checks[i - 10:i]
            w_rts = [c.response_time if c.response_time is not None else 0.0 for c in window]
            w_statuses = [c.status for c in window]

            w_mean = sum(w_rts) / len(w_rts) if w_rts else 0
            w_var = sum((r - w_mean) ** 2 for r in w_rts) / len(w_rts) if w_rts else 0
            w_std = w_var ** 0.5

            if len(w_rts) >= 6:
                half = len(w_rts) // 2
                w_trend = sum(w_rts[half:]) / (len(w_rts) - half) - sum(w_rts[:half]) / half
            else:
                w_trend = 0.0

            w_down = sum(1 for s in w_statuses if s == "DOWN") / len(w_statuses)
            w_flips = sum(1 for j in range(1, len(w_statuses)) if w_statuses[j] != w_statuses[j - 1])

            threshold_val = 2 * w_mean if w_mean > 0 else float('inf')
            w_consec = 0
            w_max_consec = 0
            for rt in w_rts:
                if rt > threshold_val:
                    w_consec += 1
                    w_max_consec = max(w_max_consec, w_consec)
                else:
                    w_consec = 0

            vec = [w_mean, w_std, w_trend, w_down, w_flips, w_max_consec,
                   features["cpu_mean"], features["ram_mean"], features["net_saturation"]]
            training_vectors.append(vec)

        if len(training_vectors) < 20:
            return (False, "")

        X_train = np.array(training_vectors)

        model = IsolationForest(
            n_estimators=50,
            contamination=0.1,
            random_state=42,
        )
        model.fit(X_train)

        model_cache[service_id] = {
            "model": model,
            "trained_at": now,
        }
        logger.info(f"Trained Isolation Forest for service {service_id} with {len(training_vectors)} samples")

    model = model_cache[service_id]["model"]
    prediction = model.predict(current_vector)[0]
    score = model.decision_function(current_vector)[0]

    if prediction == -1 and score < -0.1:
        reason = f"Isolation Forest anomaly score: {score:.2f}"
        return (True, reason)

    return (False, "")


# ---------------------------------------------------------------------------
# 3d — Main prediction runner
# ---------------------------------------------------------------------------
def run_predictions(db: Session):
    """Run predictive analysis for all active services.

    Called by APScheduler every 5 minutes.
    Each service is wrapped in try/except so one failure doesn't crash the batch.
    """
    logger.info("Running prediction engine...")

    services = db.query(Service).filter(Service.active == True).all()
    processed = 0
    flagged = 0

    for service in services:
        try:
            features = extract_features(service.id, db)
            if features is None:
                continue

            # Run all three detection methods
            t_flag, t_reason = check_threshold_rules(features)
            e_flag, e_reason = check_ewma_deviation(features)
            i_flag, i_reason = check_isolation_forest(features, _model_cache, service.id, db)

            # Count votes
            votes = sum([t_flag, e_flag, i_flag])

            # Determine risk level
            if votes >= 2:
                risk_level = "high"
            elif votes == 1:
                risk_level = "medium"
            else:
                risk_level = "low"

            confidence = round(votes / 3.0, 2)

            # Combine reasons
            all_reasons = [r for r in [t_reason, e_reason, i_reason] if r]
            reason = " | ".join(all_reasons) if all_reasons else "All systems nominal"

            # Save prediction
            prediction = ServicePrediction(
                service_id=service.id,
                risk_level=risk_level,
                confidence=confidence,
                threshold_flag=t_flag,
                ewma_flag=e_flag,
                isolation_flag=i_flag,
                reason=reason,
                votes=votes,
            )
            db.add(prediction)
            db.commit()

            processed += 1
            if risk_level == "high":
                flagged += 1

            # Alert on transition to high risk (avoid spam)
            if risk_level == "high":
                prev = (
                    db.query(ServicePrediction)
                    .filter(
                        ServicePrediction.service_id == service.id,
                        ServicePrediction.id != prediction.id,
                    )
                    .order_by(desc(ServicePrediction.checked_at))
                    .first()
                )
                was_high = prev and prev.risk_level == "high"

                if not was_high:
                    # Create alert log for predicted downtime
                    alert = AlertLog(
                        service_id=service.id,
                        alert_type="PREDICTED_DOWN",
                        recipient_email="system@dragonping",
                    )
                    db.add(alert)
                    db.commit()
                    logger.warning(
                        f"⚠ HIGH RISK for '{service.name}' (votes={votes}): {reason}"
                    )

        except Exception as e:
            logger.error(f"Prediction failed for service {service.id} ({service.name}): {e}")
            db.rollback()
            continue

    logger.info(f"Prediction complete: {processed} services analysed, {flagged} flagged high-risk")
