#!/bin/bash

# Script untuk jalankan migration di Railway
# Run this command: railway run bash run_migration_railway.sh

echo "🚀 Running database migration on Railway..."

node run_migration.js

echo "✅ Migration completed!"
