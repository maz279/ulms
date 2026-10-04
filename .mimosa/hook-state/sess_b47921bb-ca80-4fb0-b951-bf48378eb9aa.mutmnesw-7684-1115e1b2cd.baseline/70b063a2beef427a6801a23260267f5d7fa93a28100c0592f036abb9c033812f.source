/* More — language toggle, early-payoff calculator (research-standard
 * borrower engagement feature), help/branch line, sign out.
 */
import * as React from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useLang } from "../i18n/LangProvider";
import { t } from "../i18n/strings";
import { tk } from "../domain/format";
import { payoffMonths, interestSaved } from "../domain/emi";
import type { BorrowerSession } from "../api/client";

export function MoreScreen({ session, onLogout }: {
  session: BorrowerSession; onLogout: () => void;
}) {
  const { lang, setLang } = useLang();
  const loan = session.me.loans[0];
  const [extra, setExtra] = React.useState("");
  const extraMinor = Math.round((parseFloat(extra) || 0) * 100);
  const base = loan ? payoffMonths(loan.outstandingMinor, loan.emiMinor, 0, 13) : null;
  const faster = loan ? payoffMonths(loan.outstandingMinor, loan.emiMinor, extraMinor, 13) : null;
  const saved = loan ? interestSaved(loan.outstandingMinor, loan.emiMinor, extraMinor, 13) : null;

  return (
    <View style={s.page}>
      <Text style={s.h1}>{t(lang, "more.title")}</Text>

      <View style={s.card}>
        <Text style={s.h2}>{t(lang, "more.lang")}</Text>
        <View style={s.row}>
          {(["bn", "en"] as const).map((l) => (
            <Pressable key={l} style={[s.chip, lang === l && s.chipOn]}
              onPress={() => setLang(l)}>
              <Text style={[s.chipText, lang === l && { color: "#fff" }]}>
                {l === "bn" ? "বাংলা" : "English"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {loan && (
        <View style={s.card}>
          <Text style={s.h2}>{t(lang, "more.payoff")}</Text>
          <TextInput style={s.input} keyboardType="numeric"
            placeholder={t(lang, "more.payoffExtra")}
            value={extra} onChangeText={setExtra} />
          <Text style={s.calc}>
            {base ?? "—"} → {faster ?? "—"} mo · {saved != null ? tk(saved) : "—"}
          </Text>
          <Text style={s.fine}>EMI {tk(loan.emiMinor)} @ 13% p.a.</Text>
        </View>
      )}

      <View style={s.card}>
        <Text style={s.h2}>{t(lang, "more.help")}</Text>
        <Text style={s.fine}>{t(lang, "more.branch")}</Text>
      </View>

      <Pressable style={s.logout} onPress={onLogout}>
        <Text style={s.logoutText}>{t(lang, "more.logout")}</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, padding: 16, paddingTop: 48, gap: 10, backgroundColor: "#F7F8FC" },
  h1: { fontSize: 20, fontWeight: "800" },
  h2: { fontSize: 15, fontWeight: "700", marginBottom: 6 },
  card: { backgroundColor: "#fff", borderRadius: 10, padding: 14,
          borderWidth: 1, borderColor: "#E1E5F2" },
  row: { flexDirection: "row", gap: 8 },
  chip: { borderWidth: 1, borderColor: "#3F51B5", borderRadius: 20,
          paddingVertical: 6, paddingHorizontal: 16 },
  chipOn: { backgroundColor: "#3F51B5" },
  chipText: { color: "#3F51B5", fontWeight: "600" },
  input: { borderWidth: 1, borderColor: "#c9cede", borderRadius: 8, padding: 10 },
  calc: { fontWeight: "700", marginTop: 8, color: "#107C10" },
  fine: { fontSize: 12, color: "#888", marginTop: 2 },
  logout: { borderWidth: 1, borderColor: "#C50F1F", borderRadius: 8,
            paddingVertical: 10, alignItems: "center" },
  logoutText: { color: "#C50F1F", fontWeight: "700" },
});
