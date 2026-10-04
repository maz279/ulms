/* OTP login (PLANNING/08 B + BB MFS norm): mobile → SMS code → session.
 * No passwords — the research-standard frictionless onboarding for
 * borrowers; the otpToken from verify also authorizes payments.
 */
import * as React from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useLang } from "../i18n/LangProvider";
import { t } from "../i18n/strings";
import { requestOtp, verifyOtp, fetchMe, saveSession, type BorrowerSession } from "../api/client";

export function LoginScreen({ onSignedIn }: { onSignedIn: (s: BorrowerSession) => void }) {
  const { lang } = useLang();
  const [mobile, setMobile] = React.useState("");
  const [code, setCode] = React.useState("");
  const [otpSent, setOtpSent] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);

  const mobileOk = /^\+8801[3-9]\d{8}$/.test(mobile);

  return (
    <View style={s.page}>
      <View style={s.logo}><Text style={s.logoText}>৳</Text></View>
      <Text style={s.h1}>{t(lang, "app.title")}</Text>
      <Text style={s.sub}>{t(lang, "login.title")} — ABC Bank</Text>
      <TextInput
        style={s.input} keyboardType="phone-pad" placeholder="+8801XXXXXXXXX"
        value={mobile} onChangeText={(v) => { setMobile(v.trim()); setErr(null); }} />
      {!otpSent ? (
        <Pressable style={[s.btn, (!mobileOk || busy) && { opacity: 0.5 }]}
          disabled={!mobileOk || busy}
          onPress={async () => {
            setBusy(true); setErr(null);
            try {
              const devCode = await requestOtp(mobile);
              setOtpSent(true);
              if (devCode) { setCode(devCode); setMsg(t(lang, "login.devCode")); }
              else setMsg(t(lang, "login.otpSent"));
            } catch (e) { setErr(String(e instanceof Error ? e.message : e)); }
            finally { setBusy(false); }
          }}>
          <Text style={s.btnText}>{t(lang, "login.sendOtp")}</Text>
        </Pressable>
      ) : (
        <>
          <TextInput
            style={s.input} keyboardType="number-pad" maxLength={6}
            placeholder={t(lang, "login.otp")}
            value={code} onChangeText={(v) => { setCode(v.replace(/\D/g, "")); setErr(null); }} />
          <Pressable style={[s.btn, (code.length < 4 || busy) && { opacity: 0.5 }]}
            disabled={code.length < 4 || busy}
            onPress={async () => {
              setBusy(true); setErr(null);
              try {
                const otpToken = await verifyOtp(mobile, code);
                const me = await fetchMe(mobile);
                const session = { mobile, otpToken, me };
                await saveSession(session);
                onSignedIn(session);
              } catch (e) { setErr(String(e instanceof Error ? e.message : e)); }
              finally { setBusy(false); }
            }}>
            <Text style={s.btnText}>{t(lang, "login.verify")}</Text>
          </Pressable>
        </>
      )}
      {msg && <Text style={s.msg}>{msg}</Text>}
      {err && <Text style={s.err}>{err}</Text>}
      <Text style={s.fine}>OTP per Bangladesh Bank MFS norm · no card data on device</Text>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28, gap: 12, backgroundColor: "#fff" },
  logo: { width: 64, height: 64, borderRadius: 16, backgroundColor: "#1E2660",
          alignItems: "center", justifyContent: "center" },
  logoText: { color: "#F0C441", fontSize: 36, fontWeight: "800" },
  h1: { fontSize: 26, fontWeight: "800" },
  sub: { fontSize: 14, color: "#666" },
  input: { borderWidth: 1, borderColor: "#c9cede", borderRadius: 8, padding: 12,
           width: "100%", fontSize: 16 },
  btn: { backgroundColor: "#3F51B5", borderRadius: 10, paddingVertical: 14,
         paddingHorizontal: 28, width: "100%", alignItems: "center", marginTop: 6 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  msg: { color: "#107C10", fontSize: 13 },
  err: { color: "#C50F1F", fontSize: 13, textAlign: "center" },
  fine: { fontSize: 11, color: "#888", textAlign: "center", marginTop: 6 },
});
