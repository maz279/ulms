/* OTP login (PLANNING/08 B + BB MFS norm) — visual-enhancement layer from
 * the validated working prototype: gradient hero with the bank brand row
 * and an auto-rotating bilingual news carousel, glass-style form card,
 * trust badges. Flows unchanged: mobile → SMS code → session; the otpToken
 * from verify also authorizes payments.
 */
import * as React from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLang } from "../i18n/LangProvider";
import { t } from "../i18n/strings";
import { NEWS } from "../i18n/news";
import { requestOtp, verifyOtp, fetchMe, saveSession, type BorrowerSession } from "../api/client";

const CAROUSEL_MS = 3800;

export function LoginScreen({ onSignedIn }: { onSignedIn: (s: BorrowerSession) => void }) {
  const { lang } = useLang();
  const [mobile, setMobile] = React.useState("");
  const [code, setCode] = React.useState("");
  const [otpSent, setOtpSent] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [newsIdx, setNewsIdx] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => setNewsIdx((i) => (i + 1) % NEWS.length), CAROUSEL_MS);
    return () => clearInterval(id);
  }, []);

  const mobileOk = /^\+8801[3-9]\d{8}$/.test(mobile);
  const news = NEWS[newsIdx];
  const nc = news[lang];

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content} bounces={false}>
      <LinearGradient colors={["#0D1233", "#1E2660", "#3F51B5"]} style={s.hero}>
        <View style={s.brandrow}>
          <LinearGradient colors={["#5C6BC0", "#7986CB"]} style={s.brandlogo}>
            <Text style={s.brandlogoText}>U</Text>
          </LinearGradient>
          <View>
            <Text style={s.brandname}>ULMS Borrower</Text>
            <Text style={s.brandsub}>{t(lang, "login.brandSub")}</Text>
          </View>
        </View>
        <Text style={s.welcome}>{t(lang, "hero.tagline")}</Text>
        <Text style={s.welsub}>{t(lang, "hero.sub")}</Text>

        {/* news carousel */}
        <View style={s.news}>
          <Text style={s.nico}>{news.ico}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.ntag, news.tagCls === "info" && s.ntagInfo,
                          news.tagCls === "ok" && s.ntagOk]}>{news.tag}</Text>
            <Text style={s.ntitle}>{nc.t}</Text>
            <Text style={s.nsub}>{nc.s}</Text>
          </View>
        </View>
        <View style={s.dots}>
          {NEWS.map((_, i) => (
            <View key={i} style={[s.dot, i === newsIdx && s.dotOn]} />
          ))}
        </View>
      </LinearGradient>

      <View style={s.formcard}>
        <Text style={s.ftitle}>{t(lang, "login.cardTitle")}</Text>
        <Text style={s.fsub}>{t(lang, "login.cardSub")}</Text>
        <TextInput
          style={s.input} keyboardType="phone-pad" placeholder="+8801XXXXXXXXX"
          placeholderTextColor="#9aa0b5"
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
              placeholder={t(lang, "login.otp")} placeholderTextColor="#9aa0b5"
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
      </View>

      <View style={s.trust}>
        <Text style={s.trustChip}>Bangladesh Bank regulated</Text>
        <Text style={s.trustChip}>OTP secured</Text>
        <Text style={s.trustChip}>No card data on device</Text>
      </View>
      <Text style={s.fine}>OTP per Bangladesh Bank MFS norm · no card data on device</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#fff" },
  content: { paddingBottom: 28 },
  hero: { paddingTop: 54, paddingHorizontal: 18, paddingBottom: 24 },
  brandrow: { flexDirection: "row", alignItems: "center", gap: 12 },
  brandlogo: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  brandlogoText: { color: "#fff", fontWeight: "800", fontSize: 21 },
  brandname: { color: "#fff", fontSize: 18, fontWeight: "800", letterSpacing: 0.2 },
  brandsub: { color: "rgba(255,255,255,.75)", fontSize: 10.5, marginTop: 1 },
  welcome: { color: "#fff", fontSize: 22, fontWeight: "800", marginTop: 18 },
  welsub: { color: "rgba(255,255,255,.8)", fontSize: 12, lineHeight: 18, marginTop: 4 },
  news: { marginTop: 16, backgroundColor: "rgba(255,255,255,.12)",
          borderColor: "rgba(255,255,255,.16)", borderWidth: 1, borderRadius: 12,
          padding: 11, flexDirection: "row", gap: 10 },
  nico: { fontSize: 18, lineHeight: 22 },
  ntag: { color: "#F0C441", backgroundColor: "rgba(240,196,65,.22)", alignSelf: "flex-start",
          fontSize: 8.5, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase",
          paddingHorizontal: 7, paddingVertical: 2, borderRadius: 9, overflow: "hidden",
          marginBottom: 4 },
  ntagInfo: { color: "#C5CAE9", backgroundColor: "rgba(121,134,203,.30)" },
  ntagOk: { color: "#A5D6A7", backgroundColor: "rgba(16,124,16,.30)" },
  ntitle: { color: "#fff", fontSize: 12.5, fontWeight: "700", lineHeight: 17 },
  nsub: { color: "rgba(255,255,255,.75)", fontSize: 10.5, lineHeight: 15, marginTop: 2 },
  dots: { flexDirection: "row", gap: 5, justifyContent: "center", marginTop: 9 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,.35)" },
  dotOn: { width: 14, backgroundColor: "#F0C441" },
  formcard: { marginHorizontal: 16, marginTop: 14, backgroundColor: "#fff", borderRadius: 16,
              padding: 16, shadowColor: "#0D1233", shadowOpacity: 0.16, shadowRadius: 18,
              shadowOffset: { width: 0, height: 10 }, elevation: 6 },
  ftitle: { fontSize: 14.5, fontWeight: "800", color: "#1E2660" },
  fsub: { fontSize: 11, color: "#889", marginTop: 2, marginBottom: 2 },
  input: { borderWidth: 1, borderColor: "#c9cede", borderRadius: 8, padding: 11,
           width: "100%", fontSize: 15, color: "#222", marginTop: 8 },
  btn: { backgroundColor: "#3F51B5", borderRadius: 9, paddingVertical: 12,
         alignItems: "center", marginTop: 10 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 14.5 },
  msg: { color: "#107C10", fontSize: 12.5, marginTop: 8 },
  err: { color: "#C50F1F", fontSize: 12.5, marginTop: 8 },
  trust: { flexDirection: "row", gap: 6, justifyContent: "center", marginTop: 14, flexWrap: "wrap" },
  trustChip: { fontSize: 8.5, color: "#8a90a5", borderColor: "#E1E5F2", borderWidth: 1,
               borderRadius: 9, paddingHorizontal: 8, paddingVertical: 3, overflow: "hidden" },
  fine: { fontSize: 10.5, color: "#888", textAlign: "center", marginTop: 10, lineHeight: 15 },
});
