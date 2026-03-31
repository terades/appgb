import React, { useMemo, useState } from 'react';
// Terminverschiebung local helpers
function toIsoDateForTermin(value) {
  if (!value) return '';
  if (typeof value === 'string') {
    const normalized = value.includes('T') ? value : value.replace(' ', 'T');
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return value;
    return date.toISOString().slice(0, 10);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function formatTerminDate(value) {
  if (!value) return '-';
  const date = new Date(String(value).includes('T') ? value : String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTerminDateTime(value) {
  if (!value) return '-';
  const date = new Date(String(value).includes('T') ? value : String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getTerminverschiebungen(record, fieldKey = '') {
  const history = Array.isArray(record?.terminverschiebungen) ? record.terminverschiebungen : [];
  if (!fieldKey) return history;
  return history.filter((entry) => entry.fieldKey === fieldKey);
}

function getTerminverschiebungSummary(record, fieldKey = '') {
  const history = getTerminverschiebungen(record, fieldKey);
  const sorted = [...history].sort((a, b) => new Date(b.changedAt || 0).getTime() - new Date(a.changedAt || 0).getTime());
  return { count: sorted.length, latest: sorted[0] || null };
}

function withTerminverschiebung(record, params) {
  const {
    fieldKey,
    fromValue,
    toValue,
    changedBy = 'Unbekannt',
    bereich = 'Unbekannt',
    label = 'Termin',
    changedAt = new Date().toISOString(),
  } = params || {};

  const fromIso = toIsoDateForTermin(fromValue);
  const toIso = toIsoDateForTermin(toValue);
  if (!fieldKey || !fromIso || !toIso || fromIso === toIso) return record;

  const nextEntry = {
    id: `${record?.id || record?.itemId || 'item'}-${fieldKey}-${Date.now()}`,
    fieldKey,
    label,
    fromValue: fromIso,
    toValue: toIso,
    changedBy,
    bereich,
    changedAt,
  };

  return {
    ...record,
    terminverschiebungen: [...getTerminverschiebungen(record), nextEntry],
  };
}

function TerminverschiebungIndicator({ record, fieldKey, onOpen }) {
  const summary = getTerminverschiebungSummary(record, fieldKey);
  const count = summary.count || 0;
  const hasHistory = count > 0;
  return (
    <button
      type="button"
      onClick={onOpen}
      title="Terminverschiebung anzeigen"
      style={{
        border: hasHistory ? '1px solid #fca5a5' : '1px solid #cbd5e1',
        background: hasHistory ? '#fee2e2' : '#f8fafc',
        color: hasHistory ? '#991b1b' : '#475569',
        borderRadius: 999,
        padding: '1px 7px',
        fontSize: 10,
        fontWeight: 700,
        cursor: 'pointer',
        marginLeft: 6,
      }}
    >
      Termin x{count}
    </button>
  );
}

function TerminverschiebungModal({ open, onClose, record, fieldKey, title }) {
  if (!open || !record) return null;

  const history = [...getTerminverschiebungen(record, fieldKey)].sort(
    (a, b) => new Date(b.changedAt || 0).getTime() - new Date(a.changedAt || 0).getTime(),
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 2000,
        padding: 20,
      }}
    >
      <div
        style={{
          width: 'min(760px, 96vw)',
          maxHeight: '88vh',
          overflow: 'auto',
          background: '#ffffff',
          border: '1px solid #d8e1ea',
          borderRadius: 12,
          boxShadow: '0 20px 48px rgba(15, 23, 42, 0.28)',
        }}
      >
        <div style={{ padding: '12px 14px', background: '#fee2e2', borderBottom: '1px solid #fecaca', fontWeight: 700, color: '#991b1b' }}>
          {title || 'Historie Terminverschiebung'}
        </div>
        <div style={{ padding: 14, display: 'grid', gap: 8 }}>
          {history.length === 0 ? (
            <div style={{ fontSize: 13, color: '#64748b' }}>Keine Terminverschiebungen vorhanden.</div>
          ) : history.map((entry) => (
            <div key={entry.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', background: '#f8fafc' }}>
              <div style={{ fontSize: 12, color: '#0f172a', fontWeight: 700 }}>
                {entry.label || 'Termin'}: {formatTerminDate(entry.fromValue)} {'->'} {formatTerminDate(entry.toValue)}
              </div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>
                Von: {entry.changedBy || 'Unbekannt'} | Bereich: {entry.bereich || 'Unbekannt'} | Am: {formatTerminDateTime(entry.changedAt)}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 14, borderTop: '1px solid #e2e8f0' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ border: '1px solid #cbd5e1', background: '#ffffff', borderRadius: 8, padding: '8px 12px', fontSize: 13, cursor: 'pointer' }}
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: '#e9eef4', fontFamily: 'Segoe UI, sans-serif', color: '#102030' },
  layout: { display: 'grid', gridTemplateColumns: 'clamp(72px, 8vw, 96px) minmax(0, 1fr)', minHeight: '100vh' },
  sidebar: { background: '#2f3a45', display: 'grid', gridTemplateRows: '80px 1fr 60px', color: '#dbe3ec' },
  logo: { display: 'grid', placeItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  nav: { display: 'grid', gap: 8, padding: 10 },
  navItem: { display: 'grid', placeItems: 'center', gap: 6, padding: '10px 8px', borderRadius: 8, color: '#c7d2dc', fontSize: 11 },
  navItemActive: { background: '#1f2933', color: '#ffffff' },
  navIcon: { width: 26, height: 26, borderRadius: 6, background: 'rgba(255,255,255,0.12)', display: 'grid', placeItems: 'center', fontSize: 14 },
  navFooter: { display: 'grid', placeItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)' },
  content: { padding: 18, display: 'grid', gap: 12, minWidth: 0 },
  topRow: { display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
  chip: { background: '#39b6e5', color: '#fff', borderRadius: 8, padding: '6px 12px', fontWeight: 700, textAlign: 'center' },
  title: { background: '#fff', borderRadius: 10, padding: '8px 14px', border: '1px solid #d8e1ea', fontWeight: 700, flex: '1 1 280px', minWidth: 220 },
  clock: { background: '#fff', borderRadius: 10, padding: '8px 14px', border: '1px solid #d8e1ea', fontWeight: 700 },
  cardRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 },
  workCard: { background: '#fff', border: '1px solid #d8e1ea', borderRadius: 12, padding: 12, display: 'grid', gap: 8 },
  workTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 },
  workMeta: { fontSize: 12, color: '#64748b', display: 'grid', gap: 4 },
  workActions: { display: 'flex', gap: 6, alignItems: 'center' },
  roundIcon: { width: 26, height: 26, borderRadius: 13, background: '#e2e8f0', display: 'grid', placeItems: 'center', color: '#475569', fontSize: 12 },
  okDot: { width: 26, height: 26, borderRadius: 13, background: '#38bdf8', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700 },
  section: { background: '#eef3f8', borderRadius: 10, padding: 12, display: 'grid', gap: 10, minWidth: 0 },
  sectionTitle: { fontWeight: 700, fontSize: 13, color: '#2a3a47', display: 'flex', alignItems: 'center', gap: 8 },
  row: { background: '#4f6f89', color: '#fff', borderRadius: 8, padding: '10px 12px', display: 'grid', gridTemplateColumns: '22px minmax(110px,1.2fr) minmax(140px,1.4fr) minmax(120px,1fr) minmax(80px,1fr) minmax(90px,1fr) auto', gap: 12, alignItems: 'center', minWidth: 760 },
  rowLight: { background: '#ffffff', color: '#122030', border: '1px solid #d8e1ea' },
  rowHeader: { fontSize: 11, color: '#dbe8f2', textTransform: 'uppercase', fontWeight: 700 },
  rowHeaderLight: { fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 },
  expandBtn: { border: 'none', background: 'transparent', color: 'inherit', fontSize: 16, cursor: 'pointer' },
  progress: { height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  progressFill: { height: '100%', background: '#22c55e' },
  sublist: { background: '#fff', borderRadius: 8, border: '1px solid #d8e1ea', padding: 10, display: 'grid', gap: 8, minWidth: 760 },
  subHeader: { display: 'grid', gridTemplateColumns: 'minmax(160px,1.5fr) minmax(90px,1fr) minmax(70px,0.8fr) minmax(100px,1fr) minmax(90px,0.9fr) minmax(90px,1fr) auto', gap: 10, fontSize: 11, fontWeight: 700, color: '#64748b' },
  subRow: { display: 'grid', gridTemplateColumns: 'minmax(160px,1.5fr) minmax(90px,1fr) minmax(70px,0.8fr) minmax(100px,1fr) minmax(90px,0.9fr) minmax(90px,1fr) auto', gap: 10, alignItems: 'center', borderTop: '1px dashed #e2e8f0', paddingTop: 6 },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, padding: '2px 8px', fontSize: 11, fontWeight: 700 },
  badgeRun: { background: '#dbeafe', color: '#1e40af' },
  badgeOpen: { background: '#fef3c7', color: '#92400e' },
  badgeDone: { background: '#d1fae5', color: '#166534' },
  input: { width: '100%', border: '1px solid #cbd5e1', borderRadius: 6, padding: '6px 8px', fontSize: 12, background: '#fff' },
  footerActions: { display: 'flex', justifyContent: 'flex-end', gap: 10 },
  softButton: { border: '1px solid #cbd5e1', borderRadius: 8, background: '#f8fafc', padding: '8px 12px', cursor: 'pointer', fontSize: 13 },
  primaryButton: { border: '1px solid #ef4444', borderRadius: 8, background: '#fee2e2', color: '#991b1b', padding: '8px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 700 },
  carrierBar: { background: '#f8fbff', border: '1px solid #d8e1ea', borderRadius: 10, padding: '8px 10px', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  carrierChip: { background: '#ffffff', border: '1px solid #d8e1ea', borderRadius: 999, padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11 },
  carrierDot: { width: 8, height: 8, borderRadius: 999 },
  tinyButton: { border: '1px solid #cbd5e1', borderRadius: 999, background: '#f8fafc', padding: '2px 7px', cursor: 'pointer', fontSize: 10 },
  modalBackdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 },
  modal: { width: 'min(520px, 92vw)', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 10, overflow: 'hidden' },
  modalHead: { padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 700 },
  modalBody: { padding: 12, display: 'grid', gap: 10 },
  modalFoot: { padding: 12, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 8 },
  block: { background: '#f4f7fb', border: '1px solid #d8e1ea', borderRadius: 10, overflow: 'hidden' },
  blockHead: { background: '#eaf0f6', borderBottom: '1px solid #d8e1ea', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  blockBody: { padding: 10, display: 'grid', gap: 10 },
  collapseBtn: { border: '1px solid #cbd5e1', background: '#fff', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12, fontWeight: 700 },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 },
  kpiCard: { background: '#fff', border: '1px solid #d8e1ea', borderRadius: 8, padding: '7px 9px' },
  kpiLabel: { fontSize: 11, color: '#64748b' },
  kpiValue: { fontSize: 18, fontWeight: 700 },
  controlRow: { display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) auto', gap: 8, alignItems: 'end' },
};

const demo = {
  quick: [
    { id: 'BI2278C-57014', bom: 'BI2278C-BTL52450', progress: 0.5, time: '04:04', pos: '# 1 / 2' },
    { id: 'BI2278C-57015', bom: 'BI2278C-BTL52450', progress: 0.25, time: '00:51', pos: '# 0 / 2' },
    { id: 'HR1042C-57190', bom: 'HR1042C-BTL59000', progress: 0.75, time: '01:45', pos: '# 3 / 25' },
  ],
  orders: [
    {
      id: 'BN0178A',
      project: 'BN0178A',
      bom: 'BN0178A-BTL50500',
      start: '15.01.2026, 11:11',
      artikelCount: '0 von 1',
      done: '3 von 4',
      terminverschiebungen: [
        {
          id: 'BN0178A-start-1',
          fieldKey: 'start',
          label: 'Startzeit',
          fromValue: '2026-01-14',
          toValue: '2026-01-15',
          changedBy: 'AV',
          bereich: 'Fertigmelden',
          changedAt: '2026-01-13T08:20:00',
        },
      ],
      items: [
        { id: 'BN0178A-57000', fertig: '3 von 4', status: 'in Arbeit', cut: '12/24' },
      ],
    },
    {
      id: 'BI2278C',
      project: 'BI2278C',
      bom: 'BI2278C-BTL52450',
      start: '06.02.2026, 08:53',
      artikelCount: '0 von 2',
      done: '1 von 4',
      items: [
        { id: 'BI2278C-57014', fertig: '1 von 2', status: 'in Arbeit', cut: '18/24' },
        { id: 'BI2278C-57015', fertig: '0 von 2', status: 'freigegeben', cut: '5/16' },
      ],
    },
    {
      id: 'HR1042C',
      project: 'HR1042C',
      bom: 'HR1042C-BTL59000',
      start: '06.02.2026, 11:11',
      artikelCount: '0 von 1',
      done: '3 von 25',
      items: [
        { id: 'HR1042C-57190', fertig: '3 von 25', status: 'in Arbeit', cut: '20/32' },
      ],
    },
  ],
};

function statusBadge(status) {
  if (status === 'in Arbeit') return { ...s.badge, ...s.badgeRun };
  if (status === 'fertig') return { ...s.badge, ...s.badgeDone };
  return { ...s.badge, ...s.badgeOpen };
}

export default function FertigmeldenScreen() {
  const [openIds, setOpenIds] = useState(() => new Set(['BN0178A']));
  const [orderSearch, setOrderSearch] = useState('');
  const [sectionsOpen, setSectionsOpen] = useState({
    quick: true,
    carriers: true,
    orders: true,
  });
  const [carriers, setCarriers] = useState([
    { id: 'L-2400-01', cap: 12, load: 8, closed: false },
    { id: 'L-2400-02', cap: 10, load: 10, closed: true },
    { id: 'L-4000-01', cap: 16, load: 5, closed: false },
  ]);
  const [bookingModal, setBookingModal] = useState(null);
  const [terminModal, setTerminModal] = useState(null);
  const [selectedCarrier, setSelectedCarrier] = useState('');
  const [bookQty, setBookQty] = useState('1');
  const [bookingInfo, setBookingInfo] = useState('');
  const time = useMemo(
    () => new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
    [],
  );
  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    if (!q) return demo.orders;
    return demo.orders.filter((o) =>
      o.id.toLowerCase().includes(q) || o.project.toLowerCase().includes(q) || o.bom.toLowerCase().includes(q),
    );
  }, [orderSearch]);
  const kpis = useMemo(() => {
    const totalOrders = demo.orders.length;
    const totalItems = demo.orders.reduce((acc, o) => acc + o.items.length, 0);
    const inWork = demo.orders.reduce((acc, o) => acc + o.items.filter((i) => i.status === 'in Arbeit').length, 0);
    const openCarrier = carriers.filter((c) => !c.closed).length;
    return { totalOrders, totalItems, inWork, openCarrier };
  }, [carriers]);

  function toggleOpen(id) {
    if (openIds.has(id)) {
      setOpenIds(new Set());
      return;
    }
    setOpenIds(new Set([id]));
  }

  function openBooking(itemId) {
    const firstOpenCarrier = carriers.find((c) => !c.closed && c.load < c.cap);
    setBookingModal({ itemId });
    setSelectedCarrier(firstOpenCarrier ? firstOpenCarrier.id : '');
    setBookQty('1');
    setBookingInfo('');
  }

  function closeBooking() {
    setBookingModal(null);
    setSelectedCarrier('');
    setBookQty('1');
  }

  function bookGoodPart() {
    if (!bookingModal || !selectedCarrier) return;
    const qty = Math.max(1, Number(bookQty) || 1);
    let booked = false;
    let message = '';
    setCarriers((prev) => prev.map((c) => {
      if (c.id !== selectedCarrier) return c;
      if (c.closed) {
        message = 'Ladungstraeger ist bereits geschlossen.';
        return c;
      }
      const free = Math.max(0, c.cap - c.load);
      if (free <= 0) {
        booked = false;
        message = 'Ladungstraeger ist voll und wird geschlossen.';
        return { ...c, closed: true };
      }
      const realQty = Math.min(qty, free);
      const nextLoad = c.load + realQty;
      const nextClosed = nextLoad >= c.cap;
      booked = true;
      message = nextClosed
        ? `${realQty} Stk gebucht. Ladungstraeger ist jetzt voll und geschlossen.`
        : `${realQty} Stk gebucht.`;
      return { ...c, load: nextLoad, closed: nextClosed };
    }));
    setBookingInfo(booked || message ? message : 'Buchung nicht möglich.');
  }

  function closeCarrier(id) {
    setCarriers((prev) => prev.map((c) => (c.id === id ? { ...c, closed: true } : c)));
  }

  return (
    <div style={s.page}>
      <div style={s.layout}>
        <aside style={s.sidebar}>
          <div style={s.logo}>
            <div style={{ width: 36, height: 36, borderRadius: 18, background: '#5bd3ff', display: 'grid', placeItems: 'center', color: '#0b3a4a', fontWeight: 900 }}>G</div>
          </div>
          <div style={s.nav}>
            {[
              { label: 'Home' },
              { label: 'Aktuelle\nProduktion', active: true },
              { label: 'Aufträge' },
              { label: 'Logbuch' },
            ].map((item) => (
              <div key={item.label} style={{ ...s.navItem, ...(item.active ? s.navItemActive : null) }}>
                <div style={s.navIcon}>⬤</div>
                <div style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>{item.label}</div>
              </div>
            ))}
          </div>
          <div style={s.navFooter}>⚙</div>
        </aside>

        <main style={s.content}>
          <div style={s.topRow}>
            <div style={s.chip}>In Produktion</div>
            <div style={s.title}>MB-4.1-Fensterlinie · Fertigmelden</div>
            <div style={s.clock}>{time}</div>
          </div>

          <div style={s.kpiRow}>
            <div style={s.kpiCard}><div style={s.kpiLabel}>Aufträge</div><div style={s.kpiValue}>{kpis.totalOrders}</div></div>
            <div style={s.kpiCard}><div style={s.kpiLabel}>Artikelpositionen</div><div style={s.kpiValue}>{kpis.totalItems}</div></div>
            <div style={s.kpiCard}><div style={s.kpiLabel}>In Arbeit</div><div style={s.kpiValue}>{kpis.inWork}</div></div>
            <div style={s.kpiCard}><div style={s.kpiLabel}>Offene Ladungstraeger</div><div style={s.kpiValue}>{kpis.openCarrier}</div></div>
          </div>

          <div style={s.block}>
            <div style={s.blockHead}>
              <div style={s.sectionTitle}>Schnellmeldung</div>
              <button type="button" style={s.collapseBtn} onClick={() => setSectionsOpen((p) => ({ ...p, quick: !p.quick }))}>
                {sectionsOpen.quick ? 'Ausblenden' : 'Einblenden'}
              </button>
            </div>
            {sectionsOpen.quick && (
              <div style={s.blockBody}>
                <div style={s.cardRow}>
                  {demo.quick.map((q) => (
                    <div key={q.id} style={s.workCard}>
                      <div style={s.workTop}>
                        <span style={{ background: '#e2e8f0', borderRadius: 8, padding: '4px 8px', fontSize: 12 }}>{q.pos}</span>
                        <span style={{ color: '#64748b', fontSize: 12 }}>⏱ {q.time}</span>
                      </div>
                      <div style={{ fontWeight: 700 }}>{q.id}</div>
                      <div style={s.workMeta}>
                        <span>Bauteilliste: {q.bom}</span>
                      </div>
                      <div style={s.progress}>
                        <div style={{ ...s.progressFill, width: `${Math.round(q.progress * 100)}%` }} />
                      </div>
                      <div style={s.workActions}>
                        <span style={{ fontSize: 11, color: '#64748b' }}>Gutteilmeldung</span>
                        <div style={{ marginLeft: 'auto' }}>
                          <button
                            type="button"
                            onClick={() => openBooking(q.id)}
                            title="Gutteil melden und Ladungstraeger waehlen"
                            style={{ ...s.okDot, border: 'none', cursor: 'pointer' }}
                          >
                            ✓
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={s.block}>
            <div style={s.blockHead}>
              <div style={s.sectionTitle}>Ladungstraeger</div>
              <button type="button" style={s.collapseBtn} onClick={() => setSectionsOpen((p) => ({ ...p, carriers: !p.carriers }))}>
                {sectionsOpen.carriers ? 'Ausblenden' : 'Einblenden'}
              </button>
            </div>
            {sectionsOpen.carriers && (
              <div style={s.blockBody}>
                <div style={s.carrierBar}>
                  {carriers.map((c) => {
                    const pct = c.cap === 0 ? 0 : Math.round((c.load / c.cap) * 100);
                    const isFull = c.load >= c.cap;
                    const dotColor = c.closed ? '#ef4444' : isFull ? '#f59e0b' : '#22c55e';
                    return (
                      <div key={c.id} style={s.carrierChip}>
                        <span style={{ ...s.carrierDot, background: dotColor }} />
                        <b>{c.id}</b>
                        <span style={{ color: '#64748b' }}>{c.load}/{c.cap}</span>
                        <span style={{ color: '#64748b' }}>{pct}%</span>
                        <span style={{ color: c.closed ? '#991b1b' : isFull ? '#92400e' : '#166534', fontWeight: 700 }}>
                          {c.closed ? 'geschlossen' : isFull ? 'voll' : 'offen'}
                        </span>
                        <button
                          type="button"
                          disabled={c.closed}
                          onClick={() => closeCarrier(c.id)}
                          style={c.closed ? { ...s.tinyButton, opacity: 0.5, cursor: 'not-allowed' } : s.tinyButton}
                          title="Ladungstraeger schliessen"
                        >
                          Schließen
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div style={s.block}>
            <div style={s.blockHead}>
              <div style={s.sectionTitle}>Fertigmelden nach Auftrag</div>
              <button type="button" style={s.collapseBtn} onClick={() => setSectionsOpen((p) => ({ ...p, orders: !p.orders }))}>
                {sectionsOpen.orders ? 'Ausblenden' : 'Einblenden'}
              </button>
            </div>
            {sectionsOpen.orders && (
              <div style={s.blockBody}>
                <div style={s.controlRow}>
                  <label>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Auftrag suchen</div>
                    <input
                      style={s.input}
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      placeholder="z.B. BN0178A oder BTL50500"
                    />
                  </label>
                  <button type="button" style={s.softButton} onClick={() => setOrderSearch('')}>Suche loeschen</button>
                </div>
            {filteredOrders.map((row) => {
              const isOpen = openIds.has(row.id);
              return (
                <React.Fragment key={row.id}>
                  <div style={{ overflowX: 'auto' }}>
                    <div style={s.row}>
                      <button style={s.expandBtn} onClick={() => toggleOpen(row.id)}>{isOpen ? '▾' : '▸'}</button>
                      <div>
                        <div style={s.rowHeader}>Projekt</div>
                        <div>{row.project}</div>
                      </div>
                      <div>
                        <div style={s.rowHeader}>Bauteilliste</div>
                        <div>{row.bom}</div>
                      </div>
                      <div>
                        <div style={s.rowHeader}>Startzeit</div>
                        <div>
                          {row.start}
                          <TerminverschiebungIndicator
                            record={row}
                            fieldKey="start"
                            onOpen={() => setTerminModal({
                              record: row,
                              fieldKey: 'start',
                              title: `Historie Startzeit - ${row.id}`,
                            })}
                          />
                        </div>
                      </div>
                      <div>
                        <div style={s.rowHeader}>Artikel</div>
                        <div>{row.artikelCount}</div>
                      </div>
                      <div>
                        <div style={s.rowHeader}>Gefertigt</div>
                        <div>{row.done}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>⋮</div>
                    </div>
                  </div>
                  {isOpen && (
                    <div style={{ overflowX: 'auto' }}>
                      <div style={s.sublist}>
                        <div style={s.subHeader}>
                          <div>Artikel</div>
                          <div>Status</div>
                          <div>Gefertigt</div>
                          <div>Zuschnitt</div>
                          <div>Stück melden</div>
                          <div>Rest</div>
                          <div />
                        </div>
                        {row.items.map((it) => {
                          const parts = String(it.cut || '0/0').split('/');
                          const cutDone = Number(parts[0]) || 0;
                          const cutTotal = Number(parts[1]) || 0;
                          const cutPct = cutTotal === 0 ? 0 : Math.round((cutDone / cutTotal) * 100);
                          return (
                            <div key={it.id} style={s.subRow}>
                              <div>{it.id}</div>
                              <div><span style={statusBadge(it.status)}>{it.status}</span></div>
                              <div>{it.fertig}</div>
                              <div>
                                <div style={s.progress}>
                                  <div style={{ ...s.progressFill, width: `${cutPct}%`, background: cutPct === 100 ? '#22c55e' : '#0ea5e9' }} />
                                </div>
                                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{it.cut}</div>
                              </div>
                              <div><input style={s.input} placeholder="z.B. 2" /></div>
                              <div style={{ fontSize: 12, color: '#64748b' }}>Rest offen</div>
                              <div style={{ textAlign: 'right' }}>⋯</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
            {filteredOrders.length === 0 && (
              <div style={{ background: '#fff', border: '1px solid #d8e1ea', borderRadius: 8, padding: 10, color: '#64748b' }}>
                Keine passenden Aufträge gefunden.
              </div>
            )}
              </div>
            )}
          </div>

          <div style={s.footerActions}>
            <button style={s.primaryButton}>Störung melden</button>
            <button style={s.softButton}>Status wechseln</button>
          </div>
        </main>
      </div>

      {bookingModal && (
        <div style={s.modalBackdrop}>
          <div style={s.modal}>
            <div style={s.modalHead}>Gutteilmeldung - {bookingModal.itemId}</div>
            <div style={s.modalBody}>
              <label>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Ladungstraeger</div>
                <select
                  value={selectedCarrier}
                  onChange={(e) => setSelectedCarrier(e.target.value)}
                  style={s.input}
                >
                  <option value="">Bitte waehlen</option>
                  {carriers.map((c) => {
                    const free = Math.max(0, c.cap - c.load);
                    return (
                      <option key={c.id} value={c.id} disabled={c.closed || free === 0}>
                        {c.id} - frei: {free} - {c.closed ? 'geschlossen' : 'offen'}
                      </option>
                    );
                  })}
                </select>
              </label>
              <label>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Stückzahl melden</div>
                <input
                  value={bookQty}
                  onChange={(e) => setBookQty(e.target.value)}
                  style={s.input}
                  placeholder="z.B. 1"
                />
              </label>
              {bookingInfo ? (
                <div style={{ fontSize: 12, color: bookingInfo.includes('geschlossen') ? '#991b1b' : '#166534' }}>
                  {bookingInfo}
                </div>
              ) : null}
            </div>
            <div style={s.modalFoot}>
              <button type="button" style={s.softButton} onClick={closeBooking}>Schließen</button>
              <button type="button" style={s.primaryButton} onClick={bookGoodPart}>Buchen</button>
            </div>
          </div>
        </div>
      )}
      <TerminverschiebungModal
        open={Boolean(terminModal)}
        record={terminModal?.record || null}
        fieldKey={terminModal?.fieldKey || ''}
        title={terminModal?.title || 'Historie Terminverschiebung'}
        onClose={() => setTerminModal(null)}
      />
    </div>
  );
}



