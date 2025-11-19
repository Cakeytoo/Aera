# Aera - AI-Powered Chat Assistant

A modern, full-stack AI chat application with intelligent conversation management and user authentication.

## ✨ Features

- 🤖 **AI-Powered Conversations** - Integrated with Llama 3.1 model
- 💬 **Multi-Session Chat** - Create and manage multiple chat sessions
- 👤 **User Authentication** - Secure login/signup with JWT
- 🎨 **Modern UI** - Beautiful, responsive React interface
- ⚙️ **Customizable AI** - Personal pre-prompts and settings
- 🔄 **Smart Fallback** - Works even without AI model installed
- 🌐 **Cross-Platform** - Windows, Linux, macOS support

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- Python 3.8+ (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/cakeytoo/Aera.git
   cd Aera
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd Backend
   npm install
   
   # Frontend
   cd ../React
   npm install
   ```

3. **Start the application**
   ```bash
   # Windows
   start_aera.bat
   
   # Linux/macOS
   chmod +x start_aera.sh
   ./start_aera.sh
   ```

4. **Access the app**
 http://localhost:5173

## 🤖 AI Setup 

For full AI functionality, install the Python dependencies:

```bash
cd AI
# Windows
install_requirements.bat

# Linux/macOS
chmod +x install_requirements.sh
./install_requirements.sh
```

### AI Model
1. Download the AI Model from (https://drive.google.com/file/d/1bzNinfqJqY0K8HPUmKskFA4HBlxufZol/view?usp=sharing)
2. Place the `.gguf` file in `AI/models/` directory

## 🛠️ Development

### Backend (Node.js/Express)
```bash
cd Backend
node server.js
```

### Frontend (React/Vite)
```bash
cd React
npm run dev
```

### AI Service (Python)
```bash
cd "AI/ai python"
python main.py
```

## 🙏 Acknowledgments

- Built with React, Node.js, and Express
- AI powered by Llama 3.1
- UI components styled with Tailwind CSS
