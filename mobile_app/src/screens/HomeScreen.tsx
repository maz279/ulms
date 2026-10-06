/* Home — visual-enhancement layer from the validated working prototype:
 * avatar top bar with a one-tap language chip, the primary loan as a
 * gradient HERO BALANCE CARD, a four-button quick-actions grid, a news
 * strip, and the remaining loan cards below. Data flows unchanged.
 */
import * as React from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useLang } from "../i18n/LangProvider";
import { t } from "../i18n/strings";
import { NEWS } from "../i18n/news";
import { tk } from "../domain/format";
import type { BorrowerSession } from "../api/client";

export function HomeScreen({ session }: { session: BorrowerSession }) {
  const { lang, setLang } = useLang();
  const nav = useNavigation<{ navigate: (name: string) => void }>();
  const me = session.me;
  const l0 = me.loans[0];
  const others = me.loans.slice(1);
  const [newsIdx, setNewsIdx] = React.useState(0);
  const news = NEWS[newsIdx];
  const nc = news[lang];
  const initial = (me.nameEn || "?").trim().charAt(0).toUpperCase();

  return (
    <FlatList
      data={others}
      keyExtractor={(l) => l.loanId}
      contentContainerStyle={s.page}
      ListHeaderComponent={
        <>
          <View style={s.topbar}>
            <LinearGradient colors={["#5C6BC0", "#3949ab"]} style={s.avatar}>
              <Text style={s.avatarText}>{initial}</Text>
            </LinearGradient>
            <View style={s.who}>
              <Text style={s.hi}>{t(lang, "home.greeting")}</Text>
              <Text style={s.nm} numberOfLines={1}>{me.nameEn}</Text>
            </View>
            <Pressable style={s.langchip} onPress={() => setLang(lang === "bn" ? "en" : "bn")}>
              <Text style={s.langchipText}>{lang === "bn" ? "EN" : "বাংলা"}</Text>
            </Pressable>
          </View>

          {l0 && (
            <LinearGradient colors={["#1a237e", "#283593", "#3949ab"]} style={s.herocard}>
              <Text style={s.hlabel}>{t(lang, "home.outstanding")} · {l0.loanNo}</Text>
              <Text style={s.hamount}>{tk(l0.outstandingMinor)}</Text>
              <View style={s.hrow}>
                <View style={s.hf}>
                  <Text style={s.hfv}>{tk(l0.emiMinor)}</Text>
                  <Text style={s.hfl}>{t(lang, "home.emi")}</Text>
                </View>
                <View style={s.hf}>
                  <Text style={s.hfv}>{l0.nextDueOn ?? "—"}</Text>
                  <Text style={s.hfl}>{t(lang, "home.nextDue")}</Text>
                </View>
                <View style={s.hf}>
                  <Text style={[s.hfv, { color: l0.dpd > 0 ? "#F0C441" : "#A5D6A7" }]}>
                    {l0.dpd > 0 ? `${l0.dpd}` : "✓"}
                  </Text>
                  <Text style={s.hfl}>{l0.dpd > 0 ? t(lang, "home.dpd") : t(lang, "home.current")}</Text>
                </View>
              </View>
              <Pressable style={s.hpay} onPress={() => nav.navigate("pay")}>
                <Text style={s.hpayText}>{t(lang, "home.payNow")}</Text>
              </Pressable>
            </LinearGradient>
          )}

          <View style={s.quickgrid}>
            {([
              ["pay", "💳", "home.quickPay"],
              ["track", "📄", "home.quickTrack"],
              ["statements", "🧾", "home.quickStmt"],
            ] as const).map(([tab, ico, key]) => (
              <Pressable key={tab} style={s.qa} onPress={() => nav.navigate(tab)}>
                <Text style={s.qi}>{ico}</Text>
                <Text style={s.qt}>{t(lang, key)}</Text>
              </Pressable>
            ))}
            <Pressable style={s.qa} onPress={() => nav.navigate("track")}>
              <Text style={s.qi}>➕</Text>
              <Text style={s.qt}>{t(lang, "home.quickApply")}</Text>
            </Pressable>
          </View>

          <Pressable style={s.strip} onPress={() => setNewsIdx((i) => (i + 1) % NEWS.length)}>
            <Text style={s.sico}>{news.ico}</Text>
            <Text style={s.stxt} numberOfLines={2}>
              <Text style={{ fontWeight: "700" }}>{nc.t}</Text>
              {" — "}
              {nc.s}
            </Text>
            <Text style={s.smore}>›</Text>
          </Pressable>
        </>
      }
      renderItem={({ item }) => (
        <View style={s.card}>
          <Text style={s.loanNo}>{item.loanNo} · {item.productCode}</Text>
          <Text style={s.mid}>{tk(item.outstandingMinor)}</Text>
          <View style={s.facts}>
            <View style={s.fact}>
              <Text style={s.factV}>{tk(item.emiMinor)}</Text>
              <Text style={s.label}>{t(lang, "home.emi")}</Text>
            </View>
            <View style={s.fact}>
              <Text style={s.factV}>{item.nextDueOn ?? "—"}</Text>
              <Text style={s.label}>{t(lang, "home.nextDue")}</Text>
            </View>
            <View style={s.fact}>
              <Text style={[s.factV, item.dpd > 0 && { color: "#C50F1F" }]}>
                {item.dpd > 0 ? `${item.dpd}` : "✓"}
              </Text>
              <Text style={s.label}>
                {item.dpd > 0 ? t(lang, "home.dpd") : t(lang, "home.current")}
              </Text>
            </View>
          </View>
          <Pressable style={s.payBtn} onPress={() => nav.navigate("pay")}>
            <Text style={s.payText}>{t(lang, "home.payNow")}</Text>
          </Pressable>
        </View>
      )}
      ListEmptyComponent={l0 ? null : (
        <Text style={s.empty}>{t(lang, "home.noLoans")}</Text>
      )}
    />
  );
}

const s = StyleSheet.create({
  page: { padding: 16, paddingTop: 46, backgroundColor: "#F7F8FC" },
  topbar: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  who: { flex: 1 },
  hi: { fontSize: 10, color: "#889" },
  nm: { fontSize: 14.5, fontWeight: "800", color: "#1E2660" },
  langchip: { borderColor: "#3F51B5", borderWidth: 1, backgroundColor: "#fff", borderRadius: 14,
              paddingVertical: 5, paddingHorizontal: 10 },
  langchipText: { color: "#3F51B5", fontSize: 10, fontWeight: "700" },
  herocard: { borderRadius: 16, padding: 18 },
  hlabel: { color: "rgba(255,255,255,.8)", fontSize: 10, letterSpacing: 1,
            textTransform: "uppercase" },
  hamount: { color: "#fff", fontSize: 27, fontWeight: "800", marginVertical: 6 },
  hrow: { flexDirection: "row", gap: 14 },
  hf: { flex: 1 },
  hfv: { color: "#fff", fontSize: 12.5, fontWeight: "700" },
  hfl: { color: "rgba(255,255,255,.75)", fontSize: 9, marginTop: 1 },
  hpay: { marginTop: 12, backgroundColor: "#F0C441", borderRadius: 9, paddingVertical: 10,
          alignItems: "center" },
  hpayText: { color: "#1E2660", fontWeight: "800", fontSize: 13 },
  quickgrid: { flexDirection: "row", gap: 8, marginVertical: 12 },
  qa: { flex: 1, backgroundColor: "#fff", borderColor: "#E1E5F2", borderWidth: 1,
        borderRadius: 12, paddingVertical: 10, alignItems: "center" },
  qi: { fontSize: 19 },
  qt: { fontSize: 8.8, color: "#556", fontWeight: "600", marginTop: 3 },
  strip: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff",
           borderColor: "#E1E5F2", borderWidth: 1, borderRadius: 10, padding: 10,
           marginBottom: 12 },
  sico: { fontSize: 15 },
  stxt: { flex: 1, fontSize: 10.8, color: "#556", lineHeight: 15 },
  smore: { fontSize: 14, color: "#3F51B5", fontWeight: "700" },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 10,
          borderWidth: 1, borderColor: "#E1E5F2" },
  loanNo: { fontFamily: "monospace", color: "#666", fontSize: 12 },
  mid: { fontSize: 21, fontWeight: "800", color: "#1E2660", marginTop: 2 },
  facts: { flexDirection: "row", gap: 16, marginTop: 8 },
  fact: { flex: 1 },
  factV: { fontSize: 14, fontWeight: "700" },
  label: { fontSize: 10.5, color: "#888" },
  payBtn: { backgroundColor: "#3F51B5", borderRadius: 8, paddingVertical: 10,
            alignItems: "center", marginTop: 10 },
  payText: { color: "#fff", fontWeight: "700" },
  empty: { color: "#888", textAlign: "center", marginTop: 24 },
});
