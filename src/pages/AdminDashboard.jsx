const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  ShieldCheck, Users, MessageSquare, Trash2, Loader2, RefreshCw,
  TrendingUp, BarChart2, Activity, UserPlus, Edit2, Plus, X, Inbox, Check
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const MOOD_COLORS = { happy: '#10b981', neutral: '#f59e0b', sad: '#f43f5e' };
const PIE_COLORS = ['#10b981', '#f59e0b', '#f43f5e'];
const MOOD_LABELS = { happy: 'Senang', neutral: 'Biasa', sad: 'Sedih/Lelah' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-4 py-3 text-sm" style={{ border: '1px solid var(--border)' }}>
      <p className="font-semibold mb-1" style={{ color: 'var(--t-primary)' }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {MOOD_LABELS[p.name] || p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function AdminDashboard() {
  const { token, user } = useAuth();
  const { theme } = useTheme();
  const [stats, setStats] = useState({ users: 0, posts: 0 });
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editChannel, setEditChannel] = useState(null);
  const [userForm, setUserForm] = useState({ username: '', email: '', password: '', role: 'user' });
  const [channelForm, setChannelForm] = useState({ name: '', slug: '', description: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [feedbackSearchQuery, setFeedbackSearchQuery] = useState('');
  const [feedbackSearchDate, setFeedbackSearchDate] = useState('');
  const [feedbackFilterStatus, setFeedbackFilterStatus] = useState('all');

  useEffect(() => {
    if (user && user.role === 'admin') fetchData();
  }, [user]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [statsRes, postsRes, usersRes, analyticsRes, channelsRes, feedbacksRes] = await Promise.all([
        fetch(`${API_URL}/admin/stats`, { headers }),
        fetch(`${API_URL}/admin/posts`, { headers }),
        fetch(`${API_URL}/admin/users`, { headers }),
        fetch(`${API_URL}/admin/analytics`, { headers }),
        fetch(`${API_URL}/posts/channels`),
        fetch(`${API_URL}/admin/feedbacks`, { headers }),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (postsRes.ok) setPosts(await postsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      if (channelsRes.ok) setChannels(await channelsRes.json());
      if (feedbacksRes.ok) setFeedbacks(await feedbacksRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm('Yakin ingin menghapus postingan ini?')) return;
    try {
      const res = await fetch(`${API_URL}/admin/posts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) fetchData();
    } catch (e) { console.error(e); }
  };

  const handleBulkDeletePosts = async () => {
    if (selectedPosts.length === 0) return;
    if (!window.confirm(`Yakin ingin menghapus ${selectedPosts.length} postingan terpilih?`)) return;
    try {
      const res = await fetch(`${API_URL}/admin/posts/bulk-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ids: selectedPosts })
      });
      if (res.ok) {
        setSelectedPosts([]);
        fetchData();
      } else {
        const err = await res.json();
        alert(`Gagal: ${err.error}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveChannel = async (e) => {
    e.preventDefault();
    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      };
      if (editChannel) {
        // Edit Channel PUT
        const res = await fetch(`${API_URL}/admin/channels/${editChannel.slug}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ name: channelForm.name, description: channelForm.description })
        });
        if (res.ok) {
          setShowChannelModal(false);
          setChannelForm({ name: '', slug: '', description: '' });
          fetchData();
          alert('Saluran obrolan berhasil diperbarui!');
        } else {
          const err = await res.json();
          alert(`Gagal memperbarui saluran: ${err.error}`);
        }
      } else {
        // Create Channel POST
        const res = await fetch(`${API_URL}/admin/channels`, {
          method: 'POST',
          headers,
          body: JSON.stringify(channelForm)
        });
        if (res.ok) {
          setShowChannelModal(false);
          setChannelForm({ name: '', slug: '', description: '' });
          fetchData();
          alert('Saluran obrolan baru berhasil ditambahkan!');
        } else {
          const err = await res.json();
          alert(`Gagal membuat saluran: ${err.error}`);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteChannel = async (slug) => {
    if (!window.confirm(`Yakin ingin menghapus saluran #${slug}? Seluruh postingan dalam saluran ini juga akan terhapus!`)) return;
    try {
      const res = await fetch(`${API_URL}/admin/channels/${slug}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      } else {
        const err = await res.json();
        alert(`Gagal menghapus saluran: ${err.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateFeedbackStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'unread' ? 'read' : 'unread';
      const res = await fetch(`${API_URL}/admin/feedbacks/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFeedback = async (id) => {
    if (!window.confirm('Yakin ingin menghapus masukan ini?')) return;
    try {
      const res = await fetch(`${API_URL}/admin/feedbacks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const openAddChannel = () => {
    setEditChannel(null);
    setChannelForm({ name: '', slug: '', description: '' });
    setShowChannelModal(true);
  };

  const openEditChannel = (chan) => {
    setEditChannel(chan);
    setChannelForm({ name: chan.name, slug: chan.slug, description: chan.description || '' });
    setShowChannelModal(true);
  };

  const handleSelectPost = (id) => {
    if (selectedPosts.includes(id)) {
      setSelectedPosts(prev => prev.filter(x => x !== id));
    } else {
      setSelectedPosts(prev => [...prev, id]);
    }
  };

  const filteredPosts = posts.filter(post => {
    // 1. Search Query matches content, username, or channel slug
    const matchesSearch = searchQuery.trim() === '' ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.channel_slug || '').toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Date matches
    const postDateOnly = post.created_at ? post.created_at.substring(0, 10) : '';
    const matchesDate = searchDate === '' || postDateOnly === searchDate;

    return matchesSearch && matchesDate;
  });

  const handleSelectAllPosts = () => {
    const filteredIds = filteredPosts.map(p => p.id);
    const allFilteredSelected = filteredIds.every(id => selectedPosts.includes(id));

    if (allFilteredSelected) {
      // Unselect all filtered ids
      setSelectedPosts(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      // Select all filtered ids
      setSelectedPosts(prev => [...new Set([...prev, ...filteredIds])]);
    }
  };

  const filteredFeedbacks = feedbacks.filter(fb => {
    const matchesSearch = feedbackSearchQuery.trim() === '' ||
      fb.message.toLowerCase().includes(feedbackSearchQuery.toLowerCase()) ||
      (fb.name || '').toLowerCase().includes(feedbackSearchQuery.toLowerCase()) ||
      (fb.email || '').toLowerCase().includes(feedbackSearchQuery.toLowerCase()) ||
      (fb.type || '').toLowerCase().includes(feedbackSearchQuery.toLowerCase());

    const fbDateOnly = fb.created_at ? fb.created_at.substring(0, 10) : '';
    const matchesDate = feedbackSearchDate === '' || fbDateOnly === feedbackSearchDate;

    const matchesStatus = feedbackFilterStatus === 'all' || fb.status === feedbackFilterStatus;

    return matchesSearch && matchesDate && matchesStatus;
  });

  const handleDeleteUser = async (id, username) => {
    if (!window.confirm(`YAKIN INGIN MENGHAPUS USER ${username}? Ini akan menghapus semua data (post & mood) miliknya!`)) return;
    try {
      const res = await fetch(`${API_URL}/admin/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) fetchData();
      else { const e = await res.json(); alert(`Gagal: ${e.error}`); }
    } catch (e) { console.error(e); }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (editUser) {
        // Edit Role
        const res = await fetch(`${API_URL}/admin/users/${editUser.id}/role`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ role: userForm.role })
        });
        if (res.ok) {
          setShowUserModal(false);
          fetchData();
          alert('Role pengguna berhasil diperbarui!');
        } else {
          const err = await res.json();
          alert(`Gagal edit role: ${err.error}`);
        }
      } else {
        // Add User
        const res = await fetch(`${API_URL}/admin/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(userForm)
        });
        if (res.ok) {
          setShowUserModal(false);
          fetchData();
          alert('Pengguna baru berhasil ditambahkan!');
        } else {
          const err = await res.json();
          alert(`Gagal tambah user: ${err.error}`);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openAddUser = () => {
    setEditUser(null);
    setUserForm({ username: '', email: '', password: '', role: 'user' });
    setShowUserModal(true);
  };

  const openEditUser = (u) => {
    setEditUser(u);
    setUserForm({ username: u.username, email: u.email || '', password: '', role: u.role });
    setShowUserModal(true);
  };

  if (!user || user.role !== 'admin') return <Navigate to="/" />;

  // Prepare pie data
  const pieData = analytics?.moodDistribution?.map(d => ({
    name: MOOD_LABELS[d.mood_type] || d.mood_type,
    value: parseInt(d.count),
    color: MOOD_COLORS[d.mood_type] || '#888',
  })) || [];

  // Format dates short
  const formatDate = (d) => {
    if (!d) return '';
    const parts = d.split('-');
    return `${parts[2]}/${parts[1]}`;
  };

  const moodTrend = (analytics?.moodTrend || []).map(r => ({ ...r, date: formatDate(r.date), happy: +r.happy, neutral: +r.neutral, sad: +r.sad }));
  const postsChart = (analytics?.postsPerDay || []).map(r => ({ date: formatDate(r.date), Postingan: +r.count }));
  const userChart = (analytics?.userGrowth || []).map(r => ({ date: formatDate(r.date), Pengguna: +r.count }));
  const newestUsers = [...users]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">

      {/* Header */}
      <div className="flex items-center justify-between pt-4">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-rose-500" />
            <span className="gradient-text" style={{ backgroundImage: 'linear-gradient(to right, #f43f5e, #fb923c)' }}>Admin Panel</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--t-secondary)' }}>Moderasi komunitas & analitik kesehatan mental mahasiswa.</p>
        </div>
        <button onClick={fetchData} className="btn-ghost p-2 rounded-xl" title="Refresh Data">
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} style={{ color: 'var(--t-brand)' }} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Pengguna', value: stats.users, icon: <Users className="w-6 h-6 text-emerald-500" />, bg: 'bg-emerald-500/10' },
          { label: 'Total Postingan', value: stats.posts, icon: <MessageSquare className="w-6 h-6 text-blue-500" />, bg: 'bg-blue-500/10' },
          { label: 'Data Mood Masuk', value: analytics?.moodDistribution?.reduce((a, r) => a + parseInt(r.count), 0) ?? '—', icon: <Activity className="w-6 h-6 text-amber-500" />, bg: 'bg-amber-500/10' },
          { label: 'Daftar Hari Ini', value: userChart?.find(r => r.date === formatDate(new Date().toLocaleDateString('en-CA')))?.Pengguna ?? 0, icon: <UserPlus className="w-6 h-6 text-rose-500" />, bg: 'bg-rose-500/10' },
        ].map((s, i) => (
          <div key={i} className="glass-card p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${s.bg}`}>{s.icon}</div>
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--t-secondary)' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Pie Chart - Mood Distribution */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-5 h-5 text-brand-400" style={{ color: 'var(--t-brand)' }} />
            <h2 className="font-bold text-sm">Distribusi Mood Keseluruhan</h2>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-rose-400" /></div>
          ) : pieData.length === 0 ? (
            <p className="text-center py-10 text-xs" style={{ color: 'var(--t-muted)' }}>Belum ada data mood.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span style={{ color: 'var(--t-secondary)' }}>{d.name}</span>
                    <span className="font-bold">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Line Chart - Mood Trend 7 days */}
        <div className="glass-card p-5 md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5" style={{ color: 'var(--t-brand)' }} />
            <h2 className="font-bold text-sm">Tren Mood 7 Hari Terakhir</h2>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-rose-400" /></div>
          ) : moodTrend.length === 0 ? (
            <p className="text-center py-10 text-xs" style={{ color: 'var(--t-muted)' }}>Belum ada data mood 7 hari terakhir.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={moodTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--t-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--t-muted)' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={v => MOOD_LABELS[v] || v} />
                <Line type="monotone" dataKey="happy" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="neutral" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="sad" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Pengguna Terbaru */}
      <div className="w-full">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-400" />
              <h2 className="font-bold text-sm">Pengguna Terbaru</h2>
            </div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full">
              5 Terbaru
            </span>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-rose-400" /></div>
          ) : newestUsers.length === 0 ? (
            <p className="text-center py-8 text-xs" style={{ color: 'var(--t-muted)' }}>Belum ada pengguna terdaftar.</p>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {newestUsers.map((u, i) => (
                <div key={u.id || i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shadow-inner select-none"
                      style={{
                        background: `hsla(${(u.username.charCodeAt(0) || 0) * 45 % 360}, 55%, 62%, 0.15)`,
                        color: `hsl(${(u.username.charCodeAt(0) || 0) * 45 % 360}, 55%, 62%)`,
                        border: `1px solid hsla(${(u.username.charCodeAt(0) || 0) * 45 % 360}, 55%, 62%, 0.3)`
                      }}>
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold">@{u.username}</p>
                      <p className="text-[10px]" style={{ color: 'var(--t-secondary)' }}>
                        {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                    ${u.role === 'admin' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* User Management Table */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Manajemen Pengguna</h2>
          <button onClick={openAddUser} className="btn-primary px-3 py-1.5 text-sm rounded-lg flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tambah Pengguna
          </button>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-rose-400" /></div>
        ) : users.length === 0 ? (
          <p className="text-center py-10 text-sm" style={{ color: 'var(--t-muted)' }}>Belum ada pengguna terdaftar.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" style={{ color: 'var(--t-primary)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--t-secondary)' }}>
                  <th className="py-3 px-2 text-sm font-semibold">ID</th>
                  <th className="py-3 px-2 text-sm font-semibold">Username</th>
                  <th className="py-3 px-2 text-sm font-semibold">Role</th>
                  <th className="py-3 px-2 text-sm font-semibold">Tgl Daftar</th>
                  <th className="py-3 px-2 text-sm font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="py-3 px-2 text-sm">{u.id}</td>
                    <td className="py-3 px-2 text-sm font-medium">@{u.username}</td>
                    <td className="py-3 px-2 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-bold 
                        ${u.role === 'admin' ? 'bg-rose-500/10 text-rose-500' :
                          'bg-emerald-500/10 text-emerald-500'}`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-xs" style={{ color: 'var(--t-secondary)' }}>
                      {new Date(u.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="py-3 px-2 text-center flex items-center justify-center gap-2">
                      <button onClick={() => openEditUser(u)}
                        className="text-blue-500 hover:bg-blue-500/10 p-1.5 rounded-lg transition-colors"
                        disabled={u.role === 'admin' && u.id === user.id}
                        title="Edit Role">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteUser(u.id, u.username)}
                        className="text-rose-500 hover:bg-rose-500/10 p-1.5 rounded-lg transition-colors"
                        disabled={u.role === 'admin'}
                        style={{ opacity: u.role === 'admin' ? 0.3 : 1, cursor: u.role === 'admin' ? 'not-allowed' : 'pointer' }}
                        title="Hapus Pengguna">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Channel Management Table */}
      <div className="glass-card p-6 animate-slide-up">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold">Manajemen Saluran Obrolan</h2>
            <p className="text-xs text-[var(--t-muted)] font-medium">Buat, edit, atau hapus saluran obrolan Ruang Aman secara dinamis.</p>
          </div>
          <button onClick={openAddChannel} className="btn-primary px-3 py-1.5 text-sm rounded-lg flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tambah Saluran
          </button>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-rose-400" /></div>
        ) : channels.length === 0 ? (
          <p className="text-center py-10 text-sm" style={{ color: 'var(--t-muted)' }}>Belum ada saluran obrolan.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" style={{ color: 'var(--t-primary)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--t-secondary)' }}>
                  <th className="py-3 px-2 text-sm font-semibold">Slug / ID</th>
                  <th className="py-3 px-2 text-sm font-semibold">Nama Saluran</th>
                  <th className="py-3 px-2 text-sm font-semibold">Deskripsi</th>
                  <th className="py-3 px-2 text-sm font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {channels.map(chan => (
                  <tr key={chan.slug} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="py-3 px-2 text-xs font-mono font-semibold" style={{ color: 'var(--t-brand)' }}>#{chan.slug}</td>
                    <td className="py-3 px-2 text-sm font-bold text-[var(--t-primary)]">{chan.name}</td>
                    <td className="py-3 px-2 text-xs" style={{ color: 'var(--t-secondary)' }}>
                      {chan.description || 'Tidak ada deskripsi'}
                    </td>
                    <td className="py-3 px-2 text-center flex items-center justify-center gap-2">
                      <button onClick={() => openEditChannel(chan)}
                        className="text-blue-500 hover:bg-blue-500/10 p-1.5 rounded-lg transition-colors"
                        title="Edit Saluran">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteChannel(chan.slug)}
                        className="text-rose-500 hover:bg-rose-500/10 p-1.5 rounded-lg transition-colors"
                        title="Hapus Saluran">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Post Moderation */}
      <div className="glass-card p-6 animate-slide-up">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold">Moderasi Safe Space</h2>
            <p className="text-xs text-[var(--t-muted)] font-medium">Hapus postingan anonim yang dinilai tidak pantas secara massal.</p>
          </div>

          <div className="flex items-center gap-3">
            {filteredPosts.length > 0 && (
              <button
                onClick={handleSelectAllPosts}
                className="btn-ghost border border-[var(--border)] px-3 py-1.5 text-xs rounded-lg font-semibold"
              >
                {filteredPosts.every(p => selectedPosts.includes(p.id)) ? 'Batal Pilih' : 'Pilih Semua'}
              </button>
            )}

            {selectedPosts.length > 0 && (
              <button
                onClick={handleBulkDeletePosts}
                className="bg-rose-500 hover:bg-rose-600 text-white px-3.5 py-1.5 text-xs rounded-lg flex items-center gap-1.5 font-bold shadow-md animate-fade-in"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus Terpilih ({selectedPosts.length})
              </button>
            )}
          </div>
        </div>

        {/* Real-time Search & Date Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border)] animate-fade-in">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--t-secondary)' }}>Cari Kata Kunci / @username / #saluran</label>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Ketik kata kunci pencarian..."
              className="input-field py-2 text-xs rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--t-secondary)' }}>Filter Berdasarkan Tanggal</label>
            <input
              type="date"
              value={searchDate}
              onChange={e => setSearchDate(e.target.value)}
              className="input-field py-2 text-xs rounded-xl cursor-pointer"
              style={{ colorScheme: theme === 'dark' ? 'dark' : 'light' }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-rose-400" /></div>
        ) : filteredPosts.length === 0 ? (
          <p className="text-center py-10 text-sm" style={{ color: 'var(--t-muted)' }}>Tidak ada postingan yang cocok dengan filter pencarian.</p>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredPosts.map(post => {
              const isChecked = selectedPosts.includes(post.id);
              return (
                <div key={post.id}
                  className={`p-4 rounded-xl border flex items-start gap-4 transition-all duration-150 ${isChecked ? 'border-rose-500 bg-rose-500/5 shadow-[0_0_15px_rgba(244,63,94,0.05)]' : 'border-[var(--border)] bg-[var(--bg-subtle)]'}`}>

                  {/* Select Checkbox */}
                  <div className="pt-1 select-none">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleSelectPost(post.id)}
                      className="w-4 h-4 cursor-pointer accent-rose-500"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1.5">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 shrink-0">ID: {post.id}</span>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 shrink-0 uppercase tracking-wider">#{post.channel_slug || 'curhat-umum'}</span>
                      <span className="text-xs font-bold text-[var(--t-primary)]">@{post.username}</span>
                      <span className="text-[10px] text-[var(--t-muted)] font-medium">{new Date(post.created_at).toLocaleString('id-ID')}</span>
                    </div>
                    <p className="text-sm leading-relaxed text-[var(--t-secondary)] break-words">{post.content}</p>
                  </div>

                  <button onClick={() => handleDeletePost(post.id)} className="shrink-0 text-rose-500 hover:bg-rose-500/10 p-2 rounded-lg self-start transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Feedbacks / Kotak Masuk */}
      <div className="glass-card p-6 animate-slide-up">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Inbox className="w-5 h-5 text-brand-500" /> Kotak Masuk Laporan & Saran
            </h2>
            <p className="text-xs text-[var(--t-muted)] font-medium">Ulasan, laporan bug, dan permintaan saluran dari pengguna.</p>
          </div>
        </div>

        {/* Real-time Search & Date Filters for Feedbacks */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border)] animate-fade-in">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--t-secondary)' }}>Cari Kata Kunci / Nama / Tipe</label>
            <input
              type="text"
              value={feedbackSearchQuery}
              onChange={e => setFeedbackSearchQuery(e.target.value)}
              placeholder="Ketik kata kunci pencarian..."
              className="input-field py-2 text-xs rounded-xl w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--t-secondary)' }}>Filter Status</label>
            <select
              value={feedbackFilterStatus}
              onChange={e => setFeedbackFilterStatus(e.target.value)}
              className="input-field py-2 text-xs rounded-xl w-full cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="unread">Belum Dibaca (Baru)</option>
              <option value="read">Sudah Dibaca</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--t-secondary)' }}>Filter Berdasarkan Tanggal</label>
            <input
              type="date"
              value={feedbackSearchDate}
              onChange={e => setFeedbackSearchDate(e.target.value)}
              className="input-field py-2 text-xs rounded-xl w-full cursor-pointer"
              style={{ colorScheme: theme === 'dark' ? 'dark' : 'light' }}
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-rose-400" /></div>
        ) : filteredFeedbacks.length === 0 ? (
          <p className="text-center py-10 text-sm" style={{ color: 'var(--t-muted)' }}>Tidak ada masukan yang cocok dengan filter pencarian.</p>
        ) : (
          <div className="space-y-3">
            {filteredFeedbacks.map(fb => (
              <div key={fb.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row gap-4 transition-all duration-150 ${fb.status === 'unread' ? 'border-brand-500/50 bg-brand-500/5' : 'border-[var(--border)] bg-[var(--bg-subtle)] opacity-75'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${fb.status === 'unread' ? 'bg-rose-500 text-white' : 'bg-[var(--bg-overlay)] text-[var(--t-secondary)] border border-[var(--border)]'}`}>
                      {fb.status === 'unread' ? 'BARU' : 'DIBACA'}
                    </span>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 uppercase tracking-wider shrink-0">{fb.type}</span>
                    <span className="text-xs font-bold text-[var(--t-primary)]">{fb.name || 'Anonim'}</span>
                    {fb.email && <span className="text-xs text-[var(--t-secondary)]">({fb.email})</span>}
                    <span className="text-[10px] text-[var(--t-muted)] font-medium ml-auto">{new Date(fb.created_at).toLocaleString('id-ID')}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-[var(--t-secondary)] break-words bg-[var(--bg-surface)] p-3 rounded-lg border border-[var(--border)]">
                    {fb.message}
                  </p>
                </div>
                <div className="flex sm:flex-col gap-2 shrink-0">
                  <button onClick={() => handleUpdateFeedbackStatus(fb.id, fb.status)} className="flex-1 sm:flex-none btn-ghost border border-[var(--border)] px-3 py-1.5 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold hover:bg-brand-500/10 hover:text-brand-500 transition-colors" title="Tandai Dibaca/Belum Dibaca">
                    <Check className="w-4 h-4" /> {fb.status === 'unread' ? 'Tandai Dibaca' : 'Tandai Baru'}
                  </button>
                  <button onClick={() => handleDeleteFeedback(fb.id)} className="flex-1 sm:flex-none text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 px-3 py-1.5 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold transition-colors" title="Hapus Masukan">
                    <Trash2 className="w-4 h-4" /> Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="glass-card p-6 w-full max-w-md mx-4 relative">
            <button onClick={() => setShowUserModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-rose-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-4">{editUser ? 'Edit Role Pengguna' : 'Tambah Pengguna Baru'}</h2>

            <form onSubmit={handleSaveUser} className="space-y-4">
              {!editUser && (
                <>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: 'var(--t-secondary)' }}>Username</label>
                    <input type="text" required
                      value={userForm.username} onChange={e => setUserForm({ ...userForm, username: e.target.value })}
                      className="input-field w-full" placeholder="username" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: 'var(--t-secondary)' }}>Email (Opsional)</label>
                    <input type="email"
                      value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                      className="input-field w-full" placeholder="email@contoh.com" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: 'var(--t-secondary)' }}>Password</label>
                    <input type="password" required
                      value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                      className="input-field w-full" placeholder="••••••••" />
                  </div>
                </>
              )}

              {editUser && (
                <div className="mb-4">
                  <p className="text-sm" style={{ color: 'var(--t-secondary)' }}>Mengedit role untuk: <strong style={{ color: 'var(--t-primary)' }}>@{editUser.username}</strong></p>
                </div>
              )}

              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--t-secondary)' }}>Role</label>
                <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })} className="input-field w-full cursor-pointer">
                  <option value="user">User Biasa</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowUserModal(false)} className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors" style={{ color: 'var(--t-secondary)', backgroundColor: 'var(--bg-subtle)' }}>Batal</button>
                <button type="submit" className="btn-primary px-4 py-2 rounded-xl text-sm font-semibold">{editUser ? 'Simpan Perubahan' : 'Tambah Pengguna'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Channel Modal */}
      {showChannelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="glass-card p-6 w-full max-w-md mx-4 relative">
            <button onClick={() => setShowChannelModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-rose-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-4">{editChannel ? 'Edit Saluran Obrolan' : 'Buat Saluran Obrolan Baru'}</h2>

            <form onSubmit={handleSaveChannel} className="space-y-4">
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--t-secondary)' }}>Nama Saluran</label>
                <input type="text" required
                  value={channelForm.name} onChange={e => {
                    const val = e.target.value;
                    if (!editChannel) {
                      const autoSlug = val.toLowerCase().trim().replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');
                      setChannelForm({ ...channelForm, name: val, slug: autoSlug });
                    } else {
                      setChannelForm({ ...channelForm, name: val });
                    }
                  }}
                  className="input-field w-full" placeholder="Contoh: 💬-curhat-kerjaan atau #healing-tips" />
              </div>

              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--t-secondary)' }}>Slug Saluran</label>
                <input type="text" required disabled={!!editChannel}
                  value={channelForm.slug} onChange={e => setChannelForm({ ...channelForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-') })}
                  className="input-field w-full font-mono text-xs disabled:opacity-50 disabled:cursor-not-allowed" placeholder="curhat-kerjaan" />
              </div>

              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--t-secondary)' }}>Deskripsi Saluran (Opsional)</label>
                <textarea
                  value={channelForm.description} onChange={e => setChannelForm({ ...channelForm, description: e.target.value })}
                  className="input-field w-full text-xs min-h-[80px] resize-none" placeholder="Masukkan deskripsi singkat fungsi saluran..." />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowChannelModal(false)} className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors" style={{ color: 'var(--t-secondary)', backgroundColor: 'var(--bg-subtle)' }}>Batal</button>
                <button type="submit" className="btn-primary px-4 py-2 rounded-xl text-sm font-semibold">{editChannel ? 'Simpan Perubahan' : 'Buat Saluran'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
