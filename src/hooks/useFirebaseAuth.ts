// src/hooks/useFirebaseAuth.ts
import { useFirebase } from '../contexts/FirebaseContext';

export function useFirebaseAuth() {
  const {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  } = useFirebase();

  return {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    isAuthenticated: !!user,
  };
}
