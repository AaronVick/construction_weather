// api/consolidated/clients.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db, auth } from '../../src/lib/firebaseAdmin';

export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Consolidated API endpoint for client functions
 * 
 * Routes:
 * - POST /api/consolidated/clients/import
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Extract the route from the URL
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const path = url.pathname;
    const route = path.split('/').pop();

    // Route the request to the appropriate handler
    switch (route) {
      case 'import':
        return handleImportClients(req, res);
      default:
        return res.status(404).json({ error: 'Route not found' });
    }
  } catch (error) {
    console.error('Error in clients API:', error);
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * API endpoint to import clients from CSV
 */
async function handleImportClients(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the authorization token from the request headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token and get the user
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Read the request body
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    const fileContent = buffer.toString('utf8');

    // Manual CSV parsing
    const rows = fileContent.split('\n').filter(row => row.trim() !== ''); // Split by lines and remove empty rows
    const headers = rows[0].split(',').map(header => header.trim()); // Extract headers
    const data = rows.slice(1).map(row => {
      const values = row.split(',').map(value => value.trim()); // Split each row by commas
      const rowData: { [key: string]: string | boolean | null } = {};
      headers.forEach((header, index) => {
        if (header === 'is_active') {
          rowData[header] = values[index].toLowerCase() === 'true'; // Convert to boolean
        } else {
          rowData[header] = values[index] || null; // Use null for empty values
        }
      });
      return rowData;
    });

    // Map CSV data to client structure
    const clients = data.map((row: any) => ({
      name: row.name,
      email: row.email,
      phone: row.phone || null,
      company: row.company || null,
      address: row.address || null,
      city: row.city || null,
      state: row.state || null,
      zip_code: row.zip_code || null,
      is_active: row.is_active,
      notes: row.notes || null,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // Insert clients into Firestore
    const batch = db.batch();
    const clientsCollection = db.collection('clients');
    
    clients.forEach((client) => {
      const docRef = clientsCollection.doc();
      batch.set(docRef, client);
    });
    
    await batch.commit();

    // Get the inserted clients
    const querySnapshot = await db.collection('clients')
      .where('user_id', '==', userId)
      .orderBy('created_at', 'desc')
      .limit(clients.length)
      .get();
    
    const insertedClients = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json({ data: insertedClients });
  } catch (error) {
    console.error('Error importing clients:', error);
    res.status(500).json({ message: 'Failed to import clients' });
  }
}
