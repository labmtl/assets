import { readFileSync, writeFileSync, existsSync, copyFileSync } from "fs";
import { join } from "path";

const MANIFEST_PATH = join(process.cwd(), "processed_media/manifest.json");

if (!existsSync(MANIFEST_PATH)) {
  console.error("Manifest not found at", MANIFEST_PATH);
  process.exit(1);
}

// Backup before migration
const backupPath = `${MANIFEST_PATH}.migration-${Date.now()}.bak`;
copyFileSync(MANIFEST_PATH, backupPath);
console.log("Backup created at", backupPath);

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8"));

const translatedManifest = manifest.map((item: any) => {
  // Helper to ensure multilingual object
  const toMultilingual = (val: any) => {
    if (typeof val === "string") {
      return { en: val, fr: "" }; // We will fill FR later if possible
    }
    return val || { en: "", fr: "" };
  };

  item.base_name = toMultilingual(item.base_name);
  item.description = toMultilingual(item.description);

  // Simple heuristic translations for titles (replacing dashes with spaces and capitalizing)
  if (!item.base_name.fr && item.base_name.en) {
    let enTitle = item.base_name.en;
    // If it's a slug, make it readable
    if (enTitle.includes("-")) {
      enTitle = enTitle.replace(/-/g, " ");
      enTitle = enTitle.charAt(0).toUpperCase() + enTitle.slice(1);
    }
    item.base_name.en = enTitle;
    
    // Basic translations for common terms in titles
    let frTitle = enTitle
      .replace(/Screenshot/gi, "Capture d'écran")
      .replace(/Interface/gi, "Interface")
      .replace(/Page/gi, "Page")
      .replace(/Website/gi, "Site web")
      .replace(/Creator/gi, "Créateur")
      .replace(/Powered/gi, "Propulsé")
      .replace(/List/gi, "Liste")
      .replace(/Details/gi, "Détails")
      .replace(/Sustainable/gi, "Durable")
      .replace(/Urban/gi, "Urbain")
      .replace(/Design/gi, "Design")
      .replace(/Project/gi, "Projet")
      .replace(/French/gi, "Français");
    
    item.base_name.fr = frTitle;
  }

  // Descriptions: If we have an English description but no French one
  if (!item.description.fr && item.description.en) {
    // For now, I'll use a placeholder or a very basic summary translation
    // In a real scenario, we'd use an AI for this, but I can do some manual-ish ones for the known items
    if (item.description.en.includes("user interface for managing CVs")) {
      item.description.fr = "Cette image montre une interface utilisateur pour la gestion des CV sur un site web ou une application. La page est intitulée « Liste des CVs ».";
    } else if (item.description.en.includes("Cohabitat")) {
      item.description.fr = "Capture d'écran du site Cohabitat.cc, affichant les détails financiers et les coûts opérationnels d'un projet.";
    } else if (item.description.en.includes("Resto Danny")) {
      item.description.fr = "Capture d'écran du site web de Resto Danny, montrant le menu et l'ambiance du restaurant.";
    } else {
      item.description.fr = item.description.en; // Fallback to EN if no specific translation logic
    }
  }

  return item;
});

writeFileSync(MANIFEST_PATH, JSON.stringify(translatedManifest, null, 2));
console.log("Migration complete. Manifest updated with multilingual support and basic translations.");
