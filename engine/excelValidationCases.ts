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
  tolerance: number;
  status: ValidationStatus;
}

export const excelValidationCases: ExcelValidationCase[] = [
  {
    formulaId: "pipe-volume",
    sourceFile: "CALCULO VOLUMEN TF.xls",
    sourceSheet: "VOLUMENES",
    sourceCell: "G10",
    inputs: { di: 1.8, length_m: 1410 },
    expectedValue: 14.567, // Expected exact value from Excel
    tolerance: 0.001,
    status: "manual_pending"
  },
  {
    formulaId: "coiled-tubing",
    sourceFile: "CoilTubingReelCapacitycalculator.xls",
    sourceSheet: "Sheet1",
    sourceCell: "H15",
    inputs: { flangeHeightIn: 50, freeBoardIn: 4, coreDiameterIn: 30, coreWidthIn: 60, coilOdIn: 1.5 },
    expectedValue: null, 
    tolerance: 0.001,
    status: "manual_pending"
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