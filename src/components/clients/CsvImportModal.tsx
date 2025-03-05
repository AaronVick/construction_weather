// src/components/clients/CsvImportModal.tsx


import React, { useState } from 'react';
import { useToast } from '../../hooks/useToast';
import { db } from '../../lib/firebaseClient';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import Button from '../../components/ui/Button';
import { X, Upload, Info } from 'lucide-react';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (clients: any[]) => void;
}

const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const { showToast } = useToast();
  const { user } = useFirebaseAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false); // State to toggle instructions
  const [preview, setPreview] = useState<string[][]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Preview the CSV
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const lines = content.split('\n').filter(line => line.trim());
        const previewData = lines.slice(0, 6).map(line => line.split(',').map(cell => cell.trim()));
        setPreview(previewData);
      };
      reader.readAsText(selectedFile);
    }
  };

  const processCSV = async (csvContent: string) => {
    const rows = csvContent.split('\n').filter(row => row.trim());
    const headers = rows[0].split(',').map(header => header.trim().toLowerCase());
    
    // Validate expected headers
    const requiredHeaders = ['name', 'email'];
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    
    if (missingHeaders.length > 0) {
      throw new Error(`CSV is missing required headers: ${missingHeaders.join(', ')}`);
    }

    // Check for authenticated user
    if (!user) throw new Error('No authenticated user');

    // Process CSV data
    const clients = [];
    
    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].split(',').map(value => value.trim());
      
      if (values.length < headers.length) continue; // Skip malformed rows
      
      const rowData: Record<string, any> = {};
      headers.forEach((header, index) => {
        if (header === 'is_active') {
          rowData[header] = values[index].toLowerCase() === 'true';
        } else {
          rowData[header] = values[index] || undefined;
        }
      });
      
      // Skip if required fields are missing
      if (!rowData.name || !rowData.email) continue;
      
      // Map CSV data to client structure
      clients.push({
        name: rowData.name,
        email: rowData.email,
        phone: rowData.phone,
        company: rowData.company,
        address: rowData.address,
        city: rowData.city,
        state: rowData.state,
        zip_code: rowData.zip_code,
        is_active: typeof rowData.is_active === 'boolean' ? rowData.is_active : true,
        notes: rowData.notes,
        user_id: user.uid
      });
    }
    
    return clients;
  };

  const handleImport = async () => {
    if (!file) {
      showToast('Please select a file to import', 'error');
      return;
    }

    setIsLoading(true);

    try {
      if (!user) throw new Error('No authenticated user');
      
      const fileContent = await file.text();
      const clients = await processCSV(fileContent);
      
      if (clients.length === 0) {
        throw new Error('No valid client data found in the CSV');
      }
      
      // Check for existing clients with the same email to avoid duplicates
      const existingClientsQuery = query(
        collection(db, 'clients'),
        where('user_id', '==', user.uid)
      );
      
      const existingClientsSnapshot = await getDocs(existingClientsQuery);
      const existingEmails = new Set<string>();
      
      existingClientsSnapshot.forEach(doc => {
        const clientData = doc.data();
        if (clientData.email) {
          existingEmails.add(clientData.email.toLowerCase());
        }
      });
      
      const newClients = clients.filter(client => 
        !existingEmails.has(client.email.toLowerCase())
      );
      
      if (newClients.length === 0) {
        showToast('All clients in the CSV already exist in your account', 'info');
        setIsLoading(false);
        return;
      }
      
      // Insert clients into Firestore
      const insertedClients = [];
      
      for (const client of newClients) {
        const clientData = {
          ...client,
          created_at: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, 'clients'), clientData);
        
        insertedClients.push({
          ...client,
          id: docRef.id,
          created_at: new Date().toISOString() // Use current date for UI until refresh
        });
      }
      
      onImport(insertedClients);
      showToast(`${insertedClients.length} clients imported successfully`, 'success');
      onClose();
    } catch (error) {
      console.error('Error importing clients:', error);
      showToast(error instanceof Error ? error.message : 'Failed to import clients', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="relative w-full max-w-2xl p-6 mx-4 rounded-lg shadow-xl bg-white dark:bg-gray-800">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold mb-4 dark:text-white">Import Clients from CSV</h2>

        <div className="space-y-4">
          {/* Instructions Section */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <Info className="w-4 h-4" />
              <span>How should the CSV file be formatted?</span>
            </button>

            {showInstructions && (
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                <p className="mb-2">
                  Your CSV file should include the following columns in this exact order:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>name</strong> (required)</li>
                  <li><strong>email</strong> (required)</li>
                  <li><strong>phone</strong> (optional)</li>
                  <li><strong>company</strong> (optional)</li>
                  <li><strong>address</strong> (optional)</li>
                  <li><strong>city</strong> (optional)</li>
                  <li><strong>state</strong> (optional)</li>
                  <li><strong>zip_code</strong> (optional)</li>
                  <li><strong>is_active</strong> (required, must be "true" or "false")</li>
                  <li><strong>notes</strong> (optional)</li>
                </ul>
                <p className="mt-2">
                  Example CSV:
                </p>
                <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded-md text-xs mt-2">
                  {`name,email,phone,company,address,city,state,zip_code,is_active,notes
John Doe,john.doe@example.com,123-456-7890,Company Inc,123 Main St,Cityville,CA,12345,true,Some notes
Jane Smith,jane.smith@example.com,987-654-3210,Company LLC,456 Elm St,Townsville,NY,67890,false,More notes`}
                </pre>
              </div>
            )}
          </div>

          {/* File Input Section */}
          <div className="border-2 border-dashed rounded-lg p-6 mb-4 text-center">
            {file ? (
              <div>
                <Upload className="mx-auto h-12 w-12 mb-4 text-blue-500 dark:text-blue-400" />
                <p className="font-medium dark:text-white">
                  {file.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
                <button
                  onClick={() => {
                    setFile(null);
                    setPreview([]);
                  }}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div>
                <Upload className="mx-auto h-12 w-12 mb-4 text-gray-500 dark:text-gray-400" />
                <p className="font-medium mb-1 dark:text-white">
                  Drop your CSV file here or click to browse
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  CSV files only
                </p>
              </div>
            )}
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isLoading}
            />
          </div>

          {/* Preview Section */}
          {preview.length > 0 && (
            <div className="mb-4 overflow-x-auto">
              <h3 className="text-sm font-medium mb-2 dark:text-gray-200">
                Preview
              </h3>
              <table className="min-w-full divide-y text-sm dark:divide-gray-700 divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {preview[0].map((header, i) => (
                      <th 
                        key={i} 
                        className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700 divide-gray-200">
                  {preview.slice(1, 5).map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td 
                          key={j}
                          className="px-3 py-2 whitespace-nowrap text-gray-800 dark:text-gray-300"
                        >
                          {cell || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 5 && (
                <p className="mt-2 text-xs italic text-gray-500 dark:text-gray-400">
                  Showing first {Math.min(4, preview.length - 1)} rows of {preview.length - 1}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleImport}
              disabled={isLoading || !file}
            >
              {isLoading ? 'Importing...' : 'Import'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CsvImportModal;
