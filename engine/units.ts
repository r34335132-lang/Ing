// ═════════════════════════════════════════════════════════════════════════════
// OilCalc Pro — Unit Converter
// Complete PEMEX/petroleum unit set. Reference: PMXconversion_unidades.xls
// Base units: SI where applicable, or industry-standard base.
//   length → m | area → m² | volume → m³ | pressure → Pa | flow → m³/s
//   density → kg/m³ | temperature → K | velocity → m/s | viscosity → Pa·s
//   weight → kg | torque → N·m | weight_gradient → Pa/m | volume_gradient → m³/m
//   time → s | concentration → fraction (0–1)
// ═════════════════════════════════════════════════════════════════════════════

export type UnitCategoryId =
  | "length"
  | "area"
  | "volume"
  | "pressure"
  | "flow"
  | "density"
  | "temperature"
  | "velocity"
  | "viscosity"
  | "weight"
  | "torque"
  | "weight_gradient"
  | "volume_gradient"
  | "time"
  | "concentration_mass"
  | "concentration_vol"
  | "angle";

export interface UnitDef {
  id: string;
  label: string;
  symbol: string;
  /** Convert value in this unit → base SI unit */
  toBase: (v: number) => number;
  /** Convert value from base SI unit → this unit */
  fromBase: (v: number) => number;
}

export interface UnitCategoryDef {
  id: UnitCategoryId;
  label: string;
  baseSymbol: string;
  units: UnitDef[];
}

// Helper
const lin = (factor: number): Pick<UnitDef, "toBase" | "fromBase"> => ({
  toBase: (v) => v * factor,
  fromBase: (v) => v / factor,
});

// ─────────────────────────────────────────────────────────────────────────────
// LENGTH  (base: metre)
// ─────────────────────────────────────────────────────────────────────────────
const length: UnitCategoryDef = {
  id: "length",
  label: "Longitud",
  baseSymbol: "m",
  units: [
    { id: "m",    label: "Metro",           symbol: "m",    ...lin(1) },
    { id: "km",   label: "Kilómetro",       symbol: "km",   ...lin(1000) },
    { id: "cm",   label: "Centímetro",      symbol: "cm",   ...lin(0.01) },
    { id: "mm",   label: "Milímetro",       symbol: "mm",   ...lin(0.001) },
    { id: "in",   label: "Pulgada",         symbol: "in",   ...lin(0.0254) },
    { id: "ft",   label: "Pie",             symbol: "ft",   ...lin(0.3048) },
    { id: "yd",   label: "Yarda",           symbol: "yd",   ...lin(0.9144) },
    { id: "mile", label: "Milla terrestre", symbol: "mi",   ...lin(1609.344) },
    { id: "nmi",  label: "Milla náutica",   symbol: "nmi",  ...lin(1852) },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// AREA  (base: m²)
// ─────────────────────────────────────────────────────────────────────────────
const area: UnitCategoryDef = {
  id: "area",
  label: "Área",
  baseSymbol: "m²",
  units: [
    { id: "m2",   label: "Metro²",      symbol: "m²",   ...lin(1) },
    { id: "cm2",  label: "Centímetro²", symbol: "cm²",  ...lin(1e-4) },
    { id: "mm2",  label: "Milímetro²",  symbol: "mm²",  ...lin(1e-6) },
    { id: "in2",  label: "Pulgada²",    symbol: "in²",  ...lin(6.4516e-4) },
    { id: "ft2",  label: "Pie²",        symbol: "ft²",  ...lin(0.092903) },
    { id: "yd2",  label: "Yarda²",      symbol: "yd²",  ...lin(0.836127) },
    { id: "ha",   label: "Hectárea",    symbol: "ha",   ...lin(1e4) },
    { id: "km2",  label: "Kilómetro²",  symbol: "km²",  ...lin(1e6) },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// VOLUME  (base: m³)
// ─────────────────────────────────────────────────────────────────────────────
const volume: UnitCategoryDef = {
  id: "volume",
  label: "Volumen",
  baseSymbol: "m³",
  units: [
    { id: "m3",   label: "Metro³",           symbol: "m³",   ...lin(1) },
    { id: "L",    label: "Litro",            symbol: "L",    ...lin(0.001) },
    { id: "mL",   label: "Mililitro",        symbol: "mL",   ...lin(1e-6) },
    { id: "bbl",  label: "Barril (petróleo)",symbol: "bbl",  ...lin(0.158987) },
    { id: "gal",  label: "Galón (US)",       symbol: "gal",  ...lin(0.00378541) },
    { id: "gal_uk",label:"Galón (UK)",       symbol: "gal(UK)",...lin(0.00454609) },
    { id: "ft3",  label: "Pie³",             symbol: "ft³",  ...lin(0.028317) },
    { id: "in3",  label: "Pulgada³",         symbol: "in³",  ...lin(1.63871e-5) },
    { id: "cm3",  label: "Centímetro³",      symbol: "cm³",  ...lin(1e-6) },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// PRESSURE  (base: Pa)
// ─────────────────────────────────────────────────────────────────────────────
const pressure: UnitCategoryDef = {
  id: "pressure",
  label: "Presión",
  baseSymbol: "Pa",
  units: [
    { id: "Pa",     label: "Pascal",     symbol: "Pa",      ...lin(1) },
    { id: "kPa",    label: "Kilopascal", symbol: "kPa",     ...lin(1000) },
    { id: "MPa",    label: "Megapascal", symbol: "MPa",     ...lin(1e6) },
    { id: "bar",    label: "Bar",        symbol: "bar",     ...lin(1e5) },
    { id: "mbar",   label: "Milibar",    symbol: "mbar",    ...lin(100) },
    { id: "psi",    label: "PSI",        symbol: "psi",     ...lin(6894.757) },
    { id: "kPsi",   label: "Kilo-PSI",   symbol: "kpsi",    ...lin(6.894757e6) },
    { id: "atm",    label: "Atmósfera",  symbol: "atm",     ...lin(101325) },
    { id: "kg_cm2", label: "kg/cm²",     symbol: "kg/cm²",  ...lin(98066.5) },
    { id: "mmHg",   label: "mmHg (torr)",symbol: "mmHg",    ...lin(133.322) },
    { id: "inH2O",  label: "in H₂O",    symbol: "inH₂O",   ...lin(249.089) },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// FLOW RATE  (base: m³/s)
// ─────────────────────────────────────────────────────────────────────────────
const flow: UnitCategoryDef = {
  id: "flow",
  label: "Gasto / Flujo",
  baseSymbol: "m³/s",
  units: [
    { id: "m3_s",   label: "m³/segundo",  symbol: "m³/s",   ...lin(1) },
    { id: "m3_min", label: "m³/minuto",   symbol: "m³/min", ...lin(1/60) },
    { id: "m3_h",   label: "m³/hora",     symbol: "m³/h",   ...lin(1/3600) },
    { id: "L_s",    label: "L/segundo",   symbol: "L/s",    ...lin(0.001) },
    { id: "L_min",  label: "L/minuto",    symbol: "L/min",  ...lin(0.001/60) },
    { id: "LPM",    label: "LPM (L/min)", symbol: "LPM",    ...lin(0.001/60) }, // ALIAS AGREGADO
    { id: "BPM",    label: "Barril/minuto",  symbol: "BPM", ...lin(0.158987/60) },
    { id: "BPD",    label: "Barril/día",     symbol: "BPD", ...lin(0.158987/86400) },
    { id: "GPM",    label: "Galón/minuto (US)", symbol: "GPM", ...lin(0.00378541/60) },
    { id: "GPD",    label: "Galón/día (US)",    symbol: "GPD", ...lin(0.00378541/86400) },
    { id: "ft3_min",label: "ft³/minuto",    symbol: "ft³/min",...lin(0.028317/60) },
    { id: "ft3_s",  label: "ft³/segundo",   symbol: "ft³/s",  ...lin(0.028317) },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// DENSITY  (base: kg/m³)
// Note: API gravity is non-linear — special handling below
// ─────────────────────────────────────────────────────────────────────────────
const density: UnitCategoryDef = {
  id: "density",
  label: "Densidad",
  baseSymbol: "kg/m³",
  units: [
    { id: "kg_m3",  label: "kg/m³",        symbol: "kg/m³",  ...lin(1) },
    { id: "g_cc",   label: "g/cc (gr/cc)",  symbol: "g/cc",   ...lin(1000) },
    { id: "g_L",    label: "g/L",           symbol: "g/L",    ...lin(1) },
    { id: "ppg",    label: "lb/gal (ppg)",  symbol: "ppg",    ...lin(119.826) }, // ID PPG DIRECTO
    { id: "lb_gal", label: "lb/gal",        symbol: "lb/gal", ...lin(119.826) }, // ALIAS PARA PPG
    { id: "lb_ft3", label: "lb/ft³",        symbol: "lb/ft³", ...lin(16.01846) },
    { id: "lb_in3", label: "lb/in³",        symbol: "lb/in³", ...lin(27679.9) },
    { id: "sg",     label: "Gravedad esp. (SG)", symbol: "SG",...lin(1000) },
    // API gravity: non-linear, handled via special case
    {
      id: "API",
      label: "Grados API",
      symbol: "°API",
      toBase: (api) => 141500 / (api + 131.5), // → kg/m³  (using 141.5 factor × 1000)
      fromBase: (kg_m3) => 141500 / kg_m3 - 131.5,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// TEMPERATURE  (base: Kelvin)
// ─────────────────────────────────────────────────────────────────────────────
const temperature: UnitCategoryDef = {
  id: "temperature",
  label: "Temperatura",
  baseSymbol: "K",
  units: [
    { id: "K",  label: "Kelvin",    symbol: "K",  toBase: (v) => v,                        fromBase: (v) => v },
    { id: "C",  label: "Celsius",   symbol: "°C", toBase: (v) => v + 273.15,               fromBase: (v) => v - 273.15 },
    { id: "F",  label: "Fahrenheit",symbol: "°F", toBase: (v) => (v - 32) * 5 / 9 + 273.15, fromBase: (v) => (v - 273.15) * 9 / 5 + 32 },
    { id: "R",  label: "Rankine",   symbol: "°R", toBase: (v) => v * 5 / 9,                fromBase: (v) => v * 9 / 5 },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// VELOCITY  (base: m/s)
// ─────────────────────────────────────────────────────────────────────────────
const velocity: UnitCategoryDef = {
  id: "velocity",
  label: "Velocidad",
  baseSymbol: "m/s",
  units: [
    { id: "m_s",    label: "m/segundo",     symbol: "m/s",    ...lin(1) },
    { id: "m_min",  label: "m/minuto",      symbol: "m/min",  ...lin(1/60) },
    { id: "km_h",   label: "km/hora",       symbol: "km/h",   ...lin(1/3.6) },
    { id: "ft_s",   label: "pie/segundo",   symbol: "ft/s",   ...lin(0.3048) },
    { id: "ft_min", label: "pie/minuto",    symbol: "ft/min", ...lin(0.3048/60) },
    { id: "ft_h",   label: "pie/hora",      symbol: "ft/h",   ...lin(0.3048/3600) },
    { id: "in_s",   label: "pulgada/segundo",symbol:"in/s",   ...lin(0.0254) },
    { id: "knot",   label: "Nudo",          symbol: "kn",     ...lin(0.514444) },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// VISCOSITY  (base: Pa·s = kg/(m·s))
// ─────────────────────────────────────────────────────────────────────────────
const viscosity: UnitCategoryDef = {
  id: "viscosity",
  label: "Viscosidad",
  baseSymbol: "Pa·s",
  units: [
    { id: "Pa_s",  label: "Pascal·segundo", symbol: "Pa·s",  ...lin(1) },
    { id: "mPa_s", label: "mPa·segundo",    symbol: "mPa·s", ...lin(0.001) },
    { id: "cP",    label: "Centipoise",      symbol: "cP",    ...lin(0.001) },
    { id: "P",     label: "Poise",           symbol: "P",     ...lin(0.1) },
    { id: "cSt",   label: "Centistoke",      symbol: "cSt",   ...lin(1e-6) }, // kinematic — approximate for SG≈1
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// WEIGHT / MASS  (base: kg)
// ─────────────────────────────────────────────────────────────────────────────
const weight: UnitCategoryDef = {
  id: "weight",
  label: "Peso / Masa",
  baseSymbol: "kg",
  units: [
    { id: "kg",     label: "Kilogramo",      symbol: "kg",    ...lin(1) },
    { id: "g",      label: "Gramo",          symbol: "g",     ...lin(0.001) },
    { id: "mg",     label: "Miligramo",      symbol: "mg",    ...lin(1e-6) },
    { id: "t",      label: "Tonelada métrica",symbol: "t",    ...lin(1000) },
    { id: "lb",     label: "Libra",          symbol: "lb",    ...lin(0.453592) },
    { id: "oz",     label: "Onza",           symbol: "oz",    ...lin(0.0283495) },
    { id: "ton_uk", label: "Tonelada larga (UK)", symbol: "ton(UK)", ...lin(1016.05) },
    { id: "ton_us", label: "Tonelada corta (US)", symbol: "ton(US)", ...lin(907.185) },
    { id: "kip",    label: "Kip (1000 lb)",  symbol: "kip",   ...lin(453.592) },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// TORQUE  (base: N·m)
// ─────────────────────────────────────────────────────────────────────────────
const torque: UnitCategoryDef = {
  id: "torque",
  label: "Torque",
  baseSymbol: "N·m",
  units: [
    { id: "Nm",    label: "Newton·metro",  symbol: "N·m",   ...lin(1) },
    { id: "kNm",   label: "Kilonewton·m",  symbol: "kN·m",  ...lin(1000) },
    { id: "ft_lb", label: "Pie·libra",     symbol: "ft·lb", ...lin(1.35582) },
    { id: "ft-lb", label: "Pie·libra (alias)", symbol: "ft·lb", ...lin(1.35582) }, // ALIAS AGREGADO
    { id: "in_lb", label: "Pulgada·libra", symbol: "in·lb", ...lin(0.112985) },
    { id: "in_oz", label: "Pulgada·onza",  symbol: "in·oz", ...lin(0.00706155) },
    { id: "kgf_m", label: "kgf·metro",     symbol: "kgf·m", ...lin(9.80665) },
    { id: "kgf_cm",label: "kgf·cm",        symbol: "kgf·cm",...lin(0.0980665) },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// WEIGHT GRADIENT / PRESSURE GRADIENT  (base: Pa/m = kg/(m²·s²))
// Petroleum: psi/ft, kg/cm²/m, ppg equivalent gradient
// ─────────────────────────────────────────────────────────────────────────────
const weightGradient: UnitCategoryDef = {
  id: "weight_gradient",
  label: "Gradiente de presión",
  baseSymbol: "Pa/m",
  units: [
    { id: "Pa_m",      label: "Pa/metro",        symbol: "Pa/m",     ...lin(1) },
    { id: "psi_ft",    label: "psi/pie",          symbol: "psi/ft",   ...lin(6894.757 / 0.3048) },
    { id: "psi_100ft", label: "psi/100 pies",     symbol: "psi/100ft",...lin(6894.757 / 30.48) },
    { id: "kg_cm2_m",  label: "kg/cm²/metro",     symbol: "kg/cm²/m", ...lin(98066.5) },
    { id: "bar_m",     label: "bar/metro",         symbol: "bar/m",    ...lin(1e5) },
    { id: "kPa_m",     label: "kPa/metro",         symbol: "kPa/m",    ...lin(1000) },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// VOLUME GRADIENT  (base: m³/m = m²)
// Petroleum: bbl/ft, bbl/m, L/m
// ─────────────────────────────────────────────────────────────────────────────
const volumeGradient: UnitCategoryDef = {
  id: "volume_gradient",
  label: "Capacidad / Vol. gradiente",
  baseSymbol: "m³/m",
  units: [
    { id: "m3_m",   label: "m³/metro",          symbol: "m³/m",   ...lin(1) },
    { id: "bbl_ft", label: "bbl/pie",            symbol: "bbl/ft", ...lin(0.158987 / 0.3048) },
    { id: "bbl_m",  label: "bbl/metro",          symbol: "bbl/m",  ...lin(0.158987) },
    { id: "L_m",    label: "L/metro",            symbol: "L/m",    ...lin(0.001) },
    { id: "gal_ft", label: "galón/pie (US)",     symbol: "gal/ft", ...lin(0.00378541 / 0.3048) },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// TIME  (base: second)
// ─────────────────────────────────────────────────────────────────────────────
const time: UnitCategoryDef = {
  id: "time",
  label: "Tiempo",
  baseSymbol: "s",
  units: [
    { id: "s",   label: "Segundo",   symbol: "s",   ...lin(1) },
    { id: "min", label: "Minuto",    symbol: "min", ...lin(60) },
    { id: "h",   label: "Hora",      symbol: "h",   ...lin(3600) },
    { id: "d",   label: "Día",       symbol: "día", ...lin(86400) },
    { id: "ms",  label: "Milisegundo",symbol:"ms",  ...lin(0.001) },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// CONCENTRATION MASS/MASS  (base: fraction 0–1, kg/kg)
// ─────────────────────────────────────────────────────────────────────────────
const concentrationMass: UnitCategoryDef = {
  id: "concentration_mass",
  label: "Concentración masa/masa",
  baseSymbol: "kg/kg",
  units: [
    { id: "fraction", label: "Fracción (0–1)", symbol: "kg/kg", ...lin(1) },
    { id: "percent",  label: "Porcentaje (%)", symbol: "%",      ...lin(0.01) },
    { id: "ppm_m",    label: "ppm masa",        symbol: "ppm",   ...lin(1e-6) },
    { id: "ppb_m",    label: "ppb masa",        symbol: "ppb",   ...lin(1e-9) },
    { id: "lb_bbl",   label: "lb/bbl",          symbol: "lb/bbl",...lin(0.453592 / 0.158987) },
    { id: "kg_m3_conc",label:"kg/m³ (concentración)",symbol:"kg/m³", ...lin(0.001) }, // approx for dilute
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// CONCENTRATION VOL/VOL  (base: fraction 0–1)
// ─────────────────────────────────────────────────────────────────────────────
const concentrationVol: UnitCategoryDef = {
  id: "concentration_vol",
  label: "Concentración vol/vol",
  baseSymbol: "m³/m³",
  units: [
    { id: "fraction_v", label: "Fracción (0–1)", symbol: "m³/m³", ...lin(1) },
    { id: "percent_v",  label: "Porcentaje (%)", symbol: "%v/v",  ...lin(0.01) },
    { id: "ppm_v",      label: "ppm volumen",    symbol: "ppmv",  ...lin(1e-6) },
    { id: "L_m3",       label: "L/m³",           symbol: "L/m³",  ...lin(0.001) },
    { id: "gal_bbl",    label: "gal/bbl",         symbol: "gal/bbl",...lin(0.00378541 / 0.158987) },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// ANGLE
// ─────────────────────────────────────────────────────────────────────────────
const angle: UnitCategoryDef = {
  id: "angle",
  label: "Ángulo",
  baseSymbol: "rad",
  units: [
    { id: "rad",  label: "Radián",  symbol: "rad",  ...lin(1) },
    { id: "deg",  label: "Grado",   symbol: "°",    ...lin(Math.PI / 180) },
    { id: "grad", label: "Grado centesimal (grad)", symbol: "grad", ...lin(Math.PI / 200) },
    { id: "min_arc", label: "Minuto de arco", symbol: "'",  ...lin(Math.PI / 10800) },
    { id: "sec_arc", label: "Segundo de arco",symbol: "\"", ...lin(Math.PI / 648000) },
    { id: "deg_100ft", label: "°/100ft (DLS)",symbol: "°/100ft", ...lin(Math.PI / 180 / 30.48) }, // per metre
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export const UNIT_CATEGORIES: UnitCategoryDef[] = [
  length,
  area,
  volume,
  pressure,
  flow,
  density,
  temperature,
  velocity,
  viscosity,
  weight,
  torque,
  weightGradient,
  volumeGradient,
  time,
  concentrationMass,
  concentrationVol,
  angle,
];

/**
 * Convert a value between two units in the same category.
 * Throws if category or unit IDs are not found.
 */
export function convertUnit(
  value: number,
  fromId: string,
  toId: string,
  categoryId: UnitCategoryId
): number {
  const category = UNIT_CATEGORIES.find((c) => c.id === categoryId);
  if (!category) throw new Error(`Categoría no encontrada: ${categoryId}`);
  const fromUnit = category.units.find((u) => u.id === fromId);
  const toUnit = category.units.find((u) => u.id === toId);
  if (!fromUnit) throw new Error(`Unidad origen no encontrada: ${fromId} en ${categoryId}`);
  if (!toUnit) throw new Error(`Unidad destino no encontrada: ${toId} en ${categoryId}`);
  if (fromId === toId) return value;
  const base = fromUnit.toBase(value);
  return toUnit.fromBase(base);
}

/** Get a UnitDef by category + unit ID */
export function getUnitById(categoryId: UnitCategoryId, unitId: string): UnitDef | undefined {
  return UNIT_CATEGORIES.find((c) => c.id === categoryId)?.units.find((u) => u.id === unitId);
}

/** Get all unit IDs in a category */
export function getUnitsForCategory(categoryId: UnitCategoryId): UnitDef[] {
  return UNIT_CATEGORIES.find((c) => c.id === categoryId)?.units ?? [];
}