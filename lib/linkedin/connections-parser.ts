import JSZip from "jszip";
import type { NetworkConnection } from "@/types/network";

/**
 * Parse LinkedIn Connections.csv from inside a ZIP file.
 * LinkedIn export ZIPs contain a "Connections.csv" at the root.
 */
export async function parseConnectionsFromZip(zipFile: File): Promise<NetworkConnection[]> {
  const zip = await JSZip.loadAsync(zipFile);

  // Find Connections.csv (case-insensitive, may be nested)
  const csvEntry = Object.values(zip.files).find(
    (f) => !f.dir && f.name.toLowerCase().endsWith("connections.csv"),
  );

  if (!csvEntry) {
    throw new Error("No Connections.csv found inside the ZIP file.");
  }

  const csvText = await csvEntry.async("text");
  return parseConnectionsCSVText(csvText);
}

/**
 * Parse raw CSV text of LinkedIn Connections.csv into NetworkConnection[].
 * LinkedIn Connections.csv columns:
 *   First Name, Last Name, Email Address, Company, Position, Connected On
 * There may be extra header/note rows before the actual header row.
 */
function parseConnectionsCSVText(csvText: string): NetworkConnection[] {
  const rawLines = csvText.split(/\r?\n/);

  // Find the header row (contains "First Name" or "first name")
  let headerIndex = -1;
  for (let i = 0; i < rawLines.length; i++) {
    if (rawLines[i].toLowerCase().includes("first name")) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    throw new Error("Could not find column headers in Connections.csv.");
  }

  const headers = parseCSVRow(rawLines[headerIndex]).map((h) => h.trim().toLowerCase());

  const colIndex = {
    firstName: headers.indexOf("first name"),
    lastName: headers.indexOf("last name"),
    email: headers.findIndex((h) => h.includes("email")),
    company: headers.indexOf("company"),
    position: headers.indexOf("position"),
    connectedOn: headers.findIndex((h) => h.includes("connected")),
  };

  const connections: NetworkConnection[] = [];

  for (let i = headerIndex + 1; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (!line) continue;

    const cols = parseCSVRow(line);
    if (cols.length < 2) continue;

    const get = (idx: number): string | null => {
      if (idx < 0 || idx >= cols.length) return null;
      const val = cols[idx].trim();
      return val === "" ? null : val;
    };

    connections.push({
      first_name: get(colIndex.firstName),
      last_name: get(colIndex.lastName),
      email: get(colIndex.email),
      company: get(colIndex.company),
      position: get(colIndex.position),
      connected_on: get(colIndex.connectedOn),
    });
  }

  return connections;
}

/**
 * Parse a single CSV row, handling quoted fields with commas inside.
 */
function parseCSVRow(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

/**
 * Parse LinkedIn Connections CSV directly from a File object (no ZIP).
 */
export async function parseConnectionsCSV(file: File): Promise<NetworkConnection[]> {
  const text = await file.text();
  return parseConnectionsCSVText(text);
}
