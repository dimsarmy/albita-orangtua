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
  ExternalLink,
  FileText
} from 'lucide-react';

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

  const [viewingExamModal, setViewingExamModal] = useState(null);
  const [parentTextInput, setParentTextInput] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [sentMessages, setSentMessages] = useState([]);

  const now = new Date();
  const currentMonthName = MONTHS_ID[now.getMonth()];
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const getStudentData = (code) => {
    const formatted = code.trim().toUpperCase();
    if (!formatted.startsWith('ALBITA-')) return null;

    const rawName = formatted.replace('ALBITA-', '');
    const formattedName = rawName.charAt(0) + rawName.slice(1).toLowerCase();

    try {
      const savedStudents = JSON.parse(localStorage.getItem('albita_students') || 'null');
      const savedPayments = JSON.parse(localStorage.getItem('albita_payments') || '{}');
      const savedNotes = JSON.parse(localStorage.getItem('albita_teacher_notes') || '{}');
      const savedExams = JSON.parse(localStorage.getItem('albita_exams') || '[]');
      const savedSubs = JSON.parse(localStorage.getItem('albita_submissions') || '[]');

      if (savedStudents) {
        const found = savedStudents.find((s) => s.accessCode === formatted);
        if (!found) return null;

        const monthPayMap = savedPayments[currentMonthKey] || {};
        const sppStatus = monthPayMap[found.id] || 'Belum Lunas';
        const noteObj = savedNotes[found.id] || {
          month: currentMonthName,
          note: 'Belum ada catatan khusus dari pengajar bulan ini.'
        };

        const stdSubs = savedSubs.filter((sub) => sub.studentId === found.id);
        const mappedExams = stdSubs
          .map((sub) => {
            const ex = savedExams.find((e) => e.id === sub.examId);
            if (!ex) return null;
            return {
              id: sub.id,
              subject: ex.subject,
              date: sub.date,
              title: ex.title,
              score: sub.score,
              questions: ex.questions.map((q) => {
                const res = sub.results.find((r) => r.no === q.no);
                return { ...q, status: res ? res.status : 'correct' };
              })
            };
          })
          .filter(Boolean);

        return {
          id: found.id,
          name: found.name,
          class: found.class || '6 SD',
          paymentStatus: sppStatus,
          teacherNoteMonth: noteObj.month,
          teacherNoteText: noteObj.note,
          completedExams: mappedExams
        };
      }
    } catch (e) {
      console.error(e);
    }

    return {
      id: 'std-dynamic',
      name: formattedName || 'Siswa Albita',
      class: '6 SD',
      paymentStatus: 'Belum Lunas',
      teacherNoteMonth: currentMonthName,
      teacherNoteText: 'Ananda mengikuti sesi pembelajaran dengan baik.',
      completedExams: []
    };
  };

  // Tab Baru Khusus Lihat Soal (Warna disamakan Indigo Albita)
  if (soalCodeParam) {
    const student = getStudentData(soalCodeParam);
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800">
        <header className="bg-indigo-950 text-white py-4 px-4 sticky top-0 z-20 shadow-sm">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-indigo-300 font-semibold">
                Arsip Soal Dikerjakan • View Only
              </span>
              <h1 className="font-bold text-lg">{student?.name} ({student?.class})</h1>
            </div>
            <span className="px-3 py-1 rounded-full bg-indigo-800 border border-indigo-700 text-xs font-semibold flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Hanya Lihat
            </span>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          {!student || student.completedExams.length === 0 ? (
            <div className="bg-white rounded-2xl border p-8 text-center text-xs text-slate-500">
              Belum ada soal yang dikerjakan untuk ditampilkan.
            </div>
          ) : (
            student.completedExams.map((exam) => (
              <div key={exam.id} className="bg-white rounded-2xl border p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-start border-b pb-3">
                  <div>
                    <span className="text-xs font-bold text-indigo-600">{exam.subject} • {exam.date}</span>
                    <h2 className="font-bold text-base text-slate-900">{exam.title}</h2>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 font-bold text-xs">
                    Skor: {exam.score}
                  </span>
                </div>
                <div className="space-y-2">
                  {exam.questions.map((q) => (
                    <div key={q.no} className="p-3 rounded-xl border bg-slate-50 text-xs space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>Soal No. {q.no}</span>
                        <span className={q.status === 'correct' ? 'text-emerald-700' : 'text-rose-700'}>
                          {q.status === 'correct' ? 'Benar' : 'Salah'}
                        </span>
                      </div>
                      <p className="text-slate-800">{q.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </main>
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
      setLoginError('Kode akses tidak ditemukan. Pastikan format kode benar (contoh: ALBITA-AZKA).');
    }
  };

  // Halaman Login dengan Tema Warna Indigo (Sama seperti Albita Pengajar)
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

  const student = getStudentData(loggedInCode);

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
      {/* Header Indigo Sama Seperti Albita Pengajar */}
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
                {student.name} ({student.class})
              </h1>
            </div>
          </div>

          <button
            onClick={() => { setLoggedInCode(null); setAccessInput(''); }}
            className="px-3 py-1.5 rounded-xl bg-indigo-800 hover:bg-indigo-700 text-xs font-semibold text-indigo-100 flex items-center gap-1.5 border border-indigo-700"
          >
            <LogOut className="w-3.5 h-3.5" /> Keluar
          </button>
        </div>
      </header>

      <main className="max-w-4xl w-full mx-auto px-4 py-6 flex-1 space-y-6">
        {/* Kartu Profil Siswa (Tanpa Nama Wali Murid sesuai permintaan) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <h2 className="font-bold text-lg text-slate-900">{student.name}</h2>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                {student.class}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">SPP ({currentMonthName}) :</span>
              <span
                className={`px-3.5 py-1.5 rounded-xl font-bold text-white text-xs select-none ${
                  student.paymentStatus === 'Lunas' ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              >
                {student.paymentStatus}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-500">
              Arsip soal yang sudah dikerjakan ({student.completedExams.length} Paket)
            </span>
            <button
              onClick={handleOpenSoalNewTab}
              className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              Lihat Soal <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Kolom Catatan Guru (Terhubung dari Menu Catatan Guru Pengajar) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-base text-slate-900">Catatan Guru</h2>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
              Bulan {student.teacherNoteMonth}
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
            "{student.teacherNoteText}"
          </div>
        </div>

        {/* Request / Hubungi Pengajar */}
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
