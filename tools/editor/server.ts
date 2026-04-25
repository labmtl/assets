import { serve } from "bun";
import { join, dirname } from "path";
import { existsSync, readFileSync, writeFileSync, copyFileSync } from "fs";

const PORT = process.env.PORT || 3000;
const ASSETS_ROOT = process.env.ASSETS_ROOT || join(import.meta.dir, "../../");
const MANIFEST_PATH = join(ASSETS_ROOT, "processed_media/manifest.json");

const server = serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // Global CORS Headers
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle Preflight OPTIONS
    if (req.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    // API: Get Manifest
    if (url.pathname === "/api/manifest" && req.method === "GET") {
      try {
        if (!existsSync(MANIFEST_PATH)) {
          return new Response(JSON.stringify({ error: "Manifest not found" }), {
            status: 404,
            headers: { ...headers, "Content-Type": "application/json" },
          });
        }
        const content = readFileSync(MANIFEST_PATH, "utf-8");
        return new Response(content, {
          headers: { ...headers, "Content-Type": "application/json" },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: String(e) }), {
          status: 500,
          headers: { ...headers, "Content-Type": "application/json" },
        });
      }
    }

    // API: Save Manifest
    if (url.pathname === "/api/manifest" && req.method === "POST") {
      try {
        const body = await req.json();
        
        // Create backup
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const backupPath = `${MANIFEST_PATH}.${timestamp}.json.bak`;
        if (existsSync(MANIFEST_PATH)) {
          copyFileSync(MANIFEST_PATH, backupPath);
        }

        writeFileSync(MANIFEST_PATH, JSON.stringify(body, null, 2));
        
        return new Response(JSON.stringify({ success: true, backup: backupPath }), {
          headers: { ...headers, "Content-Type": "application/json" },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: String(e) }), {
          status: 500,
          headers: { ...headers, "Content-Type": "application/json" },
        });
      }
    }

    // API: Delete Media
    if (url.pathname === "/api/media" && req.method === "DELETE") {
      try {
        const { ids } = await req.json();
        if (!ids || !Array.isArray(ids)) {
          return new Response(JSON.stringify({ error: "Invalid IDs" }), { 
            status: 400,
            headers: { ...headers, "Content-Type": "application/json" }
          });
        }

        const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8"));
        const itemsToDelete = manifest.filter((item: any) => ids.includes(item.id));
        const updatedManifest = manifest.filter((item: any) => !ids.includes(item.id));

        // Delete files from disk
        for (const item of itemsToDelete) {
          item.formats.images.forEach((img: any) => {
            const filePath = join(ASSETS_ROOT, img.path);
            if (existsSync(filePath)) {
              require("fs").unlinkSync(filePath);
            }
          });
        }

        writeFileSync(MANIFEST_PATH, JSON.stringify(updatedManifest, null, 2));

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...headers, "Content-Type": "application/json" },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: String(e) }), { 
          status: 500,
          headers: { ...headers, "Content-Type": "application/json" }
        });
      }
    }

    // Serve processed_media for previews
    if (url.pathname.startsWith("/processed_media/")) {
      const filePath = join(ASSETS_ROOT, url.pathname);
      if (existsSync(filePath)) {
        return new Response(Bun.file(filePath));
      }
    }

    // Proxy to Vite during dev or serve build in prod
    // (For now, we'll assume the frontend handles its own dev server)
    return new Response("Manifest Editor Backend is running. Use Vite dev server for UI.", {
      headers: { "Content-Type": "text/plain" },
    });
  },
});

console.log(`Backend server running at http://localhost:${PORT}`);
