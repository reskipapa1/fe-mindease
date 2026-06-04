import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HeartPulse, LayoutDashboard, Users, MessageCircle, LogOut, LogIn, UserPlus, Sun, Moon, Menu, X, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { token, user, openLogin, openRegister, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navLinks = [];

  if (token) {
    navLinks.push({ name: 'Dashboard',      path: '/',           icon: <LayoutDashboard className="w-4 h-4" /> });
    if (user && user.role === 'admin') {
      navLinks.push({ name: 'Admin Panel', path: '/admin', icon: <Users className="w-4 h-4 text-rose-400" /> });
    }
    navLinks.push({ name: 'Safe Space',     path: '/komunitas',  icon: <Users className="w-4 h-4" /> });
    navLinks.push({ name: 'AI Chat',        path: '/chat',       icon: <MessageCircle className="w-4 h-4" /> });
    navLinks.push({ name: 'Settings',       path: '/settings',   icon: <Settings className="w-4 h-4" /> });
  }

  return (
    <div className="w-full shrink-0 z-50 pt-5 pb-2 px-4 flex justify-center animate-slide-down">
      <nav className="flex items-center justify-between w-full max-w-5xl px-5 py-3 rounded-2xl"
           style={{
             background: 'var(--bg-overlay)',
             backdropFilter: 'blur(20px) saturate(160%)',
             border: '1px solid var(--border)',
             boxShadow: 'var(--sh-nav)',
             transition: 'background 0.35s ease, border-color 0.25s ease',
           }}>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl blur-md opacity-60 group-hover:opacity-90 transition-opacity duration-300"
                 style={{ background: 'linear-gradient(135deg,#16a0a0,#0e6363)' }} />
            <div className="relative p-2 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg,#16a0a0,#0e6363)', boxShadow: '0 2px 12px rgba(22,160,160,0.4)' }}>
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
          </div>
          <span className="text-lg font-extrabold tracking-tight gradient-text">MindEase</span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                style={isActive ? {
                  background: 'rgba(22,160,160,0.15)',
                  color: 'var(--t-brand)',
                  boxShadow: '0 0 0 1px rgba(22,160,160,0.2)',
                } : {
                  color: 'var(--t-secondary)',
                }}
              >
                {link.icon}
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Right side: toggle + auth */}
        <div className="hidden md:flex items-center gap-2 shrink-0">

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="theme-toggle"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark'
              ? <Sun className="w-4 h-4 text-amber-400" />
              : <Moon className="w-4 h-4 text-indigo-500" />
            }
          </button>

          {/* Auth */}
          {!token ? (
            <>
              <button onClick={openLogin}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl transition-colors"
                style={{ color: 'var(--t-secondary)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--t-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--t-secondary)'}
              >
                <LogIn className="w-4 h-4" />
                Masuk
              </button>
              <button onClick={openRegister} className="btn-primary flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl">
                <UserPlus className="w-4 h-4" />
                Daftar
              </button>
            </>
          ) : (
            <button onClick={logout}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-rose-400 hover:text-rose-300 rounded-xl transition-colors"
              style={{ background: 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          )}
        </div>

        {/* Mobile: toggle + hamburger */}
        <div className="md:hidden flex items-center gap-2">
          <button onClick={toggleTheme} className="theme-toggle">
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="theme-toggle">
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-4 right-4 rounded-2xl p-4 flex flex-col gap-3 animate-slide-down z-40"
             style={{
               background: 'var(--bg-surface)',
               border: '1px solid var(--border)',
               boxShadow: 'var(--sh-card)',
             }}>
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                style={isActive ? {
                  background: 'rgba(22,160,160,0.15)',
                  color: 'var(--t-brand)',
                } : {
                  color: 'var(--t-primary)',
                  background: 'var(--bg-subtle)'
                }}
              >
                {link.icon}
                {link.name}
              </Link>
            );
          })}
          
          <div className="h-px w-full my-2" style={{ background: 'var(--border)' }} />
          
          {!token ? (
            <div className="flex gap-2">
              <button onClick={() => { openLogin(); setIsMobileMenuOpen(false); }}
                className="flex-1 py-2.5 text-sm font-medium rounded-xl text-center border"
                style={{ color: 'var(--t-primary)', borderColor: 'var(--border)' }}>
                Masuk
              </button>
              <button onClick={() => { openRegister(); setIsMobileMenuOpen(false); }} 
                className="btn-primary flex-1 py-2.5 text-sm rounded-xl text-center">
                Daftar
              </button>
            </div>
          ) : (
            <button onClick={() => { logout(); setIsMobileMenuOpen(false); }}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-rose-500 bg-rose-500/10 rounded-xl">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          )}
        </div>
      )}
    </div>
  );
}
