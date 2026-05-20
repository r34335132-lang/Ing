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
  needsReview: false, // VALIDADA contra Excel real
  calculate(inputs) {
    const d_mayor_in = Number(inputs["d_mayor_in"]);
    const od_tf_in = Number(inputs["od_tf_in"]);
    const bpm = Number(inputs["bpm"]);
    const acarreo_percent = Number(inputs["acarreo_percent"]);
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validaciones estrictas
    if (isNaN(d_mayor_in) || d_mayor_in <= 0) errors.push("Diámetro del agujero/TR debe ser > 0.");
    if (isNaN(od_tf_in) || od_tf_in <= 0) errors.push("OD del CT/TF debe ser > 0.");
    if (!isNaN(d_mayor_in) && !isNaN(od_tf_in) && d_mayor_in <= od_tf_in) errors.push("D_mayor debe ser estrictamente mayor que OD del CT.");
    if (isNaN(bpm) || bpm < 0) errors.push("Gasto debe ser >= 0.");
    if (isNaN(acarreo_percent) || acarreo_percent <= 0) errors.push("Factor de acarreo debe ser > 0.");
    
    if (errors.length > 0) return { value: 0, unit: "ft/min", inputs, steps: [], warnings, errors };

    // Fórmulas Matemáticas Directas sin Redondeos (Precisión de Excel)
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
  needsReview: false, // VALIDADA contra Excel real
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

    // Fórmulas Matemáticas Directas sin Redondeos Prematuros (Para Precisión Excel)
    const capacidad_tp_m3_m = (di_tp_in * di_tp_in * 0.5067) / 1000;
    const longitud_tapon_m = volumen_tapon_m3 / capacidad_tp_m3_m;

    // Validación de profundidad
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