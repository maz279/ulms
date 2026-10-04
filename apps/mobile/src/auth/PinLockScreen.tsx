/* App-lock screen (PLANNING/08 A2): first use sets the PIN, later cold
 * starts require it. Wrong attempts lock out with a backoff so a lost
 * phone isn't a brute-force target; the queue stays encrypted-at-rest by
 * the OS keystore, this gate is the app-layer defense.
 */
import * as React from "react";
import { View, Text, Pressable, TextInput, StyleSheet } from "react-native";
import { hasPin, setPin, verifyPin, isValidPin } from "./pin";

export function PinLockScreen({ onUnlocked }: { onUnlocked: () => void }) {
  const [mode, setMode] = React.useState<"loading" | "set" | "enter">("loading");
  const [pin, setPinState] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  const [attempts, setAttempts] = React.useState(0);
  const [lockUntil, setLockUntil] = React.useState(0);

  React.useEffect(() => { void hasPin().then((x) => setMode(x ? "enter" : "set")); }, []);

  if (mode === "loading") return null;

  const locked = Date.now() < lockUntil;
  const lockSecs = Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000));

  function badAttempt() {
    const next = attempts + 1;
    setAttempts(next);
    setPinState("");
    if (next % 3 === 0) {
      // 30s lockout per 3 wrong attempts — linear, humane, enough on a phone
      setLockUntil(Date.now() + 30_000);
    }
  }

  async function submitEnter() {
    if (await verifyPin(pin)) {
      onUnlocked();
    } else {
      setErr("Wrong PIN");
      badAttempt();
    }
  }

  async function submitSet() {
    if (!isValidPin(pin)) { setErr("PIN must be 4-6 digits"); return; }
    if (pin !== confirm) { setErr("PINs do not match"); return; }
    await setPin(pin);
    onUnlocked();
  }

  return (
    <View style={s.page}>
      <Text style={s.h1}>{mode === "set" ? "Set your app PIN" : "Enter PIN"}</Text>
      <TextInput
        style={s.input} keyboardType="number-pad" secureTextEntry maxLength={6}
        editable={!locked}
        value={pin} onChangeText={(v) => { setPinState(v.replace(/\D/g, "")); setErr(null); }} />
      {mode === "set" && (
        <TextInput
          style={s.input} keyboardType="number-pad" secureTextEntry maxLength={6}
          placeholder="Confirm PIN"
          value={confirm} onChangeText={(v) => { setConfirm(v.replace(/\D/g, "")); setErr(null); }} />
      )}
      <Pressable style={[s.btn, locked && { opacity: 0.5 }]} disabled={locked}
        onPress={() => { void (mode === "set" ? submitSet() : submitEnter()); }}>
        <Text style={s.btnText}>{mode === "set" ? "Set PIN & continue" : "Unlock"}</Text>
      </Pressable>
      <Text style={s.err}>{locked ? `Locked — retry in ${lockSecs}s` : err ?? ""}</Text>
      <Text style={s.fine}>Biometric unlock joins at the managed (EAS/MDM) build</Text>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12, backgroundColor: "#fff" },
  h1: { fontSize: 22, fontWeight: "800" },
  input: { borderWidth: 1, borderColor: "#c9cede", borderRadius: 8, padding: 12,
           fontSize: 20, letterSpacing: 6, width: 200, textAlign: "center" },
  btn: { backgroundColor: "#1E2660", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 32, marginTop: 8 },
  btnText: { color: "#fff", fontWeight: "700" },
  err: { color: "#C50F1F", fontSize: 13, minHeight: 18 },
  fine: { fontSize: 11, color: "#888" },
});
