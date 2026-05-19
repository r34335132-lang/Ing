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
    };
  }

  // Guard against non-finite inputs
  const sanitizedInputs: Record<string, number | string> = {};
  for (const [key, val] of Object.entries(req.inputs)) {
    if (typeof val === "number") {
      if (!isFinite(val)) {
        return {
          value: 0,
          unit: formula.output.unit,
          formulaId: formula.id,
          formulaName: formula.name,
          inputs: req.inputs,
          steps: [],
          warnings: [],
          errors: [`El input "${key}" no es un número válido.`],
          timestamp: new Date().toISOString(),
        };
      }
      sanitizedInputs[key] = val;
    } else {
      sanitizedInputs[key] = val;
    }
  }

  try {
    const partial = formula.calculate(sanitizedInputs);

    // Guard result value
    if (!isFinite(partial.value) || isNaN(partial.value)) {
      return {
        ...partial,
        value: 0,
        formulaId: formula.id,
        formulaName: formula.name,
        errors: [...partial.errors, "El resultado no es un número válido (NaN o Infinito). Verificar inputs."],
        timestamp: new Date().toISOString(),
      };
    }

    return {
      ...partial,
      formulaId: formula.id,
      formulaName: formula.name,
      timestamp: new Date().toISOString(),
    };
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
    };
  }
}
