// scripts/add-test-admin.js
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, query, where, getDocs, serverTimestamp, setDoc, doc } = require('firebase/firestore');
require('dotenv').config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to add a test admin user with a specific document ID
async function addTestAdmin() {
  try {
    const email = process.env.TEST_ADMIN_EMAIL || 'test@example.com';
    
    // Check if admin already exists
    const adminQuery = query(
      collection(db, 'admins'),
      where('email', '==', email)
    );
    
    const querySnapshot = await getDocs(adminQuery);
    
    if (!querySnapshot.empty) {
      console.log(`Admin with email ${email} already exists.`);
      
      // Log the existing admin document
      querySnapshot.forEach(doc => {
        console.log('Existing admin document:', doc.id);
        console.log('Document data:', doc.data());
      });
      
      return;
    }
    
    // Define admin permissions
    const permissions = [
      'manage_admins',
      'view_analytics',
      'manage_billing',
      'manage_users',
      'manage_content',
      'manage_settings'
    ];
    
    // Create admin document with a specific ID
    const adminDocId = 'test_admin';
    const adminData = {
      email,
      firstName: 'Test',
      lastName: 'Admin',
      role: 'super_admin',
      permissions,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };
    
    // Use setDoc to create a document with a specific ID
    await setDoc(doc(db, 'admins', adminDocId), adminData);
    
    console.log(`Test admin user added with ID: ${adminDocId}`);
    console.log(`Email: ${email}`);
    console.log(`Role: super_admin`);
    console.log(`Permissions: ${permissions.join(', ')}`);
    
    // Verify the document was created
    const verifyDoc = await getDocs(adminQuery);
    if (!verifyDoc.empty) {
      console.log('Verification successful: Admin document created');
    } else {
      console.log('Verification failed: Admin document not found after creation');
    }
    
    return adminDocId;
  } catch (error) {
    console.error('Error adding test admin user:', error);
    throw error;
  }
}

// Run the function
addTestAdmin()
  .then(() => {
    console.log('Test admin creation completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to add test admin:', error);
    process.exit(1);
  });
