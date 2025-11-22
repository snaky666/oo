# أضحيتي (Odhiyati) - منصة بيع الأغنام

## نظرة عامة
منصة ويب عربية متكاملة لبيع وشراء الأغنام مع نظام إشراف إداري كامل. المنصة تدعم ثلاثة أنواع من المستخدمين: المشترين والبائعين والإداريين.

## التقنيات المستخدمة
- **Frontend**: React + TypeScript + Tailwind CSS + Shadcn UI
- **Backend**: Express.js + Firebase Admin SDK
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth (Email/Password + Google)
- **Image Hosting**: ImgBB API (رفع تلقائي للصور)
- **Routing**: Wouter
- **State Management**: TanStack React Query
- **Forms**: React Hook Form + Zod

## هيكل المشروع

### المجموعات في Firestore:
1. **users**: معلومات المستخدمين مع الأدوار (buyer/seller/admin)
2. **sheep**: قوائم الأغنام مع الصور والتفاصيل وحالة الموافقة
3. **orders**: طلبات الشراء مع التتبع الكامل

### الأدوار (Roles):
- **buyer**: يمكنه تصفح الأغنام وإنشاء طلبات شراء
- **seller**: يمكنه إضافة/تعديل/حذف قوائم الأغنام الخاصة به
- **admin**: يمكنه مراجعة وقبول/رفض المنتجات وإدارة المستخدمين والطلبات

### الميزات الرئيسية:
- ✅ تسجيل دخول بالبريد الإلكتروني وكلمة المرور
- ✅ اختيار الدور عند التسجيل (مشتري/بائع)
- ✅ رفع الصور للأغنام على Firebase Storage
- ✅ تصفح الأغنام مع فلاتر متقدمة (السعر، العمر، الوزن، المدينة)
- ✅ لوحة تحكم البائع لإدارة القوائم
- ✅ لوحة تحكم الأدمن للموافقة على المنتجات
- ✅ نظام الطلبات (المشتري -> الأدمن -> البائع)
- ✅ واجهة عربية RTL كاملة
- ✅ دعم الوضع الليلي/النهاري

## API Endpoints:
- `POST /api/auth/signup` - تسجيل حساب جديد
- `POST /api/auth/login` - تسجيل الدخول
- `GET /api/auth/me` - الحصول على معلومات المستخدم الحالي
- `POST /api/sheep` - إضافة خروف جديد (seller only)
- `GET /api/sheep` - الحصول على جميع الأغنام (مع فلاتر)
- `GET /api/sheep/:id` - تفاصيل خروف معين
- `PUT /api/sheep/:id` - تحديث خروف (seller only)
- `DELETE /api/sheep/:id` - حذف خروف (seller only)
- `POST /api/sheep/:id/approve` - الموافقة على خروف (admin only)
- `POST /api/sheep/:id/reject` - رفض خروف (admin only)
- `POST /api/orders` - إنشاء طلب شراء (buyer only)
- `GET /api/orders` - الحصول على الطلبات (حسب الدور)
- `PUT /api/orders/:id/status` - تحديث حالة الطلب
- `GET /api/users` - الحصول على جميع المستخدمين (admin only)
- `POST /api/upload` - رفع صورة

## البيئة (Environment Variables):
- `VITE_FIREBASE_PROJECT_ID` - معرف مشروع Firebase
- `VITE_FIREBASE_APP_ID` - معرف تطبيق Firebase
- `VITE_FIREBASE_API_KEY` - مفتاح API لـ Firebase
- `VITE_IMGBB_API_KEY` - مفتاح API لـ ImgBB (لرفع الصور)
- `SESSION_SECRET` - سر الجلسات

## تفضيلات المستخدم:
- اللغة الأساسية: العربية
- الاتجاه: RTL (من اليمين لليسار)
- التصميم: عصري، نظيف، احترافي
- الخطوط: Cairo و Tajawal
- الألوان: نظام الوان احترافي مع دعم الوضع الليلي

## Replit Setup:

### Development Workflow:
- **Command**: `npm run dev`
- **Port**: 5000 (both frontend and backend)
- The dev server uses Vite middleware integrated with Express
- Frontend and backend run together on the same port

### Deployment Configuration:
- **Target**: Autoscale (stateless web application)
- **Build**: `npm run build` (builds Vite frontend and bundles Express backend)
- **Run**: `npm start` (runs the production server)

### Required Environment Variables:
The following environment variables must be set in Replit:
- `VITE_FIREBASE_API_KEY` - Firebase API key (client-side)
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID (client-side)
- `VITE_FIREBASE_APP_ID` - Firebase app ID (client-side)
- `SESSION_SECRET` - Session secret for Express sessions (automatically provided by Replit)

### Project Structure:
- `client/` - React frontend (Vite + TypeScript + Tailwind)
- `server/` - Express backend with Firebase integration
- `shared/` - Shared schemas and types between frontend and backend
- `server/index-dev.ts` - Development server with Vite middleware
- `server/index-prod.ts` - Production server serving static files

## Vercel Deployment:

### إعداد النشر على Vercel:
تم إعداد المشروع للنشر على Vercel كتطبيق ثابت (Static Site):
- **التكوين**: `vercel.json` مع filesystem routing
- **البناء**: `npm run vercel-build` ينشئ `dist/public`
- **البنية**: Client-side only مع Firebase (لا توجد API routes في الباك اند)
- **الوثائق**: راجع `VERCEL_DEPLOYMENT.md` للتعليمات الكاملة

### المتغيرات المطلوبة في Vercel:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_PROJECT_ID`  
- `VITE_FIREBASE_APP_ID`

## نظام Authentication (Client-Side):

### تدفق المستخدم:
1. **Sign Up Flow**:
   - المستخدم ينشئ حساب جديد (Email/Password أو Google)
   - بعد النجاح: `redirect("/login")` - لتسجيل الدخول يدويًا

2. **Sign In Flow**:
   - المستخدم يسجل الدخول بنجاح
   - Firebase persistence تحفظ الجلسة في localStorage
   - بعد النجاح: `redirect("/dashboard")` حسب الدور:
     - Admin → `/admin`
     - Seller → `/seller`
     - Buyer → `/browse`

3. **Protected Routes Guard**:
   - ✅ إذا حاول مستخدم غير مسجل الوصول إلى `/browse` أو `/seller` أو `/admin` → يُعاد إلى `/login`
   - ✅ إذا حاول مستخدم مسجل الوصول إلى `/login` أو `/register` → يُعاد إلى dashboard حسب دوره

4. **Persistence**:
   - Firebase browserLocalPersistence - الجلسة تبقى حتى تسجيل الخروج
   - عند التحديث (F5)، المستخدم يبقى مسجل الدخول

### المكونات المرتبطة:
- `AuthContext.tsx`: إدارة الجلسة مع Firebase persistence
- `ProtectedRoute.tsx`: حماية المسارات المحمية
- `PublicRoute.tsx`: منع المستخدمين المسجلين من فتح /login و /register
- `register.tsx`: redirect إلى /login بعد الإنشاء
- `login.tsx`: redirect إلى dashboard حسب الدور

## نظام إدارة الأغنام (المراجعة الإدارية):

### تدفق العمل:
1. **البائع**: ينشئ قائمة خروف جديد → حالة "pending"
2. **الإدمن**: يراجع الطلب في Dashboard
   - ✅ قبول: تصبح القائمة "approved" وتظهر للمشترين
   - ❌ رفض: تصبح "rejected" مع سبب الرفض
3. **البائع**: يرى الحالة والرفض (إن وجد) في لوحة تحكمه
4. **المشتري**: يرى فقط الأغنام "approved"

### الميزات:
- ✅ حقل "سبب الرفض" عند رفض القائمة
- ✅ عرض سبب الرفض على بطاقة الخروف للبائع
- ✅ نظام Admin محمي (يحتاج role = admin)
- ✅ لا احتكاك مباشر بين البائع والمشتري

### ملفات معدلة:
- `shared/schema.ts` - إضافة rejectionReason
- `client/src/pages/admin-dashboard.tsx` - textarea لسبب الرفض
- `client/src/pages/login.tsx` - رسالة تحذير Admin Login
- `client/src/components/SheepCard.tsx` - عرض سبب الرفض
- `ADMIN_SETUP.md` - دليل إعداد حساب Admin

## آخر التحديثات:
- 2025-11-22: تم إضافة نموذج إكمال البيانات الشخصية للبائع:
  - إنشاء `client/src/pages/seller-profile.tsx` - صفحة إكمال البيانات
  - تحديث `shared/schema.ts` مع `UpdateSellerProfile` schema و `User` fields
  - تحديث `seller-dashboard.tsx` مع guard لفحص `profileComplete`
  - تحديث `App.tsx` مع route `/seller/profile`
  - البائع يتم إعادة توجيهه تلقائياً إلى `/seller/profile` إذا لم يكمل البيانات
  - النموذج يتضمن: الاسم الكامل، رقم الهاتف، المدينة، العنوان
  - بعد الحفظ: يتم تعيين `profileComplete: true` والتوجيه إلى `/seller` ✅
  - تم إزالة: اسم الشركة والرقم الوطني/السجل التجاري من الحقول المطلوبة
- 2025-11-22: تم تطبيق نظام رفع الصور التلقائي إلى ImgBB:
  - إنشاء `client/src/lib/imgbb.ts` مع دوال رفع آلية
  - تحديث `seller-dashboard.tsx` لاستخدام ImgBB بدل Firebase Storage
  - إضافة معالجة الأخطاء والـ loading states
  - توثيق كامل في `IMGBB_INTEGRATION.md`
  - النظام يعمل بشكل آلي: رفع → استلام الرابط → حفظ في Firestore ✅
- 2025-11-22: تم تطبيق نظام إدارة الأغنام مع المراجعة:
  - إضافة سبب الرفض (rejection reason) للأغنام المرفوضة
  - تحسين admin-dashboard بـ textarea لسبب الرفض
  - إضافة رسالة تحذير لـ Admin Login
  - عرض سبب الرفض على بطاقات الأغنام في seller-dashboard
  - إنشاء ADMIN_SETUP.md بتعليمات إعداد المسؤول
  - اختبار النظام والتحقق من جميع الـ redirects ✅
- 2025-11-22: تم تحسين نظام Authentication (Client-Side):
  - إضافة Firebase browserLocalPersistence للجلسات الدائمة
  - تصحيح جميع الـ redirects: signup → /login, signin → dashboard
  - إنشاء PublicRoute component لمنع المستخدمين المسجلين من /login و /register
  - تحسين ProtectedRoute guards للمسارات المحمية
  - اختبار الـ route guards (يعمل بشكل صحيح ✅)
- 2025-11-22: تم إعداد المشروع للنشر على Vercel
  - إنشاء `vercel.json` مع تكوين routes صحيح (filesystem + SPA fallback)
  - إضافة `vercel-build` script في package.json
  - إنشاء `VERCEL_DEPLOYMENT.md` مع دليل شامل للنشر
  - اختبار البناء والتحقق من إنشاء dist/public بنجاح
  - توضيح أن المشروع client-side فقط (لا API routes)
- 2025-11-22: تم إعداد المشروع للعمل على Replit
  - تم تثبيت جميع التبعيات
  - تم إصلاح مشكلة storage interface (تغيير username إلى email)
  - تم إصلاح تحذير nested <a> tags في Header component
  - تم تكوين workflow للتطوير على port 5000
  - تم تكوين deployment settings (autoscale)
  - **تم إضافة تسجيل الدخول بحساب Google**:
    - إضافة GoogleAuthProvider في Firebase configuration
    - تحديث AuthContext لدعم Google sign-in مع حماية البيانات
    - إضافة أزرار Google في صفحات Login و Register
    - معالجة صحيحة للمستخدمين الجدد والحاليين
    - التوجيه التلقائي حسب دور المستخدم
- 2025-01-22: إنشاء المشروع وإعداد البنية الأساسية
- تم إضافة Firebase Authentication و Firestore و Storage
- تم بناء نظام الأدوار الكامل (buyer/seller/admin)
- تم إنشاء واجهات لجميع أنواع المستخدمين
