import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminAuth, getAdminDb, setCorsHeaders, FIREBASE_PROJECT_ID, FIREBASE_API_KEY, extractDocumentData } from '../_utils/firebase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;
    console.log('🗑️ Delete unverified account request for:', email);

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: "Email required" 
      });
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    if (!adminAuth) {
      return res.status(503).json({
        success: false,
        error: "Firebase Admin not configured. Please contact administrator."
      });
    }

    // Get user from Firestore
    let user: any = null;
    if (adminDb) {
      const usersRef = adminDb.collection('users');
      const snapshot = await usersRef.where('email', '==', email).get();
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        user = { uid: doc.id, ...doc.data() };
      }
    }
    
    if (!user) {
      console.log('⚠️ User not found in Firestore, checking Firebase Auth...');
      
      // Try to find and delete from Firebase Auth directly
      try {
        const authUser = await adminAuth.getUserByEmail(email);
        if (authUser && !authUser.emailVerified) {
          await adminAuth.deleteUser(authUser.uid);
          console.log('✅ Deleted unverified user from Firebase Auth:', authUser.uid);
        }
      } catch (authError: any) {
        if (authError.code === 'auth/user-not-found') {
          console.log('✅ User not found in Firebase Auth either');
        }
      }
      
      return res.json({ 
        success: true, 
        message: "Account cleared" 
      });
    }

    // Only delete if not verified
    if (user.emailVerified) {
      console.log('❌ Cannot delete verified account');
      return res.status(403).json({ 
        success: false, 
        error: "Cannot delete verified account" 
      });
    }

    console.log('🗑️ Deleting unverified account:', user.uid);

    // Delete from Firebase Auth using Admin SDK
    try {
      await adminAuth.deleteUser(user.uid);
      console.log('✅ Deleted from Firebase Auth:', user.uid);
    } catch (authError: any) {
      if (authError.code === 'auth/user-not-found') {
        console.log('⚠️ User not found in Firebase Auth');
      } else {
        console.error('❌ Error deleting from Firebase Auth:', authError.message);
      }
    }

    // Delete from Firestore
    const deleteDocResponse = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${user.uid}`,
      {
        method: "DELETE",
        headers: {
          "X-Goog-Api-Key": FIREBASE_API_KEY || ""
        }
      }
    );

    if (!deleteDocResponse.ok && deleteDocResponse.status !== 404) {
      console.error('❌ Failed to delete Firestore document');
    } else {
      console.log('✅ Deleted from Firestore');
    }

    console.log('✅ Unverified account deleted completely');
    res.json({ 
      success: true, 
      message: "Account deleted successfully" 
    });
  } catch (error: any) {
    console.error("❌ Delete account error:", error?.message);
    res.status(500).json({ 
      success: false, 
      error: "Failed to delete account" 
    });
  }
}
