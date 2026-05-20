// ═════════════════════════════════════════════════════════════════════════════
// OilCalc Pro — Calculation Engine
// Wraps formula execution with guards against NaN, Infinity, and exceptions.
// Prioritizes input validation errors over needsReview "blocked" state.
// ═════════════════════════════════════════════════════════════════════════════

import { getFormulaById, type CalculationResult } from "./formulaRegistry";

export interface EngineRequest {
  formulaId: string;
  inputs: Record<string, number | string>;
}

export function runCalculation(req: EngineRequest): CalculationResult {
  const formula = getFormulaById(req.formulaId);

  if (!formula) {
    return {
      value: 0,
      unit: "",
      formulaId: req.formulaId,
      formulaName: "Desconocida",
      inputs: req.inputs,
      steps: [],
      warnings: [],
      errors: [`Fórmula no encontrada: ${req.formulaId}`],
      timestamp: new Date().toISOString(),
      blocked: false
    };
  }

  // 1. Sanitizar y validar inputs numéricos finitos
  const sanitizedInputs: Record<string, number | string> = {};
  for (const [key, val] of Object.entries(req.inputs)) {
    if (typeof val === "number") {
      if (!isFinite(val) || isNaN(val)) {
        return {
          value: 0,
          unit: formula.output.unit,
          formulaId: formula.id,
          formulaName: formula.name,
          inputs: req.inputs,
          steps: [],
          warnings: [],
          errors: [`El campo "${key}" contiene un valor no numérico o inválido.`],
          timestamp: new Date().toISOString(),
          blocked: false
        };
      }
      sanitizedInputs[key] = val;
    } else {
      sanitizedInputs[key] = val;
    }
  }

  let partial: Omit<CalculationResult, "formulaId" | "formulaName" | "timestamp">;

  // 2. Ejecutar la fórmula
  try {
    partial = formula.calculate(sanitizedInputs);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      value: 0,
      unit: formula.output.unit,
      formulaId: formula.id,
      formulaName: formula.name,
      inputs: req.inputs,
      steps: [],
      warnings: [],
      errors: [`Error interno en el cálculo: ${message}`],
      timestamp: new Date().toISOString(),
      blocked: false
    };
  }

  // 3. Validar resultado finito
  if (!isFinite(partial.value) || isNaN(partial.value)) {
    return {
      ...partial,
      value: 0,
      formulaId: formula.id,
      formulaName: formula.name,
      errors: [...(partial.errors || []), "El resultado no es un número válido (NaN o Infinito). Revisar inputs."],
      timestamp: new Date().toISOString(),
      blocked: false
    };
  }

  // 4. LÓGICA DE PRIORIDAD: Errores vs Blocked
  const hasErrors = partial.errors && partial.errors.length > 0;

  if (hasErrors) {
    // Si hay errores de validación (inputs inválidos), se devuelven. 
    // No se enmascara con el estado "blocked".
    return {
      ...partial,
      value: 0,
      blocked: false,
      formulaId: formula.id,
      formulaName: formula.name,
      timestamp: new Date().toISOString(),
    };
  }

  // Si NO hay errores, verificamos si está en needsReview
  const isNeedsReview = formula.needsReview === true;
  const isExplicitlyBlocked = partial.blocked === true;
  const blocked = isNeedsReview || isExplicitlyBlocked;

  if (blocked) {
    const defaultWarning = "Fórmula pendiente de validar con archivo fuente. No usar para operación.";
    const warnings = partial.warnings || [];
    if (!warnings.includes(defaultWarning)) {
      warnings.push(defaultWarning);
    }

    return {
      ...partial,
      value: 0, // Forzar 0 en UI para evitar uso operacional accidental
      blocked: true,
      warnings,
      formulaId: formula.id,
      formulaName: formula.name,
      timestamp: new Date().toISOString(),
    };
  }

  return {
    ...partial,
    blocked: false,
    formulaId: formula.id,
    formulaName: formula.name,
    timestamp: new Date().toISOString(),
  };
}