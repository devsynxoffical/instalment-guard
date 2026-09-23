import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export const authService = {
  // Login with Firebase Auth
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const profile = await this.getUserProfile(user.uid);
      return { user, profile };
    } catch (error) {
      console.error('Login Error:', error);
      throw error;
    }
  },

  // Logout
  async logout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout Error:', error);
      throw error;
    }
  },

  // Send Password Reset Email
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error) {
      console.error('Reset Password Error:', error);
      throw error;
    }
  },

  // Get user profile document from Firestore 'users' collection
  async getUserProfile(uid) {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        return { uid, ...userSnap.data() };
      }
      // Fallback default profile if document doesn't exist yet
      return {
        uid,
        email: auth.currentUser?.email || '',
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        retailerId: null,
      };
    } catch (error) {
      console.warn('Profile Fetch Error:', error);
      return {
        uid,
        email: auth.currentUser?.email || '',
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        retailerId: null,
      };
    }
  },

  // Create user profile in Firestore
  async createUserProfile(uid, profileData) {
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, {
        ...profileData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error('Create User Profile Error:', error);
      throw error;
    }
  },

  // Auth state listener
  onAuthChange(callback) {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await this.getUserProfile(user.uid);
        callback({ user, profile });
      } else {
        callback({ user: null, profile: null });
      }
    });
  },
};
