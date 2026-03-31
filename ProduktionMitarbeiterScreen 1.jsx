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
  layout: { display: 'grid', gridTemplateColumns: '96px 1fr', minHeight: '100vh' },
  sidebar: { background: '#2f3a45', display: 'grid', gridTemplateRows: '80px 1fr 60px', color: '#dbe3ec' },
  logo: { display: 'grid', placeItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  nav: { display: 'grid', gap: 8, padding: 10 },
  navItem: { display: 'grid', placeItems: 'center', gap: 6, padding: '10px 8px', borderRadius: 8, color: '#c7d2dc', fontSize: 11 },
  navItemActive: { background: '#1f2933', color: '#ffffff' },
  navIcon: { width: 26, height: 26, borderRadius: 6, background: 'rgba(255,255,255,0.12)', display: 'grid', placeItems: 'center', fontSize: 14 },
  navFooter: { display: 'grid', placeItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)' },
  content: { padding: 18, display: 'grid', gap: 12 },
  topRow: { display: 'grid', gridTemplateColumns: '1fr 1.4fr auto', gap: 12, alignItems: 'center' },
  chip: { background: '#39b6e5', color: '#fff', borderRadius: 8, padding: '6px 12px', fontWeight: 700, textAlign: 'center' },
  title: { background: '#fff', borderRadius: 10, padding: '8px 14px', border: '1px solid #d8e1ea', fontWeight: 700 },
  clock: { background: '#fff', borderRadius: 10, padding: '8px 14px', border: '1px solid #d8e1ea', fontWeight: 700 },
  section: { background: '#eef3f8', borderRadius: 10, padding: 12, display: 'grid', gap: 10 },
  sectionTitle: { fontWeight: 700, fontSize: 13, color: '#2a3a47', display: 'flex', alignItems: 'center', gap: 8 },
  row: { background: '#4f6f89', color: '#fff', borderRadius: 8, padding: '10px 12px', display: 'grid', gridTemplateColumns: '22px 1.1fr 1.2fr 0.8fr 1fr auto', gap: 12, alignItems: 'center' },
  rowLight: { background: '#ffffff', color: '#122030', border: '1px solid #d8e1ea' },
  rowHeader: { fontSize: 11, color: '#dbe8f2', textTransform: 'uppercase', fontWeight: 700 },
  rowHeaderLight: { fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 },
  expandBtn: { border: 'none', background: 'transparent', color: 'inherit', fontSize: 16, cursor: 'pointer' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, padding: '2px 8px', fontSize: 11, fontWeight: 700 },
  badgeDone: { background: '#d1fae5', color: '#166534' },
  badgeOpen: { background: '#fef3c7', color: '#92400e' },
  badgeRun: { background: '#dbeafe', color: '#1e40af' },
  progress: { height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  progressFill: { height: '100%', background: '#22c55e' },
  sublist: { background: '#fff', borderRadius: 8, border: '1px solid #d8e1ea', padding: 10, display: 'grid', gap: 8 },
  subHeader: { display: 'grid', gridTemplateColumns: '1.4fr 1fr 0.7fr 1fr 0.7fr 0.9fr 0.9fr auto', gap: 10, fontSize: 11, fontWeight: 700, color: '#64748b' },
  subRow: { display: 'grid', gridTemplateColumns: '1.4fr 1fr 0.7fr 1fr 0.7fr 0.9fr 0.9fr auto', gap: 10, alignItems: 'center', borderTop: '1px dashed #e2e8f0', paddingTop: 6 },
  smallButton: { border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff', padding: '6px 8px', cursor: 'pointer', fontSize: 12 },
};

const demo = {
  active: [
    {
      id: 'BN0178A',
      project: 'BN0178A',
      bom: 'BN0178A-BTL50500',
      schirmerOrder: 'S-01',
      done: '3 von 4',
      planned: '16.01.2026, 10:03',
      terminverschiebungen: [
        {
          id: 'pm-BN0178A-1',
          fieldKey: 'planned',
          label: 'Geplanter Beginn',
          fromValue: '2026-01-15',
          toValue: '2026-01-16',
          changedBy: 'Produktion',
          bereich: 'Produktion',
          changedAt: '2026-01-14T09:10:00',
        },
      ],
    },
    { id: 'HR1042C', project: 'HR1042C', bom: 'HR1042C-BTL59000', schirmerOrder: 'S-02', done: '3 von 25', planned: '27.01.2026, 10:05' },
    { id: 'BI2278C', project: 'BI2278C', bom: 'BI2278C-BTL52450', schirmerOrder: 'S-03', done: '1 von 4', planned: '27.01.2026, 10:29' },
  ],
  planned: [
    { id: 'MS0280C', project: 'MS0280C', bom: 'MS0280C-BTL51000', schirmerOrder: 'S-04', done: '0 von 20', planned: '08.11.2025, 08:29' },
    { id: 'KI0128B', project: 'KI0128B', bom: 'KI0128B-BTL50100', schirmerOrder: 'S-05', done: '0 von 4', planned: '10.12.2025, 15:02' },
  ],
  plannedItems: [
    { orderId: 'KI0128B', prodId: '300-KI0128B-57012-BTL50100-FLG-2', artikel: 'KI0128B-57012-FL-13', fertig: '0 von 1', zuschnitt: '12/24', gestell: 'G-41-017', status: 'freigegeben', resource: 'MB-4.1-Fensterlinie', schirmerSequence: 1 },
    { orderId: 'KI0128B', prodId: '300-KI0128B-57014-BTL50100-FLG-4', artikel: 'KI0128B-57014-FL-29', fertig: '0 von 2', zuschnitt: '7/18', gestell: 'G-41-021', status: 'freigegeben', resource: 'MB-4.1-Fensterlinie', schirmerSequence: 2 },
    { orderId: 'KI0128B', prodId: '300-KI0128B-57017-BTL50100-FLG-1', artikel: 'KI0128B-57017-FL-52', fertig: '0 von 1', zuschnitt: '20/32', gestell: 'G-43-004', status: 'freigegeben', resource: 'MB-4.1-Fensterlinie', schirmerSequence: 3 },
  ],
  done: [
    { id: 'DF0888B', project: 'DF0888B', bom: 'DF0888B-BTL50000', done: '15 von 15', planned: '27.01.2026, 11:26', finished: '06.02.2026, 10:14' },
  ],
};

function statusBadge(status) {
  if (status === 'in Arbeit') return { ...s.badge, ...s.badgeRun };
  if (status === 'fertig') return { ...s.badge, ...s.badgeDone };
  return { ...s.badge, ...s.badgeOpen };
}

export default function ProduktionMitarbeiterScreen() {
  const [openPlanned, setOpenPlanned] = useState(true);
  const [openPlannedDetail, setOpenPlannedDetail] = useState(true);
  const [terminModal, setTerminModal] = useState(null);

  const time = useMemo(() => new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }), []);

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
              { label: 'Aktuelle\nProduktion' },
              { label: 'Aufträge', active: true },
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
            <div style={s.title}>MB-4.1-Fensterlinie</div>
            <div style={s.clock}>{time}</div>
          </div>

          <section style={s.section}>
            <div style={s.sectionTitle}>Aktive Aufträge</div>
            {demo.active.map((row) => (
              <div key={row.id} style={s.row}>
                <button style={s.expandBtn}>›</button>
                <div>
                  <div style={s.rowHeader}>Projekt</div>
                  <div>
                    {row.project}
                    <span style={{ marginLeft: 8, display: 'inline-block', borderRadius: 999, padding: '2px 8px', fontSize: 11, fontWeight: 700, background: '#dbeafe', color: '#1e40af' }}>
                      Reihenfolge {row.schirmerOrder || '-'}
                    </span>
                  </div>
                </div>
                <div>
                  <div style={s.rowHeader}>Bauteilliste</div>
                  <div>{row.bom}</div>
                </div>
                <div>
                  <div style={s.rowHeader}>Gefertigt</div>
                  <div>{row.done}</div>
                </div>
                <div>
                  <div style={s.rowHeader}>Geplanter Beginn</div>
                  <div>
                    {row.planned}
                    <TerminverschiebungIndicator
                      record={row}
                      fieldKey="planned"
                      onOpen={() => setTerminModal({
                        record: row,
                        fieldKey: 'planned',
                        title: `Historie Geplanter Beginn - ${row.id}`,
                      })}
                    />
                  </div>
                </div>
                <div style={s.progress}><div style={{ ...s.progressFill, width: '60%' }} /></div>
              </div>
            ))}
          </section>

          <section style={s.section}>
            <div style={s.sectionTitle}>
              <button style={s.expandBtn} onClick={() => setOpenPlanned((v) => !v)}>{openPlanned ? '▾' : '▸'}</button>
              Geplante Aufträge (letzte 99 Tage, nächste 99 Tage)
            </div>
            {openPlanned && demo.planned.map((row) => (
              <div key={row.id} style={s.row}>
                <button style={s.expandBtn} onClick={() => setOpenPlannedDetail((v) => !v)}>{openPlannedDetail ? '▾' : '▸'}</button>
                <div>
                  <div style={s.rowHeader}>Projekt</div>
                  <div>
                    {row.project}
                    <span style={{ marginLeft: 8, display: 'inline-block', borderRadius: 999, padding: '2px 8px', fontSize: 11, fontWeight: 700, background: '#dbeafe', color: '#1e40af' }}>
                      Reihenfolge {row.schirmerOrder || '-'}
                    </span>
                  </div>
                </div>
                <div>
                  <div style={s.rowHeader}>Bauteilliste</div>
                  <div>{row.bom}</div>
                </div>
                <div>
                  <div style={s.rowHeader}>Gefertigt</div>
                  <div>{row.done}</div>
                </div>
                <div>
                  <div style={s.rowHeader}>Geplanter Beginn</div>
                  <div>
                    {row.planned}
                    <TerminverschiebungIndicator
                      record={row}
                      fieldKey="planned"
                      onOpen={() => setTerminModal({
                        record: row,
                        fieldKey: 'planned',
                        title: `Historie Geplanter Beginn - ${row.id}`,
                      })}
                    />
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>⬇</div>
              </div>
            ))}

            {openPlanned && openPlannedDetail && (
              <div style={s.sublist}>
                <div style={s.subHeader}>
                  <div>Produktionsauftrag</div>
                  <div>Artikel</div>
                  <div>Gefertigt</div>
                  <div>Zuschnitt</div>
                  <div>Gestell</div>
                  <div>Status</div>
                  <div>Schirmer-Reihenfolge</div>
                  <div />
                </div>
                {demo.plannedItems.map((it) => {
                  const parts = String(it.zuschnitt || '0/0').split('/');
                  const cutDone = Number(parts[0]) || 0;
                  const cutTotal = Number(parts[1]) || 0;
                  const cutPct = cutTotal === 0 ? 0 : Math.round((cutDone / cutTotal) * 100);
                  return (
                    <div key={it.prodId} style={s.subRow}>
                      <div>{it.prodId}</div>
                      <div>{it.artikel}</div>
                      <div>{it.fertig}</div>
                      <div>
                        <div style={s.progress}>
                          <div style={{ ...s.progressFill, width: `${cutPct}%`, background: cutPct === 100 ? '#22c55e' : '#0ea5e9' }} />
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{it.zuschnitt}</div>
                      </div>
                      <div>{it.gestell || '-'}</div>
                      <div><span style={statusBadge(it.status)}>{it.status}</span></div>
                      <div>
                        <span style={{ display: 'inline-block', borderRadius: 999, padding: '2px 8px', fontSize: 11, fontWeight: 700, background: '#e0f2fe', color: '#0c4a6e' }}>
                          S-{String(it.schirmerSequence || '-').padStart(2, '0')}
                        </span>
                      </div>
                      <div />
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section style={s.section}>
            <div style={s.sectionTitle}>Abgeschlossene Aufträge</div>
            {demo.done.map((row) => (
              <div key={row.id} style={{ ...s.row, ...s.rowLight }}>
                <button style={{ ...s.expandBtn, color: '#1f2937' }}>›</button>
                <div>
                  <div style={s.rowHeaderLight}>Projekt</div>
                  <div>{row.project}</div>
                </div>
                <div>
                  <div style={s.rowHeaderLight}>Bauteilliste</div>
                  <div>{row.bom}</div>
                </div>
                <div>
                  <div style={s.rowHeaderLight}>Gefertigt</div>
                  <div>{row.done}</div>
                </div>
                <div>
                  <div style={s.rowHeaderLight}>Geplanter Beginn</div>
                  <div>{row.planned}</div>
                </div>
                <div>
                  <div style={s.rowHeaderLight}>Endzeit</div>
                  <div>{row.finished}</div>
                </div>
              </div>
            ))}
          </section>
        </main>
      </div>
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



