# Installment Guard - Device Provisioning & Setup Guide

## 1. Lifecycle Overview
```
NEW PHONE (Out of Box)
       │
       ▼
SHOP DEVICE PREPARATION (ADB / QR Code / Zero-Touch)
       │
       ▼
DEVICE IDENTIFICATION & CONTRACT LINKING
       │
       ▼
ANDROID DEVICE PROVISIONING (Device Owner Granted)
       │
       ▼
INSTALLMENT GUARD MANAGEMENT ACTIVE
       │
       ▼
FINAL DEVICE CHECK & HANDOVER TO CUSTOMER
```

---

## 2. Shop Device Preparation Methods

### Method A: ADB Developer & Shop Provisioning (Recommended for Testing)
1. Turn on phone, complete initial basic setup without adding a personal Google Account.
2. Enable **Developer Options** -> **USB Debugging**.
3. Connect phone to shop computer via USB.
4. Execute ADB command to grant `DeviceOwner` privilege to Installment Guard:
   ```bash
   adb shell dpm set-device-owner com.example.installment_guard/.device.InstallmentAdminReceiver
   ```
5. Verify output:
   `Success: Device owner set to package com.example.installment_guard`

---

### Method B: QR Code Provisioning (Out-of-the-Box Setup)
1. Turn on brand new phone (or factory reset phone) at the "Welcome" screen.
2. Tap the screen 6 times in the same spot to activate QR Code scanner.
3. Scan the generated Android Enterprise QR code containing the payload below:

```json
{
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": "com.example.installment_guard/.device.InstallmentAdminReceiver",
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": "https://your-server.com/apk/installment_guard.apk",
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM": "YOUR_APK_SHA256_CHECKSUM",
  "android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED": true,
  "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
    "contractId": "CTR-2026-8899"
  }
}
```

---

### Method C: Samsung Knox Mobile Enrollment (KME) / Google Zero-Touch
- Pre-register device IMEIs in Samsung KME / Google Zero-Touch console.
- Assign Installment Guard DPM profile.
- When device connects to Wi-Fi on first boot, Android automatically downloads and installs Installment Guard in `DeviceOwner` mode.
