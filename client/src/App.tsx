import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, PieChart, Tag, Settings, Sparkles, LogOut } from 'lucide-react';
import Overview from './pages/Overview';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';
import Categories from './pages/Categories';
import AIAdvisor from './pages/AIAdvisor';
import Login from './pages/Login';
import { Toaster } from 'react-hot-toast';

// Sidebar Item Component
const NavItem = ({ to, icon: Icon, children }: { to: string; icon: any; children: React.ReactNode }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <li>
      <Link to={to} className={`nav-item ${isActive ? 'active' : ''}`}>
        <Icon size={20} />
        <span>{children}</span>
      </Link>
    </li>
  );
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('auth_token'));

  const handleLogin = (token: string) => {
    localStorage.setItem('auth_token', token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    if (window.confirm("Tizimdan chiqmoqchimisiz?")) {
      localStorage.removeItem('auth_token');
      setIsAuthenticated(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="app">
        <Login onLogin={handleLogin} />
        <Toaster position="top-right" />
      </div>
    );
  }

  return (
    <Router>
      <div className="app-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-icon">
              <Receipt size={24} strokeWidth={2.5} />
            </div>
            <span>Finance Manager</span>
          </div>

          <nav>
            <ul className="nav-links">
              <NavItem to="/" icon={LayoutDashboard}>Dashboard</NavItem>
              <NavItem to="/transactions" icon={Receipt}>Tranzaksiyalar</NavItem>
              <NavItem to="/analytics" icon={PieChart}>Tahlil va Statistika</NavItem>
              <NavItem to="/advisor" icon={Sparkles}>AI Maslahatchi</NavItem>
              <NavItem to="/categories" icon={Tag}>Kategoriyalar</NavItem>
            </ul>
          </nav>

          <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
            <NavItem to="/settings" icon={Settings}>Sozlamalar</NavItem>
            <button onClick={handleLogout} className="nav-item" style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', marginTop: '8px' }}>
              <LogOut size={20} />
              <span>Chiqish</span>
            </button>
          </div>

          <div className="sidebar-footer" style={{ marginTop: '24px', opacity: 0.5, fontSize: '11px' }}>
             v1.2.6 • Secure Edition
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/advisor" element={<AIAdvisor />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/settings" element={<div className="animate-in"><h1>Sozlamalar</h1><p>Tez kunda...</p></div>} />
          </Routes>
        </main>
      </div>
      <Toaster position="top-right" />
    </Router>
  );
};

export default App;
