<div align="center">

<!-- LOGO PROJECT -->
<img src="logo.png" alt="MindEase Logo" width="300">

# 🧠 MindEase: Teman Pulih di Setiap Langkahmu 🌿
### *Healthy Lives & Well-being — Capstone Project Coding Camp 2026 powered by DBS Foundation*
ID Tim: **CC26-PSU186**

---
</div>

### 📌 Deskripsi Singkat Proyek
Banyak individu saat ini lebih merasa nyaman mencurahkan isi hati kepada AI dibandingkan orang terdekat karena minimnya penghakiman dan kemudahan akses 24/7. Namun, tren ini membawa risiko tinggi berupa *self-diagnosis* yang tidak akurat melalui pencarian mandiri di internet. 

**MindEase** hadir sebagai solusi *"painkiller"* untuk menjembatani celah antara kebutuhan validasi emosional dan penanganan medis yang kredibel. Proyek ini mengintegrasikan pelacakan suasana hati (*mood tracking*) harian dengan AI Chatbot berbasis NLP yang menganalisis sentimen dari riwayat percakapan pengguna untuk memprediksi tingkat kelelahan mental (*burnout*), sekaligus menyediakan akses interaksi yang aman melalui forum moderasi dan telekonsultasi.

---

### 🧩 Fitur & Cakupan Proyek (Project Scope)
*   **Smart Assessment & Mood Check-in:** Antarmuka berbasis pilihan ganda untuk pelacakan emosi harian beserta notifikasi pengingat via Email (SMTP).
*   **History-Based AI Prediction:** Chatbot fungsional yang menganalisis tren sentimen percakapan untuk mendeteksi indikasi tingkat kelelahan mental pengguna.
*   **Anonymous Community Forum (Safe Space):** Forum diskusi aman dengan sistem moderasi kata kunci otomatis (*word-filtering*) dan indikator status *online* pengguna.
*   **Admin Dashboard:** Panel fungsional yang dilengkapi visualisasi data interaktif, manajemen masukan (feedback), serta manajemen basis pengguna.

---

### 🛠️ Teknologi & Sumber Daya yang Digunakan
*   **Front-End:** ReactJS, Vite, Tailwind CSS, Axios.
*   **Back-End & Database:** Node.js (Express.js), PostgreSQL, Supabase.
*   **Machine Learning / AI:** Python, TensorFlow Functional API, NLP (Natural Language Processing).
*   **Deployment:** Vercel (Frontend), Render (Backend), Supabase (Database).

---

### 🔗 Tautan Model ML & Deployment
* **Live Website (Frontend):** https://mindease-alpha-six.vercel.app/
* **API Endpoint (Backend):** https://be-mindease.onrender.com
* **Tautan Model ML:** [Masukkan Link Drive / HuggingFace Model .h5 / .pkl di sini jika ada]

---

### ⚙️ Petunjuk Setup Environment
Proyek ini terbagi menjadi dua bagian utama: `fe-mindease` (Frontend) dan `be-mindease` (Backend). Sebelum menjalankan aplikasi, Anda perlu mengatur berkas *environment variables*.

Terdapat berkas `.env.example` di masing-masing folder. Silakan salin berkas tersebut dan ubah namanya menjadi `.env`, lalu isi dengan konfigurasi lokal Anda. *(Catatan: Nilai di bawah ini hanyalah template, masukkan kredensial asli Anda di mesin lokal)*:

**1. Konfigurasi Environment Backend (`be-mindease/.env`)**
```env
PORT=5000
DATABASE_URL=postgresql://[USER]:[PASSWORD]@db.[SUPABASE-ID].supabase.co:5432/postgres
JWT_SECRET=rahasia_jwt_kamu_di_sini
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx
SMTP_FROM=MindEase <email_kamu@gmail.com>
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=2525
SMTP_USER=email_brevo_kamu@gmail.com
SMTP_PASS=password_smtp_brevo_kamu
FRONTEND_URL=http://localhost:5173
```

**2. Konfigurasi Environment Frontend (`fe-mindease/.env`)**
```env
VITE_API_URL=http://localhost:5000/api
```

---

### 🚀 Cara Menjalankan Aplikasi
Pastikan Node.js (v18+) sudah terinstal di sistem Anda.

**Langkah 1: Menjalankan Backend**
1. Buka terminal dan arahkan ke direktori backend:
   ```bash
   cd be-mindease
   ```
2. Instal semua dependensi:
   ```bash
   npm install
   ```
3. Sinkronisasikan tabel database (opsional jika tabel belum dibuat):
   ```bash
   node config/db.js
   ```
4. Jalankan server backend:
   ```bash
   npm run dev
   ```
   *Server akan berjalan di `http://localhost:5000`*

**Langkah 2: Menjalankan Frontend**
1. Buka terminal baru dan arahkan ke direktori frontend:
   ```bash
   cd fe-mindease
   ```
2. Instal semua dependensi:
   ```bash
   npm install
   ```
3. Jalankan development server frontend:
   ```bash
   npm run dev
   ```
   *Aplikasi dapat diakses melalui browser di `http://localhost:5173`*

---

### 👥 Anggota Tim Capstone (CC26-PSU186)

| Learning Path | ID Anggota | Nama Lengkap | Fokus Peran (Job Desk) | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Full-Stack Web Dev** | CFCC220D6X0429 | **Fadhilah Nurhidayah** | Arsitektur Frontend UI/UX, React/Vite, Integrasi API & State Management. | Aktif |
| **Full-Stack Web Dev** | CFCC613D6Y1061 | **Natanael Nainggolan** | Arsitektur Server Express.js, Database PostgreSQL, RESTful API Design. | Aktif |
| **Data Scientist** | CDCC220D6X1237 | **Nia Nabilla** | Pengolahan Dataset Emosi, Analisis Tren Riwayat Suasana Hati & Validasi Statistik. | Aktif |
| **Data Scientist** | CDCC220D6X1240 | **Aulia Natasya Reyhana** | Pengolahan Dataset Emosi, Preprocessing Data & Analisis Validasi. | Aktif |
| **AI Engineer** | CACC220D6Y2323 | **Rezki Rahmat Alfi** | Pengembangan Model NLP (LSTM/Transformers) Sentimen Chat & Deploy Flask AI API. | Aktif |
| **AI Engineer** | CACC220D6Y2569 | **Ahmad Fadli Pratama** | Pembuatan Sistem Moderasi Konten Forum Otomatis (Blacklist/Filter Teks). | Aktif |
