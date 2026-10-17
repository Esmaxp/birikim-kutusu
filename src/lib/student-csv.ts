export type CsvStudent = { line: number; sube: string; no: number; ad: string; error?: string };
/** RFC4180-style quoting, including escaped quotes and embedded newlines. */
export function parseStudentCsv(text: string): CsvStudent[] {
  if (text.length > 200000) throw new Error("CSV en fazla 200 KB olabilir.");
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let quoted = false;
  text = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (quoted && text[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted; }
    else if (!quoted && c === ",") { row.push(cell.trim()); cell = ""; }
    else if (!quoted && (c === "\n" || c === "\r")) { row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); row = []; cell = ""; if (c === "\r" && text[i + 1] === "\n") i++; }
    else cell += c;
  }
  if (quoted) throw new Error("CSV içinde kapatılmamış tırnak var.");
  row.push(cell.trim()); if (row.some(Boolean)) rows.push(row);
  if (rows.shift()?.join(",").toLowerCase() !== "sube,no,ad") throw new Error("CSV başlığı sube,no,ad olmalıdır.");
  if (!rows.length || rows.length > 500) throw new Error("CSV 1–500 öğrenci içermelidir.");
  const seen = new Set<string>();
  return rows.map((r, i) => {
    const [sube = "", number = "", ad = ""] = r;
    const no = Number(number); const key = `${sube}:${no}`;
    let error: string | undefined;
    if (r.length !== 3 || !sube || sube.length > 30 || !/^\d+$/.test(number) || !Number.isSafeInteger(no) || no < 1 || no > 999999 || ad.length < 3 || ad.length > 150) error = "Geçersiz şube, numara veya ad.";
    else if (seen.has(key)) error = "CSV içinde aynı şube/numara tekrar ediyor.";
    seen.add(key);
    return { line: i + 2, sube, no, ad, error };
  });
}
