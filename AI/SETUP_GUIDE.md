# Aera AI Setup Guide

## Prerequisites
1. **Python 3.8 or higher** installed on your system
2. **Node.js** for the backend server
3. **llama3.1.gguf model** in the `AI/models/` directory

## Installation Steps

### 1. Install Python Dependencies

#### Option A: Automatic Installation (Recommended)
Run the installation script:
```bash
# On Windows
cd AI
install_requirements.bat

# On macOS/Linux
cd AI
chmod +x install_requirements.sh
./install_requirements.sh
```

#### Option B: Manual Installation
```bash
cd AI
pip install -r requirements.txt
```

#### Option C: If you have CMake issues (CPU-only)
```bash
pip install llama-cpp-python --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cpu
pip install numpy>=1.21.0 requests>=2.25.0
```

### 2. Verify Model Location
Make sure your `llama3.1.gguf` model file is located at:
```
AI/models/llama3.1.gguf
```

### 3. Test the AI Integration
```bash
cd Backend
node test_ai.js
```

## Troubleshooting

### Common Issues

#### 1. "CMake not found" or compilation errors
- **Solution**: Use the pre-compiled wheels:
  ```bash
  pip install llama-cpp-python --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cpu
  ```

#### 2. "Python not found" error
- **Solution**: Make sure Python is installed and added to your PATH
- Try different commands: `python`, `python3`, or `py`

#### 3. "Model file not found"
- **Solution**: Ensure the model file is in the correct location: `AI/models/llama3.1.gguf`

#### 4. "Permission denied" errors
- **Solution**: Run the command prompt as administrator (Windows) or use `sudo` (macOS/Linux)

#### 5. AI responses are slow
- **Solution**: The model is running on CPU. For faster responses:
  - Use a smaller model
  - Install CUDA support if you have an NVIDIA GPU
  - Increase the number of threads in the Python script

### Performance Tips

1. **For NVIDIA GPU users**:
   ```bash
   CMAKE_ARGS="-DLLAMA_CUBLAS=on" pip install llama-cpp-python --force-reinstall --no-cache-dir
   ```

2. **For Apple Silicon Mac users**:
   ```bash
   CMAKE_ARGS="-DLLAMA_METAL=on" pip install llama-cpp-python --force-reinstall --no-cache-dir
   ```

3. **Adjust thread count**: Edit `main.py` and change `n_threads=8` to match your CPU cores

## Testing

After installation, test the integration:

1. **Test AI directly**:
   ```bash
   cd "AI/ai python"
   python main.py
   ```

2. **Test through backend**:
   ```bash
   cd Backend
   node test_ai.js
   ```

3. **Test full application**:
   - Start the backend: `cd Backend && node server.js`
   - Start the frontend: `cd React && npm run dev`
   - Try sending a message in the chat interface

## Fallback Mode

If the AI model fails to load, the system will automatically fall back to basic responses. This ensures the application continues to work even if there are AI setup issues.

## Support

If you continue to have issues:
1. Check the console output for specific error messages
2. Verify all file paths are correct
3. Ensure Python and Node.js are properly installed
4. Try the fallback installation methods above