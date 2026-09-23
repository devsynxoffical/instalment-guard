# Disable R8 aggressive optimization crash & missing play core warnings
-dontoptimize
-dontobfuscate
-dontwarn com.google.android.play.**
-dontwarn io.flutter.**
-dontwarn androidx.**

# Keep Flutter Engine & Plugin Registrant
-keep class io.flutter.** { *; }
-keepclassmembers class io.flutter.** { *; }
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }

# Keep App & Native Device Management
-keep class com.example.installment_guard.** { *; }
-keepclassmembers class com.example.installment_guard.** { *; }

# Keep AndroidX & WorkManager
-keep class androidx.work.** { *; }
-keep class androidx.startup.** { *; }
-keep public class * extends android.app.admin.DeviceAdminReceiver
-keep public class * extends android.content.BroadcastReceiver
-keep public class * extends android.app.Service
-keep public class * extends android.app.Activity
