import os
import re
import json

api_java = 'LMS_CODEBASE/apps/api/src/main/java'
web_ts = 'LMS_CODEBASE/apps/web/src'

floating_point_currency = []

# Scan Java files for double or float in money contexts
for dp, dn, fn in os.walk(api_java):
    for f in fn:
        if f.endswith('.java'):
            filepath = os.path.join(dp, f)
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as fp:
                lines = fp.readlines()
            for idx, line in enumerate(lines, start=1):
                # Look for double or float with amount, balance, fee, principal, interest
                if re.search(r'\b(double|Double|float|Float)\s+(amount|balance|fee|principal|interest|repayment|emi|charge|total|cost|price|limit)', line, re.IGNORECASE):
                    floating_point_currency.append({
                        "file": filepath.replace('\\', '/'),
                        "line": idx,
                        "type": "Java Double/Float Currency Variable",
                        "snippet": line.strip()
                    })
                # Check for division / 100.0 without BigDecimal
                if re.search(r'/\s*100\.0', line) and 'BigDecimal' not in line:
                    floating_point_currency.append({
                        "file": filepath.replace('\\', '/'),
                        "line": idx,
                        "type": "Java Division by 100.0 float conversion",
                        "snippet": line.strip()
                    })

print(f"Total potential floating-point currency calculations found in Java: {len(floating_point_currency)}")
with open('audit/financial_arithmetic_findings.json', 'w', encoding='utf-8') as out:
    json.dump(floating_point_currency, out, indent=2)

for fpc in floating_point_currency[:15]:
    print(f"[{fpc['type']}] {fpc['file'].split('/')[-1]}:{fpc['line']} - {fpc['snippet']}")
