import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface WarningBoxProps {
  warnings: string[];
  errors: string[];
}

export function WarningBox({ warnings, errors }: WarningBoxProps) {
  const colors = useColors();
  if (warnings.length === 0 && errors.length === 0) return null;

  return (
    <View style={styles.container}>
      {errors.map((e, i) => (
        <View key={`e-${i}`} style={[styles.row, { backgroundColor: colors.destructive + "22", borderColor: colors.destructive }]}>
          <Ionicons name="alert-circle" size={16} color={colors.destructive} style={styles.icon} />
          <Text style={[styles.text, { color: colors.destructive }]}>{e}</Text>
        </View>
      ))}
      {warnings.map((w, i) => (
        <View key={`w-${i}`} style={[styles.row, { backgroundColor: "#F59E0B22", borderColor: "#F59E0B" }]}>
          <Ionicons name="warning" size={16} color="#F59E0B" style={styles.icon} />
          <Text style={[styles.text, { color: "#F59E0B" }]}>{w}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  icon: { marginTop: 1 },
  text: { flex: 1, fontSize: 13, lineHeight: 18, fontFamily: "Inter_400Regular" },
});
