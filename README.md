# Nor - MEXC Spot Trader & App Builder

هذا المستودع مخصص لإدارة وتطوير تطبيق Flutter الخاص بالتداول، ويحتوي على إعدادات البناء التلقائي عبر **GitHub Actions** لإنتاج ملفات الـ `APK` و `AAB` بشكل آلي ومستمر.

---

## 🚀 APK & AAB Building

يحتوي هذا المستودع على إعدادات البناء التلقائي لملفات الـ APK عبر GitHub Actions[span_0](start_span)[span_0](end_span).

* **الرابط المباشر للمشروع:** [Google AI Studio](https://aistudio.google.com)[span_1](start_span)[span_1](end_span)

---

## 🍰 مزامنة IDX تلقائياً

1. اضف في إعدادات المستودع سرّين:
   * `IDX_DOWNLOAD_URL` لرابط تنزيل الأرشيف من IDX[span_2](start_span)[span_2](end_span).
   * `IDX_API_TOKEN` إذا كان مطلوباً API رمز[span_3](start_span)[span_3](end_span).
2. افتح GitHub Actions في المستودع[span_4](start_span)[span_4](end_span).
3. شغل Workflow المسمى **IDX Sync**[span_5](start_span)[span_5](end_span).
4. سيقوم Workflow بتنزيل الأرشيف، واستخراجه، ومزامنة الملفات في مجلد `app`، ثم دفع التغييرات إلى `main`[span_6](start_span)[span_6](end_span).

> **ملاحظة:** لا يمكن للسيرفر هذه البيئة الوصول مباشرة إلى مشروع IDX أو مشروع Google AI Studio بدون رابط تنزيل صالح وصلاحيات[span_7](start_span)[span_7](end_span).
