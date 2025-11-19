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
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

## 🤖 AI Setup (Optional)

For full AI functionality, install the Python dependencies:

```bash
cd AI
# Windows
install_requirements.bat

# Linux/macOS
chmod +x install_requirements.sh
./install_requirements.sh
```

**Note:** The app works with intelligent fallback responses even without the AI model installed.

### AI Model
1. Download Llama 3.1 model from [Hugging Face](https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf) or similar
2. Place the `.gguf` file in `AI/models/` directory
3. Rename it to `llama3.1.gguf` or update the path in your AI code

## 📁 Project Structure

```
Aera/
├── Backend/           # Node.js/Express API server
├── React/            # React frontend application  
├── AI/               # Python AI service
│   ├── ai python/    # AI processing scripts
│   └── models/       # AI model files (not in repo)
├── start_aera.*      # Easy startup scripts
└── README.md
```

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

## 🔧 Configuration

### Environment Variables
Create `.env` files in Backend/ and React/ directories:

**Backend/.env**
```
PORT=3000
JWT_SECRET=your-secret-key
```

**React/.env**
```
VITE_API_URL=http://localhost:3000
```

## 📋 API Endpoints

- `POST /signup` - User registration
- `POST /login` - User authentication  
- `POST /chat/ai` - AI chat endpoint
- `GET /chat/sessions` - Get user chat sessions
- `POST /chat/session/new` - Create new chat session

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Setup Guide](AI/SETUP_GUIDE.md) for detailed instructions
2. Run the test script: `node Backend/test_ai.js`
3. Open an issue on GitHub

## 🙏 Acknowledgments

- Built with React, Node.js, and Express
- AI powered by Llama 3.1
- UI components styled with Tailwind CSS