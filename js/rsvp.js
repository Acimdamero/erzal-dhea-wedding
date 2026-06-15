/**
 * RSVP / Konfirmasi Kehadiran — Supabase submit handler
 */
(function () {
  'use strict';

  const ATTENDANCE_LABELS = {
    hadir: 'Hadir',
    tidak_hadir: 'Tidak Hadir',
    ragu: 'Belum Pasti',
  };

  function getConfig() {
    return window.WEDDING_CONFIG || {};
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

  function getClient() {
    if (!window.supabase || !isConfigured()) return null;
    const cfg = getConfig();
    return window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  }

  function setNote(el, message, type) {
    if (!el) return;
    el.textContent = message;
    el.classList.remove('form-note--success', 'form-note--error', 'form-note--info');
    if (type) el.classList.add(`form-note--${type}`);
  }

  function init() {
    const form = document.getElementById('rsvpForm');
    const note = document.getElementById('rsvpNote');
    if (!form) return;

    if (!isConfigured()) {
      setNote(
        note,
        'Mode demo — konfirmasi belum tersimpan. Hubungi penyelenggara untuk mengaktifkan database.',
        'info'
      );
      console.warn('[RSVP] Supabase belum dikonfigurasi. Isi js/config.js dengan URL dan anon key.');
    }

    let submitting = false;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (submitting) return;

      const name = document.getElementById('rsvpName')?.value.trim();
      const phone = document.getElementById('rsvpPhone')?.value.trim() || null;
      const attendance = document.getElementById('rsvpAttendance')?.value;
      const guestCount = parseInt(document.getElementById('rsvpGuests')?.value, 10) || 1;
      const message = document.getElementById('rsvpMessage')?.value.trim() || null;
      const submitBtn = form.querySelector('button[type="submit"]');

      if (!name) {
        setNote(note, 'Mohon isi nama lengkap Anda.', 'error');
        document.getElementById('rsvpName')?.focus();
        return;
      }

      if (!attendance) {
        setNote(note, 'Mohon pilih konfirmasi kehadiran.', 'error');
        document.getElementById('rsvpAttendance')?.focus();
        return;
      }

      if (guestCount < 1 || guestCount > 5) {
        setNote(note, 'Jumlah tamu harus antara 1 dan 5.', 'error');
        return;
      }

      if (!isConfigured()) {
        const label = ATTENDANCE_LABELS[attendance] || attendance;
        setNote(
          note,
          `Terima kasih, ${name}! Konfirmasi: ${label}. (Demo — data tidak disimpan)`,
          'info'
        );
        form.reset();
        return;
      }

      const client = getClient();
      if (!client) {
        setNote(note, 'Layanan belum siap. Silakan coba lagi nanti.', 'error');
        return;
      }

      submitting = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.originalText = submitBtn.textContent;
        submitBtn.textContent = 'Mengirim...';
      }
      setNote(note, 'Mengirim konfirmasi...', 'info');

      try {
        const cfg = getConfig();
        const { error } = await client.from('rsvp_responses').insert({
          name,
          phone,
          attendance,
          guest_count: guestCount,
          message,
          event_type: 'resepsi',
          wedding_slug: cfg.slug || 'erzal-dhea',
        });

        if (error) throw error;

        const label = ATTENDANCE_LABELS[attendance] || attendance;
        setNote(
          note,
          `Terima kasih, ${name}! Konfirmasi kehadiran (${label}) berhasil dikirim.`,
          'success'
        );
        form.reset();
      } catch (err) {
        console.error('[RSVP]', err);
        setNote(
          note,
          'Gagal mengirim konfirmasi. Periksa koneksi internet dan coba lagi.',
          'error'
        );
      } finally {
        submitting = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = submitBtn.dataset.originalText || 'Kirim Konfirmasi / Submit';
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
