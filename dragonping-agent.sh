#!/usr/bin/env bash
###############################################################################
# DragonPing Agent — Collects system metrics and sends to DragonPing server
# Usage:
#   ./dragonping-agent.sh            → single run (for cron)
#   ./dragonping-agent.sh --setup    → force re-run setup even if conf exists
#   ./dragonping-agent.sh --daemon   → run in loop every 30s
#   ./dragonping-agent.sh --status   → print current config and last result
###############################################################################

CONFIG_DIR="$HOME/.dragonping"
CONFIG_FILE="$CONFIG_DIR/agent.conf"

# ─── Utility: extract a JSON value without jq ─────────────────────────────────
json_val() {
  echo "$1" | grep -o "\"$2\":\"[^\"]*\"" | sed "s/\"$2\":\"//;s/\"//"
}
json_val_num() {
  echo "$1" | grep -o "\"$2\":[0-9.]*" | sed "s/\"$2\"://"
}

# ─── Setup ────────────────────────────────────────────────────────────────────
do_setup() {
  echo ""
  echo "  DragonPing Agent Setup"
  echo "  ========================"
  echo "  This will connect this device to your DragonPing server."
  echo ""

  # Server URL
  printf "  DragonPing server URL (e.g. http://192.168.1.100:8000): "
  read -r SERVER_URL
  SERVER_URL="${SERVER_URL%/}"  # strip trailing slash

  # Username (email)
  printf "  Username (email): "
  read -r AGENT_USERNAME

  # Password (hidden)
  printf "  Password: "
  read -rs AGENT_PASSWORD
  echo ""

  # Device label
  LOCAL_HOSTNAME=$(hostname)
  printf "  Device label [%s]: " "$LOCAL_HOSTNAME"
  read -r DEVICE_LABEL
  DEVICE_LABEL="${DEVICE_LABEL:-$LOCAL_HOSTNAME}"

  echo ""
  echo "  Registering with server..."

  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    "${SERVER_URL}/api/agent/register" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"${AGENT_USERNAME}\",\"password\":\"${AGENT_PASSWORD}\",\"hostname\":\"${LOCAL_HOSTNAME}\",\"device_label\":\"${DEVICE_LABEL}\"}" \
    2>/dev/null)

  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" != "200" ]; then
    ERROR_MSG=$(json_val "$BODY" "detail")
    [ -z "$ERROR_MSG" ] && ERROR_MSG="Server returned HTTP $HTTP_CODE"
    echo "  ✗ Registration failed: $ERROR_MSG"
    exit 1
  fi

  AGENT_TOKEN=$(json_val "$BODY" "token")
  REGISTERED_HOSTNAME=$(json_val "$BODY" "hostname")

  if [ -z "$AGENT_TOKEN" ]; then
    echo "  ✗ Registration failed: could not parse token from server response."
    exit 1
  fi

  # Save config
  mkdir -p "$CONFIG_DIR"
  cat > "$CONFIG_FILE" <<EOF
SERVER_URL=${SERVER_URL}
AGENT_TOKEN=${AGENT_TOKEN}
HOSTNAME=${REGISTERED_HOSTNAME}
DEVICE_LABEL=${DEVICE_LABEL}
EOF
  chmod 600 "$CONFIG_FILE"

  echo "  ✓ Setup complete! Config saved to $CONFIG_FILE"
  echo "  ✓ Starting agent..."
  echo ""
}

# ─── Metrics collection ──────────────────────────────────────────────────────
collect_and_send() {
  # --- CPU usage (sample /proc/stat twice, 1s apart) ---
  read -r _ user1 nice1 sys1 idle1 _ < /proc/stat
  sleep 1
  read -r _ user2 nice2 sys2 idle2 _ < /proc/stat

  total1=$((user1 + nice1 + sys1 + idle1))
  total2=$((user2 + nice2 + sys2 + idle2))
  idle_d=$((idle2 - idle1))
  total_d=$((total2 - total1))
  if [ "$total_d" -gt 0 ]; then
    CPU_PERCENT=$(( (total_d - idle_d) * 100 / total_d ))
  else
    CPU_PERCENT=0
  fi

  # --- RAM ---
  MEM_TOTAL=$(grep '^MemTotal:' /proc/meminfo | awk '{print $2}')
  MEM_AVAILABLE=$(grep '^MemAvailable:' /proc/meminfo | awk '{print $2}')
  RAM_TOTAL_MB=$((MEM_TOTAL / 1024))
  RAM_USED_MB=$(( (MEM_TOTAL - MEM_AVAILABLE) / 1024 ))
  if [ "$RAM_TOTAL_MB" -gt 0 ]; then
    RAM_PERCENT=$(( RAM_USED_MB * 100 / RAM_TOTAL_MB ))
  else
    RAM_PERCENT=0
  fi

  # --- Disk (root partition) ---
  DISK_LINE=$(df / | tail -1)
  DISK_TOTAL_KB=$(echo "$DISK_LINE" | awk '{print $2}')
  DISK_USED_KB=$(echo "$DISK_LINE" | awk '{print $3}')
  DISK_TOTAL_GB=$((DISK_TOTAL_KB / 1048576))
  DISK_USED_GB=$((DISK_USED_KB / 1048576))
  if [ "$DISK_TOTAL_KB" -gt 0 ]; then
    DISK_PERCENT=$((DISK_USED_KB * 100 / DISK_TOTAL_KB))
  else
    DISK_PERCENT=0
  fi

  # --- Network I/O ---
  NET_IFACE=""
  for iface in eth0 ens33; do
    if grep -q "$iface" /proc/net/dev 2>/dev/null; then
      NET_IFACE="$iface"
      break
    fi
  done
  if [ -z "$NET_IFACE" ]; then
    NET_IFACE=$(grep ':' /proc/net/dev | awk -F: '{print $1}' | tr -d ' ' | grep -v lo | head -1)
  fi
  if [ -n "$NET_IFACE" ]; then
    NET_LINE=$(grep "$NET_IFACE" /proc/net/dev)
    NET_RX=$(echo "$NET_LINE" | awk '{print $2}')
    NET_TX=$(echo "$NET_LINE" | awk '{print $10}')
  else
    NET_RX=0
    NET_TX=0
  fi

  # --- Top 5 processes ---
  PROCS=$(ps aux --sort=-%cpu 2>/dev/null | awk 'NR>=2 && NR<=6 {printf "{\"name\":\"%s\",\"cpu\":\"%s\",\"mem\":\"%s\"}", $11, $3, $4; if(NR<6) printf ","}')
  PROCS="[$PROCS]"

  # --- Send heartbeat ---
  PAYLOAD=$(cat <<ENDJSON
{
  "hostname": "${HOSTNAME}",
  "cpu_percent": ${CPU_PERCENT},
  "ram_percent": ${RAM_PERCENT},
  "ram_used_mb": ${RAM_USED_MB},
  "ram_total_mb": ${RAM_TOTAL_MB},
  "disk_percent": ${DISK_PERCENT},
  "disk_used_gb": ${DISK_USED_GB},
  "disk_total_gb": ${DISK_TOTAL_GB},
  "net_rx_bytes": ${NET_RX},
  "net_tx_bytes": ${NET_TX},
  "processes": "${PROCS//\"/\\\"}"
}
ENDJSON
)

  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    "${SERVER_URL}/api/agent/heartbeat" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${AGENT_TOKEN}" \
    -d "$PAYLOAD" \
    2>/dev/null)

  HTTP_CODE=$(echo "$RESPONSE" | tail -1)

  if [ "$HTTP_CODE" = "200" ]; then
    return 0
  elif [ "$HTTP_CODE" = "401" ]; then
    echo "Token expired or invalid. Delete ~/.dragonping/agent.conf and re-run to re-register."
    exit 1
  else
    echo "Heartbeat failed: $HTTP_CODE"
    exit 1
  fi
}

# ─── Status ───────────────────────────────────────────────────────────────────
do_status() {
  if [ ! -f "$CONFIG_FILE" ]; then
    echo "  Not configured. Run ./dragonping-agent.sh --setup first."
    exit 1
  fi
  source "$CONFIG_FILE"
  echo ""
  echo "  DragonPing Agent Status"
  echo "  ========================"
  echo "  Server URL:   $SERVER_URL"
  echo "  Hostname:     $HOSTNAME"
  echo "  Device Label: $DEVICE_LABEL"
  echo "  Token:        ${AGENT_TOKEN:0:20}..."
  echo ""
  echo "  Sending test heartbeat..."
  collect_and_send && echo "  ✓ Heartbeat sent successfully."
}

# ─── Main ─────────────────────────────────────────────────────────────────────
case "${1:-}" in
  --setup)
    do_setup
    source "$CONFIG_FILE"
    collect_and_send
    ;;
  --daemon)
    # Load or setup
    if [ ! -f "$CONFIG_FILE" ]; then
      do_setup
    fi
    source "$CONFIG_FILE"
    echo "  Running in daemon mode (every 30s). Press Ctrl+C to stop."
    while true; do
      collect_and_send
      sleep 30
    done
    ;;
  --status)
    do_status
    ;;
  *)
    # Default: single run
    if [ ! -f "$CONFIG_FILE" ]; then
      do_setup
    fi
    source "$CONFIG_FILE"
    collect_and_send
    ;;
esac
