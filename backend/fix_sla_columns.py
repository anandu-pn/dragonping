"""Sync PostgreSQL schema with SQLAlchemy models — adds all missing columns and tables."""
import psycopg2

conn = psycopg2.connect(
    host="localhost",
    database="dragonping_db",
    user="postgres",
    password="nandumon",
    connect_timeout=5
)
conn.autocommit = True
cur = conn.cursor()

def add_col(table, col, dtype):
    try:
        cur.execute(f"ALTER TABLE {table} ADD COLUMN {col} {dtype}")
        print(f"  + {table}.{col}")
    except psycopg2.errors.DuplicateColumn:
        conn.rollback()
        print(f"  = {table}.{col} (exists)")
    except Exception as e:
        conn.rollback()
        print(f"  ! {table}.{col} ERROR: {e}")

def create_table(sql, name):
    try:
        cur.execute(sql)
        print(f"  + TABLE {name} created")
    except psycopg2.errors.DuplicateTable:
        conn.rollback()
        print(f"  = TABLE {name} (exists)")
    except Exception as e:
        conn.rollback()
        print(f"  ! TABLE {name} ERROR: {e}")

# --- services table ---
print("services:")
add_col("services", "sla_uptime_target", "DOUBLE PRECISION DEFAULT NULL")
add_col("services", "sla_response_target", "DOUBLE PRECISION DEFAULT NULL")

# --- checks table ---
print("checks:")
add_col("checks", "cert_expiry_days", "INTEGER DEFAULT NULL")

# --- users table ---
print("users:")
add_col("users", "username", "VARCHAR(50) DEFAULT NULL")

# --- registered_agents table ---
print("registered_agents:")
create_table("""
CREATE TABLE registered_agents (
    id SERIAL PRIMARY KEY,
    hostname VARCHAR(255) UNIQUE NOT NULL,
    device_label VARCHAR(255),
    owner_email VARCHAR(255) NOT NULL,
    registered_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_seen TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
)
""", "registered_agents")

# --- agent_metrics table ---
print("agent_metrics:")
create_table("""
CREATE TABLE agent_metrics (
    id SERIAL PRIMARY KEY,
    hostname VARCHAR(255) NOT NULL,
    cpu_percent DOUBLE PRECISION NOT NULL,
    ram_percent DOUBLE PRECISION NOT NULL,
    ram_used_mb INTEGER NOT NULL,
    ram_total_mb INTEGER NOT NULL,
    disk_percent DOUBLE PRECISION NOT NULL,
    disk_used_gb INTEGER NOT NULL,
    disk_total_gb INTEGER NOT NULL,
    net_rx_bytes BIGINT NOT NULL,
    net_tx_bytes BIGINT NOT NULL,
    processes TEXT NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
)
""", "agent_metrics")

# --- service_predictions table ---
print("service_predictions:")
create_table("""
CREATE TABLE service_predictions (
    id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES services(id),
    checked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    risk_level VARCHAR(10) DEFAULT 'low' NOT NULL,
    confidence DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    threshold_flag BOOLEAN DEFAULT FALSE NOT NULL,
    ewma_flag BOOLEAN DEFAULT FALSE NOT NULL,
    isolation_flag BOOLEAN DEFAULT FALSE NOT NULL,
    reason VARCHAR(2048),
    votes INTEGER DEFAULT 0 NOT NULL
)
""", "service_predictions")

# --- Add indexes ---
print("indexes:")
for idx_sql, idx_name in [
    ("CREATE INDEX IF NOT EXISTS ix_registered_agents_hostname ON registered_agents(hostname)", "ix_registered_agents_hostname"),
    ("CREATE INDEX IF NOT EXISTS ix_agent_metrics_hostname ON agent_metrics(hostname)", "ix_agent_metrics_hostname"),
    ("CREATE INDEX IF NOT EXISTS ix_agent_metrics_recorded_at ON agent_metrics(recorded_at)", "ix_agent_metrics_recorded_at"),
    ("CREATE INDEX IF NOT EXISTS ix_service_predictions_service_id ON service_predictions(service_id)", "ix_service_predictions_service_id"),
    ("CREATE INDEX IF NOT EXISTS ix_service_predictions_checked_at ON service_predictions(checked_at)", "ix_service_predictions_checked_at"),
]:
    try:
        cur.execute(idx_sql)
        print(f"  + {idx_name}")
    except Exception as e:
        conn.rollback()
        print(f"  = {idx_name} ({e})")

cur.close()
conn.close()
print("\nAll done!")
