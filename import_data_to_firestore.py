import os
import json
import firebase_admin
from firebase_admin import credentials, firestore

# Configurations
SERVICE_ACCOUNT_FILE = "serviceAccountKey.json"
SCHEMA_FILE_PATH = "firestore_schema.json"
EXPORT_FILE_PATH = "supabase_export.json"

# Ensure Service Account File Exists
if not os.path.exists(SERVICE_ACCOUNT_FILE):
    print(f"❌ ERROR: Service account file '{SERVICE_ACCOUNT_FILE}' not found.")
    exit(1)

# Initialize Firebase
try:
    cred = credentials.Certificate(SERVICE_ACCOUNT_FILE)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("✅ Firebase successfully initialized and connected to Firestore.")
except Exception as e:
    print(f"❌ ERROR: Failed to initialize Firebase: {e}")
    exit(1)

# Load Firestore Schema
try:
    with open(SCHEMA_FILE_PATH, "r", encoding="utf-8") as schema_file:
        firestore_schema = json.load(schema_file)
    print("✅ Firestore schema loaded successfully.")
except Exception as e:
    print(f"❌ ERROR: Failed to load schema file: {e}")
    exit(1)

# Load Supabase Export Data with Extra Error Handling
try:
    with open(EXPORT_FILE_PATH, "r", encoding="utf-8") as export_file:
        raw_data = json.load(export_file)

    # Extract and parse JSON correctly
    extracted_data = json.loads(raw_data[0]["jsonb_pretty"])
    print("✅ Supabase export data loaded and parsed successfully.")
except json.JSONDecodeError as json_error:
    print(f"❌ ERROR: Failed to parse JSON - {json_error}")
    exit(1)
except Exception as e:
    print(f"❌ ERROR: Failed to load Supabase export file: {e}")
    exit(1)

# Function to check if a document already exists
def document_exists(collection_name, doc_id):
    try:
        doc_ref = db.collection(collection_name).document(doc_id)
        return doc_ref.get().exists
    except Exception as e:
        print(f"⚠️ WARNING: Failed to check document {doc_id} in {collection_name}: {e}")
        return False  # Assume it doesn't exist to prevent skipping

# Insert Data into Firestore with Improved Error Handling
for collection_name, records in extracted_data.items():
    if collection_name not in firestore_schema:
        print(f"⚠️ WARNING: Skipping unknown collection '{collection_name}' (not in schema).")
        continue

    print(f"📂 Processing collection: {collection_name} ...")
    collection_ref = db.collection(collection_name)

    # Handle unexpected data formats
    if records is None:
        print(f"⚠️ WARNING: Collection '{collection_name}' is empty (None). Skipping...")
        continue

    if not isinstance(records, list):
        print(f"⚠️ WARNING: Unexpected data format in collection '{collection_name}'. Found type: {type(records)}")
        if isinstance(records, dict):
            records = list(records.values())  
            print(f"🔄 Converted dictionary to list for '{collection_name}'")
        else:
            print(f"❌ ERROR: Cannot process collection '{collection_name}'. Skipping...")
            continue

    for record in records:
        try:
            doc_id = record.get("id", None)  # Ensure 'id' is the document key
            if not doc_id:
                print(f"⚠️ WARNING: Skipping record in '{collection_name}' without an 'id' field.")
                continue

            # Skip if already exists
            if document_exists(collection_name, doc_id):
                print(f"⏩ Skipping existing document: {doc_id}")
                continue

            # Ensure only schema-defined fields are inserted
            valid_record = {k: v for k, v in record.items() if k in firestore_schema[collection_name]["fields"]}

            collection_ref.document(doc_id).set(valid_record)
            print(f"✅ Imported document {doc_id} into {collection_name}")

        except Exception as e:
            print(f"❌ ERROR: Failed to insert document {doc_id} into {collection_name}: {e}")

print("🔥 Firestore data import completed successfully!")
