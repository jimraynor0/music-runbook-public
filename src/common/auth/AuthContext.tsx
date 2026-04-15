import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { isAuthorizedStaff } from './staffService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthorized: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, isAuthorized: false });

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user?.email) {
        const authorized = await isAuthorizedStaff(user.email);
        setIsAuthorized(authorized);

        if (!authorized) {
          // Sign out unauthorized users
          await signOut(auth);
          setUser(null);
        }
      } else {
        setIsAuthorized(false);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthorized }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}