/**
 * LinkedIn export ZIP parser
 *
 * LinkedIn lets users export their data as a ZIP containing CSV files.
 * This module parses that ZIP client-side (no raw data hits our server).
 *
 * Key files in the export:
 *   Profile.csv         — headline, summary
 *   Positions.csv       — work history
 *   Education.csv       — education
 *   Skills.csv          — skill list
 *   Shares.csv          — posts/updates
 *   Articles.csv        — long-form articles
 */

import type {
  ParsedLinkedInData,
  LinkedInPosition,
  LinkedInEducation,
  LinkedInPost,
  LinkedInSkill,
} from "@/types/linkedin";

// ── Minimal CSV parser (no dependencies) ──────────────────────────────────────

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return [];

  // LinkedIn CSVs sometimes have a "Notes:" header block before the real CSV.
  // Skip lines until we find one that looks like a header row.
  let headerIdx = 0;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    if (lines[i].includes(",") || lines[i].startsWith('"')) {
      headerIdx = i;
      break;
    }
  }

  const headers = parseRow(lines[headerIdx]);
  const rows: Record<string, string>[] = [];

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseRow(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h.trim()] = (values[idx] ?? "").trim();
    });
    rows.push(obj);
  }

  return rows;
}

function parseRow(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
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

// ── Section parsers ────────────────────────────────────────────────────────────

function parseProfile(
  rows: Record<string, string>[],
): Pick<ParsedLinkedInData, "headline" | "summary" | "location"> {
  if (!rows.length) return { headline: null, summary: null, location: null };

  // LinkedIn's Profile.csv has a single data row
  const row = rows[rows.length - 1];

  return {
    headline: row["Headline"] || row["headline"] || null,
    summary: row["Summary"] || row["summary"] || null,
    location: row["Geo Location"] || row["Location"] || null,
  };
}

function parsePositions(rows: Record<string, string>[]): LinkedInPosition[] {
  return rows
    .filter((r) => r["Company Name"] || r["company name"])
    .map((r) => {
      const finished = r["Finished On"] || r["finished on"] || "";
      return {
        company: r["Company Name"] || r["company name"] || "",
        title: r["Title"] || r["title"] || "",
        description: r["Description"] || r["description"] || null,
        location: r["Location"] || r["location"] || null,
        started_on: r["Started On"] || r["started on"] || null,
        finished_on: finished || null,
        is_current: !finished,
      };
    });
}

function parseEducation(rows: Record<string, string>[]): LinkedInEducation[] {
  return rows
    .filter((r) => r["School Name"] || r["school name"])
    .map((r) => ({
      school: r["School Name"] || r["school name"] || "",
      degree: r["Degree Name"] || r["degree name"] || null,
      field: r["Field Of Study"] || r["field of study"] || null,
      started_on: r["Start Date"] || r["start date"] || null,
      finished_on: r["End Date"] || r["end date"] || null,
      notes: r["Notes"] || r["notes"] || null,
    }));
}

function parseSkills(rows: Record<string, string>[]): LinkedInSkill[] {
  return rows
    .filter((r) => r["Name"] || r["name"])
    .map((r) => ({ name: r["Name"] || r["name"] || "" }))
    .filter((s) => s.name.length > 0);
}

function parseShares(rows: Record<string, string>[]): LinkedInPost[] {
  return rows
    .filter((r) => {
      const text = r["ShareCommentary"] || r["Share Commentary"] || r["commentary"] || "";
      return text.trim().length > 10;
    })
    .map((r) => ({
      date: r["Date"] || r["date"] || "",
      text: (r["ShareCommentary"] || r["Share Commentary"] || r["commentary"] || "").trim(),
      url: r["ShareLink"] || r["Share Link"] || r["url"] || null,
      type: "post" as const,
      title: null,
    }))
    .sort((a, b) => (b.date > a.date ? 1 : -1));
}

function parseArticles(rows: Record<string, string>[]): LinkedInPost[] {
  return rows
    .filter((r) => r["Title"] || r["title"])
    .map((r) => ({
      date: r["PublishedAt"] || r["Published At"] || r["date"] || "",
      text: r["Description"] || r["description"] || r["Title"] || r["title"] || "",
      url: r["Url"] || r["url"] || null,
      type: "article" as const,
      title: r["Title"] || r["title"] || null,
    }))
    .sort((a, b) => (b.date > a.date ? 1 : -1));
}

// ── Main entry — parse a JSZip instance ───────────────────────────────────────

export async function parseLinkedInZip(
  zipFile: File,
): Promise<ParsedLinkedInData> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(zipFile);

  async function readCsv(filename: string): Promise<Record<string, string>[]> {
    // Try exact match, then case-insensitive
    let file = zip.file(filename);
    if (!file) {
      const key = Object.keys(zip.files).find(
        (k) => k.toLowerCase() === filename.toLowerCase() ||
               k.toLowerCase().endsWith("/" + filename.toLowerCase()),
      );
      file = key ? zip.file(key) : null;
    }
    if (!file) return [];
    const text = await file.async("string");
    return parseCSV(text);
  }

  const [profileRows, positionRows, educationRows, skillRows, shareRows, articleRows] =
    await Promise.all([
      readCsv("Profile.csv"),
      readCsv("Positions.csv"),
      readCsv("Education.csv"),
      readCsv("Skills.csv"),
      readCsv("Shares.csv"),
      readCsv("Articles.csv"),
    ]);

  const profileData = parseProfile(profileRows);
  const positions   = parsePositions(positionRows);
  const education   = parseEducation(educationRows);
  const skills      = parseSkills(skillRows);
  const posts       = [
    ...parseShares(shareRows),
    ...parseArticles(articleRows),
  ].sort((a, b) => (b.date > a.date ? 1 : -1));

  return {
    ...profileData,
    positions,
    education,
    skills,
    posts,
  };
}
