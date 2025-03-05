import json

# Your table schema extracted from Supabase
supabase_schema = [
    {"table_definition": "CREATE TABLE users (id uuid, email text, role text, created_at timestamp with time zone);"},
    {"table_definition": "CREATE TABLE categories (id uuid, name text, slug text, description text, created_at timestamp with time zone);"},
    {"table_definition": "CREATE TABLE articles (id uuid, title text, slug text, excerpt text, content text, category_id uuid, tags text[], read_time integer, image_url text, author_id uuid, published_at timestamp with time zone, views integer, seo_title text, seo_description text, created_at timestamp with time zone, updated_at timestamp with time zone, status text);"},
    {"table_definition": "CREATE TABLE newsletter_subscriptions (id uuid, email text, status text, created_at timestamp with time zone, updated_at timestamp with time zone);"},
    {"table_definition": "CREATE TABLE site_settings (id uuid, key text, value jsonb, updated_at timestamp with time zone, created_at timestamp with time zone);"},
    {"table_definition": "CREATE TABLE scheduled_articles (id uuid, article_id uuid, scheduled_publish_time timestamp with time zone, status text, created_at timestamp with time zone);"},
    {"table_definition": "CREATE TABLE workflow_states (id text, name text, state text, last_updated timestamp with time zone);"}
]

firestore_schema = {}

for table in supabase_schema:
    table_def = table["table_definition"]
    table_name = table_def.split(" ")[2]  # Extract table name

    # Extract columns
    columns_part = table_def.split("(")[1].split(")")[0]
    columns = [col.strip().split(" ")[0] for col in columns_part.split(",")]

    # Convert to Firestore-friendly format
    firestore_schema[table_name] = {
        "collection_name": table_name,
        "fields": columns
    }

# Save as Firestore JSON format
with open("firestore_schema.json", "w") as f:
    json.dump(firestore_schema, f, indent=4)

print("🔥 Firestore schema JSON generated successfully!")
