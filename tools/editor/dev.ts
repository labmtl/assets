import { spawn } from "bun";

console.log("\x1b[36mStarting Manifest Editor (Backend + Frontend)...\x1b[0m");

// 1. Start the Backend Server with --watch
const backend = spawn([process.execPath, "--watch", "server.ts"], {
  stdout: "inherit",
  stderr: "inherit",
});

// 2. Start the Vite Frontend
const frontend = spawn([process.execPath, "run", "dev"], {
  stdout: "inherit",
  stderr: "inherit",
});

// Handle termination
process.on("SIGINT", () => {
  console.log("\n\x1b[33mShutting down...\x1b[0m");
  backend.kill();
  frontend.kill();
  process.exit();
});

// Keep process alive
setInterval(() => {}, 1000);
