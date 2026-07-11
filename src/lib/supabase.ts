/**
 * SIKANDA tidak mengakses Supabase langsung dari browser.
 *
 * Berkas netral ini sengaja dipertahankan agar import ZIP secara overlay
 * menimpa salinan lama yang pernah mengimpor `@supabase/supabase-js` dan
 * menyebabkan GitHub Actions gagal. Seluruh akses database harus melalui
 * backend Google Apps Script di `src/services/backendClient.ts`.
 */
export {};
