# Installment Guard - Admin Backend Specification

## 1. Overview
The Installment Guard Admin Backend manages device enrollments, contract lifecycle, installment payment schedules, automated restriction policies, and administrative security commands.

All financial transitions and device restriction decisions are strictly server-side driven.

---

## 2. Database Schema (Firestore / PostgreSQL)

### 2.1 Devices Collection (`/devices/{deviceId}`)
```json
{
  "deviceId": "ANDROID_ID_OR_HARDWARE_ID",
  "contractId": "CTR-2026-8899",
  "customerId": "CUST-10293",
  "imei": "864293048571029",
  "manufacturer": "Samsung",
  "model": "Galaxy A54",
  "androidVersion": "14.0",
  "sdkVersion": 34,
  "appVersion": "1.0.0",
  "enrollmentStatus": "COMPLETED",
  "managementStatus": "MANAGED",
  "deviceStatus": "ACTIVE",
  "lastCheckIn": "2026-09-12T13:15:00Z",
  "lastCommand": "SYNC_DEVICE",
  "lastCommandStatus": "EXECUTED",
  "createdAt": "2026-08-01T10:00:00Z",
  "updatedAt": "2026-09-12T13:15:00Z"
}
```

### 2.2 Contracts Collection (`/contracts/{contractId}`)
```json
{
  "contractId": "CTR-2026-8899",
  "customerId": "CUST-10293",
  "deviceId": "ANDROID_ID_OR_HARDWARE_ID",
  "totalPrice": 100000.0,
  "downPayment": 20000.0,
  "remainingBalance": 80000.0,
  "monthlyInstallment": 10000.0,
  "dueDateDay": 10,
  "gracePeriodDays": 5,
  "status": "ACTIVE",
  "createdAt": "2026-08-01T10:00:00Z"
}
```

---

## 3. Admin Command Pipeline

Supported Commands:
- `SYNC_DEVICE`: Requests immediate device state & policy compliance check-in.
- `RESTRICT_DEVICE`: Triggers native lock task mode and overdue warning overlay.
- `REMOVE_RESTRICTION`: Clears lock task mode and restores full phone functionality post-payment.
- `CHECK_STATUS`: Fetches live device health, battery, and network status.
- `UPDATE_POLICY`: Updates internal management policy settings.

Command Data Structure (`/admin_commands/{commandId}`):
```json
{
  "commandId": "CMD-99812",
  "deviceId": "ANDROID_ID_OR_HARDWARE_ID",
  "adminId": "ADMIN-OPERATOR-04",
  "commandType": "RESTRICT_DEVICE",
  "payload": {
    "reason": "Payment Overdue > 5 Days",
    "contractId": "CTR-2026-8899"
  },
  "status": "PENDING",
  "failureReason": null,
  "createdAt": "2026-09-12T13:00:00Z",
  "executedAt": null
}
```

---

## 4. Payment Verification Workflow
```
Customer Makes Payment
      │
      ▼
Payment Gateway / Cash Deposit Verified by Server
      │
      ▼
Backend marks Installment as PAID
      │
      ▼
Backend updates Device Status to ACTIVE
      │
      ▼
Backend dispatches REMOVE_RESTRICTION command to Device
      │
      ▼
Native Kotlin DevicePolicyService clears lock task mode
```
