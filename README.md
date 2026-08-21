# Nor — MEXC Futures Trader

هذا المستودع يحتوي تطبيق Flutter لأندرويد مخصصاً للتعامل المباشر مع واجهات **MEXC Futures**. يعتمد التطبيق على أسعار وبيانات حساب صادرة من MEXC، ولا ينشئ نتيجة صفقة ناجحة في الواجهة إلا إذا أعادت المنصة استجابة نجاح تتضمن رقم طلب صالحاً.

> **تنبيه مخاطر:** هذا مشروع تقني للتكامل مع منصة تداول ولا يمثل نصيحة استثمارية أو ضماناً للربح. قد تؤدي الأوامر الحقيقية إلى خسارة رأس المال، ولذلك يجب استخدام مفاتيح API بصلاحيات مقيدة ومن دون صلاحية سحب.

## أساس الإصدار

اعتمدت بنية Flutter في جذر المستودع، وهي المطابقة لمصدر `nor.zip` المرفوع في المستودع. الإصدار الإنتاجي يستخدم فقط الإجراء الموحد [`android-production-release.yml`](.github/workflows/android-production-release.yml)، الذي يجري فحص المصدر، ويبني APK وAAB موقّعين، ويتحقق من توقيع APK، ثم ينشرهما في صفحة Releases عند الدمج في فرع `main`.

| المورد | الرابط |
| --- | --- |
| صفحة آخر إصدار موثوق | <https://github.com/noramark281-lab/Nor/releases/latest> |
| سجل عمليات البناء | <https://github.com/noramark281-lab/Nor/actions/workflows/android-production-release.yml> |
| مصدر المشروع | <https://github.com/noramark281-lab/Nor> |

## إعداد مفاتيح MEXC

يُدخل مالك الحساب مفتاح الوصول والمفتاح السري من داخل شاشة إعداد API في التطبيق. تُحفظ هذه القيم محلياً فقط عبر **Android Keystore** أو **iOS Keychain** باستخدام `flutter_secure_storage`، ولا يقرأ إجراء البناء مفاتيح MEXC ولا يضمّنها في APK أو AAB. توضح MEXC أن الواجهات الخاصة تحتاج إلى مفاتيح API وتوقيع HMAC-SHA256، وأن تقييد المفاتيح بعناوين IP موصى به. [1]

ينبغي إنشاء مفتاح مخصص للتطبيق، تعطيل صلاحية السحب، وتفعيل أقل صلاحيات ضرورية فقط. يتطلب تفعيل صلاحية أوامر Futures استيفاء متطلبات التحقق في MEXC بحسب إعدادات الحساب. [1]

## إعداد توقيع إصدار Android

لإنشاء إصدار يمكن تحديثه مستقبلاً، يحتاج الإجراء الموحد إلى هوية توقيع ثابتة. تحفظ القيم التالية في **Settings → Secrets and variables → Actions** داخل المستودع، ولا تُحفظ في الشيفرة أو في ملفات APK.

| اسم السر | الغرض |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | محتوى ملف keystore بترميز Base64. |
| `ANDROID_KEYSTORE_PASSWORD` | كلمة مرور keystore. |
| `ANDROID_KEY_ALIAS` | الاسم المستعار لمفتاح الإصدار. |
| `ANDROID_KEY_PASSWORD` | كلمة مرور المفتاح. |

لا تُستخدم أسرار MEXC في إعدادات البناء. إذا لم تكن أسرار التوقيع موجودة، يتوقف الإجراء بدلاً من إنشاء مفتاح عشوائي؛ ذلك يمنع إنتاج نسخ لا يمكن تحديثها لاحقاً.

## بناء محلي

بعد تهيئة Flutter وAndroid SDK، يمكن تشغيل التحقق والبناء محلياً دون أي مفاتيح تداول مضمّنة.

```bash
flutter pub get
flutter analyze --fatal-infos
flutter test
flutter build apk --release
flutter build appbundle --release
```

يستخدم ملف APK الناتج لتثبيت التطبيق مباشرة، بينما يستخدم ملف AAB للرفع إلى Google Play Console. أي بناء محلي للنشر يجب أن يستخدم هوية التوقيع الثابتة نفسها المحفوظة للإجراء الموحد.

## تكامل MEXC Futures

يعتمد التطبيق عنوان Futures API `https://api.mexc.com` ويستخدم مسار إنشاء الأمر `POST /api/v1/private/order/create`. وفق وثائق MEXC، يجب أن تتضمن الاستجابة الناجحة `success: true` و`data.orderId`؛ ومن دون ذلك يعرض التطبيق فشلاً ولا ينشئ مركزاً محلياً على أنه صفقة حقيقية. [1] [2]

### المراجع

[1] [MEXC Futures API — Introduction](https://www.mexc.com/api-docs/futures/integration-guide)

[2] [MEXC Futures API — Place Order](https://www.mexc.com/api-docs/futures/account-and-trading-endpoints/place-order)
