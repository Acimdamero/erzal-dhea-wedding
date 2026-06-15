/**
 * Admin dashboard — Supabase Auth + reporting
 */
(function () {
  'use strict';

  const ATTENDANCE_LABELS = {
    hadir: 'Hadir',
    tidak_hadir: 'Tidak Hadir',
    ragu: 'Belum Pasti',
  };

  function getConfig() {
    return window.ADMIN_CONFIG || {};
  }

  function isConfigured() {
    const cfg = getConfig();
    return Boolean(
      cfg.supabaseUrl &&
        cfg.supabaseAnonKey &&
        cfg.supabaseUrl !== 'YOUR_SUPABASE_URL' &&
        cfg.supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY'
    );
  }

  let supabaseClient = null;

  function getClient() {
    if (!window.supabase || !isConfigured()) return null;
    if (!supabaseClient) {
      const cfg = getConfig();
      supabaseClient = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    }
    return supabaseClient;
  }

  async function signIn(email, password) {
    const client = getClient();
    if (!client) throw new Error('Supabase belum dikonfigurasi.');
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw new Error('Email atau kata sandi salah.');
  }

  async function signOut() {
    const client = getClient();
    if (client) await client.auth.signOut();
  }

  async function getSession() {
    const client = getClient();
    if (!client) return null;
    const { data } = await client.auth.getSession();
    return data.session;
  }

  async function requireAuth(redirectTo) {
    if (!isConfigured()) {
      window.location.href = redirectTo || 'index.html';
      return false;
    }
    const session = await getSession();
    if (!session) {
      window.location.href = redirectTo || 'index.html';
      return false;
    }
    return true;
  }

  async function requireGuest(redirectTo) {
    if (!isConfigured()) return;
    const session = await getSession();
    if (session) window.location.href = redirectTo || 'dashboard.html';
  }

  function formatDateTime(iso) {
    return new Date(iso).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function escapeCsv(value) {
    const str = value == null ? '' : String(value);
    if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  }

  function downloadCsv(filename, rows) {
    const blob = new Blob(['\ufeff' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  window.AdminApp = {
    isConfigured,
    signIn,
    signOut,
    getSession,
    requireAuth,
    requireGuest,
    getClient,
  };

  window.AdminDashboard = {
    allRsvps: [],
    allWishes: [],

    async init() {
      const ok = await requireAuth('index.html');
      if (!ok) return;

      document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        await signOut();
        window.location.href = 'index.html';
      });

      document.getElementById('refreshBtn')?.addEventListener('click', () => this.loadData());
      document.getElementById('printBtn')?.addEventListener('click', () => window.print());
      document.getElementById('exportRsvpBtn')?.addEventListener('click', () => this.exportRsvp());
      document.getElementById('exportWishesBtn')?.addEventListener('click', () => this.exportWishes());
      document.getElementById('clearFiltersBtn')?.addEventListener('click', () => this.clearFilters());

      ['filterAttendance', 'filterDateFrom', 'filterDateTo'].forEach((id) => {
        document.getElementById(id)?.addEventListener('change', () => this.render());
      });

      await this.loadData();
    },

    showAlert(message, type) {
      const el = document.getElementById('pageAlert');
      if (!el) return;
      el.hidden = false;
      el.className = `alert alert--${type || 'error'}`;
      el.textContent = message;
    },

    hideAlert() {
      const el = document.getElementById('pageAlert');
      if (el) el.hidden = true;
    },

    async loadData() {
      const client = getClient();
      if (!client) {
        this.showAlert('Supabase belum dikonfigurasi.', 'error');
        return;
      }

      this.hideAlert();
      this.setLoading(true);

      const cfg = getConfig();
      const slug = cfg.slug || 'erzal-dhea';

      try {
        const [rsvpRes, wishesRes] = await Promise.all([
          client
            .from('rsvp_responses')
            .select('*')
            .eq('wedding_slug', slug)
            .order('created_at', { ascending: false }),
          client
            .from('wishes')
            .select('*')
            .eq('wedding_slug', slug)
            .order('created_at', { ascending: false }),
        ]);

        if (rsvpRes.error) throw rsvpRes.error;
        if (wishesRes.error) throw wishesRes.error;

        this.allRsvps = rsvpRes.data || [];
        this.allWishes = wishesRes.data || [];
        this.render();

        const updated = document.getElementById('lastUpdated');
        if (updated) updated.textContent = formatDateTime(new Date().toISOString());
      } catch (err) {
        console.error('[Admin]', err);
        this.showAlert('Gagal memuat data. Pastikan Anda sudah login dan RLS sudah dikonfigurasi.', 'error');
      } finally {
        this.setLoading(false);
      }
    },

    setLoading(loading) {
      ['rsvpLoading', 'wishesLoading'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.hidden = !loading;
      });
      if (loading) {
        document.getElementById('rsvpTable')?.setAttribute('hidden', '');
        document.getElementById('wishesTable')?.setAttribute('hidden', '');
      }
    },

    getFilteredRsvps() {
      const attendance = document.getElementById('filterAttendance')?.value || '';
      const dateFrom = document.getElementById('filterDateFrom')?.value || '';
      const dateTo = document.getElementById('filterDateTo')?.value || '';

      return this.allRsvps.filter((row) => {
        if (attendance && row.attendance !== attendance) return false;
        const created = row.created_at?.slice(0, 10);
        if (dateFrom && created < dateFrom) return false;
        if (dateTo && created > dateTo) return false;
        return true;
      });
    },

    getFilteredWishes() {
      const dateFrom = document.getElementById('filterDateFrom')?.value || '';
      const dateTo = document.getElementById('filterDateTo')?.value || '';

      return this.allWishes.filter((row) => {
        const created = row.created_at?.slice(0, 10);
        if (dateFrom && created < dateFrom) return false;
        if (dateTo && created > dateTo) return false;
        return true;
      });
    },

    render() {
      const rsvps = this.getFilteredRsvps();
      const wishes = this.getFilteredWishes();

      const hadir = rsvps.filter((r) => r.attendance === 'hadir');
      const tidak = rsvps.filter((r) => r.attendance === 'tidak_hadir');
      const ragu = rsvps.filter((r) => r.attendance === 'ragu');
      const guestTotal = hadir.reduce((sum, r) => sum + (r.guest_count || 1), 0);

      document.getElementById('sumTotal').textContent = rsvps.length;
      document.getElementById('sumHadir').textContent = hadir.length;
      document.getElementById('sumTidak').textContent = tidak.length;
      document.getElementById('sumRagu').textContent = ragu.length;
      document.getElementById('sumGuests').textContent = guestTotal;
      document.getElementById('sumWishes').textContent = wishes.length;

      this.renderRsvpTable(rsvps);
      this.renderWishesTable(wishes);
    },

    renderRsvpTable(rows) {
      const table = document.getElementById('rsvpTable');
      const body = document.getElementById('rsvpBody');
      const empty = document.getElementById('rsvpEmpty');
      if (!body) return;

      body.innerHTML = '';

      if (!rows.length) {
        table?.setAttribute('hidden', '');
        if (empty) empty.hidden = false;
        return;
      }

      if (empty) empty.hidden = true;
      table?.removeAttribute('hidden');

      rows.forEach((row) => {
        const tr = document.createElement('tr');
        const badgeClass = `badge badge--${row.attendance}`;
        const label = ATTENDANCE_LABELS[row.attendance] || row.attendance;
        tr.innerHTML = `
          <td>${formatDateTime(row.created_at)}</td>
          <td>${this.escapeHtml(row.name)}</td>
          <td>${this.escapeHtml(row.phone || '—')}</td>
          <td><span class="${badgeClass}">${label}</span></td>
          <td>${row.guest_count ?? 1}</td>
          <td>${this.escapeHtml(row.message || '—')}</td>
        `;
        body.appendChild(tr);
      });
    },

    renderWishesTable(rows) {
      const table = document.getElementById('wishesTable');
      const body = document.getElementById('wishesBody');
      const empty = document.getElementById('wishesEmpty');
      if (!body) return;

      body.innerHTML = '';

      if (!rows.length) {
        table?.setAttribute('hidden', '');
        if (empty) empty.hidden = false;
        return;
      }

      if (empty) empty.hidden = true;
      table?.removeAttribute('hidden');

      rows.forEach((row) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${formatDateTime(row.created_at)}</td>
          <td>${this.escapeHtml(row.name)}</td>
          <td>${this.escapeHtml(row.message)}</td>
        `;
        body.appendChild(tr);
      });
    },

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },

    clearFilters() {
      const attendance = document.getElementById('filterAttendance');
      const from = document.getElementById('filterDateFrom');
      const to = document.getElementById('filterDateTo');
      if (attendance) attendance.value = '';
      if (from) from.value = '';
      if (to) to.value = '';
      this.render();
    },

    exportRsvp() {
      const rows = this.getFilteredRsvps();
      const header = ['Tanggal', 'Nama', 'HP', 'Kehadiran', 'Jumlah Tamu', 'Pesan'];
      const lines = [
        header.map(escapeCsv).join(','),
        ...rows.map((r) =>
          [
            formatDateTime(r.created_at),
            r.name,
            r.phone || '',
            ATTENDANCE_LABELS[r.attendance] || r.attendance,
            r.guest_count ?? 1,
            r.message || '',
          ]
            .map(escapeCsv)
            .join(',')
        ),
      ];
      downloadCsv(`rsvp-erzal-dhea-${new Date().toISOString().slice(0, 10)}.csv`, lines);
    },

    exportWishes() {
      const rows = this.getFilteredWishes();
      const header = ['Tanggal', 'Nama', 'Ucapan'];
      const lines = [
        header.map(escapeCsv).join(','),
        ...rows.map((w) =>
          [formatDateTime(w.created_at), w.name, w.message].map(escapeCsv).join(',')
        ),
      ];
      downloadCsv(`ucapan-erzal-dhea-${new Date().toISOString().slice(0, 10)}.csv`, lines);
    },
  };
})();
