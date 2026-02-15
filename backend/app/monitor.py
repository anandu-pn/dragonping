"""Website uptime monitoring engine using httpx, ICMP ping, and TCP socket checks."""

import httpx
import socket
import time
import logging
from typing import Optional
from pythonping import ping as icmp_ping

logger = logging.getLogger(__name__)

TIMEOUT = 10


async def check_http(url: str, timeout: int = TIMEOUT) -> dict:
    """
    Check HTTP/HTTPS endpoint availability.

    Args:
        url: The URL to check
        timeout: Request timeout in seconds

    Returns:
        Dictionary with status, response_time, status_code, and error_message
    """
    start_time = time.time()

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(url, follow_redirects=True)
            response_time = (time.time() - start_time) * 1000  # Convert to milliseconds

            status = "UP" if response.status_code < 400 else "DOWN"

            return {
                "status": status,
                "status_code": response.status_code,
                "response_time": response_time,
                "error_message": None,
            }

    except httpx.TimeoutException:
        response_time = (time.time() - start_time) * 1000
        return {
            "status": "DOWN",
            "status_code": None,
            "response_time": response_time,
            "error_message": "Request timeout",
        }

    except httpx.ConnectError as e:
        response_time = (time.time() - start_time) * 1000
        return {
            "status": "DOWN",
            "status_code": None,
            "response_time": response_time,
            "error_message": f"Connection error: {str(e)[:100]}",
        }

    except httpx.RequestError as e:
        response_time = (time.time() - start_time) * 1000
        return {
            "status": "DOWN",
            "status_code": None,
            "response_time": response_time,
            "error_message": f"Request error: {str(e)[:100]}",
        }

    except Exception as e:
        response_time = (time.time() - start_time) * 1000
        return {
            "status": "DOWN",
            "status_code": None,
            "response_time": response_time,
            "error_message": f"Unexpected error: {str(e)[:100]}",
        }


def check_icmp_ping(ip_address: str, timeout: int = TIMEOUT) -> dict:
    """
    Check device availability using ICMP ping.

    Args:
        ip_address: The IP address to ping
        timeout: Ping timeout in seconds

    Returns:
        Dictionary with status, response_time, and error_message
    """
    start_time = time.time()

    try:
        response = icmp_ping(ip_address, count=1, timeout=timeout)
        # pythonping ResponseList exposes rtt_avg / rtt_min / rtt_max (seconds).
        # Use rtt_avg when available, otherwise fall back to rtt_min or rtt_max.
        try:
            rtt_seconds = getattr(response, "rtt_avg", None)
            if not rtt_seconds:
                rtt_seconds = getattr(response, "rtt_min", None)
            if not rtt_seconds:
                rtt_seconds = getattr(response, "rtt_max", None)
            # As a final fallback, try property helpers that return ms
            if not rtt_seconds:
                rtt_ms = getattr(response, "rtt_avg_ms", None) or getattr(response, "rtt_min_ms", None)
                if rtt_ms:
                    response_time = float(rtt_ms)
                else:
                    response_time = 0
            else:
                response_time = float(rtt_seconds) * 1000
        except Exception:
            response_time = 0

        # Determine success by inspecting individual reply items. Some implementations
        # of pythonping expose per-item attributes like `success` and `time_elapsed`.
        success = False
        try:
            for item in response:
                # Prefer explicit success flag
                if getattr(item, "success", None) is True:
                    success = True
                    break
                # Fallback: consider non-zero time_elapsed as success
                te = getattr(item, "time_elapsed", None)
                if te is not None and te > 0:
                    success = True
                    break
        except Exception:
            # If iterating fails, keep success as False and rely on rtt values
            pass

        if success:
            return {
                "status": "UP",
                "status_code": None,
                "response_time": response_time,
                "error_message": None,
            }
        else:
            return {
                "status": "DOWN",
                "status_code": None,
                "response_time": response_time,
                "error_message": "No ping response",
            }

    except Exception as e:
        response_time = (time.time() - start_time) * 1000
        return {
            "status": "DOWN",
            "status_code": None,
            "response_time": response_time,
            "error_message": f"Ping failed: {str(e)[:100]}",
        }


def check_tcp_port(ip_address: str, port: int, timeout: int = TIMEOUT) -> dict:
    """
    Check TCP port availability.

    Args:
        ip_address: The IP address to connect to
        port: The TCP port to check
        timeout: Connection timeout in seconds

    Returns:
        Dictionary with status, response_time, and error_message
    """
    start_time = time.time()

    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.settimeout(timeout)
            result = sock.connect_ex((ip_address, port))
            response_time = (time.time() - start_time) * 1000  # Convert to milliseconds

            if result == 0:
                return {
                    "status": "UP",
                    "status_code": None,
                    "response_time": response_time,
                    "error_message": None,
                }
            else:
                return {
                    "status": "DOWN",
                    "status_code": None,
                    "response_time": response_time,
                    "error_message": f"TCP connection refused",
                }

    except socket.timeout:
        response_time = (time.time() - start_time) * 1000
        return {
            "status": "DOWN",
            "status_code": None,
            "response_time": response_time,
            "error_message": "Connection timeout",
        }

    except socket.error as e:
        response_time = (time.time() - start_time) * 1000
        return {
            "status": "DOWN",
            "status_code": None,
            "response_time": response_time,
            "error_message": f"Socket error: {str(e)[:100]}",
        }

    except Exception as e:
        response_time = (time.time() - start_time) * 1000
        return {
            "status": "DOWN",
            "status_code": None,
            "response_time": response_time,
            "error_message": f"Unexpected error: {str(e)[:100]}",
        }


async def check_service(
    service_type: str = "website",
    protocol: str = "http",
    url: Optional[str] = None,
    ip_address: Optional[str] = None,
    port: Optional[int] = None,
    timeout: int = TIMEOUT,
) -> dict:
    """
    Dispatcher to check service/device based on type and protocol.

    Args:
        service_type: "website" or "device"
        protocol: "http", "https", "icmp", or "tcp"
        url: URL for HTTP/HTTPS checks
        ip_address: IP address for ICMP or TCP checks
        port: TCP port for TCP checks
        timeout: Request timeout in seconds

    Returns:
        Dictionary with status, response_time, status_code, and error_message
    """
    if service_type == "website" and protocol in ["http", "https"]:
        if not url:
            return {
                "status": "DOWN",
                "status_code": None,
                "response_time": 0,
                "error_message": "URL required for HTTP checks",
            }
        return await check_http(url, timeout)

    elif service_type == "device" and protocol == "icmp":
        if not ip_address:
            return {
                "status": "DOWN",
                "status_code": None,
                "response_time": 0,
                "error_message": "IP address required for ICMP checks",
            }
        return check_icmp_ping(ip_address, timeout)

    elif protocol == "tcp":
        if not ip_address or not port:
            return {
                "status": "DOWN",
                "status_code": None,
                "response_time": 0,
                "error_message": "IP address and port required for TCP checks",
            }
        return check_tcp_port(ip_address, port, timeout)

    else:
        return {
            "status": "DOWN",
            "status_code": None,
            "response_time": 0,
            "error_message": f"Unsupported check type: {service_type}/{protocol}",
        }
