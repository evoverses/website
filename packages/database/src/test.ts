import { evoTable } from "@workspace/database/schema/evo";
import * as fs from "fs";
import * as path from "path";
import { db } from "./client";

interface CsvRow {
  id: string;
  token_id: string;
  generation: string;
  total_breeds: string;
  last_breed_time: string;
  created_at: string;
  updated_at: string;
  attack: string;
  special: string;
  defense: string;
  resistance: string;
  speed: string;
  size: string;
  xp: string;
  gender: string;
  nature: string;
  rarity: string;
  species_id: string;
  chroma: string;
}

function parseTimestamp(timestamp: string): Date | null {
  if (timestamp === "1970-01-01 00:00:00.000") {
    return null;
  }
  return new Date(timestamp);
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === "\"") {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

async function upsertEvoData(csvFilePath: string) {
  try {
    // Read the CSV file
    const csvContent = fs.readFileSync(csvFilePath, "utf-8");
    const lines = csvContent.split("\n").filter(line => line.trim() !== "");

    if (lines.length === 0) {
      console.log("CSV file is empty");
      return;
    }

    // Parse header
    const headers = parseCsvLine(lines[0]!);
    console.log("Headers found:", headers);

    // Process each data row
    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i]!);

      if (values.length !== headers.length) {
        console.warn(`Row ${i + 1} has ${values.length} values but expected ${headers.length}. Skipping.`);
        continue;
      }

      // Create row object
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index]!;
      });

      try {
        // Prepare data for upsert
        const evoData = {
          tokenId: row.token_id || null,
          gender: row.gender as any || "unknown",
          generation: parseInt(row.generation!) || 0,
          nature: row.nature as any || "unknown",
          rarity: row.rarity as any || "unknown",
          chroma: row.chroma as any || "none",
          totalBreeds: parseInt(row.total_breeds!) || 0,
          lastBreedTime: parseTimestamp(row.last_breed_time!),
          createdAt: parseTimestamp(row.created_at!) || new Date(),
          updatedAt: parseTimestamp(row.updated_at!) || new Date(),
          attack: parseInt(row.attack!) || 0,
          special: parseInt(row.special!) || 0,
          defense: parseInt(row.defense!) || 0,
          resistance: parseInt(row.resistance!) || 0,
          speed: parseInt(row.speed!) || 0,
          size: parseInt(row.size!) || 0,
          xp: parseInt(row.xp!) || 0,
          treated: false, // Default value since not in CSV
          speciesId: parseInt(row.species_id!) || 0,
        };

        // Perform upsert using INSERT ... ON CONFLICT
        await db.insert(evoTable)
          .values(evoData)
          .onConflictDoUpdate({
            target: evoTable.tokenId,
            set: {
              gender: evoData.gender,
              generation: evoData.generation,
              nature: evoData.nature,
              rarity: evoData.rarity,
              chroma: evoData.chroma,
              totalBreeds: evoData.totalBreeds,
              lastBreedTime: evoData.lastBreedTime,
              updatedAt: new Date(),
              attack: evoData.attack,
              special: evoData.special,
              defense: evoData.defense,
              resistance: evoData.resistance,
              speed: evoData.speed,
              size: evoData.size,
              xp: evoData.xp,
              speciesId: evoData.speciesId,
            },
          });

        console.log(`Upserted token_id: ${row.token_id}`);

      } catch (error) {
        console.error(`Error processing row ${i + 1} (token_id: ${row.token_id}):`, error);
      }
    }

    console.log(`Successfully processed ${lines.length - 1} rows`);

  } catch (error) {
    console.error("Error reading or processing CSV file:", error);
  }
}

const main = async () => {
  const csvFilePath = path.join(__dirname, "..", "Result_8.csv");

  console.log("Starting CSV import...");
  await upsertEvoData(csvFilePath);
  console.log("CSV import completed");

  // Close database connection
  process.exit(0);
};

main().catch(console.error);
