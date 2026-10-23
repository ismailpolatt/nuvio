/* Account-owned command results, separate from personal display preferences. */
const HG_JOURNAL_TEXT = hgTO({}, { title: 'journal.title', help: 'journal.help', empty: 'journal.empty', error: 'journal.error', all: 'journal.all', accepted: 'journal.accepted', partial: 'journal.partial', failed: 'journal.failed', skipped: 'journal.skipped', targets: 'journal.targets', count: 'journal.count', favorites: 'journal.favorites', mode: 'journal.mode', exit: 'journal.exit', automation: 'journal.automation', room: 'journal.room', pending: 'journal.pending' });
const HGJournal = window.HGJournal = {
  key: 'nuvio_action_journal_v1', uid: null, rows: [], error: false, loading: false, version: 0, generation: 0, pending: null, queue: Promise.resolve(),
  clean(input) {
    if (!Array.isArray(input)) return [];
    const seen = new Set();
    return input.filter((r) => r && typeof r.id === 'string' && r.id.length <= 100 && !seen.has(r.id) && (seen.add(r.id), true) &&
      Number.isFinite(Date.parse(r.at)) && ['favorites','mode','exit','automation','room'].includes(r.source) &&
      Array.isArray(r.targets) && r.targets.length > 0 && r.targets.length <= 50 &&
      r.targets.every((x) => x && /^(light|switch|automation)\.[a-z0-9_]+$/.test(x.e) && ['turn_on','turn_off'].includes(x.action)) &&
      Number.isInteger(r.accepted) && r.accepted >= 0 && r.accepted <= r.targets.length && typeof r.failed === 'boolean'
    ).map((r) => ({ id: r.id, at: new Date(r.at).toISOString(), source: r.source, targets: r.targets.map((x) => ({ e: x.e, action: x.action })), accepted: r.accepted, failed: r.failed }))
      .sort((a,b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 100);
  },
  changed() { this.version++; window.dispatchEvent?.(new CustomEvent('nuvio-journal')); },
  async load(h, force = false) {
    const uid = h.user?.id; if (!uid) return false;
    if (this.uid === uid && this.pending && !force) return this.pending;
    if (this.uid !== uid) { this.uid = uid; this.rows = []; this.error = false; }
    const generation = ++this.generation;
    this.loading = true; this.changed();
    this.pending = (async () => {
      try {
        const r = await h.callWS({ type: 'frontend/get_user_data', key: this.key });
        if (this.uid !== uid || this.generation !== generation) return false;
        this.rows = this.clean(r?.value); this.error = false; return true;
      } catch (e) { if (this.uid === uid && this.generation === generation) this.error = true; return false; }
      finally { if (this.uid === uid && this.generation === generation) { this.loading = false; this.changed(); } }
    })();
    return this.pending;
  },
  record(h, event) {
    const uid = h.user?.id;
    let row;
    try { row = this.clean([{ ...event, id: globalThis.crypto?.randomUUID?.() || Date.now() + '-' + Math.random().toString(36).slice(2), at: new Date().toISOString() }])[0]; }
    catch (e) { return Promise.resolve(false); }
    if (!uid || !row) return Promise.resolve(false);
    const job = async () => {
      await this.pending;
      if (this.uid !== uid || window.__hgHass?.user?.id && window.__hgHass.user.id !== uid) return false;
      const generation = this.generation;
      try {
        // Fresh read avoids dropping earlier writes from another tab; HA has no compare-and-swap here.
        const current = await h.callWS({ type: 'frontend/get_user_data', key: this.key });
        if (this.uid !== uid || this.generation !== generation) return false;
        const rows = this.clean([row, ...this.clean(current?.value)]);
        await h.callWS({ type: 'frontend/set_user_data', key: this.key, value: rows });
        if (this.uid !== uid || this.generation !== generation) return false;
        this.rows = rows; this.error = false; this.changed(); return true;
      } catch (e) { if (this.uid === uid && this.generation === generation) { this.error = true; this.changed(); } return false; }
    };
    const pending = this.queue.catch(() => {}).then(job);
    this.queue = pending; return pending;
  },
  status(row) { return row.failed ? row.accepted ? 'partial' : 'failed' : row.accepted ? 'accepted' : 'skipped'; },
  html(card) {
    const h = card._hass, filter = card._journalFilter || 'all', validAccount = this.uid === h.user?.id;
    if (!validAccount) { this.load(h); return `<p role="status">${hgT('common.loading')}</p>`; }
    const rows = this.rows.filter((r) => filter === 'all' || this.status(r) === filter);
    return `<p class="cx-note">${HG_JOURNAL_TEXT.help}</p><div class="cx-actions"><button data-act="living-journal-refresh">${hgT('dashboardx.refresh')}</button>${['all','accepted','partial','failed'].map((s) => `<button data-act="living-journal-filter" data-status="${s}" aria-pressed="${filter === s}">${HG_JOURNAL_TEXT[s]}</button>`).join('')}</div>${this.error ? `<p role="alert">${HG_JOURNAL_TEXT.error}</p>` : ''}${this.loading ? `<p role="status">${hgT('common.loading')}</p>` : ''}${rows.map((r) => `<section class="cx-box" style="margin-bottom:12px"><div class="cx-row"><span><b>${HG_JOURNAL_TEXT[r.source]}</b><small>${H.esc(new Date(r.at).toLocaleString(HG_LOC()))}</small></span><b>${HG_JOURNAL_TEXT[this.status(r)]}</b></div><p>${r.accepted}/${r.targets.length} ${HG_JOURNAL_TEXT.count}</p><details><summary>${HG_JOURNAL_TEXT.targets}</summary><ul>${r.targets.map((x) => `<li>${H.esc(h.states[x.e] ? H.name(h, x.e) : x.e)} → ${x.action === 'turn_on' ? hgT('common.on_masc') : hgT('common.off_masc')}</li>`).join('')}</ul></details></section>`).join('') || (!this.loading ? `<p>${HG_JOURNAL_TEXT.empty}</p>` : '')}`;
  }
};
