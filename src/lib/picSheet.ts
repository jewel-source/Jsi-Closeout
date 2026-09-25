import type ExcelJSNamespace from "exceljs";

type ExcelJSModule = typeof ExcelJSNamespace;

export interface PicSheetLookupItem {
  id: string;
  styleNumber: string;
  description: string;
  metal?: string;
  ctw?: string;
  gtw?: string;
  price?: number;
  soldOut: boolean;
  photoUrl?: string;
}

export interface PicSheetRow extends PicSheetLookupItem {
  quantity: number;
}

export interface SheetImage {
  buffer: ArrayBuffer;
  extension: "jpeg" | "png";
  width: number;
  height: number;
}

export type ImageLoader = (url: string) => Promise<SheetImage | null>;

const FIRST_ITEM_ROW = 8;
const TEMPLATE_LAST_ITEM_ROW = 27;
const TEMPLATE_TOTALS_ROW = 28;
const TEMPLATE_SPACER_ROW = 29;
const LAST_COLUMN = 12;
const ITEM_ROW_HEIGHT_PT = 150;
const IMAGE_COLUMN_INDEX = 1;
const IMAGE_PADDING_PX = 8;
const EMU_PER_PX = 9525;
const PX_PER_CHAR = 7;
const PX_PER_PT = 96 / 72;

function asSheetNumber(value: string | undefined): number | string | null {
  if (value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
}

export function picSheetFileName(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `PIC SHEET_${dd}${mm}${date.getFullYear()}.xlsx`;
}

function picSheetDateLabel(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `DATE : ${dd}-${mm}-${date.getFullYear()}`;
}

export async function buildPicSheetWorkbook(
  ExcelJS: ExcelJSModule,
  template: ArrayBuffer,
  rows: PicSheetRow[],
  loadImage: ImageLoader,
  onProgress?: (done: number, total: number) => void,
  date: Date = new Date(),
) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(template);
  const ws = wb.worksheets[0];

  const captureStyles = (rowNumber: number) => {
    const row = ws.getRow(rowNumber);
    const styles = [];
    for (let col = 1; col <= LAST_COLUMN; col++) {
      styles.push({ ...row.getCell(col).style });
    }
    return { styles, height: row.height };
  };
  const firstStyle = captureStyles(FIRST_ITEM_ROW);
  const middleStyle = captureStyles(FIRST_ITEM_ROW + 1);
  const lastStyle = captureStyles(TEMPLATE_LAST_ITEM_ROW);
  const totalsStyle = captureStyles(TEMPLATE_TOTALS_ROW);
  const spacerStyle = captureStyles(TEMPLATE_SPACER_ROW);

  // spliceRows() leaves the template's blank rows behind, so drop everything
  // under the header directly; the item and totals rows are rebuilt below.
  const sheetRows = (ws as unknown as { _rows: unknown[] })._rows;
  if (!Array.isArray(sheetRows)) {
    throw new Error("Unsupported ExcelJS version: cannot reset worksheet rows.");
  }
  sheetRows.length = FIRST_ITEM_ROW - 1;

  const applyStyles = (
    rowNumber: number,
    source: ReturnType<typeof captureStyles>,
    height = source.height,
  ) => {
    const row = ws.getRow(rowNumber);
    source.styles.forEach((style, i) => {
      row.getCell(i + 1).style = { ...style };
    });
    if (height) row.height = height;
  };

  const lastRow = FIRST_ITEM_ROW + rows.length - 1;
  const totalsRow = lastRow + 1;

  const imageCount = rows.filter((r) => r.photoUrl).length;
  let imagesDone = 0;
  onProgress?.(0, imageCount);

  const imageColumnWidthPx = Math.floor(
    (ws.getColumn(IMAGE_COLUMN_INDEX + 1).width ?? 34) * PX_PER_CHAR,
  );
  const rowHeightPx = Math.round(ITEM_ROW_HEIGHT_PT * PX_PER_PT);
  const boxWidth = imageColumnWidthPx - IMAGE_PADDING_PX * 2;
  const boxHeight = rowHeightPx - IMAGE_PADDING_PX * 2;

  const images = new Map<number, SheetImage | null>();
  let next = 0;
  const workers = Array.from({ length: Math.min(6, rows.length) }, async () => {
    while (next < rows.length) {
      const index = next++;
      const url = rows[index].photoUrl;
      if (!url) continue;
      let image: SheetImage | null = null;
      try {
        image = await loadImage(url);
      } catch {
        image = null;
      }
      images.set(index, image);
      onProgress?.(++imagesDone, imageCount);
    }
  });
  await Promise.all(workers);

  let qtyTotal = 0;
  let priceTotal = 0;
  rows.forEach((item, index) => {
    const rowNumber = FIRST_ITEM_ROW + index;
    const source =
      rows.length === 1
        ? firstStyle
        : index === 0
          ? firstStyle
          : rowNumber === lastRow
            ? lastStyle
            : middleStyle;
    applyStyles(rowNumber, source, ITEM_ROW_HEIGHT_PT);
    const row = ws.getRow(rowNumber);
    row.getCell(3).value = item.styleNumber;
    row.getCell(4).value = item.description;
    row.getCell(5).value = asSheetNumber(item.ctw);
    row.getCell(6).value = asSheetNumber(item.gtw);
    row.getCell(5).numFmt = "0.00";
    row.getCell(6).numFmt = "0.00";
    row.getCell(7).value = item.metal ?? null;
    row.getCell(8).value = item.quantity;
    row.getCell(8).numFmt = "0";
    if (item.price !== undefined) row.getCell(9).value = item.price;
    row.getCell(10).value = {
      formula: `IF(I${rowNumber}="","",H${rowNumber}*I${rowNumber})`,
      result: item.price !== undefined ? item.quantity * item.price : "",
    };
    qtyTotal += item.quantity;
    priceTotal += item.price !== undefined ? item.quantity * item.price : 0;

    const image = images.get(index);
    if (image) {
      const scale = Math.min(
        boxWidth / image.width,
        boxHeight / image.height,
        1,
      );
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const imageId = wb.addImage({
        buffer: image.buffer as unknown as ExcelJSNamespace.Buffer,
        extension: image.extension,
      });
      ws.addImage(imageId, {
        tl: {
          nativeCol: IMAGE_COLUMN_INDEX,
          nativeColOff: Math.round(((imageColumnWidthPx - width) / 2) * EMU_PER_PX),
          nativeRow: rowNumber - 1,
          nativeRowOff: Math.round(((rowHeightPx - height) / 2) * EMU_PER_PX),
        },
        ext: { width, height },
        editAs: "oneCell",
      } as unknown as ExcelJSNamespace.ImageRange);
    }
  });

  applyStyles(totalsRow, totalsStyle);
  const totals = ws.getRow(totalsRow);
  totals.getCell(2).value = "TOTAL";
  totals.getCell(8).value = {
    formula: `SUM(H${FIRST_ITEM_ROW}:H${lastRow})`,
    result: qtyTotal,
  };
  totals.getCell(10).value = {
    formula: `SUM(J${FIRST_ITEM_ROW}:J${lastRow})`,
    result: priceTotal,
  };
  applyStyles(totalsRow + 1, spacerStyle);

  ws.getCell("I5").value = picSheetDateLabel(date);
  return wb;
}

async function fetchTemplate(): Promise<ArrayBuffer> {
  const res = await fetch("/templates/pic-sheet.xlsx");
  if (!res.ok) throw new Error("Could not load the picture sheet template.");
  return res.arrayBuffer();
}

const MAX_IMAGE_EDGE_PX = 480;

const loadBrowserImage: ImageLoader = async (url) => {
  const res = await fetch(url);
  if (!res.ok) return null;
  const bitmap = await createImageBitmap(await res.blob());
  const scale = Math.min(1, MAX_IMAGE_EDGE_PX / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.85),
  );
  if (!blob) return null;
  return { buffer: await blob.arrayBuffer(), extension: "jpeg", width, height };
};

export async function downloadPicSheet(
  rows: PicSheetRow[],
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const ExcelJS = (await import("exceljs")).default;
  const date = new Date();
  const wb = await buildPicSheetWorkbook(
    ExcelJS,
    await fetchTemplate(),
    rows,
    loadBrowserImage,
    onProgress,
    date,
  );
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = picSheetFileName(date);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(href), 10_000);
}
