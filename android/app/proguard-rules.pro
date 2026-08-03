# Flutter Secure Storage
-keep class com.it_nomads.fluttersecurestorage.** { *; }
-dontwarn com.it_nomads.fluttersecurestorage.**

# HTTP package
-keep class io.flutter.plugins.** { *; }
-keep class com.brianmt.flutter.** { *; }

# Crypto (HMAC SHA256)
-keep class javax.crypto.** { *; }
-keep class java.security.** { *; }
-keep class sun.misc.** { *; }
-dontwarn javax.crypto.**
-dontwarn java.security.**

# Keep JSON serialization
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# Keep model classes
-keep class com.nor.mexc_event_trader.models.** { *; }
-keep class com.nor.mexc_event_trader.services.** { *; }

# General Flutter
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }
-keep class com.google.firebase.** { *; }
-dontwarn io.flutter.embedding.**
