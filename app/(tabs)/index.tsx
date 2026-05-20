import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useHistory } from "@/context/HistoryContext";
import { getAllFormulas, getAllCategories } from "@/engine/formulaRegistry";

const QUICK_ACCESS = ["pipe-volume", "annular-volume", "fluid-velocity", "annular-velocity"];

const ICON_MAP: Record<string, React.ComponentProps<typeof MaterialCommunityIcons>["name"]> = {
  pipe: "pipe",
  circle: "circle-double",
  speedometer: "speedometer",
  "speedometer-outline": "speedometer-medium",
  "reload-circle": "reload",
  water: "water-pump",
  converter: "swap-horizontal",
};

const CATEGORY_COLORS: Record<string, string> = {
  "Tuberías": "#0078C8",
  "Hidráulica": "#00C896",
  "Coiled Tubing": "#8B5CF6",
  "Bridas": "#F59E0B",
};

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { entries } = useHistory();
  const allFormulas = getAllFormulas();
  const categories = getAllCategories();

  const quickFormulas = useMemo(
    () => QUICK_ACCESS.map((id) => allFormulas.find((f) => f.id === id)).filter(Boolean),
    [allFormulas]
  );

  const recentEntries = entries.slice(0, 3);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: insets.bottom + 90 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Bienvenido</Text>
          <Text style={[styles.appName, { color: colors.foreground }]}>ING Camacho</Text>
        </View>
        <View style={[styles.logo, { backgroundColor: colors.primary + "22" }]}>
          <MaterialCommunityIcons name="oil-temperature" size={28} color={colors.primary} />
        </View>
      </View>

      {/* Stats bar */}
      <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>{allFormulas.length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Calculadoras</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>{categories.length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Categorías</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>{entries.length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Cálculos</Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/calculators" as never)}
          style={[styles.actionBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="calculator-variant" size={20} color={colors.primaryForeground} />
          <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>Nueva Medición</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/history" as never)}
          style={[styles.actionBtnOutline, { borderColor: colors.border, backgroundColor: colors.card }]}
          activeOpacity={0.8}
        >
          <Ionicons name="time-outline" size={20} color={colors.foreground} />
          <Text style={[styles.actionBtnText, { color: colors.foreground }]}>Historial</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Access */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Acceso Rápido</Text>
      <View style={styles.quickGrid}>
        {quickFormulas.map((f) => {
          if (!f) return null;
          const accent = CATEGORY_COLORS[f.category] ?? colors.primary;
          return (
            <TouchableOpacity
              key={f.id}
              onPress={() => router.push(`/calculator/${f.id}` as never)}
              style={[styles.quickCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.75}
            >
              <View style={[styles.quickIcon, { backgroundColor: accent + "22" }]}>
                <MaterialCommunityIcons name={ICON_MAP[f.icon] ?? "calculator"} size={24} color={accent} />
              </View>
              <Text style={[styles.quickName, { color: colors.foreground }]} numberOfLines={2}>{f.name}</Text>
              <Text style={[styles.quickCat, { color: accent }]}>{f.category}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Recent calculations */}
      {recentEntries.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recientes</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/history" as never)}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>Ver todo</Text>
            </TouchableOpacity>
          </View>
          {recentEntries.map((entry) => {
            const accent = CATEGORY_COLORS[entry.category] ?? colors.primary;
            const fmtVal = entry.result >= 10000
              ? entry.result.toLocaleString("en-US", { maximumFractionDigits: 2 })
              : entry.result.toLocaleString("en-US", { maximumFractionDigits: 4 });
            return (
              <TouchableOpacity
                key={entry.id}
                onPress={() => router.push(`/calculator/${entry.formulaId}` as never)}
                style={[styles.recentRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.75}
              >
                <View style={[styles.recentDot, { backgroundColor: accent }]} />
                <View style={styles.recentBody}>
                  <Text style={[styles.recentName, { color: colors.foreground }]}>{entry.formulaName}</Text>
                  <Text style={[styles.recentMeta, { color: colors.mutedForeground }]}>
                    {new Date(entry.timestamp).toLocaleDateString("es-MX")}
                  </Text>
                </View>
                <Text style={[styles.recentValue, { color: accent }]}>
                  {fmtVal} <Text style={[styles.recentUnit, { color: colors.mutedForeground }]}>{entry.unit}</Text>
                </Text>
              </TouchableOpacity>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular" },
  appName: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  logo: { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  statsRow: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    justifyContent: "space-around",
  },
  stat: { alignItems: "center", gap: 2 },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  statDivider: { width: 1, height: "100%" },
  actionRow: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionBtnOutline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  actionBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  seeAll: { fontSize: 13, fontFamily: "Inter_500Medium" },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quickCard: {
    width: "48%",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  quickIcon: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  quickName: { fontSize: 13, fontFamily: "Inter_600SemiBold", lineHeight: 18 },
  quickCat: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  recentDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  recentBody: { flex: 1 },
  recentName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  recentMeta: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  recentValue: { fontSize: 15, fontFamily: "Inter_700Bold" },
  recentUnit: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
