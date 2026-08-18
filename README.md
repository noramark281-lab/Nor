# MEXC Event Trader

تطبيق تداول العقود المستقبلية في منصة MEXC (MEXC Futures Trading App).

## المميزات

- ✅ تداول **حقيقي** مباشر على منصة MEXC (عقود مستقبلية - Futures Trading)
- ✅ تنفيذ أوامر السوق (Market Orders) والأوامر المحددة (Limit Orders)
- ✅ رصيد USDT حقيقي مباشر من حسابك
- ✅ تحديث فوري للأسعار والأرباح/الخسائر (PnL)
- ✅ 5 استراتيجيات تداول آلية
- ✅ مصادقة بيومترية (بصمة الوجه / البصمة)
- ✅ تخزين آمن لمفاتيح API
- ✅ شاشة تحليل فني متقدمة (RSI, SMA, EMA, MACD)
- ✅ واجهة عربية كاملة
- ✅ تاريخ الصفقات والأرباح

---

## ⚠️ تحذير هام

هذا التطبيق يقوم بـ **تداول حقيقي** بأموال حقيقية. تأكد من:
- فهمك الكامل لمخاطر التداول قبل البدء.
- استخدام مفاتيح API فقط بصلاحيات **Spot/تداول فوري** (لا تمنع صلاحيات السحب).
- اختبار الاستراتيجيات بمبالغ صغيرة أولاً.

---

## طرق إعداد مفاتيح API

### الطريقة 1: إدخال داخل التطبيق (موصى به للمستخدمين العاديين)

1. افتح التطبيق وانتقل إلى **الإعدادات > إعداد API**.
2. أدخل `API Key` و `Secret Key` الخاصين بك من MEXC.
3. سيتم تخزينهما بشكل آمن داخل الجهاز عبر `flutter_secure_storage`.
4. يتطلب فتح التطبيق المصادقة البيومترية (بصمة / وجه).

### الطريقة 2: تضمين عند البناء (Build-time) - للمطورين/CI

إذا كنت تبني APK خاص بك أو تستخدم CI/CD:

```bash
flutter build apk --release \
  --dart-define=MEXC_API_KEY=your_api_key_here \
  --dart-define=MEXC_SECRET_KEY=your_secret_key_here
```

في GitHub Actions، أضف المفاتيح كـ **Repository Secrets**:
- `MEXC_API_KEY`
- `MEXC_SECRET_KEY`

ثم يقوم workflow `.github/workflows/build_apk.yml` بقراءتهما تلقائياً وتضمينها في البناء.

---

## الحصول على مفاتيح API من MEXC

1. سجل الدخول إلى [MEXC](https://www.mexc.com).
2. اذهب إلى **API Management** (إدارة API) ← اختر **Futures API**.
3. أنشئ مفتاح جديد.
4. فعّل صلاحيات **Futures/Contract Trading** فقط.
5. احفظ الـ `API Key` و `Secret Key` في مكان آمن (لن يُعرض الـ Secret مرة أخرى).

---

## التثبيت

1. قم بتحميل APK من [Releases](https://github.com/noramark281-lab/Nor/releases/latest).
2. فعّل "تثبيت من مصادر غير معروفة" في إعدادات Android.
3. ثبّت التطبيق وافتحه.
4. أدخل مفاتيح API الخاصة بك (أو استخدم نسخة مُبنية مسبقاً بالمفاتيح).
5. ابدأ التداول!

---

## بناء المشروع محلياً

```bash
# 1. تثبيت الاعتماديات
flutter pub get

# 2. بناء APK عادي (بدون مفاتيح مُضمنة - يُدخلها المستخدم لاحقاً)
flutter build apk --release

# 3. بناء APK مع مفاتيح مُضمنة (للتداول المباشر فور التثبيت)
flutter build apk --release \
  --dart-define=MEXC_API_KEY=your_api_key \
  --dart-define=MEXC_SECRET_KEY=your_secret_key
```

---

## الأمان

- مفاتيح API تُخزّن باستخدام **flutter_secure_storage** (Android Keystore / iOS Keychain).
- تشفير AES-256 للبيانات الحساسة.
- يتطلب المصادقة البيومترية (بصمة الوجه / البصمة) للوصول إلى مفاتيح API.
- **لا يُرسل المفاتيح أبداً خارج الجهاز**.
- توقيع HMAC-SHA256 لكل طلب API مع مزامنة الوقت مع خادم MEXC.
- حماية من هجمات التكرار (Rate Limiting) وإعادة المحاولة الذكية.

---

## CI/CD

يتم بناء APK تلقائياً عبر GitHub Actions ونشره في Releases.

### متطلبات تشغيل Workflow

أضف secrets التالية في إعدادات المستودع (Settings > Secrets and variables > Actions):

| Secret Name       | الوصف                              |
|-------------------|-----------------------------------|
| `MEXC_API_KEY`    | مفتاح API الخاص بك من MEXC         |
| `MEXC_SECRET_KEY` | المفتاح السري الخاص بك من MEXC      |

### رابط آخر إصدار
https://github.com/noramark281-lab/Nor/releases/latest

### متطلبات التشغيل
- Android 6.0+ (API 23+)
- اتصال إنترنت مستقر
- مفاتيح API من MEXC (للتداول الحقيقي)

---

## الاستراتيجيات المتوفرة

1. **Trend Following** - تتبع الاتجاه باستخدام SMA و EMA.
2. **RSI Reversal** - دخول عند ذروة الشراء/البيع باستخدام مؤشر RSI.
3. **MACD Crossover** - دخول عند تقاطع خطوط MACD.
4. **Breakout** - دخول عند اختراق مستويات الدعم/المقاومة.
5. **Grid Trading** - شبكة أوامر بيع/شراء على فترات سعرية متساوية.

---

## المساهمة

نرحب بالمساهمات! يرجى فتح Issue أو Pull Request.

---

## الترخيص

هذا المشروع مفتوح المصدر. استخدمه على مسؤوليتك الخاصة.
