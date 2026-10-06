/* Proof gallery (PLANNING/08 A4) — the evidence pack behind every queued
 * and synced op: photo references, GPS fixes, notes, signatures, voice —
 * with integrity sha and capture time. Read-only from the durable queue.
 */
import * as React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useLang } from "../i18n/LangProvider";
import { t } from "../i18n/strings";
import { loadQueue } from "../queue/store";
import type { Evidence, SyncState } from "../sync/engine";

const GLYPH: Record<Evidence["kind"], string> = {
  photo: "🖼", gps: "📍", note: "📝", signature: "✍", voice: "🎙",
};

interface Row { opId: string; kind: string; state: SyncState; ev: Evidence }

export function ProofGalleryScreen() {
  const lang = useLang();
  const [rows, setRows] = React.useState<Row[]>([]);
  const [reload, setReload] = React.useState(0);
  React.useEffect(() => {
    void loadQueue().then((q) => {
      const out: Row[] = [];
      for (const op of q) {
        for (const ev of op.evidence) out.push({ opId: op.id, kind: op.kind, state: op.state, ev });
        if (op.evidence.length === 0 && op.kind === "sos") {
          out.push({ opId: op.id, kind: op.kind, state: op.state,
                     ev: { kind: "note", ref: String(op.payload.note ?? "SOS"),
                           capturedAt: String(op.payload.firedAt ?? ""), sha256: "—" } });
        }
      }
      setRows(out);
    });
  }, [reload]);

  return (
    <View style={s.page}>
      <Text style={s.h1}>{t(lang, "proof.title")}</Text>
      <Text style={s.hint}>{t(lang, "proof.hint")}</Text>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.opId + r.ev.kind + r.ev.capturedAt}
        refreshing={false}
        onRefresh={() => setReload(reload + 1)}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.glyph}>{GLYPH[item.ev.kind] ?? "▫"}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.ref} numberOfLines={1}>{item.ev.ref}</Text>
              <Text style={s.meta}>
                {item.ev.capturedAt?.slice(0, 16).replace("T", " ")} · sha {item.ev.sha256?.slice(0, 10)}…
              </Text>
            </View>
            <Text style={[s.state, item.state === "synced" && { color: "#107C10" }]}>
              {t(lang, `sync.${item.state === "pending" ? "pending" : item.state}`)}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>{t(lang, "proof.empty")}</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, padding: 16, gap: 8, backgroundColor: "#fff" },
  h1: { fontSize: 22, fontWeight: "700" },
  hint: { fontSize: 12, color: "#666" },
  card: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10,
          borderWidth: 1, borderColor: "#e3e6ef", borderRadius: 8, marginBottom: 8 },
  glyph: { fontSize: 22 },
  ref: { fontFamily: "monospace", fontSize: 12 },
  meta: { fontSize: 10, color: "#888" },
  state: { fontSize: 11, color: "#555" },
  empty: { color: "#888", textAlign: "center", marginTop: 24 },
});
