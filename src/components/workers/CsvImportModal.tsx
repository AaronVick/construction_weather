// src/components/workers/CsvImportModal.tsx
import React, { useState } from 'react';
import { X, Upload, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import Button from '../ui/Button';
import { db } from '../../lib/firebaseClient';
import type { Worker } from '../../types/worker';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (importedWorkers: Worker[]) => void;
}

const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const theme = useTheme();
  const darkMode = theme ? theme.darkMode : false;
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [preview, setPreview] = useState<string[][]>([]);
  const { user } = useFirebaseAuth();

  // Don't render if not open
  if (!isOpen) return null;
  
  // Handle modal close
  const handleClose = (e: React.MouseEvent) => {
    // Prevent the click from reaching the file input
    e.stopPropagation();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError('');
    setSuccess(false);

    if (!selectedFile) {
      setFile(null);
      setPreview([]);
      return;
    }

    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      setFile(null);
      setPreview([]);
      return;
    }

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
  };

  const processCSV = async (csvContent: string): Promise<Worker[]> => {
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
    const workers: Partial<Worker>[] = [];
    
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
      
      // Map CSV data to worker structure
      workers.push({
        name: rowData.name,
        email: rowData.email,
        phone: rowData.phone,
        position: rowData.position || rowData.role, // Accept either field name
        emergency_contact: rowData.emergency_contact,
        notes: rowData.notes,
        is_active: typeof rowData.is_active === 'boolean' ? rowData.is_active : true,
        user_id: user.uid
      });
    }
    
    return workers as Worker[];
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a CSV file');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      if (!user) throw new Error('No authenticated user');
      
      const fileContent = await file.text();
      const workers = await processCSV(fileContent);
      
      if (workers.length === 0) {
        throw new Error('No valid worker data found in the CSV');
      }
      
      // Check for existing workers with the same email to avoid duplicates
      const existingWorkersQuery = query(
        collection(db, 'workers'),
        where('user_id', '==', user.uid)
      );
      
      const existingWorkersSnapshot = await getDocs(existingWorkersQuery);
      const existingEmails = new Set<string>();
      
      existingWorkersSnapshot.forEach(doc => {
        const workerData = doc.data();
        if (workerData.email) {
          existingEmails.add(workerData.email.toLowerCase());
        }
      });
      
      const newWorkers = workers.filter(worker => 
        !existingEmails.has(worker.email.toLowerCase())
      );
      
      if (newWorkers.length === 0) {
        setSuccess(true);
        setError('All workers in the CSV already exist in your account');
        setLoading(false);
        return;
      }
      
      // Insert workers into Firestore
      const insertedWorkers: Worker[] = [];
      
      for (const worker of newWorkers) {
        const workerData = {
          ...worker,
          created_at: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, 'workers'), workerData);
        
        insertedWorkers.push({
          ...worker,
          id: docRef.id,
          created_at: new Date().toISOString() // Use current date for UI until refresh
        } as Worker);
      }
      
      setSuccess(true);
      onImport(insertedWorkers);
      
      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (err) {
      console.error('Error importing workers:', err);
      setError(err instanceof Error ? err.message : 'Failed to import workers');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      onClick={handleClose} // Close when clicking the backdrop
    >
      <div 
        className={`relative w-full max-w-2xl p-6 mx-4 rounded-lg shadow-xl ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
          type="button"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className={`text-xl font-semibold mb-4 ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Import Workers from CSV
        </h2>

        <div className={`mb-6 p-4 rounded ${
          darkMode ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <h3 className={`text-sm font-medium mb-2 ${
            darkMode ? 'text-gray-200' : 'text-gray-700'
          }`}>
            CSV Format Guidelines
          </h3>
          <p className={`text-sm mb-2 ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Your CSV should include these headers:
          </p>
          <ul className={`list-disc pl-5 mb-2 text-sm ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            <li><strong>name</strong> (required)</li>
            <li><strong>email</strong> (required)</li>
            <li>phone</li>
            <li>position (or role)</li>
            <li>emergency_contact</li>
            <li>notes</li>
            <li>is_active (true/false)</li>
          </ul>
          <p className={`text-sm ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Note: Workers with emails that already exist in the system will be skipped.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded flex items-start bg-red-50 text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded flex items-start bg-green-50 text-green-700 text-sm">
            <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>Workers imported successfully!</span>
          </div>
        )}

        <div className={`border-2 border-dashed rounded-lg p-6 mb-4 text-center ${
          file 
            ? (darkMode ? 'border-blue-500 bg-blue-500/10' : 'border-blue-300 bg-blue-50') 
            : (darkMode ? 'border-gray-600 bg-gray-700/30' : 'border-gray-300 bg-gray-50')
        }`}>
          {file ? (
            <div>
              <FileText className={`mx-auto h-12 w-12 mb-4 ${
                darkMode ? 'text-blue-400' : 'text-blue-500'
              }`} />
              <p className={`font-medium ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {file.name}
              </p>
              <p className={`text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {(file.size / 1024).toFixed(2)} KB
              </p>
              <button
                onClick={() => {
                  setFile(null);
                  setPreview([]);
                }}
                className={`mt-2 text-sm ${
                  darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                Remove file
              </button>
            </div>
          ) : (
            <div>
              <Upload className={`mx-auto h-12 w-12 mb-4 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <p className={`font-medium mb-1 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Drop your CSV file here or click to browse
              </p>
              <p className={`text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                CSV files only
              </p>
            </div>
          )}
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className={`absolute inset-0 w-full h-full opacity-0 cursor-pointer ${file ? 'pointer-events-none' : ''}`}
            disabled={loading}
            onClick={(e) => e.stopPropagation()} // Stop propagation on the input element
          />
        </div>

        {preview.length > 0 && (
          <div className="mb-4 overflow-x-auto">
            <h3 className={`text-sm font-medium mb-2 ${
              darkMode ? 'text-gray-200' : 'text-gray-700'
            }`}>
              Preview
            </h3>
            <table className={`min-w-full divide-y text-sm ${
              darkMode ? 'divide-gray-700' : 'divide-gray-200'
            }`}>
              <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  {preview[0].map((header, i) => (
                    <th 
                      key={i} 
                      className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wider ${
                        darkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${
                darkMode ? 'divide-gray-700' : 'divide-gray-200'
              }`}>
                {preview.slice(1, 5).map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td 
                        key={j}
                        className={`px-3 py-2 whitespace-nowrap ${
                          darkMode ? 'text-gray-300' : 'text-gray-800'
                        }`}
                      >
                        {cell || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 5 && (
              <p className={`mt-2 text-xs italic ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Showing first {Math.min(4, preview.length - 1)} rows of {preview.length - 1}
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={(e) => {
              e.stopPropagation(); // Stop event propagation
              onClose();
            }}
            disabled={loading}
            type="button" // Explicitly set type to avoid form submission
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleImport}
            disabled={loading || !file}
            loading={loading}
            type="button" // Explicitly set type
          >
            {loading ? 'Importing...' : 'Import Workers'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CsvImportModal;
