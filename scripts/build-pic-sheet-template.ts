import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";

/**
 * One-time helper: takes the hand-made SAMPLE PIC SHEET.xlsx and produces
 * public/templates/pic-sheet.xlsx with a GTW column inserted after CTW.
 *
 *   npx tsx scripts/build-pic-sheet-template.ts "<path to SAMPLE PIC SHEET.xlsx>"
 */
const OUTPUT_PATH = path.join(process.cwd(), "public/templates/pic-sheet.xlsx");
const LAST_ROW = 29;
const CTW_COL = 5;
const NEW_GTW_COL = 6;
const LAST_OLD_COL = 11;

async function main() {
  const source = process.argv[2];
  if (!source) throw new Error("Pass the path to SAMPLE PIC SHEET.xlsx");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(source);
  const ws = wb.worksheets[0];

  ws.unMergeCells("B4:J4");
  ws.unMergeCells("H5:J5");
  for (const address of ["C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4", "I5", "J5"]) {
    ws.getCell(address).value = null;
  }

  for (let row = 1; row <= LAST_ROW; row++) {
    for (let col = LAST_OLD_COL; col >= NEW_GTW_COL; col--) {
      const from = ws.getCell(row, col);
      const to = ws.getCell(row, col + 1);
      to.value = from.value;
      to.style = { ...from.style };
    }
    const ctw = ws.getCell(row, CTW_COL);
    const gtw = ws.getCell(row, NEW_GTW_COL);
    gtw.value = null;
    gtw.style = { ...ctw.style };
  }

  const widths: (number | undefined)[] = [];
  for (let col = 1; col <= LAST_OLD_COL; col++) widths[col] = ws.getColumn(col).width;
  const styles: Record<number, Partial<ExcelJS.Style>> = {};
  for (let col = 1; col <= LAST_OLD_COL; col++) styles[col] = { ...ws.getColumn(col).style };
  for (let col = LAST_OLD_COL; col >= NEW_GTW_COL; col--) {
    const target = ws.getColumn(col + 1);
    target.width = widths[col];
    target.style = styles[col];
  }
  const gtwColumn = ws.getColumn(NEW_GTW_COL);
  gtwColumn.width = widths[CTW_COL];
  gtwColumn.style = styles[CTW_COL];

  ws.getCell("F6").value = "GTW";
  ws.mergeCells("B4:K4");
  ws.getCell("B4").value = "PIC SHEET";
  ws.mergeCells("I5:K5");
  ws.getCell("I5").value = "DATE :";

  ws.getCell("H28").value = { formula: "SUM(H8:H27)" } as ExcelJS.CellFormulaValue;
  ws.getCell("H28").numFmt = "#,##0";
  ws.getCell("J28").value = { formula: "SUM(J8:J27)" } as ExcelJS.CellFormulaValue;

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  await wb.xlsx.writeFile(OUTPUT_PATH);
  console.log(`Wrote ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
