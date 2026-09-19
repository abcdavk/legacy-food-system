import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "jsonc-parser";

async function getJsonFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await getJsonFiles(path)));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(path);
    }
  }

  return files;
}

export async function generateVanillaFoods() {
  const vanillaFood: {
    typeId: string;
    nutrition: number;
  }[] = [];

  const files = await getJsonFiles("vanilla-foods");

  for (const file of files) {
    let data: any;

    try {
      const content = await readFile(file, "utf8");
      data = parse(content);
    } catch (error) {
      console.error(`Failed to parse JSONC: ${file}`);
      console.error(error instanceof Error ? error.message : error);
      continue;
    }

    const item = data["minecraft:item"];
    const food = item?.components?.["minecraft:food"];

    if (!food) continue;

    const identifier = item.description?.identifier;
    const nutrition = food.nutrition;

    if (!identifier || typeof nutrition !== "number") continue;

    vanillaFood.push({
      typeId: identifier,
      nutrition,
    });
  }

  vanillaFood.sort((a, b) => a.typeId.localeCompare(b.typeId));

  const output = `export const vanilla_food = ` + `${JSON.stringify(vanillaFood, null, 2)} as const;\n`;

  await mkdir("scripts/const", { recursive: true });
  await writeFile("scripts/const/vanilla.ts", output, "utf8");
}
