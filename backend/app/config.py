import os

def feature_enabled(name: str) -> bool:
    return os.getenv(name, "false").lower() == "true"

SLA_ENABLED = feature_enabled("ENABLE_SLA")
