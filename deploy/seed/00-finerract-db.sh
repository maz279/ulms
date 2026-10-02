#!/bin/bash
# Fineract CE databases (04 §1: same cluster, separate role):
#   fineract_tenants  — tenant store (FINERACT_HIKARI_JDBC_URL)
#   fineract_default  — the default tenant DB (FINERACT_DEFAULT_TENANTDB_*)
# Runs once on first postgres boot (docker-entrypoint-initdb.d).
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
  CREATE ROLE fineract LOGIN PASSWORD '${FINERACT_DB_PASSWORD}';
  CREATE DATABASE fineract_tenants OWNER fineract;
  CREATE DATABASE fineract_default OWNER fineract;
  GRANT ALL PRIVILEGES ON DATABASE fineract_tenants TO fineract;
  GRANT ALL PRIVILEGES ON DATABASE fineract_default TO fineract;
EOSQL
echo "fineract role + databases created"
