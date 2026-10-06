import os
import re
import json

controller_dir = 'LMS_CODEBASE/apps/api/src/main/java/com/uslbd/ulms'
endpoints = []

for dp, dn, fn in os.walk(controller_dir):
    for f in fn:
        if f.endswith('Controller.java'):
            filepath = os.path.join(dp, f)
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as fp:
                content = fp.read()
            
            # Find base RequestMapping
            base_match = re.search(r'@RequestMapping\(\s*(?:value\s*=\s*)?["\']([^"\']+)["\']', content)
            base_path = base_match.group(1) if base_match else ''
            
            # Find individual endpoints
            pattern = re.compile(r'@(GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping)(?:\(\s*(?:value\s*=\s*)?["\']?([^"\',\)]*)["\']?\s*\))?')
            for match in pattern.finditer(content):
                verb = match.group(1).replace('Mapping', '').upper()
                sub = match.group(2) or ''
                sub = sub.strip()
                if sub and not sub.startswith('/'):
                    sub = '/' + sub
                full_path = (base_path + sub).replace('//', '/')
                if full_path.endswith('/') and len(full_path) > 1:
                    full_path = full_path[:-1]
                endpoints.append({
                    "verb": verb,
                    "path": full_path,
                    "controller": f,
                    "file": filepath.replace('\\', '/')
                })

print(f"Total endpoints discovered: {len(endpoints)}")
with open('audit/backend_endpoints.json', 'w', encoding='utf-8') as out:
    json.dump(endpoints, out, indent=2)

for ep in sorted(endpoints, key=lambda x: (x['path'], x['verb'])):
    print(f"{ep['verb']:<6} {ep['path']:<55} {ep['controller']}")
