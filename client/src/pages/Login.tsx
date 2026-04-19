import React, { useState } from 'react';
import axios from 'axios';
import { Lock, LogIn, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const Login = ({ onLogin }: { onLogin: (token: string) => void }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { password });
      toast.success("Xush kelibsiz!");
      onLogin(response.data.token);
    } catch (error) {
      toast.error("Parol noto'g'ri");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(circle at top right, #1e293b, #020617)'
    }}>
      <div className="glass-card animate-in" style={{ width: '100%', maxWidth: '400px', padding: '40px', textAlign: 'center' }}>
        <div className="brand-icon" style={{ margin: '0 auto 24px', width: '64px', height: '64px' }}>
          <ShieldCheck size={32} />
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Security Portal</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Admin panelga kirish uchun parolni kiriting</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="chat-input-wrapper" style={{ padding: '4px 16px' }}>
            <Lock size={20} className="text-muted" />
            <input 
              type="password" 
              className="chat-input" 
              placeholder="Admin paroli..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
            />
          </div>
          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', height: '52px', justifyContent: 'center', fontSize: '16px' }}
            disabled={loading}
          >
            {loading ? <div className="spinner" style={{ width: '20px', height: '20px' }}></div> : <><LogIn size={20} /> Kirish</>}
          </button>
        </form>

        <div style={{ marginTop: '32px', fontSize: '12px', color: 'var(--text-muted)', opacity: 0.5 }}>
          Finance Manager v1.2.5 • Professional Security
        </div>
      </div>
    </div>
  );
};

export default Login;
