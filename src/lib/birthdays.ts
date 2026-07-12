import type { Pegawai } from "@/types";
import { parseAnyDate } from "@/lib/utils";

export interface BirthdayReminder {
  nip: string;
  nama: string;
  jabatan: string;
  tanggal: string;
  daysUntil: number;
}

const DAY_MS = 86_400_000;

function localDateKey(date: Date): string {
  return `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
}

function birthdayInYear(birth: Date, year: number): Date {
  const month = birth.getMonth();
  const day = Math.min(birth.getDate(), new Date(year, month + 1, 0).getDate());
  return new Date(year, month, day, 0, 0, 0, 0);
}

function jakartaReferenceDate(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const values: Record<string, number> = {};
  parts.forEach((part) => { if (part.type !== "literal") values[part.type] = Number(part.value); });
  return new Date(values.year, values.month - 1, values.day);
}

export function buildUpcomingBirthdays(employees: Pegawai[], daysAhead = 7, reference?: Date): BirthdayReminder[] {
  reference = reference || jakartaReferenceDate();
  const today = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
  const ceiling = new Date(today.getTime() + Math.max(0, daysAhead) * DAY_MS);
  const result: BirthdayReminder[] = [];

  for (const employee of employees) {
    const birth = parseAnyDate(employee.tgl_lahir);
    if (!birth) continue;
    let upcoming = birthdayInYear(birth, today.getFullYear());
    if (upcoming < today) upcoming = birthdayInYear(birth, today.getFullYear() + 1);
    if (upcoming > ceiling) continue;
    result.push({
      nip: String(employee.nip || ""),
      nama: String(employee.nama || "").trim(),
      jabatan: String(employee.jabatan || "").trim(),
      tanggal: localDateKey(upcoming),
      daysUntil: Math.round((upcoming.getTime() - today.getTime()) / DAY_MS),
    });
  }

  return result.sort((a, b) => a.daysUntil - b.daysUntil || a.nama.localeCompare(b.nama, "id"));
}

export function birthdayTimeLabel(reminder: BirthdayReminder): string {
  if (reminder.daysUntil === 0) return "Hari ini";
  if (reminder.daysUntil === 1) return "Besok";
  return `${reminder.daysUntil} hari lagi`;
}
