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

// Data Default Siswa untuk Portal Orang Tua
const DEFAULT_STUDENTS_PARENT = {
  'ALBITA-BUDI': {
    id: 'std-1',
    name: 'Budi Santoso',
    class: '6 SD',
    parentName: 'Ibu Ratna',
    paymentStatus: 'Lunas',
    report: {
      month: 'November 2026',
      learnedSummary: 'Bulan ini Budi telah menyelesaikan paket latihan intensif Kelas 6: Matematika (Operasi Pecahan & Desimal) serta IPA (Sistem Tata Surya & Rangkaian Listrik).',
      weaknessAnalysis: 'Budi masih perlu ketelitian pada pembagian bilangan desimal dan sempat tertukar istilah rotasi vs revolusi bumi namun berhasil memperbaikinya di hari yang sama.',
      conclusionAndAdvice: 'Perkembangan Budi sangat positif (rata-rata 85). Saran untuk orang tua: mohon bantu ingatkan Budi mengecek ulang letak tanda koma pada soal pembagian desimal.',
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
    paymentStatus: 'Lunas',
    report: {
      month: 'November 2026',
      learnedSummary: 'Bulan ini Siti telah menyelesaikan latihan IPA dan Bahasa Indonesia dengan hasil sangat memuaskan.',
      weaknessAnalysis: 'Tidak ditemukan kesalahan konsep mendasar. Pertahankan ketelitian membaca soal.',
      conclusionAndAdvice: 'Perkembangan Siti sangat baik (rata-rata 92). Siap menghadapi try out.',
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
          { no: 1, text: 'Planet terbesar dalam sistem tata surya yang memiliki cincin tipis adalah...', answerKey: 'Jupiter', status: 'correct' },
          { no: 2, text: 'Pada rangkaian listrik seri, jika salah satu lampu padam maka lampu lainnya akan...', answerKey: 'Ikut padam', status: 'correct' },
          { no: 3, text: 'Peristiwa berputarnya Bumi mengelilingi Matahari disebut...', answerKey: 'Revolusi Bumi', status: 'correct' }
        ]
      }
    ]
  },
  'ALBITA-RIZKY': {
    id: 'std-3',
    name: 'Rizky Pratama',
    class: '6 SD',
    parentName: 'Ibu Dewi',
    paymentStatus: 'Belum Lunas',
    report: {
      month: 'November 2026',
      learnedSummary: 'Bulan ini Rizky mempelajari dasar operasi hitung campuran dan pemahaman bacaan.',
      weaknessAnalysis: 'Perlu pendampingan ekstra pada soal cerita bangun ruang gabungan.',
      conclusionAndAdvice: 'Mohon bantu ingatkan Rizky untuk mengulang latihan soal di rumah.',
      teacherNotes: 'Terus tingkatkan fokus saat mengerjakan latihan soal.'
    },
    completedExams: []
  }
};

export default function App() {
  // Cek jika orang tua membuka tab baru khusus Lihat Soal (?soal=CODE)
  const urlParams = new URLSearchParams(window.location.search);
  const soalCodeParam = urlParams.get('soal');

  const [accessInput, setAccessInput] = useState('');
  const [loggedInCode, setLoggedInCode] = useState(soalCodeParam || null);
  const [loginError, setLoginError] = useState('');

  const [viewingExamModal, setViewingExamModal] = useState(null);
  const [parentTextInput, setParentTextInput] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [sentMessages, setSentMessages] = useState([]);

  // Ambil data terbaru (menggabungkan pembaruan dari localStorage jika satu browser)
  const getStudentData = (code) => {
    const base = DEFAULT_STUDENTS_PARENT[code];
    if (!base) return null;

    try {
      const savedStudents = JSON.parse(localStorage.getItem('albita_students') || 'null');
      const savedExams = JSON.parse(localStorage.getItem('albita_exams') || 'null');
      const savedSubs = JSON.parse(localStorage.getItem('albita_submissions') || 'null');

      if (savedStudents) {
        const matchedStd = savedStudents.find((s) => s.accessCode === code);
        // Jika siswa dihapus oleh admin, data tidak ditampilkan
        if (!matchedStd) return null;

        let updatedExams = base.completedExams;
        if (savedSubs && savedExams) {
          const stdSubs = savedSubs.filter((sub) => sub.studentId === matchedStd.id);
          updatedExams = stdSubs
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
                  return {
                    ...q,
                    status: res ? res.status : 'correct'
                  };
                })
              };
            })
            .filter(Boolean);
        }

        return {
          ...base,
          name: matchedStd.name,
          parentName: matchedStd.parentName,
          paymentStatus: matchedStd.paymentStatus,
          completedExams: updatedExams
        };
      }
    } catch (e) {
      console.error(e);
    }

    return base;
  };

  // =========================================================================
  // TAMPILAN TAB BARU KHUSUS "LIHAT SOAL" (VIEW ONLY)
  // =========================================================================
  if (soalCodeParam) {
    const student = getStudentData(soalCodeParam);
    if (!student) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl border text-center">
            <h2 className="font-bold text-slate-800">Data Soal Tidak Ditemukan</h2>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 text-slate-800">
        <header className="bg-emerald-900 text-white py-4 px-4 sticky top-0 z-20 shadow-sm">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-semibold">
                Daftar Soal Dikerjakan • View Only
              </span>
              <h1 className="font-bold text-lg">{student.name} ({student.class})</h1>
              <p className="text-xs text-emerald-200">Wali: {student.parentName}</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-800 border border-emerald-700 text-xs font-semibold flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Hanya Lihat
            </span>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
          {student.completedExams.length === 0 ? (
            <div className="bg-white rounded-2xl border p-8 text-center text-xs text-slate-500">
              Belum ada soal yang ditampilkan untuk {student.name}.
            </div>
          ) : (
            student.completedExams.map((exam) => (
              <div key={exam.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs font-bold text-emerald-700">{exam.subject} • {exam.date}</span>
                    <h2 className="font-bold text-base text-slate-900">{exam.title}</h2>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs">
                    Skor: {exam.score}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {exam.questions.map((q) => (
                    <div key={q.no} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1.5">
                      <div className="flex justify-between font-bold">
                        <span>Soal No. {q.no}</span>
                        <span className={`px-2 py-0.5 rounded-full ${q.status === 'correct' ? 'bg-emerald-100 text-emerald-800' : q.status === 'revised' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'}`}>
                          {q.status === 'correct' ? 'Benar' : q.status === 'revised' ? 'Direvisi di Kelas' : 'Perlu Latihan Lagi'}
                        </span>
                      </div>
                      <p className="text-slate-800 font-medium">{q.text}</p>
                      <p className="text-slate-500">Kunci Jawaban: <strong className="text-slate-700">{q.answerKey}</strong></p>
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

  // =========================================================================
  // HALAMAN LOGIN KODE AKSES ORANG TUA
  // =========================================================================
  const handleLogin = (e) => {
    e.preventDefault();
    const formattedCode = accessInput.trim().toUpperCase();
    const found = getStudentData(formattedCode);
    if (found) {
      setLoggedInCode(formattedCode);
      setLoginError('');
    } else {
      setLoginError('Kode akses tidak ditemukan atau data sudah tidak aktif. Contoh kode: ALBITA-BUDI');
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
              Bimbingan Belajar <strong>ALBITA</strong> • Laporan Perkembangan Kelas 6 SD
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

  const student = getStudentData(loggedInCode);
  const report = student.report;

  const handleOpenSoalNewTab = () => {
    const newTabUrl = `${window.location.origin}${window.location.pathname}?soal=${loggedInCode}`;
    window.open(newTabUrl, '_blank', 'noopener,noreferrer');
  };

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
        {/* Kartu Ringkasan Siswa: Wali, SPP (View Only Hijau/Merah), dan Lihat Soal */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-lg text-slate-900">{student.name}</h2>
              <p className="text-xs text-slate-500">Wali: <strong className="text-slate-700">{student.parentName}</strong></p>
            </div>

            {/* Status SPP View Only (Hijau untuk Lunas, Merah untuk Belum Lunas) */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">SPP :</span>
              <span
                className={`px-3.5 py-1.5 rounded-xl font-bold text-white text-xs select-none ${
                  student.paymentStatus === 'Lunas'
                    ? 'bg-emerald-600'
                    : 'bg-rose-600'
                }`}
              >
                {student.paymentStatus}
              </span>
            </div>
          </div>

          {/* Tombol Lihat Soal di Bawah Nama Wali & SPP */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-500">
              Arsip soal yang sudah dikerjakan ({student.completedExams.length} Paket Soal)
            </span>
            <button
              onClick={handleOpenSoalNewTab}
              className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              Lihat Soal (Buka Tab Baru) <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Laporan Perkembangan Bulanan */}
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

        {/* Daftar Soal Dikerjakan (View Only) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" /> Soal Dikerjakan Bulan Ini
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Klik soal di bawah untuk melihat detail soal & hasil koreksi (hanya lihat).</p>
            </div>
          </div>

          {student.completedExams.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">Belum ada soal yang tersedia untuk ditampilkan.</p>
          ) : (
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
          )}
        </div>

        {/* Request / Hubungi Pengajar */}
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

      {/* Modal Pratinjau Soal (View Only) */}
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
