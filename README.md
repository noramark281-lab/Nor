# MEXC Event Trader

تطبيق Android حقيقي لتداول عقود الحدث (Event Contracts) في منصة MEXC.

## ⚠️ تحذير مهم
- هذا تطبيق حقيقي للتداول. لا يستخدم حساب تجريبي بشكل افتراضي.
- أدخل API Keys الخاصة بك في شاشة الإعدادات قبل التداول.
- ابدأ بمبالغ صغيرة جداً للاختبار.
- التطبيق يخزن API Keys مشفرة في جهازك فقط (AES-256 + flutter_secure_storage).

## 📱 الميزات
- ✅ تداول مباشر على MEXC Event Contracts
- 🤖 5 استراتيجيات بوت تداول تلقائي (Momentum, Mean Reversion, Breakout, Sentiment, Hybrid)
- 🔐 تشفير AES-256 + بصمة إصبع/وجه للحماية
- 📊 رسوم بيانية تفاعلية للأسعار
- 🌙 دعم الوضع الليلي/النهاري

## 🚀 التشغيل
```bash
flutter pub get
flutter run
```

## 📦 البناء
```bash
flutter build apk --release
```

## 🔗 روابط التحميل المباشر
يتم بناء APK تلقائياً عبر GitHub Actions:
- انتظر اكتمال workflow ثم اذهب إلى **Actions** → **Build & Release APK** → أحدث run
- أو اذهب إلى **Releases** للحصول على أحدث APK جاهز للتحميل