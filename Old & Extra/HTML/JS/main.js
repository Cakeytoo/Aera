// js/main.js

// Wait until DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const chatBox = document.getElementById("chat-box");
  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");
  const themeBtn = document.getElementById("theme-btn");

  // Handle sending messages
  function sendMessage() {
    const text = input.value.trim();
    if (text === "") return;

    // Create message bubble
    const msg = document.createElement("div");
    msg.classList.add("message", "user-message");
    msg.textContent = text;

    chatBox.appendChild(msg);
    input.value = "";

    // Auto-scroll to bottom
    chatBox.scrollTop = chatBox.scrollHeight;

    // Fake bot response
    setTimeout(() => {
      const botMsg = document.createElement("div");
      botMsg.classList.add("message", "bot-message");
      botMsg.textContent = "🤖 Bot reply: " + text;
      chatBox.appendChild(botMsg);
      chatBox.scrollTop = chatBox.scrollHeight;
    }, 600);
  }

  // Button click
  sendBtn.addEventListener("click", sendMessage);

  // Press Enter key
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });

  // Theme toggle
  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
  });
});
