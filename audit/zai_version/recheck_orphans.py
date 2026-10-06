"""Adversarial re-check: how many of the external audit's 64 'orphans' are
actually called by the web client but mismarked by their template-substitution
bug (their regex replaces ${qs}-style QUERY-suffix vars with '123', appending
garbage to the path)? Run with a corrected matcher."""
import json
import re

d = json.load(open("audit/contract_parity_results.json", encoding="utf-8"))
orphans = d["orphaned_backend"]
fcalls = d["frontend_calls"]

QUERY_SUFFIX_VARS = {"${q}", "${qs}", "${suffix}", "${q2}"}


def clean(url: str) -> str:
    # query-suffix template vars vanish; path vars become a segment
    out, i = "", 0
    while i < len(url):
        if url[i] == "$" and i + 1 < len(url) and url[i + 1] == "{":
            j = url.index("}", i)
            expr = url[i : j + 1]
            out += "" if expr in QUERY_SUFFIX_VARS or "?" in expr else "123"
            i = j + 1
        else:
            out += url[i]
            i += 1
    return out.split("?")[0]


def matches(fc, be):
    url = clean(fc["url_raw"])
    rx = "^" + re.sub(r"\{[^}]+\}", "[^/]+", be["path"]) + "$"
    return be.get("verb") == fc.get("verb") and bool(re.match(rx, url))


recovered = []
for o in orphans:
    for fc in fcalls:
        try:
            if matches(fc, o):
                recovered.append((o.get("path"), fc.get("file") + ":" + str(fc.get("line"))))
                break
        except Exception:
            pass

print("their orphan total:", len(orphans))
print("actually-called-but-mismarked:", len(recovered))
for p, f in recovered:
    print("  ", p, "<-", f)
