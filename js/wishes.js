/**
 * Wishes / Buku Tamu — Supabase submit handler
 */
(function () {
  'use strict';

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

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatDate(date) {
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  function createWishCard(name, message, date) {
    const card = document.createElement('article');
    card.className = 'wish-card glass reveal visible';
    const isoDate = date.toISOString().split('T')[0];
    card.innerHTML = `
      <div class="wish-card__avatar" aria-hidden="true">${escapeHtml(name.charAt(0).toUpperCase())}</div>
      <div class="wish-card__body">
        <h4>${escapeHtml(name)}</h4>
        <p>${escapeHtml(message)}</p>
        <time datetime="${isoDate}">${formatDate(date)}</time>
      </div>
    `;
    return card;
  }

  function isTestEntry(name) {
    const n = (name || '').trim();
    return /^(reviewtest|rlstest|setup\s*test)$/i.test(n);
  }

  function showEmptyState(list) {
    if (list.querySelector('.wish-card') || list.querySelector('.wishes__empty')) return;
    const empty = document.createElement('p');
    empty.className = 'wishes__empty form-note form-note--info';
    empty.textContent = 'Jadilah yang pertama meninggalkan ucapan dan doa!';
    list.appendChild(empty);
  }

  async function loadRecentWishes(list, client, slug) {
    try {
      const { data, error } = await client
        .from('wishes')
        .select('name, message, created_at')
        .eq('wedding_slug', slug)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const wishes = (data || []).filter((wish) => !isTestEntry(wish.name));
      if (!wishes.length) return false;

      const emptyEl = list.querySelector('.wishes__empty');
      if (emptyEl) emptyEl.remove();

      wishes.forEach((wish) => {
        list.appendChild(
          createWishCard(wish.name, wish.message, new Date(wish.created_at))
        );
      });
      return true;
    } catch (err) {
      console.warn('[Wishes] Could not load public wishes:', err);
      return false;
    }
  }

  function setFormNote(form, message, type) {
    let note = form.querySelector('.form-note');
    if (!note) {
      note = document.createElement('p');
      note.className = 'form-note';
      note.setAttribute('role', 'status');
      note.setAttribute('aria-live', 'polite');
      form.appendChild(note);
    }
    note.textContent = message;
    note.classList.remove('form-note--success', 'form-note--error', 'form-note--info');
    if (type) note.classList.add(`form-note--${type}`);
  }

  async function init() {
    const form = document.getElementById('wishesForm');
    const list = document.getElementById('wishesList');
    if (!form || !list) return;

    if (!isConfigured()) {
      setFormNote(
        form,
        'Mode demo — ucapan ditampilkan di perangkat ini saja. Hubungi penyelenggara untuk mengaktifkan database.',
        'info'
      );
      console.warn('[Wishes] Supabase belum dikonfigurasi. Isi js/config.js dengan URL dan anon key.');
      showEmptyState(list);
    } else {
      const client = getClient();
      const cfg = getConfig();
      if (client) {
        const loaded = await loadRecentWishes(list, client, cfg.slug || 'erzal-dhea');
        if (!loaded) showEmptyState(list);
      } else {
        showEmptyState(list);
      }
    }

    let submitting = false;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (submitting) return;

      const name = document.getElementById('wishName')?.value.trim();
      const message = document.getElementById('wishMessage')?.value.trim();
      const submitBtn = form.querySelector('button[type="submit"]');

      if (!name) {
        setFormNote(form, 'Mohon isi nama Anda.', 'error');
        document.getElementById('wishName')?.focus();
        return;
      }

      if (!message) {
        setFormNote(form, 'Mohon tulis ucapan Anda.', 'error');
        document.getElementById('wishMessage')?.focus();
        return;
      }

      if (message.length > 2000) {
        setFormNote(form, 'Ucapan terlalu panjang (maks. 2000 karakter).', 'error');
        return;
      }

      const emptyEl = list.querySelector('.wishes__empty');
      if (emptyEl) emptyEl.remove();

      if (!isConfigured()) {
        list.prepend(createWishCard(name, message, new Date()));
        setFormNote(form, 'Ucapan ditampilkan (mode demo — tidak disimpan ke server).', 'info');
        form.reset();
        return;
      }

      const client = getClient();
      if (!client) {
        setFormNote(form, 'Layanan belum siap. Silakan coba lagi nanti.', 'error');
        return;
      }

      submitting = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.originalText = submitBtn.textContent;
        submitBtn.textContent = 'Mengirim...';
      }
      setFormNote(form, 'Mengirim ucapan...', 'info');

      try {
        const cfg = getConfig();
        const { error } = await client.from('wishes').insert({
          name,
          message,
          wedding_slug: cfg.slug || 'erzal-dhea',
        });

        if (error) throw error;

        list.prepend(createWishCard(name, message, new Date()));
        setFormNote(form, 'Terima kasih! Ucapan Anda berhasil dikirim.', 'success');
        form.reset();
      } catch (err) {
        console.error('[Wishes]', err);
        setFormNote(form, 'Gagal mengirim ucapan. Periksa koneksi internet dan coba lagi.', 'error');
      } finally {
        submitting = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = submitBtn.dataset.originalText || 'Kirim Ucapan / Send';
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
