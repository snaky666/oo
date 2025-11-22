# أضحيتي (Odhiyati) - منصة بيع الأغنام

## Overview
أضحيتي (Odhiyati) is a comprehensive Arabic web platform designed for buying and selling sheep, primarily targeting the Algerian market. It features a complete administrative supervision system and supports three user roles: buyers, sellers, and administrators. The platform aims to streamline the process of livestock exchange with a focus on ease of use, secure transactions, and robust management.

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

### UI/UX Decisions
The platform features a modern, clean, and professional design with full RTL (right-to-left) support, Arabic as the primary language, and a professional color scheme including dark/light mode. The chosen fonts are Cairo and Tajawal. The platform is localized for Algeria, using Algerian Dinar (DA) and listing 58 Algerian states.

### Technical Implementations
- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI for a modern and responsive user interface. Wouter is used for routing, TanStack React Query for state management, and React Hook Form with Zod for form handling and validation.
- **Backend**: Express.js integrated with Firebase Admin SDK.
- **Database**: Firebase Firestore is used for data storage, organizing data into `users` (with roles), `sheep` (listings with approval status), and `orders` (purchase requests).
- **Authentication**: Firebase Auth supports Email/Password and Google sign-in. Client-side authentication manages user sessions, protects routes, and handles redirects based on user roles and login status. Persistence is managed via Firebase `browserLocalPersistence`.
- **Image Hosting**: ImgBB API is used for automatic image uploads, with links stored in Firestore.

### Feature Specifications
- **User Roles**:
    - **Buyer**: Can browse sheep and create purchase orders.
    - **Seller**: Can add, edit, and delete their sheep listings.
    - **Admin**: Can review, approve/reject product listings, and manage users and orders.
- **Key Features**:
    - Email/password and Google sign-in.
    - Role selection during registration (buyer/seller).
    - Image uploads for sheep listings.
    - Advanced browsing with filters (price, age, weight, city).
    - Seller dashboard for listing management.
    - Admin dashboard for product approval and user management.
    - Comprehensive order system (Buyer -> Admin -> Seller).
    - Full Arabic RTL interface and dark/light mode support.
    - Seller profile completion system with mandatory fields (full name, phone, city, address, municipality).
    - Admin view of seller data.
    - Sheep approval workflow: Seller creates -> Admin reviews (pending) -> Admin approves/rejects (with reason) -> Approved listings visible to buyers.

### System Design Choices
The project is structured with `client/` for the React frontend, `server/` for the Express backend, and `shared/` for common schemas and types. Development uses Vite middleware with Express for unified local serving, while production builds separate frontend and backend assets.

## External Dependencies
- **Firebase**:
    - **Firebase Firestore**: Main database for users, sheep listings, and orders.
    - **Firebase Authentication**: User authentication (Email/Password, Google Sign-In).
    - **Firebase Admin SDK**: Backend integration for administrative tasks.
- **ImgBB API**: Third-party service for automatic image uploads.
- **Vercel**: Deployment platform for the client-side application.