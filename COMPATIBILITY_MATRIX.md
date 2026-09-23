# Installment Guard - Compatibility & Lifecycle Matrix

## 1. Operating System & Hardware Compatibility

| Android Version | API Level | Device Owner Support | Policy Restrictions | Factory Reset Block | Kiosk/Restriction Lock |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Android 10.0 | API 29 | Fully Supported | Supported | Supported (`DISALLOW_FACTORY_RESET`) | Supported (`setLockTaskPackages`) |
| Android 11.0 | API 30 | Fully Supported | Supported | Supported | Supported |
| Android 12.0 | API 31 | Fully Supported | Supported | Supported | Supported |
| Android 13.0 | API 33 | Fully Supported | Supported | Supported | Supported |
| Android 14.0+ | API 34+ | Fully Supported | Supported | Supported | Supported |

---

## 2. Manufacturer & OEM Specific Behaviors

| OEM | Provisioning Mode | Custom Security Layer | App Auto-Start | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Samsung** | Knox Mobile Enrollment / ADB / QR | Knox Security Platform | Automatic | Recommended for enterprise deployment. |
| **Xiaomi / Redmi** | Zero-Touch / ADB / QR | MIUI / HyperOS Security | Enable Autostart | Ensure MIUI optimization setting is preserved. |
| **Vivo / iQOO** | Zero-Touch / ADB / QR | FuntouchOS Manager | Enable Autostart | Standard DevicePolicyManager APIs functional. |
| **Oppo / Realme** | Zero-Touch / ADB / QR | ColorOS Battery Manager | Background Allowed | Lock Task Mode functional under DeviceOwner. |
| **Google Pixel / Motorola** | Zero-Touch / ADB / QR | Stock Android Security | Automatic | Clean standard Android Enterprise behavior. |

---

## 3. System Event Lifecycle Behaviors

| Event Scenario | System Behavior | Installment Guard Reaction |
| :--- | :--- | :--- |
| **Device Reboot** | `BOOT_COMPLETED` triggered | `BootReceiver` runs, re-verifies restriction policy, and schedules WorkManager heartbeat. |
| **Network Disconnection** | Offline Mode | Retains last valid management policy. Grace period active. Does not un-restrict phone. |
| **SIM Card Replacement** | Hardware Broadcast | Device ID remains bound to contract. Heartbeat flags SIM change event to backend. |
| **Factory Reset Attempt** | Blocked by Policy | User restriction `DISALLOW_FACTORY_RESET` disables factory reset option in Settings menu. |
| **Application Update** | Package Overwritten | Device Owner privilege persists across app package updates. |
| **Failed Enrollment** | Un-provisioned | Device remains in Setup Mode (`DeviceSetupScreen`) until valid enrollment completes. |
