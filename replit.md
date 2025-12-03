# أضحيتي (Odhiyati) - منصة بيع الأغنام

## Overview
أضحيتي (Odhiyati) is a comprehensive Arabic web platform designed for buying and selling sheep, primarily targeting the Algerian market. It features a complete administrative supervision system and supports three user roles: buyers, sellers, and administrators. The platform aims to streamline the process of livestock exchange with a focus on ease of use, secure transactions, and robust management. It includes a VIP membership system to offer enhanced benefits to both buyers and sellers, an integrated orders management system, comprehensive payment processing, and an advertising system for promotional content.

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
The platform features a modern, clean, and professional design with full RTL (right-to-left) support, Arabic as the primary language, and a professional color scheme including dark/light mode. The chosen fonts are Cairo and Tajawal. The platform is localized for Algeria, using Algerian Dinar (DA) and listing 58 Algerian states, along with all 1,541 municipalities.

### Technical Implementations
- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI for a modern and responsive user interface. Wouter is used for routing, TanStack React Query for state management, and React Hook Form with Zod for form handling and validation.
- **Backend**: Express.js integrated with Firebase Admin SDK.
- **Database**: Firebase Firestore is used for data storage, organizing data into `users`, `sheep` (listings with approval status), `orders` (purchase requests), `payments`, `cibReceipts`, `installments`, `vipSubscriptions`, and `ads` (promotional advertisements).
- **Authentication**: Firebase Auth supports Email/Password and Google sign-in. Client-side authentication manages user sessions and protects routes.
- **Image Hosting**: ImgBB API is used for automatic image uploads.
- **Email Service**: Nodemailer integration with SMTP for various notifications (verification, password reset, order confirmations).

### Feature Specifications
- **User Roles**: Buyer, Seller, and Admin, with distinct permissions and dashboards.
- **Authentication**: Email/password and Google sign-in with role selection, guest browsing mode.
- **Listings Management**: Sellers can add, edit, and delete sheep listings with image uploads. Advanced browsing with real-time filters (price, age, weight, city/wilaya/municipality).
- **Order System**: Buyers create purchase orders; Admin reviews; Seller receives. Comprehensive order tracking for users.
- **Admin Dashboard**: Product approval workflow, user management, payment verification, VIP management, and advertisements management.
- **VIP System**: Three-tier VIP packages (Silver, Gold, Platinum) offering discounts, priority support, enhanced visibility for sellers, and exclusive access for buyers.
- **Payment System**: Supports CIB Bank Transfer (with receipt upload), Cash on Delivery, and Installments for sheep purchases.
- **Advertising System**: Admin can upload promotional advertisements to ImgBB, add descriptions and optional website links. Advertisements auto-rotate on landing page with 5-second intervals.
- **Localization**: Full Arabic RTL interface, dark/light mode support, and comprehensive Algerian geographical data (58 wilayas, 1,541 municipalities).

### System Design Choices
The project uses a monorepo structure with `client/` for the React frontend, `server/` for the Express backend, and `shared/` for common schemas and types. Development uses Vite middleware with Express, while production leverages Vercel's serverless functions for API endpoints. Firebase Admin SDK on the backend ensures secure server-side data access. Firestore security rules enforce role-based access control and data ownership.

## External Dependencies
-   **Firebase**:
    -   **Firebase Firestore**: Database for all application data.
    -   **Firebase Authentication**: User authentication and authorization.
    -   **Firebase Admin SDK**: Server-side access to Firebase services.
-   **ImgBB API**: External service for hosting images uploaded by users and advertisements.
-   **Nodemailer**: For sending transactional emails (verification, password reset, order notifications).
-   **Vercel**: Deployment platform for the application, utilizing serverless functions for the API.
-   **Municipalities Data**: Static JSON file containing all Algerian commune data.

---

## COMPREHENSIVE SYSTEM RULES

### 1. DATA VALIDATION RULES

#### User Data Validation
- **Email**: Must be valid email format (RFC 5322), unique in system
- **Password**: Minimum 8 characters, must contain uppercase, lowercase, number, special character
- **Full Name**: 2-100 characters, Arabic or Latin letters allowed
- **Phone**: 10 digits, Algerian format (0xxx xxx xxx)
- **Address**: 5-500 characters, required for sellers
- **City/Wilaya**: Must be from predefined 58 Algerian wilayas
- **Municipality**: Must be from predefined 1,541 Algerian municipalities

#### Sheep Listing Validation
- **Price**: 10,000 - 10,000,000 DA (Integer, no decimals)
- **Age**: 6-60 months (integer)
- **Weight**: 5-200 kg (integer)
- **Description**: 20-2000 characters (Arabic/English/French)
- **Images**: Minimum 1, Maximum 5 images per listing. Each image max 32MB
- **City**: Must match seller's city
- **Status**: pending (awaiting approval), approved, rejected (with rejection reason)

#### Advertisement Validation
- **Image URL**: Valid HTTPS URL from ImgBB
- **Description**: 10-500 characters (Arabic/English/French)
- **Website Link**: Optional, must be valid HTTPS URL if provided
- **Image Format**: JPG, PNG, WebP (max 32MB)
- **Display Duration**: Auto-rotates every 5 seconds on landing page

#### Order Validation
- **Price**: Must match current sheep price at time of order
- **Quantity**: Always 1 (one sheep per order)
- **Status**: pending (awaiting admin review), confirmed (approved), rejected
- **Payment Method**: cash, cib_transfer, installment (valid options only)
- **Delivery Address**: 5-500 characters, required

#### Payment Validation
- **CIB Transfer**: Receipt image required (JPG/PNG, max 5MB), valid bank details
- **Installment**: Maximum 12 months, interest rate 0-5% per month
- **Amount**: Must match order total price exactly

#### VIP Subscription Validation
- **Duration**: 1-36 months or unlimited
- **Package Type**: silver, gold, platinum (case-sensitive)
- **Price**: Silver (5,000 DA/month), Gold (10,000 DA/month), Platinum (20,000 DA/month)
- **Renewal**: Auto-renewal option available

### 2. SECURITY RULES

#### Authentication & Authorization
- Admin-only routes: `/admin/*` - Must have role === 'admin'
- Seller routes: `/seller/*` - Must have role === 'seller' or 'admin'
- Buyer routes: `/buyer/*` - Any authenticated user
- Public routes: `/browse`, `/landing`, `/login`, `/register`
- Session timeout: 30 days for regular users, 7 days for admin
- Password reset: 24-hour expiration on reset tokens
- Email verification: Required before account activation

#### Database Security
- Firestore Rules: Role-based access control (RBAC)
  - Users can only read their own profile
  - Sellers can only edit their own listings
  - Admins can access all collections with full permissions
  - Public read access to approved sheep only
- No sensitive data in client-side code (API keys, secrets)
- All backend operations use Firebase Admin SDK with elevated privileges

#### API Security
- All endpoints require HTTPS in production
- CORS: Allow only frontend domain
- Rate limiting: 100 requests per minute per IP
- Request validation: All inputs validated with Zod schemas
- Error handling: Never expose internal error details to client

### 3. BUSINESS LOGIC RULES

#### Listing Approval Workflow
1. Seller creates listing (status: pending)
2. Admin reviews listing in dashboard
3. Admin accepts → status: approved (visible on browse page)
4. Admin rejects with reason → status: rejected (seller notified via email)
5. Approved listings appear in browse within 5 minutes

#### Order Processing Workflow
1. Buyer creates order (status: pending)
2. Admin reviews order details
3. Admin confirms → seller receives email, status: confirmed
4. Admin rejects → buyer receives email, status: rejected
5. Confirmed orders: seller has 48 hours to prepare

#### Payment Verification
- CIB Transfer: Admin manually verifies receipt against transaction details
- Cash on Delivery: Payment collected when order delivered
- Installment: 1st payment on confirmation, remaining payments on schedule

#### VIP Management
- Seller with VIP gets priority listing placement (+50 DA discount per listing)
- Buyer with VIP gets exclusive deals (-10% on all purchases)
- VIP listings appear at top of browse page
- VIP status expires automatically if subscription ends

#### Advertisement System
- Max 10 advertisements active simultaneously
- Admin adds via ImgBB upload in ads tab
- Advertisements rotate automatically every 5 seconds
- Only approved advertisements displayed
- Click-through tracking (optional enhancement)

### 4. PERFORMANCE RULES

#### Frontend Performance
- Page load time: < 2 seconds for critical paths
- Bundle size: < 500KB (gzipped)
- Lazy loading: All images optimized and lazy-loaded
- Query caching: React Query cache duration 5 minutes
- Component rendering: Memoization for lists > 50 items

#### Backend Performance
- API response time: < 500ms for GET requests, < 1s for POST
- Database queries: Indexed fields (status, email, seller_id)
- Image uploads: Async processing, no blocking operations
- Email sending: Queued and processed asynchronously

#### Image Optimization
- ImgBB automatic compression
- Responsive images: Multiple sizes for different devices
- Format: WebP with fallback to JPG/PNG
- Max dimensions: 1920x1080 for full-size, 300x300 for thumbnails

### 5. ADVERTISING SYSTEM RULES

#### Ad Management (Admin Only)
- **Add Advertisement**: 
  1. Upload image via file input (auto-uploaded to ImgBB)
  2. Enter description (required)
  3. Enter website link (optional)
  4. Confirm and save to database
  
- **View Advertisements**: Grid display of all active ads with delete option
- **Delete Advertisement**: Remove from database and ImgBB (manual or automatic)

#### Ad Display Rules
- Location: Landing page hero section (below header, above main content)
- Display Format: Carousel with auto-rotation every 5 seconds
- Navigation: Manual dots/indicators for user control
- Responsive: Full width on mobile, constrained width on desktop
- Fade Transition: Smooth CSS transition between ads

#### Ad Content Requirements
- No offensive, inappropriate, or illegal content
- No misleading claims or spam
- Images: High quality, professional appearance
- Description: Clear, concise, actionable text

### 6. DATABASE SCHEMA RULES

#### Collections Structure
```
users {
  uid: string (Firebase Auth ID)
  email: string (unique)
  fullName: string
  phone: string
  address: string
  city: string
  role: 'buyer' | 'seller' | 'admin'
  vipStatus: 'none' | 'silver' | 'gold' | 'platinum'
  vipUpgradedAt: timestamp
  vipExpiresAt: timestamp
  profileImage: string (optional)
  createdAt: timestamp
}

sheep {
  id: string (unique)
  sellerId: string (references users.uid)
  sellerEmail: string
  price: number (integer, DA)
  age: number (months)
  weight: number (kg)
  description: string
  images: array of strings (URLs)
  city: string
  wilaya: string
  municipality: string
  status: 'pending' | 'approved' | 'rejected'
  rejectionReason: string (if rejected)
  createdAt: timestamp
  updatedAt: timestamp
}

orders {
  id: string (unique)
  sheepId: string (references sheep.id)
  buyerId: string (references users.uid)
  sellerId: string (references users.uid)
  buyerEmail: string
  sellerEmail: string
  buyerName: string
  buyerPhone: string
  buyerAddress: string
  buyerCity: string
  sheepPrice: number (DA)
  totalPrice: number (DA)
  paymentMethod: 'cash' | 'cib_transfer' | 'installment'
  status: 'pending' | 'confirmed' | 'rejected'
  createdAt: timestamp
  updatedAt: timestamp
}

payments {
  id: string (unique)
  orderId: string (references orders.id)
  userId: string (references users.uid)
  amount: number (DA)
  method: 'cash' | 'cib_transfer' | 'installment'
  status: 'pending' | 'verified' | 'failed'
  receiptImage: string (URL, for CIB only)
  createdAt: timestamp
  verifiedAt: timestamp (if verified)
}

vipSubscriptions {
  id: string (unique)
  userId: string (references users.uid)
  package: 'silver' | 'gold' | 'platinum'
  price: number (DA)
  status: 'active' | 'expired' | 'cancelled'
  startDate: timestamp
  endDate: timestamp
  autoRenew: boolean
  createdAt: timestamp
}

ads {
  id: string (unique)
  image: string (ImgBB URL, required)
  description: string (required)
  link: string (optional, website URL)
  active: boolean
  createdAt: timestamp
  updatedAt: timestamp
}
```

### 7. API ENDPOINTS RULES

#### Sheep Endpoints
- `GET /api/sheep` - Fetch all approved sheep (public)
- `POST /api/sheep` - Create new listing (seller only)
- `PATCH /api/sheep/:id` - Update listing (seller only)
- `DELETE /api/sheep/:id` - Delete listing (seller only)

#### Order Endpoints
- `GET /api/orders` - Fetch user's orders (user only)
- `POST /api/orders` - Create new order (buyer only)
- `GET /api/orders/:id` - View order details (authorized user only)
- `PATCH /api/orders/:id` - Update order status (admin only)

#### Advertisement Endpoints
- `GET /api/ads` - Fetch all active ads (public)
- `POST /api/ads` - Create advertisement (admin only)
- `DELETE /api/ads/:id` - Delete advertisement (admin only)

#### User Endpoints
- `GET /api/users/:id` - Get user profile (user only)
- `PATCH /api/users/:id` - Update profile (user only)
- `POST /api/users/register` - Register new user (public)
- `POST /api/users/login` - Login user (public)

#### VIP Endpoints
- `GET /api/vip/packages` - Get VIP packages (public)
- `POST /api/vip/upgrade` - Upgrade to VIP (buyer/seller only)
- `GET /api/vip/status` - Check VIP status (user only)

### 8. INTERFACE RULES

#### Navigation
- Header: Logo, search bar, user menu, language switcher, theme toggle
- Sidebar: Only on admin dashboard (collapsible)
- Footer: Company info, links, social media

#### Form Requirements
- All form inputs: Arabic labels, English placeholders
- Error messages: Arabic, specific (not generic)
- Success messages: Arabic, confirmation of action
- Loading states: Show spinner for async operations
- Required fields: Mark with asterisk (*)

#### Data Display
- Numbers: Format with thousands separator (e.g., 1,000,000 DA)
- Dates: Arabic format (e.g., 15 ديسمبر 2025)
- Timestamps: Show "منذ X ساعات" (X hours ago) when recent
- Status badges: Color-coded (green=approved, red=rejected, yellow=pending)

#### Responsive Design
- Mobile: < 768px (single column, hamburger menu)
- Tablet: 768px - 1024px (two columns)
- Desktop: > 1024px (full layout with sidebar/multi-column)
- All images: Responsive with srcset

### 9. EMAIL NOTIFICATIONS RULES

#### Verification Email
- Sent: Upon user registration
- Contains: Verification link (valid 24 hours)
- Template: Arabic, with platform branding

#### Password Reset Email
- Sent: Upon password reset request
- Contains: Reset link (valid 24 hours)
- Template: Security reminder in Arabic

#### Order Confirmation Email
- Sent: To buyer when order created
- Contains: Order details, seller contact
- Template: Arabic with order summary

#### Order Status Update Email
- Sent: To seller when new order received, to buyer when confirmed/rejected
- Contains: Order details and required actions
- Template: Arabic with clear status indicator

#### VIP Upgrade Email
- Sent: Upon VIP subscription purchase
- Contains: Package details, benefits, expiry date
- Template: Arabic with VIP benefits summary

### 10. ERROR HANDLING RULES

#### Validation Errors
- Return HTTP 400 with message in Arabic
- Include field-specific errors
- Example: "البريد الإلكتروني غير صحيح" (Invalid email)

#### Authentication Errors
- Return HTTP 401 for unauthorized
- Return HTTP 403 for forbidden (insufficient permissions)
- Example: "يجب تسجيل الدخول أولاً" (Must login first)

#### Not Found Errors
- Return HTTP 404 with Arabic message
- Example: "لم يتم العثور على الإعلان" (Ad not found)

#### Server Errors
- Return HTTP 500 without exposing internal details
- Log full error server-side
- Example: "حدث خطأ، يرجى المحاولة لاحقاً" (An error occurred, please try later)

#### Timeout Errors
- Network request timeout: 30 seconds
- Image upload timeout: 60 seconds
- Return user-friendly message in Arabic

---

## Recent Changes

### December 3, 2025
- Implemented complete Advertisement System with ImgBB integration
- Added AdSlider component with auto-rotation and manual controls
- Integrated ads management tab in admin dashboard
- Added file upload functionality for ad images directly from interface

---

## Deployment Notes
- **Environment**: Replit (Development), Vercel (Production)
- **Port**: 5000 (development), auto-assigned (production)
- **Database**: Firebase Firestore (real-time synced)
- **Image Storage**: ImgBB (external CDN)
- **Email**: SMTP via Nodemailer
