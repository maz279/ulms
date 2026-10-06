package com.uslbd.ulms.approval;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Ladder routing (03 mod-approval): amount → start node L1..L7 from approval_band
 * configuration. Decision-table tested at ±৳1 boundaries (09 §3 oracles).
 */
@Service
public class LadderService {

    private final ApprovalBandRepository bands;

    LadderService(ApprovalBandRepository bands) { this.bands = bands; }

    /** Start node id ("L1".."L7") for a BDT-minor amount. */
    public String startNodeFor(long amountMinor) {
        if (amountMinor <= 0) throw new IllegalArgumentException("Amount must be positive");
        List<ApprovalBand> all = bands.findAllByOrderByLevelAsc();
        return all.stream()
                .filter(b -> b.contains(amountMinor))
                .findFirst()
                .map(b -> "L" + b.getLevel())
                .orElseThrow(() -> new IllegalStateException("No ladder band covers " + amountMinor));
    }

    /** Human-readable ladder for an application (UI: the ladder view). */
    public List<LadderRung> ladder() {
        return bands.findAllByOrderByLevelAsc().stream()
                .map(b -> new LadderRung(b.getLevel(), b.getRoleKey(), b.getRoleNameEn(),
                        b.getMinMinor(), b.getMaxMinor()))
                .toList();
    }

    public record LadderRung(int level, String roleKey, String roleNameEn, long minMinor, Long maxMinor) {}
}
