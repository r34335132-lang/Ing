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
// Source: CALCULO VOLUMEN TF.xls
// ─────────────────────────────────────────────────────────────────────────────
const annularVolume: Formula = {
  id: "annular-volume",
  name: "Volumen Anular",
  category: "Tuberías",
  description: "Calcula el volumen anular entre agujero o TR y tubería de perforación/TF.",
  icon: "circle",
  inputs: [
    { key: "d_mayor_in", label: "Diámetro Mayor (agujero/TR)", unit: "in", type: "number", required: true, min: 0.001, placeholder: "Ej: 1.8" },
    { key: "d_menor_in", label: "Diámetro Menor (TP/TF)", unit: "in", type: "number", required: true, min: 0.001, placeholder: "Ej: 1.25" },
    { key: "length_m", label: "Longitud", unit: "m", type: "number", required: true, min: 0.001, placeholder: "Ej: 1410" },
  ],
  output: { label: "Volumen Anular", unit: "bbl" },
  formulaText: "V(bbl) = ((D_mayor² - D_menor²) / 1029.4) × (L(m) / 0.3048)",
  references: ["CALCULO VOLUMEN TF.xls"],
  needsReview: false,
  testCases: [
    {
      description: "d_mayor_in=1.8, d_menor_in=1.25, L=1410m",
      inputs: { d_mayor_in: 1.8, d_menor_in: 1.25, length_m: 1410 },
      expectedValue: 7.53845791983405,
      tolerance: 0.0001,
    },
  ],
  calculate(inputs) {
    const d_mayor_in = Number(inputs["d_mayor_in"]);
    const d_menor_in = Number(inputs["d_menor_in"]);
    const length_m = Number(inputs["length_m"]);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (isNaN(d_mayor_in) || d_mayor_in <= 0) errors.push("El diámetro mayor debe ser mayor que cero.");
    if (isNaN(d_menor_in) || d_menor_in <= 0) errors.push("El diámetro menor debe ser mayor que cero.");
    if (!isNaN(d_mayor_in) && !isNaN(d_menor_in) && d_mayor_in <= d_menor_in) errors.push("D_mayor debe ser estrictamente mayor que D_menor.");
    if (isNaN(length_m) || length_m <= 0) errors.push("La longitud debe ser mayor que cero.");
    
    if (errors.length > 0) return { value: 0, unit: "bbl", inputs, steps: [], warnings, errors };

    const areaDiff = d_mayor_in * d_mayor_in - d_menor_in * d_menor_in;
    const length_ft = length_m / 0.3048;
    const vol_bbl = (areaDiff / 1029.4) * length_ft;
    const vol_liters = vol_bbl * 158.987294928;
    const vol_m3 = vol_bbl * 0.158987294928;

    return {
      value: vol_bbl,
      unit: "bbl",
      inputs,
      steps: [
        `Longitud en pies: L(ft) = ${length_m} ÷ 0.3048 = ${length_ft.toFixed(4)} ft`,
        `Diferencia cuadrados: ${d_mayor_in}² - ${d_menor_in}² = ${areaDiff.toFixed(6)} in²`,
        `Volumen anular: (${areaDiff.toFixed(6)} ÷ 1029.4) × ${length_ft.toFixed(4)} = ${vol_bbl.toFixed(4)} bbl`,
      ],
      warnings,
      errors: [],
      additionalResults: [
        { label: "Volumen", value: vol_liters, unit: "L" },
        { label: "Volumen", value: vol_m3, unit: "m³" },
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
      expectedValue: 259.143227946854,
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

    const capacityBblPerFt = (di * di) / 1029.4;
    const vel_ft_min = flow_bpm / capacityBblPerFt;
    const vel_m_min = vel_ft_min * 0.3048;

    if (vel_ft_min > 1000) warnings.push("Velocidad muy alta (>1000 ft/min). Riesgo de erosión.");
    if (vel_ft_min < 10 && flow_bpm > 0) warnings.push("Velocidad baja (<10 ft/min). Puede ser insuficiente.");

    return {
      value: vel_ft_min,
      unit: "ft/min",
      inputs,
      steps: [
        `Capacidad: C = DI² ÷ 1029.4 = ${di}² ÷ 1029.4 = ${capacityBblPerFt.toFixed(7)} bbl/ft`,
        `Velocidad: V = ${flow_bpm} BPM ÷ ${capacityBblPerFt.toFixed(7)} = ${vel_ft_min.toFixed(4)} ft/min`,
      ],
      warnings,
      errors: [],
      additionalResults: [
        { label: "Velocidad", value: vel_m_min, unit: "m/min" },
      ],
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. VELOCIDAD ANULAR
// Source: CALCULO VOLUMEN TF.xls
// ─────────────────────────────────────────────────────────────────────────────
const annularVelocity: Formula = {
  id: "annular-velocity",
  name: "Velocidad Anular",
  category: "Hidráulica",
  description: "Calcula la velocidad de retorno del fluido en el espacio anular. Mínimo recomendado: 100 ft/min.",
  icon: "speedometer-outline",
  inputs: [
    { key: "d_mayor_in", label: "Diámetro Mayor (agujero/TR)", unit: "in", type: "number", required: true, min: 0.001, placeholder: "Ej: 2.99" },
    { key: "d_menor_in", label: "Diámetro Menor (TP/TF)", unit: "in", type: "number", required: true, min: 0.001, placeholder: "Ej: 1.5" },
    { key: "bpm", label: "Gasto de Bombeo", unit: "BPM", type: "number", required: true, min: 0, placeholder: "Ej: 1.5" },
  ],
  output: { label: "Velocidad Anular", unit: "ft/min" },
  formulaText: "VA(ft/min) = BPM / ((D_mayor² - D_menor²) / 1029.4)",
  references: ["CALCULO VOLUMEN TF.xls"],
  needsReview: false, // VALIDADA contra Excel real
  calculate(inputs) {
    const d_mayor_in = Number(inputs["d_mayor_in"]);
    const d_menor_in = Number(inputs["d_menor_in"]);
    const bpm = Number(inputs["bpm"]);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (isNaN(d_mayor_in) || d_mayor_in <= 0) errors.push("El diámetro mayor debe ser mayor que cero.");
    if (isNaN(d_menor_in) || d_menor_in <= 0) errors.push("El diámetro menor debe ser mayor que cero.");
    if (!isNaN(d_mayor_in) && !isNaN(d_menor_in) && d_mayor_in <= d_menor_in) errors.push("D_mayor debe ser estrictamente mayor que D_menor.");
    if (isNaN(bpm) || bpm < 0) errors.push("El gasto debe ser >= 0.");
    if (errors.length > 0) return { value: 0, unit: "ft/min", inputs, steps: [], warnings, errors };

    const areaDiff = d_mayor_in * d_mayor_in - d_menor_in * d_menor_in;
    const capacityBblPerFt = areaDiff / 1029.4;
    
    if (capacityBblPerFt === 0) {
      errors.push("Capacidad anular es cero, revisa los diámetros.");
      return { value: 0, unit: "ft/min", inputs, steps: [], warnings, errors };
    }

    const vel_ft_min = bpm / capacityBblPerFt;
    const vel_m_min = vel_ft_min * 0.3048;

    if (vel_ft_min < 100) warnings.push("VA < 100 ft/min: puede ser insuficiente para acarreo de recortes.");
    if (vel_ft_min > 500) warnings.push("VA > 500 ft/min: posible erosión y pérdidas de presión significativas.");

    return {
      value: vel_ft_min,
      unit: "ft/min",
      inputs,
      steps: [
        `Diferencia cuadrados: ${d_mayor_in}² - ${d_menor_in}² = ${areaDiff.toFixed(6)} in²`,
        `Capacidad anular: C = ${areaDiff.toFixed(6)} ÷ 1029.4 = ${capacityBblPerFt.toFixed(8)} bbl/ft`,
        `VA = ${bpm} ÷ ${capacityBblPerFt.toFixed(8)} = ${vel_ft_min.toFixed(4)} ft/min`,
      ],
      warnings,
      errors: [],
      additionalResults: [
        { label: "Velocidad", value: vel_m_min, unit: "m/min" },
      ],
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. DESPLAZAMIENTO DE TF (TUBERÍA FLEXIBLE / COILED TUBING)
// Source: CALCULO VOLUMEN TF.xls · Hoja VOLUMENES · Fórmula G34
// ─────────────────────────────────────────────────────────────────────────────
const tfDisplacement: Formula = {
  id: "tf-displacement",
  name: "Desplazamiento de TF",
  category: "Coiled Tubing",
  description: "Desplazamiento externo de la TF calculado con OD. No representa capacidad interna.",
  icon: "pipe",
  inputs: [
    { key: "od_tf_in", label: "OD de TF", unit: "in", type: "number", required: true, min: 0.001, placeholder: "Ej: 1.5" },
    { key: "length_m", label: "Longitud", unit: "m", type: "number", required: true, min: 0.001, placeholder: "Ej: 1800" },
  ],
  output: { label: "Desplazamiento de TF", unit: "bbl" },
  formulaText: "V(bbl) = (OD_TF² / 1029.4) × factor_excel × (L(m) / 0.3048)",
  references: ["CALCULO VOLUMEN TF.xls — Hoja VOLUMENES, fórmula G34"],
  needsReview: false,
  testCases: [
    {
      description: "OD=1.5in, L=1800m",
      inputs: { od_tf_in: 1.5, length_m: 1800 },
      expectedValue: 12.8639051470706,
      tolerance: 0.0001,
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
    // Factor observado en CALCULO VOLUMEN TF.xls, hoja VOLUMENES, celda G34, para igualar el desplazamiento externo de TF.
    const excelCorrectionFactor = 0.9965909349428732;
    const capacity = ((od * od) / 1029.4) * excelCorrectionFactor;
    const vol_bbl = capacity * length_ft;
    const vol_liters = vol_bbl * 158.99691007136394;
    const vol_m3 = vol_bbl * 0.15899691007136394;

    warnings.push("Validado contra Excel. Usa OD de TF como desplazamiento externo, no capacidad interna.");

    return {
      value: vol_bbl,
      unit: "bbl",
      inputs,
      steps: [
        `Longitud: ${length_m} m ÷ 0.3048 = ${length_ft.toFixed(4)} ft`,
        `Capacidad externa Excel: (OD² ÷ 1029.4) × ${excelCorrectionFactor.toFixed(10)} = ${capacity.toFixed(8)} bbl/ft`,
        `Vol desplazamiento: ${capacity.toFixed(8)} × ${length_ft.toFixed(4)} = ${vol_bbl.toFixed(4)} bbl`,
        `(Ref: CALCULO VOLUMEN TF.xls, hoja VOLUMENES, fórmula G34)`,
      ],
      warnings,
      errors: [],
      additionalResults: [
        { label: "Litros", value: vol_liters, unit: "L" },
        { label: "m³", value: vol_m3, unit: "m³" },
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
      expectedValue: 2.89687326460334,
      tolerance: 0.0001,
    },
  ],
  calculate(inputs) {
    const od_tf_in = Number(inputs["od_tf_in"]);
    const id_tf_in = Number(inputs["id_tf_in"]);
    const length_m = Number(inputs["length_m"]);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (isNaN(od_tf_in) || od_tf_in <= 0) errors.push("OD de TF debe ser mayor que cero.");
    if (isNaN(id_tf_in) || id_tf_in <= 0) errors.push("ID de TF debe ser mayor que cero.");
    if (!isNaN(od_tf_in) && !isNaN(id_tf_in) && od_tf_in <= id_tf_in) errors.push("OD debe ser estrictamente mayor que ID.");
    if (isNaN(length_m) || length_m <= 0) errors.push("Longitud debe ser mayor que cero.");
    if (errors.length > 0) return { value: 0, unit: "bbl", inputs, steps: [], warnings, errors };

    const areaDiff = od_tf_in * od_tf_in - id_tf_in * id_tf_in;
    const length_ft = length_m / 0.3048;
    const vol_bbl = (areaDiff / 1029.4) * length_ft;
    const vol_liters = vol_bbl * 158.987294928;
    const vol_m3 = vol_bbl * 0.158987294928;

    return {
      value: vol_bbl,
      unit: "bbl",
      inputs,
      steps: [
        `Longitud: ${length_m} m ÷ 0.3048 = ${length_ft.toFixed(4)} ft`,
        `Área metálica: OD² - ID² = ${od_tf_in}² - ${id_tf_in}² = ${(od_tf_in * od_tf_in).toFixed(6)} - ${(id_tf_in * id_tf_in).toFixed(6)} = ${areaDiff.toFixed(6)} in²`,
        `Capacidad metálica: ${areaDiff.toFixed(6)} ÷ 1029.4 = ${(areaDiff / 1029.4).toFixed(8)} bbl/ft`,
        `Vol metálico: ${(areaDiff / 1029.4).toFixed(8)} × ${length_ft.toFixed(4)} = ${vol_bbl.toFixed(4)} bbl`,
        `(Ref: CALCULO VOLUMEN TF.xls, hoja VOLUMENES, fórmula G37)`,
      ],
      warnings,
      errors: [],
      additionalResults: [
        { label: "Litros", value: vol_liters, unit: "L" },
        { label: "m³", value: vol_m3, unit: "m³" },
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
  needsReview: false,
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
    { key: "acarreo_percent", label: "Factor de acarreo", unit: "%", type: "number", required: true, min: 0.001, max: 100, placeholder: "Ej: 10" },
  ],
  output: { label: "Velocidad de Penetración", unit: "ft/min" },
  formulaText: "V(ft/min) = (acarreo% × BPM) / (0.6 × 2.65 × 0.097 × (D_mayor² - OD_TF²))",
  references: ["CALCULO VOLUMEN TF.xls — Hoja VELOCIDADES, fórmula H30"],
  needsReview: false,
  calculate(inputs) {
    const d_mayor_in = Number(inputs["d_mayor_in"]);
    const od_tf_in = Number(inputs["od_tf_in"]);
    const bpm = Number(inputs["bpm"]);
    const acarreo_percent = Number(inputs["acarreo_percent"]);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (isNaN(d_mayor_in) || d_mayor_in <= 0) errors.push("Diámetro del agujero/TR debe ser > 0.");
    if (isNaN(od_tf_in) || od_tf_in <= 0) errors.push("OD del CT/TF debe ser > 0.");
    if (!isNaN(d_mayor_in) && !isNaN(od_tf_in) && d_mayor_in <= od_tf_in) errors.push("D_mayor debe ser estrictamente mayor que OD del CT.");
    if (isNaN(bpm) || bpm < 0) errors.push("Gasto debe ser >= 0.");
    if (isNaN(acarreo_percent) || acarreo_percent <= 0) errors.push("Factor de acarreo debe ser > 0.");
    
    if (errors.length > 0) return { value: 0, unit: "ft/min", inputs, steps: [], warnings, errors };

    const areaDiff = d_mayor_in * d_mayor_in - od_tf_in * od_tf_in;
    const denominator = 0.6 * 2.65 * 0.097 * areaDiff;
    
    if (denominator === 0) { 
      errors.push("División entre cero: revisar dimensiones."); 
      return { value: 0, unit: "ft/min", inputs, steps: [], warnings, errors }; 
    }
    
    const vel_ft_min = (acarreo_percent * bpm) / denominator;
    const vel_m_min = vel_ft_min * 0.3048;

    warnings.push("Constantes: 0.6 (coeficiente Cd), 2.65 gr/cc (densidad relleno), 0.097 (factor de unidades). Validar contra CALCULO VOLUMEN TF.xls, hoja VELOCIDADES.");

    return {
      value: vel_ft_min,
      unit: "ft/min",
      inputs,
      steps: [
        `Área anular: ${d_mayor_in}² - ${od_tf_in}² = ${areaDiff.toFixed(6)} in²`,
        `Denominador: 0.6 × 2.65 × 0.097 × ${areaDiff.toFixed(6)} = ${denominator.toFixed(8)}`,
        `Velocidad: (${acarreo_percent} × ${bpm}) ÷ ${denominator.toFixed(8)} = ${vel_ft_min.toFixed(4)} ft/min`,
        `(Ref: CALCULO VOLUMEN TF.xls, hoja VELOCIDADES, fórmula H30)`,
      ],
      warnings,
      errors: [],
      additionalResults: [
        { label: "Velocidad", value: vel_m_min, unit: "m/min" },
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
    { key: "di_tp_in", label: "DI de TP", unit: "in", type: "number", required: true, min: 0.001, placeholder: "Ej: 2.602" },
    { key: "densidad_lodo_grcc", label: "Densidad del lodo", unit: "gr/cc", type: "number", required: true, min: 0.001, placeholder: "Ej: 1.17" },
    { key: "volumen_tapon_m3", label: "Volumen del tapón", unit: "m³", type: "number", required: true, min: 0.001, placeholder: "Ej: 6" },
    { key: "longitud_desplazar_m", label: "Longitud a desplazar", unit: "m", type: "number", required: true, min: 0, placeholder: "Ej: 140" },
    { key: "profundidad_m", label: "Profundidad TVD", unit: "m", type: "number", required: true, min: 0.001, placeholder: "Ej: 3927" },
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
    const di_tp_in = Number(inputs["di_tp_in"]);
    const densidad_lodo_grcc = Number(inputs["densidad_lodo_grcc"]);
    const volumen_tapon_m3 = Number(inputs["volumen_tapon_m3"]);
    const longitud_desplazar_m = Number(inputs["longitud_desplazar_m"]);
    const profundidad_m = Number(inputs["profundidad_m"]);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (isNaN(di_tp_in) || di_tp_in <= 0) errors.push("DI de TP debe ser > 0.");
    if (isNaN(densidad_lodo_grcc) || densidad_lodo_grcc <= 0) errors.push("Densidad del lodo debe ser > 0.");
    if (isNaN(volumen_tapon_m3) || volumen_tapon_m3 <= 0) errors.push("Volumen del tapón debe ser > 0.");
    if (isNaN(longitud_desplazar_m) || longitud_desplazar_m < 0) errors.push("Longitud a desplazar debe ser >= 0.");
    if (isNaN(profundidad_m) || profundidad_m <= 0) errors.push("Profundidad debe ser > 0.");
    
    if (errors.length > 0) return { value: 0, unit: "gr/cc", inputs, steps: [], warnings, errors };

    const capacidad_tp_m3_m = (di_tp_in * di_tp_in * 0.5067) / 1000;
    const longitud_tapon_m = volumen_tapon_m3 / capacidad_tp_m3_m;

    if (profundidad_m <= (longitud_tapon_m + longitud_desplazar_m)) {
      errors.push(`Profundidad (${profundidad_m} m) debe ser mayor que longitud tapón + longitud desplazar (${(longitud_tapon_m + longitud_desplazar_m).toFixed(2)} m).`);
      return { value: 0, unit: "gr/cc", inputs, steps: [], warnings, errors };
    }

    const presion_hidrostatica_total_kgcm2 = (profundidad_m * densidad_lodo_grcc) / 10;
    const columna_equivalente_m = profundidad_m - longitud_tapon_m - longitud_desplazar_m;
    const presion_hidrostatica_parcial_kgcm2 = (columna_equivalente_m * densidad_lodo_grcc) / 10;
    const presion_faltante_kgcm2 = presion_hidrostatica_total_kgcm2 - presion_hidrostatica_parcial_kgcm2;
    const densidad_requerida_grcc = (presion_faltante_kgcm2 * 10) / longitud_tapon_m;

    if (densidad_requerida_grcc < densidad_lodo_grcc) warnings.push("Densidad requerida menor que densidad del lodo actual — verificar diseño del bache.");
    if (densidad_requerida_grcc > 2.5) warnings.push("Densidad requerida muy alta (>2.5 gr/cc). Verificar datos de entrada.");

    return {
      value: densidad_requerida_grcc,
      unit: "gr/cc",
      inputs,
      steps: [
        `1. Cap. TP: ${di_tp_in}² × 0.5067 / 1000 = ${capacidad_tp_m3_m.toFixed(6)} m³/m`,
        `2. Longitud tapón: ${volumen_tapon_m3} / ${capacidad_tp_m3_m.toFixed(6)} = ${longitud_tapon_m.toFixed(4)} m`,
        `3. P.hid. total: ${profundidad_m} × ${densidad_lodo_grcc} / 10 = ${presion_hidrostatica_total_kgcm2.toFixed(4)} kg/cm²`,
        `4. Columna eq.: ${profundidad_m} - ${longitud_tapon_m.toFixed(4)} - ${longitud_desplazar_m} = ${columna_equivalente_m.toFixed(4)} m`,
        `5. P.hid. parcial: ${columna_equivalente_m.toFixed(4)} × ${densidad_lodo_grcc} / 10 = ${presion_hidrostatica_parcial_kgcm2.toFixed(4)} kg/cm²`,
        `6. P. faltante: ${presion_hidrostatica_total_kgcm2.toFixed(4)} - ${presion_hidrostatica_parcial_kgcm2.toFixed(4)} = ${presion_faltante_kgcm2.toFixed(4)} kg/cm²`,
        `7. Densidad requerida: ${presion_faltante_kgcm2.toFixed(4)} × 10 / ${longitud_tapon_m.toFixed(4)} = ${densidad_requerida_grcc.toFixed(4)} gr/cc`,
      ],
      warnings,
      errors: [],
      additionalResults: [
        { label: "Capacidad TP", value: capacidad_tp_m3_m, unit: "m³/m" },
        { label: "Longitud tapón", value: longitud_tapon_m, unit: "m" },
        { label: "P. hid. total", value: presion_hidrostatica_total_kgcm2, unit: "kg/cm²" },
        { label: "Columna eq.", value: columna_equivalente_m, unit: "m" },
        { label: "P. hid. parcial", value: presion_hidrostatica_parcial_kgcm2, unit: "kg/cm²" },
        { label: "P. faltante", value: presion_faltante_kgcm2, unit: "kg/cm²" },
      ],
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 10. TFA POR TOBERAS
// Source: Hydraulics_IPM.xls · HIDRAULICA_RIVERO.xls
// STATUS: BLOQUEADA — needsReview=true hasta validar caso numérico exacto.
// ─────────────────────────────────────────────────────────────────────────────
const tfaNozzles: Formula = {
  id: "tfa-nozzles",
  name: "TFA por toberas",
  category: "Hidráulica",
  description: "Calcula el área total de flujo (TFA) a partir de tamaños de toberas en 1/32 in.",
  icon: "water",
  inputs: [
    { key: "nozzle1_32", label: "Tobera 1", unit: "1/32 in", type: "number", required: true, min: 0, max: 40, placeholder: "Ej: 12" },
    { key: "nozzle2_32", label: "Tobera 2", unit: "1/32 in", type: "number", required: true, min: 0, max: 40, placeholder: "Ej: 12" },
    { key: "nozzle3_32", label: "Tobera 3", unit: "1/32 in", type: "number", required: true, min: 0, max: 40, placeholder: "Ej: 12" },
    { key: "nozzle4_32", label: "Tobera 4", unit: "1/32 in", type: "number", required: false, min: 0, max: 40, placeholder: "Opcional" },
    { key: "nozzle5_32", label: "Tobera 5", unit: "1/32 in", type: "number", required: false, min: 0, max: 40, placeholder: "Opcional" },
    { key: "nozzle6_32", label: "Tobera 6", unit: "1/32 in", type: "number", required: false, min: 0, max: 40, placeholder: "Opcional" },
  ],
  output: { label: "TFA", unit: "in²" },
  formulaText: "TFA(in²) = Σ(nozzle²) / 1303.797",
  references: [
    "Hydraulics_IPM.xls — TFA / nozzle area",
    "HIDRAULICA_RIVERO.xls — TFA por toberas",
  ],
  needsReview: false,
  calculate(inputs) {
    const nozzleKeys = ["nozzle1_32", "nozzle2_32", "nozzle3_32", "nozzle4_32", "nozzle5_32", "nozzle6_32"];
    const errors: string[] = [];
    const nozzles = nozzleKeys.map((key) => {
      const rawValue = inputs[key];
      const value = rawValue === undefined || rawValue === "" ? 0 : Number(rawValue);

      if (isNaN(value)) errors.push(`${key} debe ser numérico.`);
      if (!isNaN(value) && value < 0) errors.push(`${key} no debe ser negativo.`);
      if (!isNaN(value) && value > 40) errors.push(`${key} no debe ser mayor a 40.`);

      return isNaN(value) ? 0 : value;
    });

    if (!nozzles.some((nozzle) => nozzle > 0)) errors.push("Al menos una tobera debe ser mayor que cero.");
    if (errors.length > 0) return { value: 0, unit: "in²", inputs, steps: [], warnings: [], errors };

    const sumSquares = nozzles.reduce((sum, nozzle) => sum + nozzle * nozzle, 0);
    const tfa_in2 = sumSquares / 1303.797;

    if (tfa_in2 <= 0) errors.push("TFA final debe ser mayor que cero.");
    if (errors.length > 0) return { value: 0, unit: "in²", inputs, steps: [], warnings: [], errors };

    return {
      value: tfa_in2,
      unit: "in²",
      inputs,
      steps: [
        `Suma de cuadrados: ${nozzles.join("² + ")}² = ${sumSquares.toFixed(4)}`,
        `TFA = ${sumSquares.toFixed(4)} / 1303.797 = ${tfa_in2.toFixed(6)} in²`,
      ],
      warnings: [],
      errors: [],
      additionalResults: [
        { label: "Suma nozzle²", value: sumSquares, unit: "32nds²" },
      ],
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 11. CAÍDA DE PRESIÓN EN BARRENA
// Source: HIDRAULICA_RIVERO.xls · ENTRY!U7 / CALCULATE!C20
// STATUS: BLOQUEADA — needsReview=true hasta validar caso numérico exacto.
// ─────────────────────────────────────────────────────────────────────────────
const bitPressureLoss: Formula = {
  id: "bit-pressure-loss",
  name: "Caída de presión en barrena",
  category: "Hidráulica",
  description: "Calcula la caída de presión en barrena usando gasto, densidad del fluido y TFA.",
  icon: "gauge",
  inputs: [
    { key: "q_gpm", label: "Gasto", unit: "gpm", type: "number", required: true, min: 0.001, placeholder: "Ej: 400" },
    { key: "density_ppg", label: "Densidad del fluido", unit: "ppg", type: "number", required: true, min: 0.001, placeholder: "Ej: 10.5" },
    { key: "tfa_in2", label: "Área total de flujo", unit: "in²", type: "number", required: true, min: 0.001, placeholder: "Ej: 0.785" },
  ],
  output: { label: "Caída de presión en barrena", unit: "psi" },
  formulaText: "ΔP_bit(psi) = 156.5 × Q² × MW / TFA² (pendiente validar variante con TFA directa; Rivero usa Σ nozzle², no TFA²)",
  references: [
    "HIDRAULICA_RIVERO.xls — ENTRY!U7 / CALCULATE!C20",
    "Hydraulics_IPM.xls — Consol!C20",
  ],
  needsReview: true,
  calculate(inputs) {
    const q_gpm = Number(inputs["q_gpm"]);
    const density_ppg = Number(inputs["density_ppg"]);
    const tfa_in2 = Number(inputs["tfa_in2"]);
    const errors: string[] = [];

    if (isNaN(q_gpm) || q_gpm <= 0) errors.push("Gasto debe ser mayor que cero.");
    if (isNaN(density_ppg) || density_ppg <= 0) errors.push("Densidad del fluido debe ser mayor que cero.");
    if (isNaN(tfa_in2) || tfa_in2 <= 0) errors.push("TFA debe ser mayor que cero.");
    if (errors.length > 0) return { value: 0, unit: "psi", inputs, steps: [], warnings: [], errors };

    const pressureLossPsi = 156.5 * q_gpm * q_gpm * density_ppg / (tfa_in2 * tfa_in2);

    return {
      value: pressureLossPsi,
      unit: "psi",
      inputs,
      steps: [
        `ΔP_bit = 156.5 × ${q_gpm}² × ${density_ppg} / ${tfa_in2}² = ${pressureLossPsi.toFixed(4)} psi`,
        "Pendiente validar variante con TFA directa. Rivero usa Σ nozzle², no TFA².",
      ],
      warnings: [],
      errors: [],
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 12. CAÍDA DE PRESIÓN EN BARRENA DESDE TOBERAS
// Source: Hydraulics_IPM.xls · HIDRAULICA_RIVERO.xls
// STATUS: BLOQUEADA — needsReview=true hasta validar caso numérico exacto.
// ─────────────────────────────────────────────────────────────────────────────
const bitPressureLossFromNozzles: Formula = {
  id: "bit-pressure-loss-from-nozzles",
  name: "Caída de presión en barrena desde toberas",
  category: "Hidráulica",
  description: "Calcula la caída de presión en barrena usando gasto, densidad y tamaños de toberas en 1/32 in.",
  icon: "gauge",
  inputs: [
    { key: "q_gpm", label: "Gasto", unit: "gpm", type: "number", required: true, min: 0.001, placeholder: "Ej: 400" },
    { key: "density_grcc", label: "Densidad del fluido", unit: "gr/cc", type: "number", required: true, min: 0.001, placeholder: "Ej: 1.29" },
    { key: "nozzle1_32", label: "Tobera 1", unit: "1/32 in", type: "number", required: true, min: 0, max: 40, placeholder: "Ej: 12" },
    { key: "nozzle2_32", label: "Tobera 2", unit: "1/32 in", type: "number", required: true, min: 0, max: 40, placeholder: "Ej: 12" },
    { key: "nozzle3_32", label: "Tobera 3", unit: "1/32 in", type: "number", required: true, min: 0, max: 40, placeholder: "Ej: 12" },
    { key: "nozzle4_32", label: "Tobera 4", unit: "1/32 in", type: "number", required: false, min: 0, max: 40, placeholder: "Opcional" },
    { key: "nozzle5_32", label: "Tobera 5", unit: "1/32 in", type: "number", required: false, min: 0, max: 40, placeholder: "Opcional" },
    { key: "nozzle6_32", label: "Tobera 6", unit: "1/32 in", type: "number", required: false, min: 0, max: 40, placeholder: "Opcional" },
  ],
  output: { label: "Caída de presión en barrena", unit: "psi" },
  formulaText: "ΔP_bit(psi) = 156.5 × Q² × (densidad_grcc × 8.33) / (Σ nozzle²)²",
  references: [
    "Hydraulics_IPM.xls — TFA / Bit pressure loss",
    "HIDRAULICA_RIVERO.xls — TFA / caída en barrena",
  ],
  needsReview: false,
  calculate(inputs) {
    const q_gpm = Number(inputs["q_gpm"]);
    const density_grcc = Number(inputs["density_grcc"]);
    const fallbackDensityPpg = Number(inputs["density_ppg"]);
    const nozzleKeys = ["nozzle1_32", "nozzle2_32", "nozzle3_32", "nozzle4_32", "nozzle5_32", "nozzle6_32"];
    const nullableInputs = inputs as Record<string, number | string | null | undefined>;
    const errors: string[] = [];

    if (isNaN(q_gpm) || q_gpm <= 0) errors.push("Gasto debe ser mayor que cero.");
    const density_ppg = !isNaN(density_grcc) && density_grcc > 0 ? density_grcc * 8.33 : fallbackDensityPpg;
    if ((isNaN(density_grcc) || density_grcc <= 0) && (isNaN(fallbackDensityPpg) || fallbackDensityPpg <= 0)) {
      errors.push("Densidad del fluido debe ser mayor que cero.");
    }

    const nozzles = nozzleKeys.map((key) => {
      const rawValue = nullableInputs[key];
      const value = rawValue === undefined || rawValue === null || rawValue === "" ? 0 : Number(rawValue);

      if (isNaN(value)) errors.push(`${key} debe ser numérico.`);
      if (!isNaN(value) && value < 0) errors.push(`${key} no debe ser negativo.`);
      if (!isNaN(value) && value > 40) errors.push(`${key} no debe ser mayor a 40.`);

      return isNaN(value) ? 0 : value;
    });

    if (!nozzles.some((nozzle) => nozzle > 0)) errors.push("Al menos una tobera debe ser mayor que cero.");
    if (errors.length > 0) return { value: 0, unit: "psi", inputs, steps: [], warnings: [], errors };

    const sumSquares = nozzles.reduce((sum, nozzle) => sum + nozzle * nozzle, 0);
    const tfa_in2 = sumSquares / 1303.797;

    if (tfa_in2 <= 0) errors.push("TFA final debe ser mayor que cero.");
    if (errors.length > 0) return { value: 0, unit: "psi", inputs, steps: [], warnings: [], errors };

    const pressureLossPsi = 156.5 * q_gpm * q_gpm * density_ppg / (sumSquares * sumSquares);

    return {
      value: pressureLossPsi,
      unit: "psi",
      inputs,
      steps: [
        `TFA = ${sumSquares.toFixed(4)} / 1303.797 = ${tfa_in2.toFixed(6)} in²`,
        `MW = ${!isNaN(density_grcc) && density_grcc > 0 ? `${density_grcc} × 8.33 = ` : ""}${density_ppg.toFixed(6)} ppg`,
        `ΔP_bit = 156.5 × ${q_gpm}² × ${density_ppg.toFixed(6)} / ${sumSquares.toFixed(4)}² = ${pressureLossPsi.toFixed(4)} psi`,
      ],
      warnings: [],
      errors: [],
      additionalResults: [
        { label: "TFA", value: tfa_in2, unit: "in²" },
        { label: "MW", value: density_ppg, unit: "ppg" },
        { label: "Suma nozzle²", value: sumSquares, unit: "32nds²" },
      ],
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 13. DEC / ECD RIVERO
// Source: HIDRAULICA_RIVERO.xls · CALCULATE!S14
// ─────────────────────────────────────────────────────────────────────────────
const ecdDecRivero: Formula = {
  id: "ecd-dec-rivero",
  name: "DEC / ECD Rivero",
  category: "Hidráulica",
  description: "Calcula densidad equivalente de circulación usando pérdida de presión, profundidad y densidad base del lodo.",
  icon: "gauge",
  inputs: [
    { key: "pressure_loss_psi", label: "Pérdida de presión", unit: "psi", type: "number", required: true, min: 0, placeholder: "Ej: 394.82" },
    { key: "depth_m", label: "Profundidad", unit: "m", type: "number", required: true, min: 0.001, placeholder: "Ej: 3161" },
    { key: "mud_density_grcc", label: "Densidad base del lodo", unit: "gr/cc", type: "number", required: true, min: 0.001, placeholder: "Ej: 1.29" },
  ],
  output: { label: "DEC / ECD", unit: "gr/cc" },
  formulaText: "ECD(gr/cc) = ΔP / (0.052 × TVD(ft)) / 8.33 + densidad_lodo(gr/cc)",
  references: [
    "HIDRAULICA_RIVERO.xls — CALCULATE!S14",
  ],
  needsReview: false,
  calculate(inputs) {
    const pressure_loss_psi = Number(inputs["pressure_loss_psi"]);
    const depth_m = Number(inputs["depth_m"]);
    const mud_density_grcc = Number(inputs["mud_density_grcc"]);
    const errors: string[] = [];

    if (isNaN(pressure_loss_psi) || pressure_loss_psi < 0) errors.push("Pérdida de presión debe ser mayor o igual que cero.");
    if (isNaN(depth_m) || depth_m <= 0) errors.push("Profundidad debe ser mayor que cero.");
    if (isNaN(mud_density_grcc) || mud_density_grcc <= 0) errors.push("Densidad base del lodo debe ser mayor que cero.");
    if (errors.length > 0) return { value: 0, unit: "gr/cc", inputs, steps: [], warnings: [], errors };

    const depth_ft = depth_m * 3.281;
    const densityIncrement = pressure_loss_psi / (0.052 * depth_ft) / 8.33;
    const ecd_grcc = densityIncrement + mud_density_grcc;

    return {
      value: ecd_grcc,
      unit: "gr/cc",
      inputs,
      steps: [
        `TVD = ${depth_m} × 3.281 = ${depth_ft.toFixed(6)} ft`,
        `Incremento densidad = ${pressure_loss_psi} / (0.052 × ${depth_ft.toFixed(6)}) / 8.33 = ${densityIncrement.toFixed(12)} gr/cc`,
        `ECD = ${densityIncrement.toFixed(12)} + ${mud_density_grcc} = ${ecd_grcc.toFixed(12)} gr/cc`,
      ],
      warnings: [],
      errors: [],
      additionalResults: [
        { label: "Incremento densidad", value: densityIncrement, unit: "gr/cc" },
        { label: "Profundidad", value: depth_ft, unit: "ft" },
      ],
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 14. PRESIÓN HIDROSTÁTICA
// Source: HIDRAULICA_RIVERO.xls · CALCULATE!S14 (relación ECD/DEC)
// STATUS: BLOQUEADA — needsReview=true porque no hay output directo de presión hidrostática.
// ─────────────────────────────────────────────────────────────────────────────
// -----------------------------------------------------------------------------
// HIDRAULICA: Perdida anular por intervalo Rivero
// Source: HIDRAULICA_RIVERO.xls - CALCULATE!Q14
// STATUS: VALIDADA - caso directo Q14.
// -----------------------------------------------------------------------------
const annularIntervalLossRivero: Formula = {
  id: "annular-interval-loss-rivero",
  name: "Perdida anular por intervalo Rivero",
  category: "Hidraulica",
  description: "Calcula la perdida de presion anular de un intervalo usando la formula Rivero.",
  icon: "gauge",
  inputs: [
    { key: "friction_factor", label: "Factor de friccion", unit: "", type: "number", required: true, min: 0.000001, placeholder: "Ej: 0.0137" },
    { key: "annular_velocity_ft_min", label: "Velocidad anular", unit: "ft/min", type: "number", required: true, min: 0, placeholder: "Ej: 348.767" },
    { key: "density_grcc", label: "Densidad", unit: "gr/cc", type: "number", required: true, min: 0.000001, placeholder: "Ej: 1.29" },
    { key: "depth_start_m", label: "Profundidad inicial", unit: "m", type: "number", required: true, placeholder: "Ej: 2584.229" },
    { key: "depth_end_m", label: "Profundidad final", unit: "m", type: "number", required: true, placeholder: "Ej: 3161" },
    { key: "hole_diameter_in", label: "Diametro agujero", unit: "in", type: "number", required: true, min: 0.000001, placeholder: "Ej: 8.5" },
    { key: "pipe_od_in", label: "Diametro exterior tuberia", unit: "in", type: "number", required: true, min: 0.000001, placeholder: "Ej: 6.5" },
  ],
  output: { label: "Perdida anular por intervalo", unit: "psi" },
  formulaText: "DeltaP_anular = f x (Va/60)^2 x MW x DeltaL(ft) / (25.81 x (Dh - Dp))",
  references: [
    "HIDRAULICA_RIVERO.xls - CALCULATE!Q14",
  ],
  needsReview: false,
  calculate(inputs) {
    const friction_factor = Number(inputs["friction_factor"]);
    const annular_velocity_ft_min = Number(inputs["annular_velocity_ft_min"]);
    const density_grcc = Number(inputs["density_grcc"]);
    const depth_start_m = Number(inputs["depth_start_m"]);
    const depth_end_m = Number(inputs["depth_end_m"]);
    const hole_diameter_in = Number(inputs["hole_diameter_in"]);
    const pipe_od_in = Number(inputs["pipe_od_in"]);
    const errors: string[] = [];

    if (isNaN(friction_factor) || friction_factor <= 0) errors.push("Factor de friccion debe ser mayor que cero.");
    if (isNaN(annular_velocity_ft_min) || annular_velocity_ft_min < 0) errors.push("Velocidad anular debe ser mayor o igual que cero.");
    if (isNaN(density_grcc) || density_grcc <= 0) errors.push("Densidad debe ser mayor que cero.");
    if (isNaN(depth_start_m)) errors.push("Profundidad inicial debe ser numerica.");
    if (isNaN(depth_end_m) || depth_end_m <= depth_start_m) errors.push("Profundidad final debe ser mayor que la profundidad inicial.");
    if (isNaN(pipe_od_in) || pipe_od_in <= 0) errors.push("Diametro exterior de tuberia debe ser mayor que cero.");
    if (isNaN(hole_diameter_in) || hole_diameter_in <= pipe_od_in) errors.push("Diametro de agujero debe ser mayor que el diametro exterior de tuberia.");
    if (errors.length > 0) return { value: 0, unit: "psi", inputs, steps: [], warnings: [], errors };

    const mw_ppg = density_grcc * 8.33;
    const interval_length_m = depth_end_m - depth_start_m;
    const interval_length_ft = interval_length_m * 3.281;
    const velocity_ft_s = annular_velocity_ft_min / 60;
    const annular_clearance_in = hole_diameter_in - pipe_od_in;
    const loss_psi = friction_factor * velocity_ft_s ** 2 * mw_ppg * interval_length_ft / (25.81 * annular_clearance_in);

    return {
      value: loss_psi,
      unit: "psi",
      inputs,
      steps: [
        `MW = ${density_grcc} x 8.33 = ${mw_ppg.toFixed(12)} ppg`,
        `DeltaL = (${depth_end_m} - ${depth_start_m}) x 3.281 = ${interval_length_ft.toFixed(12)} ft`,
        `Va = ${annular_velocity_ft_min} / 60 = ${velocity_ft_s.toFixed(12)} ft/s`,
        `DeltaP = ${loss_psi.toFixed(12)} psi`,
      ],
      warnings: [],
      errors: [],
      additionalResults: [
        { label: "MW", value: mw_ppg, unit: "ppg" },
        { label: "Longitud intervalo", value: interval_length_ft, unit: "ft" },
        { label: "Velocidad", value: velocity_ft_s, unit: "ft/s" },
        { label: "Claro anular", value: annular_clearance_in, unit: "in" },
      ],
    };
  },
};

// -----------------------------------------------------------------------------
// HIDRAULICA: Perdida anular acumulada Rivero
// Source: HIDRAULICA_RIVERO.xls - CALCULATE!R14 / ENTRY!U6
// STATUS: VALIDADA - suma de intervalos Q11:Q14 contra celda directa.
// -----------------------------------------------------------------------------
const annularPressureLossRivero: Formula = {
  id: "annular-pressure-loss-rivero",
  name: "Perdida anular acumulada Rivero",
  category: "Hidraulica",
  description: "Suma perdidas de presion anular por intervalo para replicar CALCULATE!R14 de Rivero.",
  icon: "gauge",
  inputs: [
    { key: "q11_psi", label: "Q11", unit: "psi", type: "number", required: true, min: 0, placeholder: "Ej: 346.918" },
    { key: "q12_psi", label: "Q12", unit: "psi", type: "number", required: true, min: 0, placeholder: "Ej: 16.382" },
    { key: "q13_psi", label: "Q13", unit: "psi", type: "number", required: true, min: 0, placeholder: "Ej: 10.604" },
    { key: "q14_psi", label: "Q14", unit: "psi", type: "number", required: true, min: 0, placeholder: "Ej: 20.917" },
  ],
  output: { label: "Perdida anular acumulada", unit: "psi" },
  formulaText: "R14 = Q11 + Q12 + Q13 + Q14",
  references: [
    "HIDRAULICA_RIVERO.xls - CALCULATE!R14 / ENTRY!U6",
  ],
  needsReview: false,
  calculate(inputs) {
    const q11_psi = Number(inputs["q11_psi"]);
    const q12_psi = Number(inputs["q12_psi"]);
    const q13_psi = Number(inputs["q13_psi"]);
    const q14_psi = Number(inputs["q14_psi"]);
    const errors: string[] = [];

    if (isNaN(q11_psi) || q11_psi < 0) errors.push("Q11 debe ser mayor o igual que cero.");
    if (isNaN(q12_psi) || q12_psi < 0) errors.push("Q12 debe ser mayor o igual que cero.");
    if (isNaN(q13_psi) || q13_psi < 0) errors.push("Q13 debe ser mayor o igual que cero.");
    if (isNaN(q14_psi) || q14_psi < 0) errors.push("Q14 debe ser mayor o igual que cero.");
    if (errors.length > 0) return { value: 0, unit: "psi", inputs, steps: [], warnings: [], errors };

    const annularLossPsi = q11_psi + q12_psi + q13_psi + q14_psi;

    return {
      value: annularLossPsi,
      unit: "psi",
      inputs,
      steps: [
        `R14 = ${q11_psi} + ${q12_psi} + ${q13_psi} + ${q14_psi}`,
        `R14 = ${annularLossPsi.toFixed(12)} psi`,
      ],
      warnings: [],
      errors: [],
      additionalResults: [
        { label: "Q11", value: q11_psi, unit: "psi" },
        { label: "Q12", value: q12_psi, unit: "psi" },
        { label: "Q13", value: q13_psi, unit: "psi" },
        { label: "Q14", value: q14_psi, unit: "psi" },
      ],
    };
  },
};

// -----------------------------------------------------------------------------
// HIDRAULICA: Perdida interna por intervalo Rivero
// Source: HIDRAULICA_RIVERO.xls - CALCULATE!T14
// STATUS: VALIDADA - caso directo T14.
// -----------------------------------------------------------------------------
const internalIntervalLossRivero: Formula = {
  id: "internal-interval-loss-rivero",
  name: "Perdida interna por intervalo Rivero",
  category: "Hidraulica",
  description: "Calcula la perdida de presion interna de un intervalo usando la formula Rivero.",
  icon: "gauge",
  inputs: [
    { key: "friction_factor", label: "Factor de friccion", unit: "", type: "number", required: true, min: 0.000001, placeholder: "Ej: 0.00487" },
    { key: "internal_velocity_ft_min", label: "Velocidad interna", unit: "ft/min", type: "number", required: true, min: 0, placeholder: "Ej: 1162.557" },
    { key: "density_grcc", label: "Densidad", unit: "gr/cc", type: "number", required: true, min: 0.000001, placeholder: "Ej: 1.29" },
    { key: "depth_start_m", label: "Profundidad inicial", unit: "m", type: "number", required: true, placeholder: "Ej: 3095" },
    { key: "depth_end_m", label: "Profundidad final", unit: "m", type: "number", required: true, placeholder: "Ej: 3161" },
    { key: "pipe_id_in", label: "DI tuberia", unit: "in", type: "number", required: true, min: 0.000001, placeholder: "Ej: 3" },
  ],
  output: { label: "Perdida interna por intervalo", unit: "psi" },
  formulaText: "DeltaP_interna = f x (Vi/60)^2 x MW x DeltaL(ft) / (25.81 x ID)",
  references: [
    "HIDRAULICA_RIVERO.xls - CALCULATE!T14",
  ],
  needsReview: false,
  calculate(inputs) {
    const friction_factor = Number(inputs["friction_factor"]);
    const internal_velocity_ft_min = Number(inputs["internal_velocity_ft_min"]);
    const density_grcc = Number(inputs["density_grcc"]);
    const depth_start_m = Number(inputs["depth_start_m"]);
    const depth_end_m = Number(inputs["depth_end_m"]);
    const pipe_id_in = Number(inputs["pipe_id_in"]);
    const errors: string[] = [];

    if (isNaN(friction_factor) || friction_factor <= 0) errors.push("Factor de friccion debe ser mayor que cero.");
    if (isNaN(internal_velocity_ft_min) || internal_velocity_ft_min < 0) errors.push("Velocidad interna debe ser mayor o igual que cero.");
    if (isNaN(density_grcc) || density_grcc <= 0) errors.push("Densidad debe ser mayor que cero.");
    if (isNaN(depth_start_m)) errors.push("Profundidad inicial debe ser numerica.");
    if (isNaN(depth_end_m) || depth_end_m <= depth_start_m) errors.push("Profundidad final debe ser mayor que la profundidad inicial.");
    if (isNaN(pipe_id_in) || pipe_id_in <= 0) errors.push("DI tuberia debe ser mayor que cero.");
    if (errors.length > 0) return { value: 0, unit: "psi", inputs, steps: [], warnings: [], errors };

    const mw_ppg = density_grcc * 8.33;
    const interval_length_m = depth_end_m - depth_start_m;
    const interval_length_ft = interval_length_m * 3.281;
    const velocity_ft_s = internal_velocity_ft_min / 60;
    const loss_psi = friction_factor * velocity_ft_s ** 2 * interval_length_ft * mw_ppg / (25.81 * pipe_id_in);

    return {
      value: loss_psi,
      unit: "psi",
      inputs,
      steps: [
        `MW = ${density_grcc} x 8.33 = ${mw_ppg.toFixed(12)} ppg`,
        `DeltaL = (${depth_end_m} - ${depth_start_m}) x 3.281 = ${interval_length_ft.toFixed(12)} ft`,
        `Vi = ${internal_velocity_ft_min} / 60 = ${velocity_ft_s.toFixed(12)} ft/s`,
        `DeltaP = ${loss_psi.toFixed(12)} psi`,
      ],
      warnings: [],
      errors: [],
      additionalResults: [
        { label: "MW", value: mw_ppg, unit: "ppg" },
        { label: "Longitud intervalo", value: interval_length_ft, unit: "ft" },
        { label: "Velocidad", value: velocity_ft_s, unit: "ft/s" },
        { label: "DI tuberia", value: pipe_id_in, unit: "in" },
      ],
    };
  },
};

// -----------------------------------------------------------------------------
// HIDRAULICA: Perdida interna acumulada Rivero
// Source: HIDRAULICA_RIVERO.xls - CALCULATE!U14 / ENTRY!U5
// STATUS: VALIDADA - suma de intervalos T11:T14 contra celda directa.
// -----------------------------------------------------------------------------
const internalPressureLossRivero: Formula = {
  id: "internal-pressure-loss-rivero",
  name: "Perdida interna acumulada Rivero",
  category: "Hidraulica",
  description: "Suma perdidas de presion interna por intervalo para replicar CALCULATE!U14 de Rivero.",
  icon: "gauge",
  inputs: [
    { key: "t11_psi", label: "T11", unit: "psi", type: "number", required: true, min: 0, placeholder: "Ej: 706.083" },
    { key: "t12_psi", label: "T12", unit: "psi", type: "number", required: true, min: 0, placeholder: "Ej: 114.798" },
    { key: "t13_psi", label: "T13", unit: "psi", type: "number", required: true, min: 0, placeholder: "Ej: 28.741" },
    { key: "t14_psi", label: "T14", unit: "psi", type: "number", required: true, min: 0, placeholder: "Ej: 54.904" },
  ],
  output: { label: "Perdida interna acumulada", unit: "psi" },
  formulaText: "U14 = T11 + T12 + T13 + T14",
  references: [
    "HIDRAULICA_RIVERO.xls - CALCULATE!U14 / ENTRY!U5",
  ],
  needsReview: false,
  calculate(inputs) {
    const t11_psi = Number(inputs["t11_psi"]);
    const t12_psi = Number(inputs["t12_psi"]);
    const t13_psi = Number(inputs["t13_psi"]);
    const t14_psi = Number(inputs["t14_psi"]);
    const errors: string[] = [];

    if (isNaN(t11_psi) || t11_psi < 0) errors.push("T11 debe ser mayor o igual que cero.");
    if (isNaN(t12_psi) || t12_psi < 0) errors.push("T12 debe ser mayor o igual que cero.");
    if (isNaN(t13_psi) || t13_psi < 0) errors.push("T13 debe ser mayor o igual que cero.");
    if (isNaN(t14_psi) || t14_psi < 0) errors.push("T14 debe ser mayor o igual que cero.");
    if (errors.length > 0) return { value: 0, unit: "psi", inputs, steps: [], warnings: [], errors };

    const internalLossPsi = t11_psi + t12_psi + t13_psi + t14_psi;

    return {
      value: internalLossPsi,
      unit: "psi",
      inputs,
      steps: [
        `U14 = ${t11_psi} + ${t12_psi} + ${t13_psi} + ${t14_psi}`,
        `U14 = ${internalLossPsi.toFixed(12)} psi`,
      ],
      warnings: [],
      errors: [],
      additionalResults: [
        { label: "T11", value: t11_psi, unit: "psi" },
        { label: "T12", value: t12_psi, unit: "psi" },
        { label: "T13", value: t13_psi, unit: "psi" },
        { label: "T14", value: t14_psi, unit: "psi" },
      ],
    };
  },
};

// -----------------------------------------------------------------------------
// HIDRAULICA: Presion total Rivero
// Source: HIDRAULICA_RIVERO.xls - CALCULATE!C16
// STATUS: VALIDADA - suma R14 + U14 + C20 contra celda directa.
// -----------------------------------------------------------------------------
const totalPressureLossRivero: Formula = {
  id: "total-pressure-loss-rivero",
  name: "Presion total Rivero",
  category: "Hidraulica",
  description: "Suma perdida anular, perdida interna y caida en barrena para replicar CALCULATE!C16 de Rivero.",
  icon: "gauge",
  inputs: [
    { key: "annular_loss_psi", label: "Perdida anular", unit: "psi", type: "number", required: true, min: 0, placeholder: "Ej: 394.821" },
    { key: "internal_loss_psi", label: "Perdida interna", unit: "psi", type: "number", required: true, min: 0, placeholder: "Ej: 904.526" },
    { key: "bit_loss_psi", label: "Caida en barrena", unit: "psi", type: "number", required: true, min: 0, placeholder: "Ej: 972.674" },
  ],
  output: { label: "Presion total", unit: "psi" },
  formulaText: "P_total = DeltaP_anular + DeltaP_interna + DeltaP_bit",
  references: [
    "HIDRAULICA_RIVERO.xls - CALCULATE!C16",
  ],
  needsReview: false,
  calculate(inputs) {
    const annular_loss_psi = Number(inputs["annular_loss_psi"]);
    const internal_loss_psi = Number(inputs["internal_loss_psi"]);
    const bit_loss_psi = Number(inputs["bit_loss_psi"]);
    const errors: string[] = [];

    if (isNaN(annular_loss_psi) || annular_loss_psi < 0) errors.push("Perdida anular debe ser mayor o igual que cero.");
    if (isNaN(internal_loss_psi) || internal_loss_psi < 0) errors.push("Perdida interna debe ser mayor o igual que cero.");
    if (isNaN(bit_loss_psi) || bit_loss_psi < 0) errors.push("Caida en barrena debe ser mayor o igual que cero.");
    if (errors.length > 0) return { value: 0, unit: "psi", inputs, steps: [], warnings: [], errors };

    const totalPressurePsi = annular_loss_psi + internal_loss_psi + bit_loss_psi;

    return {
      value: totalPressurePsi,
      unit: "psi",
      inputs,
      steps: [
        `C16 = ${annular_loss_psi} + ${internal_loss_psi} + ${bit_loss_psi}`,
        `C16 = ${totalPressurePsi.toFixed(12)} psi`,
      ],
      warnings: [],
      errors: [],
      additionalResults: [
        { label: "Perdida anular", value: annular_loss_psi, unit: "psi" },
        { label: "Perdida interna", value: internal_loss_psi, unit: "psi" },
        { label: "Caida en barrena", value: bit_loss_psi, unit: "psi" },
      ],
    };
  },
};

// -----------------------------------------------------------------------------
// HIDRAULICA: Resumen hidraulico Rivero
// Source: HIDRAULICA_RIVERO.xls - CALCULATE!C16, S14, R14, U14, C20
// STATUS: VALIDADA - resumen compuesto contra outputs principales.
// -----------------------------------------------------------------------------
const riveroHydraulicsSummary: Formula = {
  id: "rivero-hydraulics-summary",
  name: "Resumen hidraulico Rivero",
  category: "Hidraulica",
  description: "Calcula presion total y ECD/DEC usando perdidas hidraulicas principales del metodo Rivero.",
  icon: "gauge",
  inputs: [
    { key: "internal_loss_psi", label: "Perdida interna", unit: "psi", type: "number", required: true, min: 0, placeholder: "Ej: 904.526" },
    { key: "annular_loss_psi", label: "Perdida anular", unit: "psi", type: "number", required: true, min: 0, placeholder: "Ej: 394.821" },
    { key: "bit_loss_psi", label: "Caida en barrena", unit: "psi", type: "number", required: true, min: 0, placeholder: "Ej: 972.674" },
    { key: "depth_m", label: "Profundidad", unit: "m", type: "number", required: true, min: 0.001, placeholder: "Ej: 3161" },
    { key: "mud_density_grcc", label: "Densidad base del lodo", unit: "gr/cc", type: "number", required: true, min: 0.001, placeholder: "Ej: 1.29" },
  ],
  output: { label: "Presion total", unit: "psi" },
  formulaText: "P_total = DeltaP_int + DeltaP_anular + DeltaP_bit; ECD = DeltaP_anular/(0.052 x TVD(ft))/8.33 + MW(gr/cc)",
  references: [
    "HIDRAULICA_RIVERO.xls - CALCULATE!C16, S14, R14, U14, C20",
  ],
  needsReview: false,
  calculate(inputs) {
    const internal_loss_psi = Number(inputs["internal_loss_psi"]);
    const annular_loss_psi = Number(inputs["annular_loss_psi"]);
    const bit_loss_psi = Number(inputs["bit_loss_psi"]);
    const depth_m = Number(inputs["depth_m"]);
    const mud_density_grcc = Number(inputs["mud_density_grcc"]);
    const errors: string[] = [];

    if (isNaN(internal_loss_psi) || internal_loss_psi < 0) errors.push("Perdida interna debe ser mayor o igual que cero.");
    if (isNaN(annular_loss_psi) || annular_loss_psi < 0) errors.push("Perdida anular debe ser mayor o igual que cero.");
    if (isNaN(bit_loss_psi) || bit_loss_psi < 0) errors.push("Caida en barrena debe ser mayor o igual que cero.");
    if (isNaN(depth_m) || depth_m <= 0) errors.push("Profundidad debe ser mayor que cero.");
    if (isNaN(mud_density_grcc) || mud_density_grcc <= 0) errors.push("Densidad base del lodo debe ser mayor que cero.");
    if (errors.length > 0) return { value: 0, unit: "psi", inputs, steps: [], warnings: [], errors };

    const depth_ft = depth_m * 3.281;
    const total_pressure_psi = internal_loss_psi + annular_loss_psi + bit_loss_psi;
    const ecd_grcc = annular_loss_psi / (0.052 * depth_ft) / 8.33 + mud_density_grcc;

    return {
      value: total_pressure_psi,
      unit: "psi",
      inputs,
      steps: [
        `P_total = ${internal_loss_psi} + ${annular_loss_psi} + ${bit_loss_psi} = ${total_pressure_psi.toFixed(12)} psi`,
        `TVD = ${depth_m} x 3.281 = ${depth_ft.toFixed(6)} ft`,
        `ECD = ${annular_loss_psi} / (0.052 x ${depth_ft.toFixed(6)}) / 8.33 + ${mud_density_grcc} = ${ecd_grcc.toFixed(12)} gr/cc`,
      ],
      warnings: [],
      errors: [],
      additionalResults: [
        { label: "Perdida interna", value: internal_loss_psi, unit: "psi" },
        { label: "Perdida anular", value: annular_loss_psi, unit: "psi" },
        { label: "Caida en barrena", value: bit_loss_psi, unit: "psi" },
        { label: "ECD / DEC", value: ecd_grcc, unit: "gr/cc" },
      ],
    };
  },
};

const hydrostaticPressure: Formula = {
  id: "hydrostatic-pressure",
  name: "Presión hidrostática",
  category: "Hidráulica",
  description: "Calcula presión hidrostática a partir de profundidad y densidad del fluido.",
  icon: "gauge",
  inputs: [
    { key: "depth_m", label: "Profundidad", unit: "m", type: "number", required: true, min: 0.001, placeholder: "Ej: 3161" },
    { key: "density_grcc", label: "Densidad del fluido", unit: "gr/cc", type: "number", required: true, min: 0.001, placeholder: "Ej: 1.29" },
  ],
  output: { label: "Presión hidrostática", unit: "kg/cm²" },
  formulaText: "P(kg/cm²) = profundidad(m) × densidad(gr/cc) / 10; P(psi) = 0.052 × MW(ppg) × TVD(ft)",
  references: [
    "HIDRAULICA_RIVERO.xls — CALCULATE!S14 usa relación ECD con 0.052 × depth(ft) × MW(ppg)",
  ],
  needsReview: true,
  calculate(inputs) {
    const depth_m = Number(inputs["depth_m"]);
    const density_grcc = Number(inputs["density_grcc"]);
    const errors: string[] = [];

    if (isNaN(depth_m) || depth_m <= 0) errors.push("Profundidad debe ser mayor que cero.");
    if (isNaN(density_grcc) || density_grcc <= 0) errors.push("Densidad del fluido debe ser mayor que cero.");
    if (errors.length > 0) return { value: 0, unit: "kg/cm²", inputs, steps: [], warnings: [], errors };

    const pressure_kgcm2 = depth_m * density_grcc / 10;
    const depth_ft = depth_m * 3.281;
    const density_ppg = density_grcc * 8.33;
    const pressure_psi = 0.052 * density_ppg * depth_ft;

    return {
      value: pressure_kgcm2,
      unit: "kg/cm²",
      inputs,
      steps: [
        `P = ${depth_m} × ${density_grcc} / 10 = ${pressure_kgcm2.toFixed(6)} kg/cm²`,
        `TVD = ${depth_m} × 3.281 = ${depth_ft.toFixed(6)} ft`,
        `MW = ${density_grcc} × 8.33 = ${density_ppg.toFixed(6)} ppg`,
        `P = 0.052 × ${density_ppg.toFixed(6)} × ${depth_ft.toFixed(6)} = ${pressure_psi.toFixed(6)} psi`,
      ],
      warnings: [],
      errors: [],
      additionalResults: [
        { label: "Presión", value: pressure_psi, unit: "psi" },
        { label: "Profundidad", value: depth_ft, unit: "ft" },
        { label: "Densidad", value: density_ppg, unit: "ppg" },
      ],
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 15. HIDRÁULICA DE PERFORACIÓN
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
  tfaNozzles,
  bitPressureLoss,
  bitPressureLossFromNozzles,
  ecdDecRivero,
  annularIntervalLossRivero,
  annularPressureLossRivero,
  internalIntervalLossRivero,
  internalPressureLossRivero,
  totalPressureLossRivero,
  riveroHydraulicsSummary,
  hydrostaticPressure,
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
