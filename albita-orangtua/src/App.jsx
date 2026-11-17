import React, { useState } from 'react';
import {
  CheckCircle2,
  Mic,
  Send,
  BookOpen,
  Eye,
  MessageSquare,
  ShieldCheck,
  LogOut,
  ExternalLink
} from 'lucide-react';

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const soalCodeParam = urlParams.get('soal');

  const [accessInput, setAccessInput] = useState('');
  const [loggedInCode, setLoggedInCode] = useState(soalCodeParam || null);
  const [loginError, setLoginError] = useState('');

  const [viewingExamModal, setViewingExamModal] = useState(null);
  const [parentTextInput, setParentTextInput] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [sentMessages, setSentMessages] = useState([]);

  const getStudentData = (code) => {
    const formatted = code.trim().toUpperCase();
    if (!formatted.startsWith('ALBITA-')) return null;

    const rawName = formatted.replace('ALBITA-', '');
    const formattedName = rawName.charAt(0) + rawName.slice(1).toLowerCase();

    try {
      const savedStudents = JSON.parse(localStorage.getItem('albita_students') || 'null');
      if (savedStudents) {
        const found = savedStudents.find((s) => s.accessCode === formatted);
        if (!found) return null;

        return {
          id: found.id,
          name: found.name,
          class: found.class || '6 SD',
          parentName: found.parentName || 'Wali Murid',
          paymentStatus: found.paymentStatus || 'Belum Lunas',
          report: {
            month: 'November 2026',
            learnedSummary: `Perkembangan belajar ${found.name} menunjukkan progres yang stabil di kelas Albita.`,
            weaknessAnalysis: 'Terus tingkatkan ketelitian dalam mengerjakan soal latihan.',
            conclusionAndAdvice: 'Saran: Latih kembali materi yang dirasa sulit di rumah secara rutin.',
            teacherNotes: 'Semangat belajar sangat baik.'
          },
          completedExams: []
        };
      }
    } catch (e) {
      console.error(e);
    }

    return {
      id: 'std-dynamic',
      name: formattedName || 'Siswa Albita',
      class: '6 SD',
      parentName: 'Wali Murid',
      paymentStatus: 'Belum Lunas',
      report: {
        month: 'November 2026',
        learnedSummary: 'Siswa aktif mengikuti sesi bimbingan belajar Albita.',
        weaknessAnalysis: 'Pertahankan kedisiplinan belajar.',
        conclusionAndAdvice: 'Terus tingkatkan latihan soal.',
        teacherNotes: 'Bagus.'
      },
      completedExams: []
    };
  };

  if (soalCodeParam) {
    const student = getStudentData(soalCodeParam);
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 p-6">
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl border shadow-sm space-y-4">
          <h1 className="font-bold text-lg">Arsip Soal: {student?.name}</h1>
          <p className="text-xs text-slate-500">Belum ada riwayat soal yang disinkronkan.</p>
        </div>
      </div>
    );
  }

  const handleLogin = (e) => {
    e.preventDefault();
    const formattedCode = accessInput.trim().toUpperCase();
    const studentData = getStudentData(formattedCode);
    if (studentData) {
      setLoggedInCode(formattedCode);
      setLoginError('');
    } else {
      setLoginError('Kode akses tidak ditemukan atau telah dihapus oleh pengajar.');
    }
  };

  if (!loggedInCode) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-7 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-sm">
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
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-mono uppercase focus:outline-none focus:border-emerald-600"
              />
              {loginError && <p className="text-xs text-rose-600 mt-1.5 font-medium">{loginError}</p>}
            </div>
            <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm">
              Buka Laporan Perkembangan Anak
            </button>
          </form>

          <div className="pt-3 border-t flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Dilindungi kode akses pribadi</span>
          </div>
        </div>
      </div>
    );
  }

  const student = getStudentData(loggedInCode);
  const report = student.report;

  const handleOpenSoalNewTab = () => {
    const newTabUrl = `${window.location.origin}${window.location.pathname}?soal=${loggedInCode}`;
    window.open(newTabUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <header className="bg-emerald-900 text-white sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl">A</div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-300">Portal Orang Tua • Bimbel Albita</span>
              <h1 className="font-bold text-base sm:text-lg leading-tight">{student.name} ({student.class})</h1>
              <p className="text-xs text-emerald-200">Wali Murid: {student.parentName}</p>
            </div>
          </div>
          <button onClick={() => { setLoggedInCode(null); setAccessInput(''); }} className="px-3 py-1.5 rounded-xl bg-emerald-800 text-xs font-semibold text-emerald-100 flex items-center gap-1.5 border border-emerald-700">
            <LogOut className="w-3.5 h-3.5" /> Keluar
          </button>
        </div>
      </header>

      <main className="max-w-4xl w-full mx-auto px-4 py-6 flex-1 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-bold text-lg text-slate-900">{student.name}</h2>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">{student.class}</span>
              </div>
              <p className="text-xs text-slate-500">Wali: <strong className="text-slate-700">{student.parentName}</strong></p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">SPP :</span>
              <span className={`px-3.5 py-1.5 rounded-xl font-bold text-white text-xs ${student.paymentStatus === 'Lunas' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                {student.paymentStatus}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-500">Arsip soal yang sudah dikerjakan ({student.completedExams.length} Paket)</span>
            <button onClick={handleOpenSoalNewTab} className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
              Lihat Soal (Buka Tab Baru) <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <h2 className="font-bold text-lg text-slate-900">Laporan Perkembangan Bulanan</h2>
          <div className="space-y-4 text-sm">
            <div className="bg-slate-50 p-4 rounded-xl border">
              <h3 className="font-bold text-xs text-indigo-700 mb-1">Materi Dipelajari</h3>
              <p className="text-slate-700 text-xs">{report.learnedSummary}</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
              <h3 className="font-bold text-xs text-amber-800 mb-1">Evaluasi</h3>
              <p className="text-slate-700 text-xs">{report.weaknessAnalysis}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
