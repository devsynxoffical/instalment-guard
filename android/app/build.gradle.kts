plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "com.example.installment_guard"
    compileSdk = flutter.compileSdkVersion
    buildToolsVersion = "35.0.0"
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        // Unique Application ID
        applicationId = "com.example.installment_guard"
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
        manifestPlaceholders["appName"] = "Installment Guard"
    }

    flavorDimensions += "app"
    productFlavors {
        create("guard") {
            dimension = "app"
            applicationId = "com.example.installment_guard"
            manifestPlaceholders["appName"] = "Installment Guard"
        }
        create("retailer") {
            dimension = "app"
            applicationId = "com.example.installment_guard.retailer"
            manifestPlaceholders["appName"] = "Retailer Hub"
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("debug")
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}

dependencies {
    implementation("androidx.work:work-runtime-ktx:2.9.0")
}

