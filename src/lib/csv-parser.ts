/**
 * Robust RFC 4180 compliant CSV parser.
 * Handles quoted fields, embedded commas, quotes, and multiline values.
 */
export function parseCSV(csvText: string): Record<string, string>[] {
  // Strip UTF-8 Byte Order Mark (BOM) if present
  const text = csvText.replace(/^\uFEFF/, "").trim();
  if (!text) return [];

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped double quote ("")
          currentField += '"';
          i++;
        } else {
          // Closing quote
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentField.trim());
        currentField = "";
      } else if (char === "\r") {
        if (nextChar === "\n") i++;
        currentRow.push(currentField.trim());
        rows.push(currentRow);
        currentRow = [];
        currentField = "";
      } else if (char === "\n") {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
        currentRow = [];
        currentField = "";
      } else {
        currentField += char;
      }
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.replace(/^["']|["']$/g, "").trim());
  const records: Record<string, string>[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    // Skip empty rows
    if (row.length === 0 || (row.length === 1 && !row[0])) continue;

    const record: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      record[headers[c]] = row[c] ?? "";
    }
    records.push(record);
  }

  return records;
}

