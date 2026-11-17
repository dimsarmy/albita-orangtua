import React, { useState } from 'react';
import {
  CheckCircle2,
  Mic,
  Send,
  Calendar,
  CreditCard,
  BookOpen,
  Eye,
  MessageSquare,
  ShieldCheck,
  LogOut
} from 'lucide-react';

// Data Siswa & Laporan (Dilengkapi Kode Akses Unik per Orang Tua agar Privasi Terjaga)
const STUDENTS_DATA = {
  'ALBITA-BUDI': {
    id: 'std-1',
    name: 'Budi Santoso',
    class: '6 SD',
    parentName: 'Ibu Ratna',
    report: {
      month: 'November 2026',
      learnedSummary: 'Bulan ini Budi telah menyelesaikan paket latihan intensif Kelas 6: Matematika (Operasi Pecahan & Desimal) serta IPA (Sistem Tata Surya & Rangkaian Listrik).',
      weaknessAnalysis: 'Berdasarkan pemindaian lembar kerja, Budi masih perlu ketelitian pada pembagian bilangan desimal (Nomor 3 Paket Matematika) dan sempat tertukar istilah rotasi vs revolusi bumi namun berhasil memperbaikinya di hari yang sama.',
      conclusionAndAdvice: 'Perkembangan Budi sangat positif (rata-rata 85). Saran untuk orang tua: mohon bantu ingatkan Budi mengecek ulang letak tanda koma pada soal pembagian desimal.',
      paymentStatus: 'Lunas (Rp 450.000 - 05 Nov 2026)',
      attendance: '12 Hadir / 0 Izin / 0 Alpha (100%)',
      teacherNotes: 'Budi anak yang aktif bertanya saat sesi pembahasan koreksi biru.'
    },
    completedExams: [
      {
        id: 'exam-1',
        subject: 'Matematika',
        date: '14 Nov 2026',
        title: 'Latihan Ujian Matematika - Pecahan & Desimal (Paket A)',
        score: 80,
        questions: [
          { no: 1, text: 'Hasil dari 3/4 + 0,25 dalam bentuk desimal adalah...', answerKey: '1,00 atau 1', status: 'correct' },
          { no: 2, text: 'Ibu membeli 2,5 kg gula dan digunakan 1 1/4 kg untuk membuat kue. Sisa gula Ibu adalah...', answerKey: '1,25 kg', status: 'revised' },
          { no: 3, text: 'Hasil pembagian 4,8 : 0,6 adalah...', answerKey: '8', status: 'wrong' },
          { no: 4, text: 'Urutkan pecahan berikut dari yang terkecil: 65%; 0,7; 3/5', answerKey: '3/5; 65%; 0,7', status: 'correct' },
          { no: 5, text: 'Sebuah tangki berisi 15,5 liter air. Jika 40% air digunakan, berapa liter sisa air di tangki?', answerKey: '9,3 liter', status: 'correct' }
        ]
      }
    ]
  },
  'ALBITA-SITI': {
    id: 'std-2',
    name: 'Siti Aminah',
    class: '6 SD',
    parentName: 'Bapak Hendra',
    report: {
      month: 'November 2026',
      learnedSummary: 'Bulan ini Siti telah menyelesaikan latihan IPA dan Bahasa Indonesia dengan hasil sangat memuaskan.',
      weaknessAnalysis: 'Tidak ditemukan kesalahan konsep mendasar. Pertahankan ketelitian membaca soal.',
      conclusionAndAdvice: 'Perkembangan Siti sangat baik (rata-rata 92). Siap menghadapi try out.',
      paymentStatus: 'Lunas (Rp 450.000 - 03 Nov 2026)',
      attendance: '11 Hadir / 1 Izin',
      teacherNotes: 'Pemahaman konsep sangat baik.'
    },
    completedExams: [
      {
        id: 'exam-2',
        subject: 'IPA',
        date: '16 Nov 2026',
        title: 'Try Out IPA Kelas 6 - Sistem Tata Surya & Rangkaian Listrik',
        score: 100,
        questions: [
          { no: 1, text: 'Planet terbesar dalam sistem tata surya yang memiliki cincin tipis adalah...', answerKey: 'Jupiter', status: 'correct' }
        ]
      }
    ]
  }
};

export default function App() {
  const [accessInput, setAccessInput] = useState('');
  const [loggedInCode, setLoggedInCode] = useState(null);
  const [loginError, setLoginError] = useState('');

  const [viewingExamModal, setViewingExamModal] = useState(null);
  const [parentTextInput, setParentTextInput] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [sentMessages, setSentMessages] = useState([]);

  const handleLogin = (e) => {
    e.preventDefault();
    const formattedCode = accessInput.trim().toUpperCase();
    if (STUDENTS_DATA[formattedCode]) {
      setLoggedInCode(formattedCode);
      setLoginError('');
    } else {
      setLoginError('Kode akses tidak ditemukan. Silakan cek kembali kode dari Pengajar Albita (Contoh: ALBITA-BUDI).');
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
            <p className="text-xs text-slate-500">
              Bimbingan Belajar <strong>ALBITA</strong> • Laporan Perkembangan Belajar Kelas 6 SD
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Masukkan Kode Akses Siswa
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: ALBITA-BUDI"
                value={accessInput}
                onChange={(e) => setAccessInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-mono uppercase focus:outline-none focus:border-emerald-600"
              />
              {loginError && (
                <p className="text-xs text-rose-600 mt-1.5 font-medium">{loginError}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all"
            >
              Buka Laporan Perkembangan Anak
            </button>
          </form>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Privasi data siswa dilindungi kode akses pribadi</span>
          </div>
        </div>
      </div>
    );
  }

  const student = STUDENTS_DATA[loggedInCode];
  const report = student.report;

  const handleParentSendText = (e) => {
    e.preventDefault();
    if (!parentTextInput.trim()) return;
    setSentMessages([
      { id: Date.now(), type: 'Teks', content: parentTextInput },
      ...sentMessages
    ]);
    setParentTextInput('');
  };

  const handleParentSimulateVoice = () => {
    if (!isRecordingVoice) {
      setIsRecordingVoice(true);
      return;
    }
    setIsRecordingVoice(false);
    setSentMessages([
      { id: Date.now(), type: 'Voice Note (0:12)', content: 'Pesan suara terkirim ke Pengajar Albita.' },
      ...sentMessages
    ]);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <header className="bg-emerald-900 text-white sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl">
              A
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-300">
                Portal Orang Tua • Bimbel Albita
              </span>
              <h1 className="font-bold text-base sm:text-lg leading-tight">
                {student.name} ({student.class})
              </h1>
              <p className="text-xs text-emerald-200">Wali Murid: {student.parentName}</p>
            </div>
          </div>

          <button
            onClick={() => { setLoggedInCode(null); setAccessInput(''); }}
            className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-xs font-semibold text-emerald-100 flex items-center gap-1.5 border border-emerald-700"
          >
            <LogOut className="w-3.5 h-3.5" /> Keluar
          </button>
        </div>
      </header>

      <main className="max-w-4xl w-full mx-auto px-4 py-6 flex-1 space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Pembayaran Bulan Ini</div>
              <div className="font-bold text-sm text-slate-900 mt-0.5">{report.paymentStatus}</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Kehadiran Kelas</div>
              <div className="font-bold text-sm text-slate-900 mt-0.5">{report.attendance}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg text-slate-900">Laporan Perkembangan Bulanan</h2>
              <p className="text-xs text-slate-500">Periode: {report.month}</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Resmi Pengajar
            </span>
          </div>

          <div className="space-y-4 text-sm">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h3 className="font-bold text-xs uppercase tracking-wider text-indigo-700 mb-1.5">Materi Dipelajari</h3>
              <p className="text-slate-700 text-xs leading-relaxed">{report.learnedSummary}</p>
            </div>
            <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80">
              <h3 className="font-bold text-xs uppercase tracking-wider text-amber-800 mb-1.5">Evaluasi & Kekurangan</h3>
              <p className="text-slate-700 text-xs leading-relaxed">{report.weaknessAnalysis}</p>
            </div>
            <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200/80">
              <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-800 mb-1.5">Kesimpulan & Saran</h3>
              <p className="text-slate-700 text-xs leading-relaxed">{report.conclusionAndAdvice}</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-1">Catatan Khusus Guru</h3>
              <p className="text-slate-800 text-xs italic">"{report.teacherNotes}"</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" /> Soal Dikerjakan Bulan Ini
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Klik latihan soal untuk melihat detail butir soal dan status koreksi.</p>
          </div>
          <div className="space-y-2.5">
            {student.completedExams.map((exam) => (
              <div
                key={exam.id}
                onClick={() => setViewingExamModal(exam)}
                className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 bg-slate-50/70 transition-all cursor-pointer flex items-center justify-between gap-3"
              >
                <div>
                  <span className="text-[11px] font-bold text-emerald-700">{exam.subject} • {exam.date}</span>
                  <h3 className="font-bold text-sm text-slate-900">{exam.title}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white border text-slate-800">Skor: {exam.score}</span>
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1"><Eye className="w-4 h-4" /> Lihat</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" /> Request / Hubungi Pengajar
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Kirim pesan teks atau rekam suara untuk konsultasi atau izin.</p>
          </div>
          <form onSubmit={handleParentSendText} className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              placeholder="Tulis pesan ke guru..."
              value={parentTextInput}
              onChange={(e) => setParentTextInput(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-emerald-600"
            />
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <Send className="w-4 h-4" /> Kirim
              </button>
              <button
                type="button"
                onClick={handleParentSimulateVoice}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${isRecordingVoice ? 'bg-rose-600 text-white animate-pulse' : 'bg-purple-600 text-white'}`}
              >
                <Mic className="w-4 h-4" /> {isRecordingVoice ? 'Selesai Rekam' : 'Rekam Suara'}
              </button>
            </div>
          </form>
          {sentMessages.length > 0 && (
            <div className="space-y-2 pt-2">
              {sentMessages.map((m) => (
                <div key={m.id} className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                  <div><strong>[{m.type}]</strong> {m.content}</div>
                  <span className="text-[11px] text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Terkirim</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {viewingExamModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-3 border-b pb-3">
              <div>
                <span className="text-xs font-bold text-emerald-700">{viewingExamModal.subject}</span>
                <h3 className="font-bold text-lg text-slate-900">{viewingExamModal.title}</h3>
              </div>
              <button onClick={() => setViewingExamModal(null)} className="px-3 py-1 rounded-lg bg-slate-100 text-xs font-bold">Tutup</button>
            </div>
            <div className="space-y-3">
              {viewingExamModal.questions.map((q) => (
                <div key={q.no} className="p-3.5 rounded-xl border bg-slate-50 text-xs space-y-1.5">
                  <div className="flex justify-between font-bold">
                    <span>Soal No. {q.no}</span>
                    <span className={`px-2 py-0.5 rounded-full ${q.status === 'correct' ? 'bg-emerald-100 text-emerald-800' : q.status === 'revised' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'}`}>
                      {q.status === 'correct' ? 'Benar' : q.status === 'revised' ? 'Direvisi di Kelas' : 'Salah'}
                    </span>
                  </div>
                  <p className="text-slate-800 font-medium">{q.text}</p>
                  <p className="text-slate-500">Kunci: <strong className="text-slate-700">{q.answerKey}</strong></p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}