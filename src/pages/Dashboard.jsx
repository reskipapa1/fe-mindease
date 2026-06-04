const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
import { useState, useEffect } from 'react';
import { Smile, Frown, Meh, ArrowRight, Calendar as CalendarIcon, Loader2, Sparkles, Volume2, VolumeX, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const T = {
  primary: { color: 'var(--t-primary)' },
  secondary: { color: 'var(--t-secondary)' },
  muted: { color: 'var(--t-muted)' },
  brand: { color: 'var(--t-brand)' },
};

export default function Dashboard() {
  const [selectedMood, setSelectedMood] = useState(null);
  const [moodHistory, setMoodHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [bubbles, setBubbles] = useState([]);
  const [particles, setParticles] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { token, user } = useAuth();

  const resetBubbles = () => {
    const bubbleColors = [
      { main: '#f472b6', dark: '#db2777' }, // Pink
      { main: '#60a5fa', dark: '#2563eb' }, // Blue
      { main: '#34d399', dark: '#059669' }, // Green
      { main: '#fbbf24', dark: '#d97706' }, // Amber
      { main: '#a78bfa', dark: '#7c3aed' }, // Purple
      { main: '#2dd4bf', dark: '#0d9488' }  // Teal
    ];

    const initialBubbles = Array.from({ length: 24 }, (_, i) => {
      const color = bubbleColors[i % bubbleColors.length];
      return {
        id: i + 1,
        popped: false,
        color: color.main,
        colorDark: color.dark
      };
    });
    setBubbles(initialBubbles);
    setParticles([]);
  };

  const playPopSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(250, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      console.warn("Web Audio failed to play", e);
    }
  };

  const handlePop = (id, e) => {
    const bubble = bubbles.find(b => b.id === id);
    if (!bubble || bubble.popped) return;

    setBubbles(prev => prev.map(b => b.id === id ? { ...b, popped: true } : b));
    playPopSound();

    const rect = e.currentTarget.getBoundingClientRect();
    const parent = e.currentTarget.closest('.bubble-container');
    const parentRect = parent ? parent.getBoundingClientRect() : { left: 0, top: 0 };

    const clickX = rect.left - parentRect.left + rect.width / 2;
    const clickY = rect.top - parentRect.top + rect.height / 2;

    const newParticles = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8 + (Math.random() * 0.4 - 0.2);
      const dist = 30 + Math.random() * 40;
      newParticles.push({
        id: Math.random(),
        x: clickX,
        y: clickY,
        tx: Math.cos(angle) * dist,
        ty: Math.sin(angle) * dist,
        color: bubble.color,
        size: 3 + Math.random() * 5
      });
    }

    setParticles(prev => [...prev, ...newParticles]);

    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 600);
  };

  useEffect(() => {
    resetBubbles();
  }, []);

  const fetchMoods = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/moods`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setMoodHistory(data);
        const today = new Date().toISOString().split('T')[0];
        const t = data.find(m => m.date === today);
        if (t) setSelectedMood(t.mood_type);
      }
    } catch (e) { console.error(e); }
  };
  useEffect(() => { fetchMoods(); }, [token]);

  const handleSaveMood = async (id) => {
    setSelectedMood(id);
    if (!token) { alert('Login untuk menyimpan riwayat mood!'); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/moods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ date: new Date().toISOString().split('T')[0], mood_type: id }),
      });
      if (res.ok) fetchMoods();
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const moodsConfig = [
    { id: 'happy', icon: <Smile className="w-10 h-10 md:w-12 md:h-12" />, label: 'Senang', colorClass: 'text-emerald-400', cardClass: 'mood-happy', circleBg: 'bg-emerald-500', glow: 'rgba(16,185,129,0.35)' },
    { id: 'neutral', icon: <Meh className="w-10 h-10 md:w-12 md:h-12" />, label: 'Biasa', colorClass: 'text-amber-400', cardClass: 'mood-neutral', circleBg: 'bg-amber-500', glow: 'rgba(245,158,11,0.35)' },
    { id: 'sad', icon: <Frown className="w-10 h-10 md:w-12 md:h-12" />, label: 'Sedih / Lelah', colorClass: 'text-rose-400', cardClass: 'mood-sad', circleBg: 'bg-rose-500', glow: 'rgba(239,68,68,0.35)' },
  ];

  const renderCalendar = () => {
    const today = new Date();
    const y = today.getFullYear(), m = today.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const fd = new Date(y, m, 1).getDay();
    const startOffset = fd === 0 ? 6 : fd - 1;
    const days = [];
    ['S', 'S', 'R', 'K', 'J', 'S', 'M'].forEach((d, i) =>
      days.push(<div key={`h${i}`} className="text-center text-xs font-semibold mb-1" style={T.muted}>{d}</div>)
    );
    for (let i = 0; i < startOffset; i++) days.push(<div key={`e${i}`} className="h-8 w-8" />);
    for (let i = 1; i <= daysInMonth; i++) {
      const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const md = moodHistory.find(x => x.date === ds);
      const isToday = i === today.getDate();
      let bg = {}, tc = 'var(--t-muted)';
      if (md) {
        const conf = moodsConfig.find(x => x.id === md.mood_type);
        if (conf) {
          if (conf.id === 'happy') bg = { background: 'rgba(16,185,129,0.7)' };
          if (conf.id === 'neutral') bg = { background: 'rgba(245,158,11,0.7)' };
          if (conf.id === 'sad') bg = { background: 'rgba(239,68,68,0.7)' };
          tc = '#fff';
        }
      } else if (isToday) {
        bg = { background: 'rgba(22,160,160,0.2)', boxShadow: '0 0 0 2px rgba(22,160,160,0.5)' };
        tc = 'var(--t-brand)';
      }
      days.push(
        <div key={`d${i}`} className="flex justify-center items-center">
          <div className="w-8 h-8 flex items-center justify-center rounded-full text-xs transition-all font-medium"
            style={{ ...bg, color: tc }}>{i}</div>
        </div>
      );
    }
    return <div className="grid grid-cols-7 gap-y-1 mt-3">{days}</div>;
  };

  const h = new Date().getHours();
  let greeting = 'Selamat malam';
  let greetEmoji = '🌙';

  if (h >= 4 && h < 11) {
    greeting = 'Selamat pagi';
    greetEmoji = '☀️';
  } else if (h >= 11 && h < 15) {
    greeting = 'Selamat siang';
    greetEmoji = '🌤️';
  } else if (h >= 15 && h < 19) {
    greeting = 'Selamat sore';
    greetEmoji = '⛅';
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-8">

      {/* Hero */}
      <div className="text-center space-y-2 pt-4">
        <p className="text-sm font-medium tracking-wider uppercase" style={T.muted}>{greetEmoji} {greeting}</p>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          {user ? (
            <>Halo, <span className="gradient-text">{user.username}!</span></>
          ) : (
            <>Halo, <span className="gradient-text">Sobat!</span></>
          )}
        </h1>
        <p className="text-base md:text-lg max-w-md mx-auto" style={T.secondary}>
          {user ? 'Bagaimana perasaanmu hari ini? Yuk ceritakan.' : 'Login untuk menyimpan riwayat mood dan catatanmu.'}
        </p>
      </div>

      {/* Mood Picker */}
      <div className="glass-card p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(22,160,160,0.5),transparent)' }} />
        {isLoading && (
          <div className="absolute inset-0 rounded-2xl z-20 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(4px)' }}>
            <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
          </div>
        )}
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="w-5 h-5 text-brand-400" />
          <h2 className="font-semibold" style={T.primary}>Pilih Mood Hari Ini</h2>
        </div>
        <div className="grid grid-cols-3 gap-3 md:gap-5">
          {moodsConfig.map(mood => {
            const sel = selectedMood === mood.id;
            return (
              <button key={mood.id} onClick={() => handleSaveMood(mood.id)}
                className={`${mood.cardClass} flex flex-col items-center justify-center p-4 md:p-6 rounded-2xl border-2 transition-all duration-300 group`}
                style={sel ? { boxShadow: `0 0 0 2px ${mood.glow},0 8px 30px ${mood.glow}`, transform: 'scale(1.04)' } : {}}>
                <div className={`${mood.colorClass} mb-2 md:mb-3 transition-transform duration-300 group-hover:scale-110`}>
                  {mood.icon}
                </div>
                <span className="font-semibold text-sm leading-tight" style={T.secondary}>{mood.label}</span>
                {sel && (
                  <span className="mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--t-brand)' }}>Dipilih ✓</span>
                )}
              </button>
            );
          })}
        </div>
        {selectedMood && (
          <div className="mt-6 pt-5 border-t animate-slide-up" style={{ borderColor: 'var(--border)' }}>
            <p className="mb-4 text-sm leading-relaxed" style={T.secondary}>
              {selectedMood === 'sad'
                ? '💙 Sepertinya kamu sedang lelah. Tidak apa-apa. Ingin bercerita dengan AI kami atau menjadwalkan konsultasi?'
                : '✨ Terima kasih sudah berbagi perasaanmu! Semoga harimu semakin menyenangkan.'}
            </p>
            {selectedMood === 'sad' && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/chat" className="btn-primary flex justify-center items-center gap-2 py-3 px-6 text-sm rounded-xl">
                  Curhat ke AI <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Zen Bubble Popper Game */}
      <div className="glass-card p-6 md:p-8 relative overflow-hidden">
        <style>{`
          @keyframes particle-explode {
            0% {
              transform: translate(-50%, -50%) scale(1) translate(0, 0);
              opacity: 1;
            }
            100% {
              transform: translate(-50%, -50%) scale(0) translate(var(--tx), var(--ty));
              opacity: 0;
            }
          }
          .particle {
            animation: particle-explode 0.6s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
          }
          @keyframes bubble-pop-ripple {
            0% {
              transform: scale(0.8);
              opacity: 0.5;
            }
            100% {
              transform: scale(1.6);
              opacity: 0;
            }
          }
          .ripple-ring {
            animation: bubble-pop-ripple 0.4s ease-out forwards;
          }
        `}</style>

        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(22,160,160,0.5),transparent)' }} />

        <div className="flex flex-col lg:flex-row gap-8 items-stretch">
          <div className="flex-1 flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-brand-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-brand-400">Stress Relief Mini-Game</span>
              </div>
              <h2 className="text-2xl font-extrabold" style={T.primary}>Zen Bubble Popper 🫧</h2>
              <p className="text-sm mt-2 leading-relaxed" style={T.secondary}>
                Pikiran bising atau sedang merasa stres? Coba tekan gelembung-gelembung di samping.
                Suara 'pop' yang memuaskan dan efek visualnya dirancang untuk membantumu melepaskan ketegangan pikiran sejenak. 🧘💚
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span style={T.secondary}>Tingkat Ketenangan Pikiran</span>
                <span className="text-brand-400 font-bold">{bubbles.length > 0 ? Math.round((bubbles.filter(b => b.popped).length / bubbles.length) * 100) : 0}% Rileks</span>
              </div>
              <div className="h-3 w-full bg-[var(--bg-subtle)] border border-[var(--border)] rounded-full overflow-hidden p-0.5">
                <div className="h-full rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${bubbles.length > 0 ? Math.round((bubbles.filter(b => b.popped).length / bubbles.length) * 100) : 0}%`,
                    background: 'linear-gradient(90deg, #16a0a0, #2dd4bf)',
                    boxShadow: '0 0 10px rgba(22,160,160,0.5)'
                  }} />
              </div>
              {bubbles.length > 0 && bubbles.filter(b => b.popped).length === bubbles.length && (
                <p className="text-xs text-emerald-400 font-semibold animate-bounce mt-1">
                  ✨ Luar biasa! Semua gelembung pecah. Tarik napas dalam-dalam, hembuskan perlahan... Kamu aman di sini.
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button onClick={resetBubbles}
                className="btn-primary flex items-center justify-center gap-2 py-2 px-5 text-xs rounded-xl font-semibold">
                <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" /> Mulai Ulang
              </button>

              <button onClick={() => setSoundEnabled(!soundEnabled)}
                className="btn-ghost flex items-center justify-center gap-2 py-2 px-4 text-xs rounded-xl font-medium border border-[var(--border)]">
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-brand-400" /> : <VolumeX className="w-3.5 h-3.5 text-rose-400" />}
                {soundEnabled ? 'Suara Aktif' : 'Suara Senyap'}
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <div className="relative p-5 rounded-3xl bg-[var(--bg-subtle)] border border-[var(--border)] bubble-container overflow-hidden w-full max-w-[340px]"
              style={{ boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)' }}>

              <div className="absolute inset-0 pointer-events-none z-10">
                {particles.map(p => (
                  <div
                    key={p.id}
                    className="particle absolute rounded-full"
                    style={{
                      left: p.x,
                      top: p.y,
                      backgroundColor: p.color,
                      width: `${p.size}px`,
                      height: `${p.size}px`,
                      '--tx': `${p.tx}px`,
                      '--ty': `${p.ty}px`,
                    }}
                  />
                ))}
              </div>

              <div className="grid grid-cols-6 gap-3 relative z-0">
                {bubbles.map(bubble => {
                  const style = bubble.popped
                    ? {
                      background: 'rgba(0,0,0,0.06)',
                      border: '1px dashed var(--border)',
                      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
                    }
                    : {
                      background: `radial-gradient(circle at 30% 30%, #ffffff 0%, ${bubble.color} 50%, ${bubble.colorDark} 100%)`,
                      boxShadow: '0 4px 8px rgba(0,0,0,0.15), inset 0 -2px 5px rgba(0,0,0,0.2), inset 0 2px 2px rgba(255,255,255,0.6)',
                    };

                  return (
                    <button
                      key={bubble.id}
                      onClick={(e) => handlePop(bubble.id, e)}
                      disabled={bubble.popped}
                      className="w-10 h-10 rounded-full cursor-pointer relative focus:outline-none transition-all duration-150 active:scale-95 group flex items-center justify-center"
                      style={style}
                    >
                      {!bubble.popped && (
                        <div className="absolute top-1 left-2 w-2 h-1 rounded-full bg-white opacity-60 transform -rotate-12 pointer-events-none" />
                      )}
                      {bubble.popped && (
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--t-muted)] opacity-50" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="glass-card p-5 flex flex-col max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold flex items-center gap-2" style={T.primary}>
            <CalendarIcon className="w-4 h-4 text-brand-400" />Kalender Mood
          </h3>
        </div>
        <p className="text-xs mb-2" style={T.muted}>
          {!token ? 'Login untuk menyimpan riwayat mood'
            : new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
        </p>
        <div className="flex-1">{renderCalendar()}</div>
        <div className="mt-4 pt-4 flex justify-center gap-5 text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--t-muted)' }}>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Senang</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" />Biasa</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-500" />Sedih</div>
        </div>
      </div>
    </div>
  );
}
