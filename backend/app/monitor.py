"""Website uptime monitoring engine using httpx."""

import httpx
import time
from typing import Tuple, Optional


async def check_service(url: str, timeout: int = 10) -> dict:
    """
    Check if a service is up and measure response time.

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
