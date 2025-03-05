

import json
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase app with the service account key
cred = credentials.Certificate('serviceAccountKey.json')  # Replace with your path
firebase_admin.initialize_app(cred)

# Reference to Firestore
db = firestore.client()

# Load schema from firestore_schema.json
with open('firestore_schema.json', 'r') as file:
    firestore_schema = json.load(file)

# Initialize a dictionary to hold collections
collections = {}

# Convert schema to Firestore format
def convert_to_firestore(firestore_schema):
    for entry in firestore_schema:
        table_name = entry['table_name']
        column_name = entry['column_name']
        data_type = entry['data_type']

        # Initialize collections if not present
        if table_name not in collections:
            collections[table_name] = []

        # Append column details to the appropriate table collection
        collections[table_name].append({
            'column_name': column_name,
            'data_type': data_type
        })
    return collections

# Function to update Firestore schema
def update_firestore_schema(collections):
    for table, columns in collections.items():
        # For each table, create a collection in Firestore
        collection_ref = db.collection(table)

        # Iterate through columns and add them as fields
        for column in columns:
            column_name = column['column_name']
            data_type = column['data_type']
            
            # Creating or updating a document for each column (adjust according to your needs)
            collection_ref.add({
                'column_name': column_name,
                'data_type': data_type
            })
        print(f'Collection {table} updated/created in Firestore.')

# Main process
def main():
    print("✅ Firebase successfully initialized!")
    print("✅ Firestore client connected successfully!")

    # Convert schema to Firestore format
    collections = convert_to_firestore(firestore_schema)
    print("✅ Successfully loaded schema from 'firestore_schema.json'!")
    
    # Update Firestore with schema
    update_firestore_schema(collections)
    print("✅ Firestore schema updated successfully!")

# Execute the script
if __name__ == "__main__":
    main()
