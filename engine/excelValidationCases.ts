// ═════════════════════════════════════════════════════════════════════════════
// OilCalc Pro — Excel Validation Ground Truth
// Contains manual test cases extracted cell-by-cell from source Excel files.
// Use this file to transition formulas from "implemented_pending_validation" 
// to "validated" state.
// ═════════════════════════════════════════════════════════════════════════════

export type ValidationStatus = "validated" | "manual_pending";

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
      vol_liters: 1198.28893085225,
      vol_m3: 1.19828893085225
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