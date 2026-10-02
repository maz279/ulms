package com.uslbd.ulms;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;
import org.springframework.modulith.docs.Documenter;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

/**
 * Module boundary verification (PLANNING/02 §2, PLANNING/09 §1): fails the
 * build if any module reaches into another module's internals. This is the
 * guard that keeps the monolith modular (ADR-001).
 */
class ModularityTest {

    static final ApplicationModules modules = ApplicationModules.of(UlmsApplication.class);

    @Test
    void verifiesModularStructure() {
        modules.verify();
    }

    @Test
    void documentsModules() {
        // Generates docs/modulith canvases into build/ — committed on release for onboarding.
        new Documenter(modules).writeModulesAsPlantUml().writeIndividualModulesAsPlantUml();
    }

    /**
     * Dual-auth invariant, structural half (03: "enforced in service +
     * ArchUnit"): controllers must never touch the Fineract loan port — the
     * ONLY path to a disbursement is DisbursementService (which enforces the
     * distinct-officer chain). Blocks a future controller shortcut around
     * dual authorization.
     */
    @Test
    void disbursementExecutionCannotBypassDualAuth() {
        // production classes only — the importer sees test classes on the
        // classpath too, and tests legitimately stub the Fineract ports
        JavaClasses classes = new ClassFileImporter()
                .withImportOption(new com.tngtech.archunit.core.importer.ImportOption.DoNotIncludeTests())
                .importPackages("com.uslbd.ulms");
        noClasses().that().resideInAPackage("..approval..")
                .and().doNotHaveFullyQualifiedName(
                        "com.uslbd.ulms.approval.DisbursementService")
                .should().dependOnClassesThat()
                .resideInAnyPackage("..integration.fineract..")
                .because("Fineract execution is reachable only via DisbursementService's dual-auth chain")
                .check(classes);
        noClasses().that().resideInAPackage("..origination..")
                .and().haveSimpleNameEndingWith("Controller")
                .should().dependOnClassesThat()
                .haveFullyQualifiedName("com.uslbd.ulms.integration.fineract.FineractLoanPort")
                .because("loan execution must flow through the sanctioned paths only")
                .check(classes);
    }

    /**
     * Money-integer invariant (R10 P-A, PLAN-04 §2): no production field may
     * hold a floating-point type — money is BIGINT minor units end to end.
     * Internal arithmetic may cast, but persisted/carried state never may.
     */
    @Test
    void moneyMustNotUseFloatingPointFields() {
        JavaClasses classes = new ClassFileImporter()
                .withImportOption(new com.tngtech.archunit.core.importer.ImportOption.DoNotIncludeTests())
                .importPackages("com.uslbd.ulms");
        com.tngtech.archunit.lang.ArchRule rule =
                com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noFields()
                        .that().areDeclaredInClassesThat()
                        .resideInAPackage("com.uslbd.ulms..")
                        .should().haveRawType(Float.class)
                        .orShould().haveRawType(Double.class)
                        .because("money and amounts are BIGINT minor units (PLAN-04 §2)");
        rule.check(classes);
    }
}
