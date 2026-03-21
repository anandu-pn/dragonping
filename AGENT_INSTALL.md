# DragonPing Agent — Installation

## What is the Agent?
The DragonPing Agent is a lightweight bash script that runs on your monitored devices (Linux machines in a college lab, servers, etc). It collects CPU, RAM, disk, and network metrics and sends them to your DragonPing server every 30 seconds.

**The agent uses your existing DragonPing username and password** — no separate account needed.

---

## Quick Install (one command)
```bash
curl -O http://YOUR_SERVER:8000/static/dragonping-agent.sh
chmod +x dragonping-agent.sh
./dragonping-agent.sh
```

## Manual Install
1. Copy `dragonping-agent.sh` to the target device
2. `chmod +x dragonping-agent.sh`
3. `./dragonping-agent.sh`   (follow the interactive prompts)

## First Run
On first run, the script will prompt you for:
- **DragonPing server URL** (e.g. `http://192.168.1.100:8000`)
- **Username** (your email address)
- **Password** (hidden input)
- **Device label** (friendly name, defaults to hostname)

It then registers with the server and saves a config file to `~/.dragonping/agent.conf`.

---

## Run Continuously via Cron (every 30s)
```bash
crontab -e
```
Add these two lines:
```
* * * * * /path/to/dragonping-agent.sh
* * * * * sleep 30 && /path/to/dragonping-agent.sh
```

## Daemon Mode
```bash
./dragonping-agent.sh --daemon
```
Runs in a loop, sending metrics every 30 seconds. Press `Ctrl+C` to stop.

## Re-register
```bash
./dragonping-agent.sh --setup
```
Forces re-run of the setup wizard even if a config file already exists.

## Check Status
```bash
./dragonping-agent.sh --status
```
Prints the current config and sends a test heartbeat.

---

## Troubleshooting

### "Token expired or invalid"
Delete the config file and re-register:
```bash
rm ~/.dragonping/agent.conf
./dragonping-agent.sh
```

### Agent not showing in the dashboard
- Make sure the backend is running on the URL you specified
- Check that you can reach the server: `curl http://YOUR_SERVER:8000/health`
- Verify the config file exists: `cat ~/.dragonping/agent.conf`

### Dependencies
The agent requires only `bash` and `curl` — no Python, no jq, no extra packages.
