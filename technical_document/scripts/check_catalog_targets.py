from pathlib import Path
import re

repo_root = Path(r"c:\software_project\mim_project\LMS")
cat_path = repo_root / "technical_document" / "MASTER_TECHNICAL_DOCUMENTATION_CATALOG.md"
cat_content = cat_path.read_text(encoding="utf-8")

matches = re.findall(r"\*\*Target File:\*\*\s*`([^`]+)`", cat_content)
print(f"Total Target File patterns found in Catalog: {len(matches)}")

missing = []
for m in matches:
    p = repo_root / m
    if not p.exists():
        missing.append((m, p))

print(f"Missing on disk: {len(missing)}")
for m, p in missing:
    print(f"  TARGET: {m}")
    # find closest matching file in directory
    parent = p.parent
    prefix = Path(m).name.split("_")[0]
    matches_in_dir = list(parent.glob(f"{prefix}*"))
    if matches_in_dir:
        print(f"    FOUND ON DISK: {matches_in_dir[0].relative_to(repo_root)}")
