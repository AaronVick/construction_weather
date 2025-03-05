// scripts/create-admin-user.js
const admin = require('firebase-admin');
const readline = require('readline');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
  });
}

const db = admin.firestore();
const auth = admin.auth();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Prompt user for input
 * @param {string} question - The question to ask
 * @returns {Promise<string>} - The user's answer
 */
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Create a new admin user
 */
async function createAdminUser() {
  try {
    console.log('=== Create Admin User ===');
    
    // Get user input
    const email = await prompt('Enter admin email: ');
    const password = await prompt('Enter admin password (min 6 characters): ');
    const firstName = await prompt('Enter admin first name (optional): ');
    const lastName = await prompt('Enter admin last name (optional): ');
    
    // Check if user already exists in Firebase Auth
    let uid;
    try {
      const userRecord = await auth.getUserByEmail(email);
      uid = userRecord.uid;
      console.log(`User already exists with UID: ${uid}`);
    } catch (error) {
      // User doesn't exist, create a new one
      if (error.code === 'auth/user-not-found') {
        const newUser = await auth.createUser({
          email,
          password,
          displayName: `${firstName} ${lastName}`.trim(),
        });
        uid = newUser.uid;
        console.log(`Created new user with UID: ${uid}`);
      } else {
        throw error;
      }
    }
    
    // Check if user is already an admin
    const adminRef = db.collection('admins').where('email', '==', email);
    const adminSnapshot = await adminRef.get();
    
    if (!adminSnapshot.empty) {
      console.log('User is already an admin. Updating permissions...');
      
      // Update existing admin
      const adminDoc = adminSnapshot.docs[0];
      await adminDoc.ref.update({
        firstName: firstName || adminDoc.data().firstName || '',
        lastName: lastName || adminDoc.data().lastName || '',
        role: 'super_admin',
        permissions: [
          'manage_users',
          'manage_subscriptions',
          'view_analytics',
          'manage_billing',
          'manage_settings',
          'manage_admins',
          'support_access'
        ],
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`Admin user updated: ${email}`);
    } else {
      // Create new admin document
      await db.collection('admins').doc(uid).set({
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        role: 'super_admin',
        permissions: [
          'manage_users',
          'manage_subscriptions',
          'view_analytics',
          'manage_billing',
          'manage_settings',
          'manage_admins',
          'support_access'
        ],
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`Admin user created: ${email}`);
    }
    
    console.log('\nAdmin user setup complete!');
    console.log(`You can now log in with email: ${email} and the provided password.`);
    console.log('Visit /admin/dashboard to access the admin area.');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    rl.close();
  }
}

// Run the script
createAdminUser();
