import { readFileSync, unlinkSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PID_FILE = join(__dirname, '..', '.server.pid');

if (!existsSync(PID_FILE)) {
  console.log("Server is not running (no .server.pid)");
  process.exit(0);
}

const pid = readFileSync(PID_FILE, 'utf-8').trim();
if (!/^\d+$/.test(pid)) {
  console.log(`Invalid PID: ${pid}`);
  try { unlinkSync(PID_FILE); } catch {}
  process.exit(1);
}
try {
  execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
  console.log(`Stopped server (PID: ${pid})`);
} catch {
  console.log(`Process ${pid} already stopped`);
}
try { unlinkSync(PID_FILE); } catch {}
