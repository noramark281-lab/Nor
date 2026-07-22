# Nor

[![Google AI Studio](https://img.shields.io/badge/Open_in-Google_AI_Studio-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://aistudio.google.com/apps/9fa9beca-402c-4514-ad96-1942f2cd484c?showPreview=true&showAssistant=true&project=gen-lang-client-0520079114)

### 🚀 APK Building
هذا المستودع يحتوي على إعدادات البناء التلقائي لملف الـ **APK** عبر **GitHub Actions**.

---
* [اضغط هنا للفتح المباشر لمشروع Google AI Studio](https://aistudio.google.com/apps/9fa9beca-402c-4514-ad96-1942f2cd484c?showPreview=true&showAssistant=true&project=gen-lang-client-0520079114)

## 📥 مزامنة IDX تلقائياً
1. أضف في إعدادات المستودع سرّين:
   - `IDX_DOWNLOAD_URL` — رابط تنزيل الأرشيف من IDX
   - `IDX_API_TOKEN` — رمز API إذا كان مطلوباً
2. افتح GitHub Actions في المستودع.
3. شغّل Workflow المسمى `IDX Sync`.
4. سيقوم Workflow بتنزيل الأرشيف، واستخراجه، ومزامنة الملفات في مجلد `app/`، ثم دفع التغييرات إلى `main`.

> ملاحظة: لا يمكن لسيرفر هذه البيئة الوصول مباشرةً إلى مشروع IDX أو Google AI Studio بدون رابط تنزيل صالح وصلاحيات.
