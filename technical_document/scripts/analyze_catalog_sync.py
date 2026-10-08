from pathlib import Path
import re

repo_root = Path(r"c:\software_project\mim_project\LMS")
cat_path = repo_root / "technical_document" / "MASTER_TECHNICAL_DOCUMENTATION_CATALOG.md"
cat_content = cat_path.read_text(encoding="utf-8")

# Extract all sections
pattern = r"### (DOC-\d+-[A-Z]+-\d+):\s*([^\n]+)\n- \*\*Target File:\*\*\s*`([^`]+)`"
matches = re.findall(pattern, cat_content)

print(f"Total catalog sections matched: {len(matches)}")

updates = []
for doc_id, cat_title, cat_target in matches:
    cat_file_p = repo_root / cat_target
    prefix = doc_id
    cat_folder = Path(cat_target).parent
    # find actual file in that folder
    actual_files = list(cat_folder.glob(f"{doc_id}*.md"))
    if not actual_files:
        print(f"ERROR: No actual file found for {doc_id} in {cat_folder}")
        continue
    actual_file = actual_files[0]
    actual_rel = f"technical_document/{cat_folder.name}/{actual_file.name}"
    
    # Read actual title
    c = actual_file.read_text(encoding="utf-8")
    h1_m = re.search(r"^#\s+(.+)$", c, re.MULTILINE)
    actual_title = h1_m.group(1) if h1_m else cat_title
    if ":" in actual_title:
        actual_title_clean = actual_title.split(":", 1)[-1].strip()
    else:
        actual_title_clean = actual_title
        
    if cat_target != actual_rel or cat_title.strip() != actual_title_clean:
        updates.append({
            "id": doc_id,
            "old_title": cat_title.strip(),
            "new_title": actual_title_clean,
            "old_target": cat_target,
            "new_target": actual_rel,
            "old_header": f"### {doc_id}: {cat_title}",
            "new_header": f"### {doc_id}: {actual_title_clean}",
            "old_target_line": f"- **Target File:** `{cat_target}`",
            "new_target_line": f"- **Target File:** `{actual_rel}`"
        })

print(f"Total updates needed in catalog: {len(updates)}")
for u in updates[:5]:
    print(f"  {u['id']}:")
    print(f"    Header: {u['old_header']} -> {u['new_header']}")
    print(f"    Target: {u['old_target_line']} -> {u['new_target_line']}")
