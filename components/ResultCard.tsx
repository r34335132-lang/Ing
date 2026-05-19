import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { CalculationResult } from "@/engine/formulaRegistry";

interface ResultCardProps {
  result: CalculationResult;
  onSave?: () => void;
}

export function ResultCard({ result, onSave }: ResultCardProps) {
  const colors = useColors();

  const handleCopy = async () => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const text = `${result.formulaName}: ${result.value} ${result.unit}`;
    await Clipboard.setStringAsync(text);
  };

  const formatted = result.value >= 10000
    ? result.value.toLocaleString("en-US", { maximumFractionDigits: 2 })
    : result.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });

  return (
    <View style={[styles.card, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "44" }]}>
      <View style={styles.header}>
        <View style={[styles.chip, { backgroundColor: colors.primary }]}>
          <Text style={[styles.chipText, { color: colors.primaryForeground }]}>RESULTADO</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={handleCopy} style={[styles.iconBtn, { backgroundColor: colors.card }]}>
            <Ionicons name="copy-outline" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
          {onSave && (
            <TouchableOpacity onPress={onSave} style={[styles.iconBtn, { backgroundColor: colors.accent }]}>
              <Ionicons name="bookmark" size={18} color={colors.accentForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.mainResult}>
        <Text style={[styles.value, { color: colors.foreground }]}>{formatted}</Text>
        <Text style={[styles.unit, { color: colors.primary }]}>{result.unit}</Text>
      </View>

      {result.additionalResults && result.additionalResults.length > 0 && (
        <View style={[styles.extras, { borderTopColor: colors.border }]}>
          {result.additionalResults.map((r, i) => (
            <View key={i} style={styles.extraRow}>
              <Text style={[styles.extraLabel, { color: colors.mutedForeground }]}>{r.label}</Text>
              <Text style={[styles.extraValue, { color: colors.foreground }]}>
                {r.value.toLocaleString("en-US", { maximumFractionDigits: 4 })} <Text style={{ color: colors.accent }}>{r.unit}</Text>
              </Text>
            </View>
          ))}
        </View>
      )}

      <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>
        {new Date(result.timestamp).toLocaleString("es-MX")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  chipText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.2,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  mainResult: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  value: {
    fontSize: 48,
    fontFamily: "Inter_700Bold",
    lineHeight: 52,
  },
  unit: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    paddingBottom: 6,
  },
  extras: {
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 8,
  },
  extraRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  extraLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  extraValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  timestamp: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
