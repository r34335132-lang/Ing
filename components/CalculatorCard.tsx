import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";

const ICON_MAP: Record<string, React.ComponentProps<typeof MaterialCommunityIcons>["name"]> = {
  pipe: "pipe",
  circle: "circle-double",
  speedometer: "speedometer",
  "speedometer-outline": "speedometer-medium",
  "reload-circle": "reload",
  water: "water-pump",
  flange: "pipe-wrench",
  wrench: "wrench",
  converter: "swap-horizontal",
};

const CATEGORY_COLORS: Record<string, string> = {
  "Tuberías": "#0078C8",
  "Hidráulica": "#00C896",
  "Coiled Tubing": "#8B5CF6",
  "Bridas": "#F59E0B",
  "Conversiones": "#EC4899",
};

interface CalculatorCardProps {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  needsReview?: boolean;
}

export function CalculatorCard({ id, name, category, description, icon, needsReview }: CalculatorCardProps) {
  const colors = useColors();
  const accentColor = CATEGORY_COLORS[category] ?? colors.primary;

  const handlePress = async () => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/calculator/${id}` as never);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.75}
    >
      <View style={[styles.iconWrap, { backgroundColor: accentColor + "22" }]}>
        <MaterialCommunityIcons name={ICON_MAP[icon] ?? "calculator"} size={28} color={accentColor} />
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{name}</Text>
          {needsReview && (
            <View style={[styles.badge, { backgroundColor: "#F59E0B22" }]}>
              <Text style={[styles.badgeText, { color: "#F59E0B" }]}>REVISAR</Text>
            </View>
          )}
        </View>
        <Text style={[styles.category, { color: accentColor }]}>{category}</Text>
        <Text style={[styles.description, { color: colors.mutedForeground }]} numberOfLines={2}>{description}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
  },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  category: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
  },
});
