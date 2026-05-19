export type UnitCategoryId =
  | "length"
  | "diameter"
  | "area"
  | "volume"
  | "pressure"
  | "flow"
  | "density"
  | "weight"
  | "temperature"
  | "torque"
  | "velocity";

export interface UnitDef {
  id: string;
  label: string;
  symbol: string;
  toBase: (v: number) => number;
  fromBase: (v: number) => number;
}

export interface UnitCategoryDef {
  id: UnitCategoryId;
  label: string;
  units: UnitDef[];
}

// Base units: m, m², m³, Pa, m³/s, kg/m³, kg, K, N·m, m/s

export const UNIT_CATEGORIES: UnitCategoryDef[] = [
  {
    id: "length",
    label: "Longitud",
    units: [
      { id: "m", label: "Metros", symbol: "m", toBase: (v) => v, fromBase: (v) => v },
      { id: "ft", label: "Pies", symbol: "ft", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
      { id: "in", label: "Pulgadas", symbol: "in", toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
      { id: "km", label: "Kilómetros", symbol: "km", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: "mm", label: "Milímetros", symbol: "mm", toBase: (v) => v * 0.001, fromBase: (v) => v / 0.001 },
      { id: "cm", label: "Centímetros", symbol: "cm", toBase: (v) => v * 0.01, fromBase: (v) => v / 0.01 },
      { id: "mi", label: "Millas", symbol: "mi", toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
    ],
  },
  {
    id: "diameter",
    label: "Diámetro",
    units: [
      { id: "in", label: "Pulgadas", symbol: "in", toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
      { id: "mm", label: "Milímetros", symbol: "mm", toBase: (v) => v * 0.001, fromBase: (v) => v / 0.001 },
      { id: "m", label: "Metros", symbol: "m", toBase: (v) => v, fromBase: (v) => v },
      { id: "cm", label: "Centímetros", symbol: "cm", toBase: (v) => v * 0.01, fromBase: (v) => v / 0.01 },
      { id: "ft", label: "Pies", symbol: "ft", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
    ],
  },
  {
    id: "area",
    label: "Área",
    units: [
      { id: "m2", label: "Metros²", symbol: "m²", toBase: (v) => v, fromBase: (v) => v },
      { id: "ft2", label: "Pies²", symbol: "ft²", toBase: (v) => v * 0.092903, fromBase: (v) => v / 0.092903 },
      { id: "in2", label: "Pulgadas²", symbol: "in²", toBase: (v) => v * 0.00064516, fromBase: (v) => v / 0.00064516 },
      { id: "cm2", label: "Centímetros²", symbol: "cm²", toBase: (v) => v * 0.0001, fromBase: (v) => v / 0.0001 },
      { id: "mm2", label: "Milímetros²", symbol: "mm²", toBase: (v) => v * 0.000001, fromBase: (v) => v / 0.000001 },
    ],
  },
  {
    id: "volume",
    label: "Volumen",
    units: [
      { id: "m3", label: "Metros³", symbol: "m³", toBase: (v) => v, fromBase: (v) => v },
      { id: "bbl", label: "Barriles", symbol: "bbl", toBase: (v) => v * 0.158987, fromBase: (v) => v / 0.158987 },
      { id: "L", label: "Litros", symbol: "L", toBase: (v) => v * 0.001, fromBase: (v) => v / 0.001 },
      { id: "gal", label: "Galones (US)", symbol: "gal", toBase: (v) => v * 0.003785, fromBase: (v) => v / 0.003785 },
      { id: "ft3", label: "Pies³", symbol: "ft³", toBase: (v) => v * 0.028317, fromBase: (v) => v / 0.028317 },
      { id: "mL", label: "Mililitros", symbol: "mL", toBase: (v) => v * 0.000001, fromBase: (v) => v / 0.000001 },
    ],
  },
  {
    id: "pressure",
    label: "Presión",
    units: [
      { id: "psi", label: "PSI", symbol: "psi", toBase: (v) => v * 6894.76, fromBase: (v) => v / 6894.76 },
      { id: "bar", label: "Bar", symbol: "bar", toBase: (v) => v * 100000, fromBase: (v) => v / 100000 },
      { id: "Pa", label: "Pascal", symbol: "Pa", toBase: (v) => v, fromBase: (v) => v },
      { id: "kPa", label: "Kilopascal", symbol: "kPa", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: "MPa", label: "Megapascal", symbol: "MPa", toBase: (v) => v * 1000000, fromBase: (v) => v / 1000000 },
      { id: "atm", label: "Atmósfera", symbol: "atm", toBase: (v) => v * 101325, fromBase: (v) => v / 101325 },
      { id: "kg/cm2", label: "kg/cm²", symbol: "kg/cm²", toBase: (v) => v * 98066.5, fromBase: (v) => v / 98066.5 },
    ],
  },
  {
    id: "flow",
    label: "Flujo",
    units: [
      { id: "BPM", label: "Barriles/min", symbol: "BPM", toBase: (v) => v * 0.158987 / 60, fromBase: (v) => v * 60 / 0.158987 },
      { id: "GPM", label: "Galones/min", symbol: "GPM", toBase: (v) => v * 0.003785 / 60, fromBase: (v) => v * 60 / 0.003785 },
      { id: "m3/min", label: "m³/min", symbol: "m³/min", toBase: (v) => v / 60, fromBase: (v) => v * 60 },
      { id: "m3/h", label: "m³/hora", symbol: "m³/h", toBase: (v) => v / 3600, fromBase: (v) => v * 3600 },
      { id: "L/min", label: "Litros/min", symbol: "L/min", toBase: (v) => v * 0.001 / 60, fromBase: (v) => v * 60 / 0.001 },
      { id: "BPD", label: "Barriles/día", symbol: "BPD", toBase: (v) => v * 0.158987 / 86400, fromBase: (v) => v * 86400 / 0.158987 },
    ],
  },
  {
    id: "density",
    label: "Densidad",
    units: [
      { id: "kg/m3", label: "kg/m³", symbol: "kg/m³", toBase: (v) => v, fromBase: (v) => v },
      { id: "lb/gal", label: "lb/gal (ppg)", symbol: "ppg", toBase: (v) => v * 119.826, fromBase: (v) => v / 119.826 },
      { id: "lb/ft3", label: "lb/ft³", symbol: "lb/ft³", toBase: (v) => v * 16.0185, fromBase: (v) => v / 16.0185 },
      { id: "g/cm3", label: "g/cm³", symbol: "g/cm³", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: "sg", label: "Gravedad específica", symbol: "SG", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    ],
  },
  {
    id: "weight",
    label: "Peso / Masa",
    units: [
      { id: "kg", label: "Kilogramos", symbol: "kg", toBase: (v) => v, fromBase: (v) => v },
      { id: "lb", label: "Libras", symbol: "lb", toBase: (v) => v * 0.453592, fromBase: (v) => v / 0.453592 },
      { id: "ton", label: "Toneladas métricas", symbol: "ton", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: "g", label: "Gramos", symbol: "g", toBase: (v) => v * 0.001, fromBase: (v) => v / 0.001 },
      { id: "lb/ft", label: "lb/pie", symbol: "lb/ft", toBase: (v) => v * 1.48816, fromBase: (v) => v / 1.48816 },
      { id: "kg/m", label: "kg/metro", symbol: "kg/m", toBase: (v) => v, fromBase: (v) => v },
    ],
  },
  {
    id: "temperature",
    label: "Temperatura",
    units: [
      { id: "C", label: "Celsius", symbol: "°C", toBase: (v) => v + 273.15, fromBase: (v) => v - 273.15 },
      { id: "F", label: "Fahrenheit", symbol: "°F", toBase: (v) => (v - 32) * 5 / 9 + 273.15, fromBase: (v) => (v - 273.15) * 9 / 5 + 32 },
      { id: "K", label: "Kelvin", symbol: "K", toBase: (v) => v, fromBase: (v) => v },
      { id: "R", label: "Rankine", symbol: "°R", toBase: (v) => v * 5 / 9, fromBase: (v) => v * 9 / 5 },
    ],
  },
  {
    id: "torque",
    label: "Torque",
    units: [
      { id: "Nm", label: "Newton·metro", symbol: "N·m", toBase: (v) => v, fromBase: (v) => v },
      { id: "ft_lb", label: "Pie·libra", symbol: "ft·lb", toBase: (v) => v * 1.35582, fromBase: (v) => v / 1.35582 },
      { id: "in_lb", label: "Pulgada·libra", symbol: "in·lb", toBase: (v) => v * 0.112985, fromBase: (v) => v / 0.112985 },
      { id: "kgm", label: "kgf·m", symbol: "kgf·m", toBase: (v) => v * 9.80665, fromBase: (v) => v / 9.80665 },
    ],
  },
  {
    id: "velocity",
    label: "Velocidad",
    units: [
      { id: "m/s", label: "m/segundo", symbol: "m/s", toBase: (v) => v, fromBase: (v) => v },
      { id: "ft/min", label: "pies/minuto", symbol: "ft/min", toBase: (v) => v * 0.00508, fromBase: (v) => v / 0.00508 },
      { id: "ft/s", label: "pies/segundo", symbol: "ft/s", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
      { id: "m/min", label: "m/minuto", symbol: "m/min", toBase: (v) => v / 60, fromBase: (v) => v * 60 },
      { id: "km/h", label: "km/hora", symbol: "km/h", toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
    ],
  },
];

export function convertUnit(value: number, fromId: string, toId: string, categoryId: UnitCategoryId): number {
  const category = UNIT_CATEGORIES.find((c) => c.id === categoryId);
  if (!category) throw new Error(`Categoría no encontrada: ${categoryId}`);
  const fromUnit = category.units.find((u) => u.id === fromId);
  const toUnit = category.units.find((u) => u.id === toId);
  if (!fromUnit) throw new Error(`Unidad origen no encontrada: ${fromId}`);
  if (!toUnit) throw new Error(`Unidad destino no encontrada: ${toId}`);
  const base = fromUnit.toBase(value);
  return toUnit.fromBase(base);
}

export function getUnitById(categoryId: UnitCategoryId, unitId: string): UnitDef | undefined {
  const category = UNIT_CATEGORIES.find((c) => c.id === categoryId);
  return category?.units.find((u) => u.id === unitId);
}
