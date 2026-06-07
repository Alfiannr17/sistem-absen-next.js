'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { escapeCsvCell, type AttendanceRecord, type ClassRecord, type EnrollmentRecord, type MeetingRecord } from '@/utils/attendance'
import { Icon } from '@/app/components/icons'
import { EmptyState, LoadingState, PageHeader, StatCard } from '@/app/components/ui'

export default function DosenRekapPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState<ClassRecord[]>([])
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([])
  const [meetings, setMeetings] = useState<MeetingRecord[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])

  useEffect(() => {
    const run = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.replace('/login')
      const { data: classData } = await supabase.from('classes').select('*').eq('teacher_id', user.id).order('course_name')
      const rows = (classData ?? []) as ClassRecord[]
      setClasses(rows)
      const ids = rows.map((item) => item.id)
      if (ids.length) {
        const [{ data: enrollmentData }, { data: meetingData }, { data: attendanceData }] = await Promise.all([
          supabase.from('enrollments').select('id, class_id, student_id').in('class_id', ids),
          supabase.from('meetings').select('*').in('class_id', ids),
          supabase.from('attendance').select('*').in('class_id', ids),
        ])
        setEnrollments((enrollmentData ?? []) as EnrollmentRecord[])
        setMeetings((meetingData ?? []) as MeetingRecord[])
        setAttendance((attendanceData ?? []) as AttendanceRecord[])
      }
      setLoading(false)
    }
    run()
  }, [router, supabase])

  const summaries = useMemo(() => classes.map((kelas) => {
    const classStudents = enrollments.filter((item) => item.class_id === kelas.id).length
    const classMeetings = meetings.filter((item) => item.class_id === kelas.id).length
    const records = attendance.filter((item) => item.class_id === kelas.id)
    const present = records.filter((item) => item.status === 'present').length
    const late = records.filter((item) => item.status === 'late').length
    const capacity = classStudents * classMeetings
    return { kelas, students: classStudents, meetings: classMeetings, present, late, rate: capacity ? Math.round((records.length / capacity) * 100) : 0 }
  }), [attendance, classes, enrollments, meetings])

  const exportSummary = () => {
    const header = ['Mata Kuliah', 'Kode', 'Mahasiswa', 'Pertemuan', 'Hadir', 'Terlambat', 'Tingkat Kehadiran']
    const body = summaries.map((item) => [item.kelas.course_name, item.kelas.code, item.students, item.meetings, item.present, item.late, `${item.rate}%`])
    const csv = [header, ...body].map((row) => row.map(escapeCsvCell).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a'); link.href = url; link.download = 'rekap-absensi-keseluruhan.csv'; link.click(); URL.revokeObjectURL(url)
  }

  if (loading) return <LoadingState label="Menghitung rekap absensi..." />

  return (
    <div className="mx-auto max-w-8xl space-y-6 px-6 py-8 sm:px-7 lg:px-6 lg:py-8">
      
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:p-7">
          <div><h2 className="text-xl font-bold text-slate-950">Performa per kelas</h2><p className="mt-1 text-sm font-medium text-slate-500">Persentase dihitung dari seluruh peluang kehadiran.</p></div>
          <button onClick={exportSummary} disabled={!summaries.length} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-600 disabled:opacity-40"><Icon name="download" className="h-4 w-4" />Export CSV</button>
        </div>
        {summaries.length ? (
          <>
            <div className="grid gap-3 p-4 xl:hidden">
              {summaries.map((item) => (
                <article key={item.kelas.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><h3 className="truncate font-bold text-slate-900">{item.kelas.course_name}</h3><p className="mt-1 text-xs font-bold text-blue-600">{item.kelas.code}</p></div>
                    <span className="rounded-lg bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">{item.rate}%</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <div><p className="text-slate-500">Mahasiswa</p><p className="mt-1 font-bold">{item.students}</p></div>
                    <div><p className="text-slate-500">Pertemuan</p><p className="mt-1 font-bold">{item.meetings}</p></div>
                    <div><p className="text-slate-500">Hadir</p><p className="mt-1 font-bold text-emerald-600">{item.present}</p></div>
                    <div><p className="text-slate-500">Terlambat</p><p className="mt-1 font-bold text-amber-600">{item.late}</p></div>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-xl bg-slate-200"><div className="h-full rounded-xl bg-blue-600" style={{ width: `${item.rate}%` }} /></div>
                  <Link href={`/dosen/kelas/${item.kelas.id}#rekap-absen`} className="mt-4 flex items-center justify-center gap-1 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-bold text-blue-600">Lihat detail <Icon name="arrow" className="h-4 w-4" /></Link>
                </article>
              ))}
            </div>
            <div className="hidden xl:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold text-slate-400"><tr><th className="px-6 py-4">Mata kuliah</th><th className="px-4 py-4">Mahasiswa</th><th className="px-4 py-4">Pertemuan</th><th className="px-4 py-4">Hadir</th><th className="px-4 py-4">Terlambat</th><th className="px-4 py-4">Kehadiran</th><th className="px-6 py-4 text-right">Aksi</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {summaries.map((item) => <tr key={item.kelas.id} className="transition hover:bg-slate-50/70"><td className="px-6 py-5"><p className="font-bold text-slate-900">{item.kelas.course_name}</p><p className="mt-1 text-xs font-bold text-blue-600">{item.kelas.code}</p></td><td className="px-4 py-5 font-bold text-slate-600">{item.students}</td><td className="px-4 py-5 font-bold text-slate-600">{item.meetings}</td><td className="px-4 py-5 font-bold text-emerald-600">{item.present}</td><td className="px-4 py-5 font-bold text-amber-600">{item.late}</td><td className="px-4 py-5"><div className="flex items-center gap-3"><div className="h-2 w-24 overflow-hidden rounded-xl bg-slate-100"><div className="h-full rounded-xl bg-blue-600" style={{ width: `${item.rate}%` }} /></div><span className="font-bold text-slate-700">{item.rate}%</span></div></td><td className="px-6 py-5 text-right"><Link href={`/dosen/kelas/${item.kelas.id}#rekap-absen`} className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800">Detail <Icon name="arrow" className="h-4 w-4" /></Link></td></tr>)}
              </tbody>
            </table>
            </div>
          </>
        ) : <div className="p-6"><EmptyState icon="trend" title="Belum ada data rekap" description="Data akan terisi setelah kelas, pertemuan, dan absensi mulai digunakan." /></div>}
      </section>
    </div>
  )
}
