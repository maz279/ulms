/* Sign-in screen (audit fix: beginLogin existed with no UI — a logged-out
 * app rendered blank). Keycloak PKCE via the system browser; the callback
 * arrives on the ulmsfield:// deep link and is exchanged here.
 */
import * as React from "react";
import { View, Text, Pressable, StyleSheet, Linking, ActivityIndicator } from "react-native";
import { beginLogin, exchangeCode, clearSession } from "./auth";

type Pending = { verifier: string; state: string } | null;

export function LoginScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const pending = React.useRef<Pending>(null);

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

  return (
    <View style={s.page}>
      <View style={s.logo}><Text style={s.logoText}>U</Text></View>
      <Text style={s.h1}>ULMS Field</Text>
      <Text style={s.sub}>ABC Bank · e-KYC & collections</Text>
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
      <Text style={s.fine}>Keycloak PKCE · redirected via the bank identity provider</Text>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12, backgroundColor: "#fff" },
  logo: { width: 64, height: 64, borderRadius: 16, backgroundColor: "#1E2660",
          alignItems: "center", justifyContent: "center" },
  logoText: { color: "#fff", fontSize: 34, fontWeight: "800" },
  h1: { fontSize: 26, fontWeight: "800", marginTop: 8 },
  sub: { fontSize: 14, color: "#666" },
  btn: { backgroundColor: "#3F51B5", borderRadius: 10, paddingVertical: 14,
         paddingHorizontal: 28, marginTop: 24 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  err: { color: "#C50F1F", fontSize: 13, textAlign: "center" },
  fine: { fontSize: 11, color: "#888", marginTop: 8, textAlign: "center" },
});
