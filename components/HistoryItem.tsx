import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { HistoryEntry } from "@/context/HistoryContext";

interface HistoryItemProps {
  entry: HistoryEntry;
  onToggleFavorite: () => void;
  onDelete: () => void;
  onRepeat: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Tuberías": "#0078C8",
  "Hidráulica": "#00C896",
  "Coiled Tubing": "#8B5CF6",
  "Bridas": "#F59E0B",
  "Conversiones": "#EC4899",
};

export function HistoryItem({ entry, onToggleFavorite, onDelete, onRepeat }: HistoryItemProps) {
  const colors = useColors();
  const accent = CATEGORY_COLORS[entry.category] ?? colors.primary;

  const handlePress = async () => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/calculator/${entry.formulaId}` as never);
  };

  const formattedValue = entry.result >= 10000
    ? entry.result.toLocaleString("en-US", { maximumFractionDigits: 2 })
    : entry.result.toLocaleString("en-US", { maximumFractionDigits: 4 });

  const date = new Date(entry.timestamp);
  const dateStr = date.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
  const timeStr = date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.75}
    >
      <View style={[styles.accentBar, { backgroundColor: accent }]} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{entry.formulaName}</Text>
          <TouchableOpacity onPress={onToggleFavorite} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name={entry.favorite ? "bookmark" : "bookmark-outline"} size={18} color={entry.favorite ? colors.accent : colors.mutedForeground} />
          </TouchableOpacity>
        </View>
        <View style={styles.resultRow}>
          <Text style={[styles.resultValue, { color: accent }]}>{formattedValue}</Text>
          <Text style={[styles.resultUnit, { color: colors.mutedForeground }]}>{entry.unit}</Text>
        </View>
        <View style={styles.bottomRow}>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>{dateStr} · {timeStr}</Text>
          <View style={styles.actions}>
            <TouchableOpacity onPress={onRepeat} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <MaterialCommunityIcons name="repeat" size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Ionicons name="trash-outline" size={16} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  accentBar: {
    width: 4,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  body: {
    flex: 1,
    padding: 14,
    gap: 4,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
    marginRight: 8,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  resultValue: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  resultUnit: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  meta: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  actions: {
    flexDirection: "row",
    gap: 16,
  },
});
