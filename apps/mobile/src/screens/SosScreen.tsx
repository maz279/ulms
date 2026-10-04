/* SOS screen (PLANNING/08 A4) — one-tap escalation: durable alert +
 * SOS_RAISED outbox event (branch security workflow + SMS). Queued offline
 * with backoff like every mutation; the op id doubles as the note ref.
 * Bangla-first per 07 §6.
 */
import * as React from "react";
import { View, Text, Pressable, TextInput, StyleSheet, Alert } from "react-native";
import * as Location from "expo-location";
import { useLang } from "../i18n/LangProvider";
import { t } from "../i18n/strings";
import { enqueue } from "../queue/store";

export function SosScreen() {
  const lang = useLang();
  const [note, setNote] = React.useState("");
  const [armed, setArmed] = React.useState(false);   // two-step: arm → send

  async function currentGeo(): Promise<{ lat: number; lng: number } | null> {
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) return null;
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, mayShowUserSettingsDialog: false });
      return { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch {
      return null;   // SOS must never block on GPS — fire without geo
    }
  }

  function fire(geo: { lat: number; lng: number } | null) {
    void enqueue({
      id: `sos-${Date.now()}`,
      kind: "sos",
      loanId: "00000000-0000-0000-0000-000000000000",
      payload: {
        note: note.trim() || null,
        lat: geo?.lat ?? null,
        lng: geo?.lng ?? null,
        firedAt: new Date().toISOString(),
      },
      evidence: [],
    });
    setArmed(false);
    setNote("");
    Alert.alert(t(lang, "sos.queuedTitle"), t(lang, "sos.queuedBody"));
  }

  return (
    <View style={s.page}>
      <Text style={s.h1}>{t(lang, "sos.title")}</Text>
      <Text style={s.hint}>{t(lang, "sos.hint")}</Text>
      <TextInput
        style={s.input} multiline placeholder={t(lang, "sos.note")}
        value={note} onChangeText={setNote} />
      {!armed ? (
        <Pressable style={s.armBtn} onPress={() => setArmed(true)}>
          <Text style={s.armText}>{t(lang, "sos.arm")}</Text>
        </Pressable>
      ) : (
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable style={s.sendBtn} onPress={() => { void currentGeo().then(fire); }}>
            <Text style={s.armText}>{t(lang, "sos.send")}</Text>
          </Pressable>
          <Pressable style={s.cancelBtn} onPress={() => setArmed(false)}>
            <Text style={s.cancelText}>{t(lang, "sos.cancel")}</Text>
          </Pressable>
        </View>
      )}
      <Text style={s.fine}>{t(lang, "sos.finePrint")}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, padding: 16, gap: 12, backgroundColor: "#fff" },
  h1: { fontSize: 22, fontWeight: "700" },
  hint: { fontSize: 13, color: "#555" },
  input: { borderWidth: 1, borderColor: "#c9cede", borderRadius: 8, padding: 10,
           minHeight: 70, textAlignVertical: "top" },
  armBtn: { backgroundColor: "#C50F1F", borderRadius: 10, padding: 18,
            alignItems: "center", marginTop: 12 },
  sendBtn: { backgroundColor: "#8C0000", borderRadius: 10, padding: 18, flex: 1,
             alignItems: "center" },
  cancelBtn: { borderWidth: 1, borderColor: "#999", borderRadius: 10, padding: 18,
               flex: 1, alignItems: "center" },
  armText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  cancelText: { color: "#333", fontWeight: "700", fontSize: 16 },
  fine: { fontSize: 11, color: "#777", marginTop: 8 },
});
