import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Chatbot from './pages/Chatbot';
import Settings from './pages/Settings';
import ResetPassword from './pages/ResetPassword';
import Komunitas from './pages/Komunitas';
import AdminDashboard from './pages/AdminDashboard';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AuthModal from './components/AuthModal';
import Footer from './components/Footer';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen w-full flex flex-col relative overflow-hidden"
               style={{ background: 'var(--bg-base)', transition: 'background 0.35s ease' }}>

            {/* Ambient blobs */}
            <div className="pointer-events-none select-none absolute inset-0 overflow-hidden">
              <div className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full animate-pulse-slow"
                   style={{ background: `radial-gradient(circle, var(--blob-1) 0%, transparent 70%)` }} />
              <div className="absolute top-1/3 -right-40 w-[480px] h-[480px] rounded-full animate-pulse-slow"
                   style={{ background: `radial-gradient(circle, var(--blob-2) 0%, transparent 70%)`, animationDelay: '1.5s' }} />
              <div className="absolute -bottom-20 left-1/4 w-[400px] h-[400px] rounded-full animate-pulse-slow"
                   style={{ background: `radial-gradient(circle, var(--blob-3) 0%, transparent 70%)`, animationDelay: '3s' }} />
            </div>

            {/* Subtle grid */}
            <div className="pointer-events-none select-none absolute inset-0"
                 style={{ backgroundImage: `linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)`, backgroundSize: '48px 48px' }} />

            <Navbar />
            <AuthModal />

            <main className="grow w-full overflow-y-auto relative z-10">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full">
                <Routes>
                  <Route path="/"           element={<Dashboard />} />
                  <Route path="/komunitas"  element={<Komunitas />} />
                  <Route path="/chat"       element={<Chatbot />} />
                  <Route path="/settings"   element={<Settings />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/admin"      element={<AdminDashboard />} />
                </Routes>
              </div>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
