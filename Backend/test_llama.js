import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelPath = path.join(__dirname, "..", "AI", "models", "llama3.1.gguf");
const testPrompt = "Hello, how are you?";

console.log("Testing llama-cli with model:", modelPath);
console.log("Test prompt:", testPrompt);

const llamaArgs = [
  "-m", modelPath,
  "-p", testPrompt,
  "--temp", "0.7",
  "-n", "50",
  "--no-display-prompt",
  "--simple-io",
  "--no-conversation"
];

console.log("Command:", "llama-cli", llamaArgs.join(" "));

const process = spawn("llama-cli", llamaArgs);

let stdout = "";
let stderr = "";

process.stdout.on("data", (data) => {
  const chunk = data.toString();
  console.log("STDOUT CHUNK:", JSON.stringify(chunk));
  stdout += chunk;
});

process.stderr.on("data", (data) => {
  const chunk = data.toString();
  console.log("STDERR CHUNK:", JSON.stringify(chunk));
  stderr += chunk;
});

process.on("close", (code) => {
  console.log("\n=== PROCESS FINISHED ===");
  console.log("Exit code:", code);
  console.log("Full stdout:", JSON.stringify(stdout));
  console.log("Full stderr:", JSON.stringify(stderr));
  console.log("Stdout length:", stdout.length);
  console.log("Stderr length:", stderr.length);
});

process.on("error", (error) => {
  console.error("Process error:", error);
});

// Kill after 30 seconds if still running
setTimeout(() => {
  console.log("Timeout reached, killing process");
  process.kill();
}, 30000);