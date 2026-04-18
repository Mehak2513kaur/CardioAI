import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

export default function ChatAssistant({ contextDiagnosis }) {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      text: "Hello! I am CoronaryAI's clinical assistant. I can help interpret these angiogram results or guide you on next clinical steps. What would you like to know?" 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('/api/chat', {
        message: userMsg,
        diagnosis: contextDiagnosis
      });
      if (res.data.success) {
        setMessages(prev => [...prev, { role: 'assistant', text: res.data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: `Error: ${res.data.error}` }]);
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setMessages(prev => [...prev, { role: 'assistant', text: `Network Error: ${msg}. Make sure GROQ_API_KEY is set in the backend.` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-wrapper">
      <div className="chat-header">
        <div className="status-dot"></div>
        <h3>AI Clinical Assistant</h3>
        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Powered by Groq & LLaMA 3</span>
      </div>
      
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.role}`}>
            {m.text}
          </div>
        ))}
        {loading && (
          <div className="chat-bubble assistant" style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input 
          type="text" 
          placeholder="Ask about the diagnosis, severity, or next steps..." 
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={!input.trim() || loading}>
          Send
        </button>
      </form>
    </div>
  );
}
