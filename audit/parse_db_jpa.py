import os
import re
import json

migration_dir = 'LMS_CODEBASE/apps/api/src/main/resources/db/migration'
migrations = []
if os.path.exists(migration_dir):
    for f in sorted(os.listdir(migration_dir)):
        if f.endswith('.sql'):
            path = os.path.join(migration_dir, f)
            with open(path, 'r', encoding='utf-8', errors='ignore') as fp:
                sql = fp.read()
            tables = re.findall(r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_\.]+)', sql, re.IGNORECASE)
            migrations.append({
                "file": f,
                "tables_created": tables,
                "lines": len(sql.splitlines())
            })

print(f"Total Flyway migrations: {len(migrations)}")
for m in migrations:
    print(f"  {m['file']:<30} Tables: {', '.join(m['tables_created']) if m['tables_created'] else 'None (DML/Alter)'}")

# Now JPA entities
entity_dir = 'LMS_CODEBASE/apps/api/src/main/java/com/uslbd/ulms'
entities = []
for dp, dn, fn in os.walk(entity_dir):
    for f in fn:
        if f.endswith('.java'):
            path = os.path.join(dp, f)
            with open(path, 'r', encoding='utf-8', errors='ignore') as fp:
                code = fp.read()
            if '@Entity' in code or '@Table' in code:
                tbl_match = re.search(r'@Table\(\s*name\s*=\s*["\']([^"\']+)["\']', code)
                tbl_name = tbl_match.group(1) if tbl_match else 'Default'
                entities.append({
                    "class": f.replace('.java', ''),
                    "table": tbl_name,
                    "package": dp.replace(entity_dir, '').replace('\\', '.').strip('.')
                })

print(f"\nTotal JPA Entities: {len(entities)}")
for e in sorted(entities, key=lambda x: x['table']):
    print(f"  {e['class']:<30} -> Table: {e['table']:<25} ({e['package']})")

with open('audit/database_and_jpa_inventory.json', 'w', encoding='utf-8') as f:
    json.dump({
        "migrations": migrations,
        "entities": entities
    }, f, indent=2)
