/* Field map (PLANNING/08 A4) — task pins on a schematic board. Pure RN
 * (no native map dependency): pins are plotted by normalizing borrower
 * coordinates into the board; native tiles (react-native-maps) land with
 * the EAS build. Tasks without a pin list below with a geocode hint.
 */
import * as React from "react";
import { View, Text, FlatList, StyleSheet, Pressable, type ViewStyle } from "react-native";
import { useLang } from "../i18n/LangProvider";
import { t } from "../i18n/strings";
import { fetchFieldTasks, type FieldTaskView } from "../api/client";

const BD = { minLat: 20.5, maxLat: 26.7, minLng: 88.0, maxLng: 92.7 };   // Bangladesh bbox

export function MapScreen() {
  const lang = useLang();
  const [tasks, setTasks] = React.useState<FieldTaskView[]>([]);
  React.useEffect(() => {
    void fetchFieldTasks(null).then(setTasks).catch(() => setTasks([]));
  }, []);

  const pinned = tasks.filter((x) => x.lat != null && x.lng != null && x.status === "OPEN");
  const unpinned = tasks.filter((x) => x.lat == null || x.lng == null);

  const pos = (lat: number, lng: number): ViewStyle => ({
    top: `${(1 - (lat - BD.minLat) / (BD.maxLat - BD.minLat)) * 100}%` as unknown as ViewStyle["top"],
    left: `${((lng - BD.minLng) / (BD.maxLng - BD.minLng)) * 100}%` as unknown as ViewStyle["left"],
  });

  return (
    <View style={s.page}>
      <Text style={s.h1}>{t(lang, "map.title")}</Text>
      <View style={s.board}>
        {/* schematic graticule — honest placeholder for native tiles */}
        {[25, 50, 75].map((p) => <View key={"h" + p} style={[s.gridH, { top: `${p}%` as unknown as ViewStyle["top"] }]} />)}
        {[25, 50, 75].map((p) => <View key={"v" + p} style={[s.gridV, { left: `${p}%` as unknown as ViewStyle["left"] }]} />)}
        {pinned.map((x) => (
          <View key={x.id} style={[s.pin, pos(x.lat as number, x.lng as number)]}>
            <Text style={s.pinText}>{(x as any).loanNo?.slice(3, 8) ?? "•"}</Text>
          </View>
        ))}
        {pinned.length === 0 && (
          <Text style={s.empty}>{t(lang, "map.noPins")}</Text>
        )}
      </View>
      <Text style={s.hint}>{t(lang, "map.schematicNote")}</Text>
      {unpinned.length > 0 && (
        <>
          <Text style={s.h2}>{t(lang, "map.unpinned")}</Text>
          <FlatList
            data={unpinned}
            keyExtractor={(x) => x.id}
            renderItem={({ item }) => (
              <Pressable style={s.row}>
                <Text style={s.loanNo}>{(item as any).loanNo ?? item.id.slice(0, 8)}</Text>
                <Text style={s.due}>{t(lang, "map.needsGeo")}</Text>
              </Pressable>
            )}
          />
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, padding: 16, gap: 8, backgroundColor: "#fff" },
  h1: { fontSize: 22, fontWeight: "700" },
  h2: { fontSize: 15, fontWeight: "600", marginTop: 6 },
  board: { height: 260, borderWidth: 1, borderColor: "#c9cede", borderRadius: 10,
           backgroundColor: "#F7F8FC", overflow: "hidden" },
  gridH: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: "#E1E5F2" },
  gridV: { position: "absolute", top: 0, bottom: 0, width: 1, backgroundColor: "#E1E5F2" },
  pin: { position: "absolute", width: 34, height: 34, marginLeft: -17, marginTop: -34,
         borderRadius: 17, backgroundColor: "#C50F1F", alignItems: "center",
         justifyContent: "center" },
  pinText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  empty: { position: "absolute", alignSelf: "center", top: "48%", color: "#888" },
  hint: { fontSize: 11, color: "#777" },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8,
         borderBottomWidth: 1, borderBottomColor: "#eee" },
  loanNo: { fontFamily: "monospace", fontWeight: "600" },
  due: { fontSize: 12, color: "#996a00" },
});
