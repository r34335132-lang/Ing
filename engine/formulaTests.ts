// ═════════════════════════════════════════════════════════════════════════════
// OilCalc Pro — Formula Test Suite
// Run with: pnpm test:formulas
// Expected values come from source Excel formulas or controlled engine cases.
// Default tolerance: 0.1% relative, configurable per test.
// ═════════════════════════════════════════════════════════════════════════════

import { runCalculation } from "./calculationEngine";
import { getAllFormulas } from "./formulaRegistry";
import { convertUnit } from "./units";

interface TestResult {
  formulaId: string;
  description: string;
  passed: boolean;
  expected: number | string;
  got: number | string;
  errorPct: number;
  errors: string[];
}

interface InlineTestCase {
  formulaId: string;
  description: string;
  inputs: Record<string, number | string>;
  expectedValue: number;
  expectedAdditionalResults?: Record<string, number>;
  tolerance?: number;
  expectError?: boolean;
  expectBlocked?: boolean;
}

const DEFAULT_TOLERANCE = 0.001; // 0.1%

function approxEqual(
  actual: number,
  expected: number,
  tolerance = DEFAULT_TOLERANCE
): boolean {
  if (!Number.isFinite(actual) || !Number.isFinite(expected)) return false;
  if (expected === 0) return Math.abs(actual) <= tolerance;
  return Math.abs(actual - expected) / Math.abs(expected) <= tolerance;
}

function pushResult(
  results: TestResult[],
  params: {
    formulaId: string;
    description: string;
    passed: boolean;
    expected: number | string;
    got: number | string;
    errorPct?: number;
    errors?: string[];
  }
): void {
  results.push({
    formulaId: params.formulaId,
    description: params.description,
    passed: params.passed,
    expected: params.expected,
    got: params.got,
    errorPct: params.errorPct ?? 0,
    errors: params.errors ?? [],
  });
}

function runAllTests(): void {
  const results: TestResult[] = [];
  const formulas = getAllFormulas();

  let total = 0;
  let passed = 0;

  const inlineTests: InlineTestCase[] = [
    // ── Casos exitosos validados / controlados ─────────────────────────────

    {
      formulaId: "pipe-volume",
      description: "DI=1.8in, L=1410m — Valor real de CALCULO VOLUMEN TF.xls",
      inputs: { di: 1.8, length_m: 1410 },
      expectedValue: 14.5601214070118,
      tolerance: 0.0001,
    },

    {
      formulaId: "annular-volume",
      description:
        "D_mayor_in=1.8, D_menor_in=1.25, L=1410m — Valor real CALCULO VOLUMEN TF.xls",
      inputs: { d_mayor_in: 1.8, d_menor_in: 1.25, length_m: 1410 },
      expectedValue: 7.53845791983405,
      tolerance: 0.0001,
      expectedAdditionalResults: {
        "Volumen|L": 1198.28893085225,
        "Volumen|m³": 1.19828893085225,
      },
    },

    {
      formulaId: "fluid-velocity",
      description: "DI=2.441in, BPM=1.5",
      inputs: { di: 2.441, flow_bpm: 1.5 },
      expectedValue: 1.5 / ((2.441 * 2.441) / 1029.4),
      tolerance: 0.0001,
    },

    {
      formulaId: "annular-velocity",
      description:
        "D_mayor_in=2.99, D_menor_in=1.5, BPM=1.5 — Valor real CALCULO VOLUMEN TF.xls",
      inputs: { d_mayor_in: 2.99, d_menor_in: 1.5, bpm: 1.5 },
      expectedValue: 230.563870306249,
      tolerance: 0.0001,
      expectedAdditionalResults: {
        "Velocidad|m/min": 70.2758700673447,
      },
    },

    {
      formulaId: "tf-displacement",
      description: "OD=1.5in, L=1800m",
      inputs: { od_tf_in: 1.5, length_m: 1800 },
      expectedValue: ((1.5 * 1.5) / 1029.4) * (1800 / 0.3048),
      tolerance: 0.0001,
    },

    {
      formulaId: "tf-metal-displacement",
      description: "OD=1.5in, ID=1.321in, L=1800m",
      inputs: { od_tf_in: 1.5, id_tf_in: 1.321, length_m: 1800 },
      expectedValue:
        ((1.5 * 1.5 - 1.321 * 1.321) / 1029.4) * (1800 / 0.3048),
      tolerance: 0.0001,
    },

    {
      formulaId: "bache-ecologico",
      description: "Validación real vs Bache ecologico.xls",
      inputs: {
        di_tp_in: 2.602,
        densidad_lodo_grcc: 1.17,
        volumen_tapon_m3: 6,
        longitud_desplazar_m: 140,
        profundidad_m: 3927,
      },
      expectedValue: 1.26365438919564,
      tolerance: 0.0001,
      expectedAdditionalResults: {
        "Capacidad TP|m³/m": 0.0034305637068,
        "Longitud tapón|m": 1748.98369854112,
        "P. hid. total|kg/cm²": 459.459,
        "Columna eq.|m": 2038.01630145888,
        "P. hid. parcial|kg/cm²": 238.447907270689,
        "P. faltante|kg/cm²": 221.011092729311,
      },
    },

    {
      formulaId: "coiled-tubing",
      description: "Validación real vs CoilTubingReelCapacitycalculator.xls",
      inputs: {
        flangeHeightIn: 25,
        freeBoardIn: 1,
        coreDiameterIn: 96,
        coreWidthIn: 82,
        coilOdIn: 2.375,
      },
      expectedValue: 10733.7748994583,
      tolerance: 0.0001,
      expectedAdditionalResults: {
        "Longitud|m": 3271.25419175449,
        "Capas verticales|capas": 10,
        "Vueltas horizontales|vueltas": 50,
      },
    },

    {
      formulaId: "fill-penetration-velocity",
      description: "Validación real vs Excel: acarreo de 10% se usa como 10",
      inputs: {
        d_mayor_in: 2.99,
        od_tf_in: 1.5,
        bpm: 1.5,
        acarreo_percent: 10,
      },
      expectedValue: 14.5375021194588,
      tolerance: 0.0001,
      expectedAdditionalResults: {
        "Velocidad|m/min": 4.43103064601104,
      },
    },

    // ── Bloqueo por revisión técnica ──────────────────────────────────────

    {
      formulaId: "hydraulics",
      description: "BLOCKED: Hydraulics pendiente de validación vs Excel",
      inputs: {
        flow_gpm: 400,
        mud_ppg: 10.5,
        pv_cp: 20,
        yp_lbft2: 15,
        dp_id_in: 4.276,
        hole_in: 8.5,
        depth_ft: 8000,
      },
      expectedValue: 0,
      expectBlocked: true,
    },

    // ── Errores de input ──────────────────────────────────────────────────

    {
      formulaId: "annular-volume",
      description: "ERROR: d_mayor_in <= d_menor_in",
      inputs: { d_mayor_in: 1.25, d_menor_in: 1.8, length_m: 100 },
      expectedValue: 0,
      expectError: true,
    },

    {
      formulaId: "annular-velocity",
      description: "ERROR: d_mayor_in <= d_menor_in",
      inputs: { d_mayor_in: 1.5, d_menor_in: 2.99, bpm: 1.5 },
      expectedValue: 0,
      expectError: true,
    },

    {
      formulaId: "coiled-tubing",
      description: "ERROR: coilOdIn <= 0",
      inputs: {
        flangeHeightIn: 25,
        freeBoardIn: 1,
        coreDiameterIn: 96,
        coreWidthIn: 82,
        coilOdIn: 0,
      },
      expectedValue: 0,
      expectError: true,
    },

    {
      formulaId: "bache-ecologico",
      description: "ERROR: profundidad <= longitud_tapon + longitud_desplazar",
      inputs: {
        di_tp_in: 2.602,
        densidad_lodo_grcc: 1.17,
        volumen_tapon_m3: 6,
        longitud_desplazar_m: 3000,
        profundidad_m: 3927,
      },
      expectedValue: 0,
      expectError: true,
    },

    {
      formulaId: "fill-penetration-velocity",
      description: "ERROR: d_mayor_in <= od_tf_in",
      inputs: {
        d_mayor_in: 1.5,
        od_tf_in: 2.99,
        bpm: 1.5,
        acarreo_percent: 10,
      },
      expectedValue: 0,
      expectError: true,
    },
  ];

  for (const tc of inlineTests) {
    total++;

    const result = runCalculation({
      formulaId: tc.formulaId,
      inputs: tc.inputs,
    });

    const tolerance = tc.tolerance ?? DEFAULT_TOLERANCE;
    const errorsForReport = [...result.errors];

    let testPassed = true;
    let errorPct = 0;
    let got: string | number = result.value;
    let expected: string | number = tc.expectedValue;

    if (tc.expectError) {
      expected = "ERROR";

      if (result.errors.length > 0 && result.value === 0 && !result.blocked) {
        got = "ERROR";
      } else {
        testPassed = false;
        got = `Err:${result.errors.length}|Val:${result.value}|Blk:${result.blocked}`;
        errorsForReport.push("El motor no priorizó el error de input correctamente.");
      }
    } else if (tc.expectBlocked) {
      expected = "BLOCKED";

      const hasCorrectWarning = result.warnings.includes(
        "Fórmula pendiente de validar con archivo fuente. No usar para operación."
      );

      if (
        result.blocked === true &&
        result.value === 0 &&
        result.errors.length === 0 &&
        hasCorrectWarning
      ) {
        got = "BLOCKED";
      } else {
        testPassed = false;
        got = `Blk:${result.blocked}|Val:${result.value}|Err:${result.errors.length}`;

        if (!hasCorrectWarning) {
          errorsForReport.push("Falta advertencia de seguridad operacional.");
        }
      }
    } else {
      if (result.errors.length > 0 || result.blocked) {
        testPassed = false;
        got = "Err/Blk";
      } else {
        errorPct =
          Math.abs(result.value - tc.expectedValue) /
          Math.abs(tc.expectedValue || 1);

        if (!approxEqual(result.value, tc.expectedValue, tolerance)) {
          testPassed = false;
        }
      }

      if (testPassed && tc.expectedAdditionalResults) {
        if (!result.additionalResults) {
          testPassed = false;
          errorsForReport.push("Faltan additionalResults.");
        } else {
          for (const [key, expectedValue] of Object.entries(
            tc.expectedAdditionalResults
          )) {
            const [expectedLabel, expectedUnit] = key.split("|");

            const found = result.additionalResults.find(
              (item) =>
                item.label === expectedLabel &&
                (!expectedUnit || item.unit === expectedUnit)
            );

            if (!found) {
              testPassed = false;
              errorsForReport.push(
                `Falta resultado adicional: label=[${expectedLabel}] unit=[${expectedUnit}]`
              );
              break;
            }

            if (!approxEqual(found.value, expectedValue, tolerance)) {
              testPassed = false;
              errorsForReport.push(
                `Fallo en additionalResult [${expectedLabel}|${expectedUnit}]. Esperado ${expectedValue}, obtenido ${found.value}`
              );
              break;
            }
          }
        }
      }
    }

    if (testPassed) passed++;

    pushResult(results, {
      formulaId: tc.formulaId,
      description: tc.description,
      passed: testPassed,
      expected,
      got,
      errorPct,
      errors: errorsForReport,
    });
  }

  // ── Tests definidos dentro del registry ─────────────────────────────────

  for (const formula of formulas) {
    if (!formula.testCases || formula.testCases.length === 0) continue;

    const isNeedsReview = formula.needsReview === true;

    for (const tc of formula.testCases) {
      total++;

      const result = runCalculation({
        formulaId: formula.id,
        inputs: tc.inputs,
      });

      const tolerance = tc.tolerance ?? DEFAULT_TOLERANCE;
      const errorsForReport = [...result.errors];

      let testPassed = true;
      let errorPct = 0;
      let got: string | number = result.value;
      let expected: string | number = tc.expectedValue;

      if (isNeedsReview) {
        expected = "BLOCKED";

        if (
          result.blocked === true &&
          result.value === 0 &&
          result.errors.length === 0
        ) {
          got = "BLOCKED";
        } else {
          testPassed = false;
          got = `Blk:${result.blocked}|Val:${result.value}`;
        }
      } else if (result.errors.length > 0 || result.blocked) {
        testPassed = false;
        got = "Err/Blk";
      } else {
        errorPct =
          tc.expectedValue !== 0
            ? Math.abs(result.value - tc.expectedValue) /
              Math.abs(tc.expectedValue)
            : 0;

        if (!approxEqual(result.value, tc.expectedValue, tolerance)) {
          testPassed = false;
        }
      }

      if (testPassed) passed++;

      pushResult(results, {
        formulaId: formula.id,
        description: `[registry] ${tc.description}`,
        passed: testPassed,
        expected,
        got,
        errorPct,
        errors: errorsForReport,
      });
    }
  }

  printFormulaTestResults(results, total, passed);
}

function printFormulaTestResults(
  results: TestResult[],
  total: number,
  passed: number
): void {
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  OilCalc Pro — Formula Test Suite");
  console.log("═══════════════════════════════════════════════════════\n");

  for (const result of results) {
    const icon = result.passed ? "✓" : "✗";
    const status = result.passed ? "PASS" : "FAIL";
    const errorPctText =
      result.errorPct > 0
        ? ` [err: ${(result.errorPct * 100).toFixed(4)}%]`
        : "";

    console.log(
      `${icon} [${status}] ${result.formulaId} — ${result.description}`
    );

    if (!result.passed) {
      const expected =
        typeof result.expected === "number"
          ? result.expected.toFixed(6)
          : result.expected;

      const got =
        typeof result.got === "number" ? result.got.toFixed(6) : result.got;

      console.log(`       Expected: ${expected}`);
      console.log(`       Got:      ${got}${errorPctText}`);

      if (result.errors.length > 0) {
        console.log(`       Errors:   ${result.errors.join("; ")}`);
      }
    }
  }

  const failed = total - passed;

  console.log("\n─────────────────────────────────────────────────────");
  console.log(`  Total: ${total}  |  Passed: ${passed}  |  Failed: ${failed}`);
  console.log(
    `  Result: ${failed === 0 ? "ALL TESTS PASSED ✓" : `${failed} FAILURES ✗`}`
  );
  console.log("═══════════════════════════════════════════════════════\n");

  if (failed > 0) {
    throw new Error(`${failed} formula test(s) failed.`);
  }
}

function runUnitTests(): void {
  console.log("─── Unit Conversion Tests ───────────────────────────\n");

  const convTests = [
    {
      from: "ft",
      to: "m",
      category: "length",
      value: 1,
      expected: 0.3048,
      description: "1 ft → 0.3048 m",
    },
    {
      from: "in",
      to: "mm",
      category: "length",
      value: 1,
      expected: 25.4,
      description: "1 in → 25.4 mm",
    },
    {
      from: "bbl",
      to: "L",
      category: "volume",
      value: 1,
      expected: 158.987,
      description: "1 bbl → 158.987 L",
    },
    {
      from: "bbl",
      to: "m3",
      category: "volume",
      value: 1,
      expected: 0.158987,
      description: "1 bbl → 0.158987 m³",
    },
    {
      from: "psi",
      to: "bar",
      category: "pressure",
      value: 14.5038,
      expected: 1.0,
      description: "14.5038 psi → 1 bar",
    },
    {
      from: "C",
      to: "F",
      category: "temperature",
      value: 0,
      expected: 32.0,
      description: "0°C → 32°F",
    },
    {
      from: "C",
      to: "F",
      category: "temperature",
      value: 100,
      expected: 212.0,
      description: "100°C → 212°F",
    },
    {
      from: "C",
      to: "K",
      category: "temperature",
      value: 0,
      expected: 273.15,
      description: "0°C → 273.15 K",
    },
    {
      from: "ppg",
      to: "g_cc",
      category: "density",
      value: 8.345,
      expected: 1.0,
      description: "8.345 ppg → 1.0 g/cc",
    },
    {
      from: "BPM",
      to: "GPM",
      category: "flow",
      value: 1,
      expected: 42.0,
      description: "1 BPM → 42 GPM",
    },
    {
      from: "ft_min",
      to: "m_min",
      category: "velocity",
      value: 100,
      expected: 30.48,
      description: "100 ft/min → 30.48 m/min",
    },
    {
      from: "cP",
      to: "Pa_s",
      category: "viscosity",
      value: 1,
      expected: 0.001,
      description: "1 cP → 0.001 Pa·s",
    },
  ];

  let total = 0;
  let passed = 0;

  for (const test of convTests) {
    total++;

    try {
      const got = convertUnit(
        test.value,
        test.from,
        test.to,
        test.category
      );

      const testPassed = approxEqual(got, test.expected, 0.001);

      if (testPassed) passed++;

      const errorPct =
        Math.abs(got - test.expected) / (Math.abs(test.expected) || 1);

      console.log(
        `${testPassed ? "✓" : "✗"} ${test.description} → got ${got.toFixed(
          6
        )} (err ${(errorPct * 100).toFixed(3)}%)`
      );
    } catch (error) {
      console.log(`✗ ${test.description} → ERROR: ${error}`);
    }
  }

  console.log(`\n  Unit conversions: ${passed}/${total}\n`);

  if (passed !== total) {
    throw new Error(`${total - passed} unit conversion test(s) failed.`);
  }
}

runAllTests();
runUnitTests();
