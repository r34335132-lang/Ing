// ═════════════════════════════════════════════════════════════════════════════
// OilCalc Pro — Formula Test Suite
// Run with: ts-node engine/formulaTests.ts
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
    {
      formulaId: "annular-volume",
      description: "D_mayor=8.5, D_menor=5.0, L=2000m",
      inputs: { d_mayor: 8.5, d_menor: 5.0, length_m: 2000 },
      expectedValue: ((8.5 * 8.5 - 5.0 * 5.0) / 1029.4) * (2000 / 0.3048),
    },
    // ── Validaciones de error para volumen anular ─────────────────────────
    {
      formulaId: "annular-volume",
      description: "ERROR: D_mayor=1.25 <= D_menor=1.8 → debe dar error",
      inputs: { d_mayor: 1.25, d_menor: 1.8, length_m: 1410 },
      expectedValue: 0, // engine returns 0 on error
    },
    // ── Velocidad en Tubería ───────────────────────────────────────────────
    {
      formulaId: "fluid-velocity",
      description: "DI=2.441in, BPM=1.5 → V = 1.5 / (2.441²/1029.4)",
      inputs: { di: 2.441, flow_bpm: 1.5 },
      expectedValue: 1.5 / ((2.441 * 2.441) / 1029.4),
    },
    {
      formulaId: "fluid-velocity",
      description: "DI=4.276in, BPM=6.0",
      inputs: { di: 4.276, flow_bpm: 6.0 },
      expectedValue: 6.0 / ((4.276 * 4.276) / 1029.4),
    },
    // ── Velocidad Anular ───────────────────────────────────────────────────
    {
      formulaId: "annular-velocity",
      description: "D_mayor=2.99, D_menor=1.5, BPM=1.5",
      inputs: { d_mayor: 2.99, d_menor: 1.5, flow_bpm: 1.5 },
      expectedValue: 1.5 / ((2.99 * 2.99 - 1.5 * 1.5) / 1029.4),
    },
    {
      formulaId: "annular-velocity",
      description: "D_mayor=8.5, D_menor=5.0, BPM=8.0",
      inputs: { d_mayor: 8.5, d_menor: 5.0, flow_bpm: 8.0 },
      expectedValue: 8.0 / ((8.5 * 8.5 - 5.0 * 5.0) / 1029.4),
    },
    // ── Desplazamiento TF ──────────────────────────────────────────────────
    {
      formulaId: "tf-displacement",
      description: "OD=1.5in, L=1800m → V = (1.5²/1029.4) × (1800/0.3048)",
      inputs: { od_tf_in: 1.5, length_m: 1800 },
      expectedValue: (1.5 * 1.5 / 1029.4) * (1800 / 0.3048),
    },
    {
      formulaId: "tf-displacement",
      description: "OD=2.0in, L=3000m",
      inputs: { od_tf_in: 2.0, length_m: 3000 },
      expectedValue: (2.0 * 2.0 / 1029.4) * (3000 / 0.3048),
    },
    // ── Desplazamiento Metálico TF ─────────────────────────────────────────
    {
      formulaId: "tf-metal-displacement",
      description: "OD=1.5, ID=1.321, L=1800m",
      inputs: { od_tf_in: 1.5, id_tf_in: 1.321, length_m: 1800 },
      expectedValue: ((1.5 * 1.5 - 1.321 * 1.321) / 1029.4) * (1800 / 0.3048),
    },
    {
      formulaId: "tf-metal-displacement",
      description: "OD=2.0, ID=1.75, L=2500m",
      inputs: { od_tf_in: 2.0, id_tf_in: 1.75, length_m: 2500 },
      expectedValue: ((2.0 * 2.0 - 1.75 * 1.75) / 1029.4) * (2500 / 0.3048),
    },
    // ── Validaciones de error ──────────────────────────────────────────────
    {
      formulaId: "pipe-volume",
      description: "ERROR: length <= 0 → debe dar error",
      inputs: { di: 2.0, length_m: 0 },
      expectedValue: 0,
    },
    {
      formulaId: "tf-metal-displacement",
      description: "ERROR: OD=1.0 <= ID=1.5 → debe dar error",
      inputs: { od_tf_in: 1.0, id_tf_in: 1.5, length_m: 1800 },
      expectedValue: 0,
    },
    // ── Coiled Tubing Geométrico ───────────────────────────────────────────
    {
      formulaId: "coiled-tubing",
      description: "flange=36, free=2, coreD=48, coreW=30, coilOd=1.75",
      inputs: { flangeHeightIn: 36, freeBoardIn: 2, coreDiameterIn: 48, coreWidthIn: 30, coilOdIn: 1.75 },
      expectedValue: Math.trunc((36 - 2) / 1.75) * Math.trunc((48 + 36 - 2) / 1.75) * 0.2618 * 30,
    },
    // ── Velocidad Penetración Relleno ──────────────────────────────────────
    {
      formulaId: "fill-penetration-velocity",
      description: "d_mayor=2.99, od_tf=1.5, bpm=1.5, acarreo=80",
      inputs: { d_mayor_in: 2.99, od_tf_in: 1.5, bpm: 1.5, acarreo_percent: 80 },
      expectedValue: (80 * 1.5) / (0.6 * 2.65 * 0.097 * (Math.pow(2.99, 2) - Math.pow(1.5, 2))),
    },
    // ── Bache Ecológico ────────────────────────────────────────────────────
    {
      formulaId: "bache-ecologico",
      description: "di=2.441, dens=1.05, vol=0.5, desp=100, prof=1500",
      inputs: { di_tp_in: 2.441, densidad_lodo_grcc: 1.05, volumen_tapon_m3: 0.5, longitud_desplazar_m: 100, profundidad_m: 1500 },
      expectedValue: ( ((1500 * 1.05 / 10) - ((1500 - (0.5 / (Math.pow(2.441, 2) * 0.5067 / 1000)) - 100) * 1.05 / 10)) * 10 ) / (0.5 / (Math.pow(2.441, 2) * 0.5067 / 1000)),
    },
    // ── Hydraulics Blocked ─────────────────────────────────────────────────
    {
      formulaId: "hydraulics",
      description: "Debe retornar 0 y estar bloqueada por needsReview",
      inputs: { flow_gpm: 400, mud_ppg: 10.5, pv_cp: 20, yp_lbft2: 15, dp_id_in: 4.276, hole_in: 8.5, depth_ft: 8000 },
      expectedValue: 0,
    }
  ];

  // Run inline tests
  for (const tc of inlineTests) {
    total++;
    const result = runCalculation({ formulaId: tc.formulaId, inputs: tc.inputs });
    const tol = tc.tolerance ?? DEFAULT_TOLERANCE;
    const hasErrors = result.errors.length > 0;

    let testPassed: boolean;
    let errorPct = 0;

    if (tc.expectedValue === 0) {
      // Expect error / 0 result
      testPassed = result.value === 0;
    } else {
      errorPct = Math.abs(result.value - tc.expectedValue) / Math.abs(tc.expectedValue);
      testPassed = errorPct <= tol && !hasErrors;
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
      const testPassed = result.errors.length === 0 && (tc.expectedValue === 0 ? result.value === 0 : errorPct <= tol);
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
      const err = Math.abs(got - t.expected) / (Math.abs(t.expected) || 1);
      const ok = err <= tol;
      if (ok) passed++;
      console.log(`${ok ? "✓" : "✗"} ${t.desc} → got ${got.toFixed(6)} (err ${(err * 100).toFixed(3)}%)`);
    } catch (e) {
      console.log(`✗ ${t.desc} → ERROR: ${e}`);
    }
  }
  console.log(`\n  Unit conversions: ${passed}/${total}\n`);
}

// Entry point
runAllTests();
runUnitTests();