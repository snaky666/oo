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
    - **Buyer**: Can browse sheep and create purchase orders. Sellers can also buy sheep (dual role support).
    - **Seller**: Can add, edit, and delete their sheep listings, view their profile, and make purchases.
    - **Admin**: Can review, approve/reject product listings, view seller information, and manage the platform.
- **Key Features**:
    - Email/password and Google sign-in with role selection during registration.
    - Image uploads for sheep listings via ImgBB API.
    - Advanced browsing with real-time filters (price, age, weight, city/wilaya).
    - Seller dashboard for listing management with full CRUD operations.
    - Admin dashboard for product approval workflow and user management.
    - Comprehensive order system (Buyer submits order → Admin reviews → Seller receives).
    - Full Arabic RTL interface with dark/light mode support.
    - Seller profile system with mandatory fields (name, phone, city, address, municipality).
    - Sheep approval workflow with admin feedback system.
    - Guest browsing mode without account requirement.

### System Design Choices
The project is structured with `client/` for the React frontend, `server/` for the Express backend, and `shared/` for common schemas and types. Development uses Vite middleware with Express for unified local serving, while production builds separate frontend and backend assets. Firebase Admin SDK on backend handles server-side data access with proper security.

## Recent Implementation Updates (November 24, 2025)

### Vercel Deployment Configuration Fixed
- **vercel.json**: Properly configured with:
  - `outputDirectory: "dist/public"` - Frontend static files only
  - `rewrites` - All routes redirect to index.html for SPA routing
  - `headers` - Cache control for assets and no-cache for index.html
- **API Endpoints**: Migrated to Vercel Serverless Functions (`api/` folder)
  - `api/sheep.ts` - Returns approved sheep listings
  - CORS-enabled for cross-origin requests
  - Direct Firestore REST API access
- **Frontend Updates**: `browse.tsx` updated to use new API endpoint (`/api/sheep?approved=true`)
- **Build Process**: 
  - `npm run build` creates separate frontend (dist/public) and backend (dist/index.js)
  - Vite builds to `dist/public/` with proper assets
  - esbuild creates `dist/index.js` for legacy backend (not needed on Vercel)
- **Status**: Ready for Vercel deployment with serverless API functions

## Previous Implementation Updates (November 23, 2025)

### Environment Configuration Fixed
- Fixed Firebase environment variable references: `VITE_FIREBASE_PROJECT_ID` now properly used in backend
- Ensured `VITE_FIREBASE_API_KEY` correctly referenced across all endpoints
- Backend now properly initialized with correct Firebase project credentials

### Backend API - Public Sheep Data Access
- `/api/sheep/approved`: Returns all approved sheep listings (supports guest access)
- `/api/sheep/:id`: Returns individual sheep details for approved listings only
- Backend uses Firebase Admin SDK for secure server-side data access
- API endpoints gracefully handle Firebase initialization failures
- Public endpoints accessible without authentication for guest mode support

### Guest Mode - Browse Without Account (Production Ready)
- Added "الدخول كزائر" (Enter as Guest) button on login page with full functionality
- **Guest Access Features**:
  - Browse all approved sheep listings without registration
  - Apply filters (price, age, weight, city)
  - View individual sheep details
  - Fill out purchase request forms
  - Guest mode tracked via localStorage flag (`guestMode` = "true")
- **Guest Purchase Flow**:
  - Guests see purchase form with all available fields
  - Purchase form shows "سجل الدخول أولاً" (Login First) button instead of submit
  - Clicking login button clears guest mode and redirects to login page
- **Route Protection**:
  - `/browse` route with `allowGuest={true}` enables guest browsing
  - `/sheep/:id` route with `allowGuest={true}` enables guest detail viewing
  - Other routes remain protected and require proper authentication
- **Implementation Details**:
  - `AuthContext.tsx`: `signInAsGuest()` sets localStorage flag and returns success object
  - `login.tsx`: Guest button with loading state and toast notifications
  - `ProtectedRoute.tsx`: Updated logic to check guest mode before redirecting to login
  - `browse.tsx`: Fetches approved sheep from backend API for guest and registered users
  - `sheep-detail.tsx`: Displays sheep details with purchase form accessible to guests

### Municipality System - Complete Algerian Coverage
- Integrated all 1,541 Algerian communes (municipalities) organized by wilaya
- **Sheep Listings**: Include `municipality` field for precise location tracking
- **Dynamic Municipality Selection**: Sellers select wilaya first, then municipality from filtered list
- **Data Source**: `public/data/municipalities.json` with complete Algerian commune database
- **Frontend Utilities**: `shared/algeriaMunicipalities.ts` provides helper functions for municipality data access
- All municipalities sorted alphabetically for optimal UX

### Browse Page & Filtering
- Price filter range: 0 - 1,000,000 DA (accommodates all market listings)
- Age filter: 0 - 48 months
- Weight filter: 0 - 100 kg
- City/Wilaya filter: All 58 Algerian wilayas
- Real-time filter updates reflect on sheep grid immediately

### Seller Dashboard & Profile
- All 58 Algerian wilayas available for seller location selection
- Dynamic municipality dropdown that updates based on selected wilaya
- Seller profile completion system with mandatory fields
- Admin dashboard displays complete seller information for verification

## External Dependencies
- **Firebase**:
    - **Firebase Firestore**: Database for users, sheep listings, and orders
    - **Firebase Authentication**: Email/Password and Google Sign-In
    - **Firebase Admin SDK**: Server-side authenticated access to Firestore
- **ImgBB API**: Image hosting for sheep listing photos
- **Municipalities Data**: Static JSON file with all Algerian communes
- **Vercel**: Production deployment platform

## Current Status
- Platform is fully functional with guest mode operational
- All three user roles (buyer, seller, admin) implemented with proper permissions
- Real-time data synchronization across all components
- Complete Algerian localization with 58 wilayas and municipality-level precision
- Production-ready authentication with fallback for guest access
