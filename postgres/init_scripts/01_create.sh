#!/bin/bash
set -e

# Create a dedicated user with a strong password
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname lab <<-EOSQL
    CREATE USER lab_user WITH PASSWORD 'lab_password';
    GRANT CONNECT ON DATABASE lab TO lab_user;
EOSQL

# Connect to the lab database and set up permissions
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname lab <<-EOSQL
    -- Grant schema usage and table permissions
    GRANT USAGE ON SCHEMA public TO lab_user;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO lab_user;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO lab_user;
    
    -- For existing tables (if any)
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO lab_user;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO lab_user;
EOSQL

echo "Discogs database and user created successfully"
