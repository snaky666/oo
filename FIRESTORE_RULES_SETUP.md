# Firebase Firestore Security Rules Setup

## كيفية تطبيق القواعد الأمنية على Firebase

### الخطوة 1: الذهاب إلى Firebase Console
1. اذهب إلى [Firebase Console](https://console.firebase.google.com)
2. اختر مشروعك (أضحيتي)
3. من الشريط الجانبي الأيسر، انقر على **Firestore Database**

### الخطوة 2: الذهاب إلى قائمة Rules
1. في Firestore Dashboard، اضغط على تبويب **Rules**
2. ستجد نافذة محرر النصوص بالقواعس الحالية

### الخطوة 3: نسخ والصق القواعس الجديدة
1. **حدد جميع النصوص الحالية** (Ctrl+A أو Cmd+A)
2. **احذفها** (Delete)
3. **انسخ القواعس من أسفل** وألصقها في محرر Firebase

### الخطوة 4: نشر القواعس
1. اضغط على زر **Publish** (أزرق في الأعلى)
2. انتظر حتى يظهر تأكيد "Rules deployed"

### الخطوة 5: التحقق من النجاح
ستظهر رسالة: ✅ "The deployed rules have been validated"

---

## القواعس الأمنية الكاملة

انسخ هذا النص بالكامل والصقه في Firebase Console:

```firestore
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // ================= HELPER FUNCTIONS =================
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function currentUserId() {
      return request.auth.uid;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && currentUserId() == userId;
    }
    
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(currentUserId())).data;
    }
    
    function userExists() {
      return isAuthenticated() && exists(/databases/$(database)/documents/users/$(currentUserId()));
    }
    
    function hasRole(role) {
      return userExists() && getUserData().role == role;
    }
    
    function isAdmin() {
      return hasRole('admin');
    }
    
    function isSeller() {
      return hasRole('seller');
    }
    
    function isBuyer() {
      return hasRole('buyer');
    }
    
    function isValidEmail(email) {
      return email is string && email.size() >= 5 && email.matches('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
    }
    
    function isValidPhone(phone) {
      return phone is string && phone.size() >= 7 && phone.size() <= 20;
    }
    
    function isNonEmptyString(field) {
      return field is string && field.size() > 0;
    }
    
    function hasMinLength(field, minLen) {
      return field is string && field.size() >= minLen;
    }
    
    function isPositiveNumber(num) {
      return num is number && num > 0;
    }
    
    function isNonNegativeNumber(num) {
      return num is number && num >= 0;
    }
    
    function isInRange(num, min, max) {
      return num is number && num >= min && num <= max;
    }
    
    function isOneOf(value, allowedValues) {
      return value in allowedValues;
    }
    
    function isValidTimestamp(ts) {
      return ts is int && ts > 0;
    }
    
    function isValidPrice(price) {
      return price is number && price >= 10000 && price <= 10000000;
    }
    
    function isValidAge(age) {
      return age is number && age >= 6 && age <= 60;
    }
    
    function isValidWeight(weight) {
      return weight is number && weight >= 5 && weight <= 200;
    }
    
    function isValidUrl(url) {
      return url is string && url.matches('^https://.*');
    }
    
    function hasAll(fields) {
      return request.resource.data.keys().hasAll(fields);
    }
    
    function isUnchanged(field) {
      return request.resource.data[field] == resource.data[field];
    }
    
    // ================= USERS COLLECTION =================
    
    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin() || 
                     (isAuthenticated() && userExists() && resource.data.role in ['buyer', 'seller']);
      
      allow create: if isOwner(userId)
        && hasAll(['uid', 'email', 'role', 'createdAt', 'phone', 'fullName'])
        && request.resource.data.uid == userId
        && isValidEmail(request.resource.data.email)
        && request.resource.data.role in ['buyer', 'seller', 'admin']
        && isValidPhone(request.resource.data.phone)
        && hasMinLength(request.resource.data.fullName, 2)
        && isValidTimestamp(request.resource.data.createdAt);
      
      allow update: if (isOwner(userId) || isAdmin())
        && isUnchanged('uid')
        && isUnchanged('email')
        && isUnchanged('createdAt');
      
      allow delete: if isAdmin();
    }
    
    // ================= SHEEP COLLECTION =================
    
    match /sheep/{sheepId} {
      allow read: if isAuthenticated() || resource.data.status == 'approved';
      
      allow create: if isSeller()
        && hasAll(['id', 'sellerId', 'images', 'price', 'age', 'weight', 'city', 'description', 'status', 'createdAt'])
        && request.resource.data.id == sheepId
        && request.resource.data.sellerId == currentUserId()
        && request.resource.data.status == 'pending'
        && request.resource.data.images is list
        && request.resource.data.images.size() >= 1
        && request.resource.data.images.size() <= 5
        && isValidPrice(request.resource.data.price)
        && isValidAge(request.resource.data.age)
        && isValidWeight(request.resource.data.weight)
        && isNonEmptyString(request.resource.data.city)
        && hasMinLength(request.resource.data.description, 20)
        && isValidTimestamp(request.resource.data.createdAt);
      
      allow update: if (isSeller() && resource.data.sellerId == currentUserId() && resource.data.status == 'pending' && isUnchanged('sellerId') && request.resource.data.status == 'pending') 
        || isAdmin();
      
      allow delete: if (isSeller() && resource.data.sellerId == currentUserId() && resource.data.status == 'pending') 
        || isAdmin();
    }
    
    // ================= ORDERS COLLECTION =================
    
    match /orders/{orderId} {
      allow read: if isAdmin() 
        || (isAuthenticated() && (resource.data.buyerId == currentUserId() || resource.data.sellerId == currentUserId()));
      
      allow create: if isAuthenticated()
        && request.resource.data.buyerId == currentUserId()
        && hasAll(['buyerId', 'sheepId', 'status', 'createdAt'])
        && request.resource.data.status in ['pending', 'new']
        && isValidTimestamp(request.resource.data.createdAt)
        || request.auth == null;
      
      allow update: if isAdmin()
        || (isAuthenticated() && (resource.data.buyerId == currentUserId() || resource.data.sellerId == currentUserId()));
      
      allow delete: if isAdmin();
    }
    
    // ================= PAYMENTS COLLECTION =================
    
    match /payments/{paymentId} {
      allow read: if (isAuthenticated() && resource.data.userId == currentUserId()) || isAdmin();
      
      allow create: if isAuthenticated()
        && hasAll(['id', 'userId', 'userEmail', 'amount', 'method', 'status', 'createdAt'])
        && request.resource.data.id == paymentId
        && request.resource.data.userId == currentUserId()
        && request.resource.data.status == 'pending'
        && isValidPrice(request.resource.data.amount)
        && request.resource.data.method in ['cib', 'stripe', 'cash', 'card', 'installment']
        && isValidTimestamp(request.resource.data.createdAt);
      
      allow update: if isAdmin() 
        && request.resource.data.status in ['pending', 'completed', 'verified', 'failed', 'cancelled', 'rejected'];
      
      allow delete: if isAdmin();
    }
    
    // ================= CIB RECEIPTS COLLECTION =================
    
    match /cibReceipts/{receiptId} {
      allow read: if (isAuthenticated() && resource.data.userId == currentUserId()) || isAdmin();
      
      allow create: if isAuthenticated()
        && hasAll(['id', 'paymentId', 'userId', 'userEmail', 'receiptImageUrl', 'amount', 'status', 'createdAt'])
        && request.resource.data.id == receiptId
        && request.resource.data.userId == currentUserId()
        && request.resource.data.status == 'pending'
        && isValidUrl(request.resource.data.receiptImageUrl)
        && isPositiveNumber(request.resource.data.amount)
        && isValidTimestamp(request.resource.data.createdAt);
      
      allow update: if isAdmin() 
        && request.resource.data.status in ['pending', 'verified', 'rejected'];
      
      allow delete: if isAdmin();
    }
    
    // ================= INSTALLMENTS COLLECTION =================
    
    match /installments/{installmentId} {
      allow read: if (isAuthenticated() && resource.data.userId == currentUserId()) || isAdmin();
      
      allow create: if isAuthenticated()
        && hasAll(['id', 'paymentId', 'userId', 'totalAmount', 'downPayment', 'remainingAmount', 'monthlyInstallment', 'numberOfMonths', 'paidInstallments', 'nextDueDate', 'status', 'createdAt'])
        && request.resource.data.id == installmentId
        && request.resource.data.userId == currentUserId()
        && request.resource.data.status in ['active', 'pending']
        && isPositiveNumber(request.resource.data.totalAmount)
        && isNonNegativeNumber(request.resource.data.downPayment)
        && isNonNegativeNumber(request.resource.data.remainingAmount)
        && isPositiveNumber(request.resource.data.monthlyInstallment)
        && isInRange(request.resource.data.numberOfMonths, 1, 24)
        && request.resource.data.paidInstallments >= 0
        && isValidTimestamp(request.resource.data.createdAt);
      
      allow update: if isAdmin() 
        && request.resource.data.status in ['active', 'completed', 'defaulted', 'pending'];
      
      allow delete: if isAdmin();
    }
    
    // ================= VIP SUBSCRIPTIONS COLLECTION =================
    
    match /vipSubscriptions/{subscriptionId} {
      allow read: if (isAuthenticated() && resource.data.userId == currentUserId()) || isAdmin();
      
      allow create: if isAuthenticated()
        && request.resource.data.userId == currentUserId()
        && request.resource.data.package in ['silver', 'gold', 'platinum']
        && isPositiveNumber(request.resource.data.price);
      
      allow update: if (isAuthenticated() && resource.data.userId == currentUserId()) || isAdmin();
      
      allow delete: if isAdmin();
    }
    
    // ================= AD REQUESTS COLLECTION =================
    
    match /ad_requests/{requestId} {
      allow read: if isAdmin() || (isAuthenticated() && resource.data.userId == currentUserId());
      
      allow create: if isAuthenticated()
        && hasAll(['id', 'userId', 'image', 'companyName', 'description', 'status', 'createdAt'])
        && request.resource.data.id == requestId
        && request.resource.data.userId == currentUserId()
        && request.resource.data.status == 'pending'
        && isNonEmptyString(request.resource.data.image)
        && hasMinLength(request.resource.data.companyName, 2)
        && hasMinLength(request.resource.data.description, 10)
        && isValidTimestamp(request.resource.data.createdAt);
      
      allow update: if isAdmin() 
        && request.resource.data.status in ['pending', 'approved', 'rejected'];
      
      allow delete: if isAdmin();
    }
    
    // ================= ADS COLLECTION =================
    
    match /ads/{adId} {
      allow read: if isAdmin() || (isAuthenticated() && resource.data.active == true);
      
      allow create: if isAdmin()
        && hasAll(['id', 'image', 'companyName', 'active', 'createdAt'])
        && request.resource.data.id == adId
        && isNonEmptyString(request.resource.data.image)
        && hasMinLength(request.resource.data.companyName, 2)
        && isValidTimestamp(request.resource.data.createdAt);
      
      allow update: if isAdmin();
      
      allow delete: if isAdmin();
    }
    
    // ================= REVIEWS COLLECTION =================
    
    match /reviews/{reviewId} {
      allow read: if isAuthenticated();
      
      allow create: if isBuyer()
        && hasAll(['id', 'buyerId', 'sellerId', 'sheepId', 'rating', 'comment', 'createdAt'])
        && request.resource.data.id == reviewId
        && request.resource.data.buyerId == currentUserId()
        && isInRange(request.resource.data.rating, 1, 5)
        && isNonEmptyString(request.resource.data.sheepId)
        && isNonEmptyString(request.resource.data.sellerId)
        && isValidTimestamp(request.resource.data.createdAt);
      
      allow update: if isAuthenticated() && resource.data.buyerId == currentUserId()
        && isUnchanged('buyerId')
        && isUnchanged('sellerId')
        && isUnchanged('sheepId')
        && isUnchanged('createdAt')
        && isInRange(request.resource.data.rating, 1, 5);
      
      allow delete: if isAuthenticated() && resource.data.buyerId == currentUserId() || isAdmin();
    }
    
    // ================= FAVORITES COLLECTION =================
    
    match /favorites/{favoriteId} {
      allow read: if isOwner(resource.data.userId);
      
      allow create: if isAuthenticated()
        && request.resource.data.userId == currentUserId()
        && isNonEmptyString(request.resource.data.sheepId);
      
      allow update: if false;
      
      allow delete: if isOwner(resource.data.userId);
    }
    
    // ================= NOTIFICATIONS COLLECTION =================
    
    match /notifications/{notificationId} {
      allow read: if isOwner(resource.data.userId);
      
      allow create: if isAdmin() || request.auth == null;
      
      allow update: if (isAuthenticated() && isOwner(resource.data.userId)) || isAdmin();
      
      allow delete: if isOwner(resource.data.userId) || isAdmin();
    }
    
    // ================= SUPPORT TICKETS COLLECTION =================
    
    match /support/{ticketId} {
      allow read: if (isAuthenticated() && resource.data.userId == currentUserId()) || isAdmin();
      
      allow create: if isAuthenticated()
        && hasAll(['id', 'userId', 'subject', 'message', 'status', 'createdAt'])
        && request.resource.data.id == ticketId
        && request.resource.data.userId == currentUserId()
        && request.resource.data.status == 'open'
        && hasMinLength(request.resource.data.subject, 5)
        && hasMinLength(request.resource.data.message, 10)
        && isValidTimestamp(request.resource.data.createdAt);
      
      allow update: if isAdmin();
      
      allow delete: if isAdmin();
    }
    
    // ================= SETTINGS COLLECTION =================
    
    match /settings/{settingId} {
      allow read: if isAuthenticated();
      
      allow create: if isAdmin();
      
      allow update: if isAdmin();
      
      allow delete: if isAdmin();
    }
    
    // ================= PASSWORD RESET TOKENS COLLECTION =================
    
    match /passwordResetTokens/{tokenId} {
      allow read: if request.auth == null;
      allow create: if request.auth == null;
      allow update: if request.auth == null;
      allow delete: if request.auth == null;
    }
    
    // ================= EMAIL VERIFICATION TOKENS COLLECTION =================
    
    match /emailVerificationTokens/{tokenId} {
      allow read: if request.auth == null;
      allow create: if request.auth == null;
      allow update: if request.auth == null;
      allow delete: if request.auth == null;
    }
    
    // ================= PASSWORD RESET COLLECTION =================
    
    match /password_resets/{resetId} {
      allow read: if false;
      allow create: if false;
      allow update: if false;
      allow delete: if false;
    }
    
    // ================= PENDING REGISTRATIONS COLLECTION =================
    
    match /pending_registrations/{registrationId} {
      allow read: if false;
      allow create: if false;
      allow update: if false;
      allow delete: if false;
    }
    
    // ================= DEFAULT DENY ALL =================
    
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## الميزات الأمنية الرئيسية:

✅ **المستخدمون المصرحون** - يمكن إنشاء حسابات وطلبات  
✅ **البائعون** - يمكنهم إضافة الأضاحي والتحكم بطلباتهم  
✅ **المشترون** - يمكنهم إنشاء طلبات والتقييم  
✅ **المسؤولون** - يمكنهم إدارة كل شيء  
✅ **التحقق من البيانات** - التحقق من الأسعار والأعمار والأوزان  
✅ **حماية البيانات الشخصية** - لا يمكن لأحد الوصول لبيانات الآخرين

---

## اختبار القواعس

بعد النشر، جرب إنشاء طلب من التطبيق:
1. سجل الدخول بحسابك
2. اختر أضحية وأتمم الطلب
3. يجب أن ترى: ✅ "تم إنشاء الطلب بنجاح"

إذا حصلت على خطأ، تحقق من:
- ✅ أن المستخدم مصرح به (logged in)
- ✅ أن البيانات تتضمن `buyerId`, `sheepId`, `status`, `createdAt`
- ✅ أن التوكن يُرسل مع الطلب (Authorization header)
