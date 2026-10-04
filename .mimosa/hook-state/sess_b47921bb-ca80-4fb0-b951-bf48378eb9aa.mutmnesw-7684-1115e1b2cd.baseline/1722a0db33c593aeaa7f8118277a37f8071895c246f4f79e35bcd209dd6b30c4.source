/* Application tracker + new application (research: apply/track in-app is a
 * core 2026 borrower feature; stages mirror the bank's BPF).
 */
import * as React from "react";
import { View, Text, FlatList, TextInput, Pressable, StyleSheet } from "react-native";
import { useLang } from "../i18n/LangProvider";
import { t } from "../i18n/strings";
import { tk } from "../domain/format";
import { fetchTracker, applyLoan, type BorrowerSession, type TrackerRow } from "../api/client";

export function TrackerScreen({ session }: { session: BorrowerSession }) {
  const { lang } = useLang();
  const [rows, setRows] = React.useState<TrackerRow[]>([]);
  const [amount, setAmount] = React.useState("");
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  const reload = React.useCallback(() => {
    void fetchTracker(session.me.cifNo).then(setRows).catch(() => setRows([]));
  }, [session.me.cifNo]);
  React.useEffect(reload, [reload]);

  return (
    <View style={s.page}>
      <Text style={s.h1}>{t(lang, "track.title")}</Text>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.appNo}
        ListEmptyComponent={<Text style={s.empty}>{t(lang, "track.empty")}</Text>}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.appNo}>{item.appNo}</Text>
            <Text style={s.stage}>{item.stage}</Text>
            <Text style={s.meta}>{item.productCode} · {tk(item.amountMinor)} · {item.submittedAt.slice(0, 10)}</Text>
          </View>
        )}
      />
      <View style={s.applyBox}>
        <Text style={s.h2}>{t(lang, "track.apply")}</Text>
        <TextInput
          style={s.input} keyboardType="numeric"
          placeholder={t(lang, "track.amount")}
          value={amount} onChangeText={(v) => { setAmount(v); setErr(null); }} />
        <Pressable
          style={[s.btn, !(parseFloat(amount) > 0) && { opacity: 0.5 }]}
          disabled={!(parseFloat(amount) > 0)}
          onPress={async () => {
            setErr(null);
            try {
              const a = await applyLoan(session.mobile, "retail-term",
                Math.round(parseFloat(amount) * 100000 * 100), 24);
              setMsg(`${a.appNo} ✓`);
              setAmount("");
              reload();
            } catch (e) { setErr(String(e instanceof Error ? e.message : e)); }
          }}>
          <Text style={s.btnText}>{t(lang, "track.submit")}</Text>
        </Pressable>
        {msg && <Text style={s.msg}>{msg}</Text>}
        {err && <Text style={s.err}>{err}</Text>}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, padding: 16, paddingTop: 48, gap: 8, backgroundColor: "#F7F8FC" },
  h1: { fontSize: 20, fontWeight: "800" },
  h2: { fontSize: 15, fontWeight: "700" },
  card: { backgroundColor: "#fff", borderRadius: 10, padding: 12, marginBottom: 8,
          borderWidth: 1, borderColor: "#E1E5F2" },
  appNo: { fontFamily: "monospace", fontWeight: "700" },
  stage: { color: "#3F51B5", fontWeight: "700", marginTop: 2 },
  meta: { color: "#888", fontSize: 12, marginTop: 2 },
  applyBox: { backgroundColor: "#fff", borderRadius: 10, padding: 14,
              borderWidth: 1, borderColor: "#E1E5F2", gap: 8 },
  input: { borderWidth: 1, borderColor: "#c9cede", borderRadius: 8, padding: 10 },
  btn: { backgroundColor: "#3F51B5", borderRadius: 8, paddingVertical: 10, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700" },
  msg: { color: "#107C10", fontSize: 13 },
  err: { color: "#C50F1F", fontSize: 13 },
  empty: { color: "#888", textAlign: "center", marginVertical: 16 },
});
