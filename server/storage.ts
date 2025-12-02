import { type User, type InsertUser } from "@shared/schema";
import { randomUUID } from "node:crypto";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, query, where } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(uid: string, data: Partial<User>): Promise<void>;
}

export class FirebaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    try {
      const userDoc = await getDoc(doc(db, "users", id));
      if (userDoc.exists()) {
        return userDoc.data() as User;
      }
      return undefined;
    } catch (error) {
      console.error("Error getting user:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return undefined;
      }
      
      return querySnapshot.docs[0].data() as User;
    } catch (error) {
      console.error("Error getting user by email:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const uid = randomUUID();
    const user: User = { 
      uid,
      email: insertUser.email,
      role: insertUser.role,
      phone: insertUser.phone,
      createdAt: Date.now()
    };
    return user;
  }

  async updateUser(uid: string, data: Partial<User>): Promise<void> {
    try {
      const userRef = doc(db, "users", uid);
      
      // Remove undefined values
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      );
      
      // Convert null to deleteField for Firestore
      const updateData: any = {};
      for (const [key, value] of Object.entries(cleanData)) {
        updateData[key] = value;
      }
      
      await setDoc(userRef, updateData, { merge: true });
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }
}

export const storage = new FirebaseStorage();