"""
Final 4 Fixes for Zero-Trust Audit
"""
from pathlib import Path

ROOT = Path(r"c:\software_project\mim_project\LMS\technical_document")

def replace_in_file(rel_path, old, new):
    target = ROOT / rel_path
    text = target.read_text(encoding="utf-8")
    text = text.replace(old, new)
    target.write_text(text, encoding="utf-8")
    print(f"Patched: {rel_path}")

replace_in_file("05_developer_extension/DOC-05-EXT-01_Developer_Onboarding_and_Local_Workspace_Quickstart.md",
    "`apps/web/src/modules/customer/CustomerForm.tsx` (target component to be authored in exercise)",
    "`apps/web/src/features/customer/CustomerPage.tsx`")

replace_in_file("05_developer_extension/DOC-05-EXT-02_New_Loan_Product_Definition_and_Pricing_Extension_Guide.md",
    "`apps/api/src/main/java/com/uslbd/ulms/product/pricing/MurabahaPricingStrategy.java` (sample strategy implementation)",
    "`apps/api/src/main/java/com/uslbd/ulms/product/ProductService.java`")

replace_in_file("06_quality_assurance/DOC-06-QA-01_Automated_Test_Harness_Architecture_and_Verification_Suite.md",
    "apps/api/src/test/java/com/uslbd/ulms/platform/MoneyMathTest.java",
    "apps/api/src/test/java/com/uslbd/ulms/platform/outbox/OutboxServiceTest.java")

replace_in_file("05_developer_extension/DOC-05-EXT-07_Bangladesh_Bank_Regulatory_Return_XML_CSV_Generation_Guide.md",
    "ulms.platform_config",
    "ulms.product")

print("Final 4 patches applied!")
