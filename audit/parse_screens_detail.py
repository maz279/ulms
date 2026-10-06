import os
import re
import json

nav_path = 'LMS_CODEBASE/apps/web/src/shell/navData.ts'
with open(nav_path, 'r', encoding='utf-8') as f:
    nav_text = f.read()

# Let's extract all modules and screens
modules_raw = re.findall(r'"([A-H][0-9])":\{(.*?)(?=\n"[A-H][0-9]":\{|\nexport const|\Z)', nav_text, re.DOTALL)

all_screens = []
wired_screens = []
unwired_screens = []

for mid, mod_body in modules_raw:
    # extract module name
    mod_en_match = re.search(r'en:\s*["\']([^"\']+)["\']', mod_body)
    mod_en = mod_en_match.group(1) if mod_en_match else mid
    
    # extract screens
    # pattern: {id:"A1-s1", en:"...", bn:"...", t:"f"(, route:"...")?}
    screen_pattern = re.compile(r'\{\s*id:\s*["\']([A-H][0-9]-s[0-9]+)["\'],\s*en:\s*["\']([^"\']+)["\'],\s*bn:\s*["\']([^"\']+)["\'],\s*t:\s*["\']([a-z])["\'](?:,\s*route:\s*["\']([^"\']+)["\'])?')
    for m in screen_pattern.finditer(mod_body):
        sid = m.group(1)
        en = m.group(2)
        bn = m.group(3)
        t = m.group(4)
        route = m.group(5) if m.group(5) else None
        
        info = {
            "screen_id": sid,
            "module_id": mid,
            "module_title": mod_en,
            "title_en": en,
            "title_bn": bn,
            "archetype": t,
            "route": route,
            "is_wired": route is not None
        }
        all_screens.append(info)
        if route:
            wired_screens.append(info)
        else:
            unwired_screens.append(info)

print(f"Total screens parsed: {len(all_screens)}")
print(f"Wired screens (with dedicated route): {len(wired_screens)}")
print(f"Unwired screens (archetype + genRows): {len(unwired_screens)}")

with open('audit/all_166_screens.json', 'w', encoding='utf-8') as f:
    json.dump(all_screens, f, indent=2)

print("\n--- WIRED SCREENS SAMPLE ---")
for s in wired_screens[:10]:
    print(f"{s['screen_id']:<8} {s['title_en']:<35} -> {s['route']}")

print("\n--- UNWIRED SCREENS SAMPLE ---")
for s in unwired_screens[:10]:
    print(f"{s['screen_id']:<8} {s['title_en']:<35} [{s['archetype']}]")
