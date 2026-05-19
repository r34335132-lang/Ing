import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface FormulaStepsProps {
  steps: string[];
  formulaText: string;
}

export function FormulaSteps({ steps, formulaText }: FormulaStepsProps) {
  const colors = useColors();
  if (steps.length === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.header, { color: colors.mutedForeground }]}>DESGLOSE DEL CÁLCULO</Text>
      <View style={[styles.formula, { backgroundColor: colors.secondary }]}>
        <Text style={[styles.formulaText, { color: colors.accent }]}>{formulaText}</Text>
      </View>
      {steps.map((step, i) => (
        <View key={i} style={styles.step}>
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.badgeText, { color: colors.primaryForeground }]}>{i + 1}</Text>
          </View>
          <Text style={[styles.stepText, { color: colors.foreground }]}>{step}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  header: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
  },
  formula: {
    padding: 10,
    borderRadius: 8,
  },
  formulaText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    fontStyle: "italic",
  },
  step: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
  },
});
