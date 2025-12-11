import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { ref, onValue, set, get } from 'firebase/database';
import { auth, db } from '../services/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Fetch or Create Profile
        const userRef = ref(db, `users/${currentUser.uid}`);
        
        // Listen for profile changes (realtime kyc status updates etc)
        onValue(userRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setProfile(data);
          } else {
            // Create initial profile if it doesn't exist
            const demoExpiry = Date.now() + (3 * 24 * 60 * 60 * 1000); // 3 Days from now

            const newProfile: UserProfile = {
              uid: currentUser.uid,
              name: currentUser.displayName || 'Trader',
              email: currentUser.email || '',
              tradingId: Math.floor(100000 + Math.random() * 900000).toString(),
              avatar: currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`,
              kycStatus: 'none',
              createdAt: Date.now(),
              demoExpiresAt: demoExpiry
            };
            set(userRef, newProfile);
            setProfile(newProfile);
            
            // Set initial balance: $10k Demo, $0 Live
            set(ref(db, `portfolio/${currentUser.uid}/balance`), {
              demo: 10000,
              live: 0
            });
          }
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};