import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test the AI integration
const pythonScript = path.resolve(__dirname, "..", "AI", "ai python", "main.py");
const modelPath = path.resolve(__dirname, "..", "AI", "models", "llama3.1.gguf");

console.log("Testing AI Integration...");
console.log("Python Script:", pythonScript);
console.log("Model Path:", modelPath);

// Check if files exist
if (!fs.existsSync(pythonScript)) {
    console.error("❌ Python script not found:", pythonScript);
    process.exit(1);
}

if (!fs.existsSync(modelPath)) {
    console.error("❌ Model file not found:", modelPath);
    console.log("Please ensure the llama3.1.gguf model is in the correct location.");
    process.exit(1);
}

console.log("✅ Files found, testing AI service...");

// Test the AI service
const pythonCommands = ['python', 'python3', 'py'];
let commandIndex = 0;

const testAI = () => {
    if (commandIndex >= pythonCommands.length) {
        console.error("❌ No working Python installation found");
        process.exit(1);
    }
    
    const pythonCmd = pythonCommands[commandIndex];
    console.log(`Testing with: ${pythonCmd}`);
    
    try {
        const pythonProcess = spawn(pythonCmd, [pythonScript, "--service"], {
            cwd: path.dirname(pythonScript),
            env: { ...process.env, MODEL_PATH: modelPath }
        });
        
        let aiResponse = "";
        let errorOutput = "";
        
        const timeout = setTimeout(() => {
            pythonProcess.kill();
            console.error("❌ AI response timeout");
            commandIndex++;
            testAI();
        }, 15000);
        
        pythonProcess.stdout.on("data", (data) => {
            aiResponse += data.toString();
        });
        
        pythonProcess.stderr.on("data", (data) => {
            errorOutput += data.toString();
        });
        
        pythonProcess.on("close", (code) => {
            clearTimeout(timeout);
            console.log(`Process exited with code: ${code}`);
            
            if (errorOutput) {
                console.log("Stderr output:", errorOutput);
            }
            
            if (code === 0 && aiResponse.trim()) {
                try {
                    const result = JSON.parse(aiResponse.trim());
                    if (result.response) {
                        console.log("✅ AI Test Successful!");
                        console.log("AI Response:", result.response);
                    } else {
                        console.log("⚠️ AI responded with error:", result.error);
                    }
                } catch (e) {
                    console.error("❌ JSON parse error:", e);
                    console.log("Raw response:", aiResponse);
                }
            } else {
                console.log(`❌ AI test failed with ${pythonCmd}, trying next...`);
                commandIndex++;
                testAI();
            }
        });
        
        pythonProcess.on("error", (error) => {
            clearTimeout(timeout);
            console.error(`❌ Failed to start ${pythonCmd}:`, error.message);
            commandIndex++;
            testAI();
        });
        
        // Send test input
        const testInput = {
            system_prompt: "You are Aera, a helpful AI assistant.",
            conversation_history: "",
            user_input: "Hello, can you introduce yourself?"
        };
        
        pythonProcess.stdin.write(JSON.stringify(testInput));
        pythonProcess.stdin.end();
        
    } catch (error) {
        console.error(`❌ Error spawning ${pythonCmd}:`, error);
        commandIndex++;
        testAI();
    }
};

testAI();