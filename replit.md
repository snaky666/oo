# أضحيتي (Odhiyati) - تطبيق بيع الأغنام

## Overview
أضحيتي (Odhiyati) is a comprehensive Arabic web platform for buying and selling sheep, primarily targeting the Algerian market. It features a complete administrative supervision system and supports three user roles: buyers, sellers, and administrators. The platform aims to streamline livestock exchange with a focus on ease of use, secure transactions, and robust management, including a VIP membership system, integrated orders management, comprehensive payment processing, and an advertising system.

## Running the Project
- Development: `npm run dev` - Runs the Express server with Vite middleware on port 5000
- Production build: `npm run build` - Builds the client with Vite
- Production run: Uses `server/index-prod.ts` which serves the built static files

## Required Environment Variables
To fully use Firebase features, the following environment variables must be configured:
- `VITE_FIREBASE_API_KEY`: Firebase Web API key (client-side)
- `VITE_FIREBASE_PROJECT_ID`: Firebase project ID (client-side)
- `VITE_FIREBASE_APP_ID`: Firebase App ID (client-side)
- `FIREBASE_PRIVATE_KEY`: Firebase Admin SDK private key (server-side)
- `FIREBASE_CLIENT_EMAIL`: Firebase Admin SDK client email (server-side)
- `RESEND_API_KEY`: For email services (optional)

## User Preferences
- اللغة الأساسية: العربية
- الاتجاه: RTL (من اليمين لليسار)
- التصميم: عصري، نظيف، احترافي
- الخطوط: Cairo و Tajawal
- الألوان: نظام الوان احترافي مع دعم الوضع الليلي
- السوق: الجزائر
- العملة: دينار جزائري (DA)
- الولايات: 58 ولاية جزائرية

## System Architecture
The platform features a modern, clean, and professional RTL design with Arabic as the primary language, a professional color scheme including dark/light mode, and uses Cairo and Tajawal fonts. It is localized for Algeria, using Algerian Dinar (DA) and comprehensive geographical data (58 wilayas, 1,541 municipalities).

The frontend is built with React, TypeScript, Tailwind CSS, Shadcn UI for a responsive interface, Wouter for routing, TanStack React Query for state management, and React Hook Form with Zod for form handling. The backend uses Express.js integrated with Firebase Admin SDK. Firebase Firestore is the database, storing `users`, `sheep`, `orders`, `payments`, `vipSubscriptions`, and `ads`. Authentication is handled by Firebase Auth (Email/Password, Google sign-in). ImgBB API is used for image hosting, and Nodemailer for email notifications.

Key features include distinct user roles (Buyer, Seller, Admin) with corresponding dashboards, listings management with image uploads and advanced filtering, a comprehensive order system, an admin dashboard for product and user management, a three-tier VIP system (Silver, Gold, Platinum), and multiple payment options (CIB Bank Transfer, Cash on Delivery, Installments). An advertising system allows admins to upload promotional content that auto-rotates on the landing page.

### Imported Sheep Restrictions
Foreign/imported sheep orders require additional verification:
- **National ID Verification**: Customers must provide their national ID card number (رقم بطاقة التعريف الوطنية)
- **Required Documents**: Pay slip image (صورة كشف الراتب) and work document image (صورة وثيقة العمل)
- **One-Per-Year Limit**: Each national ID can only be used to purchase one imported sheep per year
- **Server-Side Enforcement**: All order creation is routed through `/api/orders/create` endpoint which validates these requirements before creating orders

The project utilizes a monorepo structure with `client/` (React), `server/` (Express), and `shared/` (common schemas). Development uses Vite with Express, while production leverages Vercel's serverless functions for API endpoints. Firestore security rules enforce role-based access control and data ownership.

## External Dependencies
-   **Firebase**: Firestore (database), Authentication (user management), Admin SDK (server-side access).
-   **ImgBB API**: External service for hosting user-uploaded images and advertisements.
-   **Nodemailer**: For sending transactional emails.
-   **Vercel**: Deployment platform.
-   **Municipalities Data**: Static JSON data for Algerian commune information.