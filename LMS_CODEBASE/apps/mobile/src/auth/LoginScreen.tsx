/* Sign-in screen — visual-enhancement layer from the validated borrower
 * prototype, staff flavor: gradient hero with the bank brand row, tagline,
 * and a rotating security-notice carousel (offline-first, OTP discipline,
 * SOS). Keycloak PKCE via the system browser; the callback arrives on the
 * ulmsfield:// deep link and is exchanged here. Flows unchanged.
 */
import * as React from "react";
import { View, Text, Pressable, StyleSheet, Linking, ActivityIndicator, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { beginLogin, exchangeCode, clearSession } from "./auth";

type Pending = { verifier: string; state: string } | null;

const NOTICES = [
  { ico: "📶", tag: "offline",
    t: "Works without internet", s: "Verifications, photos and GPS queue on-device — sync when you're back in coverage." },
  { ico: "🔐", tag: "security",
    t: "Bank PKCE sign-in", s: "Your staff credentials stay with the bank identity provider — never in the app." },
  { ico: "🆘", tag: "safety",
    t: "One-tap SOS", s: "Escalation alerts branch security with your location — never silently dropped." },
];

const CAROUSEL_MS = 4200;

export function LoginScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [noticeIdx, setNoticeIdx] = React.useState(0);
  const pending = React.useRef<Pending>(null);

  React.useEffect(() => {
    const id = setInterval(() => setNoticeIdx((i) => (i + 1) % NOTICES.length), CAROUSEL_MS);
    return () => clearInterval(id);
  }, []);

  async function complete(url: string) {
    // Hermes has no URL global guarantee — parse the query by hand
    const q = url.slice(url.indexOf("?") + 1);
    const param = (k: string): string | null => {
      const hit = q.split("&").find((kv) => kv.startsWith(k + "="));
      return hit ? decodeURIComponent(hit.slice(k.length + 1)) : null;
    };
    const code = param("code");
    const state = param("state");
    if (!code || !pending.current || pending.current.state !== state) {
      setErr("Login callback mismatch — retry sign-in");
      setBusy(false);
      return;
    }
    try {
      await exchangeCode(code, pending.current.verifier);
      pending.current = null;
      onSignedIn();
    } catch (e) {
      setErr(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  }

  React.useEffect(() => {
    // cold start straight into the callback
    void Linking.getInitialURL().then((url: string | null) => {
      if (url && url.startsWith("ulmsfield://")) void complete(url);
    });
    const sub = Linking.addEventListener("url", (e) => {
      if (e.url.startsWith("ulmsfield://")) void complete(e.url);
    });
    return () => sub.remove();
  }, []);

  const notice = NOTICES[noticeIdx];

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content} bounces={false}>
      <LinearGradient colors={["#0D1233", "#1E2660", "#3F51B5"]} style={s.hero}>
        <View style={s.brandrow}>
          <LinearGradient colors={["#5C6BC0", "#7986CB"]} style={s.brandlogo}>
            <Text style={s.brandlogoText}>U</Text>
          </LinearGradient>
          <View>
            <Text style={s.brandname}>ULMS Field</Text>
            <Text style={s.brandsub}>ABC Bank · e-KYC & collections</Text>
          </View>
        </View>
        <Text style={s.welcome}>Field work, offline-first</Text>
        <Text style={s.welsub}>
          Verifications, visits and collections — with evidence that syncs safely.
        </Text>
        <View style={s.news}>
          <Text style={s.nico}>{notice.ico}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.ntag}>{notice.tag}</Text>
            <Text style={s.ntitle}>{notice.t}</Text>
            <Text style={s.nsub}>{notice.s}</Text>
          </View>
        </View>
        <View style={s.dots}>
          {NOTICES.map((_, i) => (
            <View key={i} style={[s.dot, i === noticeIdx && s.dotOn]} />
          ))}
        </View>
      </LinearGradient>

      <View style={s.formcard}>
        <Text style={s.ftitle}>Sign in to start today's visits</Text>
        <Text style={s.fsub}>Bank account via the identity provider — PKCE in the system browser</Text>
        <Pressable
          style={[s.btn, busy && { opacity: 0.6 }]}
          disabled={busy}
          onPress={async () => {
            setErr(null);
            setBusy(true);
            await clearSession();   // drop any expired session before the round-trip
            try {
              pending.current = await beginLogin((url: string) => Linking.openURL(url));
            } catch (e) {
              setErr(String(e instanceof Error ? e.message : e));
              setBusy(false);
            }
          }}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Sign in with bank account</Text>}
        </Pressable>
        {err && <Text style={s.err}>{err}</Text>}
      </View>
      <Text style={s.fine}>Keycloak PKCE · redirected via the bank identity provider</Text>
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
  ntitle: { color: "#fff", fontSize: 12.5, fontWeight: "700", lineHeight: 17 },
  nsub: { color: "rgba(255,255,255,.75)", fontSize: 10.5, lineHeight: 15, marginTop: 2 },
  dots: { flexDirection: "row", gap: 5, justifyContent: "center", marginTop: 9 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,.35)" },
  dotOn: { width: 14, backgroundColor: "#F0C441" },
  formcard: { marginHorizontal: 16, marginTop: 14, backgroundColor: "#fff", borderRadius: 16,
              padding: 16, shadowColor: "#0D1233", shadowOpacity: 0.16, shadowRadius: 18,
              shadowOffset: { width: 0, height: 10 }, elevation: 6 },
  ftitle: { fontSize: 14.5, fontWeight: "800", color: "#1E2660" },
  fsub: { fontSize: 11, color: "#889", marginTop: 2, marginBottom: 6, lineHeight: 15 },
  btn: { backgroundColor: "#3F51B5", borderRadius: 10, paddingVertical: 14,
         alignItems: "center", marginTop: 10 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  err: { color: "#C50F1F", fontSize: 13, textAlign: "center", marginTop: 8 },
  fine: { fontSize: 11, color: "#888", marginTop: 12, textAlign: "center", lineHeight: 15 },
});
