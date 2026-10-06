import io, re, glob

def norm(p):
    return re.sub(r'\{[^}]+\}', '{}', p)

java_routes = set()
for f in glob.glob(r'apps\api\src\main\java\com\uslbd\ulms\**\*Controller.java', recursive=True):
    s = io.open(f, encoding='utf-8').read()
    base = ''
    m = re.search(r'@RequestMapping\("([^"]+)"\)', s)
    if m: base = m.group(1)
    for mm in re.finditer(r'@(Get|Post|Put|Patch|Delete)Mapping\(\s*(?:value\s*=\s*)?"([^"]*)"', s):
        verb = mm.group(1).upper()
        java_routes.add(f"{verb} {norm(base + (mm.group(2) or ''))}")

mock_routes = set()
for f in [r'apps\web\scripts\mockApi\plugin.ts', r'apps\web\scripts\mockApi\r3r4r5.ts']:
    s = io.open(f, encoding='utf-8').read()
    for mm in re.finditer(r'\.(get|post|put|patch|delete)\(\s*[\'"]([^\'"]+)[\'"]', s):
        v, p = mm.group(1).upper(), mm.group(2)
        if not p.startswith('/api') and not p.startswith('/__'):
            p = '/api/v1' + p
        mock_routes.add(f"{v} {norm(p)}")
    for mm in re.finditer(r'p === "(/[^"]+)" && method === "(\w+)"', s):
        mock_routes.add(f"{mm.group(2).upper()} {norm('/api/v1' + mm.group(1))}")
    for mm in re.finditer(r'method === "(\w+)" && p === "(/[^"]+)"', s):
        mock_routes.add(f"{mm.group(1).upper()} {norm('/api/v1' + mm.group(2))}")
    for mm in re.finditer(r'seg\[0\] === "(\w+)" && seg\[2\] === "(\w+)" && method === "(\w+)"', s):
        mock_routes.add(f"{mm.group(3).upper()} /api/v1/{mm.group(1)}/{{}}/{mm.group(2)}")

print("JAVA:", len(java_routes), " MOCK:", len(mock_routes))
print()
print("=== JAVA-ONLY (backend has; mock/web does not) ===")
for r in sorted(java_routes - mock_routes):
    print(" ", r)
print()
print("=== MOCK-ONLY (web hits; Java lacks — desync risk) ===")
for r in sorted(mock_routes - java_routes):
    print(" ", r)
