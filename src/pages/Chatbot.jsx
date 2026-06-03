const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, Plus, Trash2, Menu, X, Pin, PinOff, Edit2, MoreVertical } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SUGGESTIONS = [
  'Saya merasa stres akhir-akhir ini',
  'Bantu saya latihan pernapasan',
  'Saya sulit tidur nyenyak',
];

export default function Chatbot() {
  const { token, openLogin, openRegister } = useAuth();
  const [messages, setMessages] = useState([
    { id: 1, sender: 'ai', text: 'Halo! Saya AI MindEase. Ada yang ingin kamu ceritakan hari ini? Jangan ragu untuk berbagi.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  // State untuk Sesi Obrolan
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [askCounts, setAskCounts] = useState({});

  // State UI Tambahan
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null); // untuk dropdown opsi di tiap sesi
  const [mode, setMode] = useState('chat'); // 'chat' atau 'assessment'

  // 1. Memuat daftar sesi saat halaman dimuat atau token berubah
  const fetchSessions = () => {
    if (token) {
      fetch(`${API_URL}/chat/sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          setSessions(data);
          if (data && data.length > 0 && !currentSessionId) {
            setCurrentSessionId(data[0].id);
          }
        })
        .catch(err => console.error("Gagal mengambil daftar sesi:", err));
    } else {
      setSessions([]);
      setCurrentSessionId(null);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [token]);

  // 2. Memuat riwayat chat khusus untuk sesi yang aktif
  useEffect(() => {
    if (token && currentSessionId) {
      setIsLoading(true);
      fetch(`${API_URL}/chat/history?session_id=${currentSessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error('Gagal memuat riwayat sesi');
          return res.json();
        })
        .then(history => {
          if (history) setMessages(history);
        })
        .catch(err => console.error("Gagal mengambil riwayat chat sesi:", err))
        .finally(() => setIsLoading(false));
    }
  }, [token, currentSessionId]);

  // State untuk menyimpan 21 fitur secara diam-diam
  const [currentState, setCurrentState] = useState({
    age: null, gender: null, academic_year: null, study_hours_per_day: null,
    exam_pressure: null, academic_performance: null, stress_level: null,
    anxiety_score: null, depression_score: null, sleep_hours: null,
    physical_activity: null, social_support: null, screen_time: null,
    internet_usage: null, financial_stress: null, family_expectation: null,
    sleep_category: null, screen_time_category: null, stress_category: null,
    mental_risk_score: null, support_category: null
  });

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Handler beralih sesi
  const handleSwitchSession = (sessionId) => {
    setCurrentSessionId(sessionId);
    setMode('chat');
    if (window.innerWidth < 768) setIsSidebarOpen(false); // Tutup sidebar di HP saat pindah sesi
    // Reset state fitur
    setCurrentState({
      age: null, gender: null, academic_year: null, study_hours_per_day: null,
      exam_pressure: null, academic_performance: null, stress_level: null,
      anxiety_score: null, depression_score: null, sleep_hours: null,
      physical_activity: null, social_support: null, screen_time: null,
      internet_usage: null, financial_stress: null, family_expectation: null,
      sleep_category: null, screen_time_category: null, stress_category: null,
      mental_risk_score: null, support_category: null
    });
    setAskCounts({});
  };

  // Handler membuat sesi baru (Lazy Creation)
  const handleCreateSession = () => {
    if (window.innerWidth < 768) setIsSidebarOpen(false);

    // Hanya reset state UI, jangan buat di database dulu
    setCurrentSessionId(null);
    setMessages([
      { id: 1, sender: 'ai', text: 'Halo! Saya AI MindEase. Ada yang ingin kamu ceritakan hari ini? Jangan ragu untuk berbagi.' }
    ]);
    setCurrentState({
      age: null, gender: null, academic_year: null, study_hours_per_day: null,
      exam_pressure: null, academic_performance: null, stress_level: null,
      anxiety_score: null, depression_score: null, sleep_hours: null,
      physical_activity: null, social_support: null, screen_time: null,
      internet_usage: null, financial_stress: null, family_expectation: null,
      sleep_category: null, screen_time_category: null, stress_category: null,
      mental_risk_score: null, support_category: null
    });
    setAskCounts({});
  };

  // Handler menghapus sesi
  const handleDeleteSession = async (sessionId) => {
    if (!token || !sessionId) return;
    if (!window.confirm('Apakah kamu yakin ingin menghapus sesi obrolan ini secara permanen?')) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/chat/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Gagal menghapus sesi');

      const updatedSessions = sessions.filter(s => s.id !== sessionId);
      setSessions(updatedSessions);

      if (updatedSessions.length > 0) {
        if (currentSessionId === sessionId) {
          setCurrentSessionId(updatedSessions[0].id);
        }
      } else {
        fetchSessions();
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus sesi obrolan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePin = async (sessionId, currentPin) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/chat/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ is_pinned: !currentPin })
      });
      if (res.ok) {
        fetchSessions();
      }
    } catch (err) {
      console.error("Gagal toggle pin", err);
    }
    setActiveMenuId(null);
  };

  const handleRenameSession = async (sessionId, currentTitle) => {
    if (!token) return;
    const newTitle = window.prompt("Masukkan nama baru untuk sesi ini:", currentTitle);
    if (!newTitle || newTitle.trim() === '' || newTitle === currentTitle) {
      setActiveMenuId(null);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/chat/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: newTitle.trim() })
      });
      if (res.ok) {
        setSessions(sessions.map(s => s.id === sessionId ? { ...s, title: newTitle.trim() } : s));
      }
    } catch (err) {
      console.error("Gagal rename", err);
    }
    setActiveMenuId(null);
  };

  const handleStartAssessment = () => {
    setMode('assessment');
    // Reset state fitur, pertahankan age & gender dari profile jika ada
    setCurrentState(prev => ({
      age: prev.age,
      gender: prev.gender,
      academic_year: null,
      study_hours_per_day: null,
      exam_pressure: null,
      academic_performance: null,
      stress_level: null,
      anxiety_score: null,
      depression_score: null,
      sleep_hours: null,
      physical_activity: null,
      social_support: null,
      screen_time: null,
      internet_usage: null,
      financial_stress: null,
      family_expectation: null,
      sleep_category: null,
      screen_time_category: null,
      stress_category: null,
      mental_risk_score: null,
      support_category: null
    }));

    // Kirim pesan pemicu asesmen terpandu
    handleSend(null, "Saya ingin memulai sesi asesmen kesehatan mental saya secara detail.", 'assessment');
  };

  const handleCancelAssessment = () => {
    setMode('chat');
    setMessages(prev => [...prev, {
      id: Date.now(),
      sender: 'ai',
      text: "Sesi asesmen dibatalkan. Kita kembali mengobrol santai ya. Ada hal lain yang ingin kamu ceritakan? 💙"
    }]);
  };

  const handleSend = async (e, override = null, overrideMode = null) => {
    if (e) e.preventDefault();
    const text = override ?? input;
    if (!text.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text }]);
    setInput('');
    setIsLoading(true);

    try {
      let targetSessionId = currentSessionId;

      // Jika ini adalah pesan pertama (sesi baru), buat sesinya sekarang!
      if (!targetSessionId && token) {
        const createRes = await fetch(`${API_URL}/chat/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        if (createRes.ok) {
          const newSession = await createRes.json();
          targetSessionId = newSession.id;
          setCurrentSessionId(targetSessionId);

          // Background Task: Minta AI buatkan judul
          fetch(`${API_URL}/chat/sessions/${targetSessionId}/generate-title`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ message: text })
          }).then(() => fetchSessions()); // Segarkan daftar sidebar
        }
      }

      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const activeMode = overrideMode ?? mode;
      const res = await fetch(`${API_URL}/chat/agent`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ message: text, currentState, session_id: targetSessionId, mode: activeMode, ask_counts: askCounts })
      });
      const data = await res.json();
      
      if (data.target_feature) {
        setAskCounts(prev => ({
          ...prev,
          [data.target_feature]: (prev[data.target_feature] || 0) + 1
        }));
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1, sender: 'ai',
        text: data.reply || "Maaf, saya gagal memproses pesanmu.",
        isCrisis: data.is_crisis,
        hotlines: data.hotlines || []
      }]);

      if (data.extractedFeatures && Object.keys(data.extractedFeatures).length > 0) {
        setCurrentState(prev => {
          const newState = { ...prev, ...data.extractedFeatures };
          return newState;
        });
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1, sender: 'ai',
        text: "Terjadi kesalahan saat menghubungi server AI."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const forcePredict = (stateToPredict = currentState) => {
    setIsLoading(true);
    setMessages(prev => [...prev, {
      id: Date.now(), sender: 'user', text: "Saya ingin melihat hasil analisisnya sekarang."
    }]);

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const chatSummary = messages.filter(m => m.sender === 'user').map(m => m.text).join(" | ");

    fetch(`${API_URL}/chat/predict`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ features: stateToPredict, session_id: currentSessionId, chat_history: chatSummary })
    })
      .then(r => r.json())
      .then(prediction => {
        if (prediction.is_insufficient_data) {
          setMessages(msgs => [...msgs, {
            id: Date.now() + 2,
            sender: 'ai',
            text: "🛑 " + prediction.error_message
          }]);
          return;
        }

        setMessages(msgs => [...msgs, {
          id: Date.now() + 2,
          sender: 'ai',
          type: 'result',
          riskLevel: prediction.risk_level,
          burnoutScore: prediction.burnout_score,
          recommendation: prediction.genai_recommendation,
          expertReference: prediction.expert_reference,
          linkReferensi: prediction.link_referensi,
          therapyRecommendation: prediction.therapy_recommendation,
          linkTerapi: prediction.link_terapi
        }]);

        if (token) {
          fetch(`${API_URL}/chat/save-result`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              riskLevel: prediction.risk_level,
              burnoutScore: prediction.burnout_score,
              recommendation: prediction.genai_recommendation,
              session_id: currentSessionId
            })
          })
            .then(() => fetchSessions())
            .catch(err => console.error("Gagal menyimpan hasil prediksi ke DB:", err));
        }
      })
      .catch(err => {
        console.warn("⚠️ FastAPI Offline. Mengaktifkan Analisis Heuristik Lokal Terintegrasi...", err);

        // Hitung skor kecemasan, depresi, stres secara lokal untuk perkiraan risiko
        const stress = parseFloat(stateToPredict.stress_level || 5);
        const anxiety = parseFloat(stateToPredict.anxiety_score || 5);
        const depression = parseFloat(stateToPredict.depression_score || 5);
        const averageScore = (stress + anxiety + depression) / 3;

        let riskLevel = 'Low';
        if (averageScore >= 7) {
          riskLevel = 'High';
        } else if (averageScore >= 4) {
          riskLevel = 'Medium';
        }

        let burnoutScore = Math.min(10, Math.max(0, parseFloat((averageScore * 1.1).toFixed(1))));

        // === PENGAMAN RISIKO KRISIS (CLINICAL SAFETY OVERWRITE SYNCED) ===
        if (stress >= 8.0 || anxiety >= 8.0 || depression >= 8.0) {
          riskLevel = 'High';
          const maxCore = Math.max(stress, anxiety, depression);
          burnoutScore = Math.max(burnoutScore, parseFloat((maxCore * 0.95).toFixed(1)));
        }

        let recommendation = "Keadaan emosionalmu tampak cukup stabil. Tetap pertahankan pola hidup seimbang dan luangkan waktu untuk relaksasi ya.";
        if (riskLevel === 'High') {
          recommendation = "Kamu terdeteksi sedang berada di bawah tekanan mental yang sangat tinggi. Sangat disarankan untuk beristirahat sejenak, melakukan teknik pernapasan dalam, dan berbicara dengan konselor atau orang terdekat untuk meredakan kecemasanmu.";
        } else if (riskLevel === 'Medium') {
          recommendation = "Ada beberapa tanda kelelahan emosional sedang. Cobalah untuk membagi waktu dengan lebih seimbang antara belajar dan bersantai, serta beristirahatlah yang cukup.";
        }

        const prediction = {
          risk_level: riskLevel,
          burnout_score: burnoutScore,
          genai_recommendation: recommendation,
          expert_reference: 'Standar Panduan Psikologi Umum',
          therapy_recommendation: 'Konseling Mandiri / Self-care'
        };

        setMessages(msgs => [...msgs, {
          id: Date.now() + 2,
          sender: 'ai',
          type: 'result',
          riskLevel: prediction.risk_level,
          burnoutScore: prediction.burnout_score,
          recommendation: prediction.genai_recommendation,
          expertReference: prediction.expert_reference,
          therapyRecommendation: prediction.therapy_recommendation
        }]);

        if (token) {
          fetch(`${API_URL}/chat/save-result`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              riskLevel: prediction.risk_level,
              burnoutScore: prediction.burnout_score,
              recommendation: prediction.genai_recommendation,
              session_id: currentSessionId
            })
          })
            .then(() => fetchSessions())
            .catch(dbErr => console.error("Gagal menyimpan hasil prediksi ke DB:", dbErr));
        }
      })
      .finally(() => setIsLoading(false));
  };

  const FEATURE_KEYS = [
    'age', 'gender',
    'academic_year', 'study_hours_per_day', 'exam_pressure', 'academic_performance',
    'stress_level', 'anxiety_score', 'depression_score', 'sleep_hours',
    'physical_activity', 'social_support', 'screen_time', 'internet_usage',
    'financial_stress', 'family_expectation'
  ];

  const filledFeatures = Object.keys(currentState)
    .filter(k => FEATURE_KEYS.includes(k) && currentState[k] !== null).length;
  const totalFeatures = FEATURE_KEYS.length;
  const progressPercent = Math.min(100, Math.round((filledFeatures / totalFeatures) * 100));

  const pinnedSessions = sessions.filter(s => s.is_pinned);
  const recentSessions = sessions.filter(s => !s.is_pinned);

  if (!token) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-3xl border border-[var(--border)] glass-panel text-center space-y-6 animate-scale-in relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl opacity-30"
          style={{ background: 'var(--bg-brand)' }} />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-30"
          style={{ background: 'var(--bg-brand)' }} />

        <div className="w-20 h-20 mx-auto bg-[var(--bg-brand)] rounded-3xl flex items-center justify-center transform rotate-3 shadow-lg shadow-[var(--bg-brand)]/20">
          <Bot className="w-10 h-10 text-white" />
        </div>

        <div className="space-y-2 relative z-10">
          <h2 className="text-2xl font-extrabold" style={{ color: 'var(--t-primary)' }}>Akses MindEase AI Chat</h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--t-secondary)' }}>
            Fitur konsultasi mental dengan MindEase AI Companion memerlukan akun untuk keamanan data dan enkripsi riwayat percakapan secara pribadi. 💚
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-4 relative z-10">
          <button onClick={openLogin} className="btn-primary py-3 rounded-xl font-bold text-sm w-full shadow-lg">
            Masuk ke Akun
          </button>
          <button onClick={openRegister} className="btn-ghost border border-[var(--border)] py-3 rounded-xl font-semibold text-sm w-full transition-colors">
            Daftar Akun Baru
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] -mt-4 -mx-4 md:-mt-8 md:-mx-8 overflow-hidden animate-fade-in relative">

      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Gemini Style) */}
      <div
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 ease-in-out border-r border-[var(--border)]
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{ background: 'var(--bg-surface)' }}
      >
        <div className="p-4 flex items-center justify-between">
          <button
            onClick={handleCreateSession}
            className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors text-sm"
            style={{ background: 'var(--bg-brand)', color: '#fff' }}
          >
            <Plus className="w-4 h-4" /> Percakapan Baru
          </button>
          <button
            className="md:hidden p-2 ml-2 text-[var(--t-secondary)]"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-hide">
          {!token && (
            <div className="text-xs text-center p-4 rounded-xl border border-[var(--border)]" style={{ color: 'var(--t-secondary)', background: 'var(--bg-subtle)' }}>
              Login untuk menyimpan dan melihat riwayat percakapan.
            </div>
          )}

          {token && pinnedSessions.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-wider px-3 mb-2 opacity-60" style={{ color: 'var(--t-primary)' }}>Disematkan</p>
              {pinnedSessions.map(s => (
                <SessionItem
                  key={s.id} session={s} currentSessionId={currentSessionId}
                  handleSwitchSession={handleSwitchSession}
                  activeMenuId={activeMenuId} setActiveMenuId={setActiveMenuId}
                  handleTogglePin={handleTogglePin} handleRenameSession={handleRenameSession} handleDeleteSession={handleDeleteSession}
                />
              ))}
            </div>
          )}

          {token && recentSessions.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider px-3 mb-2 opacity-60" style={{ color: 'var(--t-primary)' }}>Terbaru</p>
              {recentSessions.map(s => (
                <SessionItem
                  key={s.id} session={s} currentSessionId={currentSessionId}
                  handleSwitchSession={handleSwitchSession}
                  activeMenuId={activeMenuId} setActiveMenuId={setActiveMenuId}
                  handleTogglePin={handleTogglePin} handleRenameSession={handleRenameSession} handleDeleteSession={handleDeleteSession}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-[var(--bg-subtle)] relative max-w-4xl mx-auto w-full shadow-2xl">

        {/* Header Chat */}
        <div className="p-4 flex items-center gap-3 border-b border-[var(--border)]" style={{ background: 'var(--bg-surface)' }}>
          <button
            className="md:hidden p-2 -ml-2 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors"
            style={{ color: 'var(--t-secondary)' }}
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-sm opacity-70"
              style={{ background: 'linear-gradient(135deg,#16a0a0,#0e6363)' }} />
            <div className="relative w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#16a0a0,#0e6363)', boxShadow: '0 4px 16px rgba(22,160,160,0.4)' }}>
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2"
              style={{ borderColor: 'var(--bg-surface)' }} />
          </div>
          <div>
            <h2 className="font-bold text-sm" style={{ color: 'var(--t-primary)' }}>MindEase AI Companion</h2>
            <p className="text-[10px] text-emerald-500 flex items-center gap-1 font-medium">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Online — Selalu ada untukmu
            </p>
          </div>
        </div>

        {/* Guest Mode Banner */}
        {!token && (
          <div className="px-4 py-2 text-center text-xs font-semibold flex items-center justify-center gap-1.5"
            style={{ background: 'rgba(245,158,11,0.08)', borderBottom: '1px solid rgba(245,158,11,0.18)', color: '#d97706' }}>
            ⚠️ Mode Tamu — Login untuk menyimpan riwayat obrolan AI secara persisten.
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-5">
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 justify-center pt-8 animate-slide-up max-w-lg mx-auto">
              <div className="w-full text-center mb-6">
                <div className="w-16 h-16 mx-auto bg-[var(--bg-brand)] rounded-2xl flex items-center justify-center mb-4 transform rotate-3 shadow-lg shadow-[var(--bg-brand)]/20">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--t-primary)' }}>Halo, apa yang bisa saya bantu?</h3>
                <p className="text-sm opacity-60" style={{ color: 'var(--t-primary)' }}>Pilih topik di bawah atau ketikkan keluh kesahmu.</p>
              </div>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => handleSend(null, s)}
                  className="px-4 py-2 text-xs rounded-full font-medium transition-all duration-200"
                  style={{ background: 'rgba(22,160,160,0.12)', border: '1px solid rgba(22,160,160,0.25)', color: 'var(--t-brand)' }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
              {msg.type === 'result' ? (
                <div className="w-full max-w-[92%] rounded-2xl overflow-hidden animate-slide-up"
                  style={{ border: '1px solid rgba(22,160,160,0.3)', boxShadow: '0 8px 32px rgba(22,160,160,0.15)' }}>
                  <div className="p-4" style={{ background: 'linear-gradient(135deg,#16a0a0,#0e6363)' }}>
                    <p className="text-white text-xs font-semibold uppercase tracking-widest opacity-80 mb-1">Hasil Analisis MindEase AI</p>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-white text-xs opacity-70">Tingkat Risiko</p>
                        <p className="text-white text-2xl font-bold">{msg.riskLevel}</p>
                      </div>
                      <div className="w-px h-10 bg-white opacity-30" />
                      <div>
                        <p className="text-white text-xs opacity-70">Skor Burnout</p>
                        <p className="text-white text-2xl font-bold">{msg.burnoutScore}<span className="text-sm opacity-70">/10</span></p>
                      </div>
                      <div className="ml-auto text-4xl">
                        {msg.riskLevel === 'High' ? '🔴' : msg.riskLevel === 'Medium' ? '🟡' : '🟢'}
                      </div>
                    </div>
                  </div>
                  <div className="p-4" style={{ background: 'var(--bg-surface)' }}>
                    <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--t-brand)' }}>
                      <Sparkles className="w-3.5 h-3.5" /> Pesan Personal untukmu
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--t-primary)' }}>{msg.recommendation}</p>
                  </div>
                  {msg.expertReference && (
                    <div className="p-4 border-t border-[var(--border)]" style={{ background: 'var(--bg-subtle)' }}>
                      <p className="text-xs font-semibold mb-2 text-indigo-500">📖 Landasan Teori / Assessment Tool</p>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--t-primary)' }}>{msg.expertReference}</p>
                      {msg.linkReferensi && (
                        <a href={msg.linkReferensi} target="_blank" rel="noreferrer" className="text-xs text-blue-500 underline mt-1 inline-block">Baca Selengkapnya &rarr;</a>
                      )}
                      
                      <p className="text-xs font-semibold mt-3 mb-2 text-teal-500">💡 Rekomendasi Terapi</p>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--t-primary)' }}>{msg.therapyRecommendation}</p>
                      {msg.linkTerapi && (
                        <a href={msg.linkTerapi} target="_blank" rel="noreferrer" className="text-xs text-blue-500 underline mt-1 inline-block">Pelajari Terapi Ini &rarr;</a>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className={`flex gap-3 max-w-[90%] sm:max-w-[82%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 self-end"
                    style={msg.sender === 'ai'
                      ? { background: 'linear-gradient(135deg,#16a0a0,#0e6363)', boxShadow: '0 2px 10px rgba(22,160,160,0.35)' }
                      : { background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                    {msg.sender === 'user'
                      ? <User className="w-4 h-4" style={{ color: 'var(--t-secondary)' }} />
                      : <Bot className="w-4 h-4 text-white" />}
                  </div>

                  <div className="flex flex-col gap-2 max-w-full">
                    <div className="p-4 rounded-2xl text-sm leading-relaxed"
                      style={msg.sender === 'user' ? {
                        background: 'linear-gradient(135deg,#16a0a0,#0e6363)',
                        color: '#fff', borderRadius: '1rem 0.25rem 1rem 1rem',
                        boxShadow: '0 4px 20px rgba(22,160,160,0.25)',
                      } : {
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        color: 'var(--t-primary)',
                        borderRadius: '0.25rem 1rem 1rem 1rem',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                      }}>
                      {msg.text}
                    </div>

                    {msg.isCrisis && msg.hotlines && msg.hotlines.length > 0 && (
                      <div className="flex flex-col gap-2 mt-1 animate-slide-up w-full">
                        {msg.hotlines.map((h, i) => (
                          <a key={i} href={`tel:${h.number}`}
                            className="flex items-center justify-between p-3 rounded-xl hover:opacity-80 transition-opacity cursor-pointer"
                            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                            <div>
                              <p className="font-bold text-sm" style={{ color: 'var(--t-primary)' }}>{h.name}</p>
                              <p className="text-xs" style={{ color: 'var(--t-secondary)' }}>{h.hours} {h.ext ? `• ${h.ext}` : ''}</p>
                            </div>
                            <div className="px-3 py-1.5 rounded-lg font-semibold text-sm flex items-center gap-2"
                              style={{ background: 'rgba(22,160,160,0.1)', color: 'var(--t-brand)' }}>
                              📞 {h.display || h.number}
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start animate-slide-up">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg,#16a0a0,#0e6363)' }}>
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="p-4 flex items-center gap-1.5"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '0.25rem 1rem 1rem 1rem' }}>
                  <span className="typing-dot w-2 h-2 rounded-full inline-block bg-brand-400" />
                  <span className="typing-dot w-2 h-2 rounded-full inline-block bg-brand-400" />
                  <span className="typing-dot w-2 h-2 rounded-full inline-block bg-brand-400" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Progress Asesmen Terpandu */}
        {mode === 'assessment' && (
          <div className="px-4 py-2.5 transition-all duration-300 border-t border-[var(--border)]" style={{ background: 'var(--bg-surface)' }}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold flex items-center gap-1.5 text-brand-400">
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-[#16a0a0]" /> Sesi Asesmen Terpandu (AI Guide)
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#16a0a0]">{progressPercent}% Terkumpul ({filledFeatures}/{totalFeatures})</span>
                <button onClick={handleCancelAssessment} className="text-[10px] text-red-400 hover:text-red-500 font-semibold px-2 py-0.5 rounded border border-red-500/20 hover:bg-red-500/10 transition-colors">
                  Batal Asesmen
                </button>
              </div>
            </div>
            <div className="w-full bg-[rgba(22,160,160,0.1)] h-2 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%`, background: 'linear-gradient(90deg, #16a0a0, #0e6363)' }} />
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">
              💡 AI sedang menganalisis perasaanmu secara kualitatif. Jawablah sesuai kondisi aslimu tanpa memikirkan angka ya.
            </p>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-[var(--border)]" style={{ background: 'var(--bg-surface)' }}>
          {messages.length > 2 && (
            <div className="flex justify-end gap-2 mb-3">
              {mode === 'chat' ? (
                <button onClick={handleStartAssessment} disabled={isLoading}
                  className="text-xs px-4 py-1.5 rounded-full font-medium transition-colors border border-[var(--border)] hover:bg-[rgba(22,160,160,0.1)]"
                  style={{ color: 'var(--t-brand)', background: 'var(--bg-surface)', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                  🪄 Mulai Asesmen Kesehatan Mental
                </button>
              ) : (
                <button onClick={() => { setMode('chat'); forcePredict(currentState); }} disabled={isLoading}
                  className="text-xs px-4 py-1.5 rounded-full font-medium transition-colors text-white"
                  style={{ background: progressPercent >= 100 ? 'linear-gradient(135deg, #16a0a0, #0e6363)' : 'var(--bg-brand)', boxShadow: '0 2px 8px rgba(22,160,160,0.3)' }}>
                  {progressPercent >= 100 ? "🪄 Lihat Hasil Analisis Lengkap" : "🪄 Selesaikan & Analisis Sekarang (Gunakan Estimasi)"}
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSend} className="flex gap-3 items-center">
            <input type="text" value={input} onChange={e => setInput(e.target.value)}
              placeholder="Ketik pesanmu di sini..." className="input-field flex-1 py-3 text-sm rounded-xl" disabled={isLoading} />
            <button type="submit" disabled={isLoading || !input.trim()}
              className="btn-primary w-11 h-11 rounded-xl flex items-center justify-center p-0 shrink-0">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}

// Komponen Pembantu: Item Sesi di Sidebar
function SessionItem({ session, currentSessionId, handleSwitchSession, activeMenuId, setActiveMenuId, handleTogglePin, handleRenameSession, handleDeleteSession }) {
  const isActive = currentSessionId === session.id;

  return (
    <div className="relative group rounded-lg mb-1">
      <button
        onClick={() => handleSwitchSession(session.id)}
        className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
        style={{
          background: isActive ? 'rgba(22,160,160,0.1)' : 'transparent',
          color: isActive ? 'var(--t-brand)' : 'var(--t-primary)'
        }}
      >
        <span className="truncate flex-1">{session.title}</span>
      </button>

      {/* Tiga Titik Muncul saat Hover (Desktop) atau Aktif (Mobile) */}
      <div className={`absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-md cursor-pointer transition-opacity 
                      ${activeMenuId === session.id ? 'opacity-100 bg-[var(--bg-input)]' : 'opacity-0 group-hover:opacity-100'}`}
        style={{ color: 'var(--t-secondary)' }}
        onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === session.id ? null : session.id); }}>
        <MoreVertical className="w-4 h-4" />
      </div>

      {/* Dropdown Menu Kecil */}
      {activeMenuId === session.id && (
        <div className="absolute right-2 top-8 w-36 rounded-xl shadow-xl border border-[var(--border)] z-50 overflow-hidden text-xs animate-fade-in"
          style={{ background: 'var(--bg-surface)' }}>
          <button onClick={() => handleTogglePin(session.id, session.is_pinned)} className="w-full text-left px-3 py-2 hover:bg-[var(--bg-subtle)] flex items-center gap-2" style={{ color: 'var(--t-primary)' }}>
            {session.is_pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
            {session.is_pinned ? 'Unpin' : 'Pin ke atas'}
          </button>
          <button onClick={() => handleRenameSession(session.id, session.title)} className="w-full text-left px-3 py-2 hover:bg-[var(--bg-subtle)] flex items-center gap-2" style={{ color: 'var(--t-primary)' }}>
            <Edit2 className="w-3.5 h-3.5" /> Ganti Nama
          </button>
          <div className="h-px w-full" style={{ background: 'var(--border)' }} />
          <button onClick={() => { setActiveMenuId(null); handleDeleteSession(session.id); }} className="w-full text-left px-3 py-2 hover:bg-red-500/10 text-red-500 flex items-center gap-2">
            <Trash2 className="w-3.5 h-3.5" /> Hapus
          </button>
        </div>
      )}
    </div>
  );
}
