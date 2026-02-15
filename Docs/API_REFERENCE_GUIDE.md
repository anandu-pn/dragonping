# DragonPing API Reference Guide

Complete documentation of all backend API endpoints for the DragonPing monitoring system.

## Table of Contents
1. [Authentication](#authentication)
2. [Services Management](#services-management)
3. [Monitoring Data](#monitoring-data)
4. [Public Status](#public-status)
5. [Error Codes](#error-codes)

---

## Authentication

### Base URL
```
http://localhost:8000
```

### Request Headers (After Authentication)
```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

---

## Authentication Endpoints

### 1. Register User
**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (201 Created):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "is_admin": false
  }
}
```

**Error Response (400):**
```json
{
  "detail": "Email already registered"
}
```

---

### 2. Login User
**POST** `/auth/login`

Authenticate and get JWT token.

**Request Body:**
```json
{
  "username": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Error Response (401):**
```json
{
  "detail": "Incorrect email or password"
}
```

---

### 3. Get Current User
**GET** `/auth/me`

Get information about the authenticated user.

**Headers Required:**
```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "is_admin": false,
  "created_at": "2024-01-15T10:30:00"
}
```

**Error Response (401):**
```json
{
  "detail": "Not authenticated"
}
```

---

## Services Management

All service endpoints require authentication.

### 4. Create Service (WEBSITE)
**POST** `/api/services`

Create a new website monitoring service.

**Request Body:**
```json
{
  "name": "Google Search",
  "url": "https://www.google.com",
  "type": "website",
  "protocol": "https",
  "interval": 30,
  "is_public": false,
  "active": true
}
```

**Parameters:**
- `name` (string, required): Service name for display
- `url` (string, required): Full URL to monitor (http/https)
- `type` (string, required): "website"
- `protocol` (string, required): "http" or "https"
- `interval` (integer, optional): Check interval in seconds (default: 30)
- `is_public` (boolean, optional): Show on public status page (default: false)
- `active` (boolean, optional): Enable monitoring (default: true)

**Response (201 Created):**
```json
{
  "id": 1,
  "name": "Google Search",
  "url": "https://www.google.com",
  "type": "website",
  "protocol": "https",
  "interval": 30,
  "is_public": false,
  "active": true,
  "user_id": 1,
  "created_at": "2024-01-15T10:30:00",
  "checks": [],
  "latest_check": null
}
```

---

### 5. Create Service (DEVICE - ICMP)
**POST** `/api/services`

Monitor a device using ICMP ping.

**Request Body:**
```json
{
  "name": "Office Router",
  "ip_address": "192.168.1.1",
  "type": "device",
  "protocol": "icmp",
  "interval": 30,
  "is_public": false,
  "active": true
}
```

**Parameters:**
- `name` (string, required): Device name
- `ip_address` (string, required): IP address to ping
- `type` (string, required): "device"
- `protocol` (string, required): "icmp"
- `interval` (integer, optional): Check interval in seconds (default: 30)
- `is_public` (boolean, optional): Show on public status page
- `active` (boolean, optional): Enable monitoring

**Response (201 Created):**
```json
{
  "id": 2,
  "name": "Office Router",
  "ip_address": "192.168.1.1",
  "type": "device",
  "protocol": "icmp",
  "interval": 30,
  "is_public": false,
  "active": true,
  "user_id": 1,
  "created_at": "2024-01-15T10:35:00",
  "latest_check": null
}
```

---

### 6. Create Service (DEVICE - TCP)
**POST** `/api/services`

Monitor a TCP port on a device.

**Request Body:**
```json
{
  "name": "Server SSH Port",
  "ip_address": "192.168.1.100",
  "type": "device",
  "protocol": "tcp",
  "port": 22,
  "interval": 30,
  "is_public": false,
  "active": true
}
```

**Parameters:**
- `name` (string, required): Service name
- `ip_address` (string, required): Device IP address
- `type` (string, required): "device"
- `protocol` (string, required): "tcp"
- `port` (integer, required): Port number (1-65535)
- `interval` (integer, optional): Check interval in seconds
- `is_public` (boolean, optional): Show on public status page
- `active` (boolean, optional): Enable monitoring

**Response (201 Created):**
```json
{
  "id": 3,
  "name": "Server SSH Port",
  "ip_address": "192.168.1.100",
  "type": "device",
  "protocol": "tcp",
  "port": 22,
  "interval": 30,
  "is_public": false,
  "active": true,
  "user_id": 1,
  "created_at": "2024-01-15T10:40:00",
  "latest_check": null
}
```

---

### 7. List All Services
**GET** `/api/services`

Get all services for the authenticated user.

**Query Parameters:**
- `skip` (integer, optional): Skip N services for pagination (default: 0)
- `limit` (integer, optional): Return max N services (default: 100)

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Google Search",
    "url": "https://www.google.com",
    "type": "website",
    "protocol": "https",
    "active": true,
    "is_public": false,
    "latest_check": {
      "status": "up",
      "response_time": 125.5,
      "checked_at": "2024-01-15T10:45:00"
    }
  },
  {
    "id": 2,
    "name": "Office Router",
    "ip_address": "192.168.1.1",
    "type": "device",
    "protocol": "icmp",
    "active": true,
    "is_public": false,
    "latest_check": {
      "status": "up",
      "response_time": 45.2,
      "checked_at": "2024-01-15T10:44:55"
    }
  }
]
```

---

### 8. Get Service Details
**GET** `/api/services/{service_id}`

Get detailed information about a specific service.

**URL Parameters:**
- `service_id` (integer): The service ID

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Google Search",
  "url": "https://www.google.com",
  "type": "website",
  "protocol": "https",
  "interval": 30,
  "is_public": false,
  "active": true,
  "user_id": 1,
  "created_at": "2024-01-15T10:30:00",
  "updated_at": "2024-01-15T10:45:00",
  "checks": [
    {
      "id": 100,
      "service_id": 1,
      "status": "up",
      "response_time": 125.5,
      "error": null,
      "checked_at": "2024-01-15T10:45:00"
    },
    {
      "id": 99,
      "service_id": 1,
      "status": "up",
      "response_time": 128.3,
      "error": null,
      "checked_at": "2024-01-15T10:44:30"
    }
  ],
  "latest_check": {
    "status": "up",
    "response_time": 125.5,
    "checked_at": "2024-01-15T10:45:00"
  }
}
```

---

### 9. Update Service
**PUT** `/api/services/{service_id}`

Update an existing service. **Authenticated users can only update their own services.**

**Request Body (Website - Partial Update Allowed):**
```json
{
  "name": "Google Updated",
  "url": "https://google.com",
  "interval": 60,
  "is_public": true,
  "active": true
}
```

**Request Body (Device - Partial Update Allowed):**
```json
{
  "name": "Router Updated",
  "ip_address": "192.168.1.2",
  "protocol": "icmp",
  "interval": 60,
  "is_public": true,
  "active": false
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Google Updated",
  "url": "https://google.com",
  "type": "website",
  "protocol": "https",
  "interval": 60,
  "is_public": true,
  "active": true,
  "updated_at": "2024-01-15T11:00:00"
}
```

**Error Response (403 Forbidden):**
```json
{
  "detail": "Not authorized to update this service"
}
```

---

### 10. Delete Service
**DELETE** `/api/services/{service_id}`

Delete a service. **Authenticated users can only delete their own services.**

**Response (204 No Content):**
```
(Empty response body)
```

**Error Response (403 Forbidden):**
```json
{
  "detail": "Not authorized to delete this service"
}
```

**Error Response (404 Not Found):**
```json
{
  "detail": "Service not found"
}
```

---

## Monitoring Data

### 11. Get Service Checks (History)
**GET** `/api/services/{service_id}/checks`

Get monitoring history for a service.

**Query Parameters:**
- `skip` (integer, optional): Skip N records (default: 0)
- `limit` (integer, optional): Return max N records (default: 100)

**Response (200 OK):**
```json
[
  {
    "id": 100,
    "service_id": 1,
    "status": "up",
    "response_time": 125.5,
    "status_code": 200,
    "error": null,
    "timestamp": "2024-01-15T10:45:00",
    "checked_at": "2024-01-15T10:45:00"
  },
  {
    "id": 99,
    "service_id": 1,
    "status": "up",
    "response_time": 128.3,
    "status_code": 200,
    "error": null,
    "timestamp": "2024-01-15T10:44:30",
    "checked_at": "2024-01-15T10:44:30"
  },
  {
    "id": 98,
    "service_id": 1,
    "status": "down",
    "response_time": null,
    "status_code": 0,
    "error": "Connection timeout",
    "timestamp": "2024-01-15T10:44:00",
    "checked_at": "2024-01-15T10:44:00"
  }
]
```

**Check Status Meanings:**
- `"up"`: Service is responding normally
- `"down"`: Service is not responding or returned error

**For HTTP/HTTPS Services:**
- `response_time`: Response time in milliseconds
- `status_code`: HTTP status code (200, 404, 500, etc.)
- `error`: Error message if any

**For ICMP Services:**
- `response_time`: Ping response time in milliseconds
- `error`: "unreachable", "timeout", or null if successful

**For TCP Services:**
- `response_time`: Connection time in milliseconds
- `error`: "connection refused", "timeout", or null if successful

---

### 12. Get Alert Logs
**GET** `/api/alerts`

Get email alert history.

**Query Parameters:**
- `skip` (integer, optional): Skip N alerts (default: 0)
- `limit` (integer, optional): Return max N alerts (default: 100)

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "service_id": 1,
    "alert_type": "status_change",
    "from_status": "up",
    "to_status": "down",
    "message": "Google Search is DOWN",
    "sent_to": "admin@example.com",
    "created_at": "2024-01-15T10:30:00"
  },
  {
    "id": 2,
    "service_id": 1,
    "alert_type": "recovery",
    "from_status": "down",
    "to_status": "up",
    "message": "Google Search is RECOVERED",
    "sent_to": "admin@example.com",
    "created_at": "2024-01-15T10:31:00"
  }
]
```

---

## Public Status

### 13. Get Public Status (No Authentication)
**GET** `/public/status`

Get status of all public services (no authentication required).

**Response (200 OK):**
```json
{
  "last_update": "2024-01-15T10:45:00",
  "services": [
    {
      "id": 1,
      "name": "Google Search",
      "type": "website",
      "status": "up",
      "response_time": 125.5,
      "last_checked": "2024-01-15T10:45:00"
    },
    {
      "id": 2,
      "name": "Office Router",
      "type": "device",
      "status": "up",
      "response_time": 45.2,
      "last_checked": "2024-01-15T10:44:55"
    }
  ]
}
```

---

### 14. Health Check (No Authentication)
**GET** `/health`

Simple health check endpoint.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:45:00"
}
```

---

## Error Codes

### Common HTTP Status Codes

| Code | Meaning | Example Response |
|------|---------|------------------|
| 200 | OK | GET request successful |
| 201 | Created | Service created successfully |
| 204 | No Content | DELETE successful (empty body) |
| 400 | Bad Request | Invalid input format |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Not authorized for this operation |
| 404 | Not Found | Resource doesn't exist |
| 422 | Validation Error | Field validation failed |
| 500 | Server Error | Internal server error |

---

### Error Response Format

**Typical Error Response:**
```json
{
  "detail": "Descriptive error message explaining what went wrong"
}
```

**Validation Error Response (422):**
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "invalid email format",
      "type": "value_error.email"
    }
  ]
}
```

---

## Usage Examples

### Complete Workflow: Create Website Service and Monitor

#### Step 1: Register User
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

Save the `access_token` from response.

#### Step 2: Create Website Service
```bash
curl -X POST http://localhost:8000/api/services \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Google",
    "url": "https://www.google.com",
    "type": "website",
    "protocol": "https",
    "interval": 30,
    "is_public": true,
    "active": true
  }'
```

Save the service `id`.

#### Step 3: View Service Status
```bash
curl -X GET http://localhost:8000/api/services/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Step 4: View Check History
```bash
curl -X GET http://localhost:8000/api/services/1/checks \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Step 5: View Public Status
```bash
curl -X GET http://localhost:8000/public/status
```

---

### Complete Workflow: Monitor Local Device with ICMP

#### Step 1: Create ICMP Service
```bash
curl -X POST http://localhost:8000/api/services \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wireless Router",
    "ip_address": "192.168.1.1",
    "type": "device",
    "protocol": "icmp",
    "interval": 30,
    "is_public": true,
    "active": true
  }'
```

#### Step 2: Wait for Checks (30 seconds)
Scheduler runs every 30 seconds automatically.

#### Step 3: Get Results
```bash
curl -X GET http://localhost:8000/api/services/2/checks \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Complete Workflow: Monitor Service Port (TCP)

#### Step 1: Create TCP Service
```bash
curl -X POST http://localhost:8000/api/services \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Server SSH",
    "ip_address": "192.168.1.100",
    "type": "device",
    "protocol": "tcp",
    "port": 22,
    "interval": 30,
    "is_public": false,
    "active": true
  }'
```

#### Step 2: Monitor Results
```bash
curl -X GET http://localhost:8000/api/services/3/checks \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Important Notes

### JWT Token
- Token is returned in the `access_token` field
- Always include as: `Authorization: Bearer YOUR_TOKEN`
- Token type is always `bearer`
- Tokens expire based on server configuration (typically 24 hours)

### Service Permissions
- **Create**: Any authenticated user can create services
- **View**: Users see only their own services (authenticated endpoint)
- **Update**: Users can only update their own services
- **Delete**: Users can only delete their own services
- **Public Status**: Anyone can view services marked `is_public: true` without authentication

### Monitoring Intervals
- Minimum: 30 seconds
- Maximum: No limit (recommended 300 seconds for production)
- Default: 30 seconds
- All services are checked by the scheduler every 30 seconds regardless of individual interval

### Alerts
- Sent when status changes (UP → DOWN or DOWN → UP)
- Requires SMTP configuration in backend .env
- Email goes to ADMIN_EMAIL from .env
- Check `/api/alerts` to view alert history

### Response Times
- HTTP/HTTPS: Milliseconds from request to response headers
- ICMP: Milliseconds for ping round-trip
- TCP: Milliseconds to establish connection

---

## Troubleshooting

### 401 Unauthorized
**Cause**: Missing or invalid JWT token
**Solution**: 
1. Verify token is included in Authorization header
2. Check token format: `Bearer YOUR_TOKEN` (space is required)
3. Token may have expired, login again to get new token

### 403 Forbidden
**Cause**: Attempting to modify another user's service
**Solution**: 
1. Verify you own the service (created it)
2. Check service_id is correct
3. Admin user cannot modify for other users

### 422 Unprocessable Entity
**Cause**: Invalid field values
**Solution**:
1. Check field types (string, integer, boolean)
2. For IP addresses: Use valid IPv4 format (e.g., 192.168.1.1)
3. For URLs: Include protocol (http:// or https://)
4. For ports: Use 1-65535 range

### Service Shows "Down" Constantly
**Causes**:
1. IP/URL is not reachable from server
2. Firewall blocking requests
3. Device/service not running
**Solution**:
1. Test from server: `ping IP` or `curl URL`
2. Check firewall rules
3. Verify service/device is running
4. Check error message in check history

### No Email Alerts
**Cause**: SMTP not configured
**Solution**:
1. Check backend .env file has SMTP settings:
   - SMTP_HOST
   - SMTP_PORT
   - SMTP_USER
   - SMTP_PASSWORD
   - ADMIN_EMAIL
2. Test SMTP credentials
3. Check /api/alerts to see if alerts were triggered

---

Last Updated: 2024-01-15
Version: 1.0
