import os
import re
import json

web_src = 'LMS_CODEBASE/apps/web/src'
a11y_issues = []

for dp, dn, fn in os.walk(web_src):
    for f in fn:
        if f.endswith('.tsx') or f.endswith('.jsx'):
            filepath = os.path.join(dp, f)
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as fp:
                lines = fp.readlines()
            
            for idx, line in enumerate(lines, start=1):
                # 1. Missing alt on img
                if '<img' in line and 'alt=' not in line:
                    a11y_issues.append({
                        "file": filepath.replace('\\', '/'),
                        "line": idx,
                        "rule": "WCAG 1.1.1 Non-text Content",
                        "severity": "Serious",
                        "detail": "<img> tag missing alt attribute",
                        "snippet": line.strip()
                    })
                # 2. Clickable div without role or tabIndex
                if ('onClick' in line or 'onKeyDown' in line) and '<div' in line:
                    if 'role=' not in line and 'tabIndex' not in line:
                        a11y_issues.append({
                            "file": filepath.replace('\\', '/'),
                            "line": idx,
                            "rule": "WCAG 4.1.2 Name, Role, Value",
                            "severity": "Moderate",
                            "detail": "Interactive <div> lacks role='button' and tabIndex",
                            "snippet": line.strip()
                        })
                # 3. Input without aria-label or id/htmlFor
                if '<input' in line and 'type="hidden"' not in line:
                    if 'aria-label' not in line and 'aria-labelledby' not in line and 'id=' not in line:
                        a11y_issues.append({
                            "file": filepath.replace('\\', '/'),
                            "line": idx,
                            "rule": "WCAG 1.3.1 Info and Relationships",
                            "severity": "Moderate",
                            "detail": "<input> element lacks accessible label or id association",
                            "snippet": line.strip()
                        })
                # 4. Button without accessible name
                if re.search(r'<button[^>]*>\s*</button>', line) or re.search(r'<Btn[^>]*>\s*</Btn>', line):
                    a11y_issues.append({
                        "file": filepath.replace('\\', '/'),
                        "line": idx,
                        "rule": "WCAG 4.1.2 Name, Role, Value",
                        "severity": "Serious",
                        "detail": "Empty button lacks text content or aria-label",
                        "snippet": line.strip()
                    })

print(f"Total a11y issues identified: {len(a11y_issues)}")
with open('audit/a11y_audit_findings.json', 'w', encoding='utf-8') as out:
    json.dump(a11y_issues, out, indent=2)

for iss in a11y_issues[:15]:
    print(f"[{iss['severity']}] {iss['file'].split('/')[-1]}:{iss['line']} - {iss['detail']}")
