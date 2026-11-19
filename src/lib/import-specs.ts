import { getCategorySpecConfig } from "@/lib/category-specs";

/**
 * Builds the product `specs` object from a Standard CSV row, using the same keys
 * as the admin product form (src/lib/category-specs.ts) so imported specs show
 * up in the form.
 *
 * - `voltage`, `capacity`, `wattage` columns map onto the category's fields.
 *   Adapters have no "voltage" field, so voltage goes into "output" ("19.5V 3.34A").
 * - Any `spec_<key>` column is copied as-is, e.g. `spec_cells` -> specs.cells.
 *
 * Returns undefined when the row has no specs, so a re-import doesn't wipe
 * specs that were entered by hand in the admin panel.
 */
export function specsFromRow(row: Record<string, string>, categoryName: string): Record<string, string> | undefined {
  const fieldKeys = new Set(getCategorySpecConfig(categoryName).fields.map((f) => f.key));
  const specs: Record<string, string> = {};
  const set = (key: string, value: string | undefined) => {
    const v = value?.trim();
    if (v) specs[key] = v;
  };

  const voltage = row["voltage"] || row["Voltage"];
  set(fieldKeys.has("voltage") || !fieldKeys.has("output") ? "voltage" : "output", voltage);
  set("capacity", row["capacity"] || row["Capacity"]);
  set("wattage", row["wattage"] || row["Wattage"]);

  for (const [column, value] of Object.entries(row)) {
    if (column.startsWith("spec_") && column.length > 5) set(column.slice(5), value);
  }

  return Object.keys(specs).length > 0 ? specs : undefined;
}
