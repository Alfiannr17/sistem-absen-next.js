'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import {
  formatClock,
  formatDateTime,
  localDateValue,
  meetingWindow,
  one,
  statusLabel,
  type AttendanceRecord,
  type ClassRecord,
  type MeetingRecord,
} from '@/utils/attendance'

export default function MahasiswaKelasDetail() {
  const supabase = createClient()
  const router = useRouter()
  const routeParams = useParams<{ id: string }>()
  const classId = routeParams.id
  
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [kelas, setKelas] = useState<ClassRecord | null>(null)
  const [studentId, setStudentId] = useState('')
  const [message, setMessage] = useState('')
  const [meetings, setMeetings] = useState<MeetingRecord[]>([])
  const [history, setHistory] = useState<AttendanceRecord[]>([])

  const fetchClassData = useCallback(async (id: string, userId: string) => {
    const { data: enrollment, error: enrollmentError } = await supabase.from('enrollments').select('id').eq('class_id', id).eq('student_id', userId).maybeSingle()
    if (enrollmentError || !enrollment) {
      if (enrollmentError) setMessage(`Gagal memeriksa akses kelas: ${enrollmentError.message}`)
      setAccessDenied(true)
      setInitialLoading(false)
      return
    }
    const [
      { data: classData, error: classError },
      { data: meetingData, error: meetingError },
      { data: historyData, error: historyError },
    ] = await Promise.all([
      supabase.from('classes').select('*').eq('id', id).single(),
      supabase.from('meetings').select('*').eq('class_id', id).order('meeting_date', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('attendance').select(`
        id, class_id, meeting_id, student_id, attendance_date, status, attended_at,
        meetings (id, class_id, title, meeting_date, attendance_start, attendance_end, late_after_minutes, is_active)
      `).eq('class_id', id).eq('student_id', userId).order('attended_at', { ascending: false }),
    ])
    if (classError) setMessage(`Gagal memuat kelas: ${classError.message}`)
    if (meetingError) setMessage(`Gagal memuat pertemuan: ${meetingError.message}`)
    if (historyError) setMessage(`Gagal memuat riwayat: ${historyError.message}`)
    
    setKelas((classData as ClassRecord | null) ?? null)
    setMeetings((meetingData ?? []) as MeetingRecord[])
    setHistory((historyData ?? []) as AttendanceRecord[])
    setInitialLoading(false)
  }, [supabase])

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')
      setStudentId(user.id)
      await fetchClassData(classId, user.id)
    }
    fetchData()
  }, [classId, fetchClassData, router, supabase])

  const activeMeeting = useMemo(() => {
    return meetings.find((meeting) => meeting.is_active) ?? null
  }, [meetings])

  const activeRecord = useMemo(() => {
    if (!activeMeeting) return null
    return history.find((item) => item.meeting_id === activeMeeting.id) ?? null
  }, [activeMeeting, history])

  const windowStatus = useMemo(() => {
    if (!activeMeeting) return { isOpen: false, isLate: false, label: 'Belum ada pertemuan aktif', tone: 'neutral' as const }
    return meetingWindow(activeMeeting)
  }, [activeMeeting])

  const handleAbsen = async () => {
    if (!kelas || !activeMeeting || activeRecord) return
    setLoading(true)
    setMessage('')
    
    const currentWindow = meetingWindow(activeMeeting, new Date())
    if (!currentWindow.isOpen) {
      setMessage(currentWindow.label)
      setLoading(false)
      return
    }
    
    const status = currentWindow.isLate ? 'late' : 'present'
    const attendedAt = new Date().toISOString()
    
    const { data: newAttendance, error } = await supabase.from('attendance').insert({
      class_id: kelas.id,
      meeting_id: activeMeeting.id,
      student_id: studentId,
      attendance_date: localDateValue(),
      status,
      attended_at: attendedAt,
    }).select(`
      id, class_id, meeting_id, student_id, attendance_date, status, attended_at,
      meetings (id, class_id, title, meeting_date, attendance_start, attendance_end, late_after_minutes, is_active)
    `).single()

    if (error) {
      setMessage(error.message.toLowerCase().includes('duplicate') || error.message.toLowerCase().includes('unique') ? 'Kamu sudah absen untuk pertemuan ini.' : `Gagal menyimpan absen: ${error.message}`)
    } else {
      setHistory([(newAttendance as AttendanceRecord), ...history])
      setMessage(`Absen berhasil disimpan dengan status ${statusLabel(status)}.`)
    }
    setLoading(false)
  }

  if (initialLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-5">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] px-6 py-5 text-sm font-semibold text-[var(--muted)] animate-pulse">
          Memuat data kelas...
        </div>
      </div>
    )
  }

  if (accessDenied || !kelas) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-10">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-10 text-center">
          <h1 className="text-3xl font-bold">Akses Ditolak</h1>
          <p className="mt-3 font-medium text-[var(--muted)]">Pastikan kamu sudah bergabung memakai kode kelas yang benar.</p>
          <button onClick={() => router.push('/mahasiswa/dashboard')} className="mt-6 rounded-xl bg-blue-600 px-8 py-3.5 font-bold text-white transition hover:bg-blue-700">
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    )
  }

  const canAttend = windowStatus.isOpen && !activeRecord

  return (
    <div className="mx-auto grid w-full max-w-8xl px-4 py-8 sm:px-6">
      
      {/* Kolom Kiri: Info & Tombol Absen */}
      <section className="space-y-6">
        <div id="ringkasan" className="rounded-xl border border-[var(--line)] bg-gradient-to-br from-[var(--panel)] to-[var(--panel-muted)] p-8">
          <span className="inline-block rounded-lg bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">Ruang Kelas</span>
          <h1 className="mt-4 text-3xl md:text-4xl font-bold text-[var(--foreground)] leading-tight">{kelas.course_name}</h1>
          <div className="mt-6 inline-block rounded-xl border border-[var(--line)] bg-[var(--panel)] px-5 py-3">
            <p className="text-xs font-bold text-[var(--muted)] mb-1">Kode Akses</p>
            <p className="text-xl font-bold">{kelas.code}</p>
          </div>
        </div>

        <div id="absen" className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-8 text-center">
          {activeMeeting ? (
             <>
               <div className="mb-4 mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                 <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
               </div>
               <h2 className="text-2xl font-bold">{activeMeeting.title}</h2>
               <p className="mt-2 text-[var(--muted)] font-medium">
                 Waktu: <span className="font-bold text-[var(--foreground)]">{formatClock(activeMeeting.attendance_start)} - {formatClock(activeMeeting.attendance_end)}</span>
               </p>
               
               <button onClick={handleAbsen} disabled={!canAttend || loading} 
                  className={`mt-8 min-h-[70px] w-full rounded-xl px-6 py-4 text-xl font-bold transition-all focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-[var(--background)]
                    ${activeRecord 
                      ? 'bg-[var(--panel-muted)] border border-[var(--line)] text-[var(--muted)] cursor-not-allowed' 
                      : canAttend 
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:-translate-y-1' 
                        : 'bg-red-50 text-red-500 cursor-not-allowed border border-red-100 dark:bg-red-900/20 dark:border-red-900/50'}`}>
                  {loading ? 'Memproses...' : activeRecord ? 'Selesai Absen' : canAttend ? 'KLIK UNTUK HADIR' : windowStatus.label.toUpperCase()}
               </button>
             </>
          ) : (
            <div className="py-8">
              <svg className="mx-auto h-16 w-16 text-[var(--muted)] opacity-50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <h2 className="text-xl font-bold">Tidak ada sesi aktif</h2>
              <p className="mt-2 text-sm text-[var(--muted)] font-medium">Tunggu dosen mengaktifkan pertemuan.</p>
            </div>
          )}

          {message && (
            <p className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--panel-muted)] p-4 text-sm font-semibold" aria-live="polite">
              {message}
            </p>
          )}
        </div>
      </section>

      {/* Kolom Kanan: Riwayat */}
      <section id="riwayat" className="rounded-xl border border-[var(--line)] bg-[var(--panel)] overflow-hidden flex flex-col mt-8">
        <div className="border-b border-[var(--line)] p-6 bg-[var(--panel-muted)] flex items-center justify-between">
          <h2 className="text-xl font-bold">Riwayat Kamu</h2>
          <span className="rounded-lg bg-[var(--panel)] px-3 py-1 text-xs font-bold border border-[var(--line)] text-[var(--muted)]">{history.length} Catatan</span>
        </div>
        <div className="grid gap-3 p-4">
          {history.map((item) => {
            const meeting = one(item.meetings)
            return (
              <article key={item.id} className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-[var(--foreground)]">{meeting?.title ?? '-'}</h3>
                  <span className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold ${item.status === 'present' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                    {statusLabel(item.status)}
                  </span>
                </div>
                <p className="mt-3 border-t border-[var(--line)] pt-3 text-sm font-medium text-[var(--muted)]">{formatDateTime(item.attended_at)}</p>
              </article>
            )
          })}
          {history.length === 0 && <p className="rounded-xl border border-dashed border-[var(--line)] p-8 text-center font-medium text-[var(--muted)]">Belum ada riwayat absen.</p>}
        </div>
      </section>
    </div>
  )
}
