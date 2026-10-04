/* Pay — OTP-confirmed payment via rail REDIRECT (BB MFS model: the app
 * never touches card/wallet credentials; bKash/Nagad checkout opens in the
 * system browser and the bank's webhook posts the payment).
 */
import * as React from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Linking, FlatList } from "react-native";
import { useLang } from "../i18n/LangProvider";
import { t } from "../i18n/strings";
import { tk } from "../domain/format";
import { initiatePayment, fetchPayments, assertSafeExternalUrl,
         type BorrowerSession, type PaymentLine } from "../api/client";

const RAILS = ["BKASH", "NAGAD", "BEFTN"] as const;

export function PayScreen({ session }: { session: BorrowerSession }) {
  const { lang } = useLang();
  const loan = session.me.loans[0];
  const [amount, setAmount] = React.useState("");
  const [rail, setRail] = React.useState<string>("BKASH");
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [history, setHistory] = React.useState<PaymentLine[]>([]);

  const reload = React.useCallback(() => {
    if (!loan) return;
    void fetchPayments(session.mobile, loan.loanId).then(setHistory).catch(() => setHistory([]));
  }, [session.mobile, loan]);
  React.useEffect(reload, [reload]);

  if (!loan) {
    return <View style={s.page}><Text style={s.h1}>{t(lang, "pay.title")}</Text>
      <Text style={s.empty}>{t(lang, "home.noLoans")}</Text></View>;
  }

  return (
    <View style={s.page}>
      <Text style={s.h1}>{t(lang, "pay.title")} — {loan.loanNo}</Text>
      <Text style={s.due}>{t(lang, "home.emi")} {tk(loan.emiMinor)} · {t(lang, "home.outstanding")} {tk(loan.outstandingMinor)}</Text>
      <TextInput
        style={s.input} keyboardType="numeric" placeholder={t(lang, "pay.amount")}
        value={amount} onChangeText={(v) => { setAmount(v); setErr(null); }} />
      <View style={s.rails}>
        {RAILS.map((r) => (
          <Pressable key={r} style={[s.rail, rail === r && s.railOn]}
            onPress={() => setRail(r)}>
            <Text style={[s.railText, rail === r && { color: "#fff" }]}>{r}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        style={[s.btn, !(parseFloat(amount) > 0) && { opacity: 0.5 }]}
        disabled={!(parseFloat(amount) > 0)}
        onPress={async () => {
          setErr(null); setMsg(null);
          try {
            const intent = await initiatePayment(
              loan.loanId, Math.round(parseFloat(amount) * 100), rail,
              session.otpToken, session.mobile);
            if (intent.railUrl) {
              setMsg(t(lang, "pay.redirect"));
              // https-only guard before handing off to the system browser
              await Linking.openURL(assertSafeExternalUrl(intent.railUrl));
            } else {
              setMsg(`${intent.status} ✓`);
            }
            setAmount("");
            reload();
          } catch (e) { setErr(String(e instanceof Error ? e.message : e)); }
        }}>
        <Text style={s.btnText}>{t(lang, "pay.confirm")}</Text>
      </Pressable>
      {msg && <Text style={s.msg}>{msg}</Text>}
      {err && <Text style={s.err}>{err}</Text>}
      <Text style={s.h2}>{t(lang, "pay.history")}</Text>
      <FlatList
        data={history}
        keyExtractor={(p, i) => p.paidAt + i}
        renderItem={({ item }) => (
          <View style={s.row}>
            <Text style={s.rowAmt}>{tk(item.amountMinor)}</Text>
            <Text style={s.rowMeta}>{item.paidAt.slice(0, 10)} · {item.rail} · {item.utr ?? "—"}</Text>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, padding: 16, paddingTop: 48, gap: 8, backgroundColor: "#F7F8FC" },
  h1: { fontSize: 20, fontWeight: "800" },
  h2: { fontSize: 15, fontWeight: "700", marginTop: 8 },
  due: { color: "#666", fontSize: 13 },
  input: { borderWidth: 1, borderColor: "#c9cede", borderRadius: 8, padding: 10,
           backgroundColor: "#fff", fontSize: 16 },
  rails: { flexDirection: "row", gap: 8 },
  rail: { flex: 1, borderWidth: 1, borderColor: "#3F51B5", borderRadius: 8,
          paddingVertical: 8, alignItems: "center" },
  railOn: { backgroundColor: "#3F51B5" },
  railText: { color: "#3F51B5", fontWeight: "700" },
  btn: { backgroundColor: "#107C10", borderRadius: 8, paddingVertical: 12, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700" },
  msg: { color: "#107C10", fontSize: 13 },
  err: { color: "#C50F1F", fontSize: 13 },
  row: { backgroundColor: "#fff", borderRadius: 8, padding: 10, marginBottom: 6,
         borderWidth: 1, borderColor: "#E1E5F2" },
  rowAmt: { fontWeight: "700" },
  rowMeta: { color: "#888", fontSize: 12 },
  empty: { color: "#888", marginTop: 24, textAlign: "center" },
});
