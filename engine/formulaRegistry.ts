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
}

// ──────────────────────────────────────────────────────────────────────────────
// PIPE VOLUME CALCULATOR
// ──────────────────────────────────────────────────────────────────────────────
const pipeVolume: Formula = {
  id: "pipe-volume",
  name: "Volumen Interno de Tubería",
  category: "Tuberías",
  description: "Calcula el volumen interno de una tubería dado su diámetro interior y longitud.",
  icon: "pipe",
  inputs: [
    { key: "di", label: "Diámetro Interior (DI)", unit: "in", type: "number", required: true, min: 0.001, placeholder: "Ej: 4.276" },
    { key: "length_m", label: "Longitud", unit: "m", type: "number", required: true, min: 0.001, placeholder: "Ej: 1000" },
  ],
  output: { label: "Volumen Interno", unit: "bbl" },
  formulaText: "V(bbl) = (DI² / 1029.4) × (L(m) / 0.3048)",
  references: ["Bache ecologico.xls", "CALCULO VOLUMEN TF.xls"],
  calculate(inputs) {
    const di = Number(inputs["di"]);
    const length_m = Number(inputs["length_m"]);
    const errors: string[] = [];
    const warnings: string[] = [];
    if (isNaN(di) || di <= 0) errors.push("El diámetro interior debe ser mayor que cero.");
    if (isNaN(length_m) || length_m <= 0) errors.push("La longitud debe ser mayor que cero.");
    if (errors.length > 0) return { value: 0, unit: "bbl", inputs, steps: [], warnings, errors };

    const length_ft = length_m / 0.3048;
    const capacity_bbl_per_ft = di * di / 1029.4;
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
        `Capacidad por pie: C = DI² ÷ 1029.4 = ${di}² ÷ 1029.4 = ${capacity_bbl_per_ft.toFixed(6)} bbl/ft`,
        `Volumen total: V = ${capacity_bbl_per_ft.toFixed(6)} × ${length_ft.toFixed(4)} = ${vol_bbl.toFixed(4)} bbl`,
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

// ──────────────────────────────────────────────────────────────────────────────
// ANNULAR VOLUME CALCULATOR
// ──────────────────────────────────────────────────────────────────────────────
const annularVolume: Formula = {
  id: "annular-volume",
  name: "Volumen Anular",
  category: "Tuberías",
  description: "Calcula el volumen anular entre dos tubos concéntricos o entre tubería y agujero.",
  icon: "circle",
  inputs: [
    { key: "d_mayor", label: "Diámetro Mayor (agujero/TR)", unit: "in", type: "number", required: true, min: 0.001, placeholder: "Ej: 8.5" },
    { key: "d_menor", label: "Diámetro Menor (tubería)", unit: "in", type: "number", required: true, min: 0.001, placeholder: "Ej: 5.0" },
    { key: "length_m", label: "Longitud", unit: "m", type: "number", required: true, min: 0.001, placeholder: "Ej: 1000" },
  ],
  output: { label: "Volumen Anular", unit: "bbl" },
  formulaText: "V(bbl) = ((D_mayor² - D_menor²) / 1029.4) × (L(m) / 0.3048)",
  references: ["correjida calculo de t.p.,t.r. y espacio anular.xls"],
  calculate(inputs) {
    const d_mayor = Number(inputs["d_mayor"]);
    const d_menor = Number(inputs["d_menor"]);
    const length_m = Number(inputs["length_m"]);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (isNaN(d_mayor) || d_mayor <= 0) errors.push("El diámetro mayor debe ser mayor que cero.");
    if (isNaN(d_menor) || d_menor <= 0) errors.push("El diámetro menor debe ser mayor que cero.");
    if (!isNaN(d_mayor) && !isNaN(d_menor) && d_mayor <= d_menor) errors.push("El diámetro mayor debe ser estrictamente mayor que el diámetro menor.");
    if (isNaN(length_m) || length_m <= 0) errors.push("La longitud debe ser mayor que cero.");
    if (errors.length > 0) return { value: 0, unit: "bbl", inputs, steps: [], warnings, errors };

    const length_ft = length_m / 0.3048;
    const diff = d_mayor * d_mayor - d_menor * d_menor;
    const capacity = diff / 1029.4;
    const vol_bbl = capacity * length_ft;
    const vol_liters = vol_bbl * 158.987;
    const vol_m3 = vol_bbl * 0.158987;

    if (d_mayor > 36) warnings.push("Diámetro mayor inusualmente grande. Verificar unidades.");

    return {
      value: Math.round(vol_bbl * 10000) / 10000,
      unit: "bbl",
      inputs,
      steps: [
        `Longitud en pies: L(ft) = ${length_m} m ÷ 0.3048 = ${length_ft.toFixed(4)} ft`,
        `Diferencia de diámetros cuadrados: ${d_mayor}² - ${d_menor}² = ${(d_mayor*d_mayor).toFixed(4)} - ${(d_menor*d_menor).toFixed(4)} = ${diff.toFixed(4)} in²`,
        `Capacidad anular: C = ${diff.toFixed(4)} ÷ 1029.4 = ${capacity.toFixed(6)} bbl/ft`,
        `Volumen anular: V = ${capacity.toFixed(6)} × ${length_ft.toFixed(4)} = ${vol_bbl.toFixed(4)} bbl`,
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

// ──────────────────────────────────────────────────────────────────────────────
// FLUID VELOCITY (PIPE)
// ──────────────────────────────────────────────────────────────────────────────
const fluidVelocity: Formula = {
  id: "fluid-velocity",
  name: "Velocidad de Fluido en Tubería",
  category: "Hidráulica",
  description: "Calcula la velocidad del fluido dentro de una tubería dado el diámetro interior y el gasto.",
  icon: "speedometer",
  inputs: [
    { key: "di", label: "Diámetro Interior (DI)", unit: "in", type: "number", required: true, min: 0.001, placeholder: "Ej: 4.276" },
    { key: "flow_bpm", label: "Gasto de Bombeo", unit: "BPM", type: "number", required: true, min: 0, placeholder: "Ej: 5.5" },
  ],
  output: { label: "Velocidad en Tubería", unit: "ft/min" },
  formulaText: "V(ft/min) = BPM / (DI² / 1029.4)",
  references: ["HIDRAULICA_RIVERO.xls", "Hydraulics_IPM.xls"],
  calculate(inputs) {
    const di = Number(inputs["di"]);
    const flow_bpm = Number(inputs["flow_bpm"]);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (isNaN(di) || di <= 0) errors.push("El diámetro interior debe ser mayor que cero.");
    if (isNaN(flow_bpm) || flow_bpm < 0) errors.push("El gasto debe ser mayor o igual que cero.");
    if (errors.length > 0) return { value: 0, unit: "ft/min", inputs, steps: [], warnings, errors };

    const capacity = di * di / 1029.4;
    if (capacity === 0) { errors.push("División entre cero: diámetro inválido."); return { value: 0, unit: "ft/min", inputs, steps: [], warnings, errors }; }
    const velocity_ft_min = flow_bpm / capacity;
    const velocity_m_min = velocity_ft_min * 0.3048;

    if (velocity_ft_min > 1000) warnings.push("Velocidad muy alta. Riesgo de erosión en tubería.");
    if (velocity_ft_min < 10 && flow_bpm > 0) warnings.push("Velocidad baja. Puede ser insuficiente para limpieza del agujero.");

    return {
      value: Math.round(velocity_ft_min * 100) / 100,
      unit: "ft/min",
      inputs,
      steps: [
        `Capacidad de tubería: C = DI² ÷ 1029.4 = ${di}² ÷ 1029.4 = ${capacity.toFixed(6)} bbl/ft`,
        `Velocidad: V = BPM ÷ C = ${flow_bpm} ÷ ${capacity.toFixed(6)} = ${velocity_ft_min.toFixed(4)} ft/min`,
      ],
      warnings,
      errors: [],
      additionalResults: [
        { label: "Velocidad", value: Math.round(velocity_m_min * 1000) / 1000, unit: "m/min" },
      ],
    };
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// ANNULAR VELOCITY
// ──────────────────────────────────────────────────────────────────────────────
const annularVelocity: Formula = {
  id: "annular-velocity",
  name: "Velocidad Anular",
  category: "Hidráulica",
  description: "Calcula la velocidad de retorno del fluido en el espacio anular.",
  icon: "speedometer-outline",
  inputs: [
    { key: "d_mayor", label: "Diámetro Mayor (agujero/TR)", unit: "in", type: "number", required: true, min: 0.001, placeholder: "Ej: 8.5" },
    { key: "d_menor", label: "Diámetro Menor (tubería)", unit: "in", type: "number", required: true, min: 0.001, placeholder: "Ej: 5.0" },
    { key: "flow_bpm", label: "Gasto de Bombeo", unit: "BPM", type: "number", required: true, min: 0, placeholder: "Ej: 5.5" },
  ],
  output: { label: "Velocidad Anular", unit: "ft/min" },
  formulaText: "VA(ft/min) = BPM / ((D_mayor² - D_menor²) / 1029.4)",
  references: ["HIDRAULICA_RIVERO.xls", "correjida calculo de t.p.,t.r. y espacio anular.xls"],
  calculate(inputs) {
    const d_mayor = Number(inputs["d_mayor"]);
    const d_menor = Number(inputs["d_menor"]);
    const flow_bpm = Number(inputs["flow_bpm"]);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (isNaN(d_mayor) || d_mayor <= 0) errors.push("El diámetro mayor debe ser mayor que cero.");
    if (isNaN(d_menor) || d_menor <= 0) errors.push("El diámetro menor debe ser mayor que cero.");
    if (!isNaN(d_mayor) && !isNaN(d_menor) && d_mayor <= d_menor) errors.push("El diámetro mayor debe ser estrictamente mayor que el diámetro menor.");
    if (isNaN(flow_bpm) || flow_bpm < 0) errors.push("El gasto debe ser mayor o igual que cero.");
    if (errors.length > 0) return { value: 0, unit: "ft/min", inputs, steps: [], warnings, errors };

    const diff = d_mayor * d_mayor - d_menor * d_menor;
    const annular_capacity = diff / 1029.4;
    const velocity_ft_min = flow_bpm / annular_capacity;
    const velocity_m_min = velocity_ft_min * 0.3048;

    if (velocity_ft_min < 100) warnings.push("Velocidad anular baja (< 100 ft/min). Puede ser insuficiente para acarreo de recortes.");
    if (velocity_ft_min > 500) warnings.push("Velocidad anular alta. Posible erosión y pérdidas de presión significativas.");

    return {
      value: Math.round(velocity_ft_min * 100) / 100,
      unit: "ft/min",
      inputs,
      steps: [
        `Diferencia de diámetros²: ${d_mayor}² - ${d_menor}² = ${(d_mayor*d_mayor).toFixed(4)} - ${(d_menor*d_menor).toFixed(4)} = ${diff.toFixed(4)} in²`,
        `Capacidad anular: C = ${diff.toFixed(4)} ÷ 1029.4 = ${annular_capacity.toFixed(6)} bbl/ft`,
        `Velocidad anular: VA = ${flow_bpm} ÷ ${annular_capacity.toFixed(6)} = ${velocity_ft_min.toFixed(4)} ft/min`,
      ],
      warnings,
      errors: [],
      additionalResults: [
        { label: "Velocidad anular", value: Math.round(velocity_m_min * 1000) / 1000, unit: "m/min" },
      ],
    };
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// COILED TUBING REEL CAPACITY
// ──────────────────────────────────────────────────────────────────────────────
const coiledTubing: Formula = {
  id: "coiled-tubing",
  name: "Capacidad de Carrete CT",
  category: "Coiled Tubing",
  description: "Estimación de la longitud y volumen de coiled tubing en el carrete. Validar contra archivo fuente.",
  icon: "reload-circle",
  inputs: [
    { key: "d_carrete", label: "Diámetro exterior del carrete", unit: "ft", type: "number", required: true, min: 0.001, placeholder: "Ej: 8.0" },
    { key: "d_nucleo", label: "Diámetro del núcleo (core)", unit: "ft", type: "number", required: true, min: 0.001, placeholder: "Ej: 4.0" },
    { key: "ancho", label: "Ancho del carrete", unit: "ft", type: "number", required: true, min: 0.001, placeholder: "Ej: 2.5" },
    { key: "od_ct", label: "Diámetro exterior del CT (OD)", unit: "in", type: "number", required: true, min: 0.001, placeholder: "Ej: 1.75" },
    { key: "id_ct", label: "Diámetro interior del CT (ID)", unit: "in", type: "number", required: true, min: 0.001, placeholder: "Ej: 1.5" },
    { key: "packing_factor", label: "Factor de acomodo (0.7–0.9)", unit: "", type: "number", required: true, min: 0.5, max: 1.0, placeholder: "Ej: 0.8" },
  ],
  output: { label: "Longitud estimada CT", unit: "ft" },
  formulaText: "L = (π/4) × (D_carrete² - D_nucleo²) × Ancho × PF / (π/4 × OD_CT²)",
  references: ["CoilTubingReelCapacitycalculator.xls"],
  needsReview: true,
  calculate(inputs) {
    const d_carrete = Number(inputs["d_carrete"]);
    const d_nucleo = Number(inputs["d_nucleo"]);
    const ancho = Number(inputs["ancho"]);
    const od_ct_in = Number(inputs["od_ct"]);
    const id_ct_in = Number(inputs["id_ct"]);
    const pf = Number(inputs["packing_factor"]);
    const errors: string[] = [];
    const warnings: string[] = ["Resultado estimado. Validar contra CoilTubingReelCapacitycalculator.xls."];

    if (isNaN(d_carrete) || d_carrete <= 0) errors.push("Diámetro del carrete debe ser > 0.");
    if (isNaN(d_nucleo) || d_nucleo <= 0) errors.push("Diámetro del núcleo debe ser > 0.");
    if (!isNaN(d_carrete) && !isNaN(d_nucleo) && d_carrete <= d_nucleo) errors.push("Diámetro del carrete debe ser mayor que el núcleo.");
    if (isNaN(ancho) || ancho <= 0) errors.push("Ancho debe ser > 0.");
    if (isNaN(od_ct_in) || od_ct_in <= 0) errors.push("OD del CT debe ser > 0.");
    if (isNaN(id_ct_in) || id_ct_in <= 0) errors.push("ID del CT debe ser > 0.");
    if (!isNaN(od_ct_in) && !isNaN(id_ct_in) && od_ct_in <= id_ct_in) errors.push("OD debe ser mayor que ID del CT.");
    if (isNaN(pf) || pf < 0.5 || pf > 1.0) errors.push("Factor de acomodo debe estar entre 0.5 y 1.0.");
    if (errors.length > 0) return { value: 0, unit: "ft", inputs, steps: [], warnings, errors };

    const od_ct_ft = od_ct_in / 12;
    const id_ct_ft = id_ct_in / 12;
    const area_anular_carrete = Math.PI / 4 * (d_carrete * d_carrete - d_nucleo * d_nucleo);
    const area_transversal_ct = Math.PI / 4 * (od_ct_ft * od_ct_ft);
    const longitud_ft = (area_anular_carrete * ancho * pf) / area_transversal_ct;
    const vol_interno_bbl = Math.PI / 4 * (id_ct_ft * id_ct_ft) * longitud_ft / 5.61458;

    return {
      value: Math.round(longitud_ft),
      unit: "ft",
      inputs,
      steps: [
        `OD CT en ft: ${od_ct_in} in ÷ 12 = ${od_ct_ft.toFixed(4)} ft`,
        `Área anular carrete: π/4 × (${d_carrete}² - ${d_nucleo}²) = ${area_anular_carrete.toFixed(4)} ft²`,
        `Área transversal CT: π/4 × ${od_ct_ft.toFixed(4)}² = ${area_transversal_ct.toFixed(6)} ft²`,
        `Longitud: (${area_anular_carrete.toFixed(4)} × ${ancho} × ${pf}) ÷ ${area_transversal_ct.toFixed(6)} = ${longitud_ft.toFixed(0)} ft`,
      ],
      warnings,
      errors: [],
      additionalResults: [
        { label: "Longitud", value: Math.round(longitud_ft * 0.3048), unit: "m" },
        { label: "Volumen interno CT", value: Math.round(vol_interno_bbl * 100) / 100, unit: "bbl" },
      ],
    };
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// HYDRAULICS (PLACEHOLDER)
// ──────────────────────────────────────────────────────────────────────────────
const hydraulics: Formula = {
  id: "hydraulics",
  name: "Hidráulica de Perforación",
  category: "Hidráulica",
  description: "Análisis hidráulico de sistema de perforación. Fórmulas pendientes de validar con archivos fuente.",
  icon: "water",
  inputs: [
    { key: "flow_rate", label: "Gasto (Flow Rate)", unit: "GPM", type: "number", required: true, min: 0, placeholder: "Ej: 400" },
    { key: "mud_weight", label: "Peso del lodo", unit: "ppg", type: "number", required: true, min: 1, placeholder: "Ej: 10.5" },
    { key: "plastic_visc", label: "Viscosidad Plástica (PV)", unit: "cP", type: "number", required: true, min: 0, placeholder: "Ej: 20" },
    { key: "yield_point", label: "Punto de Cedencia (YP)", unit: "lb/100ft²", type: "number", required: true, min: 0, placeholder: "Ej: 15" },
    { key: "dp_id", label: "ID Drill Pipe", unit: "in", type: "number", required: true, min: 0.001, placeholder: "Ej: 4.276" },
    { key: "hole_size", label: "Diámetro de agujero", unit: "in", type: "number", required: true, min: 0.001, placeholder: "Ej: 8.5" },
    { key: "depth_md", label: "Profundidad MD", unit: "ft", type: "number", required: true, min: 0, placeholder: "Ej: 8000" },
  ],
  output: { label: "Presión de circulación ECD", unit: "ppg" },
  formulaText: "Fórmula pendiente de validar con archivo fuente",
  references: ["HIDRAULICA_RIVERO.xls", "Hydraulics_IPM.xls"],
  needsReview: true,
  calculate(inputs) {
    const flow_gpm = Number(inputs["flow_rate"]);
    const mud_ppg = Number(inputs["mud_weight"]);
    const pv = Number(inputs["plastic_visc"]);
    const yp = Number(inputs["yield_point"]);
    const dp_id = Number(inputs["dp_id"]);
    const hole = Number(inputs["hole_size"]);
    const depth = Number(inputs["depth_md"]);
    const errors: string[] = [];

    if ([flow_gpm, mud_ppg, pv, yp, dp_id, hole, depth].some((v) => isNaN(v) || v < 0))
      errors.push("Todos los valores deben ser números válidos y no negativos.");
    if (dp_id >= hole) errors.push("ID drill pipe debe ser menor que diámetro de agujero.");

    const warnings = [
      "Fórmulas de hidráulica pendientes de validar contra HIDRAULICA_RIVERO.xls y Hydraulics_IPM.xls.",
      "Los resultados mostrados son estimaciones simplificadas. NO usar para decisiones operacionales sin validación.",
    ];

    if (errors.length > 0) return { value: 0, unit: "ppg", inputs, steps: [], warnings, errors };

    // Simplified Bingham Plastic model — needs validation against source Excel
    const vel_annular = (flow_gpm * 0.408) / (hole * hole - dp_id * dp_id);
    const annular_pres_loss = (mud_ppg * vel_annular * vel_annular) / (25.8 * (hole - dp_id));
    const ecd_approx = mud_ppg + (annular_pres_loss * depth) / (0.052 * depth * 2);

    return {
      value: Math.round(ecd_approx * 100) / 100,
      unit: "ppg",
      inputs,
      steps: [
        `Velocidad anular: AV = ${flow_gpm} × 0.408 ÷ (${hole}² - ${dp_id}²) = ${vel_annular.toFixed(2)} ft/min`,
        `[PENDIENTE] Pérdida de presión anular: modelo Bingham simplificado`,
        `[PENDIENTE] ECD = Densidad lodo + ΔP anular ÷ (0.052 × TVD)`,
        `NOTA: Validar fórmulas contra archivos Excel fuente antes de uso operacional.`,
      ],
      warnings,
      errors: [],
    };
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// FORMULA REGISTRY
// ──────────────────────────────────────────────────────────────────────────────
const registry: Formula[] = [
  pipeVolume,
  annularVolume,
  fluidVelocity,
  annularVelocity,
  coiledTubing,
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
