from pathlib import Path
import re
import json

repo_root = Path(r"c:\software_project\mim_project\LMS")
cat_path = repo_root / "technical_document" / "MASTER_TECHNICAL_DOCUMENTATION_CATALOG.md"
content = cat_path.read_text(encoding="utf-8")

inventory_file = repo_root / "technical_document" / "scripts" / "doc_inventory.json"
docs = json.loads(inventory_file.read_text(encoding="utf-8"))
docs_by_id = {d["id"]: d for d in docs}

# 1. Update Section Headers and Target Files
for doc_id, d in docs_by_id.items():
    clean_title = d["title"].split(":", 1)[-1].strip() if ":" in d["title"] else d["title"]
    actual_target = d["md_rel_path"]
    
    # regex find section
    pattern = rf"###\s+{re.escape(doc_id)}:[^\n]+\n-\s+\*\*Target File:\*\*\s*`[^`]+`"
    replacement = f"### {doc_id}: {clean_title}\n- **Target File:** `{actual_target}`"
    
    content, count = re.subn(pattern, replacement, content)
    if count == 0:
        print(f"Warning: could not replace section for {doc_id}")

# 2. Update directory tree at end of file
# Build new directory tree
tree_lines = []
tree_lines.append("```")
tree_lines.append(r"C:\software_project\mim_project\LMS\technical_document\\")
tree_lines.append("│")
tree_lines.append("├── README.md                                         # High-level entrypoint & quick-start navigation")
tree_lines.append("├── MASTER_TECHNICAL_DOCUMENTATION_CATALOG.md         # This authoritative catalog document")
tree_lines.append("├── AUDIT_AND_REMEDIATION_REPORT.md                   # Zero-trust verification & remediation report")
tree_lines.append("│")

cats = ["01_architecture", "02_troubleshooting", "03_maintenance", "04_deployment", "05_developer_extension", "06_quality_assurance"]
cat_labels = {
    "01_architecture": "Category 1: System Architecture & Foundations",
    "02_troubleshooting": "Category 2: Operational Troubleshooting & Runbooks",
    "03_maintenance": "Category 3: System Maintenance, Upgrades & Lifecycle",
    "04_deployment": "Category 4: Infrastructure Provisioning & Deployment",
    "05_developer_extension": "Category 5: Developer Extension & Customization Guides",
    "06_quality_assurance": "Category 6: QA, Security Hardening & Regulatory Audit"
}

for i, cat in enumerate(cats):
    cat_docs = [d for d in docs if d["category_folder"] == cat]
    is_last_cat = (i == len(cats) - 1)
    cat_prefix = "└──" if is_last_cat else "├──"
    tree_lines.append(f"{cat_prefix} {cat}/".ljust(54) + f"# {cat_labels[cat]}")
    for j, d in enumerate(cat_docs):
        is_last_doc = (j == len(cat_docs) - 1)
        sub_prefix = "    └──" if is_last_cat and is_last_doc else ("    ├──" if is_last_cat else ("│   └──" if is_last_doc else "│   ├──"))
        tree_lines.append(f"{sub_prefix} {d['md_name']}")
    if not is_last_cat:
        tree_lines.append("│")

tree_lines.append("```")
new_tree = "\n".join(tree_lines)

# Replace old tree
tree_pattern = r"```\s*\nC:\\software_project\\mim_project\\LMS\\technical_document\\\s*\n│.*?```"
content, tree_count = re.subn(tree_pattern, lambda m: new_tree, content, flags=re.DOTALL)
print(f"Tree replacement count: {tree_count}")

cat_path.write_text(content, encoding="utf-8")
print(f"Successfully updated {cat_path}")
