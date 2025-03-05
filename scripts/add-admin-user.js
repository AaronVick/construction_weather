// scripts/add-admin-user.js
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, query, where, getDocs, serverTimestamp } = require('firebase/firestore');
const readline = require('readline');

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

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to add an admin user
async function addAdminUser(email, firstName, lastName, role = 'admin') {
  try {
    // Check if admin already exists
    const adminQuery = query(
      collection(db, 'admins'),
      where('email', '==', email)
    );
    
    const querySnapshot = await getDocs(adminQuery);
    
    if (!querySnapshot.empty) {
      console.log(`Admin with email ${email} already exists.`);
      return;
    }
    
    // Define admin permissions based on role
    let permissions = [];
    
    if (role === 'super_admin') {
      permissions = [
        'manage_admins',
        'view_analytics',
        'manage_billing',
        'manage_users',
        'manage_content',
        'manage_settings'
      ];
    } else if (role === 'admin') {
      permissions = [
        'view_analytics',
        'manage_billing',
        'manage_users',
        'manage_content'
      ];
    } else if (role === 'billing_admin') {
      permissions = [
        'view_analytics',
        'manage_billing'
      ];
    } else if (role === 'content_admin') {
      permissions = [
        'manage_content'
      ];
    }
    
    // Create admin document
    const adminData = {
      email,
      firstName,
      lastName,
      role,
      permissions,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'admins'), adminData);
    
    console.log(`Admin user added with ID: ${docRef.id}`);
    console.log(`Email: ${email}`);
    console.log(`Role: ${role}`);
    console.log(`Permissions: ${permissions.join(', ')}`);
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding admin user:', error);
    throw error;
  }
}

// Interactive prompt
function promptForAdminInfo() {
  rl.question('Enter admin email: ', (email) => {
    rl.question('Enter first name: ', (firstName) => {
      rl.question('Enter last name: ', (lastName) => {
        rl.question('Enter role (super_admin, admin, billing_admin, content_admin): ', async (role) => {
          // Validate role
          const validRoles = ['super_admin', 'admin', 'billing_admin', 'content_admin'];
          if (!validRoles.includes(role)) {
            console.log(`Invalid role: ${role}. Using default role 'admin'.`);
            role = 'admin';
          }
          
          try {
            await addAdminUser(email, firstName, lastName, role);
            rl.close();
          } catch (error) {
            console.error('Failed to add admin user:', error);
            rl.close();
          }
        });
      });
    });
  });
}

// Check if email is provided as command line argument
const args = process.argv.slice(2);
if (args.length >= 1) {
  const email = args[0];
  const firstName = args[1] || '';
  const lastName = args[2] || '';
  const role = args[3] || 'admin';
  
  addAdminUser(email, firstName, lastName, role)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Failed to add admin user:', error);
      process.exit(1);
    });
} else {
  // Interactive mode
  promptForAdminInfo();
}
