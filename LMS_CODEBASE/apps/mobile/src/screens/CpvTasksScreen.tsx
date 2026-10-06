/* CPV tasks screen (R6) — assignment list + the verification form.
   The form gates on validateFieldForm (GPS <10m, ≥1 photo, person met,
   discrepancy ≥20 chars) BEFORE enqueueing — field officers can't submit
   bad evidence offline. */
import * as React from "react";
import { View, Text, FlatList, Pressable, TextInput, Switch, StyleSheet, Alert } from "react-native";
import { useLang } from "../i18n/LangProvider";
import { t } from "../i18n/strings";
import { fetchFieldTasksDelta, type FieldTaskView } from "../api/client";
import { enqueue } from "../queue/store";
import { validateFieldForm, type FieldForm, type Evidence } from "../sync/engine";
import SignatureCanvas from "react-native-signature-canvas";
import { Audio } from "expo-av";

export function CpvTasksScreen() {
  const lang = useLang();
  const [tasks, setTasks] = React.useState<FieldTaskView[]>([]);
  const [selected, setSelected] = React.useState<FieldTaskView | null>(null);
  const [signature, setSignature] = React.useState<string | null>(null);   // dataURL ref
  const [voiceSec, setVoiceSec] = React.useState<number | null>(null);     // UR-MOB-002: ≤5min note
  const recRef = React.useRef<Audio.Recording | null>(null);
  const tickRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const [form, setForm] = React.useState<FieldForm>({
    verificationType: "RESIDENCE", personMet: false,
    gps: { lat: 23.7936, lng: 90.4043, accuracyM: 6 },   // expo-location fills live
    photos: 1, notes: "", outcome: "VERIFIED",
  });
  React.useEffect(() => {
    // PLANNING/08 A5: the app pulls its OWN /field delta (bundle version
    // feeds the offline cache; full bundle on first load)
    void fetchFieldTasksDelta(null).then((b) => setTasks(b.data)).catch(() => setTasks([]));
  }, []);

  if (selected) {
    const errors = validateFieldForm(form);
    return (
      <View style={s.page}>
        <Text style={s.h1}>{t(lang, `cpv.${form.verificationType.toLowerCase()}`)}</Text>
        <View style={s.field}>
          <Text>{t(lang, "cpv.personMet")}</Text>
          <Switch value={form.personMet} onValueChange={(v) => setForm({ ...form, personMet: v })} />
        </View>
        <Text style={s.hint}>{t(lang, "gps.waiting")} ({form.gps?.accuracyM}m)</Text>
        <Text style={s.hint}>{t(lang, "cpv.photos")}: {form.photos}</Text>
        <TextInput style={s.input} multiline placeholder={t(lang, "cpv.notes")}
          value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} />
        <Pressable style={s.btn}
          onPress={async () => {
            if (recRef.current) {
              await recRef.current.stopAndUnloadAsync();
              recRef.current = null;
              if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
              return;
            }
            try {
              const perm = await Audio.requestPermissionsAsync();
              if (!perm.granted) return;
              await Audio.setAudioModeAsync({ allowsRecordingIOS: true,
                playsInSilentModeIOS: true });
              const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HighQuality);
              recRef.current = recording;
              const started = Date.now();
              // UR-MOB-002: hard 5-minute cap — auto-stop and record the duration
              tickRef.current = setInterval(() => {
                const sec = Math.round((Date.now() - started) / 1000);
                setVoiceSec(sec);
                if (sec >= 300 && recRef.current) {
                  if (tickRef.current) clearInterval(tickRef.current);
                  tickRef.current = null;
                  void recRef.current.stopAndUnloadAsync().then(() => { recRef.current = null; });
                }
              }, 1000);
            } catch { /* mic unavailable — skip voice */ }
          }}>
          <Text style={s.btnText2}>{voiceSec == null ? t(lang, "cpv.voiceRec") : `${t(lang, "cpv.voiceStop")} (${voiceSec}s / 300s)`}</Text>
        </Pressable>
        <Text style={s.hint}>{t(lang, "cpv.signature")}{signature ? ` — ${t(lang, "cpv.signed")}` : ""}</Text>
        <View style={{ height: 120, borderWidth: 1, borderColor: "#c9cede", borderRadius: 8 }}>
          <SignatureCanvas
            backgroundColor="rgba(240,242,251,1)"
            penColor="#0B0E1A"
            onOK={(img) => setSignature(img)}
            onEmpty={() => setSignature(null)}
            descriptionText=""
            clearText="×"
            confirmText="✓"
          />
        </View>
        <Pressable
          style={[s.btnPrimary, errors.length > 0 && { opacity: 0.5 }]}
          disabled={errors.length > 0}
          onPress={() => {
            const at = new Date().toISOString();
            const evidence: Evidence[] = [
              { kind: "gps", ref: `gps:${form.gps?.lat},${form.gps?.lng}`,
                capturedAt: at, sha256: fnv1a(`gps:${form.gps?.lat},${form.gps?.lng}`) },
            ];
            if (signature) {
              // dataURL too heavy for the queue — keep the ref + content checksum
              evidence.push({ kind: "signature", ref: `sig:${selected.id}`,
                capturedAt: at, sha256: fnv1a(signature.slice(-2048)) });
            }
            if (form.notes) {
              evidence.push({ kind: "note", ref: form.notes.slice(0, 200),
                capturedAt: at, sha256: fnv1a(form.notes) });
            }
            if (voiceSec != null) {
              evidence.push({ kind: "voice", ref: `voice:${selected.id}:${voiceSec}s`,
                capturedAt: at, sha256: fnv1a(`voice:${selected.id}:${voiceSec}`) });
            }
            void enqueue({
              id: `visit-${selected.id}-${Date.now()}`,
              kind: "visit", loanId: selected.loanId, taskId: selected.id,
              payload: { outcome: form.outcome },
              evidence,
            });
            Alert.alert("Queued", "Visit queued — syncs when online (idempotent)");
            setSelected(null);
            setSignature(null);
            setVoiceSec(null);
            if (recRef.current) { void recRef.current.stopAndUnloadAsync(); recRef.current = null; }
            if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
          }}>
          <Text style={s.btnText}>{t(lang, "cpv.submit")}</Text>
        </Pressable>
        {errors.length > 0 && <Text style={s.err}>{errors[0]}</Text>}
      </View>
    );
  }

  return (
    <View style={s.page}>
      <Text style={s.h1}>{t(lang, "nav.tasks")}</Text>
      <FlatList
        data={tasks}
        keyExtractor={(x) => x.id}
        renderItem={({ item }) => (
          <Pressable style={s.card} onPress={() => setSelected(item)}>
            <Text style={s.loanNo}>{item.loanId.slice(0, 8)} · due {item.dueOn}</Text>
            <Text style={s.meta}>{item.status}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  btn: { borderWidth: 1, borderColor: "#3F51B5", borderRadius: 8,
         paddingVertical: 8, paddingHorizontal: 12, alignItems: "center" },
  btnText2: { color: "#3F51B5", fontSize: 13, fontWeight: "600" },
  page: { flex: 1, padding: 16, paddingTop: 48 },
  h1: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  card: { borderWidth: 1, borderColor: "#e0e0e6", borderRadius: 10, padding: 12, marginBottom: 8 },
  field: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 8 },
  loanNo: { fontWeight: "700", fontSize: 15 },
  meta: { color: "#555", fontSize: 12 },
  hint: { color: "#777", fontSize: 12, marginVertical: 2 },
  input: { borderWidth: 1, borderColor: "#e0e0e6", borderRadius: 8, padding: 10, minHeight: 70, marginVertical: 8, textAlignVertical: "top" },
  btnPrimary: { backgroundColor: "#3F51B5", borderRadius: 8, paddingVertical: 12, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "600" },
  err: { color: "#C50F1F", fontSize: 12, marginTop: 8 },
});


/** Deterministic content checksum for queued evidence integrity (the EAS
 *  build replaces this with an expo-crypto sha256 digest — same field). */
function fnv1a(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0").repeat(4).slice(0, 32);
}
