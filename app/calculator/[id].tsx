import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useHistory } from "@/context/HistoryContext";
import { ResultCard } from "@/components/ResultCard";
import { FormulaSteps } from "@/components/FormulaSteps";
import { WarningBox } from "@/components/WarningBox";
import { getFormulaById, type CalculationResult } from "@/engine/formulaRegistry";
import { runCalculation } from "@/engine/calculationEngine";

export default function CalculatorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addEntry } = useHistory();

  const formula = useMemo(() => getFormulaById(id ?? ""), [id]);

  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [saved, setSaved] = useState(false);

  const handleChange = useCallback((key: string, val: string) => {
    setInputs((prev) => ({ ...prev, [key]: val }));
    setResult(null);
    setSaved(false);
  }, []);

  const handleCalculate = async () => {
    if (!formula) return;
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const numericInputs: Record<string, number | string> = {};
    for (const inp of formula.inputs) {
      const raw = inputs[inp.key] ?? "";
      if (inp.type === "number") {
        numericInputs[inp.key] = raw === "" ? NaN : parseFloat(raw);
      } else {
        numericInputs[inp.key] = raw;
      }
    }

    const res = runCalculation({ formulaId: formula.id, inputs: numericInputs });
    setResult(res);
    setSaved(false);

    if (res.errors.length === 0 && Platform.OS !== "web") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleSave = async () => {
    if (!result || !formula) return;
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await addEntry({
      formulaId: formula.id,
      formulaName: formula.name,
      category: formula.category,
      inputs: result.inputs,
      result: result.value,
      unit: result.unit,
      steps: result.steps,
      warnings: result.warnings,
      timestamp: result.timestamp,
    });
    setSaved(true);
  };

  const handleReset = () => {
    setInputs({});
    setResult(null);
    setSaved(false);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (!formula) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.foreground }]}>Calculadora no encontrada</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.back, { color: colors.primary }]}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const allFilled = formula.inputs.every((inp) => {
    if (!inp.required) return true;
    const val = inputs[inp.key] ?? "";
    return val.trim() !== "";
  });

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: topPad + 16,
          paddingBottom: insets.bottom + 90,
          paddingHorizontal: 20,
          gap: 16,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back + header */}
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="arrow-back" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleReset} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="refresh" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.foreground }]}>{formula.name}</Text>
            {formula.needsReview && (
              <View style={[styles.reviewBadge, { backgroundColor: "#F59E0B22" }]}>
                <Text style={[styles.reviewText, { color: "#F59E0B" }]}>REVISAR</Text>
              </View>
            )}
          </View>
          <Text style={[styles.category, { color: colors.primary }]}>{formula.category}</Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>{formula.description}</Text>
        </View>

        {/* Formula pill */}
        <View style={[styles.formulaPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.formulaLabel, { color: colors.mutedForeground }]}>FÓRMULA BASE</Text>
          <Text style={[styles.formulaText, { color: colors.accent }]}>{formula.formulaText}</Text>
          {formula.references && formula.references.length > 0 && (
            <Text style={[styles.refs, { color: colors.mutedForeground }]}>
              Fuente: {formula.references.join(" · ")}
            </Text>
          )}
        </View>

        {/* Inputs */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DATOS DE ENTRADA</Text>
        {formula.inputs.map((inp) => (
          <View key={inp.key} style={[styles.inputGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.inputHeader}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>{inp.label}</Text>
              <View style={[styles.unitChip, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.unitText, { color: colors.accent }]}>{inp.unit}</Text>
              </View>
            </View>
            <TextInput
              style={[styles.textInput, { color: colors.foreground, borderColor: inputs[inp.key] ? colors.primary : colors.border }]}
              value={inputs[inp.key] ?? ""}
              onChangeText={(v) => handleChange(inp.key, v)}
              keyboardType="decimal-pad"
              placeholder={inp.placeholder ?? `Ingresa ${inp.label.toLowerCase()}`}
              placeholderTextColor={colors.mutedForeground}
              returnKeyType="done"
            />
            {inp.min !== undefined && (
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                {inp.min !== undefined && inp.max !== undefined
                  ? `Rango: ${inp.min} – ${inp.max}`
                  : inp.min !== undefined
                  ? `Mínimo: ${inp.min}`
                  : ""}
              </Text>
            )}
          </View>
        ))}

        {/* Calculate button */}
        <TouchableOpacity
          onPress={handleCalculate}
          disabled={!allFilled}
          style={[
            styles.calcBtn,
            { backgroundColor: allFilled ? colors.primary : colors.secondary },
          ]}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="calculator-variant"
            size={20}
            color={allFilled ? colors.primaryForeground : colors.mutedForeground}
          />
          <Text style={[styles.calcBtnText, { color: allFilled ? colors.primaryForeground : colors.mutedForeground }]}>
            Calcular
          </Text>
        </TouchableOpacity>

        {/* Warnings / errors before result */}
        {result && (result.warnings.length > 0 || result.errors.length > 0) && (
          <WarningBox warnings={result.warnings} errors={result.errors} />
        )}

        {/* Result card */}
        {result && result.errors.length === 0 && (
          <>
            <ResultCard
              result={result}
              onSave={!saved ? handleSave : undefined}
            />
            {saved && (
              <View style={[styles.savedBanner, { backgroundColor: colors.accent + "22", borderColor: colors.accent }]}>
                <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                <Text style={[styles.savedText, { color: colors.accent }]}>Guardado en historial</Text>
              </View>
            )}
            <FormulaSteps steps={result.steps} formulaText={formula.formulaText} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  back: { fontSize: 15, fontFamily: "Inter_500Medium" },
  navRow: { flexDirection: "row", justifyContent: "space-between" },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.4, flex: 1 },
  reviewBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  reviewText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  category: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5, marginTop: 4 },
  description: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, marginTop: 6 },
  formulaPill: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  formulaLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1.2 },
  formulaText: { fontSize: 14, fontFamily: "Inter_500Medium", fontStyle: "italic" },
  refs: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1.2 },
  inputGroup: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  inputHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  inputLabel: { fontSize: 14, fontFamily: "Inter_500Medium", flex: 1 },
  unitChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  unitText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  textInput: {
    fontSize: 22,
    fontFamily: "Inter_600SemiBold",
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  hint: { fontSize: 11, fontFamily: "Inter_400Regular" },
  calcBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  calcBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  savedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  savedText: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
