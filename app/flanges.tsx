import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { SearchBar } from "@/components/SearchBar";
import flangeData from "@/data/flangeTables.json";

type FlangeEntry = {
  nominalSize: string;
  pressurePsi: number;
  standardRing: string;
  pressureEnergizedRing: string;
  ringGrooveId: string;
  ringGrooveOd: string;
  ringWidth: string;
  ringPd: string;
  ringDepth: string;
  boreId: string;
  faceRecess: string;
  recessOd: string;
  noBolts: string;
  studBolt: string;
  tapEndStud: string;
  wrenchSize: string;
  torqueFtLbs: string;
  needsReview?: boolean;
};

const PRESSURES = [2000, 3000, 5000, 10000, 15000, 20000];
const PRESSURE_COLORS: Record<number, string> = {
  2000: "#22C55E",
  3000: "#3BA8E8",
  5000: "#F59E0B",
  10000: "#EF4444",
  15000: "#8B5CF6",
  20000: "#EC4899",
};

interface FieldRowProps {
  label: string;
  value: string;
  mono?: boolean;
}
function FieldRow({ label, value, mono }: FieldRowProps) {
  const colors = useColors();
  return (
    <View style={[styles.fieldRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.fieldValue, { color: colors.foreground, fontFamily: mono ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
        {value || "—"}
      </Text>
    </View>
  );
}

function FlangeCard({ entry }: { entry: FlangeEntry }) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);
  const accent = PRESSURE_COLORS[entry.pressurePsi] ?? colors.primary;

  return (
    <TouchableOpacity
      onPress={() => setExpanded((v) => !v)}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.8}
    >
      {/* Card header */}
      <View style={styles.cardHeader}>
        <View style={[styles.sizeChip, { backgroundColor: accent + "22" }]}>
          <Text style={[styles.sizeText, { color: accent }]}>{entry.nominalSize}"</Text>
        </View>
        <View style={styles.cardMeta}>
          <Text style={[styles.pressure, { color: colors.foreground }]}>
            {entry.pressurePsi.toLocaleString()} psi
          </Text>
          <View style={styles.tags}>
            <View style={[styles.tag, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.tagText, { color: colors.mutedForeground }]}>
                Ring: {entry.standardRing || "—"}
              </Text>
            </View>
            <View style={[styles.tag, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.tagText, { color: colors.mutedForeground }]}>
                {entry.noBolts} bolts × {entry.studBolt}"
              </Text>
            </View>
            {entry.needsReview && (
              <View style={[styles.tag, { backgroundColor: "#F59E0B22" }]}>
                <Text style={[styles.tagText, { color: "#F59E0B" }]}>REVISAR</Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.mutedForeground}
        />
      </View>

      {/* Expanded detail */}
      {expanded && (
        <View style={[styles.detail, { borderTopColor: colors.border }]}>
          <Text style={[styles.detailSection, { color: colors.mutedForeground }]}>RING / GASKET</Text>
          <FieldRow label="Ring estándar" value={entry.standardRing} mono />
          <FieldRow label="Ring presurizado" value={entry.pressureEnergizedRing} mono />
          <FieldRow label="Ring Groove ID" value={entry.ringGrooveId ? `${entry.ringGrooveId} in` : ""} mono />
          <FieldRow label="Ring Groove OD" value={entry.ringGrooveOd ? `${entry.ringGrooveOd} in` : ""} mono />
          <FieldRow label="Ring Width" value={entry.ringWidth ? `${entry.ringWidth} in` : ""} mono />
          <FieldRow label="Ring PD" value={entry.ringPd ? `${entry.ringPd} in` : ""} mono />
          <FieldRow label="Ring Depth" value={entry.ringDepth ? `${entry.ringDepth} in` : ""} mono />

          <Text style={[styles.detailSection, { color: colors.mutedForeground, marginTop: 8 }]}>BRIDA</Text>
          <FieldRow label="Bore ID" value={entry.boreId ? `${entry.boreId} in` : ""} mono />
          <FieldRow label="Face Recess" value={entry.faceRecess ? `${entry.faceRecess} in` : ""} mono />
          <FieldRow label="Recess OD" value={entry.recessOd ? `${entry.recessOd} in` : ""} mono />

          <Text style={[styles.detailSection, { color: colors.mutedForeground, marginTop: 8 }]}>PERNOS</Text>
          <FieldRow label="Número de bolts" value={entry.noBolts} mono />
          <FieldRow label="Stud bolt" value={entry.studBolt ? `${entry.studBolt} in` : ""} mono />
          <FieldRow label="Tap end stud" value={entry.tapEndStud} mono />
          <FieldRow label="Wrench size" value={entry.wrenchSize ? `${entry.wrenchSize} in` : ""} mono />
          <FieldRow label="Torque" value={entry.torqueFtLbs ? `${entry.torqueFtLbs} ft·lb` : ""} mono />

          {entry.needsReview && (
            <View style={[styles.reviewNote, { backgroundColor: "#F59E0B18", borderColor: "#F59E0B" }]}>
              <Ionicons name="warning" size={14} color="#F59E0B" />
              <Text style={[styles.reviewNoteText, { color: "#F59E0B" }]}>
                Datos pendientes de verificar contra bridas flange-ref.xls
              </Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function FlangesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [selectedPressure, setSelectedPressure] = useState<number | null>(null);

  const allFlanges = flangeData.flanges as FlangeEntry[];

  const filtered = useMemo(() => {
    return allFlanges.filter((f) => {
      const matchSize = query.trim()
        ? f.nominalSize.toLowerCase().includes(query.toLowerCase()) ||
          f.standardRing.toLowerCase().includes(query.toLowerCase())
        : true;
      const matchPressure = selectedPressure ? f.pressurePsi === selectedPressure : true;
      return matchSize && matchPressure;
    });
  }, [query, selectedPressure, allFlanges]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList<FlangeEntry>
        data={filtered}
        keyExtractor={(item) => `${item.nominalSize}-${item.pressurePsi}`}
        contentContainerStyle={{
          paddingTop: topPad + 16,
          paddingBottom: insets.bottom + 30,
          paddingHorizontal: 20,
          gap: 10,
          flexGrow: 1,
        }}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {/* Nav */}
            <View style={styles.navRow}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Ionicons name="arrow-back" size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.title, { color: colors.foreground }]}>Bridas / Flanges</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {allFlanges.length} entradas · API 6A / ASME B16.5
            </Text>

            {/* Data source note */}
            <View style={[styles.sourceNote, { backgroundColor: "#F59E0B18", borderColor: "#F59E0B" }]}>
              <Ionicons name="information-circle" size={16} color="#F59E0B" />
              <Text style={[styles.sourceText, { color: "#F59E0B" }]}>
                Datos de referencia API 6A. Verificar contra bridas flange-ref.xls antes de uso operacional.
              </Text>
            </View>

            {/* Search */}
            <SearchBar value={query} onChangeText={setQuery} placeholder="Buscar por tamaño o ring..." />

            {/* Pressure filter */}
            <View style={styles.filterRow}>
              <TouchableOpacity
                onPress={() => setSelectedPressure(null)}
                style={[
                  styles.filterBtn,
                  {
                    backgroundColor: selectedPressure === null ? colors.primary : colors.card,
                    borderColor: selectedPressure === null ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.filterText, { color: selectedPressure === null ? colors.primaryForeground : colors.mutedForeground }]}>
                  Todos
                </Text>
              </TouchableOpacity>
              {PRESSURES.filter((p) => allFlanges.some((f) => f.pressurePsi === p)).map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setSelectedPressure(selectedPressure === p ? null : p)}
                  style={[
                    styles.filterBtn,
                    {
                      backgroundColor: selectedPressure === p ? PRESSURE_COLORS[p] : colors.card,
                      borderColor: selectedPressure === p ? PRESSURE_COLORS[p] : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.filterText, { color: selectedPressure === p ? "#fff" : colors.mutedForeground }]}>
                    {(p / 1000).toFixed(0)}k
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.countText, { color: colors.mutedForeground }]}>
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
            </Text>
          </View>
        }
        renderItem={({ item }) => <FlangeCard entry={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="pipe-wrench" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Sin resultados para "{query}"
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  listHeader: { gap: 12, marginBottom: 4 },
  navRow: { marginBottom: 4 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular" },
  sourceNote: {
    flexDirection: "row",
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  sourceText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 17 },
  filterRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1,
  },
  filterText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  countText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  card: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  sizeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    minWidth: 56,
    alignItems: "center",
  },
  sizeText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  cardMeta: { flex: 1, gap: 4 },
  pressure: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  tags: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  tagText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  detail: { borderTopWidth: 1, padding: 14, gap: 0 },
  detailSection: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
    marginBottom: 4,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  fieldValue: { fontSize: 13, textAlign: "right" },
  reviewNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
  },
  reviewNoteText: { fontSize: 11, fontFamily: "Inter_400Regular", flex: 1 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});
