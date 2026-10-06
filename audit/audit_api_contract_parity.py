import os
import re
import json

with open('audit/backend_endpoints.json', 'r', encoding='utf-8') as f:
    backend_endpoints = json.load(f)

# Normalize backend endpoints to regex / comparable patterns
for be in backend_endpoints:
    # replace {pathVariable} with regex [^/]+
    p = re.sub(r'\{[^}]+\}', '[^/]+', be['path'])
    be['regex'] = '^' + p + '$'

api_dir = 'LMS_CODEBASE/apps/web/src/api'
frontend_calls = []

for f in sorted(os.listdir(api_dir)):
    if f.endswith('.ts') and f != 'schemas.ts':
        path = os.path.join(api_dir, f)
        with open(path, 'r', encoding='utf-8', errors='ignore') as fp:
            content = fp.read()
        
        # Look for fetch calls: fetch("...", { method: "..." }) or fetch(`...`, ...)
        # We can extract the block containing fetch(...)
        fetch_pattern = re.compile(r'fetch\(\s*[`"\']([^`"\']+)[`"\']\s*(?:,\s*\{([^}]+)\})?', re.DOTALL)
        for m in fetch_pattern.finditer(content):
            url_raw = m.group(1)
            options = m.group(2) or ''
            
            method_match = re.search(r'method:\s*["\']([A-Z]+)["\']', options)
            verb = method_match.group(1) if method_match else 'GET'
            
            # calculate line number
            start_pos = m.start()
            line_no = content[:start_pos].count('\n') + 1
            
            frontend_calls.append({
                "file": f,
                "line": line_no,
                "verb": verb,
                "url_raw": url_raw,
                "snippet": content[m.start():m.end()][:100].replace('\n', ' ')
            })

print(f"Total frontend API call invocations discovered: {len(frontend_calls)}")

# Match frontend calls against backend endpoints
matched_backend = set()
matched_calls = []
phantom_frontend = []

for fc in frontend_calls:
    # substitute template expressions ${...} with dummy 123
    clean_url = re.sub(r'\$\{[^}]+\}', '123', fc['url_raw'])
    clean_url = clean_url.split('?')[0] # remove query params for matching
    matched = False
    for be in backend_endpoints:
        if be['verb'] == fc['verb']:
            if re.match(be['regex'], clean_url):
                matched = True
                matched_backend.add(be['verb'] + ' ' + be['path'])
                matched_calls.append((fc, be))
                break
    if not matched:
        phantom_frontend.append(fc)

orphaned_backend = []
for be in backend_endpoints:
    key = be['verb'] + ' ' + be['path']
    if key not in matched_backend:
        orphaned_backend.append(be)

print(f"Matched Backend Endpoints: {len(matched_backend)} / {len(backend_endpoints)} ({len(matched_backend)/len(backend_endpoints)*100:.1f}%)")
print(f"Orphaned Backend Endpoints (No frontend call): {len(orphaned_backend)}")
print(f"Phantom Frontend Calls (No backend endpoint): {len(phantom_frontend)}")

with open('audit/contract_parity_results.json', 'w', encoding='utf-8') as out:
    json.dump({
        "matched_count": len(matched_backend),
        "total_backend_endpoints": len(backend_endpoints),
        "orphaned_backend_count": len(orphaned_backend),
        "phantom_frontend_count": len(phantom_frontend),
        "orphaned_backend": orphaned_backend,
        "phantom_frontend": phantom_frontend,
        "frontend_calls": frontend_calls
    }, out, indent=2)

print("\n--- SAMPLE MATCHED CALLS ---")
for fc, be in matched_calls[:10]:
    print(f"  {fc['verb']:<6} {fc['url_raw']:<45} -> {be['controller']}")

print("\n--- SAMPLE ORPHANED BACKEND ENDPOINTS ---")
for ob in orphaned_backend[:10]:
    print(f"  {ob['verb']:<6} {ob['path']:<50} ({ob['controller']})")

print("\n--- SAMPLE PHANTOM FRONTEND CALLS ---")
for pf in phantom_frontend[:10]:
    print(f"  [{pf['file']}:{pf['line']}] {pf['verb']} {pf['url_raw']}")
