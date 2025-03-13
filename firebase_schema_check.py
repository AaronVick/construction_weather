import json
import re
import os
import sys
import argparse
from datetime import datetime

# 🔹 Configure command line arguments
parser = argparse.ArgumentParser(description="Firebase Schema Comparison Tool")
parser.add_argument("--offline", action="store_true", help="Run in offline mode (skip Firestore connection)")
parser.add_argument("--types-dir", default="src/types/", help="Directory containing TypeScript type definitions")
parser.add_argument("--service-account", default="serviceAccountKey.json", help="Path to Firebase service account key")
parser.add_argument("--output", default="schema_comparison_result.json", help="Output file path")
args = parser.parse_args()

# 🔹 Initialize Firebase only if not in offline mode
firebase_initialized = False
db = None

if not args.offline:
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
        
        # Check if service account file exists
        if not os.path.exists(args.service_account):
            print(f"⚠️ Service account file not found: {args.service_account}")
            print("🔄 Switching to offline mode. Only TypeScript schema will be analyzed.")
            args.offline = True
        else:
            print(f"🔑 Initializing Firebase with service account: {args.service_account}")
            cred = credentials.Certificate(args.service_account)
            firebase_admin.initialize_app(cred)
            db = firestore.client()
            firebase_initialized = True
    except Exception as e:
        print(f"⚠️ Failed to initialize Firebase: {str(e)}")
        print("🔄 Switching to offline mode. Only TypeScript schema will be analyzed.")
        args.offline = True

# 🔹 Read and Parse TypeScript Definitions from all `/src/types/` files
def extract_typescript_schemas(directory_path):
    typescript_schemas = {}

    # Check if the directory exists
    if not os.path.exists(directory_path):
        print(f"⚠️ Warning: Directory {directory_path} does not exist!")
        return typescript_schemas
        
    # Process all files in the directory and subdirectories
    for root, dirs, files in os.walk(directory_path):
        for filename in files:
            if filename.endswith(".ts"):
                file_path = os.path.join(root, filename)
                print(f"Processing TypeScript file: {file_path}")
                
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        content = f.read()

                    # Updated regex patterns to handle more complex TS interfaces
                    interface_pattern = re.compile(r"export\s+(?:type|interface)\s+(\w+)\s*(?:=\s*{|\{)")
                    
                    # Find all interfaces in the file
                    interface_matches = interface_pattern.finditer(content)
                    
                    for interface_match in interface_matches:
                        current_collection = interface_match.group(1)
                        start_pos = interface_match.end()
                        
                        # Find the matching closing brace
                        open_braces = 1
                        end_pos = start_pos
                        
                        for i in range(start_pos, len(content)):
                            if content[i] == '{':
                                open_braces += 1
                            elif content[i] == '}':
                                open_braces -= 1
                                if open_braces == 0:
                                    end_pos = i
                                    break
                        
                        # Extract interface body
                        interface_body = content[start_pos:end_pos].strip()
                        
                        # Parse fields
                        typescript_schemas[current_collection] = {}
                        field_pattern = re.compile(r"\s*(\w+)\s*(?:\?|!)?:\s*([^;]+?)(?:;|,|\n|$)")
                        
                        for field_match in field_pattern.finditer(interface_body):
                            field_name, field_type = field_match.groups()
                            field_type = field_type.strip()
                            
                            # Convert TypeScript types to Firestore-compatible types
                            field_type = (
                                "string" if re.search(r"\b(string|email|url|phone|id)\b", field_type, re.IGNORECASE) else
                                "number" if re.search(r"\b(number|int|float|double)\b", field_type, re.IGNORECASE) else
                                "boolean" if re.search(r"\b(boolean|bool)\b", field_type, re.IGNORECASE) else
                                "array" if "[]" in field_type or re.search(r"\bArray<", field_type, re.IGNORECASE) else
                                "map" if "{" in field_type or re.search(r"\bRecord<", field_type, re.IGNORECASE) else
                                "timestamp" if re.search(r"\b(Date|Timestamp|time|datetime)\b", field_type, re.IGNORECASE) else
                                "reference" if re.search(r"\b(DocumentReference|Reference)\b", field_type, re.IGNORECASE) else
                                "unknown"
                            )
                            typescript_schemas[current_collection][field_name] = field_type
                except Exception as e:
                    print(f"⚠️ Error processing file {file_path}: {str(e)}")

    print(f"Found {len(typescript_schemas)} TypeScript interfaces")
    return typescript_schemas

# 🔹 Infer Firestore field types dynamically
def infer_field_type(value):
    if value is None:
        return "null"
    elif isinstance(value, str):
        return "string"
    elif isinstance(value, int) or isinstance(value, float):
        return "number"
    elif isinstance(value, bool):
        return "boolean"
    elif isinstance(value, dict):
        return "map"
    elif isinstance(value, list):
        return "array"
    elif hasattr(value, 'seconds') and hasattr(value, 'nanoseconds'):  # Firestore timestamp
        return "timestamp"
    else:
        return f"unknown ({type(value).__name__})"

# 🔹 Fetch Firestore Schema
def fetch_firestore_schema():
    if args.offline or not firebase_initialized:
        print("🔄 Skipping Firestore schema fetch (offline mode)")
        return {}
        
    print("Fetching Firestore schema...")
    try:
        collections = db.collections()
        schema_data = {}

        for collection in collections:
            collection_name = collection.id
            schema_data[collection_name] = {}
            print(f"Processing collection: {collection_name}")

            try:
                # Increase limit to improve field coverage
                docs = collection.limit(10).stream()
                docs_processed = 0
                
                for doc in docs:
                    docs_processed += 1
                    data = doc.to_dict()
                    
                    # Process nested fields recursively
                    def process_fields(data, prefix=""):
                        for field, value in data.items():
                            field_path = f"{prefix}{field}"
                            field_type = infer_field_type(value)
                            
                            schema_data[collection_name][field_path] = field_type
                            
                            # Process nested maps recursively
                            if isinstance(value, dict):
                                process_fields(value, f"{field_path}.")
                    
                    process_fields(data)
                
                print(f"  - Processed {docs_processed} documents")
                    
            except Exception as e:
                print(f"⚠️ Error processing collection {collection_name}: {str(e)}")

        print(f"Found {len(schema_data)} collections in Firestore")
        return schema_data
    except Exception as e:
        print(f"❌ Error fetching Firestore schema: {str(e)}")
        print("🔄 Switching to offline mode")
        args.offline = True
        return {}

# 🔹 Compare Firestore schema with TypeScript definitions
def compare_schemas(firestore_schema, typescript_schemas):
    print("\n🔍 **Schema Comparison with TypeScript Definitions:**")
    
    # Track overall statistics
    total_collections = len(firestore_schema)
    matched_collections = 0
    total_fields = 0
    matched_fields = 0
    type_mismatches = 0
    missing_fields = 0
    
    if args.offline or not firestore_schema:
        print("⚠️ Running in offline mode - skipping comparison")
        
        # Print the TypeScript schema structure instead
        print("\n📋 TypeScript Schema Structure:")
        for interface_name, fields in typescript_schemas.items():
            print(f"\n📌 **Interface: {interface_name}**")
            for field, field_type in fields.items():
                print(f"  - {field}: {field_type}")
        return
    
    for collection_name, fields in firestore_schema.items():
        print(f"\n📌 **Collection: {collection_name}**")
        
        matching_ts_key = None
        
        # Try exact match first
        if collection_name in typescript_schemas:
            matching_ts_key = collection_name
        else:
            # Try case-insensitive match
            for ts_key in typescript_schemas.keys():
                if ts_key.lower() == collection_name.lower():
                    matching_ts_key = ts_key
                    print(f"📝 Note: Case-insensitive match found - '{ts_key}' for '{collection_name}'")
                    break
                    
            # If still no match, try matching with similar keys
            if not matching_ts_key:
                for ts_key in typescript_schemas.keys():
                    # Remove pluralization
                    singular_collection = collection_name[:-1] if collection_name.endswith('s') else collection_name
                    singular_ts = ts_key[:-1] if ts_key.endswith('s') else ts_key
                    
                    if (singular_collection.lower() == singular_ts.lower() or
                        ts_key.lower() in collection_name.lower() or
                        collection_name.lower() in ts_key.lower()):
                        matching_ts_key = ts_key
                        print(f"📝 Note: Partial match found - '{ts_key}' for '{collection_name}'")
                        break
        
        if matching_ts_key:
            matched_collections += 1
            expected_schema = typescript_schemas[matching_ts_key]
            total_collection_fields = len(fields)
            total_fields += total_collection_fields

            for field, field_type in fields.items():
                # Handle nested fields
                base_field = field.split('.')[0]
                expected_type = expected_schema.get(base_field)

                if expected_type:
                    if expected_type == field_type or (expected_type == "map" and "." in field):
                        matched_fields += 1
                        print(f"✅ {field}: {field_type}")
                    else:
                        type_mismatches += 1
                        print(f"⚠️ Type Mismatch - {field}: Expected {expected_type}, Found {field_type}")
                else:
                    print(f"⚠️ Unexpected Field - {field}: {field_type}")

            missing_collection_fields = set(expected_schema.keys()) - set([f.split('.')[0] for f in fields.keys()])
            if missing_collection_fields:
                missing_fields += len(missing_collection_fields)
                print(f"❌ Missing Fields: {', '.join(missing_collection_fields)}")
        else:
            print("⚠️ No matching TypeScript definition found for this collection.")
    
    # Print summary
    print("\n📊 **Schema Comparison Summary:**")
    print(f"Collections Found in Firestore: {total_collections}")
    print(f"Collections with TypeScript Definitions: {matched_collections} ({matched_collections/total_collections*100:.1f}% coverage)" if total_collections > 0 else "Collections with TypeScript Definitions: 0 (0% coverage)")
    if total_fields > 0:
        print(f"Fields Matched: {matched_fields}/{total_fields} ({matched_fields/total_fields*100:.1f}%)")
        print(f"Type Mismatches: {type_mismatches}")
    print(f"Missing Fields (in TypeScript but not in Firestore): {missing_fields}")
    
    print("\n✅ **Schema Verification Completed!**")

# 🔹 Save schema to file
def save_schema_to_file(firestore_schema, typescript_schemas):
    output = {
        "firestore_schema": firestore_schema,
        "typescript_schemas": typescript_schemas,
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "offline_mode": args.offline
    }
    
    with open(args.output, "w") as f:
        json.dump(output, indent=4, default=str, fp=f)
    
    print(f"\n💾 Schema data saved to '{args.output}'")

# 🔹 Main execution
if __name__ == "__main__":
    try:
        print(f"🚀 Starting schema comparison with TypeScript directory: {args.types_dir}")
        print(f"📝 Mode: {'Offline (TypeScript analysis only)' if args.offline else 'Online (Firestore + TypeScript)'}")
        
        typescript_schemas = extract_typescript_schemas(args.types_dir)
        
        if not typescript_schemas:
            print("⚠️ Warning: No TypeScript schemas found. Check the directory path and file contents.")
            sys.exit(1)
        
        firestore_schema = fetch_firestore_schema()
        
        compare_schemas(firestore_schema, typescript_schemas)
        save_schema_to_file(firestore_schema, typescript_schemas)
        
        if not args.offline and firestore_schema:
            # Print Firestore Schema Structure
            print("\n🔥 **Firestore Schema Structure:**\n")
            print(json.dumps(firestore_schema, indent=4))
    
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        print(traceback.format_exc())
        sys.exit(1)
    
    print("\n✨ Script completed successfully!")


# import firebase_admin
# from firebase_admin import credentials, firestore
# import json
# import re
# import os
# from datetime import datetime

# # 🔹 Initialize Firebase Admin SDK
# cred = credentials.Certificate("serviceAccountKey.json")  # Update with your actual service key
# firebase_admin.initialize_app(cred)

# # 🔹 Get Firestore Reference
# db = firestore.client()

# # 🔹 Read and Parse TypeScript Definitions from all `/src/types/` files
# def extract_typescript_schemas(directory_path):
#     typescript_schemas = {}

#     for filename in os.listdir(directory_path):
#         if filename.endswith(".ts"):
#             file_path = os.path.join(directory_path, filename)
#             with open(file_path, "r", encoding="utf-8") as f:
#                 content = f.read()

#             current_collection = None
#             interface_pattern = re.compile(r"export\s+interface\s+(\w+)\s*\{")
#             field_pattern = re.compile(r"\s*(\w+)\s*:\s*([^;]+);")

#             for line in content.split("\n"):
#                 interface_match = interface_pattern.search(line)
#                 if interface_match:
#                     current_collection = interface_match.group(1)
#                     typescript_schemas[current_collection] = {}
#                     continue

#                 if current_collection:
#                     field_match = field_pattern.search(line)
#                     if field_match:
#                         field_name, field_type = field_match.groups()
#                         # Convert TypeScript types to Firestore-compatible types
#                         field_type = (
#                             "string" if "string" in field_type else
#                             "number" if "number" in field_type else
#                             "boolean" if "boolean" in field_type else
#                             "array" if "[]" in field_type else
#                             "map" if "{" in field_type else
#                             "timestamp" if "Timestamp" in field_type else
#                             "unknown"
#                         )
#                         typescript_schemas[current_collection][field_name] = field_type

#     return typescript_schemas

# # 🔹 Infer Firestore field types dynamically
# def infer_field_type(value):
#     if isinstance(value, str):
#         return "string"
#     elif isinstance(value, int) or isinstance(value, float):
#         return "number"
#     elif isinstance(value, bool):
#         return "boolean"
#     elif isinstance(value, dict):
#         return "map"
#     elif isinstance(value, list):
#         return "array"
#     elif isinstance(value, datetime):
#         return "timestamp"
#     else:
#         return "unknown"

# # 🔹 Fetch Firestore Schema
# def fetch_firestore_schema():
#     collections = db.collections()
#     schema_data = {}

#     for collection in collections:
#         collection_name = collection.id
#         schema_data[collection_name] = {}

#         docs = collection.limit(5).stream()
#         for doc in docs:
#             data = doc.to_dict()
#             for field, value in data.items():
#                 schema_data[collection_name][field] = infer_field_type(value)

#     return schema_data

# # 🔹 Compare Firestore schema with TypeScript definitions
# def compare_schemas(firestore_schema, typescript_schemas):
#     print("\n🔍 **Schema Comparison with TypeScript Definitions:**")

#     for collection_name, fields in firestore_schema.items():
#         print(f"\n📌 **Collection: {collection_name}**")

#         matching_ts_key = collection_name if collection_name in typescript_schemas else None

#         if matching_ts_key:
#             expected_schema = typescript_schemas[matching_ts_key]

#             for field, field_type in fields.items():
#                 expected_type = expected_schema.get(field)

#                 if expected_type:
#                     if expected_type == field_type:
#                         print(f"✅ {field}: {field_type}")
#                     else:
#                         print(f"⚠️ Type Mismatch - {field}: Expected {expected_type}, Found {field_type}")
#                 else:
#                     print(f"⚠️ Unexpected Field - {field}: {field_type}")

#             missing_fields = set(expected_schema.keys()) - set(fields.keys())
#             if missing_fields:
#                 print(f"❌ Missing Fields: {', '.join(missing_fields)}")
#         else:
#             print("⚠️ No matching TypeScript definition found for this collection.")

#     print("\n✅ **Schema Verification Completed!**")

# # 🔹 Fetch schema and compare dynamically
# TYPESCRIPT_DIR = "src/types/"  # Path to TypeScript types directory
# typescript_schemas = extract_typescript_schemas(TYPESCRIPT_DIR)
# firestore_schema = fetch_firestore_schema()
# compare_schemas(firestore_schema, typescript_schemas)

# # 🔹 Print Firestore Schema Structure
# print("\n🔥 **Firestore Schema Structure:**\n")
# print(json.dumps(firestore_schema, indent=4))
