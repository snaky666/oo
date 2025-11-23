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

## Recent Implementation Updates (November 23, 2025)

### Public API Endpoints - Backend Data Access
- Added `/api/sheep/approved` endpoint for fetching all approved sheep listings
- Added `/api/sheep/:id` endpoint for fetching individual sheep details
- Backend uses Firebase Admin SDK, allowing public access without client-side authentication
- Solves Firebase permission issues by using server-side credentials
- Browse and sheep-detail pages use backend API instead of direct Firestore access

### Guest Mode - Browse Without Account (Complete Implementation)
- Added "الدخول كزائر" (Enter as Guest) button on login page
- **No Authentication Required**: Guests can browse using public backend API endpoints
- Guests can browse approved sheep listings without account registration
- Guest mode tracked via localStorage flag (`guestMode` = "true")
- **Full Browse Access**: Guests view all approved sheep, apply filters, and access sheep details
- **Full Purchase Form**: "طلب الشراء" button shows same form as registered users (name, phone, city, address, order summary)
- **Guest Purchase Restriction**: When guest submits form, sees "سجل الدخول أولاً" (Login First) button instead of "تأكيد الطلب"
- **Login Redirect**: Clicking "سجل الدخول أولاً" clears guest mode from localStorage and redirects to login page
- **Route Protection**: `ProtectedRoute` component allows guest access to `/browse` and `/sheep/:id` routes via `allowGuest` prop
- **Implementation Details**:
  - `AuthContext.tsx`: Added `signInAsGuest()` function that just sets localStorage flag
  - `login.tsx`: Guest button calls `signInAsGuest()` with loading state and toast notifications
  - `sheep-detail.tsx`: Uses state-based `isGuest` tracking for proper React reactivity
  - `ProtectedRoute.tsx`: Uses `initialIsGuest` from localStorage for accurate immediate rendering
  - `server/routes.ts`: Added public backend API endpoints for sheep browsing (no auth required)
  - `server/index-dev.ts`: Firebase Admin SDK initialization for secure server-side access
  - `browse.tsx`: Uses public backend API to fetch approved sheep

### Municipality System Implementation
- Integrated comprehensive Algerian municipalities data from JSON file
- **Sheep Model**: Added `municipality` field to track sheep location at municipality level
- **Dynamic Municipality Selection**: When sellers add sheep, municipalities dropdown is dynamically populated based on selected wilaya
- **Data Source**: `public/data/municipalities.json` contains all Algerian communes organized by wilaya
- **Frontend Component**: `shared/algeriaMunicipalities.ts` provides async/sync functions to fetch municipalities
- All municipalities properly sorted alphabetically for better UX

### Browse Page Improvements
- Fixed price filter maximum from 10,000 DA to 1,000,000 DA to accommodate all approved sheep listings
- Implemented real-time Firestore listener (onSnapshot) for instant updates when new sheep are approved
- All 58 wilayas now display properly in browse filter (removed slice limitation)

### Seller Dashboard Enhancements
- All 58 Algerian wilayas now available in city selection (previously limited to first 10)
- Wilayas sorted alphabetically for easier navigation
- Added municipality selection field that dynamically updates based on chosen wilaya
- Conditional rendering: municipality dropdown only enabled after wilaya is selected

## External Dependencies
- **Firebase**:
    - **Firebase Firestore**: Main database for users, sheep listings, and orders.
    - **Firebase Authentication**: User authentication (Email/Password, Google Sign-In).
    - **Firebase Admin SDK**: Backend integration for administrative tasks.
- **ImgBB API**: Third-party service for automatic image uploads.
- **Municipalities Data**: Static JSON file (`public/data/municipalities.json`) with complete list of Algerian communes
- **Vercel**: Deployment platform for the client-side application.