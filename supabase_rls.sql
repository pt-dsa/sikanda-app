-- ============================================================================
-- SIKANDA — Public-safe RLS baseline
-- ============================================================================
-- Frontend publik TIDAK lagi mengakses Supabase langsung. Seluruh akses data
-- berjalan melalui Apps Script yang memverifikasi Firebase idToken dan memakai
-- SUPABASE_SERVICE_ROLE_KEY di Script Properties.
--
-- Karena itu, anon role tidak diberi policy SELECT/INSERT/UPDATE/DELETE.
-- service_role tetap dapat mengakses data untuk backend server-side.
-- ============================================================================

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'pegawai',
    'assets_vehicle',
    'assets_equipment',
    'assets_inventory',
    'asset_locations',
    'vehicle_budget',
    'maintenance',
    'loans',
    'system_config',
    'app_access'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'sikanda_select_' || t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'sikanda_insert_' || t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'sikanda_update_' || t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'sikanda_delete_' || t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'sikanda_anon_deny_' || t, t);

    -- Policy dokumentatif: anon tetap tidak boleh membaca/menulis.
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO anon USING (false) WITH CHECK (false)', 'sikanda_anon_deny_' || t, t);
  END LOOP;
END $$;
