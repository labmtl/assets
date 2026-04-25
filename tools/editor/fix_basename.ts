import { readFileSync, writeFileSync, existsSync, copyFileSync } from "fs";
import { join } from "path";

const MANIFEST_PATH = join(process.cwd(), "processed_media/manifest.json");

if (!existsSync(MANIFEST_PATH)) {
  console.error("Manifest not found at", MANIFEST_PATH);
  process.exit(1);
}

// Backup before fixing
const backupPath = `${MANIFEST_PATH}.fix-basename-${Date.now()}.bak`;
copyFileSync(MANIFEST_PATH, backupPath);

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8"));

const fixedManifest = manifest.map((item: any) => {
  // 1. Restore base_name from the file paths if it's an object
  if (typeof item.base_name !== "string") {
    // Look at formats.images[0].path and extract the name
    // e.g. "processed_media/images/ai-powered-cv-creator-french-webpage-screenshot-1920w.jpg"
    const firstPath = item.formats.images[0].path;
    const parts = firstPath.split("/");
    const fileName = parts[parts.length - 1];
    // Remove the suffix (e.g. -1920w.jpg)
    const baseNameMatch = fileName.match(/^(.*?)-\d+w\.\w+$/);
    const baseName = baseNameMatch ? baseNameMatch[1] : item.id; // fallback to ID
    
    // 2. Create the multilingual title from the old multilingual base_name
    item.title = item.base_name;
    item.base_name = baseName;
  } else {
    // If base_name was already a string, initialize title
    item.title = {
      en: item.base_name.replace(/-/g, " ").charAt(0).toUpperCase() + item.base_name.slice(1).replace(/-/g, " "),
      fr: ""
    };
  }

  return item;
});

writeFileSync(MANIFEST_PATH, JSON.stringify(fixedManifest, null, 2));
console.log("Fixed base_name. It is now a string again. Multilingual display name is now in 'title' field.");
