# MEXC Event Trader

تطبيق تداول عقود الحدث في منصة MEXC (MEXC Event Contracts Trading App).

## المميزات

- ✅ تداول عقود الحدث (Event Contracts) في MEXC
- ✅ 5 استراتيجيات تداول آلية
- ✅ مصادقة بيومترية (بصمة الوجه / البصمة)
- ✅ تخزين آمن لمفاتيح API
- ✅ شاشة تحليل فني متقدمة
- ✅ واجهة عربية كاملة
- ✅ تحديث فوري للأسعار
- ✅ تاريخ الصفقات والأرباح

## التثبيت

1. قم بتحميل APK من Releases
2. قم بتفعيل "تثبيت من مصادر غير معروفة" في إعدادات Android
3. ثبت التطبيق وافتحه
4. أدخل مفاتيح API الخاصة بك من MEXC (الإعدادات > API Management)
5. ابدأ التداول!

## بناء المشروع محلياً

```bash
flutter pub get
flutter build apk --release
```

## الأمان

- مفاتيح API تُخزّن باستخدام **flutter_secure_storage** (Keystore/Keychain)
- يتم تشفير البيانات الحساسة بـ AES-256
- يتطلب المصادقة البيومترية للوصول إلى مفاتيح API
- لا يُرسل المفاتيح أبداً خارج الجهاز

## CI/CD

يتم بناء APK تلقائياً عبر GitHub Actions ونشره في Releases.

### رابط آخر إصدار
https://github.com/noramark281-lab/Nor/releases/latest

### متطلبات التشغيل
- Android 6.0+ (API 23+)
- اتصال إنترنت مستقر
- مفاتيح API من MEXC (للتداول الحقيقي)
