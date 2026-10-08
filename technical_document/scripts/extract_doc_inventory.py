from pathlib import Path
import re
import json

repo_root = Path(r"c:\software_project\mim_project\LMS")
tech_root = repo_root / "technical_document"

cats = sorted([d for d in tech_root.iterdir() if d.is_dir() and d.name not in ("docx", "scripts")])

doc_inventory = []

for cat in cats:
    cat_id = cat.name.split("_")[0]
    cat_name = cat.name
    files = sorted(list(cat.glob("*.md")))
    for f in files:
        content = f.read_text(encoding="utf-8")
        
        # parse frontmatter
        doc_type = "Reference"
        fm_match = re.search(r"^---\s*\n(.*?)\n---", content, re.DOTALL)
        if fm_match:
            fm_text = fm_match.group(1)
            type_m = re.search(r"type:\s*(\w+)", fm_text)
            if type_m:
                t = type_m.group(1).lower()
                if t == "explanation":
                    doc_type = "Explanation"
                elif t in ("how-to", "howto", "guide"):
                    doc_type = "How-To Guide"
                elif t == "tutorial":
                    doc_type = "Tutorial"
                else:
                    doc_type = "Technical Reference"
        
        # Title
        h1_match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
        title = h1_match.group(1) if h1_match else f.stem
        
        # Document ID
        doc_id = f.stem.split("_")[0]
        if not doc_id.startswith("DOC-"):
            id_m = re.search(r"DOC-\d+-[A-Z]+-\d+", f.name)
            doc_id = id_m.group(0) if id_m else f.stem[:14]
            
        # Short Summary
        summary = ""
        # Look for Executive Summary or Section 1
        sec1_match = re.search(r"## 1\.\s+([^\n]+)\n+(.+?)(?=\n##|\Z)", content, re.DOTALL)
        if sec1_match:
            raw_text = sec1_match.group(2).strip()
            # remove markdown links, code blocks
            clean_text = re.sub(r"```.*?```", "", raw_text, flags=re.DOTALL)
            clean_text = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", clean_text)
            clean_text = re.sub(r"[*#_`>]", "", clean_text)
            lines = [l.strip() for l in clean_text.split("\n") if l.strip() and not l.strip().startswith("-") and not l.strip().startswith("1.") and not l.strip().startswith("|")]
            if lines:
                summary = lines[0][:200]
        if not summary:
            summary = "Production technical specification for enterprise core lending operations."

        docx_path = tech_root / "docx" / cat.name / f"{f.stem}.docx"
        has_docx = docx_path.exists()
        
        doc_inventory.append({
            "id": doc_id,
            "category_folder": cat.name,
            "md_name": f.name,
            "md_rel_path": f"technical_document/{cat.name}/{f.name}",
            "docx_rel_path": f"technical_document/docx/{cat.name}/{f.stem}.docx",
            "title": title,
            "doc_type": doc_type,
            "summary": summary,
            "has_docx": has_docx,
            "md_size_kb": round(f.stat().st_size / 1024, 1),
            "docx_size_kb": round(docx_path.stat().st_size / 1024, 1) if has_docx else 0
        })

print(f"Total parsed documents: {len(doc_inventory)}")
output_json = repo_root / "technical_document" / "scripts" / "doc_inventory.json"
output_json.write_text(json.dumps(doc_inventory, indent=2), encoding="utf-8")
print(f"Wrote inventory to {output_json}")
