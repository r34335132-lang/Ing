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
  expected: number | string;
  got: number | string;
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

  // ─── Inline test cases (validates engine features: block, errors, extra results) ────

  const inlineTests: Array<{
    formulaId: string;
    description: string;
    inputs: Record<string, number | string>;
    expectedValue: number;
    expectedAdditionalResults?: Record<string, number>;
    tolerance?: number;
    expectError?: boolean;
    expectBlocked?: boolean;
  }> = [
    // ── Tests de Cálculo Exitoso ───────────────────────────────────────────
    {
      formulaId: "pipe-volume",
      description: "DI=1.8in, L=1410m (Valor real de CALCULO VOLUMEN TF.xls)",
      inputs: { di: 1.8, length_m: 1410 },
      expectedValue: 14.5601214070118,
      tolerance: 0.0001
    },
    {
      formulaId: "pipe-volume",
      description: "DI=4.276in, L=1000m",
      inputs: { di: 4.276, length_m: 1000 },
      expectedValue: (4.276 * 4.276 / 1029.4) * (1000 / 0.3048),
    },
    {
      formulaId: "annular-volume",
      description: "D_mayor_in=1.8, D_menor_in=1.25, L=1410m (Valor real CALCULO VOLUMEN TF.xls)",
      inputs: { d_mayor_in: 1.8, d_menor_in: 1.25, length_m: 1410 },
      expectedValue: 7.53845791983405,
      tolerance: 0.0001,
      expectedAdditionalResults: {
        "Volumen|L": 1198.5190326029726,
        "Volumen|m³": 1.1985190326029726
      }
    },
    {
      formulaId: "fluid-velocity",
      description: "Validación real vs CALCULO VOLUMEN TF.xls (VELOCIDADES)",
      inputs: { di: 2.441, flow_bpm: 1.5 },
      expectedValue: 259.143227946854,
      tolerance: 0.0001,
      expectedAdditionalResults: {
        "Velocidad|m/min": 78.9868558782011
      }
    },
    {
      formulaId: "annular-velocity",
      description: "Validación real vs CALCULO VOLUMEN TF.xls (VELOCIDADES)",
      inputs: { d_mayor_in: 2.99, d_menor_in: 1.5, bpm: 1.5 },
      expectedValue: 230.803724906952,
      tolerance: 0.0001,
      expectedAdditionalResults: {
        "Velocidad|m/min": 70.348975351639
      }
    },
    {
      formulaId: "tf-displacement",
      description: "OD=1.5in, L=1800m",
      inputs: { od_tf_in: 1.5, length_m: 1800 },
      expectedValue: (1.5 * 1.5 / 1029.4) * (1800 / 0.3048),
    },
    {
      formulaId: "tf-metal-displacement",
      description: "OD=1.5, ID=1.321, L=1800m",
      inputs: { od_tf_in: 1.5, id_tf_in: 1.321, length_m: 1800 },
      expectedValue: ((1.5 * 1.5 - 1.321 * 1.321) / 1029.4) * (1800 / 0.3048),
    },
    {
      formulaId: "bache-ecologico",
      description: "Validación real vs Bache ecologico.xls",
      inputs: { di_tp_in: 2.602, densidad_lodo_grcc: 1.17, volumen_tapon_m3: 6, longitud_desplazar_m: 140, profundidad_m: 3927 },
      expectedValue: 1.26365438919564,
      tolerance: 0.0001,
      expectedAdditionalResults: {
        "Capacidad TP|m³/m": 0.0034305637068,
        "Longitud tapón|m": 1748.98369854112,
        "P. hid. total|kg/cm²": 459.459,
        "Columna eq.|m": 2038.01630145888,
        "P. hid. parcial|kg/cm²": 238.447907270689,
        "P. faltante|kg/cm²": 221.011092729311
      }
    },
    {
      formulaId: "coiled-tubing",
      description: "Validación real vs CoilTubingReelCapacitycalculator.xls",
      inputs: { flangeHeightIn: 25, freeBoardIn: 1, coreDiameterIn: 96, coreWidthIn: 82, coilOdIn: 2.375 },
      expectedValue: 10733.7748994583,
      tolerance: 0.0001,
      expectedAdditionalResults: {
        "Longitud|m": 3271.6545893549005,
        "Capas verticales|capas": 10,
        "Vueltas horizontales|vueltas": 50
      }
    },
    {
      formulaId: "fill-penetration-velocity",
      description: "Validación real vs Excel: acarreo de 10% se usa como 10",
      inputs: { d_mayor_in: 2.99, od_tf_in: 1.5, bpm: 1.5, acarreo_percent: 10 },
      expectedValue: 14.5375021194588,
      tolerance: 0.0001,
      expectedAdditionalResults: {
        "Velocidad|m/min": 4.43103064601104
      }
    },

    // ── Tests de Bloqueo por Revisión (Seguridad) ──────────────────────────
    {
      formulaId: "hydraulics",
      description: "BLOCKED: Hydraulics pendiente de validación vs Excel",
      inputs: { flow_gpm: 400, mud_ppg: 10.5, pv_cp: 20, yp_lbft2: 15, dp_id_in: 4.276, hole_in: 8.5, depth_ft: 8000 },
      expectedValue: 0,
      expectBlocked: true
    },

    // ── Tests de Errores de Input (Rechazo Fuerte) ─────────────────────────
    {
      formulaId: "annular-volume",
      description: "ERROR: d_mayor_in <= d_menor_in",
      inputs: { d_mayor_in: 1.25, d_menor_in: 1.8, length_m: 100 },
      expectedValue: 0,
      expectError: true
    },
    {
      formulaId: "annular-velocity",
      description: "ERROR: d_mayor_in <= d_menor_in",
      inputs: { d_mayor_in: 1.5, d_menor_in: 2.99, bpm: 1.5 },
      expectedValue: 0,
      expectError: true
    },
    {
      formulaId: "coiled-tubing",
      description: "ERROR: coilOdIn <= 0 (Input inválido)",
      inputs: { flangeHeightIn: 25, freeBoardIn: 1, coreDiameterIn: 96, coreWidthIn: 82, coilOdIn: 0 },
      expectedValue: 0,
      expectError: true
    },
    {
      formulaId: "bache-ecologico",
      description: "ERROR: prof <= longitud_tapon + longitud_desplazar",
      inputs: { di_tp_in: 2.602, densidad_lodo_grcc: 1.17, volumen_tapon_m3: 6, longitud_desplazar_m: 3000, profundidad_m: 3927 },
      expectedValue: 0,
      expectError: true
    },
    {
      formulaId: "fill-penetration-velocity",
      description: "ERROR: D_mayor <= od_tf_in",
      inputs: { d_mayor_in: 1.5, od_tf_in: 2.99, bpm: 1.5, acarreo_percent: 10 },
      expectedValue: 0,
      expectError: true
    }
  ];

  // Ejecución de pruebas Inline
  for (const tc of inlineTests) {
    total++;
    const result = runCalculation({ formulaId: tc.formulaId, inputs: tc.inputs });
    const tol = tc.tolerance ?? DEFAULT_TOLERANCE;
    
    let testPassed = true;
    let errorPct = 0;
    let gotStr: string | number = result.value;
    let expectedStr: string | number = tc.expectedValue;

    if (tc.expectError) {
      expectedStr = "ERROR";
      // Debe haber errores y NO debe enmascararse como blocked por seguridad operacional
      if (result.errors.length > 0 && result.value === 0 && !result.blocked) {
        gotStr = "ERROR";
      } else {
        testPassed = false;
        gotStr = `Err:${result.errors.length}|Val:${result.value}|Blk:${result.blocked}`;
        result.errors.push("El motor no priorizó el error de input correctamente.");
      }
    } else if (tc.expectBlocked) {
      expectedStr = "BLOCKED";
      const hasCorrectWarning = result.warnings.includes("Fórmula pendiente de validar con archivo fuente. No usar para operación.");
      // Debe estar bloqueado de forma pura, sin errores de cálculo interno
      if (result.blocked === true && result.value === 0 && result.errors.length === 0 && hasCorrectWarning) {
        gotStr = "BLOCKED";
      } else {
        testPassed = false;
        gotStr = `Blk:${result.blocked}|Val:${result.value}|Err:${result.errors.length}`;
        if (!hasCorrectWarning) result.errors.push("Falta advertencia de seguridad operacional.");
      }
    } else {
      // Casos de éxito puro
      if (result.errors.length > 0 || result.blocked) {
        testPassed = false;
        gotStr = `Err/Blk`;
      } else {
        errorPct = Math.abs(result.value - tc.expectedValue) / Math.abs(tc.expectedValue || 1);
        if (!approxEqual(result.value, tc.expectedValue, tol)) testPassed = false;
      }

      // Validar Additional Results si aplica usando separador "label|unit" o solo "label"
      if (testPassed && tc.expectedAdditionalResults && result.additionalResults) {
        for (const [key, expectedVal] of Object.entries(tc.expectedAdditionalResults)) {
          const [lbl, un] = key.split("|");
          const found = result.additionalResults.find(ar => ar.label === lbl && (!un || ar.unit === un));
          if (!found) {
            testPassed = false;
            result.errors.push(`Falta el resultado adicional: [${lbl}] unit:[${un}]`);
            break;
          }
          if (!approxEqual(found.value, expectedVal, tol)) {
            testPassed = false;
            result.errors.push(`Fallo en [${lbl}]. Se esperaba ${expectedVal}, se obtuvo ${found.value}`);
            break;
          }
        }
      }
    }

    if (testPassed) passed++;

    results.push({
      formulaId: tc.formulaId,
      description: tc.description,
      passed: testPassed,
      expected: expectedStr,
      got: gotStr,
      errorPct,
      errors: result.errors,
    });
  }

  // Ejecución de pruebas integradas en el Registry
  for (const formula of formulas) {
    if (!formula.testCases || formula.testCases.length === 0) continue;
    
    const isNeedsReview = formula.needsReview === true;

    for (const tc of formula.testCases) {
      total++;
      const result = runCalculation({ formulaId: formula.id, inputs: tc.inputs });
      const tol = tc.tolerance ?? DEFAULT_TOLERANCE;
      
      let testPassed = true;
      let errorPct = 0;
      let gotStr: string | number = result.value;
      let expectedStr: string | number = tc.expectedValue;

      if (isNeedsReview) {
        expectedStr = "BLOCKED";
        if (result.blocked === true && result.value === 0 && result.errors.length === 0) {
          gotStr = "BLOCKED";
        } else {
          testPassed = false;
          gotStr = `Blk:${result.blocked}|Val:${result.value}`;
        }
      } else {
        if (result.errors.length > 0 || result.blocked) {
          testPassed = false;
          gotStr = "Err/Blk";
        } else {
          errorPct = tc.expectedValue !== 0 ? Math.abs(result.value - tc.expectedValue) / Math.abs(tc.expectedValue) : 0;
          if (!approxEqual(result.value, tc.expectedValue, tol)) testPassed = false;
        }
      }

      if (testPassed) passed++;
      results.push({
        formulaId: formula.id,
        description: `[registry] ${tc.description}`,
        passed: testPassed,
        expected: expectedStr,
        got: gotStr,
        errorPct,
        errors: result.errors,
      });
    }
  }

  // ── Imprimir Resultados ──────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  OilCalc Pro — Formula Test Suite");
  console.log("═══════════════════════════════════════════════════════\n");

  for (const r of results) {
    const icon = r.passed ? "✓" : "✗";
    const pctStr = r.errorPct > 0 ? ` [err: ${(r.errorPct * 100).toFixed(4)}%]` : "";
    const status = r.passed ? "PASS" : "FAIL";
    console.log(`${icon} [${status}] ${r.formulaId} — ${r.description}`);
    if (!r.passed) {
      const expFmt = typeof r.expected === 'number' ? r.expected.toFixed(6) : r.expected;
      const gotFmt = typeof r.got === 'number' ? r.got.toFixed(6) : r.got;
      console.log(`       Expected: ${expFmt}`);
      console.log(`       Got:      ${gotFmt}${pctStr}`);
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
