import sys
import json
import os

# Try to import llama_cpp, handle import errors gracefully
try:
    from llama_cpp import Llama
    LLAMA_AVAILABLE = True
except ImportError as e:
    print(f"Warning: llama-cpp-python not installed: {str(e)}", file=sys.stderr)
    LLAMA_AVAILABLE = False
    Llama = None

# Initialize model with better path handling
model = None
if LLAMA_AVAILABLE:
    try:
        # Try environment variable first, then relative path
        model_path = os.environ.get('MODEL_PATH')
        if not model_path:
            # Fallback to relative path
            script_dir = os.path.dirname(os.path.abspath(__file__))
            model_path = os.path.join(script_dir, "..", "models", "llama3.1.gguf")
        
        model_path = os.path.abspath(model_path)
        
        if not os.path.exists(model_path):
            print(f"Warning: Model file not found: {model_path}", file=sys.stderr)
            print("AI will use fallback responses until model is available", file=sys.stderr)
        else:
            print(f"Loading model from: {model_path}", file=sys.stderr)
            model = Llama(
                model_path=model_path,
                n_threads=4,  # Reduced for better compatibility
                n_ctx=2048,   # Context window
                verbose=False
            )
            print("Model loaded successfully", file=sys.stderr)
    except Exception as e:
        print(f"Warning: Failed to load model: {str(e)}", file=sys.stderr)
        print("AI will use fallback responses until model is available", file=sys.stderr)
        model = None

system_instruction = (
    "You are a friendly and knowledgeable tutor. "
    "Answer questions clearly and concisely. "
    "If the user's request is unclear, ask up to two clarifying questions first. "
    "Do not give unrelated examples or invent topics. Stay strictly on what the user asks."
)

conversation = [system_instruction]

def generate_response(user_input):
    # Append the user input
    conversation.append(f"Human: {user_input}")
    
    # Build full prompt every time
    prompt = "\n".join(conversation) + "\nAI:"
    
    response = model(
        prompt=prompt,
        max_tokens=256,
        stop=["Human:", "AI:"]
    )
    
    answer = response['choices'][0]['text'].strip()
    conversation.append(f"AI: {answer}")
    return answer

def generate_service_response(system_prompt, conversation_history, user_input):
    # Check if model is available
    if not model or not LLAMA_AVAILABLE:
        # Fallback response when model is not available
        fallback_responses = {
            "hello": "Hello! I'm Aera, your AI assistant. How can I help you today?",
            "hi": "Hi there! I'm here to help. What would you like to know?",
            "how are you": "I'm doing well, thank you for asking! How can I assist you?",
            "what is your name": "I'm Aera, your AI assistant. I'm here to help answer your questions.",
            "help": "I'm Aera, your AI assistant. I can help answer questions, provide information, and assist with various tasks. What would you like to know?"
        }
        
        user_lower = user_input.lower().strip()
        for key, response in fallback_responses.items():
            if key in user_lower:
                return {"response": response}
        
        return {"response": f"I'm Aera, your AI assistant. I understand you asked: '{user_input}'. Unfortunately, my AI model is currently unavailable, but I'm here to help once it's back online. Please try again later or contact support if this issue persists."}
    
    # Build the full prompt with system instruction, history, and new input
    prompt_parts = [system_prompt or system_instruction]
    
    if conversation_history.strip():
        prompt_parts.append(conversation_history.strip())
    
    prompt_parts.append(f"Human: {user_input}")
    prompt_parts.append("AI:")
    
    full_prompt = "\n".join(prompt_parts)
    
    try:
        response = model(
            prompt=full_prompt,
            max_tokens=150,
            stop=["Human:", "AI:", "\nHuman:", "\nAI:"],
            temperature=0.3,
            repeat_penalty=1.1
        )
        
        answer = response['choices'][0]['text'].strip()
        
        # Clean response to remove conversation artifacts
        answer = answer.replace("AI:", "").replace("Human:", "").strip()
        lines = answer.split('\n')
        clean_lines = []
        for line in lines:
            line = line.strip()
            if line and not line.startswith('Human:') and not line.startswith('AI:'):
                clean_lines.append(line)
            else:
                break
        answer = '\n'.join(clean_lines).strip()
        
        return {"response": answer}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    # Check if running as service (with JSON input) or interactive mode
    if len(sys.argv) > 1 and sys.argv[1] == "--service":
        try:
            # Service mode - read JSON from stdin
            input_data = json.loads(sys.stdin.read())
            
            system_prompt = input_data.get("system_prompt", "")
            conversation_history = input_data.get("conversation_history", "")
            user_input = input_data.get("user_input", "")
            
            result = generate_service_response(system_prompt, conversation_history, user_input)
            print(json.dumps(result))
            
        except Exception as e:
            print(json.dumps({"error": str(e)}))
    else:
        # Interactive mode
        print("AI is running… type 'quit' to exit.")
        while True:
            user_input = input("You: ")
            if user_input.lower() in ["quit", "exit"]:
                break
            answer = generate_response(user_input)
            print("AI:", answer)
