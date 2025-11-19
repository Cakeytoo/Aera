import { useEffect, useState, useRef } from "react";
import "./Chatbox.css";

export default function Chatbox() {
  const [messages, setMessages] = useState([
    { from: "ai", text: "Hello! I'm Aera, your intelligent assistant. How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [userName, setUserName] = useState("Aera User");
  const [userPrePrompt, setUserPrePrompt] = useState("");
  const [tempPrePrompt, setTempPrePrompt] = useState("");
  const [chatSessions, setChatSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [editingTitle, setEditingTitle] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (window.AOS) window.AOS.init();
    if (window.feather) window.feather.replace();
  }, [messages, showSettings, chatSessions]);

  useEffect(() => {
    // Load dark mode preference
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedDarkMode);
    
    // Always fetch user info from backend to get latest data
    const token = localStorage.getItem("token");
    if (token) {
      fetchUserInfo();
      loadChatSessions();
    }
  }, []);

  const fetchUserInfo = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    try {
      const response = await fetch("http://localhost:3000/user/info", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.user) {
        setUserName(data.user.name || "User");
        setUserPrePrompt(data.user.prePrompt || "");
        setTempPrePrompt(data.user.prePrompt || "");
      }
    } catch (error) {
      console.error("Failed to fetch user info:", error);
    }
  };

  const loadChatSessions = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    try {
      const response = await fetch("http://localhost:3000/chat/sessions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setChatSessions(data.sessions);
        if (data.sessions.length > 0) {
          const mostRecent = data.sessions[0];
          setCurrentSessionId(mostRecent.id);
          await loadChatMessages(mostRecent.id);
        } else {
          await createNewChat();
        }
      }
    } catch (error) {
      console.error("Failed to load chat sessions:", error);
    }
  };

  const loadChatMessages = async (sessionId) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    try {
      const response = await fetch(`http://localhost:3000/chat/messages/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        const formattedMessages = data.messages.map(msg => ({
          from: msg.message_type,
          text: msg.content
        }));
        setMessages(formattedMessages.length > 0 ? formattedMessages : [
          { from: "ai", text: "Hello! I'm Aera, your intelligent assistant. How can I help you today?" }
        ]);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const getUserInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentSessionId) return;

    const userMsg = { from: "user", text: input.trim() };
    const isFirstMessage = messages.length === 1 && messages[0].from === "ai";
    
    setMessages((prev) => [...prev, userMsg]);
    
    const userInput = input.trim();
    setInput("");

    // Save user message to backend
    await saveMessage("user", userInput);
    
    // Auto-name chat after first user message
    if (isFirstMessage) {
      const chatTitle = userInput.length > 30 ? userInput.substring(0, 30) + "..." : userInput;
      await updateChatTitle(currentSessionId, chatTitle);
    }

    try {
      // Build conversation history for the AI
      const conversationHistory = messages.map(msg => 
        `${msg.from === 'user' ? 'Human' : 'AI'}: ${msg.text}`
      ).join('\n');
      
      const systemPrompt = userPrePrompt || "You are a friendly and knowledgeable tutor. Answer questions clearly and concisely. If the user's request is unclear, ask up to two clarifying questions first. Do not give unrelated examples or invent topics. Stay strictly on what the user asks.";
      
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3000/chat/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userInput,
          systemPrompt: systemPrompt,
          conversationHistory: conversationHistory
        })
      });
      
      const data = await response.json();
      if (data.success && data.response) {
        const aiMsg = { from: "ai", text: data.response.trim() };
        setMessages((prev) => [...prev, aiMsg]);
        await saveMessage("ai", data.response.trim());
      } else {
        const errorMsg = { from: "ai", text: "I'm sorry, I'm having trouble processing your request right now." };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (error) {
      console.error("Failed to get AI response:", error);
      const errorMsg = { from: "ai", text: "I'm sorry, I'm having trouble connecting right now." };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  const saveMessage = async (messageType, content) => {
    const token = localStorage.getItem("token");
    if (!token || !currentSessionId) return;
    
    try {
      await fetch("http://localhost:3000/chat/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: currentSessionId,
          messageType,
          content
        })
      });
    } catch (error) {
      console.error("Failed to save message:", error);
    }
  };

  const updateChatTitle = async (sessionId, title) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    try {
      await fetch(`http://localhost:3000/chat/session/${sessionId}/title`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title })
      });
      await loadChatSessions();
    } catch (error) {
      console.error("Failed to update title:", error);
    }
  };

  const createNewChat = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    try {
      const response = await fetch("http://localhost:3000/chat/session/new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title: "New Chat" })
      });
      const data = await response.json();
      if (data.success) {
        setCurrentSessionId(data.sessionId);
        setMessages([{ from: "ai", text: "Hello! I'm Aera, your intelligent assistant. How can I help you today?" }]);
        await loadChatSessions();
      }
    } catch (error) {
      console.error("Failed to create new chat:", error);
    }
  };

  const deleteSession = async (sessionId, e) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) return;
    
    try {
      const response = await fetch(`http://localhost:3000/chat/session/${sessionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        await loadChatSessions();
        if (currentSessionId === sessionId) {
          const remainingSessions = chatSessions.filter(s => s.id !== sessionId);
          if (remainingSessions.length > 0) {
            await switchToChat(remainingSessions[0].id);
          } else {
            await createNewChat();
          }
        }
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  };

  const startEditingTitle = (sessionId, currentTitle, e) => {
    e.stopPropagation();
    setEditingTitle(sessionId);
    setEditTitle(currentTitle);
  };

  const saveTitle = async (sessionId) => {
    if (editTitle.trim()) {
      await updateChatTitle(sessionId, editTitle.trim());
    }
    setEditingTitle(null);
    setEditTitle("");
  };

  const switchToChat = async (sessionId) => {
    setCurrentSessionId(sessionId);
    await loadChatMessages(sessionId);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", newDarkMode.toString());
  };

  const updateUserSettings = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    try {
      const response = await fetch("http://localhost:3000/user/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: userName,
          prePrompt: tempPrePrompt
        })
      });
      const data = await response.json();
      if (data.success) {
        setUserPrePrompt(tempPrePrompt);
        setShowSettings(false);
      }
    } catch (error) {
      console.error("Failed to update user settings:", error);
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-shrink-0">
        <div className={`flex flex-col w-64 border-r ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center justify-center p-4 border-b border-gray-200">
            <button 
              className="flex items-center space-x-2 text-gray-800 hover:text-purple-500 transition"
              onClick={createNewChat}
            >
              <i data-feather="plus" className="w-5 h-5"></i>
              <span className="font-medium">New Chat</span>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
            <div className="space-y-2">
              {chatSessions.map((session) => (
                <div 
                  key={session.id} 
                  className={`p-3 rounded-lg cursor-pointer group hover:bg-gray-100 ${currentSessionId === session.id ? 'bg-purple-50 border-l-4 border-purple-500' : ''}`}
                  onClick={() => switchToChat(session.id)}
                >
                  {editingTitle === session.id ? (
                    <input 
                      type="text" 
                      value={editTitle} 
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') saveTitle(session.id);
                        if (e.key === 'Escape') setEditingTitle(null);
                      }}
                      onBlur={() => saveTitle(session.id)}
                      className="w-full text-sm bg-transparent border-none outline-none"
                      autoFocus
                    />
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{session.title}</span>
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          className="p-1 hover:bg-gray-200 rounded"
                          onClick={(e) => startEditingTitle(session.id, session.title, e)}
                        >
                          <i data-feather="edit-2" className="w-3 h-3"></i>
                        </button>
                        <button 
                          className="p-1 hover:bg-red-100 rounded text-red-600"
                          onClick={(e) => deleteSession(session.id, e)}
                        >
                          <i data-feather="trash-2" className="w-3 h-3"></i>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center">
                <span className="text-white font-medium text-sm">{getUserInitials(userName)}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-gray-500">Free Plan</p>
              </div>
              <button
                className="text-gray-500 hover:text-gray-700 transition"
                onClick={() => setShowSettings(true)}
              >
                <i data-feather="settings" className="w-5 h-5"></i>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200">
          <div className="flex items-center justify-center px-4 py-3">
            <h1 className="text-xl font-bold gradient-text">Aera</h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-thin p-4 bg-gray-50">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex space-x-3 ${m.from === "user" ? "justify-end" : ""}`}>
                {m.from === "ai" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full gradient-bg flex items-center justify-center">
                    <i data-feather="cpu" className="w-4 h-4 text-white"></i>
                  </div>
                )}
                <div className="flex-1 max-w-xl">
                  <div className={`p-4 ${m.from === "ai" ? "chat-bubble-ai" : "chat-bubble-user"}`}>
                    <p>{m.text}</p>
                  </div>
                </div>
                {m.from === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full gradient-bg flex items-center justify-center">
                    <span className="text-white font-medium text-sm">{getUserInitials(userName)}</span>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </main>

        <div className="border-t border-gray-200 bg-white p-4">
          <div className="max-w-3xl mx-auto flex items-center">
            <textarea
              rows="1"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Message Aera..."
              className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              className="ml-2 p-2 gradient-bg text-white rounded-lg hover:opacity-90 transition"
              onClick={sendMessage}
            >
              <i data-feather="send" className="w-5 h-5"></i>
            </button>
          </div>
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="font-bold text-lg">Settings</h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowSettings(false)}
              >
                <i data-feather="x" className="w-5 h-5"></i>
              </button>
            </div>
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                <input 
                  type="text" 
                  value={userName} 
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>AI Pre-prompt</label>
                <textarea 
                  value={tempPrePrompt} 
                  onChange={(e) => setTempPrePrompt(e.target.value)}
                  placeholder="Enter a pre-prompt to customize AI responses..."
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${darkMode ? 'border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400' : 'border-gray-300 bg-white text-gray-800'}`}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Dark Mode</label>
                <button
                  onClick={toggleDarkMode}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${darkMode ? 'bg-purple-600' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <button 
                onClick={updateUserSettings}
                className="w-full gradient-bg text-white py-2 px-4 rounded-lg hover:opacity-90 transition"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}