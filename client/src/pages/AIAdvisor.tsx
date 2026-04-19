import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Bot, User, Sparkles, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

const AIAdvisor = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: "Salom! Men sizning moliyaviy maslahatchingizman. Biznesingiz haqidagi savollaringizga javob berishga tayyorman. Masalan: 'Mening moliyaviy holatim qanday?' yoki 'Xarajatlarimni qanday kamaytirsam bo'ladi?'" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/ai/advisor`, { query: text });
      const aiMessage: Message = { role: 'ai', content: response.data.advice };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      toast.error("Xatolik yuz berdi");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Mening moliyaviy holatim tahlili",
    "Eng ko'p xarajat qilgan kategoriyam qaysi?",
    "Foydamni oshirish uchun 3ta maslahat",
    "Zararga kirib qolmaslik uchun nima qilishim kerka?"
  ];

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Sparkles className="text-primary" /> AI Maslahatchi
          </h1>
          <span className="subtitle">Biznesingiz uchun aqlli moliya tahlillari va tavsiyalar</span>
        </div>
      </div>

      <div className="glass-card" style={{ height: 'calc(100vh - 250px)', display: 'flex', flexDirection: 'column', padding: '0' }}>
        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', opacity: 0.8 }}>
                {msg.role === 'ai' ? <Bot size={16} /> : <User size={16} />}
                <span style={{ fontSize: '12px', fontWeight: 600 }}>{msg.role === 'ai' ? 'FinanceAI' : 'Siz'}</span>
              </div>
              <div style={{ whiteSpace: 'pre-line' }}>{msg.content}</div>
            </div>
          ))}
          {loading && (
            <div className="message ai">
              <div className="typing-indicator">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ padding: '24px', borderTop: '1px solid var(--border-color)' }}>
          <div className="suggestion-chips" style={{ marginBottom: '20px' }}>
            {suggestions.map((s, i) => (
              <button key={i} className="chip" onClick={() => handleSend(s)} disabled={loading}>
                {s}
              </button>
            ))}
          </div>
          
          <form className="chat-input-wrapper" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
            <MessageSquare size={20} className="text-muted" style={{ marginLeft: '8px' }} />
            <input 
              className="chat-input"
              placeholder="Savolingizni yozing..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button 
              type="submit" 
              className="btn-primary" 
              style={{ padding: '10px 20px', borderRadius: '14px' }}
              disabled={loading || !input.trim()}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIAdvisor;
