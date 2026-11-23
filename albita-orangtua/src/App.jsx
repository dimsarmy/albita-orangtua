import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Calendar as CalendarIcon,
  Download,
  X,
  Maximize2,
  FileText,
  ShieldCheck,
  LogOut,
  Upload,
  Award,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  BookOpen
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
  const [loggedInCode, setLoggedInCode] = useState(soalCodeParam ? soalCodeParam.trim().toUpperCase() : null);
  const [loginError, setLoginError] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [studentData, setStudentData] = useState(null);

  // State untuk modal Preview / View Soal yang diperbesar
  const [selectedExamDetail, setSelectedExamDetail] = useState(null);

  const now = new Date();
  const currentMonthName = MONTHS_ID[now.getMonth()];
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Fungsi terpusat untuk mengambil & memetakan seluruh data siswa dari Supabase
  const syncStudentDashboard = useCallback(async (targetCode, isInitialLogin = false) => {
    if (!supabase || !targetCode) return;

    if (isInitialLogin) {
      setIsLoadingData(true);
      setLoginError('');
    }

    try {
      const { data: std, error } = await supabase
        .from('students')
        .select('*')
        .eq('access_code', targetCode)
        .maybeSingle();

      if (error || !std) {
        if (isInitialLogin) {
          setLoginError('Kode akses tidak ditemukan atau belum terdaftar di sistem.');
          setIsLoadingData(false);
        }
        return;
      }

      const [
        { data: pay },
        { data: note },
        { data: subs },
        { data: allExams },
        { data: attendanceTable },
        { data: evalsData }
      ] = await Promise.all([
        supabase
          .from('payments')
          .select('status')
          .eq('month_key', currentMonthKey)
          .eq('student_id', std.id)
          .maybeSingle(),
        supabase
          .from('teacher_notes')
          .select('*')
          .eq('student_id', std.id)
          .order('id', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('submissions')
          .select('*')
          .eq('student_id', std.id),
        supabase
          .from('exams')
          .select('*'),
        supabase
          .from('attendance')
          .select('*')
          .eq('student_id', std.id),
        supabase
          .from('evaluations')
          .select('*')
          .eq('student_id', std.id)
          .order('created_at', { ascending: false })
      ]);

      let totalHadirBulanIni = 0;
      let totalIzinBulanIni = 0;
      let totalTidakHadirBulanIni = 0;

      if (attendanceTable && attendanceTable.length > 0) {
        attendanceTable.forEach((att) => {
          const dateVal = att.date_key || att.date || '';
          if (String(dateVal).startsWith(currentMonthKey)) {
            if (att.status === 'Hadir') totalHadirBulanIni++;
            if (att.status === 'Izin') totalIzinBulanIni++;
            if (att.status === 'Tidak Hadir') totalTidakHadirBulanIni++;
          }
        });
      }

      const mappedExams = (subs || [])
        .map((sub) => {
          const ex = (allExams || []).find((e) => e.id === sub.exam_id);
          if (!ex) return null;
          return {
            id: sub.id,
            subject: ex.subject || 'Umum',
            date: sub.date || 'Baru saja',
            uploadDate: ex.upload_date || ex.uploadDate || 'Baru saja',
            title: ex.title || 'Latihan Soal',
            score: sub.score ?? 0,
            results: sub.results || [],
            questions: (ex.questions || []).map((q) => {
              const res = (sub.results || []).find((r) => r.no === q.no);
              return {
                ...q,
                text: q.text || q.question,
                status: res ? res.status : 'correct',
                studentAnswer: res ? res.answer : '-'
              };
            })
          };
        })
        .filter(Boolean);

      // Pemetaan data evaluasi untuk siswa ini
      const mappedEvals = (evalsData || []).map((e) => ({
        id: e.id,
        evalType: e.eval_type || e.evalType,
        dateKey: e.date_key || e.dateKey,
        monthKey: e.month_key || e.monthKey,
        studentId: e.student_id || e.studentId,
        summaryText: e.summary_text || e.summaryText,
        weakTopics: Array.isArray(e.weak_topics)
          ? e.weak_topics
          : (typeof e.weak_topics === 'string' && e.weak_topics.startsWith('[')
              ? JSON.parse(e.weak_topics)
              : (e.weak_topics ? [e.weak_topics] : [])),
        examTitle: e.exam_title || e.examTitle || '',
        createdAt: e.created_at || e.createdAt
      }));

      // Filter berdasarkan bulan berjalan (month_key atau dateKey berawalan currentMonthKey)
      const currentMonthEvals = mappedEvals.filter((e) =>
        e.monthKey === currentMonthKey || (e.dateKey && String(e.dateKey).startsWith(currentMonthKey))
      );

      // Laporan Evaluasi Akhir Bulan (eval_type: 'monthly_summary')
      const monthlyReport = currentMonthEvals.find((e) => e.evalType === 'monthly_summary') || null;

      // Riwayat Evaluasi Harian & Pembetulan
      const historyEvaluations = currentMonthEvals.filter((e) => e.evalType !== 'monthly_summary');

      setStudentData({
        id: std.id,
        name: std.name,
        class: std.class || '6 SD',
        paymentStatus: pay ? pay.status : (std.payment_status || 'Belum Lunas'),
        teacherNoteMonth: note ? note.month : currentMonthName,
        teacherNoteText: note ? note.note : 'Belum ada catatan khusus dari pengajar bulan ini.',
        completedExams: mappedExams,
        attendanceStats: {
          hadir: totalHadirBulanIni,
          izin: totalIzinBulanIni,
          tidakHadir: totalTidakHadirBulanIni
        },
        monthlyReport: monthlyReport,
        evaluationsHistory: historyEvaluations
      });

      setLoggedInCode(targetCode);
      setLoginError('');
    } catch (err) {
      console.error('Gagal sinkronisasi data orang tua:', err);
      if (isInitialLogin) {
        setLoginError('Terjadi kesalahan saat menghubungkan ke database.');
      }
    } finally {
      if (isInitialLogin) {
        setIsLoadingData(false);
      }
    }
  }, [currentMonthKey, currentMonthName]);

  // Load awal jika sudah ada kode akses (misalnya dari URL ?soal=...)
  useEffect(() => {
    if (loggedInCode) {
      syncStudentDashboard(loggedInCode, true);
    }
  }, [loggedInCode, syncStudentDashboard]);

  // Pasang Realtime subscription agar perubahan dari albita-pengajar langsung masuk ke dashboard orang tua
  useEffect(() => {
    if (!supabase || !studentData?.id || !loggedInCode) return;

    const studentId = studentData.id;
    const refreshDashboard = () => {
      syncStudentDashboard(loggedInCode, false);
    };

    const parentRealtimeChannel = supabase
      .channel(`parent-sync-${studentId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance', filter: `student_id=eq.${studentId}` },
        refreshDashboard
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments', filter: `student_id=eq.${studentId}` },
        refreshDashboard
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'submissions', filter: `student_id=eq.${studentId}` },
        refreshDashboard
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teacher_notes', filter: `student_id=eq.${studentId}` },
        refreshDashboard
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'students', filter: `id=eq.${studentId}` },
        refreshDashboard
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'exams' },
        refreshDashboard
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'evaluations', filter: `student_id=eq.${studentId}` },
        refreshDashboard
      )
      .subscribe();

    return () => {
      supabase.removeChannel(parentRealtimeChannel);
    };
  }, [studentData?.id, loggedInCode, syncStudentDashboard]);

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

    await syncStudentDashboard(formattedCode, true);
  };

  const handleDownloadReport = (exam) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>Laporan Hasil Latihan - ${studentData?.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h2 { color: #4338ca; margin-bottom: 5px; }
            .meta { margin-bottom: 20px; font-size: 14px; color: #555; }
            .score-box { background: #e0e7ff; padding: 10px 15px; border-radius: 8px; font-weight: bold; display: inline-block; margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; font-size: 13px; text-align: left; }
            th { background: #f1f5f9; }
          </style>
        </head>
        <body>
          <h2>Bimbel Albita - Laporan Hasil Belajar</h2>
          <div class="meta">
            <p><strong>Nama Siswa:</strong> ${studentData?.name} (${studentData?.class})</p>
            <p><strong>Materi / Paket:</strong> ${exam.title} (${exam.subject})</p>
            <p><strong>Tanggal Upload Soal:</strong> ${exam.uploadDate}</p>
            <p><strong>Tanggal Pengerjaan/Scan:</strong> ${exam.date}</p>
          </div>
          <div class="score-box">Nilai Akhir: ${exam.score} / 100</div>
          <h3>Detail Jawaban Soal:</h3>
          <table>
            <thead>
              <tr>
                <th style="width: 50px;">No</th>
                <th>Pertanyaan</th>
                <th style="width: 100px;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${exam.questions.map((q) => `
                <tr>
                  <td>${q.no}</td>
                  <td>${q.text || 'Soal Latihan'}</td>
                  <td><b>${q.status === 'correct' ? 'Benar' : (q.status === 'corrected' ? 'Sudah Dibenarkan' : 'Perlu Latihan')}</b></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (!loggedInCode || (!studentData && isLoadingData)) {
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
            <button
              type="submit"
              disabled={isLoadingData}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold shadow-sm transition-all"
            >
              {isLoadingData ? 'Menyinkronkan Data...' : 'Buka Laporan Perkembangan Anak'}
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col relative">
      <header className="bg-indigo-950 text-white border-b border-indigo-900 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold text-xl">
              A
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-indigo-300">
                Portal Orang Tua • Bimbel Albita (Realtime View-Only)
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

          {/* Daftar Paket Soal & Tanggal Upload */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Riwayat Pengerjaan Soal & Tanggal Upload</h3>
            {studentData?.completedExams.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">Belum ada riwayat soal yang dikerjakan bulan ini.</p>
            ) : (
              <div className="space-y-2">
                {studentData.completedExams.map((exam) => (
                  <div key={exam.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{exam.title}</span>
                        <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">{exam.subject}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Upload className="w-3 h-3 text-indigo-600" /> Diupload: <strong>{exam.uploadDate}</strong>
                        </span>
                        <span>•</span>
                        <span>Scan: {exam.date}</span>
                        <span>•</span>
                        <span>Nilai: <strong className="text-indigo-600">{exam.score}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => setSelectedExamDetail(exam)}
                        className="flex-1 sm:flex-none px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Maximize2 className="w-3.5 h-3.5" /> View / Perbesar
                      </button>
                      <button
                        onClick={() => handleDownloadReport(exam)}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
                        title="Download / Cetak Laporan"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* BAGIAN BARU: EVALUASI BELAJAR & PERKEMBANGAN ANAK (REALTIME DARI SUPABASE) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-base text-slate-900">Evaluasi Belajar & Perkembangan Anak</h2>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
              Periode {currentMonthName}
            </span>
          </div>

          {/* 1. Laporan Evaluasi Akhir Bulan (Tampilan Menonjol Paling Atas Jika Sudah Ada) */}
          {studentData?.monthlyReport ? (
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white p-5 sm:p-6 rounded-2xl border border-indigo-800 shadow-md space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    Laporan Evaluasi Akhir Bulan (Pengajar)
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-indigo-200 bg-indigo-800/70 px-2.5 py-0.5 rounded-full border border-indigo-700">
                  {currentMonthName}
                </span>
              </div>

              <div className="text-xs sm:text-sm text-indigo-100/95 leading-relaxed whitespace-pre-wrap font-sans space-y-1">
                {studentData.monthlyReport.summaryText}
              </div>

              <div className="pt-2 flex justify-between items-center text-[11px] text-indigo-300 border-t border-indigo-900/60">
                <span>Bimbingan Belajar Albita</span>
                <span>Tanggal Rangkuman: {studentData.monthlyReport.dateKey || '-'}</span>
              </div>
            </div>
          ) : null}

          {/* 2. Riwayat Evaluasi Harian & Progres Pembetulan */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-600" /> Riwayat Evaluasi Harian & Progres Pembetulan
            </h3>

            {(!studentData?.evaluationsHistory || studentData.evaluationsHistory.length === 0) ? (
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-xs text-slate-500 text-center space-y-1">
                <p className="font-medium text-slate-600">Belum ada catatan evaluasi khusus untuk bulan {currentMonthName}.</p>
                <p className="text-[11px] text-slate-400">
                  Catatan kelemahan konsep harian serta evaluasi saat anak berhasil menuntaskan soal pembetulan akan otomatis muncul di sini.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {studentData.evaluationsHistory.map((ev) => {
                  const isCorrection = ev.evalType === 'correction';
                  return (
                    <div
                      key={ev.id}
                      className={`p-4 rounded-xl border transition-all space-y-2.5 ${
                        isCorrection
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                          : 'bg-amber-50/70 border-amber-200 text-amber-950'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 pb-2">
                        <div className="flex items-center gap-2">
                          {isCorrection ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          )}
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${
                              isCorrection
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-amber-100 text-amber-800 border-amber-300'
                            }`}
                          >
                            {isCorrection
                              ? 'Evaluasi Pembetulan • Tuntas & Meningkat'
                              : 'Evaluasi Harian • Perlu Penguatan'}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {ev.dateKey || '-'}
                        </span>
                      </div>

                      {ev.examTitle && (
                        <p className="text-xs font-bold text-slate-800">
                          Materi / Paket: <span className="text-indigo-700">{ev.examTitle}</span>
                        </p>
                      )}

                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {ev.summaryText}
                      </p>

                      {ev.weakTopics && ev.weakTopics.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] font-bold text-slate-500">Topik Materi:</span>
                          {ev.weakTopics.map((top, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                                isCorrection
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {top}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Informasi Kehadiran Bulan Ini */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-base text-slate-900">Rekap Kehadiran Bulan {currentMonthName}</h2>
            </div>
            <span className="text-xs font-semibold text-slate-500">Jadwal: Senin - Kamis</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-center">
              <span className="block text-[11px] font-semibold text-emerald-700 uppercase">Hadir</span>
              <span className="text-2xl font-extrabold text-emerald-800">{studentData?.attendanceStats?.hadir || 0}</span>
              <span className="block text-[10px] text-emerald-600 mt-0.5">Hari</span>
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
      </main>

      {/* MODAL / POPUP VIEW DETAIL SOAL YANG DIPERBESAR */}
      {selectedExamDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50 rounded-t-2xl">
              <div>
                <h3 className="font-bold text-base text-slate-900">{selectedExamDetail.title}</h3>
                <p className="text-xs text-slate-500">Mata Pelajaran: {selectedExamDetail.subject} • Dibuat: {selectedExamDetail.uploadDate} • Nilai: <strong className="text-indigo-600">{selectedExamDetail.score}</strong></p>
              </div>
              <button
                onClick={() => setSelectedExamDetail(null)}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Rincian Pertanyaan & Jawaban</span>
                <button
                  onClick={() => handleDownloadReport(selectedExamDetail)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-indigo-200"
                >
                  <Download className="w-3.5 h-3.5" /> Download Laporan Ini
                </button>
              </div>

              <div className="space-y-3">
                {selectedExamDetail.questions.map((q, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600">Soal No. {q.no}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${q.status === 'correct' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {q.status === 'correct' ? 'Benar' : (q.status === 'corrected' ? 'Sudah Dibenarkan' : 'Perlu Latihan')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 font-medium">{q.text || q.question || `Pertanyaan nomor ${q.no}`}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end">
              <button
                onClick={() => setSelectedExamDetail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
