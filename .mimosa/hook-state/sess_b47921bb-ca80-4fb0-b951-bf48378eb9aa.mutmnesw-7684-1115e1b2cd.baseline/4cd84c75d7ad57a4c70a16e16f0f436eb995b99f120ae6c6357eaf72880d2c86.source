/* Home — the research-standard dashboard: greeting, per-loan card with
 * outstanding + EMI + next due + DPD status, pay-now shortcut.
 */
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useLang } from "../i18n/LangProvider";
import { t } from "../i18n/strings";
import { tk } from "../domain/format";
import type { BorrowerSession } from "../api/client";

export function HomeScreen({ session }: { session: BorrowerSession }) {
  const { lang } = useLang();
  const nav = useNavigation<{ navigate: (name: string) => void }>();
  const me = session.me;

  return (
    <View style={s.page}>
      <Text style={s.h1}>{t(lang, "home.greeting")}, {me.nameEn}</Text>
      <FlatList
        data={me.loans}
        keyExtractor={(l) => l.loanId}
        ListEmptyComponent={<Text style={s.empty}>{t(lang, "home.noLoans")}</Text>}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.loanNo}>{item.loanNo} · {item.productCode}</Text>
            <Text style={s.big}>{tk(item.outstandingMinor)}</Text>
            <Text style={s.label}>{t(lang, "home.outstanding")}</Text>
            <View style={s.row}>
              <View style={s.fact}>
                <Text style={s.factV}>{tk(item.emiMinor)}</Text>
                <Text style={s.label}>{t(lang, "home.emi")}</Text>
              </View>
              <View style={s.fact}>
                <Text style={s.factV}>{item.nextDueOn ?? "—"}</Text>
                <Text style={s.label}>{t(lang, "home.nextDue")}</Text>
              </View>
              <View style={s.fact}>
                <Text style={[s.factV, item.dpd > 0 && { color: "#C50F1F" }]}>
                  {item.dpd > 0 ? `${item.dpd}` : "✓"}
                </Text>
                <Text style={s.label}>
                  {item.dpd > 0 ? t(lang, "home.dpd") : t(lang, "home.current")}
                </Text>
              </View>
            </View>
            <Pressable style={s.payBtn} onPress={() => nav.navigate("pay")}>
              <Text style={s.payText}>{t(lang, "home.payNow")}</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, padding: 16, paddingTop: 48, gap: 8, backgroundColor: "#F7F8FC" },
  h1: { fontSize: 20, fontWeight: "800" },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 10,
          borderWidth: 1, borderColor: "#E1E5F2" },
  loanNo: { fontFamily: "monospace", color: "#666", fontSize: 12 },
  big: { fontSize: 30, fontWeight: "800", color: "#1E2660", marginTop: 4 },
  label: { fontSize: 11, color: "#888" },
  row: { flexDirection: "row", gap: 18, marginTop: 10 },
  fact: { flex: 1 },
  factV: { fontSize: 15, fontWeight: "700" },
  payBtn: { backgroundColor: "#3F51B5", borderRadius: 8, paddingVertical: 10,
            alignItems: "center", marginTop: 12 },
  payText: { color: "#fff", fontWeight: "700" },
  empty: { color: "#888", textAlign: "center", marginTop: 32 },
});
