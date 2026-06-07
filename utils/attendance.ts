export type Role = "mahasiswa" | "dosen";
export type AttendanceStatus = "present" | "late";

export type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  role: Role | null;
  nim: string | null;
  nidn: string | null;
  created_at?: string | null;
};

export type ClassRecord = {
  id: string;
  teacher_id: string;
  course_name: string;
  code: string;
  attendance_start?: string | null;
  attendance_end?: string | null;
  late_after_minutes?: number | null;
  created_at?: string | null;
};

export type MeetingRecord = {
  id: string;
  class_id: string;
  title: string;
  meeting_date: string;
  attendance_start: string;
  attendance_end: string;
  late_after_minutes: number | null;
  is_active: boolean;
  created_at?: string | null;
};

export type EnrollmentRecord = {
  id: string;
  class_id: string;
  student_id: string;
  created_at?: string | null;
  classes?: ClassRecord | ClassRecord[] | null;
  profiles?: Profile | Profile[] | null;
};

export type AttendanceRecord = {
  id: string;
  class_id: string;
  meeting_id: string;
  student_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  attended_at: string;
  profiles?: Profile | Profile[] | null;
  meetings?: MeetingRecord | MeetingRecord[] | null;
};

export function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export function normalizeCode(value: string) {
  return value.trim().replace(/\s+/g, "").toUpperCase();
}

export function createClassCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let index = 0; index < 6; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return code;
}

export function localDateValue(date = new Date()) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatClock(value: string | null | undefined) {
  if (!value) return "-";
  return value.slice(0, 5);
}

export function statusLabel(status: AttendanceStatus | "absent" | null | undefined) {
  if (status === "present") return "Hadir";
  if (status === "late") return "Terlambat";
  return "Belum absen";
}

export function meetingLabel(meeting: Pick<MeetingRecord, "title" | "meeting_date"> | null | undefined) {
  if (!meeting) return "Belum ada pertemuan";
  return `${meeting.title} - ${formatDate(meeting.meeting_date)}`;
}

function timeToMinutes(value: string | null | undefined) {
  if (!value) return null;
  const [hour, minute] = value.split(":").map(Number);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return null;
  }

  return hour * 60 + minute;
}

export function attendanceWindow(kelas: Pick<ClassRecord, "attendance_start" | "attendance_end" | "late_after_minutes">, now = new Date()) {
  const start = timeToMinutes(kelas.attendance_start);
  const end = timeToMinutes(kelas.attendance_end);
  const current = now.getHours() * 60 + now.getMinutes();
  const lateAfter = Math.max(0, kelas.late_after_minutes ?? 15);

  if (start === null || end === null) {
    return {
      isOpen: false,
      isLate: false,
      label: "Jadwal belum lengkap",
      tone: "neutral" as const,
    };
  }

  if (current < start) {
    return {
      isOpen: false,
      isLate: false,
      label: "Belum dibuka",
      tone: "neutral" as const,
    };
  }

  if (current > end) {
    return {
      isOpen: false,
      isLate: false,
      label: "Sudah ditutup",
      tone: "danger" as const,
    };
  }

  const isLate = current > start + lateAfter;

  return {
    isOpen: true,
    isLate,
    label: isLate ? "Sesi terlambat" : "Sesi hadir",
    tone: isLate ? ("warning" as const) : ("success" as const),
  };
}

export function meetingWindow(meeting: Pick<MeetingRecord, "meeting_date" | "attendance_start" | "attendance_end" | "late_after_minutes" | "is_active">, now = new Date()) {
  if (!meeting.is_active) {
    return {
      isOpen: false,
      isLate: false,
      label: "Belum diaktifkan dosen",
      tone: "neutral" as const,
    };
  }

  const today = localDateValue(now);
  if (today < meeting.meeting_date) {
    return {
      isOpen: false,
      isLate: false,
      label: "Belum tanggal pertemuan",
      tone: "neutral" as const,
    };
  }

  if (today > meeting.meeting_date) {
    return {
      isOpen: false,
      isLate: false,
      label: "Pertemuan sudah selesai",
      tone: "danger" as const,
    };
  }

  return attendanceWindow(meeting, now);
}

export function escapeCsvCell(value: string | number | null | undefined) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}
