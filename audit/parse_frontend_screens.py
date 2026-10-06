import os
import re
import json

nav_path = 'LMS_CODEBASE/apps/web/src/shell/navData.ts'
with open(nav_path, 'r', encoding='utf-8') as f:
    nav_content = f.read()

# Let's inspect the structure of navData.ts
print("NavData length:", len(nav_content))

# Extract all screen entries in navData
# Usually structured as groups, modules, screens
# Let's write regex or AST parser
screen_matches = re.findall(r'\{\s*id:\s*["\']([^"\']+)["\'],\s*title:\s*["\']([^"\']+)["\'](?:,\s*type:\s*["\']([^"\']+)["\'])?(?:,\s*route:\s*["\']([^"\']+)["\'])?', nav_content)
print("Screen matches count:", len(screen_matches))

# Let's also look for all objects with id
all_ids = re.findall(r'id:\s*["\']([A-Za-z0-9\-_]+)["\']', nav_content)
print("All IDs count:", len(all_ids))

# Let's find how AppShell renders them
appshell_path = 'LMS_CODEBASE/apps/web/src/shell/AppShell.tsx'
with open(appshell_path, 'r', encoding='utf-8') as f:
    appshell_content = f.read()

# Check for routes / renders
print("AppShell length:", len(appshell_content))

# Look for route switch/cases or screen mappings
mappings = re.findall(r'case\s+["\']([^"\']+)["\']\s*:\s*return\s+<([^/>]+)', appshell_content)
print("Explicit screen component mappings in AppShell:", len(mappings))
for m in mappings:
    print(f"  {m[0]:<20} -> <{m[1]}>")
