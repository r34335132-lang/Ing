// ═════════════════════════════════════════════════════════════════════════════
// OilCalc Pro — Excel Validation Ground Truth
// Contains manual test cases extracted cell-by-cell from source Excel files.
// Use this file to transition formulas from "implemented_pending_validation" 
// to "validated" state.
// ═════════════════════════════════════════════════════════════════════════════

export type ValidationStatus = "validated" | "manual_pending" | "inferred_pending_validation";

export interface ExcelValidationCase {
  formulaId: string;
  sourceFile: string;
  sourceSheet: string;
  sourceCell: string;
  inputs: Record<string, number | string>;
  expectedValue: number | null;
  additionalExpected?: Record<string, number>;
  tolerance: number;
  status: ValidationStatus;
  notes?: string;
}

export const excelValidationCases: ExcelValidationCase[] = [
  {
    formulaId: "pipe-volume",
    sourceFile: "CALCULO VOLUMEN TF.xls",
    sourceSheet: "VOLUMENES",
    sourceCell: "G10",
    inputs: { di: 1.8, length_m: 1410 },
    expectedValue: 14.5601214070118,
    tolerance: 0.0001,
    status: "validated"
  },
  {
    formulaId: "annular-volume",
    sourceFile: "CALCULO VOLUMEN TF.xls",
    sourceSheet: "VOLUMENES",
    sourceCell: "G19",
    inputs: {
      d_mayor_in: 1.8,
      d_menor_in: 1.25,
      length_m: 1410
    },
    expectedValue: 7.53845791983405,
    tolerance: 0.0001,
    status: "validated",
    notes: "Caso real extraído del Excel. Volumen anular usando diferencia de diámetros cuadrados.",
    additionalExpected: {
      vol_liters: 1198.5190326029726,
      vol_m3: 1.1985190326029726
    }
  },
  {
    formulaId: "fluid-velocity",
    sourceFile: "CALCULO VOLUMEN TF.xls",
    sourceSheet: "VELOCIDADES",
    sourceCell: "G10",
    inputs: {
      di: 2.441,
      flow_bpm: 1.5
    },
    expectedValue: 259.143227946854,
    tolerance: 0.0001,
    status: "validated",
    additionalExpected: {
      "Velocidad": 78.9868558782011
    }
  },
  {
    formulaId: "annular-velocity",
    sourceFile: "CALCULO VOLUMEN TF.xls",
    sourceSheet: "VELOCIDADES",
    sourceCell: "G19",
    inputs: {
      d_mayor_in: 2.99,
      d_menor_in: 1.5,
      bpm: 1.5
    },
    expectedValue: 230.803724906952,
    tolerance: 0.0001,
    status: "validated",
    notes: "Caso real extraído del Excel. Velocidad anular usando diferencia de diámetros cuadrados.",
    additionalExpected: {
      "Velocidad": 70.348975351639
    }
  },
  {
    formulaId: "tf-displacement",
    sourceFile: "CALCULO VOLUMEN TF.xls",
    sourceSheet: "VOLUMENES",
    sourceCell: "G34",
    inputs: { od_tf_in: 1.5, length_m: 1800 },
    expectedValue: 12.8639051470706,
    tolerance: 0.0001,
    status: "validated",
    notes: "Validado contra Excel. Usa OD de TF como desplazamiento externo, no capacidad interna.",
    additionalExpected: {
      "Litros": 2045.32116983534,
      "m³": 2.04532116983534
    }
  },
  {
    formulaId: "tf-metal-displacement",
    sourceFile: "CALCULO VOLUMEN TF.xls",
    sourceSheet: "VOLUMENES",
    sourceCell: "G37",
    inputs: {
      od_tf_in: 1.5,
      id_tf_in: 1.321,
      length_m: 1800
    },
    expectedValue: 2.89687326460334,
    tolerance: 0.0001,
    status: "validated",
    additionalExpected: {
      "Litros": 460.5660440885294,
      "m³": 0.4605660440885294
    }
  },
  {
    formulaId: "coiled-tubing",
    sourceFile: "CoilTubingReelCapacitycalculator.xls",
    sourceSheet: "Coillength Program",
    sourceCell: "G26",
    inputs: { flangeHeightIn: 25, freeBoardIn: 1, coreDiameterIn: 96, coreWidthIn: 82, coilOdIn: 2.375 },
    expectedValue: 10733.7748994583,
    tolerance: 0.0001,
    status: "validated"
  },
  {
    formulaId: "bache-ecologico",
    sourceFile: "Bache ecologico.xls",
    sourceSheet: "Bache ecologico",
    sourceCell: "E30",
    inputs: {
      di_tp_in: 2.602,
      densidad_lodo_grcc: 1.17,
      volumen_tapon_m3: 6,
      longitud_desplazar_m: 140,
      profundidad_m: 3927
    },
    expectedValue: 1.26365438919564,
    tolerance: 0.0001,
    status: "validated",
    notes: "Caso real extraído del Excel. Output principal: Dens. Requerida en gr/cc.",
    additionalExpected: {
      "Capacidad TP": 0.0034305637068,
      "Longitud tapón": 1748.98369854112,
      "P. hid. total": 459.459,
      "Columna eq.": 2038.01630145888,
      "P. hid. parcial": 238.447907270689,
      "P. faltante": 221.011092729311
    }
  },
  {
    formulaId: "fill-penetration-velocity",
    sourceFile: "CALCULO VOLUMEN TF.xls",
    sourceSheet: "VELOCIDADES",
    sourceCell: "H30",
    inputs: {
      d_mayor_in: 2.99,
      od_tf_in: 1.5,
      bpm: 1.5,
      acarreo_percent: 10
    },
    expectedValue: 14.5375021194588,
    tolerance: 0.0001,
    status: "validated",
    notes: "Caso real extraído del Excel. El acarreo se usa como 10 para representar 10%, no como 0.10.",
    additionalExpected: {
      "Velocidad": 4.43103064601104
    }
  },
  {
    formulaId: "bit-pressure-loss",
    sourceFile: "HIDRAULICA_RIVERO.xls",
    sourceSheet: "ENTRY / CALCULATE",
    sourceCell: "ENTRY!U7 / CALCULATE!C20",
    inputs: {
      q_gpm: 400,
      density_ppg: 10.5,
      tfa_in2: 0.785
    },
    expectedValue: null,
    tolerance: 0.0001,
    status: "manual_pending",
    notes: "Pendiente validar variante con TFA directa. Rivero usa Σ nozzle², no TFA²."
  },
  {
    formulaId: "tfa-nozzles",
    sourceFile: "HIDRAULICA_RIVERO.xls",
    sourceSheet: "ENTRY",
    sourceCell: "C24",
    inputs: {
      nozzle1_32: 10,
      nozzle2_32: 10,
      nozzle3_32: 10,
      nozzle4_32: 10,
      nozzle5_32: 9,
      nozzle6_32: 9
    },
    expectedValue: 0.43104869853205674,
    tolerance: 0.0001,
    status: "validated",
    notes: "Validado contra ENTRY!C24. Fórmula original: suma de cuadrados de toberas / 1303.797."
  },
  {
    formulaId: "bit-pressure-loss-from-nozzles",
    sourceFile: "HIDRAULICA_RIVERO.xls",
    sourceSheet: "ENTRY / CALCULATE",
    sourceCell: "CALCULATE!C20 / ENTRY!U7",
    inputs: {
      q_gpm: 427.41067873139997,
      density_grcc: 1.29,
      nozzle1_32: 10,
      nozzle2_32: 10,
      nozzle3_32: 10,
      nozzle4_32: 10,
      nozzle5_32: 9,
      nozzle6_32: 9
    },
    expectedValue: 972.6736700307072,
    tolerance: 0.0001,
    status: "validated",
    notes: "Validado contra CALCULATE!C20 / ENTRY!U7. El Excel usa densidad gr/cc convertida a ppg con ×8.33 y divide por (Σ nozzle²)²."
  },
  {
    formulaId: "hydrostatic-pressure",
    sourceFile: "HIDRAULICA_RIVERO.xls",
    sourceSheet: "ENTRY / CALCULATE",
    sourceCell: "CALCULATE!S14 related formula",
    inputs: {
      depth_m: 3161,
      density_grcc: 1.29
    },
    expectedValue: null,
    tolerance: 0.0001,
    status: "inferred_pending_validation",
    notes: "No se encontró output directo de presión hidrostática. Fórmula inferida desde DEC/ECD en CALCULATE!S14: R14/(0.052*C14*3.281)/8.33+ENTRY!$B$12."
  },
  {
    formulaId: "ecd-dec-rivero",
    sourceFile: "HIDRAULICA_RIVERO.xls",
    sourceSheet: "CALCULATE",
    sourceCell: "S14",
    inputs: {
      pressure_loss_psi: (1.3778862053674235 - 1.29) * 8.33 * 0.052 * 3161 * 3.281,
      depth_m: 3161,
      mud_density_grcc: 1.29
    },
    expectedValue: 1.3778862053674235,
    tolerance: 0.0001,
    status: "validated",
    notes: "Validado contra CALCULATE!S14. Fórmula original: R14/(0.052*C14*3.281)/8.33+ENTRY!$B$12."
  },
  {
    formulaId: "annular-pressure-loss-rivero",
    sourceFile: "HIDRAULICA_RIVERO.xls",
    sourceSheet: "CALCULATE / ENTRY",
    sourceCell: "CALCULATE!R14 / ENTRY!U6",
    inputs: {
      q11_psi: 346.9184812326709,
      q12_psi: 16.38171753498215,
      q13_psi: 10.60379423336763,
      q14_psi: 20.916589360581217
    },
    expectedValue: 394.8205823616019,
    tolerance: 0.0001,
    status: "validated",
    notes: "Validado contra CALCULATE!R14. R14 = Q11 + Q12 + Q13 + Q14. Pendiente implementar cálculo dinámico de cada Q por intervalo."
  },
  {
    formulaId: "annular-interval-loss-rivero",
    sourceFile: "HIDRAULICA_RIVERO.xls",
    sourceSheet: "CALCULATE",
    sourceCell: "Q14",
    inputs: {
      friction_factor: 0.0137326843817037,
      annular_velocity_ft_min: 348.76711384482235,
      density_grcc: 1.29,
      depth_start_m: 3095,
      depth_end_m: 3161,
      hole_diameter_in: 8.5,
      pipe_od_in: 6.5
    },
    expectedValue: 20.916589360581217,
    tolerance: 0.0001,
    status: "validated",
    notes: "Validado contra CALCULATE!Q14. Fórmula original: O14*(G14/60)^2*ENTRY!$B$12*8.33*(C14-C13)*3.281/(25.81*(D14-E14))."
  },
  {
    formulaId: "internal-interval-loss-rivero",
    sourceFile: "HIDRAULICA_RIVERO.xls",
    sourceSheet: "CALCULATE",
    sourceCell: "T14",
    inputs: {
      friction_factor: 0.004866295486027634,
      internal_velocity_ft_min: 1162.5570461494078,
      density_grcc: 1.29,
      depth_start_m: 3095,
      depth_end_m: 3161,
      pipe_id_in: 3
    },
    expectedValue: 54.90351370082147,
    tolerance: 0.0001,
    status: "validated",
    notes: "Validado contra CALCULATE!T14. Formula original: P14*(H14/60)^2*(C14-C13)*3.281*ENTRY!B12*8.33/(25.81*F14)."
  },
  {
    formulaId: "internal-pressure-loss-rivero",
    sourceFile: "HIDRAULICA_RIVERO.xls",
    sourceSheet: "CALCULATE / ENTRY",
    sourceCell: "CALCULATE!U14 / ENTRY!U5",
    inputs: {
      t11_psi: 706.082765511623,
      t12_psi: 114.79825591989943,
      t13_psi: 28.74115755096048,
      t14_psi: 54.90351370082147
    },
    expectedValue: 904.5256926833044,
    tolerance: 0.0001,
    status: "validated",
    notes: "Validado contra CALCULATE!U14. U14 = T11 + T12 + T13 + T14. Pendiente implementar calculo dinamico de cada T por intervalo."
  },
  {
    formulaId: "total-pressure-loss-rivero",
    sourceFile: "HIDRAULICA_RIVERO.xls",
    sourceSheet: "CALCULATE",
    sourceCell: "C16",
    inputs: {
      annular_loss_psi: 394.8205823616019,
      internal_loss_psi: 904.5256926833044,
      bit_loss_psi: 972.6736700307072
    },
    expectedValue: 2272.019945075613,
    tolerance: 0.0001,
    status: "validated",
    notes: "Validado contra CALCULATE!C16. Formula original: C16 = R14 + U14 + C20."
  },
  {
    formulaId: "hydraulics",
    sourceFile: "HIDRAULICA_RIVERO.xls",
    sourceSheet: "ECD",
    sourceCell: "M40",
    inputs: { flow_gpm: 400, mud_ppg: 10.5, pv_cp: 20, yp_lbft2: 15, dp_id_in: 4.276, hole_in: 8.5, depth_ft: 8000 },
    expectedValue: null,
    tolerance: 0.001,
    status: "manual_pending"
  }
];
