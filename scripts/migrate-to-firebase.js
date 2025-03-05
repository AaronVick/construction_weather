// scripts/migrate-to-firebase.js
const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_API;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
});

const db = admin.firestore();

// Helper function to convert Supabase timestamp to Firestore timestamp
function toFirestoreTimestamp(dateString) {
  if (!dateString) return null;
  return admin.firestore.Timestamp.fromDate(new Date(dateString));
}

// Migrate users
async function migrateUsers() {
  console.log('Migrating users...');
  
  try {
    // Get all users from Supabase
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      throw error;
    }
    
    console.log(`Found ${users.length} users to migrate`);
    
    // Create a batch for Firebase operations
    const batch = db.batch();
    
    // Process each user
    for (const user of users) {
      // Create or update user in Firebase Authentication
      try {
        // Check if user already exists in Firebase
        try {
          await admin.auth().getUser(user.id);
          console.log(`User ${user.id} already exists in Firebase`);
        } catch (error) {
          // User doesn't exist, create them
          await admin.auth().createUser({
            uid: user.id,
            email: user.email,
            emailVerified: user.email_confirmed_at !== null,
            displayName: user.user_metadata?.full_name || '',
            disabled: !user.is_active,
          });
          console.log(`Created user ${user.id} in Firebase`);
        }
        
        // Add user data to Firestore
        const userRef = db.collection('users').doc(user.id);
        batch.set(userRef, {
          email: user.email,
          created_at: toFirestoreTimestamp(user.created_at),
          updated_at: toFirestoreTimestamp(user.updated_at),
          last_sign_in: toFirestoreTimestamp(user.last_sign_in_at),
          user_metadata: user.user_metadata || {},
        });
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
      }
    }
    
    // Commit the batch
    await batch.commit();
    console.log('Users migration completed');
  } catch (error) {
    console.error('Error migrating users:', error);
  }
}

// Migrate clients
async function migrateClients() {
  console.log('Migrating clients...');
  
  try {
    // Get all clients from Supabase
    const { data: clients, error } = await supabase.from('clients').select('*');
    
    if (error) {
      throw error;
    }
    
    console.log(`Found ${clients.length} clients to migrate`);
    
    // Process in batches of 500 (Firestore batch limit)
    const batchSize = 500;
    for (let i = 0; i < clients.length; i += batchSize) {
      const batch = db.batch();
      const currentBatch = clients.slice(i, i + batchSize);
      
      for (const client of currentBatch) {
        const clientRef = db.collection('clients').doc(client.id);
        batch.set(clientRef, {
          ...client,
          created_at: toFirestoreTimestamp(client.created_at),
          updated_at: toFirestoreTimestamp(client.updated_at),
        });
      }
      
      await batch.commit();
      console.log(`Migrated clients batch ${i / batchSize + 1}`);
    }
    
    console.log('Clients migration completed');
  } catch (error) {
    console.error('Error migrating clients:', error);
  }
}

// Migrate jobsites
async function migrateJobsites() {
  console.log('Migrating jobsites...');
  
  try {
    // Get all jobsites from Supabase
    const { data: jobsites, error } = await supabase.from('jobsites').select('*');
    
    if (error) {
      throw error;
    }
    
    console.log(`Found ${jobsites.length} jobsites to migrate`);
    
    // Process in batches of 500 (Firestore batch limit)
    const batchSize = 500;
    for (let i = 0; i < jobsites.length; i += batchSize) {
      const batch = db.batch();
      const currentBatch = jobsites.slice(i, i + batchSize);
      
      for (const jobsite of currentBatch) {
        const jobsiteRef = db.collection('jobsites').doc(jobsite.id);
        batch.set(jobsiteRef, {
          ...jobsite,
          created_at: toFirestoreTimestamp(jobsite.created_at),
          updated_at: toFirestoreTimestamp(jobsite.updated_at),
        });
      }
      
      await batch.commit();
      console.log(`Migrated jobsites batch ${i / batchSize + 1}`);
    }
    
    console.log('Jobsites migration completed');
  } catch (error) {
    console.error('Error migrating jobsites:', error);
  }
}

// Migrate worker_jobsites
async function migrateWorkerJobsites() {
  console.log('Migrating worker_jobsites...');
  
  try {
    // Get all worker_jobsites from Supabase
    const { data: workerJobsites, error } = await supabase.from('worker_jobsites').select('*');
    
    if (error) {
      throw error;
    }
    
    console.log(`Found ${workerJobsites.length} worker_jobsites to migrate`);
    
    // Process in batches of 500 (Firestore batch limit)
    const batchSize = 500;
    for (let i = 0; i < workerJobsites.length; i += batchSize) {
      const batch = db.batch();
      const currentBatch = workerJobsites.slice(i, i + batchSize);
      
      for (const workerJobsite of currentBatch) {
        // Create a unique ID for the worker_jobsite document
        const docId = `${workerJobsite.worker_id}_${workerJobsite.jobsite_id}`;
        const workerJobsiteRef = db.collection('worker_jobsites').doc(docId);
        batch.set(workerJobsiteRef, {
          worker_id: workerJobsite.worker_id,
          jobsite_id: workerJobsite.jobsite_id,
          created_at: toFirestoreTimestamp(workerJobsite.created_at),
        });
      }
      
      await batch.commit();
      console.log(`Migrated worker_jobsites batch ${i / batchSize + 1}`);
    }
    
    console.log('Worker_jobsites migration completed');
  } catch (error) {
    console.error('Error migrating worker_jobsites:', error);
  }
}

// Migrate workers
async function migrateWorkers() {
  console.log('Migrating workers...');
  
  try {
    // Get all workers from Supabase
    const { data: workers, error } = await supabase.from('workers').select('*');
    
    if (error) {
      throw error;
    }
    
    console.log(`Found ${workers.length} workers to migrate`);
    
    // Process in batches of 500 (Firestore batch limit)
    const batchSize = 500;
    for (let i = 0; i < workers.length; i += batchSize) {
      const batch = db.batch();
      const currentBatch = workers.slice(i, i + batchSize);
      
      for (const worker of currentBatch) {
        const workerRef = db.collection('workers').doc(worker.id);
        batch.set(workerRef, {
          ...worker,
          created_at: toFirestoreTimestamp(worker.created_at),
          updated_at: toFirestoreTimestamp(worker.updated_at),
        });
      }
      
      await batch.commit();
      console.log(`Migrated workers batch ${i / batchSize + 1}`);
    }
    
    console.log('Workers migration completed');
  } catch (error) {
    console.error('Error migrating workers:', error);
  }
}

// Migrate subscriptions
async function migrateSubscriptions() {
  console.log('Migrating subscriptions...');
  
  try {
    // Get all subscriptions from Supabase
    const { data: subscriptions, error } = await supabase.from('subscriptions').select('*');
    
    if (error) {
      throw error;
    }
    
    console.log(`Found ${subscriptions.length} subscriptions to migrate`);
    
    // Process in batches of 500 (Firestore batch limit)
    const batchSize = 500;
    for (let i = 0; i < subscriptions.length; i += batchSize) {
      const batch = db.batch();
      const currentBatch = subscriptions.slice(i, i + batchSize);
      
      for (const subscription of currentBatch) {
        const subscriptionRef = db.collection('subscriptions').doc(subscription.id);
        batch.set(subscriptionRef, {
          ...subscription,
          start_date: toFirestoreTimestamp(subscription.start_date),
          end_date: toFirestoreTimestamp(subscription.end_date),
          trial_end: toFirestoreTimestamp(subscription.trial_end),
          next_billing_date: toFirestoreTimestamp(subscription.next_billing_date),
          cancellation_date: toFirestoreTimestamp(subscription.cancellation_date),
          created_at: toFirestoreTimestamp(subscription.created_at),
          updated_at: toFirestoreTimestamp(subscription.updated_at),
        });
      }
      
      await batch.commit();
      console.log(`Migrated subscriptions batch ${i / batchSize + 1}`);
    }
    
    console.log('Subscriptions migration completed');
  } catch (error) {
    console.error('Error migrating subscriptions:', error);
  }
}

// Run the migration
async function runMigration() {
  try {
    await migrateUsers();
    await migrateClients();
    await migrateJobsites();
    await migrateWorkers();
    await migrateWorkerJobsites();
    await migrateSubscriptions();
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close connections
    process.exit(0);
  }
}

runMigration();
