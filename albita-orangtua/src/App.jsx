import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  CheckCircle2,
  Mic,
  Send,
  Eye,
  MessageSquare,
  ShieldCheck,
  LogOut,
  ExternalLink,
  FileText,
  Calendar as CalendarIcon
} from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const soalCodeParam = urlParams.get('soal');

  const [accessInput, setAccessInput] = useState('');
  const [loggedInCode, setLoggedInCode] = useState(soalCodeParam || null);
  const [loginError, setLoginError] = useState('');
  const [studentData, setStudentData] = useState(null);

  const [parentTextInput, setParentTextInput] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [sentMessages, setSentMessages] = useState([]);

  const now = new Date();
  const currentMonthName = MONTHS_ID[now.getMonth()];
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const handleLogin = async (e) => {
    e.preventDefault();
    const formattedCode = accessInput.trim().toUpperCase();
    if (!formattedCode.startsWith('ALBITA-')) {
      setLoginError('Format kode akses harus berawalan ALBITA- (contoh: ALBITA-AZKA).');
      return;
    }

    if (!supabase) {
      setLoginError('Koneksi database cloud belum dikonfigurasi.');
      return;
    }

    try {
      // Ambil data siswa dari Supabase
      const { data: stds, error } = await supabase
        .from('students')
        .select('*')
        .eq('access_code', formattedCode)
        .single();

      if (error || !stds) {
        setLoginError('Kode akses tidak ditemukan atau belum terdaftar di sistem pengajar.');
        return;
      }

      // Ambil status pembayaran bulan ini
      const { data: pay } = await supabase
        .from('payments')
        .select('status')
        .eq('month_key', currentMonthKey)
        .eq('student_id', stds.id)
        .single();

      // Ambil catatan guru
      const { data: note } = await supabase
        .from('teacher_notes')
        .select('*')
        .eq('student_id', stds.id)
        .single();

      // Ambil arsip soal dikerjakan
      const { data: subs } = await supabase
        .from('submissions')
        .select('*')
        .eq('student_id', stds.id);

      const { data: allExams } = await supabase.from('exams').select('*');

      // Hitung total kehadiran bulan berjalan dari tabel attendance jika ada, atau simulasi data aman
      // Di sini kita cek data kehadiran berdasarkan format penyimpanan harian
      const { data: attendanceTable } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', stds.id);

      let totalHadirBulanIni = 0;
      let totalIzinBulanIni = 0;
      let totalTidakHadirBulanIni = 0;

      if (attendanceTable && attendanceTable.length > 0) {
        attendanceTable.forEach(att => {
          if (att.date && att.date.startsWith(currentMonthKey)) {
            if (att.status === 'Hadir') totalHadirBulanIni++;
            if (att.status === 'Izin') totalIzinBulanIni++;
            if (att.status === 'Tidak Hadir') totalTidakHadirBulanIni++;
          }
        });
      }

      const mappedExams = (subs || []).map(sub => {
        const ex = (allExams || []).find(e => e.id === sub.exam_id);
        if (!ex) return null;
        return {
          id: sub.id,
          subject: ex.subject,
          date: sub.date,
          title: ex.title,
          score: sub.score,
          questions: (ex.questions || []).map(q => {
            const res = (sub.results || []).find(r => r.no === q.no);
            return { ...q, status: res ? res.status : 'correct' };
          })
        };
      }).filter(Boolean);

      setStudentData({
        id: stds.id,
        name: stds.name,
        class: stds.class || '6 SD',
        paymentStatus: pay ? pay.status : (stds.payment_status || 'Belum Lunas'),
        teacherNoteMonth: note ? note.month : currentMonthName,
        teacherNoteText: note ? note.note : 'Belum ada catatan khusus dari pengajar bulan ini.',
        completedExams: mappedExams,
        attendanceStats: {
          hadir: totalHadirBulanIni,
          izin: totalIzinBulanIni,
          tidakHadir: totalTidakHadirBulanIni
        }
      });

      setLoggedInCode(formattedCode);
      setLoginError('');
    } catch (err) {
      console.error(err);
      setLoginError('Terjadi kesalahan saat menghubungkan ke database.');
    }
  };

  if (soalCodeParam && !studentData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl border text-center space-y-3">
          <p className="text-xs text-slate-600">Memuat arsip soal...</p>
        </div>
      </div>
    );
  }

  if (!loggedInCode) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-7 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-sm">
              A
            </div>
            <h1 className="text-xl font-bold text-slate-900">Portal Orang Tua Siswa</h1>
            <p className="text-xs text-slate-500">Bimbingan Belajar <strong>ALBITA</strong></p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Masukkan Kode Akses Siswa</label>
              <input
                type="text"
                required
                placeholder="Contoh: ALBITA-AZKA"
                value={accessInput}
                onChange={(e) => setAccessInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-mono uppercase focus:outline-none focus:border-indigo-600"
              />
              {loginError && <p className="text-xs text-rose-600 mt-1.5 font-medium">{loginError}</p>}
            </div>
            <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all">
              Buka Laporan Perkembangan Anak
            </button>
          </form>

          <div className="pt-3 border-t flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Privasi siswa dilindungi kode akses pribadi</span>
          </div>
        </div>
      </div>
    );
  }

  const handleOpenSoalNewTab = () => {
    const newTabUrl = `${window.location.origin}${window.location.pathname}?soal=${loggedInCode}`;
    window.open(newTabUrl, '_blank', 'noopener,noreferrer');
  };

  const handleParentSendText = (e) => {
    e.preventDefault();
    if (!parentTextInput.trim()) return;
    setSentMessages([{ id: Date.now(), type: 'Teks', content: parentTextInput }, ...sentMessages]);
    setParentTextInput('');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <header className="bg-indigo-950 text-white border-b border-indigo-900 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold text-xl">
              A
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-indigo-300">
                Portal Orang Tua • Bimbel Albita
              </span>
              <h1 className="font-bold text-base sm:text-lg leading-tight">
                {studentData?.name} ({studentData?.class})
              </h1>
            </div>
          </div>

          <button
            onClick={() => { setLoggedInCode(null); setAccessInput(''); setStudentData(null); }}
            className="px-3 py-1.5 rounded-xl bg-indigo-800 hover:bg-indigo-700 text-xs font-semibold text-indigo-100 flex items-center gap-1.5 border border-indigo-700"
          >
            <LogOut className="w-3.5 h-3.5" /> Keluar
          </button>
        </div>
      </header>

      <main className="max-w-4xl w-full mx-auto px-4 py-6 flex-1 space-y-6">
        {/* Ringkasan Profil & Status SPP */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <h2 className="font-bold text-lg text-slate-900">{studentData?.name}</h2>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                {studentData?.class}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">SPP ({currentMonthName}) :</span>
              <span
                className={`px-3.5 py-1.5 rounded-xl font-bold text-white text-xs select-none ${
                  studentData?.paymentStatus === 'Lunas' ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              >
                {studentData?.paymentStatus}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-500">
              Arsip soal yang sudah dikerjakan ({studentData?.completedExams.length} Paket)
            </span>
            <button
              onClick={handleOpenSoalNewTab}
              className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              Lihat Soal <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Informasi Kehadiran / Hari Les Bulan Ini */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-base text-slate-900">Rekap Kehadiran Bulan {currentMonthName}</h2>
            </div>
            <span className="text-xs font-semibold text-slate-500">Target: ~16 Sesi / Bulan</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-center">
              <span className="block text-[11px] font-semibold text-emerald-700 uppercase">Hadir</span>
              <span className="text-2xl font-extrabold text-emerald-800">{studentData?.attendanceStats?.hadir || 0}</span>
              <span className="block text-[10px] text-emerald-600 mt-0.5">Hari / Pertemuan</span>
            </div>
            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-center">
              <span className="block text-[11px] font-semibold text-amber-700 uppercase">Izin</span>
              <span className="text-2xl font-extrabold text-amber-800">{studentData?.attendanceStats?.izin || 0}</span>
              <span className="block text-[10px] text-amber-600 mt-0.5">Hari</span>
            </div>
            <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl text-center">
              <span className="block text-[11px] font-semibold text-rose-700 uppercase">Tidak Hadir</span>
              <span className="text-2xl font-extrabold text-rose-800">{studentData?.attendanceStats?.tidakHadir || 0}</span>
              <span className="block text-[10px] text-rose-600 mt-0.5">Hari</span>
            </div>
          </div>
        </div>

        {/* Catatan Guru */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-base text-slate-900">Catatan Guru</h2>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
              Bulan {studentData?.teacherNoteMonth}
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
            "{studentData?.teacherNoteText}"
          </div>
        </div>

        {/* Komunikasi dengan Pengajar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-600" /> Hubungi Pengajar Albita
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Kirim pesan teks atau rekam suara untuk konsultasi atau izin.</p>
          </div>

          <form onSubmit={handleParentSendText} className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              placeholder="Tulis pesan untuk pengajar..."
              value={parentTextInput}
              onChange={(e) => setParentTextInput(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-600"
            />
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <Send className="w-4 h-4" /> Kirim
              </button>
              <button
                type="button"
                onClick={() => setIsRecordingVoice(!isRecordingVoice)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${isRecordingVoice ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800 text-white'}`}
              >
                <Mic className="w-4 h-4" /> {isRecordingVoice ? 'Stop Rekam' : 'Voice Note'}
              </button>
            </div>
          </form>

          {sentMessages.length > 0 && (
            <div className="space-y-2 pt-2">
              {sentMessages.map((m) => (
                <div key={m.id} className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-center justify-between">
                  <div><strong>[{m.type}]</strong> {m.content}</div>
                  <span className="text-[11px] text-indigo-700 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Terkirim</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
