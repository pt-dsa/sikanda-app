import fs from "node:fs";
import { employmentAgendaPolicy } from "../src/lib/employmentStatus";
import { buildPenjagaanEvents } from "../src/lib/penjagaan";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Gagal: ${message}`);
}

const paruhWaktu = {
  nip: "199201242025211086",
  nama: "Pegawai Paruh Waktu",
  status: "PPPK",
  kategori_pppk: "paruh_waktu",
  tgl_mulai_golongan: "2025-10-01",
  tgl_kgb: "2027-10-01",
  tgl_pangkat: "2029-10-01",
  tgl_pensiun: "2050-01-24",
};
const penuhWaktu = { ...paruhWaktu, kategori_pppk: "penuh_waktu" };
const asn = { ...paruhWaktu, status: "ASN", kategori_pppk: "" };

const policyParuh = employmentAgendaPolicy(paruhWaktu as any);
assert(!policyParuh.hasAgenda && !policyParuh.kgb && !policyParuh.pangkat && !policyParuh.bup, "PPPK Paruh Waktu harus memiliki nol hak agenda");
assert(buildPenjagaanEvents([paruhWaktu]).length === 0, "PPPK Paruh Waktu tidak boleh masuk Buku Penjagaan");
assert(employmentAgendaPolicy(penuhWaktu as any).kgb && !employmentAgendaPolicy(penuhWaktu as any).pangkat, "PPPK Penuh Waktu hanya memperoleh KGB");
assert(employmentAgendaPolicy(asn as any).hasAgenda && employmentAgendaPolicy(asn as any).bup, "ASN tetap memperoleh seluruh agenda");

const read = (path: string) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const modal = read("src/components/ui/PegawaiDetailModal.tsx");
const shell = read("src/components/layout/AppShell.tsx");
const backend = read("apps-script/Code.gs");
const metadata = read("metadata.json");

assert(modal.includes("employmentAgendaPolicy") && modal.includes("Tidak memiliki agenda Buku Penjagaan"), "Modal profil harus mengikuti kebijakan agenda pusat dan menjelaskan status tanpa agenda");
assert(modal.includes("agendaPolicy.kgb") && modal.includes("agendaPolicy.pangkat") && modal.includes("agendaPolicy.bup"), "Kartu agenda profil harus dirender per hak status");
assert(shell.includes("PegawaiAvatar") && shell.includes("foto: res.foto") && shell.includes("foto_nip: res.photo_nip"), "Header harus memakai foto pegawai dari sesi terverifikasi");
assert(backend.includes("function actorEmployeeIdentity_") && backend.includes("foto_storage_path") && backend.includes("signedEmployeePhotoUrls_"), "Backend login harus mengambil foto private pegawai secara aman");
assert(backend.includes("&email=eq.") && backend.includes("email berasal dari Firebase yang sudah diverifikasi"), "Pencarian foto berdasarkan email hanya boleh menjadi fallback identitas terverifikasi");
assert(backend.includes("version: '1.1.13-secure'") && metadata.includes("V1.1.13 Secure"), "Versi frontend dan backend harus konsisten V1.1.13");

console.log("revision-v1112-tests: OK");
