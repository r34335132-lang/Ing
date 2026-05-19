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

// ─────────────────────────────────────────────────────────────────────────────
// Blocked overlay — shown when formula.needsReview=true and result is blocked
// ─────────────────────────────────────────────────────────────────────────────
function BlockedResult({ messages }: { messages: string[] }) {
  const colors = useColors();
  return (
    <View style={[styles.blocked, { backgroundColor: "#F59E0B18", borderColor: "#F59E0B" }]}>
      <View style={styles.blockedHeader}>
        <Ionicons name="lock-closed" size={22} color="#F59E0B" />
        <Text style={[styles.blockedTitle, { color: "#F59E0B" }]}>
          RESULTADO BLOQUEADO — Fórmula pendiente de validar
        </Text>
      </View>
      {messages.map((m, i) => (
        <Text key={i} style={[styles.blockedMsg, { color: colors.mutedForeground }]}>
          {m}
        </Text>
      ))}
      <View style={[styles.blockedNote, { backgroundColor: colors.card }]}>
        <Text style={[styles.blockedNoteText, { color: colors.foreground }]}>
          Para desbloquear: extraer fórmulas exactas del archivo Excel fuente, implementar en{" "}
          <Text style={{ fontFamily: "Inter_600SemiBold" }}>engine/formulaRegistry.ts</Text> y
          cambiar{" "}
          <Text style={{ fontFamily: "Inter_600SemiBold" }}>needsReview: false</Text>.
        </Text>
      </View>
    </View>
  );
}

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

    // Only haptic success for non-blocked, no-error results
    if (res.errors.length === 0 && !res.blocked && Platform.OS !== "web") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleSave = async () => {
    if (!result || !formula || result.blocked) return;
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
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.mutedForeground} />
        <Text style={[styles.notFoundText, { color: colors.foreground }]}>Calculadora no encontrada</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backLink, { color: colors.primary }]}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const allFilled = formula.inputs.every((inp) => {
    if (!inp.required) return true;
    return (inputs[inp.key] ?? "").trim() !== "";
  });

  const showResult = result && result.errors.length === 0;
  const isBlocked = showResult && result.blocked === true;

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
        {/* Nav */}
        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name="arrow-back" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleReset}
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name="refresh" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View style={styles.headerBlock}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.foreground }]}>{formula.name}</Text>
            {formula.needsReview && (
              <View style={[styles.reviewBadge, { backgroundColor: "#F59E0B22" }]}>
                <Text style={[styles.reviewText, { color: "#F59E0B" }]}>PENDIENTE</Text>
              </View>
            )}
          </View>
          <Text style={[styles.category, { color: colors.primary }]}>{formula.category}</Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>{formula.description}</Text>
        </View>

        {/* Formula reference card */}
        <View style={[styles.refCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.refLabel, { color: colors.mutedForeground }]}>FÓRMULA BASE</Text>
          <Text style={[styles.refFormula, { color: colors.accent }]}>{formula.formulaText}</Text>
          {formula.references && formula.references.length > 0 && (
            <Text style={[styles.refSource, { color: colors.mutedForeground }]}>
              Fuente: {formula.references.join(" · ")}
            </Text>
          )}
        </View>

        {/* Inputs */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DATOS DE ENTRADA</Text>

        {formula.inputs.map((inp) => {
          const hasValue = (inputs[inp.key] ?? "").trim() !== "";
          return (
            <View
              key={inp.key}
              style={[
                styles.inputCard,
                {
                  backgroundColor: colors.card,
                  borderColor: hasValue ? colors.primary + "88" : colors.border,
                },
              ]}
            >
              <View style={styles.inputHeader}>
                <Text style={[styles.inputLabel, { color: colors.foreground }]}>{inp.label}</Text>
                <View style={[styles.unitChip, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.unitText, { color: colors.accent }]}>{inp.unit}</Text>
                </View>
              </View>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    color: colors.foreground,
                    borderColor: hasValue ? colors.primary : colors.border,
                    backgroundColor: colors.input,
                  },
                ]}
                value={inputs[inp.key] ?? ""}
                onChangeText={(v) => handleChange(inp.key, v)}
                keyboardType="decimal-pad"
                placeholder={inp.placeholder ?? `Ingresa ${inp.label.toLowerCase()}`}
                placeholderTextColor={colors.mutedForeground}
                returnKeyType="done"
              />
              {(inp.min !== undefined || inp.max !== undefined) && (
                <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                  {inp.min !== undefined && inp.max !== undefined
                    ? `Rango: ${inp.min} – ${inp.max} ${inp.unit}`
                    : inp.min !== undefined
                    ? `Mínimo: ${inp.min} ${inp.unit}`
                    : `Máximo: ${inp.max} ${inp.unit}`}
                </Text>
              )}
            </View>
          );
        })}

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
          <Text
            style={[
              styles.calcBtnText,
              { color: allFilled ? colors.primaryForeground : colors.mutedForeground },
            ]}
          >
            Calcular
          </Text>
        </TouchableOpacity>

        {/* Errors + warnings */}
        {result && (result.errors.length > 0 || result.warnings.length > 0) && (
          <WarningBox
            warnings={result.warnings}
            errors={result.errors}
          />
        )}

        {/* Blocked result */}
        {showResult && isBlocked && (
          <BlockedResult messages={result.warnings} />
        )}

        {/* Valid result */}
        {showResult && !isBlocked && (
          <>
            <ResultCard result={result} onSave={!saved ? handleSave : undefined} />
            {saved && (
              <View
                style={[
                  styles.savedBanner,
                  { backgroundColor: colors.accent + "22", borderColor: colors.accent },
                ]}
              >
                <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                <Text style={[styles.savedText, { color: colors.accent }]}>
                  Guardado en historial
                </Text>
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
  backLink: { fontSize: 15, fontFamily: "Inter_500Medium" },
  navRow: { flexDirection: "row", justifyContent: "space-between" },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  headerBlock: { gap: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.4, flex: 1 },
  reviewBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  reviewText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  category: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  description: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, marginTop: 4 },
  refCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 6 },
  refLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1.2 },
  refFormula: { fontSize: 13, fontFamily: "Inter_500Medium", fontStyle: "italic" },
  refSource: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1.2 },
  inputCard: { borderRadius: 12, borderWidth: 1.5, padding: 14, gap: 10 },
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
  // Blocked overlay
  blocked: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 20,
    gap: 12,
  },
  blockedHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  blockedTitle: { fontSize: 13, fontFamily: "Inter_700Bold", flex: 1, lineHeight: 18 },
  blockedMsg: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  blockedNote: { borderRadius: 8, padding: 12, marginTop: 4 },
  blockedNoteText: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  // Saved banner
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
