# DragonPing Frontend Auth - Quick Start Testing Guide

## Prerequisites

- Backend running on http://localhost:8000
- Frontend dev server on http://localhost:5173
- PostgreSQL database initialized

## Starting the Application

### Terminal 1 - Backend

```powershell
cd c:\Users\User\Desktop\lab\dragonping\backend
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --port 8000
```

Expected output:

```
INFO:     Started server process [XXXX]
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Terminal 2 - Frontend

```powershell
cd c:\Users\User\Desktop\lab\dragonping\frontend
npm run dev
```

Expected output:

```
  VITE v5.0.0  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

## Test Scenarios

### Test 1: Access Protected Route Without Authentication

**Steps**:

1. Open browser: http://localhost:5173/
2. **Expected**: Redirected to /login
3. Should see DragonLoader animation briefly during auth check

### Test 2: User Registration

**Steps**:

1. Go to http://localhost:5173/register
2. Fill form:
   - Email: newuser@test.com
   - Password: TestPassword123
   - Confirm: TestPassword123
3. Click "Sign Up"

**Expected Results**:

- ✅ No error message
- ✅ Redirected to dashboard (/)
- ✅ localStorage has `auth_token`
- ✅ Navbar shows email: newuser@test.com
- ✅ Dashboard displays services

**Test 2b: Registration Validation**

- Empty fields: Form won't submit (required)
- Password < 8 chars: Error "Password must be at least 8 characters"
- Passwords don't match: Error "Passwords do not match"

### Test 3: User Login

**Steps**:

1. Go to http://localhost:5173/login
2. Fill form:
   - Email: newuser@test.com
   - Password: TestPassword123
3. Click "Sign In"

**Expected Results**:

- ✅ Redirected to dashboard
- ✅ Same user logged in as registered

### Test 4: Logout

**Steps**:

1. Click "Logout" button in top-right of Navbar
2. **Expected**: Redirected to /login

**Verify**:

- localStorage has NO `auth_token` key
- Can access /public without logging in again
- Cannot access / (redirects to login)

### Test 5: Token Persistence

**Steps**:

1. Login with valid credentials
2. Verify on dashboard
3. Refresh page (F5)

**Expected**:

- ✅ Still logged in (DragonLoader shows briefly)
- ✅ Dashboard loads with user data
- ✅ localStorage still has token

### Test 6: Add Service (Protected Route)

**Steps**:

1. Login first
2. Click "Add Service" in navbar
3. Fill form and submit

**Expected**:

- ✅ Service created successfully
- ✅ JWT token in Authorization header (DevTools → Network)

### Test 7: API Token in Requests

**Steps**:

1. Open DevTools (F12)
2. Go to Network tab
3. Login
4. Create a service or refresh dashboard
5. Click on any API request to /api/\*

**Expected**:

- **Request Headers** should include:
  ```
  Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
  ```

### Test 8: Invalid Token Handling

**Steps**:

1. Login successfully
2. Open DevTools → Application → Local Storage
3. Manually modify `auth_token` (change a character)
4. Try to add a service

**Expected**:

- ✅ 401 error from backend
- ✅ Token cleared from localStorage
- ✅ Redirected to /login

### Test 9: Public Routes

**Steps**:

1. Logout or don't login
2. Visit http://localhost:5173/public

**Expected**:

- ✅ Page loads without authentication
- ✅ Shows public service status

### Test 10: Error Messages

**Login with wrong credentials**:

1. Go to /login
2. Email: test@example.com
3. Password: wrong
4. Click "Sign In"

**Expected**:

- ✅ Error message displayed: "Login failed" or specific error from backend

## DevTools Debugging

### Check Authentication State

```javascript
// In browser console:
localStorage.getItem("auth_token"); // Should be JWT token after login
localStorage.getItem("user_email"); // Should be user email
```

### View Network Requests

1. Open DevTools → Network tab
2. Filter by: `api` or `auth`
3. Look for Authorization header in requests
4. Check response status (200 = success, 401 = unauthorized, 500 = server error)

### Check Console Errors

- Should be clean (no red errors) during normal operation
- Any 401 errors are expected and handled automatically

## Common Issues & Fixes

### Issue: Stuck on Loading Screen

- Backend not running? Start it first
- Check http://localhost:8000/health returns `{"status":"healthy"}`

### Issue: "Cannot find module" errors

- Run `npm install` in frontend directory
- Restart dev server

### Issue: Can't login after registration

- Check backend is running
- Verify .env file has JWT_SECRET_KEY set
- Check database: `SELECT * FROM users;` in PostgreSQL

### Issue: CORS errors in console

- Backend CORS should allow localhost:5173
- Check main.py has correct CORS configuration

### Issue: Token not in API requests

- Check localStorage has `auth_token`
- Verify request interceptor in services.js is working
- Check DevTools Network tab for Authorization header

## Performance Testing

### Check Loading Performance

- DragonLoader should appear < 500ms on protected routes when authenticating
- Dashboard should load within 2 seconds
- API requests should complete within 1-2 seconds

### Check Network Usage

- Monitor DevTools → Network tab for request counts
- Look for duplicate requests (should be minimal)
- Check response sizes are reasonable

## Security Quick Check

- ✅ Password never sent in URLs
- ✅ Token stored in localStorage (consider httpOnly cookies for production)
- ✅ Token cleared on logout
- ✅ Protected routes redirect unauthorized users
- ✅ API endpoints validate token on backend
- ⚠️ HTTPS not enabled (enable in production)

## Browser Compatibility Test

Test on these browsers if possible:

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

Verify:

- Forms display correctly
- Responsive design on mobile (DevTools → Toggle device toolbar)
- No console errors
- DragonLoader animation plays smoothly

## Deployment Test Checklist

Before production deployment:

- [ ] Backend running without errors
- [ ] Database initialized with user table
- [ ] JWT_SECRET_KEY set in .env
- [ ] CORS configured for production domain
- [ ] HTTPS enabled
- [ ] Frontend build succeeds: `npm run build`
- [ ] Environment variables set (VITE_API_URL)
- [ ] Test registration → login → logout flow
- [ ] Test all protected routes accessible after login
- [ ] Test DragonLoader displays during auth check
- [ ] Test public routes accessible without login
- [ ] Test 401 errors trigger redirect to login

## Sample Test Data

To pre-populate test data, you can:

### Create test user via registration UI

- Email: admin@test.com
- Password: Admin@Test123

### Or via backend API (if admin endpoint exists)

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test@1234"}'
```

## Additional Resources

- Check [FRONTEND_AUTH_IMPLEMENTATION.md](FRONTEND_AUTH_IMPLEMENTATION.md) for detailed implementation
- Check [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for backend features
- Check backend [README.MD](backend/README.MD) for backend setup

---

Happy Testing! 🐉
