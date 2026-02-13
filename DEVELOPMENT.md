# 🐉 DragonPing — Development Guide

Complete development guide for DragonPing project structure, components, and workflows.

---

## 📁 Frontend Directory Structure

```
frontend/
├── src/
│   ├── api/
│   │   └── services.js              # Axios API client with all backend calls
│   │
│   ├── components/                  # Reusable React components
│   │   ├── Navbar.jsx               # Navigation bar with routing
│   │   ├── ServiceCard.jsx          # Service display card
│   │   ├── StatusBadge.jsx          # Status indicator (UP/DOWN/SLOW)
│   │   └── ResponseChart.jsx        # Chart.js response time graph
│   │
│   ├── pages/                       # Full page components
│   │   ├── Dashboard.jsx            # Main dashboard page
│   │   ├── AddService.jsx           # Add service form page
│   │   └── Logs.jsx                 # Check history page
│   │
│   ├── App.jsx                      # Root component with routing
│   ├── main.jsx                     # React entry point
│   └── index.css                    # Global styles + Tailwind
│
├── public/                          # Static assets
├── .env                             # Environment variables
├── .gitignore
├── index.html                       # HTML entry
├── package.json                     # Dependencies
├── vite.config.js                   # Vite configuration
├── tailwind.config.js               # Tailwind CSS config
├── postcss.config.js                # PostCSS config
└── README.md                        # Frontend docs
```

---

## 🧩 Component Overview

### Page Components

#### Dashboard (`src/pages/Dashboard.jsx`)

**Purpose:** Main landing page showing all services and their status

**Features:**

- Summary statistics (total, up, down, uptime %)
- Grid of service cards
- Auto-refresh every 15 seconds
- Response time chart for selected service
- Delete service functionality

**State:**

```javascript
{
  services: [],              // List of all services
  summary: {},              // Summary statistics
  loading: false,           // Loading state
  error: null,              // Error message
  selectedServiceId: null,  // Selected service for chart
  selectedChecks: []        // Check history for chart
}
```

**API Calls:**

- `getServices()` — Fetch all services
- `getStatusSummary()` — Get summary stats
- `getServiceChecks(serviceId)` — Get check history
- `deleteService(serviceId)` — Delete service

#### AddService (`src/pages/AddService.jsx`)

**Purpose:** Form to add new service to monitor

**Fields:**

- `name` — Service name (required)
- `url` — Website URL (required, validated)
- `description` — Optional description
- `interval` — Check interval 10-3600s (required)
- `active` — Enable monitoring toggle

**Validation:**

- Name not empty
- URL valid format
- Interval between 10-3600
- URL unique check (backend)

**Features:**

- Form validation
- Error messages
- Success message
- Auto-redirect to dashboard

**API Calls:**

- `addService(data)` — Create new service

#### Logs (`src/pages/Logs.jsx`)

**Purpose:** View detailed check history and statistics

**Features:**

- Service selector dropdown
- Summary statistics (total, up, down, avg response)
- Sortable table (click headers)
- CSV export button
- Show first 100 records with pagination

**Columns:**

- Time — Check timestamp (sortable)
- Status — UP/DOWN badge (sortable)
- Response Time — In ms (sortable)
- Status Code — HTTP status
- Error — Error message if failed

**State:**

```javascript
{
  services: [],
  selectedServiceId: null,
  checks: [],
  loading: false,
  error: null,
  sortConfig: { key: 'checked_at', direction: 'desc' },
  expandedChecks: new Set()  // Future: expand for details
}
```

**API Calls:**

- `getServices()` — Get available services
- `getServiceChecks(serviceId, limit)` — Get check history

### Reusable Components

#### Navbar (`src/components/Navbar.jsx`)

**Props:** None (uses React Router hooks)

**Features:**

- Navigation to /, /add, /logs
- Active page highlighting
- Logo display
- Live status indicator
- Responsive mobile menu

**Styling:**

- Dark theme (bg-dark-800)
- Green highlight for active (status-up)
- Sticky positioning

#### ServiceCard (`src/components/ServiceCard.jsx`)

**Props:**

```javascript
{
  service: {
    id: number,
    name: string,
    url: string,
    status: 'UP' | 'DOWN',
    uptime_percentage: number,
    last_check_response_time: number,
    avg_response_time: number,
    total_checks: number,
    last_check: string (ISO date)
  },
  onDelete: (serviceId) => void,  // Delete callback
  onClick: (serviceId) => void    // Select callback
}
```

**Features:**

- Service name and URL display
- Status badge with response time
- Grid of metrics (response time, uptime, avg, total)
- Last check timestamp
- Colored status bar (green/red)
- Delete button with confirmation

#### StatusBadge (`src/components/StatusBadge.jsx`)

**Props:**

```javascript
{
  status: 'UP' | 'DOWN',
  responseTime?: number,
  isSlowResponse?: boolean
}
```

**Features:**

- Status indicator with icon
- Color coding (green/red/yellow)
- Optional response time display
- Up/Down/Slow labels

**Colors:**

- UP: Green (#10b981)
- DOWN: Red (#ef4444)
- SLOW: Yellow (#f59e0b)

#### ResponseChart (`src/components/ResponseChart.jsx`)

**Props:**

```javascript
{
  checks: [{
    id: number,
    response_time: number,
    checked_at: string (ISO date),
    status: 'UP' | 'DOWN'
  }],
  title?: string
}
```

**Features:**

- Line chart of response times
- Last 50 checks displayed
- X-axis: Time
- Y-axis: Response time (ms)
- Hover tooltips
- Responsive sizing
- Dark theme compatible

**Chart.js Configuration:**

- BorderColor: Green (#10b981)
- BackgroundColor: Green with transparency
- PointRadius: 4, HoverRadius: 6
- Tension: 0.4 (smooth curve)

---

## 🔌 API Service Layer (`src/api/services.js`)

### Configuration

```javascript
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const apiClient = axios.create({ baseURL: API_BASE_URL });
```

### Functions

#### Services Management

```javascript
// Get all services
getServices(skip = 0, limit = 100, activeOnly = false)
// Returns: [{ id, name, url, interval, active, ... }]

// Get single service
getService(serviceId)
// Returns: { id, name, url, interval, active, ... }

// Create service
addService({ name, url, description, interval, active })
// Returns: { id, name, url, ... }

// Update service
updateService(serviceId, { name, active, ... })
// Returns: { id, name, url, ... }

// Delete service
deleteService(serviceId)
// Returns: void
```

#### Status & Monitoring

```javascript
// Get service status and stats
getServiceStatus(serviceId);
// Returns: { service_id, name, status, uptime_percentage, avg_response_time, ... }

// Get service check history
getServiceChecks(serviceId, (limit = 50));
// Returns: [{ id, service_id, status, response_time, checked_at, ... }]

// Get all services status summary
getStatusSummary();
// Returns: { total_services, up_services, down_services, services: [...] }
```

#### Utility Functions

```javascript
// Get status badge info
getStatusInfo(status, responseTime);
// Returns: { status, color, label, icon }

// Format response time
formatResponseTime(ms); // Returns: "145ms" or "2.15s"

// Format date time
formatDateTime(dateString); // Returns: "Feb 13, 10:15:30"

// Format uptime percentage
formatUptimePercentage(percentage); // Returns: "98.50%"
```

---

## 🎨 Styling Guide

### Tailwind CSS Color Scheme

**Dark Theme:**

```css
bg-dark-900   /* Darkest background */
bg-dark-800   /* Card/section background */
bg-dark-700   /* Hover states */
text-dark-50  /* Brightest text */
text-dark-400 /* Secondary text */
```

**Status Colors:**

```css
text-status-up    /* Green (#10b981) - UP */
text-status-down  /* Red (#ef4444) - DOWN */
text-status-slow  /* Yellow (#f59e0b) - SLOW */
```

### Utility Classes (in `index.css`)

```css
.card              /* Card styling */
.btn-primary       /* Primary button (green) */
.btn-secondary     /* Secondary button (dark) */
.btn-danger        /* Danger button (red) */
.input-field       /* Form input styling */
.badge             /* Badge styling */
.badge-up          /* Green badge */
.badge-down        /* Red badge */
.badge-slow        /* Yellow badge */
.grid-responsive   /* Responsive grid 1/2/3 cols */
```

### Responsive Breakpoints

- `sm:` — 640px
- `md:` — 768px
- `lg:` — 1024px
- `xl:` — 1280px

---

## ⚙️ State Management

### Data Flow

```
App.jsx (Router Setup)
    ↓
Pages (Dashboard, AddService, Logs)
    ├─ useState for local state
    ├─ useEffect for API calls
    └─ Components (receive props)
        ├─ Navbar (uses useLocation hook)
        ├─ ServiceCard (display + callbacks)
        ├─ StatusBadge (simple display)
        └─ ResponseChart (graph display)
```

### State Patterns

**Page-level State:**

```javascript
const [services, setServices] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
```

**Fetch Data Effect:**

```javascript
useEffect(() => {
  fetchData();
  const interval = setInterval(fetchData, 15000);
  return () => clearInterval(interval);
}, []);
```

**Event Handlers:**

```javascript
const handleDelete = async (serviceId) => {
  await deleteService(serviceId);
  setServices(services.filter((s) => s.id !== serviceId));
};
```

---

## 🚀 Development Workflow

### Adding a New Page

1. Create `src/pages/NewPage.jsx`
2. Import in `src/App.jsx`
3. Add route: `<Route path="/new" element={<NewPage />} />`
4. Add link in `Navbar.jsx`

### Adding a New Component

1. Create `src/components/NewComponent.jsx`
2. Define props
3. Export as default
4. Import where needed

### Adding an API Function

1. Add to `src/api/services.js`
2. Use axios: `apiClient.get/post/put/delete(path)`
3. Handle errors
4. Export function

### Styling Tips

- Use Tailwind classes first
- Add custom CSS in `index.css` only if needed
- Follow dark theme convention (bg-dark-_, text-dark-_)
- Use status colors for UP/DOWN states
- Always make responsive with md: breakpoints

---

## 🔄 Common Workflows

### Fetching Data with Auto-Refresh

```javascript
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getServices();
      setServices(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
  const interval = setInterval(fetchData, 15000);
  return () => clearInterval(interval);
}, []);
```

### Form Submission

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) return;

  try {
    setLoading(true);
    await addService(formData);
    // Reset form
    setFormData({});
    // Navigate
    navigate("/");
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

### Conditional Rendering

```javascript
{
  loading && <LoadingSpinner />;
}
{
  error && <ErrorAlert message={error} />;
}
{
  services.length > 0 ? <ServiceGrid services={services} /> : <EmptyState />;
}
```

---

## 🧪 Testing Components

### Manual Testing Checklist

- [ ] Dashboard loads
- [ ] Add service form works
- [ ] Service appears on dashboard
- [ ] Wait 30s for first check
- [ ] Status updates to UP/DOWN
- [ ] Response time displays
- [ ] Logs page shows history
- [ ] Sort by column works
- [ ] CSV export works
- [ ] Delete service works
- [ ] Mobile responsive on phone
- [ ] No console errors

### Testing with Different URLs

```
https://www.google.com          ✅ UP (always works)
https://www.example.com         ✅ UP (always works)
https://www.github.com          ✅ UP (always works)
https://invalid123456.com       ❌ DOWN (for testing)
http://localhost:8000           ⏱️ SLOW (internal server)
```

---

## 🐛 Debugging Tips

### Browser Console Errors

1. Open DevTools (F12)
2. Go to Console tab
3. Look for red errors
4. Check Network tab for failed requests

### Common Issues

**API calls not working:**

- Check VITE_API_URL in .env
- Verify backend is running
- Check CORS headers

**Styling not applied:**

- Clear browser cache (Ctrl+Shift+Delete)
- Verify Tailwind classes used correctly
- Check postcss.config.js

**State not updating:**

- Check component re-renders (add console.log)
- Verify useState hooks
- Check useEffect dependencies

---

## 📚 File Sizes Guide

Keep these in mind for performance:

- Individual component < 300 lines
- Page component < 500 lines
- Total bundle size target < 1MB
- CSS utilities only in index.css

---

## 🎯 Next Steps for Enhancement

### Quick Wins (1-2 hours)

- [ ] Add loading skeleton screens
- [ ] Add service filtering/search
- [ ] Add time range picker for logs
- [ ] Add uptime percentage trending

### Medium Tasks (4-8 hours)

- [ ] Add service categories/tags
- [ ] Add alert thresholds
- [ ] Add service groups
- [ ] Add detailed service view

### Advanced Tasks (16+ hours)

- [ ] Real-time updates with WebSocket
- [ ] User authentication
- [ ] Multi-user support
- [ ] Custom themes

---

## 📖 Useful Links

- [React Documentation](https://react.dev/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)
- [Chart.js Docs](https://www.chartjs.org/)
- [Lucide Icons](https://lucide.dev/)
- [React Router](https://reactrouter.com/)
- [Axios Documentation](https://axios-http.com/)

---

**Happy Coding! 🚀**
