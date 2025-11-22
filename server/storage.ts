import { type User, type InsertUser } from "@shared/schema";
import { randomUUID } from "node:crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;

  constructor() {
    this.users = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
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
    this.users.set(uid, user);
    return user;
  }
}

export const storage = new MemStorage();
