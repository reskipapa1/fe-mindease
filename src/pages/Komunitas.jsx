const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
import { useState, useEffect, useRef } from 'react';
import {
  AlertCircle, Info, Plus, X, Send, Loader2, Shield,
  Mic, Headphones, Hash, Compass, Users, CornerUpLeft
} from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Komunitas() {
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { token, openLogin, openRegister, logout, user } = useAuth();
  const { theme } = useTheme();
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const chatEndRef = useRef(null);
  const [realtimeOnlineUsers, setRealtimeOnlineUsers] = useState([]);

  const [channels, setChannels] = useState([
    { slug: 'curhat-umum', name: '💬-curhat-umum', description: 'Saluran bebas untuk membagikan keluh kesah dan cerita apa saja.' },
    { slug: 'stres-kecemasan', name: '🧠-stres-kecemasan', description: 'Tempat berbagi cerita seputar stres, kepanikan, dan kecemasan Anda.' },
    { slug: 'insomnia-tidur', name: '🌙-insomnia-tidur', description: 'Mengalami masalah tidur? Yuk, saling bercerita dan berbagi tips di sini.' }
  ]);
  const [activeChannel, setActiveChannel] = useState('curhat-umum');

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${API_URL}/posts`);
      if (!res.ok) throw new Error('Gagal memuat data komunitas');
      setPosts(await res.json());
      setShowError(false);
    } catch (err) {
      setErrorMessage(err.message);
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChannels = async () => {
    try {
      const res = await fetch(`${API_URL}/posts/channels`);
      if (res.ok) {
        const data = await res.json();
        setChannels(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchChannels();
  }, []);

  useEffect(() => {
    // Setup Socket.IO connection
    const socketUrl = API_URL.replace('/api', ''); // remove /api to get base URL
    const socket = io(socketUrl);

    socket.on('connect', () => {
      // Once connected, emit our anonymized username
      const anonUsername = user ? user.username.substring(0, 3) + '***' : `Tamu-${Math.floor(Math.random() * 1000)}`;
      socket.emit('join_safe_space', anonUsername);
    });

    socket.on('online_users', (users) => {
      // Remove duplicates just in case one user opened multiple tabs
      const uniqueUsers = [...new Set(users)];
      setRealtimeOnlineUsers(uniqueUsers);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [posts, activeChannel]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    setIsPosting(true);

    // Format message if it's a reply
    let finalContent = newPostContent;
    if (replyingTo) {
      const snippet = replyingTo.content.substring(0, 35).replace(/::/g, ' ').replace(/\|\|/g, ' ');
      finalContent = `||REPLY::${replyingTo.username}::${snippet}|| ${newPostContent}`;
    }

    try {
      const res = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: finalContent, channel_slug: activeChannel }),
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          logout();
          throw new Error('Sesi berakhir. Silakan login kembali.');
        }
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Gagal mengirim postingan');
      }
      setNewPostContent('');
      setReplyingTo(null); // Clear reply state
      fetchPosts();
    } catch (err) {
      setErrorMessage(err.message);
      setShowError(true);
    } finally {
      setIsPosting(false);
    }
  };

  const handleReplyClick = (post) => {
    // Strip reply tag from the content if it's already a reply to get clean content
    let cleanContent = post.content;
    if (post.content.startsWith('||REPLY::')) {
      try {
        const parts = post.content.split('||');
        cleanContent = parts.slice(2).join('||').trim();
      } catch (e) {
        cleanContent = post.content;
      }
    }
    setReplyingTo({
      id: post.id,
      username: post.username,
      content: cleanContent
    });
  };

  const hues = [180, 210, 260, 310, 340, 30, 160, 280];
  const isLight = theme === 'light';
  const uColor = (n = '') => {
    const hue = hues[(n.charCodeAt(0) || 0) % hues.length];
    return `hsl(${hue}, ${isLight ? '65%, 38%' : '55%, 62%'})`;
  };
  const uBg = (n = '') => {
    const hue = hues[(n.charCodeAt(0) || 0) % hues.length];
    return `hsla(${hue}, 55%, 62%, ${isLight ? '0.12' : '0.18'})`;
  };
  const uInit = (n = '') => n.charAt(0).toUpperCase();

  const timeAgo = (d) => {
    const s = (Date.now() - new Date(d).getTime()) / 1000;
    if (s < 60) return 'Baru saja';
    if (s < 3600) return `${Math.floor(s / 60)} menit lalu`;
    if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`;
    return `${Math.floor(s / 86400)} hari lalu`;
  };

  // Filter posts based on selected channel slug or keywords (for retro-compatibility)
  const getFilteredPosts = () => {
    return posts.filter(p => {
      const postSlug = p.channel_slug || 'curhat-umum';

      // If it matches by exact channel_slug, include it!
      if (postSlug === activeChannel) return true;

      // For legacy posts, run fallback keyword filtering if in seeded channels
      if (!p.channel_slug) {
        const c = p.content.toLowerCase();
        if (activeChannel === 'stres-kecemasan') {
          return c.includes('stres') || c.includes('cemas') || c.includes('panik') || c.includes('khawatir') || c.includes('takut') || c.includes('anxiety');
        }
        if (activeChannel === 'insomnia-tidur') {
          return c.includes('tidur') || c.includes('insomnia') || c.includes('malam') || c.includes('begadang') || c.includes('mimpi');
        }
        if (activeChannel === 'pelukan-hangat') {
          return c.includes('sedih') || c.includes('kecewa') || c.includes('nangis') || c.includes('peluk') || c.includes('luka') || c.includes('sakit') || c.includes('depresi') || c.includes('hancur');
        }
      }

      return false;
    });
  };

  const filteredPosts = getFilteredPosts().slice().reverse();
  const currentChannel = channels.find(c => c.slug === activeChannel) || channels[0];

  const uniquePosters = posts.length > 0
    ? [...new Set(posts.map(p => p.username))].filter(u => u !== (user ? user.username.substring(0, 3) + '***' : ''))
    : [];

  const activeMembers = realtimeOnlineUsers.length > 0 
    ? realtimeOnlineUsers.map(u => ({ username: u, status: 'online' }))
    : [
        ...(user ? [{ username: user.username.substring(0, 3) + '***', status: 'online', isSelf: true }] : []),
        ...uniquePosters.map(u => ({ username: u, status: 'online' }))
      ];

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-[calc(100vh-100px)] space-y-3 animate-fade-in pb-2 overflow-hidden">
      {/* Header */}
      <div className="pt-4 flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center animate-pulse"
              style={{ background: 'rgba(22,160,160,0.15)', boxShadow: '0 0 0 1px rgba(22,160,160,0.2)' }}>
              <Shield className="w-5 h-5 text-brand-400" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight gradient-text">Ruang Aman</h1>
          </div>
          <p className="text-sm ml-12 max-w-lg hidden sm:block" style={{ color: 'var(--t-secondary)' }}>
            Komunitas anonim yang bebas dari penghakiman. Bagikan ceritamu dengan aman.
          </p>
        </div>
      </div>

      {/* Mobile Channel Bar (Pill buttons that scroll horizontally) */}
      <div className="md:hidden flex gap-2 overflow-x-auto pb-2 px-1 scrollbar-none shrink-0">
        {channels.map(chan => (
          <button
            key={chan.slug}
            onClick={() => setActiveChannel(chan.slug)}
            className="px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200"
            style={activeChannel === chan.slug ? {
              background: 'rgba(22,160,160,0.25)',
              color: 'var(--t-brand)',
              border: '1px solid rgba(22,160,160,0.4)',
              boxShadow: '0 0 10px rgba(22,160,160,0.15)'
            } : {
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              color: 'var(--t-secondary)'
            }}
          >
            #{chan.name.split('-').slice(1).join('-') || chan.name}
          </button>
        ))}
      </div>

      {/* Main Discord App Layout Container */}
      <div className="flex flex-1 w-full rounded-3xl overflow-hidden border border-[var(--border)] glass-card relative min-h-0"
        style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}>

        {/* Panel 2: Channels Sidebar (Middle-left) - Medium screens up */}
        <div className="w-64 shrink-0 hidden md:flex flex-col h-full"
          style={{ background: 'rgba(0,0,0,0.06)', borderRight: '1px solid var(--border)' }}>

          {/* Server Title Header */}
          <div className="h-14 flex items-center justify-between px-4 border-b border-[var(--border)]">
            <span className="font-extrabold text-sm tracking-wide text-[var(--t-primary)]">🧠 Safe Space Server</span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>

          {/* Channels List (Scrollable) */}
          <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
            <span className="text-[10px] font-bold text-[var(--t-muted)] uppercase tracking-wider px-2 block mb-1">Saluran Obrolan</span>
            {channels.map(chan => {
              const isActive = chan.slug === activeChannel;
              return (
                <button
                  key={chan.slug}
                  onClick={() => setActiveChannel(chan.slug)}
                  className="w-full flex items-center gap-2 py-2 px-2.5 rounded-xl text-left text-xs font-bold transition-all duration-150 group"
                  style={isActive ? {
                    background: 'rgba(22,160,160,0.18)',
                    color: 'var(--t-brand)',
                    boxShadow: '0 0 0 1px rgba(22,160,160,0.15)'
                  } : {
                    color: 'var(--t-secondary)'
                  }}
                >
                  <Hash className="w-3.5 h-3.5 opacity-60" />
                  <span className="truncate">{chan.name.split('-').slice(1).join('-') || chan.name}</span>
                </button>
              );
            })}
          </div>

          {/* Discord Bottom-left User Profile Bar */}
          <div className="h-[60px] flex items-center px-3 gap-2.5 border-t border-[var(--border)]"
            style={{ background: 'var(--bg-surface)', boxShadow: '0 -2px 10px rgba(0,0,0,0.02)' }}>

            {/* User Avatar */}
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md select-none"
                style={{
                  background: token && user ? uColor(user.username) : 'var(--bg-subtle)'
                }}>
                {token && user ? uInit(user.username) : '?'}
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[var(--bg-surface)]"
                style={{ background: token ? '#10b981' : '#6b7280' }} />
            </div>

            {/* User Name Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-extrabold truncate text-[var(--t-primary)]">
                {token && user ? user.username.substring(0, 3) + '***' : 'Tamu Mindease'}
              </p>
              <p className="text-[10px] font-medium" style={{ color: 'var(--t-secondary)' }}>
                {token ? 'Online' : 'Mode Baca'}
              </p>
            </div>
          </div>
        </div>

        {/* Panel 3: Central Chat Screen */}
        <div className="flex-1 flex flex-col h-full bg-transparent">

          {/* Chat Header bar */}
          <div className="h-14 flex items-center justify-between px-4 border-b border-[var(--border)] shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Hash className="w-4 h-4 text-[var(--t-muted)]" />
              <span className="font-extrabold text-sm text-[var(--t-primary)] truncate">
                {currentChannel.name.split('-').slice(1).join('-')}
              </span>
              <div className="hidden lg:block w-px h-4 bg-[var(--border)] mx-1" />
              <span className="hidden lg:inline text-xs text-[var(--t-muted)] font-semibold truncate max-w-sm">
                {currentChannel.desc}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Online members indicator for mobile */}
              <div className="md:hidden flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: 'rgba(22,160,160,0.12)', color: 'var(--t-brand)' }}>
                <Users className="w-3 h-3" />
                <span>{activeMembers.length}</span>
              </div>
            </div>
          </div>

          {/* Error Banner inside Chat area */}
          {showError && (
            <div className="mx-4 mt-3 flex items-center justify-between p-3.5 rounded-xl animate-slide-down animate-pulse-once"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
              <div className="flex items-center gap-2.5 text-xs font-semibold">
                <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button onClick={() => setShowError(false)} className="shrink-0">
                <X className="w-4 h-4 opacity-75 hover:opacity-100" />
              </button>
            </div>
          )}

          {/* Scrollable Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-[var(--t-muted)] gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
                <span className="text-xs font-semibold">Menghubungkan ke saluran...</span>
              </div>
            ) : filteredPosts.length === 0 ? (
              /* Satisfying Discord Empty Channel Greeting */
              <div className="flex flex-col items-start justify-center p-8 text-left max-w-xl animate-slide-up mt-8">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl font-extrabold text-white mb-4 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #16a0a0, #0e6363)' }}>
                  #
                </div>
                <h2 className="text-2xl font-extrabold text-[var(--t-primary)] mb-1">
                  Selamat datang di #{currentChannel.name.split('-').slice(1).join('-')}!
                </h2>
                <p className="text-xs text-[var(--t-muted)] font-medium leading-relaxed">
                  Ini adalah awal dari riwayat obrolan di saluran #{currentChannel.name.split('-').slice(1).join('-')}.
                  Bagikan pikiran atau curahan hatimu dengan aman di sini tanpa rasa khawatir. 💚
                </p>
              </div>
            ) : (
              /* Chat List styled like Discord chat messages */
              <div className="space-y-4">
                {filteredPosts.map((post, idx) => {
                  // Check if post is a reply
                  let isReply = post.content.startsWith('||REPLY::');
                  let parentUser = '';
                  let parentSnippet = '';
                  let displayContent = post.content;

                  if (isReply) {
                    try {
                      const parts = post.content.split('||');
                      const meta = parts[1]; // REPLY::username::snippet
                      const metaParts = meta.split('::');
                      parentUser = metaParts[1];
                      parentSnippet = metaParts[2];
                      displayContent = parts.slice(2).join('||').trim();
                    } catch (e) {
                      isReply = false;
                      displayContent = post.content;
                    }
                  }

                  return (
                    <div key={post.id} className="group flex flex-col relative">
                      {/* Thread Reply context line */}
                      {isReply && (
                        <div className="flex items-center gap-1.5 text-[11px] text-[var(--t-muted)] pl-12 mb-1.5 opacity-70 select-none">
                          <span className="text-[var(--t-brand)] font-bold text-sm">↳</span>
                          <span className="font-extrabold text-[var(--t-brand)]">@{parentUser}</span>
                          <span className="truncate max-w-[280px] italic">"{parentSnippet}"</span>
                        </div>
                      )}

                      <div className="flex items-start gap-3.5 p-2 rounded-xl transition-all duration-150 hover:bg-[rgba(255,255,255,0.02)] relative">

                        {/* Hover reply action button */}
                        {token && (
                          <div className="absolute right-3 top-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex gap-1 z-10">
                            <button
                              onClick={() => handleReplyClick(post)}
                              className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-[var(--bg-input)] border border-[var(--border)] text-[var(--t-muted)] hover:text-white hover:bg-brand-500 hover:border-brand-500 flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                              title="Balas pesan ini"
                            >
                              <CornerUpLeft className="w-3 h-3" /> Balas
                            </button>
                          </div>
                        )}

                        {/* User Avatar left */}
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-md select-none transition-transform group-hover:scale-105"
                          style={{ background: uColor(post.username) }}>
                          {uInit(post.username)}
                        </div>

                        {/* Message Body right */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2.5 mb-1.5">
                            <span className="font-extrabold text-sm transition-colors group-hover:opacity-85" style={{ color: uColor(post.username) }}>
                              {post.username}
                            </span>
                            <span className="text-[10px] text-[var(--t-muted)] font-medium">
                              {timeAgo(post.created_at)}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap text-[var(--t-secondary)]">
                            {displayContent}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* Form Message input at bottom */}
          <div className="p-4 shrink-0 animate-fade-in" style={{ borderTop: '1px solid var(--border)' }}>
            {!token ? (
              <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 rounded-2xl gap-3 text-xs"
                style={{ background: 'rgba(245,158,11,0.06)', border: '1px dashed rgba(245,158,11,0.2)' }}>
                <div className="flex items-center gap-2 text-amber-500 font-bold">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>Mode Baca saja — Silakan login untuk berkontribusi secara anonim.</span>
                </div>
                <button onClick={openLogin}
                  className="btn-primary py-2 px-5 text-xs rounded-xl font-bold">
                  Masuk Sekarang
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreatePost} className="space-y-2">
                {/* Replying context bar */}
                {replyingTo && (
                  <div className="flex items-center justify-between px-4 py-2 rounded-t-2xl bg-[rgba(22,160,160,0.08)] border-t border-l border-r border-[var(--border)] text-xs animate-slide-down">
                    <div className="flex items-center gap-2 text-[var(--t-muted)] font-medium truncate">
                      <CornerUpLeft className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                      <span>Membalas kepada</span>
                      <span className="font-extrabold text-[var(--t-brand)]">@{replyingTo.username}</span>
                      <span className="truncate max-w-[320px] italic">"{replyingTo.content}"</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      className="text-[var(--t-muted)] hover:text-white transition-colors ml-2 shrink-0"
                      title="Batalkan balasan"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className={`flex items-center gap-2 bg-[var(--bg-input)] border border-[var(--border)] px-4 py-2.5 shadow-sm transition-all focus-within:border-brand-500 ${replyingTo ? 'rounded-b-2xl rounded-t-none border-t-0' : 'rounded-2xl'}`}>
                  {/* Text Input */}
                  <input
                    type="text"
                    value={newPostContent}
                    onChange={e => setNewPostContent(e.target.value)}
                    placeholder={replyingTo ? `Balas ke @${replyingTo.username}...` : `Kirim pesan ke #${currentChannel.name.split('-').slice(1).join('-')}`}
                    className="flex-1 bg-transparent border-0 outline-none text-sm placeholder-[var(--t-muted)] text-[var(--t-primary)] py-1 font-medium"
                    required
                    disabled={isPosting}
                  />

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={isPosting || !newPostContent.trim()}
                    className="p-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-50 disabled:hover:bg-brand-500 flex items-center justify-center transition-all duration-150"
                  >
                    {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="flex items-center justify-between px-1 text-[10px] text-[var(--t-muted)] font-semibold">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-brand-400" /> Identitas tersembunyi — Pesan Anda disaring aman.
                  </span>
                  <span className="hidden sm:inline">Ketik pesan lalu tekan Enter untuk mengirim</span>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Panel 4: Online Members Sidebar (Far Right) - Desktop view */}
        <div className="w-60 shrink-0 hidden lg:flex flex-col h-full"
          style={{ background: 'rgba(0,0,0,0.1)', borderLeft: '1px solid var(--border)' }}>

          <div className="h-14 flex items-center px-4 border-b border-[var(--border)] shrink-0">
            <span className="font-extrabold text-xs text-[var(--t-primary)] tracking-wide uppercase">Member Aktif — {activeMembers.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Online Status Label */}
            <div>
              <span className="text-[10px] font-bold text-[var(--t-muted)] uppercase tracking-wider block mb-2 px-1">Online</span>
              <div className="space-y-2">
                {activeMembers.map((memb, i) => (
                  <div key={i} className="flex items-center gap-2 px-1.5 py-1.5 rounded-xl transition-all duration-150 hover:bg-[var(--bg-subtle)] cursor-default">
                    {/* Status dot and avatar */}
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md select-none"
                        style={{
                          background: uColor(memb.username)
                        }}>
                        {uInit(memb.username)}
                      </div>
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[var(--bg-surface)]"
                        style={{ background: memb.status === 'online' ? '#10b981' : '#f59e0b' }} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate text-[var(--t-primary)]">
                        {memb.username}
                      </p>
                      <p className="text-[9px] font-medium" style={{ color: 'var(--t-secondary)' }}>
                        Online
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
