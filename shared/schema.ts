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
  createdAt: number;
}

export const insertUserSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  role: z.enum(userRoles, { required_error: "يجب اختيار نوع الحساب" }),
  phone: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

// Sheep schema (Firestore)
export interface Sheep {
  id: string;
  sellerId: string;
  sellerEmail?: string;
  images: string[]; // URLs from Firebase Storage
  price: number;
  age: number; // in months
  weight: number; // in kg
  city: string;
  description: string;
  status: SheepStatus;
  createdAt: number;
  updatedAt?: number;
}

export const insertSheepSchema = z.object({
  price: z.number().min(1, "السعر يجب أن يكون أكبر من صفر"),
  age: z.number().min(1, "العمر يجب أن يكون أكبر من صفر"),
  weight: z.number().min(1, "الوزن يجب أن يكون أكبر من صفر"),
  city: z.string().min(2, "يجب إدخال المدينة"),
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

// Common cities in Saudi Arabia (can be extended)
export const saudiCities = [
  "الرياض",
  "جدة",
  "مكة المكرمة",
  "المدينة المنورة",
  "الدمام",
  "الخبر",
  "الظهران",
  "الطائف",
  "أبها",
  "تبوك",
  "بريدة",
  "خميس مشيط",
  "حائل",
  "نجران",
  "جازان",
  "ينبع",
  "القطيف",
  "الأحساء"
] as const;
