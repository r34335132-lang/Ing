// ═════════════════════════════════════════════════════════════════════════════
// OilCalc Pro — Formula Test Suite
// Run with: pnpm test:formulas
// All expected values calculated from source Excel formulas.
// Tolerance: 0.1% relative (configurable per test case)
// ═════════════════════════════════════════════════════════════════════════════

import { runCalculation } from "./calculationEngine";
import { getAllFormulas } from "./formulaRegistry";

interface TestResult {
  formulaId: string;
  description: string;
  passed: boolean;
  expected: number;
  got: number;
  errorPct: number;
  errors: string[];
}

const DEFAULT_TOLERANCE = 0.001; // 0.1%

// Función auxiliar para comparar resultados técnicos con tolerancia
function approxEqual(actual: number, expected: number, tolerance = DEFAULT_TOLERANCE): boolean {
  if (expected === 0) return Math.abs(actual) <= tolerance;
  return Math.abs(actual - expected) / Math.abs(expected) <= tolerance;
}

function runAllTests(): void {
  const results: TestResult[] = [];
  const formulas = getAllFormulas();
  let total = 0;
  let passed = 0;

  // ─── Inline test cases (validates engine, not just registry testCases) ────

  const inlineTests: Array<{
    formulaId: string;
    description: string;
    inputs: Record<string, number | string>;
    expectedValue: number;
    expectedAdditionalResults?: Record<string, number>;
    tolerance?: number;
  }> = [
    // ── Volumen Interno de Tubería ─────────────────────────────────────────
    {
      formulaId: "pipe-volume",
      description: "DI=1.8in, L=1410m → V = (1.8²/1029.4) × (1410/0.3048)",
      inputs: { di: 1.8, length_m: 1410 },
      expectedValue: (1.8 * 1.8 / 1029.4) * (1410 / 0.3048),
    },
    {
      formulaId: "pipe-volume",
      description: "DI=4.276in, L=1000m",
      inputs: { di: 4.276, length_m: 1000 },
      expectedValue: (4.276 * 4.276 / 1029.4) * (1000 / 0.3048),
    },
    // ── Volumen Anular ─────────────────────────────────────────────────────
    {
      formulaId: "annular-volume",
      description: "D_mayor=1.8, D_menor=1.25, L=1410m",
      inputs: { d_mayor: 1.8, d_menor: 1.25, length_m: 1410 },
      expectedValue: ((1.8 * 1.8 - 1.25 * 1.25) / 1029.4) * (1410 / 0.3048),
    },
    // ── Velocidad en Tubería ───────────────────────────────────────────────
    {
      formulaId: "fluid-velocity",
      description: "DI=2.441in, BPM=1.5 → V = 1.5 / (2.441²/1029.4)",
      inputs: { di: 2.441, flow_bpm: 1.5 },
      expectedValue: 1.5 / ((2.441 * 2.441) / 1029.4),
    },
    // ── Velocidad Anular ───────────────────────────────────────────────────
    {
      formulaId: "annular-velocity",
      description: "D_mayor=2.99, D_menor=1.5, BPM=1.5",
      inputs: { d_mayor: 2.99, d_menor: 1.5, flow_bpm: 1.5 },
      expectedValue: 1.5 / ((2.99 * 2.99 - 1.5 * 1.5) / 1029.4),
    },
    // ── Desplazamiento TF ──────────────────────────────────────────────────
    {
      formulaId: "tf-displacement",
      description: "OD=1.5in, L=1800m → V = (1.5²/1029.4) × (1800/0.3048)",
      inputs: { od_tf_in: 1.5, length_m: 1800 },
      expectedValue: (1.5 * 1.5 / 1029.4) * (1800 / 0.3048),
    },
    // ── Desplazamiento Metálico TF ─────────────────────────────────────────
    {
      formulaId: "tf-metal-displacement",
      description: "OD=1.5, ID=1.321, L=1800m",
      inputs: { od_tf_in: 1.5, id_tf_in: 1.321, length_m: 1800 },
      expectedValue: ((1.5 * 1.5 - 1.321 * 1.321) / 1029.4) * (1800 / 0.3048),
    },
    // ── Coiled Tubing Geométrico ───────────────────────────────────────────
    {
      formulaId: "coiled-tubing",
      description: "Coiled Tubing usando Math.trunc",
      inputs: { flange_height_in: 50, free_board_in: 4, core_diameter_in: 30, core_width_in: 60, coil_od_in: 1.5 },
      expectedValue: Math.trunc((50 - 4) / 1.5) * Math.trunc((30 + 50 - 4) / 1.5) * 0.2618 * 60,
      expectedAdditionalResults: {
        "Longitud": (Math.trunc((50 - 4) / 1.5) * Math.trunc((30 + 50 - 4) / 1.5) * 0.2618 * 60) * 0.3048,
        "Capas verticales": Math.trunc((50 - 4) / 1.5),
        "Vueltas horizontales": Math.trunc((30 + 50 - 4) / 1.5)
      }
    },
    // ── Velocidad Penetración Relleno ──────────────────────────────────────
    {
      formulaId: "fill-penetration-velocity",
      description: "Velocidad de penetración en relleno",
      inputs: { d_mayor_in: 2.99, od_tf_in: 1.5, bpm: 1.5, acarreo_percent: 10 },
      expectedValue: (10 * 1.5) / (0.6 * 2.65 * 0.097 * (Math.pow(2.99, 2) - Math.pow(1.5, 2))),
      expectedAdditionalResults: {
        "m/min": ((10 * 1.5) / (0.6 * 2.65 * 0.097 * (Math.pow(2.99, 2) - Math.pow(1.5, 2)))) * 0.3048
      }
    },
    // ── Bache Ecológico ────────────────────────────────────────────────────
    {
      formulaId: "bache-ecologico",
      description: "Bache Ecológico completo con presiones",
      inputs: { di_tp_in: 2.441, densidad_lodo_grcc: 1.25, volumen_tapon_m3: 3, longitud_desplazar_m: 100, profundidad_m: 1500 },
      expectedValue: ( ((1500 * 1.25 / 10) - ((1500 - (3 / (Math.pow(2.441, 2) * 0.5067 / 1000)) - 100) * 1.25 / 10)) * 10 ) / (3 / (Math.pow(2.441, 2) * 0.5067 / 1000)),
      expectedAdditionalResults: {
        "Cap. TP": Math.pow(2.441, 2) * 0.5067 / 1000,
        "Longitud tapón": 3 / (Math.pow(2.441, 2) * 0.5067 / 1000),
        "P. hid. total": 1500 * 1.25 / 10,
        "Columna eq.": 1500 - (3 / (Math.pow(2.441, 2) * 0.5067 / 1000)) - 100,
        "P. hid. parcial": (1500 - (3 / (Math.pow(2.441, 2) * 0.5067 / 1000)) - 100) * 1.25 / 10,
        "P. faltante": (1500 * 1.25 / 10) - ((1500 - (3 / (Math.pow(2.441, 2) * 0.5067 / 1000)) - 100) * 1.25 / 10)
      }
    },
    // ── Validaciones de error y bloqueos ───────────────────────────────────
    {
      formulaId: "annular-volume",
      description: "ERROR: D_mayor <= D_menor",
      inputs: { d_mayor: 2, d_menor: 3, length_m: 100 },
      expectedValue: 0,
    },
    {
      formulaId: "coiled-tubing",
      description: "ERROR: coilOdIn <= 0",
      inputs: { flange_height_in: 50, free_board_in: 4, core_diameter_in: 30, core_width_in: 60, coil_od_in: 0 },
      expectedValue: 0,
    },
    {
      formulaId: "bache-ecologico",
      description: "ERROR: prof <= longitud_tapon + longitud_desplazar",
      inputs: { di_tp_in: 2.441, densidad_lodo_grcc: 1.25, volumen_tapon_m3: 3, longitud_desplazar_m: 100, profundidad_m: 100 },
      expectedValue: 0,
    },
    {
      formulaId: "hydraulics",
      description: "BLOCKED: Debe retornar 0 y estar bloqueada por needsReview",
      inputs: { flow_gpm: 400, mud_ppg: 10.5, pv_cp: 20, yp_lbft2: 15, dp_id_in: 4.276, hole_in: 8.5, depth_ft: 8000 },
      expectedValue: 0,
    }
  ];

  // Run inline tests
  for (const tc of inlineTests) {
    total++;
    const result = runCalculation({ formulaId: tc.formulaId, inputs: tc.inputs });
    const tol = tc.tolerance ?? DEFAULT_TOLERANCE;
    const hasErrorsOrBlocked = result.errors.length > 0 || result.blocked === true;

    let testPassed = true;
    let errorPct = 0;

    if (tc.expectedValue === 0) {
      // Validar escenarios de error o bloqueo
      if (result.value !== 0 || !hasErrorsOrBlocked) {
        testPassed = false;
      }
      // Si está bloqueada, comprobar que inyectó el warning exacto exigido
      if (result.blocked && !result.warnings.includes("Fórmula pendiente de validar con archivo fuente. No usar para operación.")) {
        testPassed = false;
        result.errors.push("Missing required blocked warning message.");
      }
    } else {
      // Validar escenarios de cálculo exitoso
      errorPct = Math.abs(result.value - tc.expectedValue) / Math.abs(tc.expectedValue);
      if (!approxEqual(result.value, tc.expectedValue, tol) || hasErrorsOrBlocked) {
        testPassed = false;
      }
    }

    // Validar sub-resultados (additionalResults)
    if (testPassed && tc.expectedAdditionalResults && result.additionalResults) {
      for (const [key, expectedVal] of Object.entries(tc.expectedAdditionalResults)) {
        const found = result.additionalResults.find(ar => ar.label === key);
        if (!found) {
          testPassed = false;
          result.errors.push(`Falta el resultado adicional: ${key}`);
          break;
        }
        if (!approxEqual(found.value, expectedVal, tol)) {
          testPassed = false;
          result.errors.push(`Fallo en [${key}]. Se esperaba ${expectedVal}, se obtuvo ${found.value}`);
          break;
        }
      }
    }

    if (testPassed) passed++;

    results.push({
      formulaId: tc.formulaId,
      description: tc.description,
      passed: testPassed,
      expected: tc.expectedValue,
      got: result.value,
      errorPct,
      errors: result.errors,
    });
  }

  // Run registry-embedded testCases
  for (const formula of formulas) {
    if (!formula.testCases || formula.testCases.length === 0) continue;
    for (const tc of formula.testCases) {
      total++;
      const result = runCalculation({ formulaId: formula.id, inputs: tc.inputs });
      const tol = tc.tolerance ?? DEFAULT_TOLERANCE;
      const errorPct = tc.expectedValue !== 0
        ? Math.abs(result.value - tc.expectedValue) / Math.abs(tc.expectedValue)
        : 0;
      
      const testPassed = result.errors.length === 0 && approxEqual(result.value, tc.expectedValue, tol);
      
      if (testPassed) passed++;
      results.push({
        formulaId: formula.id,
        description: `[registry] ${tc.description}`,
        passed: testPassed,
        expected: tc.expectedValue,
        got: result.value,
        errorPct,
        errors: result.errors,
      });
    }
  }

  // ── Print results ──────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  OilCalc Pro — Formula Test Suite");
  console.log("═══════════════════════════════════════════════════════\n");

  for (const r of results) {
    const icon = r.passed ? "✓" : "✗";
    const pctStr = r.errorPct > 0 ? ` [err: ${(r.errorPct * 100).toFixed(4)}%]` : "";
    const status = r.passed ? "PASS" : "FAIL";
    console.log(`${icon} [${status}] ${r.formulaId} — ${r.description}`);
    if (!r.passed) {
      console.log(`       Expected: ${r.expected.toFixed(6)}`);
      console.log(`       Got:      ${r.got.toFixed(6)}${pctStr}`);
      if (r.errors.length > 0) console.log(`       Errors:   ${r.errors.join("; ")}`);
    }
  }

  console.log(`\n─────────────────────────────────────────────────────`);
  console.log(`  Total: ${total}  |  Passed: ${passed}  |  Failed: ${total - passed}`);
  const allPassed = passed === total;
  console.log(`  Result: ${allPassed ? "ALL TESTS PASSED ✓" : `${total - passed} FAILURES ✗`}`);
  console.log("═══════════════════════════════════════════════════════\n");

  if (!allPassed) process.exit(1);
}

// ── Unit conversion tests ──────────────────────────────────────────────────
function runUnitTests(): void {
  console.log("─── Unit Conversion Tests ───────────────────────────\n");
  const { convertUnit } = require("./units");
  const convTests = [
    { from: "ft", to: "m",    cat: "length",      val: 1,    expected: 0.3048,    desc: "1 ft → 0.3048 m" },
    { from: "in", to: "mm",   cat: "length",      val: 1,    expected: 25.4,      desc: "1 in → 25.4 mm" },
    { from: "bbl", to: "L",   cat: "volume",      val: 1,    expected: 158.987,   desc: "1 bbl → 158.987 L" },
    { from: "bbl", to: "m3",  cat: "volume",      val: 1,    expected: 0.158987,  desc: "1 bbl → 0.158987 m³" },
    { from: "psi", to: "bar", cat: "pressure",    val: 14.5038, expected: 1.0,    desc: "14.5038 psi → 1 bar" },
    { from: "C",   to: "F",   cat: "temperature", val: 0,    expected: 32.0,      desc: "0°C → 32°F" },
    { from: "C",   to: "F",   cat: "temperature", val: 100,  expected: 212.0,     desc: "100°C → 212°F" },
    { from: "C",   to: "K",   cat: "temperature", val: 0,    expected: 273.15,    desc: "0°C → 273.15 K" },
    { from: "ppg", to: "g_cc",cat: "density",     val: 8.345, expected: 1.0,      desc: "8.345 ppg → 1.0 g/cc (water)" },
    { from: "BPM", to: "GPM", cat: "flow",        val: 1,    expected: 42.0,      desc: "1 BPM → 42 GPM" },
    { from: "ft_min","to":"m_min", cat:"velocity", val: 100, expected: 30.48,     desc: "100 ft/min → 30.48 m/min" },
    { from: "cP",  to: "Pa_s",cat: "viscosity",   val: 1,    expected: 0.001,     desc: "1 cP → 0.001 Pa·s" },
  ];

  let total = 0; let passed = 0;
  for (const t of convTests) {
    total++;
    try {
      const got = convertUnit(t.val, t.from, t.to, t.cat);
      const tol = 0.001;
      const testPassed = approxEqual(got, t.expected, tol);
      if (testPassed) passed++;
      const errPct = Math.abs(got - t.expected) / (Math.abs(t.expected) || 1);
      console.log(`${testPassed ? "✓" : "✗"} ${t.desc} → got ${got.toFixed(6)} (err ${(errPct * 100).toFixed(3)}%)`);
    } catch (e) {
      console.log(`✗ ${t.desc} → ERROR: ${e}`);
    }
  }
  console.log(`\n  Unit conversions: ${passed}/${total}\n`);
}

// Entry point
runAllTests();
runUnitTests();