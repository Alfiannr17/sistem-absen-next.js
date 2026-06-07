'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import {
  escapeCsvCell, formatClock, formatDate, formatDateTime, localDateValue,
  meetingLabel, one, statusLabel, type AttendanceRecord, type ClassRecord,
  type EnrollmentRecord, type MeetingRecord, type Profile,
} from '@/utils/attendance'

type EnrollmentWithProfile = EnrollmentRecord & { profiles: Profile | Profile[] | null }
type ViewMode = 'attendance' | 'students'

export default function DosenKelasDetail() {
  const supabase = createClient()
  const router = useRouter()
  const routeParams = useParams<{ id: string }>()
  const classId = routeParams.id

  const [initialLoading, setInitialLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)
  const [kelas, setKelas] = useState<ClassRecord | null>(null)
  const [teacherId, setTeacherId] = useState('')
  const [students, setStudents] = useState<EnrollmentWithProfile[]>([])
  const [meetings, setMeetings] = useState<MeetingRecord[]>([])
  const [selectedMeetingId, setSelectedMeetingId] = useState('')
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)
  const [view, setView] = useState<ViewMode>('attendance')
  const [className, setClassName] = useState('')
  const [meetingForm, setMeetingForm] = useState({
    title: '', meeting_date: localDateValue(), attendance_start: '', attendance_end: '', late_after_minutes: '15',
  })

  const selectedMeeting = useMemo(() => meetings.find((meeting) => meeting.id === selectedMeetingId) ?? null, [meetings, selectedMeetingId])

  const fetchAttendance = useCallback(async (meetingId: string) => {
    if (!meetingId) return setAttendance([])
    const { data, error } = await supabase.from('attendance').select(`id, class_id, meeting_id, student_id, attendance_date, status, attended_at, profiles (id, name, email, nim, role)`).eq('meeting_id', meetingId).order('attended_at', { ascending: true })
    if (error) return setMessage(`Gagal memuat absensi: ${error.message}`)
    setAttendance((data ?? []) as AttendanceRecord[])
  }, [supabase])

  const fetchDetail = useCallback(async (id: string, userId: string) => {
    const { data: classData, error: classError } = await supabase.from('classes').select('*').eq('id', id).eq('teacher_id', userId).single()
    if (classError || !classData) {
      if (classError) setMessage(`Gagal memuat kelas: ${classError.message}`)
      setAccessDenied(true)
      setInitialLoading(false)
      return
    }
    const currentClass = classData as ClassRecord
    setKelas(currentClass)
    setClassName(currentClass.course_name)

    const [{ data: studentData }, { data: meetingData }] = await Promise.all([
      supabase.from('enrollments').select(`id, class_id, student_id, created_at, profiles (id, name, email, nim, role)`).eq('class_id', id).order('created_at', { ascending: true }),
      supabase.from('meetings').select('*').eq('class_id', id).order('meeting_date', { ascending: false }).order('created_at', { ascending: false }),
    ])
    
    const meetingRows = (meetingData ?? []) as MeetingRecord[]
    setStudents((studentData ?? []) as EnrollmentWithProfile[])
    setMeetings(meetingRows)

    const nextSelected = meetingRows[0]?.id ?? ''
    setSelectedMeetingId(nextSelected)
    await fetchAttendance(nextSelected)
    setInitialLoading(false)
  }, [fetchAttendance, supabase])

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')
      setTeacherId(user.id)
      await fetchDetail(classId, user.id)
    }
    fetchData()
  }, [classId, fetchDetail, router, supabase])

  useEffect(() => {
    const syncViewFromHash = () => {
      if (window.location.hash === '#data-mahasiswa') setView('students')
      if (window.location.hash === '#rekap-absen') setView('attendance')
    }
    syncViewFromHash()
    window.addEventListener('hashchange', syncViewFromHash)
    return () => window.removeEventListener('hashchange', syncViewFromHash)
  }, [])

  const attendanceByStudent = useMemo(() => new Map(attendance.map((item) => [item.student_id, item])), [attendance])
  const rows = useMemo(() => students.map((student) => ({ enrollment: student, profile: one(student.profiles), record: attendanceByStudent.get(student.student_id) ?? null })), [attendanceByStudent, students])

  const stats = useMemo(() => {
    const present = rows.filter((row) => row.record?.status === 'present').length
    const late = rows.filter((row) => row.record?.status === 'late').length
    return { students: rows.length, present, late, absent: Math.max(0, rows.length - present - late) }
  }, [rows])

  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!kelas) return
    setSaving(true); setMessage('')
    const { error } = await supabase.from('classes').update({ course_name: className.trim() }).eq('id', kelas.id).eq('teacher_id', teacherId)
    if (error) setMessage(`Gagal menyimpan kelas: ${error.message}`)
    else { setMessage('Nama kelas berhasil diperbarui.'); setKelas({ ...kelas, course_name: className.trim() }) }
    setSaving(false)
  }

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!kelas) return
    setSaving(true); setMessage('')
    if (meetingForm.attendance_start >= meetingForm.attendance_end) { setMessage('Jam tutup absen harus lebih besar dari jam mulai.'); setSaving(false); return }
    const lateAfter = Number(meetingForm.late_after_minutes)
    
    const { data, error } = await supabase.from('meetings').insert({
      class_id: kelas.id, title: meetingForm.title.trim(), meeting_date: meetingForm.meeting_date,
      attendance_start: meetingForm.attendance_start, attendance_end: meetingForm.attendance_end,
      late_after_minutes: Number.isFinite(lateAfter) ? lateAfter : 15, is_active: false,
    }).select().single()

    if (error) setMessage(`Gagal membuat pertemuan: ${error.message}`)
    else {
      const newMeeting = data as MeetingRecord
      setMeetings([newMeeting, ...meetings]); setSelectedMeetingId(newMeeting.id); setAttendance([])
      setMeetingForm({ title: '', meeting_date: localDateValue(), attendance_start: '', attendance_end: '', late_after_minutes: '15' })
      setMessage('Pertemuan berhasil dibuat. Aktifkan saat sesi absen dimulai.')
    }
    setSaving(false)
  }

  const handleToggleMeeting = async (meeting: MeetingRecord) => {
    if (!kelas) return
    setSaving(true); setMessage('')
    if (meeting.is_active) {
      const { error } = await supabase.from('meetings').update({ is_active: false }).eq('id', meeting.id).eq('class_id', kelas.id)
      if (error) setMessage(`Gagal menonaktifkan absen: ${error.message}`)
      else { setMeetings(meetings.map((item) => item.id === meeting.id ? { ...item, is_active: false } : item)); setMessage('Tombol absen mahasiswa dinonaktifkan.') }
      setSaving(false); return
    }
    const { error: resetError } = await supabase.from('meetings').update({ is_active: false }).eq('class_id', kelas.id)
    if (resetError) { setMessage(`Gagal mengatur pertemuan aktif: ${resetError.message}`); setSaving(false); return }
    const { error } = await supabase.from('meetings').update({ is_active: true }).eq('id', meeting.id).eq('class_id', kelas.id)
    if (error) setMessage(`Gagal mengaktifkan absen: ${error.message}`)
    else {
      setMeetings(meetings.map((item) => ({ ...item, is_active: item.id === meeting.id })))
      setSelectedMeetingId(meeting.id); await fetchAttendance(meeting.id); setMessage('Tombol absen aktif untuk pertemuan ini.')
    }
    setSaving(false)
  }

  const copyCode = async () => { if (!kelas) return; await navigator.clipboard.writeText(kelas.code); setCopied(true); setTimeout(() => setCopied(false), 1400) }

  const exportCsv = () => {
    if (!kelas || !selectedMeeting) return
    const header = ['Kelas', 'Pertemuan', 'Nama', 'NIM', 'Email', 'Status', 'Waktu Absen']
    const body = rows.map((row) => [
      kelas.course_name, meetingLabel(selectedMeeting), row.profile?.name ?? '-', row.profile?.nim ?? '-', row.profile?.email ?? '-',
      statusLabel(row.record?.status), row.record?.attended_at ? formatDateTime(row.record.attended_at) : '-',
    ])
    const csv = [header, ...body].map((line) => line.map(escapeCsvCell).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `absensi-${kelas.code}-${selectedMeeting.meeting_date}.csv`; link.click(); URL.revokeObjectURL(url)
  }

  if (initialLoading) return <div className="flex min-h-[70vh] items-center justify-center"><div className="animate-pulse rounded-xl bg-[var(--panel)] p-6">Memuat detail kelas...</div></div>
  if (accessDenied || !kelas) return <div className="mx-auto max-w-2xl px-5 py-20 text-center"><h1 className="text-3xl font-bold">Akses Ditolak</h1><p className="mt-2 text-[var(--muted)]">Kelas ini tidak tersedia untuk akun ini.</p><button onClick={() => router.push('/dosen/dashboard')} className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700">Kembali</button></div>

  return (
    <div className="mx-auto w-full max-w-8xl px-6 py-8">
      

      {/* Header Info Kelas */}
      <section id="ringkasan" className="scroll-mt-40 mb-8 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <p className="text-xs font-bold text-[var(--primary)] mb-2">Detail Kelas</p>
          <h1 className="text-3xl md:text-4xl font-bold">{kelas.course_name}</h1>
        </div>
        <button onClick={copyCode} className="rounded-xl border border-[var(--line)] bg-[var(--panel-muted)] px-6 py-4 text-center transition hover:bg-[var(--line)]">
          <p className="text-xs font-bold text-[var(--muted)] mb-1">Kode Kelas</p>
          <p className="text-2xl font-bold text-[var(--foreground)]">{copied ? 'Disalin!' : kelas.code}</p>
        </button>
      </section>

      

      <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
        <div className="space-y-8">
          {/* Pengaturan Kelas */}
          <section id="pengaturan-kelas" className="scroll-mt-40 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-6">
            <h2 className="text-xl font-bold mb-4">Pengaturan Kelas</h2>
            <form onSubmit={handleUpdateClass} className="flex flex-col gap-4">
              <label className="space-y-1.5 text-sm font-semibold">
                <span>Nama Mata Kuliah</span>
                <input type="text" required value={className} onChange={(e) => setClassName(e.target.value)} className="w-full rounded-xl border border-[var(--line)] bg-[var(--panel-muted)] px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20" />
              </label>
              <button type="submit" disabled={saving} className="rounded-xl bg-[var(--foreground)] px-4 py-3 font-bold text-[var(--background)] transition hover:opacity-80">Simpan Kelas</button>
            </form>
          </section>

          {/* Buat Pertemuan */}
          <section id="buat-pertemuan" className="scroll-mt-40 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-6">
            <h2 className="text-xl font-bold mb-4">Buat Pertemuan</h2>
            <form onSubmit={handleCreateMeeting} className="flex flex-col gap-4">
              <label className="space-y-1.5 text-sm font-semibold">
                <span>Judul (cth: Pertemuan 1)</span>
                <input type="text" required value={meetingForm.title} onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })} className="w-full rounded-xl border border-[var(--line)] bg-[var(--panel-muted)] px-4 py-3 outline-none" />
              </label>
              <label className="space-y-1.5 text-sm font-semibold">
                <span>Tanggal</span>
                <input type="date" required value={meetingForm.meeting_date} onChange={(e) => setMeetingForm({ ...meetingForm, meeting_date: e.target.value })} className="w-full rounded-xl border border-[var(--line)] bg-[var(--panel-muted)] px-4 py-3 outline-none" />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="space-y-1.5 text-sm font-semibold">
                  <span>Mulai Absen</span>
                  <input type="time" required value={meetingForm.attendance_start} onChange={(e) => setMeetingForm({ ...meetingForm, attendance_start: e.target.value })} className="w-full rounded-xl border border-[var(--line)] bg-[var(--panel-muted)] px-4 py-3 outline-none" />
                </label>
                <label className="space-y-1.5 text-sm font-semibold">
                  <span>Tutup Absen</span>
                  <input type="time" required value={meetingForm.attendance_end} onChange={(e) => setMeetingForm({ ...meetingForm, attendance_end: e.target.value })} className="w-full rounded-xl border border-[var(--line)] bg-[var(--panel-muted)] px-4 py-3 outline-none" />
                </label>
              </div>
              <label className="space-y-1.5 text-sm font-semibold">
                <span>Toleransi Keterlambatan (Menit)</span>
                <input type="number" min={0} required value={meetingForm.late_after_minutes} onChange={(e) => setMeetingForm({ ...meetingForm, late_after_minutes: e.target.value })} className="w-full rounded-xl border border-[var(--line)] bg-[var(--panel-muted)] px-4 py-3 outline-none" />
              </label>
              <button type="submit" disabled={saving} className="rounded-xl bg-blue-600 px-4 py-3.5 font-bold text-white transition hover:bg-blue-700">+ Tambah Pertemuan</button>
            </form>
            {message && <p className="mt-4 rounded-xl bg-blue-50 p-3 text-sm font-bold text-blue-700 border border-blue-200">{message}</p>}
          </section>
        </div>

        <div className="space-y-8">
          {/* Daftar Pertemuan */}
          <section id="daftar-pertemuan" className="scroll-mt-40 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-6">
            <h2 className="text-xl font-bold mb-4">Daftar Pertemuan</h2>
            <div className="space-y-3">
              {meetings.map((meeting) => (
                <div key={meeting.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-4 transition ${selectedMeetingId === meeting.id ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : 'border-[var(--line)] bg-[var(--panel-muted)]'}`}>
                  <div>
                    <h3 className="font-bold text-[var(--foreground)]">{meeting.title} <span className="text-sm font-normal text-[var(--muted)] ml-2">({formatDate(meeting.meeting_date)})</span></h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">{formatClock(meeting.attendance_start)} - {formatClock(meeting.attendance_end)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setSelectedMeetingId(meeting.id); fetchAttendance(meeting.id) }} className="rounded-lg bg-[var(--panel)] border border-[var(--line)] px-4 py-2 text-sm font-bold hover:bg-[var(--line)] transition">
                      Lihat Data
                    </button>
                    <button type="button" disabled={saving} onClick={() => handleToggleMeeting(meeting)} className={`rounded-lg px-4 py-2 text-sm font-bold text-white transition ${meeting.is_active ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
                      {meeting.is_active ? 'Matikan' : 'Aktifkan'}
                    </button>
                  </div>
                </div>
              ))}
              {meetings.length === 0 && <p className="text-center text-[var(--muted)] p-6">Belum ada pertemuan.</p>}
            </div>
          </section>

          {/* Tabel Rekap Data */}
          <section id="rekap-absen" className="scroll-mt-40 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-6 overflow-hidden flex flex-col">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-xl font-bold">{view === 'attendance' ? 'Rekap Absensi' : 'Data Mahasiswa'}</h2>
              <div className="flex flex-wrap gap-2 rounded-xl border border-[var(--line)] bg-[var(--panel-muted)] p-1">
                <button onClick={() => setView('attendance')} className={`rounded-lg px-4 py-2 text-sm font-bold transition ${view === 'attendance' ? 'bg-[var(--panel)] text-blue-600' : 'text-[var(--muted)]'}`}>Absensi</button>
                <button onClick={() => setView('students')} className={`rounded-lg px-4 py-2 text-sm font-bold transition ${view === 'students' ? 'bg-[var(--panel)] text-blue-600' : 'text-[var(--muted)]'}`}>Mahasiswa</button>
                {view === 'attendance' && selectedMeeting && (
                  <button onClick={exportCsv} className="rounded-lg bg-[var(--foreground)] text-[var(--background)] px-4 py-2 text-sm font-bold hover:opacity-80 transition">Export CSV</button>
                )}
              </div>
            </div>

            <div className="grid gap-3">
              {view === 'attendance' ? (
                selectedMeeting ? rows.map((row) => (
                  <article key={row.enrollment.id} className="rounded-xl border border-[var(--line)] bg-[var(--panel-muted)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><h3 className="truncate font-bold">{row.profile?.name ?? '-'}</h3><p className="mt-1 text-sm text-[var(--muted)]">NIM: {row.profile?.nim ?? '-'}</p></div>
                      <span className={`shrink-0 rounded-lg px-3 py-1 text-xs font-bold ${row.record?.status === 'present' ? 'bg-green-100 text-green-700' : row.record?.status === 'late' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                        {statusLabel(row.record?.status)}
                      </span>
                    </div>
                    <p className="mt-3 border-t border-[var(--line)] pt-3 text-sm text-[var(--muted)]">Waktu absen: <span className="font-medium text-[var(--foreground)]">{row.record ? formatDateTime(row.record.attended_at) : '-'}</span></p>
                  </article>
                )) : <p className="rounded-xl border border-dashed border-[var(--line)] p-8 text-center text-[var(--muted)]">Pilih pertemuan di atas.</p>
              ) : rows.length ? rows.map((row) => (
                <article key={row.enrollment.id} className="rounded-xl border border-[var(--line)] bg-[var(--panel-muted)] p-4">
                  <h3 className="font-bold">{row.profile?.name ?? '-'}</h3>
                  <dl className="mt-3 grid gap-3 border-t border-[var(--line)] pt-3 text-sm sm:grid-cols-2">
                    <div><dt className="text-[var(--muted)]">NIM</dt><dd className="mt-1 font-medium">{row.profile?.nim ?? '-'}</dd></div>
                    <div><dt className="text-[var(--muted)]">Email</dt><dd className="mt-1 break-all font-medium">{row.profile?.email ?? '-'}</dd></div>
                  </dl>
                </article>
              )) : <p className="rounded-xl border border-dashed border-[var(--line)] p-8 text-center text-[var(--muted)]">Belum ada mahasiswa.</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
