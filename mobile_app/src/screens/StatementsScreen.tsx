/* Statements — presigned CSV download per PLANNING/08 B (tax certificates
 * join from the same presign pattern at the native build).
 */
import * as React from "react";
import { View, Text, Pressable, StyleSheet, Linking, Share } from "react-native";
import { useLang } from "../i18n/LangProvider";
import { t } from "../i18n/strings";
import { tk } from "../domain/format";
import { statementUrl, demoStatementCsv, DEMO_MODE, type BorrowerSession } from "../api/client";

export function StatementsScreen({ session }: { session: BorrowerSession }) {
  const { lang } = useLang();
  const [err, setErr] = React.useState<string | null>(null);

  return (
    <View style={s.page}>
      <Text style={s.h1}>{t(lang, "stmt.title")}</Text>
      {session.me.loans.map((l) => (
        <View key={l.loanId} style={s.card}>
          <Text style={s.loanNo}>{l.loanNo}</Text>
          <Text style={s.meta}>{tk(l.outstandingMinor)}</Text>
          <Pressable style={s.btn}
            onPress={() => {
              setErr(null);
              if (DEMO_MODE) {
                // standalone APK: generate the CSV and hand it to the OS
                // share sheet (save, mail, Drive — user's choice)
                void demoStatementCsv(session.mobile, l.loanId)
                  .then((csv) => Share.share({ title: "statement-" + l.loanNo, message: csv }))
                  .catch((e) => setErr(String(e instanceof Error ? e.message : e)));
                return;
              }
              // statementUrl is built from the VALIDATED API base — the
              // https-only guard applies to third-party rail URLs, not ours
              void Linking.openURL(statementUrl(l.loanId, session.mobile));
            }}>
            <Text style={s.btnText}>{t(lang, "stmt.download")}</Text>
          </Pressable>
        </View>
      ))}
      {err && <Text style={s.err}>{err}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, padding: 16, paddingTop: 48, gap: 8, backgroundColor: "#F7F8FC" },
  h1: { fontSize: 20, fontWeight: "800" },
  card: { backgroundColor: "#fff", borderRadius: 10, padding: 14, marginBottom: 8,
          borderWidth: 1, borderColor: "#E1E5F2", gap: 6 },
  loanNo: { fontFamily: "monospace", fontWeight: "700" },
  meta: { color: "#888" },
  btn: { backgroundColor: "#3F51B5", borderRadius: 8, paddingVertical: 10, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700" },
  err: { color: "#C50F1F", fontSize: 13 },
});
