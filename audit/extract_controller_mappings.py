import os
import glob
import re

base_pkg = r"c:\software_project\mim_project\LMS\LMS_CODEBASE\apps\api\src\main\java\com\uslbd\ulms"
controllers = glob.glob(base_pkg + "/**/*Controller*.java", recursive=True)
print(f"Total Controller files: {len(controllers)}")

results = []
for c in sorted(controllers):
    cname = os.path.basename(c)
    with open(c, "r", encoding="utf-8") as f:
        content = f.read()
    bases = re.findall(r'@RequestMapping\((?:value\s*=\s*)?"([^"]+)"\)', content)
    base = bases[0] if bases else ""
    methods = re.findall(r'@(GetMapping|PostMapping|PatchMapping|PutMapping|DeleteMapping)(?:\((?:value\s*=\s*)?"?([^",\)]*)"?\))?', content)
    for mtype, mpath in methods:
        clean_path = base + ("/" + mpath if mpath and not mpath.startswith("/") and not base.endswith("/") else mpath)
        clean_path = clean_path.replace("//", "/")
        results.append((mtype.replace("Mapping", "").upper(), clean_path, cname))

print(f"Total mapped endpoints: {len(results)}")
for mtype, path, cname in sorted(results)[:40]:
    print(f"  {mtype:6} {path:40} ({cname})")

with open(r"c:\software_project\mim_project\LMS\audit\backend_controller_routes.txt", "w", encoding="utf-8") as out:
    for mtype, path, cname in sorted(results):
        out.write(f"{mtype:6} {path:45} ({cname})\n")
