import { createContext, useContext, useEffect, useState } from "react";
import { User as FirebaseUser, onAuthStateChanged, signOut as firebaseSignOut, signInWithPopup, signInWithRedirect, getRedirectResult, setPersistence, browserLocalPersistence, signInAnonymously } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { User, UserRole } from "@shared/schema";

// Helper function to detect if device is mobile
const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent.toLowerCase();
  const mobilePatterns = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  return mobilePatterns.test(userAgent) || window.innerWidth < 768;
};

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  signInWithGoogle: (role?: UserRole) => Promise<{ success: boolean; error?: string; userExists?: boolean }>;
  signInAsGuest: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (firebaseUser: FirebaseUser) => {
    try {
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      if (userDoc.exists()) {
        setUser(userDoc.data() as User);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    if (firebaseUser) {
      await fetchUserData(firebaseUser);
    }
  };

  useEffect(() => {
    // Set Firebase persistence to browser local storage
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        // Handle redirect result from Google Sign-In (desktop only)
        getRedirectResult(auth)
          .then(async (result) => {
            if (result) {
              // User signed in via redirect
              const firebaseUser = result.user;
              const userDocRef = doc(db, "users", firebaseUser.uid);
              const userDoc = await getDoc(userDocRef);
              
              if (userDoc.exists()) {
                const existingUser = userDoc.data() as User;
                setUser(existingUser);
              } else {
                // New user - sign out and wait for role selection
                await firebaseSignOut(auth);
              }
            }
          })
          .catch((error) => {
            console.error("Error handling redirect result:", error);
          });

        // Persistence set successfully
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          setFirebaseUser(firebaseUser);
          
          if (firebaseUser) {
            await fetchUserData(firebaseUser);
          } else {
            setUser(null);
          }
          
          setLoading(false);
        });

        return () => unsubscribe();
      })
      .catch((error) => {
        console.error("Error setting persistence:", error);
        setLoading(false);
      });
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setFirebaseUser(null);
  };

  const signInWithGoogle = async (role?: UserRole): Promise<{ success: boolean; error?: string; userExists?: boolean }> => {
    try {
      const isMobile = isMobileDevice();
      console.log(`📱 Google Sign-In: ${isMobile ? 'Using Popup (Mobile)' : 'Using Redirect (Desktop)'}`);

      let result;
      if (isMobile) {
        // Use popup on mobile devices (avoids sessionStorage issues)
        result = await signInWithPopup(auth, googleProvider);
      } else {
        // Use redirect on desktop (better UX on large screens)
        await signInWithRedirect(auth, googleProvider);
        return { success: true, error: "جاري التوجيه إلى Google..." };
      }

      const firebaseUser = result.user;
      
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        // User already exists
        const existingUser = userDoc.data() as User;
        setUser(existingUser);
        return { success: true, userExists: true };
      } else {
        // New user - role is required
        if (!role) {
          // Sign out and return error
          await firebaseSignOut(auth);
          return { 
            success: false, 
            error: "يجب اختيار نوع الحساب عند التسجيل لأول مرة",
            userExists: false 
          };
        }
        
        // Create new user document
        const newUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          role: role,
          createdAt: Date.now(),
        };
        
        // Only add phone if it exists
        if (firebaseUser.phoneNumber) {
          newUser.phone = firebaseUser.phoneNumber;
        }
        
        await setDoc(userDocRef, newUser);
        setUser(newUser);
        return { success: true, userExists: false };
      }
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      
      let errorMessage = "حدث خطأ أثناء تسجيل الدخول بحساب Google";
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "تم إغلاق نافذة تسجيل الدخول";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "تم حظر نافذة تسجيل الدخول من قبل المتصفح";
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = "تم إلغاء طلب تسجيل الدخول";
      } else if (error.code === 'auth/missing-iframe-start') {
        errorMessage = "خطأ في معالجة الـ Redirect، يرجى المحاولة مرة أخرى";
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const signInAsGuest = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      localStorage.setItem("guestMode", "true");
      console.log("✅ Guest mode enabled");
      return { success: true };
    } catch (error: any) {
      console.error("Guest mode error:", error);
      return { success: false, error: "فشل دخول الزائر" };
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, signOut, refreshUser, signInWithGoogle, signInAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
