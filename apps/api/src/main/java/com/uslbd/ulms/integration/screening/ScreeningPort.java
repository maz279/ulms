package com.uslbd.ulms.integration.screening;

/**
 * Screening port (PLANNING/03 mod-customer, 06 §4): sanctions/PEP/adverse-media
 * checks at onboarding. Provider-agnostic — P1 ships the no-list default
 * (zero hits, hook armed); the list-file adapter lands with the compliance
 * list feeds in P2 behind this same interface.
 */
public interface ScreeningPort {

    /** Screen a customer's name against all configured lists. */
    ScreeningResult screen(String nameEn);

    record ScreeningMatch(String listName, String matchedName) {}

    record ScreeningResult(java.util.List<ScreeningMatch> matches) {
        public static final ScreeningResult CLEAR = new ScreeningResult(java.util.List.of());
        public boolean isClear() { return matches.isEmpty(); }
    }
}
