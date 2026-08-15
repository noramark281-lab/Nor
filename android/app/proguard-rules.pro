# ProGuard rules for MEXC Futures Trading App
# Keep JSON model classes used by dart:convert / http
-keepattributes Signature
-keepattributes *Annotation*
-keepattributes Exceptions
-keepattributes InnerClasses
-keepattributes EnclosingMethod

# Keep classes used by Flutter plugins
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

# Keep dart:convert JSON models
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# Keep provider and state management classes
-keep class com.example.** { *; }

# Keep network classes
-keepclassmembers class * {
    *** *Callback;
}

# OkHttp / Retrofit (if used by any native plugin)
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# WebSocket
-keep class org.java_websocket.** { *; }

# Prevent obfuscation of enums used in JSON
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Google Play Core / SplitCompat (referenced by Flutter R8)
-dontwarn com.google.android.play.core.splitcompat.**
-dontwarn com.google.android.play.core.splitinstall.**
-dontwarn com.google.android.play.core.tasks.**
