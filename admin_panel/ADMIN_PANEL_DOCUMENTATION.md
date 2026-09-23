# 🛡️ Installment Guard - React Admin Panel Documentation

## 📄 Executive Summary

The **Installment Guard React Admin Panel** is a standalone, web-based central management platform built for installment-based mobile phone safety and lock enforcement. It features a multi-tenant hierarchy with **Super Admin** and **Retailer** tiers, dynamic license credit distribution, mobile hardware telemetry inspection, and remote security command dispatching.

---

## 📁 File & Project Directory Structure

**Location**: [`c:\Users\Danial\Desktop\project\installment_guard\admin_panel`](file:///c:/Users/Danial/Desktop/project/installment_guard/admin_panel)

```text
installment_guard/
└── admin_panel/
    ├── src/
    │   ├── components/
    │   │   ├── AllocateCreditsModal.jsx   # Modal for Super Admin credit allocation to retailers
    │   │   ├── CommandActionModal.jsx     # Dispatcher for remote locks, unlocks & app hiding
    │   │   ├── EnrollDeviceModal.jsx      # Retailer device enrollment form (1 credit)
    │   │   ├── Navbar.jsx                 # Header bar with role switch & credit balance indicator
    │   │   ├── Sidebar.jsx                # Navigation sidebar (Dashboard, Devices, Retailers, etc.)
    │   │   ├── StatCard.jsx               # Analytical widget for dashboard stats
    │   │   └── TelemetryModal.jsx         # Deep inspection popup for mobile hardware specs & GPS
    │   ├── context/
    │   │   └── AuthContext.jsx            # Global state manager for RBAC & real-time updates
    │   ├── services/
    │   │   └── adminData.js               # Data service with persistent LocalStorage storage
    │   ├── views/
    │   │   ├── AuditLogsView.jsx          # Security audit trail and action history log
    │   │   ├── ContractsView.jsx          # Installment ledger & payment processing view
    │   │   ├── DashboardView.jsx          # System summary & live device feed
    │   │   ├── DevicesView.jsx            # Live device control center & telemetry table
    │   │   └── RetailersView.jsx          # Super Admin retailer directory & credit manager
    │   ├── App.jsx                        # Root React layout and active view router
    │   └── index.css                      # Glassmorphism dark theme tokens & utility CSS
    ├── index.html                         # Entry HTML file
    ├── package.json                       # Dependencies (React 19, Lucide React, Vite)
    └── vite.config.js                     # Vite build configuration
```

---

## 👥 Role & Access Control Matrix (RBAC)

| Feature / Action | 👑 Super Admin | 🏪 Retailer |
| :--- | :---: | :---: |
| **System Overview & Global Stats** | Full Platform View | Retailer-Specific Stats |
| **Retailer Directory Management** | Create / Activate / Suspend | View Own Profile Only |
| **Credit Allocation & Billing** | Generate & Allocate Credits | Purchase Credits from Super Admin |
| **Credit Balance** | Unlimited Supply | Consumes 1 Credit per Device Enrollment |
| **Device Enrollment** | Global Override | Enrolls Customer Devices (Consumes Credit) |
| **Mobile Hardware Telemetry** | Inspect Any Device | Inspect Enrolled Devices |
| **Remote Device Lock / Unlock** | System-Wide Command Override | Command Assigned Devices |
| **Launcher App Hiding** | Command Any Device | Command Assigned Devices |
| **Security Audit Logs** | View All System Logs | View Own Action History |

---

## 📱 Mobile Hardware Telemetry Specifications

The Admin Panel monitors real-time telemetry transmitted from enrolled Android devices via native Device Policy integration:

| Category | Telemetry Attribute | Description |
| :--- | :--- | :--- |
| **Hardware** | **RAM Usage** | Total RAM (MB) & Currently Available RAM (MB) |
| **Storage** | **Internal Storage** | Total Storage Capacity (GB) & Free Disk Space (GB) |
| **Display** | **Screen Specs** | Screen Resolution (e.g., 1080x2400) & Density DPI |
| **Network** | **Connectivity** | Local/Cellular IP Address & Connection Type (Wi-Fi / 5G) |
| **Power** | **Battery Health** | Battery Percentage (%) & AC/USB Charging Status |
| **Security** | **Identifiers** | Hardware IMEI, Security Patch Level, Android Version |
| **Location** | **GPS Coordinates** | Live Latitude, Longitude & Map Location Pin |
| **System** | **Uptime** | Device Uptime in Seconds since last reboot |

---

## 🔐 Remote Security Command Dispatcher

From the **Devices Control Center**, admins can execute instant remote commands:

1. 🔒 **`RESTRICT_DEVICE` (Remote Lock)**:
   - Triggers native Android `startLockTask()` pin lock.
   - Launches fullscreen red overdue payment restriction overlay.
   - Blocks status bar expansion, task switching, and app launching.

2. 🔓 **`REMOVE_RESTRICTION` (Remote Unlock)**:
   - Stops native lock task overlay upon payment confirmation.
   - Restores normal Android home screen launcher and app usage.

3. 👁️ **`HIDE_APP` / `UNHIDE_APP` (Launcher Component Hiding)**:
   - Uses `setComponentEnabledSetting` to disable/enable the application's launcher icon on the phone's home screen.

4. 🔄 **`SYNC_DEVICE` (Telemetry Refresh)**:
   - Forces an immediate ping to fetch updated battery, location, and hardware status.

---

## 📊 Pre-Populated Sample Data

The admin panel comes pre-loaded with realistic sample data stored persistently in LocalStorage (`ig_admin_*`):

### Retailers:
- **Mobile Zone Saddar** (Karachi) - 25 Credits Available, 18 Active Devices.
- **Galaxy Mobile Hafeez Center** (Lahore) - 10 Credits Available, 35 Active Devices.
- **Al-Madina Traders** (Rawalpindi) - 0 Credits (Suspended Status).

### Devices & Contracts:
- `DEV-RMX3830-88` (Realme C53) - Active Contract `CTR-2026-9001` (Customer: M. Hamza).
- `DEV-SAM-A54-99` (Samsung Galaxy A54) - Restricted Contract `CTR-2026-9002` (Customer: Bilal Ahmed - Overdue).
- `DEV-XIA-NOTE13-05` (Xiaomi Redmi Note 13 Pro) - Active Contract `CTR-2026-9003` (Customer: Zubair Hassan).

---

## 🛠️ Developer & Operation Commands

### 1. Launch Development Server:
```powershell
cd c:\Users\Danial\Desktop\project\installment_guard\admin_panel
powershell -ExecutionPolicy Bypass -Command "npm run dev"
```

### 2. Build Production Web Bundle:
```powershell
cd c:\Users\Danial\Desktop\project\installment_guard\admin_panel
powershell -ExecutionPolicy Bypass -Command "npm run build"
```
*(Build artifacts are saved in `admin_panel/dist/` ready for web deployment on Vercel, Netlify, or Nginx)*.
