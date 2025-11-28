import { z } from "zod";

// User roles
export const userRoles = ["buyer", "seller", "admin"] as const;
export type UserRole = typeof userRoles[number];

// Sheep status
export const sheepStatuses = ["pending", "approved", "rejected"] as const;
export type SheepStatus = typeof sheepStatuses[number];

// Order status  
export const orderStatuses = ["pending", "confirmed", "rejected", "delivered"] as const;
export type OrderStatus = typeof orderStatuses[number];

// User schema (Firestore)
export interface User {
  uid: string;
  email: string;
  role: UserRole;
  phone?: string;
  // Seller-specific fields
  fullName?: string;
  address?: string;
  city?: string;
  municipality?: string; // البلدية/الحي
  profileComplete?: boolean; // هل ملأ البائع بيانات كاملة
  createdAt: number;
  updatedAt?: number;
}

export const insertUserSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  role: z.enum(userRoles, { required_error: "يجب اختيار نوع الحساب" }),
  phone: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

// Seller profile update schema
export const updateSellerProfileSchema = z.object({
  fullName: z.string().min(3, "الاسم الكامل يجب أن يكون 3 أحرف على الأقل"),
  phone: z.string().min(7, "رقم الهاتف يجب أن يكون صحيح"),
  address: z.string().min(5, "العنوان يجب أن يكون 5 أحرف على الأقل"),
  city: z.string().min(2, "يجب اختيار المدينة"),
  municipality: z.string().min(2, "يجب إدخال البلدية"),
});

export type UpdateSellerProfile = z.infer<typeof updateSellerProfileSchema>;

// Sheep schema (Firestore)
export interface Sheep {
  id: string;
  sellerId: string;
  sellerEmail?: string;
  images: string[]; // URLs from ImgBB
  price: number;
  age: number; // in months
  weight: number; // in kg
  city: string;
  municipality?: string; // البلدية/الحي
  description: string;
  status: SheepStatus;
  rejectionReason?: string; // سبب الرفض (إن وجد)
  createdAt: number;
  updatedAt?: number;
}

export const insertSheepSchema = z.object({
  price: z.number().min(1, "السعر يجب أن يكون أكبر من صفر"),
  age: z.number().min(1, "العمر يجب أن يكون أكبر من صفر"),
  weight: z.number().min(1, "الوزن يجب أن يكون أكبر من صفر"),
  city: z.string().min(2, "يجب اختيار الولاية"),
  municipality: z.string().min(2, "يجب اختيار البلدية"),
  description: z.string().min(10, "الوصف يجب أن يكون 10 أحرف على الأقل"),
});

export type InsertSheep = z.infer<typeof insertSheepSchema>;

// Order schema (Firestore)
export interface Order {
  id: string;
  buyerId: string;
  buyerEmail?: string;
  sellerId: string;
  sellerEmail?: string;
  sheepId: string;
  sheepData?: Partial<Sheep>; // Snapshot of sheep data at order time
  totalPrice: number;
  status: OrderStatus;
  createdAt: number;
  updatedAt?: number;
}

export const insertOrderSchema = z.object({
  sheepId: z.string().min(1, "يجب اختيار الخروف"),
  totalPrice: z.number().min(1, "السعر غير صالح"),
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;

// Filter schema for sheep browsing
export const sheepFilterSchema = z.object({
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  minAge: z.number().optional(),
  maxAge: z.number().optional(),
  minWeight: z.number().optional(),
  maxWeight: z.number().optional(),
  cities: z.array(z.string()).optional(),
  status: z.enum(sheepStatuses).optional(),
});

export type SheepFilter = z.infer<typeof sheepFilterSchema>;

// Algerian provinces (Wilayat) - 58 provinces from official data - sorted alphabetically
export const algeriaCities = [
  "أدرار",
  "أم البواقي",
  "أولاد جلال",
  "إليزي",
  "الأغواط",
  "الجزائر",
  "الجلفة",
  "الشلف",
  "الطارف",
  "الوادي",
  "النعامة",
  "البليدة",
  "البويرة",
  "البيض",
  "المدية",
  "المسيلة",
  "المغير",
  "المنيعة",
  "باتنة",
  "بجاية",
  "برج باجي مختار",
  "برج بوعريريج",
  "بسكرة",
  "بشار",
  "بني عباس",
  "بومرداس",
  "تبسة",
  "تقرت",
  "تلمسان",
  "تمنراست",
  "تندوف",
  "تيارت",
  "تيبازة",
  "تيزي وزو",
  "تيسمسيلت",
  "تيميمون",
  "جانت",
  "جيجل",
  "خنشلة",
  "سطيف",
  "سعيدة",
  "سكيكدة",
  "سوق أهراس",
  "سيدي بلعباس",
  "عنابة",
  "عين الدفلة",
  "عين تيموشنت",
  "عين صالح",
  "عين قزام",
  "غرداية",
  "غليزان",
  "قالمة",
  "قسنطينة",
  "مستغانم",
  "معسكر",
  "ميلة",
  "ورقلة",
  "وهران",
] as const;
