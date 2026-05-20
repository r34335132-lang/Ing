import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useHistory } from "@/context/HistoryContext";
import { getAllFormulas } from "@/engine/formulaRegistry";

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}

function SettingRow({ icon, label, value, onPress, danger }: SettingRowProps) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={[styles.row, { borderBottomColor: colors.border }]}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.rowLeft}>
        {icon}
        <Text style={[styles.rowLabel, { color: danger ? colors.destructive : colors.foreground }]}>{label}</Text>
      </View>
      {value ? (
        <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{value}</Text>
      ) : onPress ? (
        <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
      ) : null}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { entries, clearHistory } = useHistory();
  const allFormulas = getAllFormulas();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: insets.bottom + 90, paddingHorizontal: 20 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Configuración</Text>

      {/* App info */}
      <View style={[styles.appCard, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "33" }]}>
        <View style={[styles.appIcon, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="oil-temperature" size={32} color={colors.primaryForeground} />
        </View>
        <View>
          <Text style={[styles.appName, { color: colors.foreground }]}>ING Camacho</Text>
          <Text style={[styles.appVersion, { color: colors.mutedForeground }]}>v1.0.0 · Motor de cálculo técnico</Text>
        </View>
      </View>

      {/* Stats */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ESTADÍSTICAS</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SettingRow
          icon={<MaterialCommunityIcons name="calculator-variant" size={20} color={colors.primary} />}
          label="Calculadoras disponibles"
          value={String(allFormulas.length)}
        />
        <SettingRow
          icon={<Ionicons name="time-outline" size={20} color={colors.primary} />}
          label="Cálculos en historial"
          value={String(entries.length)}
        />
        <SettingRow
          icon={<Ionicons name="bookmark-outline" size={20} color={colors.primary} />}
          label="Favoritos guardados"
          value={String(entries.filter((e) => e.favorite).length)}
        />
      </View>

      {/* Appearance */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>APARIENCIA</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SettingRow
          icon={<Ionicons name={colorScheme === "dark" ? "moon" : "sunny"} size={20} color={colors.accent} />}
          label="Tema"
          value={colorScheme === "dark" ? "Oscuro (sistema)" : "Claro (sistema)"}
        />
        <SettingRow
          icon={<Ionicons name="phone-portrait-outline" size={20} color={colors.accent} />}
          label="El tema sigue la configuración del dispositivo"
          value=""
        />
      </View>

      {/* Data */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DATOS</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SettingRow
          icon={<Ionicons name="cloud-offline-outline" size={20} color={colors.accent} />}
          label="Modo offline"
          value="Activo"
        />
        <SettingRow
          icon={<Ionicons name="save-outline" size={20} color={colors.accent} />}
          label="Almacenamiento"
          value="Local (AsyncStorage)"
        />
        <SettingRow
          icon={<Ionicons name="trash-outline" size={20} color={colors.destructive} />}
          label="Borrar historial"
          onPress={clearHistory}
          danger
        />
      </View>

      {/* Technical notes */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>NOTAS TÉCNICAS</Text>
      <View style={[styles.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.noteText, { color: colors.mutedForeground }]}>
          Las fórmulas marcadas como "REVISAR" son estimaciones que deben validarse contra los archivos Excel fuente
          (HIDRAULICA_RIVERO.xls, CoilTubingReelCapacitycalculator.xls, etc.) antes de su uso operacional.
        </Text>
        <Text style={[styles.noteText, { color: colors.mutedForeground, marginTop: 8 }]}>
          El motor de cálculo valida todos los inputs con Zod y evita divisiones entre cero, NaN e Infinity.
        </Text>
      </View>

      <Text style={[styles.footer, { color: colors.mutedForeground }]}>
        Ing Camacho · Motor de fórmulas técnicas para operaciones petroleras
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -0.5, marginBottom: 20 },
  appCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 24,
  },
  appIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: { fontSize: 18, fontFamily: "Inter_700Bold" },
  appVersion: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 4,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  rowLabel: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
  rowValue: { fontSize: 13, fontFamily: "Inter_500Medium" },
  noteCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  noteText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  footer: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 8, marginBottom: 8 },
});
