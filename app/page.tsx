import Link from 'next/link'
import { BrandMark, Icon, type IconName } from './components/icons'

const features: { icon: IconName; title: string; description: string; tone: string }[] = [
  { icon: 'book', title: 'Manajemen kelas', description: 'Buat ruang kelas digital, bagikan kode unik, dan kelola mahasiswa dengan lebih teratur.', tone: 'border-blue-100 bg-blue-50 text-blue-700' },
  { icon: 'calendar', title: 'Jadwal pertemuan', description: 'Atur tanggal, jam mulai, jam selesai, serta toleransi keterlambatan untuk setiap sesi.', tone: 'border-violet-100 bg-violet-50 text-violet-700' },
  { icon: 'check', title: 'Absensi satu klik', description: 'Mahasiswa dapat mencatat kehadiran secara cepat saat sesi absensi sedang dibuka.', tone: 'border-emerald-100 bg-emerald-50 text-emerald-700' },
  { icon: 'trend', title: 'Rekap real-time', description: 'Dosen memperoleh ringkasan hadir, terlambat, dan belum absen pada setiap pertemuan.', tone: 'border-amber-100 bg-amber-50 text-amber-700' },
]

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-950">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-7">
          <Link href="/" className="flex items-center gap-3">
            <BrandMark />
            <div><p className="text-lg font-bold">Sistem Absensi</p><p className="text-[10px] font-bold text-slate-400">Academic attendance</p></div>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-bold text-slate-500 md:flex">
            <a href="#fitur" className="transition hover:text-blue-600">Fitur</a>
            <a href="#alur" className="transition hover:text-blue-600">Cara kerja</a>
            <Link href="/login" className="transition hover:text-blue-600">Masuk</Link>
          </nav>
          <Link href="/register" className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-600 sm:px-5">Mulai sekarang</Link>
        </div>
      </header>

      <section className="grid-pattern relative pt-20">
        <div className="pointer-events-none absolute left-1/2 top-10 h-[520px] w-[700px] -translate-x-1/2 rounded-xl bg-blue-200/30 blur-[110px]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-20 sm:px-7 sm:pt-28 lg:grid-cols-[1.05fr_0.95fr] lg:pb-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700"><Icon name="spark" className="h-4 w-4" />Platform absensi kampus modern</span>
            <h1 className="mt-7 max-w-3xl text-5xl font-bold leading-[1.03] text-slate-950 sm:text-6xl lg:text-7xl">Kehadiran lebih tertib, kelas lebih <span className="text-blue-600">terkendali.</span></h1>
            <p className="mt-6 max-w-2xl text-base font-medium leading-8 text-slate-500 sm:text-lg">Hadirin membantu dosen dan mahasiswa mengelola absensi, jadwal pertemuan, serta rekap kehadiran dalam satu portal yang cepat dan transparan.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-sm font-bold text-white transition-colors hover:bg-blue-700">Buat akun gratis <Icon name="arrow" className="h-4 w-4" /></Link>
              <Link href="/login" className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:text-blue-600">Masuk ke portal</Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold text-slate-500">
              {['Portal dosen & mahasiswa', 'Rekap otomatis', 'Responsif di semua perangkat'].map((item) => <span key={item} className="flex items-center gap-2"><Icon name="check" className="h-4 w-4 text-emerald-600" />{item}</span>)}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
              <div className="rounded-xl bg-slate-950 p-5 text-white sm:p-7">
                <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold text-blue-300">Ringkasan hari ini</p><h2 className="mt-2 text-2xl font-bold">Aktivitas perkuliahan</h2></div><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10"><Icon name="activity" className="h-5 w-5 text-emerald-300" /></span></div>
                <div className="mt-7 grid grid-cols-3 gap-3">
                  {[['6', 'Kelas'], ['4', 'Sesi aktif'], ['92%', 'Hadir']].map(([value, label]) => <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4"><p className="text-xl font-bold sm:text-2xl">{value}</p><p className="mt-1 text-[10px] font-bold text-slate-400">{label}</p></div>)}
                </div>
              </div>
              <div className="space-y-3 p-2 pt-4 sm:p-3 sm:pt-5">
                {[['Pemrograman Web', 'Pertemuan 8', '08:00 - 09:40', true], ['Basis Data', 'Pertemuan 6', '10:00 - 11:40', false], ['Kecerdasan Buatan', 'Pertemuan 4', '13:00 - 14:40', false]].map(([course, meeting, time, active]) => <div key={String(course)} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:p-4"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-blue-600'}`}><Icon name={active ? 'activity' : 'calendar'} className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{course}</p><p className="mt-0.5 text-xs font-semibold text-slate-400">{meeting} - {time}</p></div>{active && <span className="rounded-xl bg-emerald-100 px-2.5 py-1 text-[9px] font-bold text-emerald-700">AKTIF</span>}</div>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="fitur" className="border-y border-slate-100 bg-slate-50/70 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-7">
          <div className="max-w-2xl"><p className="text-xs font-bold text-blue-600">Fitur utama</p><h2 className="mt-3 text-3xl font-bold sm:text-4xl">Semua yang dibutuhkan untuk absensi profesional.</h2><p className="mt-4 text-base font-medium leading-7 text-slate-500">Dirancang sederhana untuk dipakai setiap hari, namun tetap lengkap untuk kebutuhan akademik.</p></div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => <article key={feature.title} className="rounded-xl border border-slate-200 bg-white p-6 transition-colors hover:border-blue-200 hover:bg-blue-50/20"><span className={`flex h-12 w-12 items-center justify-center rounded-xl border ${feature.tone}`}><Icon name={feature.icon} className="h-6 w-6" /></span><h3 className="mt-6 text-lg font-bold">{feature.title}</h3><p className="mt-2 text-sm font-medium leading-6 text-slate-500">{feature.description}</p></article>)}
          </div>
        </div>
      </section>

      <section id="alur" className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-7">
          <div className="rounded-xl bg-slate-950 p-7 text-white sm:p-12">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div><p className="text-xs font-bold text-blue-300">Alur sederhana</p><h2 className="mt-3 text-3xl font-bold sm:text-4xl">Mulai dalam tiga langkah.</h2><p className="mt-4 text-sm font-medium leading-7 text-slate-400">Tidak perlu proses panjang. Buat kelas, bagikan kode, dan mulai catat kehadiran.</p></div>
              <div className="grid gap-3 sm:grid-cols-3">
                {['Dosen membuat kelas dan jadwal', 'Mahasiswa bergabung memakai kode', 'Absensi dan rekap tersimpan otomatis'].map((item, index) => <div key={item} className="rounded-xl border border-white/10 bg-white/5 p-5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold">{index + 1}</span><p className="mt-5 text-sm font-bold leading-6 text-slate-200">{item}</p></div>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 text-sm font-semibold text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-7"><span>Hadirin - Sistem Absensi Kampus</span><span>Dibangun untuk pengalaman akademik yang lebih baik.</span></div>
      </footer>
    </main>
  )
}
