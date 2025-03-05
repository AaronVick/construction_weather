import firebase_admin
from firebase_admin import credentials, firestore
import json
import re
import os
from datetime import datetime

# 🔹 Initialize Firebase Admin SDK
cred = credentials.Certificate("serviceAccountKey.json")  # Update with your actual service key
firebase_admin.initialize_app(cred)

# 🔹 Get Firestore Reference
db = firestore.client()

# 🔹 Read and Parse TypeScript Definitions from all `/src/types/` files
def extract_typescript_schemas(directory_path):
    typescript_schemas = {}

    for filename in os.listdir(directory_path):
        if filename.endswith(".ts"):
            file_path = os.path.join(directory_path, filename)
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            current_collection = None
            interface_pattern = re.compile(r"export\s+interface\s+(\w+)\s*\{")
            field_pattern = re.compile(r"\s*(\w+)\s*:\s*([^;]+);")

            for line in content.split("\n"):
                interface_match = interface_pattern.search(line)
                if interface_match:
                    current_collection = interface_match.group(1)
                    typescript_schemas[current_collection] = {}
                    continue

                if current_collection:
                    field_match = field_pattern.search(line)
                    if field_match:
                        field_name, field_type = field_match.groups()
                        # Convert TypeScript types to Firestore-compatible types
                        field_type = (
                            "string" if "string" in field_type else
                            "number" if "number" in field_type else
                            "boolean" if "boolean" in field_type else
                            "array" if "[]" in field_type else
                            "map" if "{" in field_type else
                            "timestamp" if "Timestamp" in field_type else
                            "unknown"
                        )
                        typescript_schemas[current_collection][field_name] = field_type

    return typescript_schemas

# 🔹 Infer Firestore field types dynamically
def infer_field_type(value):
    if isinstance(value, str):
        return "string"
    elif isinstance(value, int) or isinstance(value, float):
        return "number"
    elif isinstance(value, bool):
        return "boolean"
    elif isinstance(value, dict):
        return "map"
    elif isinstance(value, list):
        return "array"
    elif isinstance(value, datetime):
        return "timestamp"
    else:
        return "unknown"

# 🔹 Fetch Firestore Schema
def fetch_firestore_schema():
    collections = db.collections()
    schema_data = {}

    for collection in collections:
        collection_name = collection.id
        schema_data[collection_name] = {}

        docs = collection.limit(5).stream()
        for doc in docs:
            data = doc.to_dict()
            for field, value in data.items():
                schema_data[collection_name][field] = infer_field_type(value)

    return schema_data

# 🔹 Compare Firestore schema with TypeScript definitions
def compare_schemas(firestore_schema, typescript_schemas):
    print("\n🔍 **Schema Comparison with TypeScript Definitions:**")

    for collection_name, fields in firestore_schema.items():
        print(f"\n📌 **Collection: {collection_name}**")

        matching_ts_key = collection_name if collection_name in typescript_schemas else None

        if matching_ts_key:
            expected_schema = typescript_schemas[matching_ts_key]

            for field, field_type in fields.items():
                expected_type = expected_schema.get(field)

                if expected_type:
                    if expected_type == field_type:
                        print(f"✅ {field}: {field_type}")
                    else:
                        print(f"⚠️ Type Mismatch - {field}: Expected {expected_type}, Found {field_type}")
                else:
                    print(f"⚠️ Unexpected Field - {field}: {field_type}")

            missing_fields = set(expected_schema.keys()) - set(fields.keys())
            if missing_fields:
                print(f"❌ Missing Fields: {', '.join(missing_fields)}")
        else:
            print("⚠️ No matching TypeScript definition found for this collection.")

    print("\n✅ **Schema Verification Completed!**")

# 🔹 Fetch schema and compare dynamically
TYPESCRIPT_DIR = "src/types/"  # Path to TypeScript types directory
typescript_schemas = extract_typescript_schemas(TYPESCRIPT_DIR)
firestore_schema = fetch_firestore_schema()
compare_schemas(firestore_schema, typescript_schemas)

# 🔹 Print Firestore Schema Structure
print("\n🔥 **Firestore Schema Structure:**\n")
print(json.dumps(firestore_schema, indent=4))
