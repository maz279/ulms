/* Sync screen (R6) — queue state + manual drain + auto-sync on focus. */
import * as React from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useLang } from "../i18n/LangProvider";
import { t } from "../i18n/strings";
import { loadQueue, saveQueue } from "../queue/store";
import { syncQueue, type QueuedOperation } from "../sync/engine";
import { apiTransport } from "../api/client";

export function SyncScreen() {
  const lang = useLang();
  const [queue, setQueue] = React.useState<QueuedOperation[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [summary, setSummary] = React.useState<string>("");

  const refresh = React.useCallback(async () => setQueue(await loadQueue()), []);
  React.useEffect(() => { void refresh(); }, [refresh]);

  const drain = async () => {
    setBusy(true);
    try {
      const { queue: next, result } = await syncQueue(await loadQueue(), apiTransport(null));
      await saveQueue(next);
      setQueue(next);
      setSummary(`synced ${result.synced} · conflicts(server-wins) ${result.conflictsResolved} · appended ${result.evidenceAppended} · deferred ${result.deferred} · failed ${result.failed}`);
    } finally { setBusy(false); }
  };

  return (
    <View style={s.page}>
      <Text style={s.h1}>{t(lang, "nav.sync")}</Text>
      <Pressable style={[s.btnPrimary, busy && { opacity: 0.6 }]} disabled={busy} onPress={() => void drain()}>
        <Text style={s.btnText}>{busy ? t(lang, "sync.syncing") : "Sync now"}</Text>
      </Pressable>
      {summary ? <Text style={s.summary}>{summary}</Text> : null}
      <FlatList
        data={queue}
        keyExtractor={(x) => x.id}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.loanNo}>{item.kind} · {item.loanId.slice(0, 8)}</Text>
            <Text style={s.meta}>{t(lang, `sync.${item.state}`)} · attempts {item.attempts}{item.lastError ? ` · ${item.lastError}` : ""}</Text>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, padding: 16, paddingTop: 48 },
  h1: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  card: { borderWidth: 1, borderColor: "#e0e0e6", borderRadius: 10, padding: 12, marginBottom: 8 },
  loanNo: { fontWeight: "700", fontSize: 14 },
  meta: { color: "#555", fontSize: 12 },
  btnPrimary: { backgroundColor: "#3F51B5", borderRadius: 8, paddingVertical: 12, alignItems: "center", marginBottom: 8 },
  btnText: { color: "#fff", fontWeight: "600" },
  summary: { fontSize: 12, color: "#333", marginBottom: 8 },
});
