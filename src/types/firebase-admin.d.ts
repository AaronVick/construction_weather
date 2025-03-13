declare module '../../src/lib/firebaseAdmin' {
    import * as admin from 'firebase-admin';
    
    export const db: admin.firestore.Firestore;
    export const auth: admin.auth.Auth;
    export const storage: admin.storage.Storage;
    export const admin: typeof admin;
    
    export function handleFirebaseAdminError(error: any): {
      message: string;
      field: string | null;
    };
  }