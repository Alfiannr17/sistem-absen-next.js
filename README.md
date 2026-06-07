# Sistem Absensi Kampus

Aplikasi absensi berbasis Next.js dan Supabase untuk dua role:

- Mahasiswa: register, login, gabung kelas memakai kode, absen satu klik, melihat riwayat.
- Dosen: register, login, membuat kode kelas, membuat pertemuan, mengaktifkan tombol absen per pertemuan, melihat rekap absensi dan data mahasiswa.

## Menjalankan Project

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Setup Supabase

1. Buat project Supabase.
2. Jalankan isi file `supabase-schema.sql` di Supabase SQL Editor. Jalankan ulang file ini jika sebelumnya masih memakai schema lama, karena ada tabel `meetings` dan GRANT permission baru.
3. Isi file `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Rute Utama

- `/register` untuk daftar mahasiswa atau dosen.
- `/login` untuk masuk.
- `/dosen/dashboard` untuk ringkasan dan membuat kelas.
- `/dosen/kelas` untuk mengelola seluruh kelas.
- `/dosen/jadwal` untuk melihat agenda pertemuan.
- `/dosen/rekap` untuk melihat dan mengunduh rekap keseluruhan.
- `/dosen/profile` untuk mengelola profil dosen.
- `/mahasiswa/dashboard` untuk ringkasan dan bergabung ke kelas.
- `/mahasiswa/kelas` untuk mengakses seluruh kelas yang diikuti.
- `/mahasiswa/jadwal` untuk melihat agenda kuliah mendatang.
- `/mahasiswa/riwayat` untuk melihat catatan kehadiran.
- `/mahasiswa/profile` untuk mengelola profil mahasiswa.

Portal dosen dan mahasiswa memakai sidebar pada desktop serta bottom navigation pada perangkat mobile.

## Alur Absensi

1. Dosen membuat kelas dan membagikan kode kelas.
2. Mahasiswa bergabung ke kelas memakai kode tersebut.
3. Dosen membuka detail kelas, membuat pertemuan, lalu menekan `Aktifkan`.
4. Mahasiswa membuka kelas dan klik tombol hadir saat pertemuan aktif dan jam absen berjalan.
5. Dosen melihat rekap per pertemuan dan data mahasiswa per kelas.
