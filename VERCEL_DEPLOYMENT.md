# دليل نشر المشروع على Vercel

## نظرة عامة
تم إعداد المشروع ليعمل على Vercel مع Static Site + Serverless Functions.
المشروع يستخدم Firebase للمصادقة وقاعدة البيانات والتخزين.

## البنية المعدة لـ Vercel

### 1. الملفات الأساسية
- `vercel.json` - ملف التكوين الرئيسي لـ Vercel
  - `buildCommand`: أمر البناء (npm run vercel-build)
  - `outputDirectory`: مجلد المخرجات (dist/public)
  - `routes`: قواعد التوجيه مع filesystem handling للأصول الثابتة
- `dist/public/` - المجلد الذي يحتوي على ملفات الواجهة المبنية
- `api/` - مجلد يحتوي على Serverless Functions

### 2. Scripts في package.json
```json
"vercel-build": "vite build"     // Script يستخدمه Vercel تلقائياً
"build:client": "vite build"     // لبناء الواجهة فقط
```

### 3. التحقق من البناء المحلي
قبل النشر على Vercel، تأكد من أن البناء يعمل محلياً:
```bash
npm run vercel-build
ls dist/public/
```
يجب أن ترى:
- `index.html`
- `assets/` (مجلد يحتوي على JS، CSS، والصور)
- `favicon.png`
- `logo.png`

---

## متغيرات البيئة المطلوبة (مهم جداً)

### قائمة كاملة بالمتغيرات المطلوبة

يجب إضافة **جميع** هذه المتغيرات في Vercel Dashboard → Project Settings → Environment Variables

#### متغيرات Firebase (مطلوبة للواجهة والـ API)
| Variable Name | الوصف | مثال |
|--------------|-------|------|
| `VITE_FIREBASE_API_KEY` | مفتاح Firebase API | AIzaSyB73bZRKxOv2SpzHQk0-NOG4dtoAXjOo7E |
| `VITE_FIREBASE_PROJECT_ID` | معرف مشروع Firebase | odhya-e7cca |
| `VITE_FIREBASE_APP_ID` | معرف تطبيق Firebase | 1:377136777872:web:e768a6c9672ec05293e615 |

#### متغيرات رفع الصور (مطلوبة لإضافة الإعلانات والخراف)
| Variable Name | الوصف | مثال |
|--------------|-------|------|
| `VITE_IMGBB_API_KEY` | مفتاح ImgBB لرفع الصور | f30a25e224eb3837f4a52429f09abe11 |

#### متغيرات البريد الإلكتروني (مطلوبة للتحقق وإعادة تعيين كلمة المرور)
| Variable Name | الوصف | مثال |
|--------------|-------|------|
| `RESEND_API_KEY` | مفتاح Resend لإرسال البريد | re_8NuUrKwr_DLYT1fzS2mTNkysve4vVTnuS |

**أو استخدم SMTP بديلاً:**
| Variable Name | الوصف | مثال |
|--------------|-------|------|
| `SMTP_HOST` | خادم SMTP | mail.odhiyaty.com |
| `SMTP_PORT` | منفذ SMTP | 465 |
| `SMTP_USER` | اسم المستخدم | verification@odhiyaty.com |
| `SMTP_PASSWORD` | كلمة المرور | your_password |
| `SMTP_FROM_EMAIL` | البريد المرسل | verification@odhiyaty.com |

### كيفية إضافة المتغيرات في Vercel

1. اذهب إلى [Vercel Dashboard](https://vercel.com/dashboard)
2. اختر مشروعك
3. اضغط على **Settings** في القائمة العلوية
4. اضغط على **Environment Variables** في القائمة الجانبية
5. لكل متغير:
   - اكتب اسم المتغير في حقل "Key"
   - اكتب القيمة في حقل "Value"
   - اختر **All Environments** (Production, Preview, Development)
   - اضغط **Add**

6. **مهم جداً**: بعد إضافة جميع المتغيرات، اذهب إلى **Deployments** واضغط على النقاط الثلاث (...) بجانب آخر deployment واختر **Redeploy**

---

## خطوات النشر على Vercel

### الطريقة الأولى: عبر Vercel Dashboard

1. **إنشاء حساب على Vercel**
   - اذهب إلى https://vercel.com
   - سجل دخول باستخدام GitHub أو أي طريقة أخرى

2. **استيراد المشروع**
   - اضغط على "Add New Project"
   - اختر المستودع (Repository) من GitHub/GitLab/Bitbucket
   - أو ارفع الملفات يدوياً

3. **إعدادات المشروع**
   ```
   Framework Preset: Vite
   Build Command: npm run vercel-build (أو تركه فارغاً)
   Output Directory: dist/public
   Install Command: npm install
   ```

4. **إضافة متغيرات البيئة**
   - أضف جميع المتغيرات المذكورة في القسم السابق
   - تأكد من اختيار **All Environments**

5. **النشر**
   - اضغط Deploy
   - انتظر حتى يكتمل البناء (Build)
   - احصل على رابط الموقع

### الطريقة الثانية: عبر Vercel CLI

1. **تثبيت Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **تسجيل الدخول**
   ```bash
   vercel login
   ```

3. **النشر**
   ```bash
   vercel
   ```
   - اتبع التعليمات التفاعلية
   - أضف متغيرات البيئة عند الطلب

4. **النشر للإنتاج**
   ```bash
   vercel --prod
   ```

---

## التحقق من النشر

بعد النشر الناجح:
1. ✅ الواجهة يجب أن تظهر بشكل صحيح (HTML/CSS/JS)
2. ✅ لا يجب أن يظهر الكود البرمجي في المتصفح
3. ✅ الصور والأصول الثابتة تعمل
4. ✅ التوجيه (Routing) يعمل بشكل صحيح
5. ✅ إضافة الإعلانات تعمل
6. ✅ إنشاء الطلبات يعمل
7. ✅ التسجيل وتسجيل الدخول يعمل

---

## حل المشاكل الشائعة

### المشكلة: لا يمكن إضافة إعلان أو إنشاء طلب
**السبب:** متغيرات البيئة غير موجودة في Vercel
**الحل:**
1. تأكد من إضافة جميع المتغيرات المذكورة أعلاه
2. تأكد من أنها مضافة لـ **All Environments**
3. أعد نشر المشروع (Redeploy) بعد إضافة المتغيرات

### المشكلة: يظهر الكود البرمجي بدلاً من الموقع
**الحل:**
- تأكد من أن `vercel.json` موجود في المجلد الرئيسي
- تأكد من أن Output Directory هو `dist/public`
- تأكد من تشغيل `npm run vercel-build` محلياً ينشئ `dist/public`

### المشكلة: 404 على المسارات الفرعية
**الحل:**
- تم حل هذا في `vercel.json` عبر rewrite rules
- جميع المسارات غير الموجودة تُعاد إلى `/index.html`

### المشكلة: متغيرات البيئة لا تعمل
**الحل:**
- تأكد من أن جميع المتغيرات تبدأ بـ `VITE_` للواجهة
- أضف المتغيرات في Vercel Dashboard تحت Environment Variables
- اختر **All Environments** عند الإضافة
- أعد بناء المشروع بعد إضافة المتغيرات (Redeploy)

### المشكلة: رفع الصور لا يعمل
**الحل:**
- تأكد من إضافة `VITE_IMGBB_API_KEY`
- تأكد من أن مفتاح ImgBB صالح وفعال

### المشكلة: البريد الإلكتروني لا يصل
**الحل:**
- تأكد من إضافة `RESEND_API_KEY` أو متغيرات SMTP
- تأكد من أن المفاتيح صالحة وفعالة

---

## ملاحظات مهمة

### 1. الاختلاف بين Replit و Vercel
- **Replit**: يدعم Express server كامل مع WebSockets
- **Vercel**: Static sites + Serverless functions فقط

### 2. API Routes الموجودة
المشروع يحتوي على الـ API routes التالية في مجلد `api/`:
- `/api/ads` - إدارة الإعلانات (GET, POST, DELETE)
- `/api/ads/[id]` - إعلان محدد (GET, PATCH, DELETE)
- `/api/sheep` - إدارة الخراف
- `/api/orders/create` - إنشاء طلبات جديدة
- `/api/auth/*` - المصادقة وإرسال رموز التحقق

### 3. تحديث قواعد Firestore (مهم جداً)
يجب نشر قواعد Firestore المحدثة في Firebase Console:

1. اذهب إلى [Firebase Console](https://console.firebase.google.com)
2. اختر مشروعك
3. اذهب إلى **Firestore Database** → **Rules**
4. انسخ محتوى ملف `firestore.rules` من المشروع
5. الصق القواعد واضغط **Publish**

**القواعد المهمة التي تم تحديثها:**
- السماح لـ API الخارجي (Vercel) بإنشاء الطلبات
- السماح لـ API الخارجي بقراءة وكتابة الإعلانات

### 3. Firebase Authentication
- Firebase Auth يعمل بشكل كامل لأنه client-side
- لا حاجة لإعدادات خاصة

---

## البديل: النشر على Replit

إذا واجهت مشاكل مع Vercel أو كنت بحاجة لميزات أكثر:

1. المشروع جاهز للعمل على Replit
2. اضغط Deploy في Replit
3. اختر Autoscale deployment
4. سيعمل كل شيء بشكل تلقائي

---

## الدعم

للمزيد من المعلومات:
- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Firebase Web Setup](https://firebase.google.com/docs/web/setup)
