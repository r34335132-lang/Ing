// ═════════════════════════════════════════════════════════════════════════════
// OilCalc Pro — Formula Registry
// Source of truth for all formulas. UI is driven entirely from metadata here.
// To add a formula: append a new Formula object to the registry array at bottom.
// ═════════════════════════════════════════════════════════════════════════════

export interface FormulaInput {
  key: string;
  label: string;
  unit: string;
  type: "number" | "select";
  required: boolean;
  min?: number;
  max?: number;
  options?: string[];
  placeholder?: string;
}

export interface FormulaOutput {
  label: string;
  unit: string;
}

export interface FormulaTestCase {
  description: string;
  inputs: Record<string, number | string>;
  expectedValue: number;
  tolerance?: number; // relative (0-1), default 0.001 = 0.1%
}

export interface CalculationResult {
  value: number;
  unit: string;
  formulaId: string;
  formulaName: string;
  inputs: Record<string, number | string>;
  steps: string[];
  warnings: string[];
  errors: string[];
  timestamp: string;
  blocked?: boolean; // true when needsReview prevents showing result as valid
  additionalResults?: Array<{ label: string; value: number; unit: string }>;
}

export type CalcFn = (inputs: Record<string, number | string>) => Omit<CalculationResult, "formulaId" | "formulaName" | "timestamp">;

export interface Formula {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  inputs: FormulaInput[];
  output: FormulaOutput;
  formulaText: string;
  calculate: CalcFn;
  references?: string[];
  needsReview?: boolean;
  testCases?: FormulaTestCase[];
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. VOLUMEN INTERNO DE TUBERÍA
// Source: Bache ecologico.xls · CALCULO VOLUMEN TF.xls
// ─────────────────────────────────────────────────────────────────────────────
const pipeVolume: Formula = {
  id: "pipe-volume",
  name: "Volumen Interno de Tubería",
  category: "Tuberías",
  description: "Calcula el volumen interno de una tubería dado su diámetro interior y longitud.",
  icon: "pipe",
  inputs: [
    { key: "di", label: "Diámetro Interior (DI)", unit: "in", type: "number", required: true, min: 0.001, placeholder: "Ej: 1.8" },
    { key: "length_m", label: "Longitud", unit: "m", type: "number", required: true, min: 0.001, placeholder: "Ej: 1410" },
  ],
  output: { label: "Volumen Interno", unit: "bbl" },
  formulaText: "V(bbl) = (DI² / 1029.4) × (L(m) / 0.3048)",
  references: ["Bache ecologico.xls", "CALCULO VOLUMEN TF.xls"],
  needsReview: false,
  testCases: [
    {
      description: "DI=1.8in, L=1410m → ~14.567 bbl",
      inputs: { di: 1.8, length_m: 1410 },
      expectedValue: (1.8 * 1.8 / 1029.4) * (1410 / 0.3048),
      tolerance: 0.001,
    },
    {
      description: "DI=4.276in, L=1000m → validación cruzada",
      inputs: { di: 4.276, length_m: 1000 },
      expectedValue: (4.276 * 4.276 / 1029.4) * (1000 / 0.3048),
      tolerance: 0.001,
    },
  ],
  calculate(inputs) {
    const di = Number(inputs["di"]);
    const length_m = Number(inputs["length_m"]);
    const errors: string[] = [];
    const warnings: string[] = [];
    if (isNaN(di) || di <= 0) errors.push("El diámetro interior debe ser mayor que cero.");
    if (isNaN(length_m) || length_m <= 0) errors.push("La longitud debe ser mayor que cero.");
    if (errors.length > 0) return { value: 0, unit: "bbl", inputs, steps: [], warnings, errors };

    const length_ft = length_m / 0.3048;
    const capacity_bbl_per_ft = (di * di) / 1029.4;
    const vol_bbl = capacity_bbl_per_ft * length_ft;
    const vol_liters = vol_bbl * 158.987;
    const vol_m3 = vol_bbl * 0.158987;

    if (di > 24) warnings.push("Diámetro inusualmente grande. Verificar unidades.");
    if (length_m > 10000) warnings.push("Longitud mayor a 10,000 m. Verificar dato.");

    return {
      value: Math.round(vol_bbl * 10000) / 10000,
      unit: "bbl",
      inputs,
      steps: [
        `Longitud en pies: L(ft) = ${length_m} m ÷ 0.3048 = ${length_ft.toFixed(4)} ft`,
        `Capacidad por pie: C = DI² ÷ 1029.4 = ${di}² ÷ 1029.4 = ${capacity_bbl_per_ft.toFixed(7)} bbl/ft`,
        `Volumen total: V = ${capacity_bbl_per_ft.toFixed(7)} × ${length_ft.toFixed(4)} = ${vol_bbl.toFixed(4)} bbl`,
      ],
      warnings,
      errors: [],
      additionalResults: [
        { label: "Volumen", value: Math.round(vol_liters * 100) / 100, unit: "litros" },
        { label: "Volumen", value: Math.round(vol_m3 * 10000) / 10000, unit: "m³" },
        { label: "Longitud", value: Math.round(length_ft * 100) / 100, unit: "ft" },
      ],
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. VOLUMEN ANULAR
// Source: correjida calculo de t.p.,t.r. y espacio anular.xls
// ─────────────────────────────────────────────────────────────────────────────
const annularVolume: Formula = {
  id: "annular-volume",
  name: "Volumen Anular",
  category: "Tuberías",
  description: "Calcula el volumen anular entre agujero o TR y tubería de perforación/TF.",
  icon: "circle",
  inputs: [
    { key: "d_mayor", label: "Diámetro Mayor (agujero/TR)", unit: "in", type: "number", required: true, min: 0.001, placeholder: "Ej: 1.8" },
    { key: "d_menor", label: "Diámetro Menor (TP/TF)", unit: "in", type: "number", required: true, min: 0.001, placeholder: "Ej: 1.25" },
    { key: "length_m", label: "Longitud", unit: "m", type: "number", required: true, min: 0.001, placeholder: "Ej: 1410" },
  ],
  output: { label: "Volumen Anular", unit: "bbl" },
  formulaText: "V(bbl) = ((D_mayor² - D_menor²) / 1029.4) × (L(m) / 0.3048)",
  references: ["correjida calculo de t.p.,t.r. y espacio anular.xls"],
  needsReview: false,
  testCases: [
    {
      description: "D_mayor=1.8in, D_menor=1.25in, L=1410m",
      inputs: { d_mayor: 1.8, d_menor: 1.25, length_m: 1410 },
      expectedValue: ((1.8 * 1.8 - 1.25 * 1.25) / 1029.4) * (1410 / 0.3048),
      tolerance: 0.001,
    },
  ],
  calculate(inputs) {
    const d_mayor = Number(inputs["d_mayor"]);
    const d_menor = Number(inputs["d_menor"]);
    const length_m = Number(inputs["length_m"]);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (isNaN(d_mayor) || d_mayor <= 0) errors.push("El diámetro mayor debe ser mayor que cero.");
    if (isNaN(d_menor) || d_menor <= 0) errors.push("El diámetro menor debe ser mayor que cero.");
    if (!isNaN(d_mayor) && !isNaN(d_menor) && d_mayor <= d_menor) errors.push("D_mayor debe ser estrictamente mayor que D_menor.");
    if (isNaN(length_m) || length_m <= 0) errors.push("La longitud debe ser mayor que cero.");
    if (errors.length > 0) return { value: 0, unit: "bbl", inputs, steps: [], warnings, errors };

    const length_ft = length_m / 0.3048;
    const diff = d_mayor * d_mayor - d_menor * d_menor;
    const capacity = diff / 1029.4;
    const vol_bbl = capacity * length_ft;
    const vol_liters = vol_bbl * 158.987;
    const vol_m3 = vol_bbl * 0.158987;

    return {
      value: Math.round(vol_bbl * 10000) / 10000,
      unit: "bbl",
      inputs,
      steps: [
        `Longitud en pies: L(ft) = ${length_m} ÷ 0.3048 = ${length_ft.toFixed(4)} ft`,
        `Diferencia cuadrados: ${d_mayor}² - ${d_menor}² = ${(d_mayor * d_mayor).toFixed(6)} - ${(d_menor * d_menor).toFixed(6)} = ${diff.toFixed(6)} in²`,
        `Capacidad anular: C = ${diff.toFixed(6)} ÷ 1029.4 = ${capacity.toFixed(8)} bbl/ft`,
        `Volumen anular: V = ${capacity.toFixed(8)} × ${length_ft.toFixed(4)} = ${vol_bbl.toFixed(4)} bbl`,
      ],
      warnings,
      errors: [],
      additionalResults: [
        { label: "Volumen anular", value: Math.round(vol_liters * 100) / 100, unit: "litros" },
        { label: "Volumen anular", value: Math.round(vol_m3 * 10000) / 10000, unit: "m³" },
        { label: "Longitud", value: Math.round(length_ft * 100) / 100, unit: "ft" },
      ],
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. VELOCIDAD DE FLUIDO EN TUBERÍA
// Source: HIDRAULICA_RIVERO.xls · Hydraulics_IPM.xls
// ─────────────────────────────────────────────────────────────────────────────
const fluidVelocity: Formula = {
  id: "fluid-velocity",
  name: "Velocidad de Fluido en Tubería",
  category: "Hidráulica",
  description: "Calcula la velocidad del fluido dentro de la tubería dado el DI y el gasto de bombeo.",
  icon: "speedometer",
  inputs: [
    { key: "di", label: "Diámetro Interior (DI)", unit: "in", type: "number", required: true, min: 0.001, placeholder: "Ej: 2.441" },
    { key: "flow_bpm", label: "Gasto de Bombeo", unit: "BPM", type: "number", required: true, min: 0, placeholder: "Ej: 1.5" },
  ],
  output: { label: "Velocidad en Tubería", unit: "ft/min" },
  formulaText: "V(ft/min) = BPM / (DI² / 1029.4)",
  references: ["HIDRAULICA_RIVERO.xls", "Hydraulics_IPM.xls"],
  needsReview: false,
  testCases: [
    {
      description: "DI=2.441in, BPM=1.5",
      inputs: { di: 2.441, flow_bpm: 1.5 },
      expectedValue: 1.5 / ((2.441 * 2.441) / 1029.4),
      tolerance: 0.001,
    },
  ],
  calculate(inputs) {
    const di = Number(inputs["di"]);
    const flow_bpm = Number(inputs["flow_bpm"]);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (isNaN(di) || di <= 0) errors.push("El diámetro interior debe ser mayor que cero.");
    if (isNaN(flow_bpm) || flow_bpm < 0) errors.push("El gasto debe ser >= 0.");
    if (errors.length > 0) return { value: 0, unit: "ft/min", inputs, steps: [], warnings, errors };

    const capacity = (di * di) / 1029.4;
    const velocity_ft_min = flow_bpm / capacity;
    const velocity_m_min = velocity_ft_min * 0.3048;

    if (velocity_ft_min > 1000) warnings.push("Velocidad muy alta (>1000 ft/min). Riesgo de erosión.");
    if (velocity_ft_min < 10 && flow_bpm > 0) warnings.push("Velocidad baja (<10 ft/min). Puede ser insuficiente.");

    return {
      value: Math.round(velocity_ft_min * 100) / 100,
      unit: "ft/min",
      inputs,
      steps: [
        `Capacidad: C = DI² ÷ 1029.4 = ${di}² ÷ 1029.4 = ${capacity.toFixed(7)} bbl/ft`,
        `Velocidad: V = ${flow_bpm} BPM ÷ ${capacity.toFixed(7)} = ${velocity_ft_min.toFixed(4)} ft/min`,
      ],
      warnings,
      errors: [],
      additionalResults: [
        { label: "Velocidad", value: Math.round(velocity_m_min * 1000) / 1000, unit: "m/min" },
      ],
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. VELOCIDAD ANULAR
// Source: HIDRAULICA_RIVERO.xls · correjida calculo de t.p.,t.r. y espacio anular.xls
// ─────────────────────────────────────────────────────────────────────────────
const annularVelocity: Formula = {
  id: "annular-velocity",
  name: "Velocidad Anular",
  category: "Hidráulica",
  description: "Calcula la velocidad de retorno del fluido en el espacio anular. Mínimo recomendado: 100 ft/min.",
  icon: "speedometer-outline",
  inputs: [
    { key: "d_mayor", label: "Diámetro Mayor (agujero/TR)", unit: "in", type: "number", required: true, min: 0.001, placeholder: "Ej: 2.99" },
    { key: "d_menor", label: "Diámetro Menor (TP/TF)", unit: "in", type: "number", required: true, min: 0.001, placeholder: "Ej: 1.5" },
    { key: "flow_bpm", label: "Gasto de Bombeo", unit: "BPM", type: "number", required: true, min: 0, placeholder: "Ej: 1.5" },
  ],
  output: { label: "Velocidad Anular", unit: "ft/min" },
  formulaText: "VA(ft/min) = BPM / ((D_mayor² - D_menor²) / 1029.4)",
  references: ["HIDRAULICA_RIVERO.xls", "correjida calculo de t.p.,t.r. y espacio anular.xls"],
  needsReview: false,
  testCases: [
    {
      description: "D_mayor=2.99, D_menor=1.5, BPM=1.5",
      inputs: { d_mayor: 2.99, d_menor: 1.5, flow_bpm: 1.5 },
      expectedValue: 1.5 / ((2.99 * 2.99 - 1.5 * 1.5) / 1029.4),
      tolerance: 0.001,
    },
  ],
  calculate(inputs) {
    const d_mayor = Number(inputs["d_mayor"]);
    const d_menor = Number(inputs["d_menor"]);
    const flow_bpm = Number(inputs["flow_bpm"]);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (isNaN(d_mayor) || d_mayor <= 0) errors.push("El diámetro mayor debe ser mayor que cero.");
    if (isNaN(d_menor) || d_menor <= 0) errors.push("El diámetro menor debe ser mayor que cero.");
    if (!isNaN(d_mayor) && !isNaN(d_menor) && d_mayor <= d_menor) errors.push("D_mayor debe ser estrictamente mayor que D_menor.");
    if (isNaN(flow_bpm) || flow_bpm < 0) errors.push("El gasto debe ser >= 0.");
    if (errors.length > 0) return { value: 0, unit: "ft/min", inputs, steps: [], warnings, errors };

    const diff = d_mayor * d_mayor - d_menor * d_menor;
    const annular_capacity = diff / 1029.4;
    const velocity_ft_min = flow_bpm / annular_capacity;
    const velocity_m_min = velocity_ft_min * 0.3048;

    if (velocity_ft_min < 100) warnings.push("VA < 100 ft/min: puede ser insuficiente para acarreo de recortes.");
    if (velocity_ft_min > 500) warnings.push("VA > 500 ft/min: posible erosión y pérdidas de presión significativas.");

    return {
      value: Math.round(velocity_ft_min * 100) / 100,
      unit: "ft/min",
      inputs,
      steps: [
        `Diferencia cuadrados: ${d_mayor}² - ${d_menor}² = ${(d_mayor * d_mayor).toFixed(6)} - ${(d_menor * d_menor).toFixed(6)} = ${diff.toFixed(6)} in²`,
        `Capacidad anular: C = ${diff.toFixed(6)} ÷ 1029.4 = ${annular_capacity.toFixed(8)} bbl/ft`,
        `VA = ${flow_bpm} ÷ ${annular_capacity.toFixed(8)} = ${velocity_ft_min.toFixed(4)} ft/min`,
      ],
      warnings,
      errors: [],
      additionalResults: [
        { label: "Velocidad anular", value: Math.round(velocity_m_min * 1000) / 1000, unit: "m/min" },
      ],
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. DESPLAZAMIENTO DE TF (TUBERÍA FLEXIBLE / COILED TUBING)
// Source: CALCULO VOLUMEN TF.xls · Hoja VOLUMENES · Fórmula G28
// ─────────────────────────────────────────────────────────────────────────────
const tfDisplacement: Formula = {
  id: "tf-displacement",
  name: "Desplazamiento de TF",
  category: "Coiled Tubing",
  description: "Volumen interno de la TF (tubería flexible). Equivale al volumen de fluido que llena el interior del CT.",
  icon: "pipe",
  inputs: [
    { key: "od_tf_in", label: "OD de TF", unit: "in", type: "number", required: true, min: 0.001, placeholder: "Ej: 1.5" },
    { key: "length_m", label: "Longitud", unit: "m", type: "number", required: true, min: 0.001, placeholder: "Ej: 1800" },
  ],
  output: { label: "Desplazamiento de TF", unit: "bbl" },
  formulaText: "V(bbl) = (OD_TF² / 1029.4) × (L(m) / 0.3048)",
  references: ["CALCULO VOLUMEN TF.xls — Hoja VOLUMENES, fórmula G28"],
  needsReview: false,
  testCases: [
    {
      description: "OD=1.5in, L=1800m",
      inputs: { od_tf_in: 1.5, length_m: 1800 },
      expectedValue: (1.5 * 1.5 / 1029.4) * (1800 / 0.3048),
      tolerance: 0.001,
    },
  ],
  calculate(inputs) {
    const od = Number(inputs["od_tf_in"]);
    const length_m = Number(inputs["length_m"]);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (isNaN(od) || od <= 0) errors.push("OD de TF debe ser mayor que cero.");
    if (isNaN(length_m) || length_m <= 0) errors.push("Longitud debe ser mayor que cero.");
    if (errors.length > 0) return { value: 0, unit: "bbl", inputs, steps: [], warnings, errors };

    const length_ft = length_m / 0.3048;
    const capacity = (od * od) / 1029.4;
    const vol_bbl = capacity * length_ft;
    const vol_liters = vol_bbl * 158.987;
    const vol_m3 = vol_bbl * 0.158987;

    warnings.push("Esta fórmula usa el OD como si fuera el DI. Si el CT tiene pared gruesa, usar Desplazamiento Metálico de TF para volumen anular.");

    return {
      value: Math.round(vol_bbl * 10000) / 10000,
      unit: "bbl",
      inputs,
      steps: [
        `Longitud: ${length_m} m ÷ 0.3048 = ${length_ft.toFixed(4)} ft`,
        `Capacidad: OD² ÷ 1029.4 = ${od}² ÷ 1029.4 = ${capacity.toFixed(8)} bbl/ft`,
        `Vol desplazamiento: ${capacity.toFixed(8)} × ${length_ft.toFixed(4)} = ${vol_bbl.toFixed(4)} bbl`,
        `(Ref: CALCULO VOLUMEN TF.xls, hoja VOLUMENES, fórmula G28)`,
      ],
      warnings,
      errors: [],
      additionalResults: [
        { label: "Litros", value: Math.round(vol_liters * 100) / 100, unit: "L" },
        { label: "m³", value: Math.round(vol_m3 * 10000) / 10000, unit: "m³" },
        { label: "Longitud", value: Math.round(length_ft * 100) / 100, unit: "ft" },
      ],
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. DESPLAZAMIENTO METÁLICO DE TF
// Source: CALCULO VOLUMEN TF.xls · Hoja VOLUMENES · Fórmula G37
// ─────────────────────────────────────────────────────────────────────────────
const tfMetalDisplacement: Formula = {
  id: "tf-metal-displacement",
  name: "Desplazamiento Metálico de TF",
  category: "Coiled Tubing",
  description: "Volumen de metal de la TF — diferencia entre volumen externo e interno. Usado para calcular el efecto de pistón y la flotabilidad.",
  icon: "circle",
  inputs: [
    { key: "od_tf_in", label: "OD de TF", unit: "in", type: "number", required: true, min: 0.001, placeholder: "Ej: 1.5" },
    { key: "id_tf_in", label: "ID de TF", unit: "in", type: "number", required: true, min: 0.001, placeholder: "Ej: 1.321" },
    { key: "length_m", label: "Longitud", unit: "m", type: "number", required: true, min: 0.001, placeholder: "Ej: 1800" },
  ],
  output: { label: "Desplazamiento Metálico", unit: "bbl" },
  formulaText: "V(bbl) = ((OD_TF² - ID_TF²) / 1029.4) × (L(m) / 0.3048)",
  references: ["CALCULO VOLUMEN TF.xls — Hoja VOLUMENES, fórmula G37"],
  needsReview: false,
  testCases: [
    {
      description: "OD=1.5in, ID=1.321in, L=1800m",
      inputs: { od_tf_in: 1.5, id_tf_in: 1.321, length_m: 1800 },
      expectedValue: ((1.5 * 1.5 - 1.321 * 1.321) / 1029.4) * (1800 / 0.3048),
      tolerance: 0.001,
    },
  ],
  calculate(inputs) {
    const od = Number(inputs["od_tf_in"]);
    const id = Number(inputs["id_tf_in"]);
    const length_m = Number(inputs["length_m"]);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (isNaN(od) || od <= 0) errors.push("OD de TF debe ser mayor que cero.");
    if (isNaN(id) || id <= 0) errors.push("ID de TF debe ser mayor que cero.");
    if (!isNaN(od) && !isNaN(id) && od <= id) errors.push("OD debe ser estrictamente mayor que ID.");
    if (isNaN(length_m) || length_m <= 0) errors.push("Longitud debe ser mayor que cero.");
    if (errors.length > 0) return { value: 0, unit: "bbl", inputs, steps: [], warnings, errors };

    const length_ft = length_m / 0.3048;
    const diff = od * od - id * id;
    const capacity = diff / 1029.4;
    const vol_bbl = capacity * length_ft;
    const vol_liters = vol_bbl * 158.987;
    const vol_m3 = vol_bbl * 0.158987;

    return {
      value: Math.round(vol_bbl * 10000) / 10000,
      unit: "bbl",
      inputs,
      steps: [
        `Longitud: ${length_m} m ÷ 0.3048 = ${length_ft.toFixed(4)} ft`,
        `Área metálica: OD² - ID² = ${od}² - ${id}² = ${(od * od).toFixed(6)} - ${(id * id).toFixed(6)} = ${diff.toFixed(6)} in²`,
        `Capacidad metálica: ${diff.toFixed(6)} ÷ 1029.4 = ${capacity.toFixed(8)} bbl/ft`,
        `Vol metálico: ${capacity.toFixed(8)} × ${length_ft.toFixed(4)} = ${vol_bbl.toFixed(4)} bbl`,
        `(Ref: CALCULO VOLUMEN TF.xls, hoja VOLUMENES, fórmula G37)`,
      ],
      warnings,
      errors: [],
      additionalResults: [
        { label: "Litros", value: Math.round(vol_liters * 100) / 100, unit: "L" },
        { label: "m³", value: Math.round(vol_m3 * 10000) / 10000, unit: "m³" },
      ],
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. CAPACIDAD DE CARRETE CT
// Source: CoilTubingReelCapacitycalculator.xls
// ─────────────────────────────────────────────────────────────────────────────
const coiledTubing: Formula = {
  id: "coiled-tubing",
  name: "Capacidad de Carrete CT",
  category: "Coiled Tubing",
  description: "Longitud estimada de CT en el carrete. Fórmula geométrica directa del Excel fuente.",
  icon: "reload-circle",
  inputs: [
    { key: "flangeHeightIn", label: "Altura de flange", unit: "in", type: "number", required: true, min: 0.001, placeholder: "Ej: 25" },
    { key: "freeBoardIn", label: "Free board", unit: "in", type: "number", required: true, min: 0, placeholder: "Ej: 1" },
    { key: "coreDiameterIn", label: "Diámetro del núcleo", unit: "in", type: "number", required: true, min: 0.001, placeholder: "Ej: 96" },
    { key: "coreWidthIn", label: "Ancho del núcleo", unit: "in", type: "number", required: true, min: 0.001, placeholder: "Ej: 82" },
    { key: "coilOdIn", label: "OD del coil (CT OD)", unit: "in", type: "number", required: true, min: 0.001, placeholder: "Ej: 2.375" },
  ],
  output: { label: "Longitud estimada CT", unit: "ft" },
  formulaText:
    "L(ft) = TRUNC((flangeH - freeBoard) / coilOD) × TRUNC((coreD + flangeH - freeBoard) / coilOD) × (π/12) × coreW",
  references: ["CoilTubingReelCapacitycalculator.xls"],
  needsReview: false, // VALIDADA: Desbloqueada para operación real
  calculate(inputs) {
    const flangeH = Number(inputs["flangeHeightIn"]);
    const freeBoard = Number(inputs["freeBoardIn"]);
    const coreD = Number(inputs["coreDiameterIn"]);
    const coreW = Number(inputs["coreWidthIn"]);
    const coilOd = Number(inputs["coilOdIn"]);
    const errors: string[] = [];

    if (isNaN(flangeH) || flangeH <= 0) errors.push("Altura de flange debe ser > 0.");
    if (isNaN(freeBoard) || freeBoard < 0) errors.push("Free board debe ser >= 0.");
    if (!isNaN(flangeH) && !isNaN(freeBoard) && flangeH <= freeBoard) errors.push("Altura de flange debe ser mayor que free board.");
    if (isNaN(coreD) || coreD <= 0) errors.push("Diámetro del núcleo debe ser > 0.");
    if (isNaN(coreW) || coreW <= 0) errors.push("Ancho del núcleo debe ser > 0.");
    if (isNaN(coilOd) || coilOd <= 0) errors.push("OD del coil debe ser > 0.");
    
    if (errors.length > 0) return { value: 0, unit: "ft", inputs, steps: [], warnings: [], errors };

    const verticalLayers = Math.trunc((flangeH - freeBoard) / coilOd);
    const horizontalWraps = Math.trunc((coreD + flangeH - freeBoard) / coilOd);
    
    if (verticalLayers <= 0) { errors.push("Capas verticales resultan 0. Revisar inputs."); return { value: 0, unit: "ft", inputs, steps: [], warnings: [], errors }; }
    if (horizontalWraps <= 0) { errors.push("Vueltas horizontales resultan 0. Revisar inputs."); return { value: 0, unit: "ft", inputs, steps: [], warnings: [], errors }; }

    // Constante exacta del Excel: 3.1415926535 / 12
    const COIL_LENGTH_FACTOR = 3.1415926535 / 12;
    const lengthFt = verticalLayers * horizontalWraps * COIL_LENGTH_FACTOR * coreW;
    const lengthM = lengthFt * 0.3048;

    return {
      value: lengthFt,
      unit: "ft",
      inputs,
      steps: [
        `Capas verticales (F16): TRUNC((${flangeH} - ${freeBoard}) / ${coilOd}) = ${verticalLayers}`,
        `Vueltas horizontales (F17): TRUNC((${coreD} + ${flangeH} - ${freeBoard}) / ${coilOd}) = ${horizontalWraps}`,
        `Constante factor: 3.1415926535 / 12 = ${COIL_LENGTH_FACTOR.toFixed(6)}`,
        `Longitud (G26): ${verticalLayers} × ${horizontalWraps} × ${COIL_LENGTH_FACTOR.toFixed(6)} × ${coreW} = ${lengthFt.toFixed(4)} ft`,
      ],
      warnings: [],
      errors: [],
      additionalResults: [
        { label: "Longitud", value: lengthM, unit: "m" },
        { label: "Capas verticales", value: verticalLayers, unit: "capas" },
        { label: "Vueltas horizontales", value: horizontalWraps, unit: "vueltas" },
      ],
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. VELOCIDAD DE PENETRACIÓN EN RELLENO
// Source: CALCULO VOLUMEN TF.xls · Hoja VELOCIDADES · Fórmula H30
// ─────────────────────────────────────────────────────────────────────────────
const fillPenetrationVelocity: Formula = {
  id: "fill-penetration-velocity",
  name: "Velocidad de Penetración en Relleno",
  category: "Hidráulica",
  description: "Velocidad de penetración del CT en el relleno. Relaciona el gasto de bombeo con la geometría del espacio anular y el factor de acarreo.",
  icon: "speedometer",
  inputs: [
    { key: "d_mayor_in", label: "Diámetro del agujero/TR", unit: "in", type: "number", required: true, min: 0.001, placeholder: "Ej: 2.99" },
    { key: "od_tf_in", label: "OD del CT/TF", unit: "in", type: "number", required: true, min: 0.001, placeholder: "Ej: 1.5" },
    { key: "bpm", label: "Gasto de bombeo", unit: "BPM", type: "number", required: true, min: 0, placeholder: "Ej: 1.5" },
    { key: "acarreo_percent", label: "Factor de acarreo", unit: "%", type: "number", required: true, min: 0.001, max: 100, placeholder: "Ej: 80" },
  ],
  output: { label: "Velocidad de Penetración", unit: "ft/min" },
  formulaText: "V(ft/min) = (acarreo% × BPM) / (0.6 × 2.65 × 0.097 × (D_mayor² - OD_TF²))",
  references: ["CALCULO VOLUMEN TF.xls — Hoja VELOCIDADES, fórmula H30"],
  needsReview: false,
  calculate(inputs) {
    const d_mayor = Number(inputs["d_mayor_in"]);
    const od_tf = Number(inputs["od_tf_in"]);
    const bpm = Number(inputs["bpm"]);
    const acarreo = Number(inputs["acarreo_percent"]);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (isNaN(d_mayor) || d_mayor <= 0) errors.push("Diámetro del agujero/TR debe ser > 0.");
    if (isNaN(od_tf) || od_tf <= 0) errors.push("OD del CT/TF debe ser > 0.");
    if (!isNaN(d_mayor) && !isNaN(od_tf) && d_mayor <= od_tf) errors.push("D_mayor debe ser estrictamente mayor que OD del CT.");
    if (isNaN(bpm) || bpm < 0) errors.push("Gasto debe ser >= 0.");
    if (isNaN(acarreo) || acarreo <= 0) errors.push("Factor de acarreo debe ser > 0.");
    if (errors.length > 0) return { value: 0, unit: "ft/min", inputs, steps: [], warnings, errors };

    // Constantes: 0.6 (coeficiente), 2.65 (densidad relleno gr/cc), 0.097 (factor unidades)
    const COEFF = 0.6;
    const DENSITY_FILL = 2.65;
    const UNIT_FACTOR = 0.097;

    const areaAnular = d_mayor * d_mayor - od_tf * od_tf;
    const denominator = COEFF * DENSITY_FILL * UNIT_FACTOR * areaAnular;
    if (denominator === 0) { errors.push("División entre cero: revisar dimensiones."); return { value: 0, unit: "ft/min", inputs, steps: [], warnings, errors }; }
    const vel_ft_min = (acarreo * bpm) / denominator;
    const vel_m_min = vel_ft_min * 0.3048;

    warnings.push("Constantes: 0.6 (coeficiente Cd), 2.65 gr/cc (densidad relleno), 0.097 (factor de unidades). Validar contra CALCULO VOLUMEN TF.xls, hoja VELOCIDADES.");

    return {
      value: Math.round(vel_ft_min * 100) / 100,
      unit: "ft/min",
      inputs,
      steps: [
        `Área anular: ${d_mayor}² - ${od_tf}² = ${areaAnular.toFixed(6)} in²`,
        `Denominador: 0.6 × 2.65 × 0.097 × ${areaAnular.toFixed(6)} = ${denominator.toFixed(8)}`,
        `Velocidad: (${acarreo} × ${bpm}) ÷ ${denominator.toFixed(8)} = ${vel_ft_min.toFixed(4)} ft/min`,
        `(Ref: CALCULO VOLUMEN TF.xls, hoja VELOCIDADES, fórmula H30)`,
      ],
      warnings,
      errors: [],
      additionalResults: [
        { label: "m/min", value: Math.round(vel_m_min * 1000) / 1000, unit: "m/min" },
      ],
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 9. BACHE ECOLÓGICO
// Source: Bache ecologico.xls
// ─────────────────────────────────────────────────────────────────────────────
const bachecologico: Formula = {
  id: "bache-ecologico",
  name: "Bache Ecológico",
  category: "Bache Ecológico",
  description: "Calcula presiones hidrostáticas y densidad requerida para diseño de bache ecológico en operaciones de CT/wireline.",
  icon: "water",
  inputs: [
    { key: "di_tp_in", label: "DI de TP", unit: "in", type: "number", required: true, min: 0.001, placeholder: "Ej: 2.441" },
    { key: "densidad_lodo_grcc", label: "Densidad del lodo", unit: "gr/cc", type: "number", required: true, min: 0.001, placeholder: "Ej: 1.05" },
    { key: "volumen_tapon_m3", label: "Volumen del tapón", unit: "m³", type: "number", required: true, min: 0.001, placeholder: "Ej: 0.5" },
    { key: "longitud_desplazar_m", label: "Longitud a desplazar", unit: "m", type: "number", required: true, min: 0, placeholder: "Ej: 100" },
    { key: "profundidad_m", label: "Profundidad TVD", unit: "m", type: "number", required: true, min: 0.001, placeholder: "Ej: 1500" },
  ],
  output: { label: "Densidad requerida (bache)", unit: "gr/cc" },
  formulaText: [
    "cap_tp = DI_TP² × 0.5067 / 1000  [m³/m]",
    "L_tapón = Vol_tapón / cap_tp  [m]",
    "P_hid_total = Prof × ρ_lodo / 10  [kg/cm²]",
    "Col_equiv = Prof - L_tapón - L_desplazar  [m]",
    "P_hid_parcial = Col_equiv × ρ_lodo / 10  [kg/cm²]",
    "P_faltante = P_total - P_parcial  [kg/cm²]",
    "ρ_req = P_faltante × 10 / L_tapón  [gr/cc]",
  ].join(" | "),
  references: ["Bache ecologico.xls"],
  needsReview: false,
  calculate(inputs) {
    const di_tp = Number(inputs["di_tp_in"]);
    const densidad = Number(inputs["densidad_lodo_grcc"]);
    const vol_tapon = Number(inputs["volumen_tapon_m3"]);
    const longitud_desplazar = Number(inputs["longitud_desplazar_m"]);
    const profundidad = Number(inputs["profundidad_m"]);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (isNaN(di_tp) || di_tp <= 0) errors.push("DI de TP debe ser > 0.");
    if (isNaN(densidad) || densidad <= 0) errors.push("Densidad del lodo debe ser > 0.");
    if (isNaN(vol_tapon) || vol_tapon <= 0) errors.push("Volumen del tapón debe ser > 0.");
    if (isNaN(longitud_desplazar) || longitud_desplazar < 0) errors.push("Longitud a desplazar debe ser >= 0.");
    if (isNaN(profundidad) || profundidad <= 0) errors.push("Profundidad debe ser > 0.");
    if (errors.length > 0) return { value: 0, unit: "gr/cc", inputs, steps: [], warnings, errors };

    // Paso 1: Capacidad TP
    const cap_tp_m3_m = (di_tp * di_tp * 0.5067) / 1000;

    // Paso 2: Longitud del tapón
    const longitud_tapon_m = vol_tapon / cap_tp_m3_m;

    // Validación: profundidad > longitud_tapón + longitud_desplazar
    if (profundidad <= longitud_tapon_m + longitud_desplazar) {
      errors.push(`Profundidad (${profundidad} m) debe ser mayor que longitud tapón + longitud desplazar (${(longitud_tapon_m + longitud_desplazar).toFixed(2)} m).`);
      return { value: 0, unit: "gr/cc", inputs, steps: [], warnings, errors };
    }

    // Paso 3: Presión hidrostática total
    const p_hid_total = (profundidad * densidad) / 10;

    // Paso 4: Columna equivalente
    const col_equiv_m = profundidad - longitud_tapon_m - longitud_desplazar;

    // Paso 5: Presión hidrostática parcial
    const p_hid_parcial = (col_equiv_m * densidad) / 10;

    // Paso 6: Presión faltante
    const p_faltante = p_hid_total - p_hid_parcial;

    // Paso 7: Densidad requerida
    const densidad_req = (p_faltante * 10) / longitud_tapon_m;

    if (densidad_req < densidad) warnings.push("Densidad requerida menor que densidad del lodo actual — verificar diseño del bache.");
    if (densidad_req > 2.5) warnings.push("Densidad requerida muy alta (>2.5 gr/cc). Verificar datos de entrada.");

    return {
      value: Math.round(densidad_req * 10000) / 10000,
      unit: "gr/cc",
      inputs,
      steps: [
        `1. Cap. TP: DI² × 0.5067 / 1000 = ${di_tp}² × 0.5067 / 1000 = ${cap_tp_m3_m.toFixed(6)} m³/m`,
        `2. Longitud tapón: ${vol_tapon} / ${cap_tp_m3_m.toFixed(6)} = ${longitud_tapon_m.toFixed(4)} m`,
        `3. P.hid. total: ${profundidad} × ${densidad} / 10 = ${p_hid_total.toFixed(4)} kg/cm²`,
        `4. Columna equivalente: ${profundidad} - ${longitud_tapon_m.toFixed(4)} - ${longitud_desplazar} = ${col_equiv_m.toFixed(4)} m`,
        `5. P.hid. parcial: ${col_equiv_m.toFixed(4)} × ${densidad} / 10 = ${p_hid_parcial.toFixed(4)} kg/cm²`,
        `6. P. faltante: ${p_hid_total.toFixed(4)} - ${p_hid_parcial.toFixed(4)} = ${p_faltante.toFixed(4)} kg/cm²`,
        `7. Densidad requerida: ${p_faltante.toFixed(4)} × 10 / ${longitud_tapon_m.toFixed(4)} = ${densidad_req.toFixed(4)} gr/cc`,
      ],
      warnings,
      errors: [],
      additionalResults: [
        { label: "Capacidad TP", value: Math.round(cap_tp_m3_m * 1000000) / 1000000, unit: "m³/m" },
        { label: "Longitud tapón", value: Math.round(longitud_tapon_m * 100) / 100, unit: "m" },
        { label: "P. hid. total", value: Math.round(p_hid_total * 10000) / 10000, unit: "kg/cm²" },
        { label: "P. hid. parcial", value: Math.round(p_hid_parcial * 10000) / 10000, unit: "kg/cm²" },
        { label: "P. faltante", value: Math.round(p_faltante * 10000) / 10000, unit: "kg/cm²" },
        { label: "Columna eq.", value: Math.round(col_equiv_m * 100) / 100, unit: "m" },
      ],
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 10. HIDRÁULICA DE PERFORACIÓN
// Source: HIDRAULICA_RIVERO.xls · Hydraulics_IPM.xls
// STATUS: BLOQUEADA — needsReview=true. No muestra resultado como válido.
// ─────────────────────────────────────────────────────────────────────────────
const hydraulics: Formula = {
  id: "hydraulics",
  name: "Hidráulica de Perforación",
  category: "Hidráulica",
  description:
    "Módulo de hidráulica en desarrollo. Los submódulos (caída de presión interna, anular, en barrena, ECD, nozzles, Bingham, Power Law, Herschel-Bulkley) están pendientes de extracción y validación de los archivos Excel fuente.",
  icon: "water",
  inputs: [
    { key: "flow_gpm", label: "Gasto (Flow Rate)", unit: "GPM", type: "number", required: true, min: 0, placeholder: "Ej: 400" },
    { key: "mud_ppg", label: "Peso del lodo", unit: "ppg", type: "number", required: true, min: 1, placeholder: "Ej: 10.5" },
    { key: "pv_cp", label: "Viscosidad Plástica (PV)", unit: "cP", type: "number", required: true, min: 0, placeholder: "Ej: 20" },
    { key: "yp_lbft2", label: "Punto de Cedencia (YP)", unit: "lb/100ft²", type: "number", required: true, min: 0, placeholder: "Ej: 15" },
    { key: "dp_id_in", label: "ID Drill Pipe", unit: "in", type: "number", required: true, min: 0.001, placeholder: "Ej: 4.276" },
    { key: "hole_in", label: "Diámetro de agujero", unit: "in", type: "number", required: true, min: 0.001, placeholder: "Ej: 8.5" },
    { key: "depth_ft", label: "Profundidad MD", unit: "ft", type: "number", required: true, min: 0, placeholder: "Ej: 8000" },
  ],
  output: { label: "ECD estimado", unit: "ppg" },
  formulaText: "PENDIENTE — Validar con HIDRAULICA_RIVERO.xls y Hydraulics_IPM.xls",
  references: ["HIDRAULICA_RIVERO.xls", "Hydraulics_IPM.xls"],
  needsReview: true, // BLOCKED
  calculate(inputs) {
    // Return blocked result — calculationEngine will enforce blocked=true
    return {
      value: 0,
      unit: "ppg",
      inputs,
      steps: [
        "Fórmula pendiente de validar con HIDRAULICA_RIVERO.xls y Hydraulics_IPM.xls."
      ],
      warnings: [
        "Fórmula pendiente de validar con archivo fuente. No usar para operación."
      ],
      errors: [],
      blocked: true,
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// FORMULA REGISTRY — Add new formulas here. UI is auto-driven.
// ─────────────────────────────────────────────────────────────────────────────
const registry: Formula[] = [
  pipeVolume,
  annularVolume,
  fluidVelocity,
  annularVelocity,
  tfDisplacement,
  tfMetalDisplacement,
  coiledTubing,
  fillPenetrationVelocity,
  bachecologico,
  hydraulics,
];

export function getAllFormulas(): Formula[] {
  return registry;
}

export function getFormulaById(id: string): Formula | undefined {
  return registry.find((f) => f.id === id);
}

export function getFormulasByCategory(category: string): Formula[] {
  return registry.filter((f) => f.category === category);
}

export function getAllCategories(): string[] {
  return [...new Set(registry.map((f) => f.category))];
}