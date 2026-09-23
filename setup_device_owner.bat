@echo off
title Installment Guard - Device Owner Provisioning Tool
color 0A
echo ===================================================
echo   INSTALLMENT GUARD - 1-CLICK DEVICE OWNER TOOL
echo ===================================================
echo.

set ADB_CMD=adb
where adb >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    set ADB_CMD="%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"
)

%ADB_CMD% devices
echo.
echo Connecting to device...
echo.

%ADB_CMD% shell dpm set-device-owner com.example.installment_guard/.device.InstallmentAdminReceiver

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===================================================
    echo  SUCCESS: Device Owner & Protection Granted!
    echo  App is now protected against Uninstall/Force Stop.
    echo ===================================================
) else (
    echo.
    echo ===================================================
    echo  FAILED! Make sure:
    echo  1. USB Debugging is ON.
    echo  2. Google/Gmail Account is temporarily removed from phone.
    echo ===================================================
)

echo.
pause
