import os
import re
import glob
import json

BASE_DIR = r"c:\software_project\mim_project\LMS"
TECH_DOC_DIR = os.path.join(BASE_DIR, "technical_document")
CODEBASE_DIR = os.path.join(BASE_DIR, "LMS_CODEBASE")

def extract_sql_tables():
    mig_dir = os.path.join(CODEBASE_DIR, "apps", "api", "src", "main", "resources", "db", "migration")
    tables = {}
    for f in sorted(glob.glob(mig_dir + "/*.sql")):
        fname = os.path.basename(f)
        with open(f, "r", encoding="utf-8") as sqlf:
            content = sqlf.read()
        matches = re.findall(r"CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+([a-zA-Z0-9_.]+)", content, re.IGNORECASE)
        for m in matches:
            tname = m.replace("ulms.", "").lower()
            tables[tname] = fname
    return tables

def extract_all_routes():
    # 1. from openapi yaml
    spec_path = os.path.join(CODEBASE_DIR, "packages", "openapi", "ulms-api.yaml")
    routes = set()
    if os.path.exists(spec_path):
        with open(spec_path, "r", encoding="utf-8") as sf:
            for line in sf:
                m = re.match(r"^\s{2}(/[a-zA-Z0-9_\-\/{}\.]+):", line)
                if m:
                    r = m.group(1)
                    routes.add(r)
                    routes.add("/api/v1" + r)

    # 2. from controllers
    ctrl_route_file = os.path.join(BASE_DIR, "audit", "backend_controller_routes.txt")
    if os.path.exists(ctrl_route_file):
        with open(ctrl_route_file, "r", encoding="utf-8") as crf:
            for line in crf:
                parts = line.strip().split()
                if len(parts) >= 2:
                    r = parts[1]
                    routes.add(r)
                    if r.startswith("/api/v1"):
                        routes.add(r.replace("/api/v1", ""))
    return routes

def extract_java_inventory():
    java_dir = os.path.join(CODEBASE_DIR, "apps", "api", "src", "main", "java")
    classes = set()
    packages = set()
    for root, dirs, files in os.walk(java_dir):
        rel_pkg = os.path.relpath(root, java_dir).replace("\\", ".")
        if rel_pkg != ".":
            packages.add(rel_pkg)
        for f in files:
            if f.endswith(".java"):
                cname = os.path.splitext(f)[0]
                classes.add(cname)
                classes.add(f"{rel_pkg}.{cname}")
    return classes, packages

def run_zero_trust_audit():
    sql_tables = extract_sql_tables()
    all_routes = extract_all_routes()
    java_classes, java_packages = extract_java_inventory()

    print(f"Ground Truth Inventory:")
    print(f" - Flyway SQL Tables: {len(sql_tables)}")
    print(f" - Authoritative API Routes: {len(all_routes)}")
    print(f" - Java Classes & Packages: {len(java_classes)} classes, {len(java_packages)} packages")

    doc_files = glob.glob(TECH_DOC_DIR + "/**/*.md", recursive=True)
    findings = []

    for doc_path in sorted(doc_files):
        rel_doc = os.path.relpath(doc_path, TECH_DOC_DIR)
        with open(doc_path, "r", encoding="utf-8") as f:
            content = f.read()

        # 1. Audit file links: [text](file:///...)
        link_matches = re.finditer(r"\[([^\]]+)\]\((file:///[^)]+)\)", content)
        for lm in link_matches:
            target = lm.group(2)
            clean_path = target.replace("file:///", "").replace("/", "\\")
            if not os.path.exists(clean_path):
                findings.append({
                    "file": rel_doc,
                    "type": "BROKEN_FILE_LINK",
                    "detail": f"Target not found on disk: {target}"
                })

        # 2. Audit path references in backticks `LMS_CODEBASE/...`
        path_matches = re.finditer(r"`((?:LMS_CODEBASE|apps|packages|deploy|audit)/[^`]+)`", content)
        for pm in path_matches:
            ref_path = pm.group(1)
            clean_ref = ref_path.split("#")[0].split(" ")[0].strip()
            # ignore templates or wildcards
            if "*" in clean_ref or "<" in clean_ref:
                continue
            abs_cand1 = os.path.join(BASE_DIR, clean_ref.replace("/", "\\"))
            abs_cand2 = os.path.join(CODEBASE_DIR, clean_ref.replace("/", "\\"))
            if not (os.path.exists(abs_cand1) or os.path.exists(abs_cand2)):
                if not any(glob.glob(abs_cand1 + "*") or glob.glob(abs_cand2 + "*")):
                    findings.append({
                        "file": rel_doc,
                        "type": "INVALID_PATH_REFERENCE",
                        "detail": f"Referenced path does not exist: `{ref_path}`"
                    })

        # 3. Audit table references `ulms.<table_name>`
        table_matches = re.finditer(r"`ulms\.([a-zA-Z0-9_]+)`", content)
        for tm in table_matches:
            tname = tm.group(1).lower()
            if tname not in sql_tables:
                findings.append({
                    "file": rel_doc,
                    "type": "NON_EXISTENT_TABLE",
                    "detail": f"Table `ulms.{tname}` does not exist in Flyway migrations (closest match: {[t for t in sql_tables if tname in t or t in tname]})"
                })

        # 4. Audit API endpoint references `GET /api/v1/...` or `POST /api/v1/...`
        api_matches = re.finditer(r"`(GET|POST|PUT|PATCH|DELETE)\s+(/api/v1/[a-zA-Z0-9_\-\/{}\.]+)`", content)
        for am in api_matches:
            method = am.group(1)
            route = am.group(2)
            if "..." in route or "<" in route:
                continue
            route_normalized = re.sub(r"\{[a-zA-Z0-9_]+\}", "{}", route)
            matched = False
            for r in all_routes:
                r_norm = re.sub(r"\{[a-zA-Z0-9_]+\}", "{}", r)
                if route_normalized == r_norm or route == r:
                    matched = True
                    break
            if not matched:
                findings.append({
                    "file": rel_doc,
                    "type": "UNVERIFIED_API_ROUTE",
                    "detail": f"Endpoint `{method} {route}` not found in OpenAPI spec or controllers"
                })

        # 5. Audit Java class references `com.uslbd.ulms.<pkg>.<Class>`
        java_matches = re.finditer(r"`(com\.uslbd\.ulms\.[a-zA-Z0-9_.]+)`", content)
        for jm in java_matches:
            full_ref = jm.group(1)
            if full_ref in java_packages or full_ref in java_classes:
                continue
            parts = full_ref.split(".")
            cname = parts[-1]
            if len(parts) > 1 and parts[-1][0].islower():
                cname = parts[-2]
            if cname not in java_classes and not any(cname in c for c in java_classes):
                findings.append({
                    "file": rel_doc,
                    "type": "UNVERIFIED_JAVA_CLASS",
                    "detail": f"Java class/symbol `{full_ref}` not found in backend codebase"
                })

    print(f"\nZero-Trust Audit Finished! Total Findings: {len(findings)}")
    with open(os.path.join(TECH_DOC_DIR, "audit_findings_zero_trust.json"), "w", encoding="utf-8") as outf:
        json.dump(findings, outf, indent=2)

    by_type = {}
    for f in findings:
        by_type.setdefault(f["type"], []).append(f)
    for t, flist in by_type.items():
        print(f" - {t}: {len(flist)}")
        for item in flist[:5]:
            print(f"     [{item['file']}] {item['detail']}")
        if len(flist) > 5:
            print(f"     ... and {len(flist) - 5} more")

if __name__ == "__main__":
    run_zero_trust_audit()
