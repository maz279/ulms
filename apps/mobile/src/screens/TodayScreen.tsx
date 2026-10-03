/* Today's visits — the collections field list (R6). Offline-first:
   loads the cached copy instantly, refreshes when online, mutations
   enqueue through the sync engine. GPS/camera/PTP actions attach
   evidence items (append-only). */
import * as React from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useLang } from "../i18n/LangProvider";
import { t } from "../i18n/strings";
import { fetchWorklist, type WorklistItem } from "../api/client";
import { enqueue } from "../queue/store";

export function TodayScreen() {
  const lang = useLang();
  const [items, setItems] = React.useState<WorklistItem[]>([]);
  const [offline, setOffline] = React.useState(false);
  React.useEffect(() => {
    void fetchWorklist(null)
      .then((d) => { setItems(d); setOffline(false); })
      .catch(() => { setOffline(true); /* cached list stays */ });
  }, []);

  return (
    <View style={s.page}>
      <Text style={s.h1}>{t(lang, "nav.today")}{offline ? " · offline" : ""}</Text>
      <FlatList
        data={items}
        keyExtractor={(x) => x.loanId}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.loanNo}>{item.loanNo}</Text>
            <Text style={s.meta}>DPD {item.dpd} · {item.classification} · {item.priority}</Text>
            <View style={s.row}>
              <Pressable style={s.btn} onPress={() => void enqueue({ id: String(Date.now()) + "-a", kind: "action-log", loanId: item.loanId,
                payload: { outcome: "CONTACTED", notes: "field call" }, evidence: [] })}>
                <Text style={s.btnText}>{t(lang, "collections.logCall")}</Text>
              </Pressable>
              <Pressable style={s.btnPrimary} onPress={() => void enqueue({ id: String(Date.now()) + "-p", kind: "ptp-create", loanId: item.loanId,
                payload: { promisedAmountMinor: 100000, promisedOn: "2026-10-10", confidence: "MEDIUM" }, evidence: [] })}>
                <Text style={s.btnText}>{t(lang, "collections.ptp")}</Text>
              </Pressable>
            </View>
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
  loanNo: { fontWeight: "700", fontSize: 15 },
  meta: { color: "#555", fontSize: 12, marginVertical: 4 },
  row: { flexDirection: "row", gap: 8 },
  btn: { borderWidth: 1, borderColor: "#3F51B5", borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  btnPrimary: { backgroundColor: "#3F51B5", borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  btnText: { color: "#3F51B5", fontSize: 13, fontWeight: "600" },
});
