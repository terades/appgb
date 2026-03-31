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

const STORE_KEY = 'feinplanung_v5';
const LOCAL_KEY = 'reihenfolgeplanung_v1';
const MACHINE_CAP = 120;
const LINE_CAP = 120;

const machines = [
  { id: 'schirmer-41', name: 'Schirmer 4.1', hall: '4.1' },
  { id: 'dgs', name: 'DGS', hall: '4.1' },
  { id: 'schirmer-43', name: 'Schirmer 4.3', hall: '4.3' },
];

const lines = [
  { id: 'fensterlinie', name: 'Fensterlinie', hall: '4.1' },
  { id: 'fluegellinie-41', name: 'Fluegellinie 4.1', hall: '4.1' },
  { id: 'tuerenlinie', name: 'Tuerenlinie', hall: '4.1' },
  { id: 'vorbereitung', name: 'Vorbereitung', hall: '4.1' },
  { id: 'fassaden', name: 'Fassaden', hall: '4.1' },
  { id: 'flexlinie', name: 'Flexlinie', hall: '4.3' },
  { id: 'fluegellinie-43', name: 'Fluegellinie 4.3', hall: '4.3' },
  { id: 'awe-linie', name: 'AWE-Linie', hall: '4.3' },
];

const linePref = {
  Fenster: ['fensterlinie', 'fluegellinie-41', 'fluegellinie-43'],
  Tueren: ['tuerenlinie', 'vorbereitung'],
  Fassaden: ['fassaden', 'flexlinie'],
  AWE: ['awe-linie', 'flexlinie'],
  Fluegel: ['fluegellinie-41', 'fluegellinie-43', 'fensterlinie'],
};

const s = {
  page: { minHeight: '100vh', background: '#eef2f7', padding: 18, fontFamily: 'Segoe UI, sans-serif', color: '#0f172a' },
  card: { background: '#ffffff', border: '1px solid #d7dde6', borderRadius: 10, padding: 12, boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)' },
  header: { background: 'linear-gradient(90deg, #2aa7dc 0%, #4cbce8 100%)', color: '#fff', borderRadius: 10, padding: '12px 14px', fontWeight: 700, fontSize: 26, textAlign: 'center' },
  sectionTitle: { fontWeight: 700, marginBottom: 8, fontSize: 15 },
  label: { display: 'block', fontSize: 12, color: '#475569', marginBottom: 4 },
  input: { width: '100%', border: '1px solid #c7d0dc', borderRadius: 7, padding: '7px 9px', fontSize: 13, background: '#fff' },
  button: { border: '1px solid #b9c6d5', borderRadius: 7, background: '#fff', padding: '7px 10px', cursor: 'pointer', fontSize: 13 },
  primaryButton: { border: '1px solid #2a92c2', borderRadius: 7, background: '#e8f6fd', color: '#0f5f84', padding: '7px 10px', cursor: 'pointer', fontSize: 13, fontWeight: 700 },
  badge: { display: 'inline-block', borderRadius: 999, padding: '2px 8px', fontSize: 11, fontWeight: 700 },
  grid: { display: 'grid', gap: 10 },
  subtleCard: { border: '1px solid #e2e8f0', borderRadius: 8, padding: 8, background: '#fafcff' },
  tableHeader: { display: 'grid', gridTemplateColumns: '0.9fr 1.5fr 1fr 1fr 0.6fr 0.8fr 0.8fr auto', gap: 6, background: '#f1f5f9', fontSize: 11, fontWeight: 700, padding: 6, borderBottom: '1px solid #e2e8f0', alignItems: 'center', whiteSpace: 'nowrap' },
  rowItem: { display: 'grid', gridTemplateColumns: '0.9fr 1.5fr 1fr 1fr 0.6fr 0.8fr 0.8fr auto', gap: 6, borderTop: '1px solid #e2e8f0', padding: 6, alignItems: 'center' },
  meta: { fontSize: 12, color: '#64748b' },
  compactCard: { border: '1px solid #e2e8f0', borderRadius: 8, padding: 8, background: '#fff', boxShadow: '0 1px 2px rgba(15,23,42,0.05)' },
  compactRow: { display: 'grid', gridTemplateColumns: '1fr auto', gap: 6, alignItems: 'center' },
  successBadge: { display: 'inline-block', borderRadius: 999, padding: '2px 8px', fontSize: 11, fontWeight: 700, background: '#dcfce7', color: '#166534' },
  warnBadge: { display: 'inline-block', borderRadius: 999, padding: '2px 8px', fontSize: 11, fontWeight: 700, background: '#fee2e2', color: '#991b1b' },
  capBar: { height: 6, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' },
  capFill: { height: '100%', borderRadius: 999 },
  dangerCard: { border: '1px solid #fecaca', background: '#fef2f2' },
  dangerText: { color: '#991b1b' },
  dayGroupHeader: { fontSize: 11, fontWeight: 700, padding: '6px 6px 4px', color: '#334155', background: '#f8fafc', borderTop: '1px solid #e2e8f0', gridColumn: '1 / -1' },
};

function loadFeinItems() {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(STORE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

function isoToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(iso, days) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getIsoWeek(dateIso) {
  const d = new Date(`${dateIso}T00:00:00`);
  const u = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = u.getUTCDay() || 7;
  u.setUTCDate(u.getUTCDate() + 4 - day);
  const ys = new Date(Date.UTC(u.getUTCFullYear(), 0, 1));
  return Math.ceil((((u - ys) / 86400000) + 1) / 7);
}

function getIsoWeekDates(week, year) {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const day = jan4.getUTCDay() || 7;
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setUTCDate(jan4.getUTCDate() - day + 1);
  const mondayTarget = new Date(mondayWeek1);
  mondayTarget.setUTCDate(mondayWeek1.getUTCDate() + ((week - 1) * 7));
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(mondayTarget);
    d.setUTCDate(mondayTarget.getUTCDate() + i);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  });
}

function dayName(iso) {
  return ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][new Date(`${iso}T00:00:00`).getDay()];
}

function makeDemoTerminverschiebungen(finalDate, count) {
  if (!finalDate || count <= 0) return [];
  const history = [];
  for (let i = count; i >= 1; i -= 1) {
    const fromValue = addDays(finalDate, -i);
    const toValue = addDays(finalDate, -(i - 1));
    const hour = String(8 + ((count - i) % 3)).padStart(2, '0');
    const minute = String(10 + i).padStart(2, '0');
    history.push({
      id: `demo-tag-${finalDate}-${i}`,
      fieldKey: 'tag',
      label: 'Abruftermin',
      fromValue,
      toValue,
      changedBy: i % 2 === 0 ? 'AV Demo' : 'AV Planung Demo',
      bereich: 'Reihenfolgeplanung',
      changedAt: `${toValue}T${hour}:${minute}:00.000Z`,
    });
  }
  return history;
}

function makeDemoItems() {
  const today = isoToday();
  const currentWeek = getIsoWeek(today);
  const currentYear = Number(today.slice(0, 4));
  const currentWeekDays = getIsoWeekDates(currentWeek, currentYear);
  const base = [];
  for (let i = 1; i <= 40; i += 1) {
    const tag = addDays(today, i % 6);
    const shiftCount = i % 13 === 0 ? 3 : (i % 7 === 0 ? 2 : (i % 4 === 0 ? 1 : 0));
    base.push({
      itemId: `DEMO-M-${String(i).padStart(2, '0')}`,
      projekt: `PRJ-M-${String(i).padStart(2, '0')}`,
      produkt: ['Fenster', 'Tueren', 'Fassaden', 'AWE', 'Fluegel'][i % 5],
      stueck: 10 + (i % 7) * 4,
      zuschnittszeit: 30 + (i % 6) * 10,
      produktionszeit: 24 + (i % 5) * 9,
      tag,
      lineId: '',
      machineId: '',
      external: false,
      terminverschiebungen: makeDemoTerminverschiebungen(tag, shiftCount),
    });
  }
  for (let i = 1; i <= 18; i += 1) {
    const tag = addDays(today, (i + 1) % 6);
    const shiftCount = i % 9 === 0 ? 3 : (i % 5 === 0 ? 2 : (i % 3 === 0 ? 1 : 0));
    base.push({
      itemId: `DEMO-L-${String(i).padStart(2, '0')}`,
      projekt: `PRJ-L-${String(i).padStart(2, '0')}`,
      produkt: ['Fenster', 'Tueren', 'Fassaden', 'AWE', 'Fluegel'][(i + 2) % 5],
      stueck: 12 + (i % 5) * 5,
      zuschnittszeit: 22 + (i % 4) * 10,
      produktionszeit: 25 + (i % 4) * 12,
      tag,
      machineId: '',
      lineId: '',
      external: false,
      terminverschiebungen: makeDemoTerminverschiebungen(tag, shiftCount),
    });
  }
  for (let i = 1; i <= 20; i += 1) {
    const tag = addDays(today, (i + 2) % 6);
    const shiftCount = i % 10 === 0 ? 3 : (i % 6 === 0 ? 2 : (i % 2 === 0 ? 1 : 0));
    base.push({
      itemId: `DEMO-U-${String(i).padStart(2, '0')}`,
      projekt: `PRJ-U-${String(i).padStart(2, '0')}`,
      produkt: ['Fenster', 'Tueren', 'Fassaden', 'AWE', 'Fluegel'][(i + 1) % 5],
      stueck: 8 + (i % 6) * 3,
      zuschnittszeit: 16 + (i % 5) * 8,
      produktionszeit: 20 + (i % 5) * 9,
      tag,
      lineId: '',
      machineId: '',
      external: false,
      terminverschiebungen: makeDemoTerminverschiebungen(tag, shiftCount),
    });
  }
  for (let i = 1; i <= 36; i += 1) {
    const tag = currentWeekDays[(i - 1) % currentWeekDays.length];
    const shiftCount = i % 11 === 0 ? 3 : (i % 6 === 0 ? 2 : (i % 3 === 0 ? 1 : 0));
    base.push({
      itemId: `DEMO-KW-${String(i).padStart(2, '0')}`,
      projekt: `PRJ-KW-${String(i).padStart(2, '0')}`,
      produkt: ['Fenster', 'Tueren', 'Fassaden', 'AWE', 'Fluegel'][i % 5],
      stueck: 14 + (i % 8) * 4,
      zuschnittszeit: 26 + (i % 6) * 9,
      produktionszeit: 28 + (i % 5) * 10,
      tag,
      lineId: '',
      machineId: '',
      external: false,
      terminverschiebungen: makeDemoTerminverschiebungen(tag, shiftCount),
    });
  }
  return base;
}

function normalizeItems(items) {
  return items.map((it, index) => ({
    itemId: it.itemId || `ITEM-${index + 1}`,
    projekt: it.projekt || '-',
    produkt: it.produkt || '-',
    stueck: Number(it.stueck) || 0,
    zuschnittszeit: Number(it.zuschnittszeit ?? it.stunden) || 0,
    produktionszeit: Number(it.produktionszeit ?? it.stunden) || 0,
    ursprungsZuschnittszeit: Number.isFinite(Number(it.ursprungsZuschnittszeit))
      ? Number(it.ursprungsZuschnittszeit)
      : (Number.isFinite(Number(it.ursprungsGeplanteStunden))
        ? Number(it.ursprungsGeplanteStunden)
        : (Number(it.zuschnittszeit ?? it.stunden) || 0)),
    ursprungsProduktionszeit: Number.isFinite(Number(it.ursprungsProduktionszeit))
      ? Number(it.ursprungsProduktionszeit)
      : (Number.isFinite(Number(it.ursprungsGeplanteStunden))
        ? Number(it.ursprungsGeplanteStunden)
        : (Number(it.produktionszeit ?? it.stunden) || 0)),
    zuschnittszeitNachgebessertVon: it.zuschnittszeitNachgebessertVon || it.stundenNachgebessertVon || '',
    zuschnittszeitNachgebessertAm: it.zuschnittszeitNachgebessertAm || it.stundenNachgebessertAm || '',
    produktionszeitNachgebessertVon: it.produktionszeitNachgebessertVon || it.stundenNachgebessertVon || '',
    produktionszeitNachgebessertAm: it.produktionszeitNachgebessertAm || it.stundenNachgebessertAm || '',
    kw: it.kw,
    tag: it.tag,
    lineId: it.lineId || '',
    external: Boolean(it.external),
    machineId: it.machineId || '',
    machineSort: typeof it.machineSort === 'number' ? it.machineSort : undefined,
    lineSort: typeof it.lineSort === 'number' ? it.lineSort : (typeof it.sort === 'number' ? it.sort : undefined),
    releasedAt: it.releasedAt || '',
    terminverschiebungen: Array.isArray(it.terminverschiebungen) ? it.terminverschiebungen : [],
  }));
}

function getOriginalZuschnittszeit(it) {
  const val = Number(it?.ursprungsZuschnittszeit);
  return Number.isFinite(val) ? val : (Number(it?.zuschnittszeit) || 0);
}

function getOriginalProduktionszeit(it) {
  const val = Number(it?.ursprungsProduktionszeit);
  return Number.isFinite(val) ? val : (Number(it?.produktionszeit) || 0);
}

function isZuschnittszeitNachgebessert(it) {
  return (Number(it?.zuschnittszeit) || 0) !== getOriginalZuschnittszeit(it);
}

function isProduktionszeitNachgebessert(it) {
  return (Number(it?.produktionszeit) || 0) !== getOriginalProduktionszeit(it);
}

function resetAssignments(items) {
  return items.map((it) => ({ ...it, machineId: '', lineId: '', machineSort: undefined, lineSort: undefined, releasedAt: '' }));
}

function sortByMachine(arr) {
  return [...arr].sort((a, b) => (a.machineSort ?? Number.MAX_SAFE_INTEGER) - (b.machineSort ?? Number.MAX_SAFE_INTEGER) || a.itemId.localeCompare(b.itemId));
}

function sortByLine(arr) {
  return [...arr].sort((a, b) => (a.lineSort ?? Number.MAX_SAFE_INTEGER) - (b.lineSort ?? Number.MAX_SAFE_INTEGER) || a.itemId.localeCompare(b.itemId));
}

function preferredLineId(produkt) {
  const prefs = linePref[produkt] || [];
  return prefs.find((id) => lines.some((l) => l.id === id)) || lines[0]?.id || '';
}

function lineName(id) {
  return lines.find((l) => l.id === id)?.name || '-';
}

function syncLineSortByMachine(nextItems, lineId) {
  const lineItems = nextItems.filter((x) => x.lineId === lineId);
  const ordered = [...lineItems].sort((a, b) => (a.machineSort ?? Number.MAX_SAFE_INTEGER) - (b.machineSort ?? Number.MAX_SAFE_INTEGER) || a.itemId.localeCompare(b.itemId));
  const map = {}; ordered.forEach((x, i) => { map[x.itemId] = i; });
  return nextItems.map((it) => (it.lineId === lineId && map[it.itemId] !== undefined ? { ...it, lineSort: map[it.itemId] } : it));
}

function productStyle(produkt) {
  const map = {
    Fenster: { background: '#e0f2fe', color: '#075985' },
    Tueren: { background: '#fee2e2', color: '#991b1b' },
    Fassaden: { background: '#ede9fe', color: '#5b21b6' },
    AWE: { background: '#dcfce7', color: '#166534' },
    Fluegel: { background: '#ffedd5', color: '#9a3412' },
  };
  return map[produkt] || { background: '#f1f5f9', color: '#334155' };
}

function productCardStyle(produkt) {
  const map = {
    Fenster: { background: '#f0f9ff', borderColor: '#bae6fd' },
    Tueren: { background: '#fef2f2', borderColor: '#fecaca' },
    Fassaden: { background: '#f5f3ff', borderColor: '#ddd6fe' },
    AWE: { background: '#f0fdf4', borderColor: '#bbf7d0' },
    Fluegel: { background: '#fff7ed', borderColor: '#fed7aa' },
  };
  return map[produkt] || { background: '#f8fafc', borderColor: '#e2e8f0' };
}

function buildScheduleByResource(items, resourceKey, sortKey, days, capPerDay, fallbackDay, hoursKey) {
  const schedule = {};
  const dayIndex = {};
  days.forEach((d, i) => { dayIndex[d] = i; });
  const itemsByRes = {};
  items.forEach((it) => {
    const id = it[resourceKey];
    if (!id) return;
    if (!itemsByRes[id]) itemsByRes[id] = [];
    itemsByRes[id].push(it);
  });

  Object.entries(itemsByRes).forEach(([id, list]) => {
    const ordered = [...list].sort((a, b) => (a[sortKey] ?? Number.MAX_SAFE_INTEGER) - (b[sortKey] ?? Number.MAX_SAFE_INTEGER) || a.itemId.localeCompare(b.itemId));
    const remainingPerDay = {};
    const dayTotals = {};
    const dayItems = {};
    days.forEach((d) => {
      remainingPerDay[d] = capPerDay;
      dayTotals[d] = 0;
      dayItems[d] = [];
    });

    ordered.forEach((it) => {
      const totalHours = Number(it[hoursKey]) || 0;
      let remaining = totalHours;
      const startIso = it.tag || fallbackDay || days[0];
      let idx = dayIndex[startIso];
      if (idx === undefined) {
        idx = startIso < days[0] ? 0 : days.length - 1;
      }
      while (remaining > 0 && idx < days.length) {
        const day = days[idx];
        const available = remainingPerDay[day];
        const take = available > 0 ? Math.min(remaining, available) : 0;
        if (take === 0) {
          idx += 1;
          continue;
        }
        remainingPerDay[day] = available - take;
        remaining -= take;
        dayTotals[day] += take;
        dayItems[day].push({ item: it, hours: take, day, totalHours });
      }
      if (remaining > 0) {
        const lastDay = days[days.length - 1];
        dayTotals[lastDay] += remaining;
        remainingPerDay[lastDay] -= remaining;
        dayItems[lastDay].push({ item: it, hours: remaining, day: lastDay, overflow: true, totalHours });
      }
    });

    schedule[id] = { dayTotals, dayItems };
  });

  return schedule;
}

export default function Reihenfolgeplanung() {
  const feinItems = useMemo(() => {
    const loaded = loadFeinItems();
    const source = loaded.length ? loaded : makeDemoItems();
    return resetAssignments(normalizeItems(source));
  }, []);
  const saved = typeof window !== 'undefined' ? window.localStorage.getItem(LOCAL_KEY) : null;
  const parsed = saved ? JSON.parse(saved) : null;
  const [items, setItems] = useState(resetAssignments(parsed?.items || feinItems));
  const [hallFilter, setHallFilter] = useState(parsed?.hallFilter || 'alle');
  const [dateFilter, setDateFilter] = useState(parsed?.dateFilter || items.find((it) => it.tag)?.tag || isoToday());
  const [viewMode, setViewMode] = useState(parsed?.viewMode || 'tag');
  const [planView, setPlanView] = useState(parsed?.planView || 'maschinen');
  const [drag, setDrag] = useState(null);
  const [drop, setDrop] = useState(null);
  const [terminModal, setTerminModal] = useState(null);

  function persist(nextItems, nextHall = hallFilter, nextDate = dateFilter, nextView = viewMode, nextPlan = planView) {
    setItems(nextItems);
    setHallFilter(nextHall);
    setDateFilter(nextDate);
    setViewMode(nextView);
    setPlanView(nextPlan);
    if (typeof window !== 'undefined') window.localStorage.setItem(LOCAL_KEY, JSON.stringify({
      items: nextItems,
      hallFilter: nextHall,
      dateFilter: nextDate,
      viewMode: nextView,
      planView: nextPlan,
    }));
  }

  function updateItem(itemId, changes) {
    let next = items.map((it) => {
      if (it.itemId !== itemId) return it;
      const merged = { ...it, ...changes };
      if (Object.prototype.hasOwnProperty.call(changes, 'tag')) {
        return withTerminverschiebung(merged, {
          fieldKey: 'tag',
          label: 'Abruftermin',
          fromValue: it.tag || '',
          toValue: changes.tag || '',
          changedBy: 'AV',
          bereich: 'Reihenfolgeplanung',
        });
      }
      return merged;
    });
    if (changes.machineId) {
      const updated = next.find((it) => it.itemId === itemId);
      if (updated?.lineId) next = syncLineSortByMachine(next, updated.lineId);
    }
    persist(next);
  }

  function dropOnMachine(targetMachineId, targetItemId = null) {
    if (!drag || drag.kind !== 'machine') return;
    const dragged = items.find((x) => x.itemId === drag.itemId);
    if (!dragged) return;
    const autoLineId = preferredLineId(dragged.produkt);
    const targetTag = dateFilter;
    let next = items.map((it) => {
      if (it.itemId !== dragged.itemId) return it;
      const updated = { ...it, machineId: targetMachineId, lineId: autoLineId, tag: targetTag };
      return withTerminverschiebung(updated, {
        fieldKey: 'tag',
        label: 'Abruftermin',
        fromValue: it.tag || '',
        toValue: targetTag || '',
        changedBy: 'AV Planung',
        bereich: 'Reihenfolgeplanung',
      });
    });
    const target = sortByMachine(next.filter((x) => x.machineId === targetMachineId && x.itemId !== dragged.itemId));
    const insertAt = targetItemId ? Math.max(0, target.findIndex((x) => x.itemId === targetItemId)) : target.length;
    target.splice(insertAt, 0, { ...dragged, machineId: targetMachineId, lineId: autoLineId, tag: targetTag });
    const map = {}; target.forEach((x, i) => { map[x.itemId] = i; });
    next = next.map((it) => (it.machineId === targetMachineId && map[it.itemId] !== undefined ? { ...it, machineSort: map[it.itemId] } : it));
    const lineTarget = sortByLine(next.filter((x) => x.lineId === autoLineId && x.itemId !== dragged.itemId));
    lineTarget.splice(lineTarget.length, 0, { ...dragged, lineId: autoLineId });
    const lmap = {}; lineTarget.forEach((x, i) => { lmap[x.itemId] = i; });
    next = next.map((it) => (it.lineId === autoLineId && lmap[it.itemId] !== undefined ? { ...it, lineSort: lmap[it.itemId] } : it));
    if (drag.sourceId) {
      const source = sortByMachine(next.filter((x) => x.machineId === drag.sourceId));
      const smap = {}; source.forEach((x, i) => { smap[x.itemId] = i; });
      next = next.map((it) => (it.machineId === drag.sourceId && smap[it.itemId] !== undefined ? { ...it, machineSort: smap[it.itemId] } : it));
    }
    next = syncLineSortByMachine(next, autoLineId);
    if (drag.sourceId !== targetMachineId) {
      const prev = items.find((x) => x.itemId === dragged.itemId)?.lineId;
      if (prev && prev !== autoLineId) next = syncLineSortByMachine(next, prev);
    }
    persist(next);
    setDrag(null); setDrop(null);
  }

  function dropOnLine(targetLineId, targetItemId = null) {
    if (!drag || drag.kind !== 'line') return;
    const dragged = items.find((x) => x.itemId === drag.itemId);
    if (!dragged) return;
    let next = items.map((it) => (it.itemId === dragged.itemId ? { ...it, lineId: targetLineId } : it));
    const target = sortByLine(next.filter((x) => x.lineId === targetLineId && x.itemId !== dragged.itemId));
    const insertAt = targetItemId ? Math.max(0, target.findIndex((x) => x.itemId === targetItemId)) : target.length;
    target.splice(insertAt, 0, { ...dragged, lineId: targetLineId });
    const map = {}; target.forEach((x, i) => { map[x.itemId] = i; });
    next = next.map((it) => (it.lineId === targetLineId && map[it.itemId] !== undefined ? { ...it, lineSort: map[it.itemId] } : it));
    const source = sortByLine(next.filter((x) => x.lineId === drag.sourceId));
    const smap = {}; source.forEach((x, i) => { smap[x.itemId] = i; });
    next = next.map((it) => (it.lineId === drag.sourceId && smap[it.itemId] !== undefined ? { ...it, lineSort: smap[it.itemId] } : it));
    persist(next);
    setDrag(null); setDrop(null);
  }

  function dropOnUnassigned() {
    if (!drag || drag.kind !== 'machine') return;
    const dragged = items.find((x) => x.itemId === drag.itemId);
    if (!dragged) return;
    let next = items.map((it) => (it.itemId === dragged.itemId ? {
      ...it,
      machineId: '',
      lineId: '',
      machineSort: undefined,
      lineSort: undefined,
    } : it));
    if (drag.sourceId) {
      const source = sortByMachine(next.filter((x) => x.machineId === drag.sourceId));
      const smap = {}; source.forEach((x, i) => { smap[x.itemId] = i; });
      next = next.map((it) => (it.machineId === drag.sourceId && smap[it.itemId] !== undefined ? { ...it, machineSort: smap[it.itemId] } : it));
    }
    persist(next);
    setDrag(null); setDrop(null);
  }

  function removeFromPlanning(itemId) {
    let next = items.map((it) => (it.itemId === itemId ? {
      ...it,
      machineId: '',
      lineId: '',
      machineSort: undefined,
      lineSort: undefined,
    } : it));
    const removed = items.find((it) => it.itemId === itemId);
    if (removed?.machineId) {
      const source = sortByMachine(next.filter((x) => x.machineId === removed.machineId));
      const smap = {}; source.forEach((x, i) => { smap[x.itemId] = i; });
      next = next.map((it) => (it.machineId === removed.machineId && smap[it.itemId] !== undefined ? { ...it, machineSort: smap[it.itemId] } : it));
    }
    persist(next);
  }

  function canReleaseItem(it) {
    if (!it.machineId || !it.lineId) return false;
    const machineTotals = machineSchedule[it.machineId]?.dayTotals || {};
    const lineTotals = lineSchedule[it.lineId]?.dayTotals || {};
    const machineOver = Object.values(machineTotals).some((h) => h > MACHINE_CAP);
    const lineOver = Object.values(lineTotals).some((h) => h > LINE_CAP);
    return !machineOver && !lineOver;
  }

  function toggleReleaseItem(itemId) {
    const now = new Date().toISOString();
    const next = items.map((it) => {
      if (it.itemId !== itemId) return it;
      if (it.releasedAt) return { ...it, releasedAt: '' };
      if (!canReleaseItem(it)) return it;
      return { ...it, releasedAt: now };
    });
    persist(next);
  }

  function releaseAll() {
    const now = new Date().toISOString();
    const next = items.map((it) => {
      if (!isInView(it)) return it;
      if (!canReleaseItem(it)) return it;
      return { ...it, releasedAt: it.releasedAt || now };
    });
    persist(next);
  }

  function revokeAll() {
    const next = items.map((it) => {
      return isInView(it) ? { ...it, releasedAt: '' } : it;
    });
    persist(next);
  }

  const visibleMachines = machines.filter((m) => hallFilter === 'alle' || m.hall === hallFilter);
  const visibleLines = lines.filter((l) => hallFilter === 'alle' || l.hall === hallFilter);
  const weekNumber = getIsoWeek(dateFilter);
  const weekYear = Number(dateFilter.slice(0, 4));
  const weekDays = getIsoWeekDates(weekNumber, weekYear);
  const planningDays = useMemo(() => (viewMode === 'kw'
    ? weekDays
    : [dateFilter, addDays(dateFilter, 1), addDays(dateFilter, 2), addDays(dateFilter, 3), addDays(dateFilter, 4), addDays(dateFilter, 5)]
  ), [viewMode, weekDays, dateFilter]);
  const inWeek = (it) => !it.tag || (getIsoWeek(it.tag) === weekNumber && Number(it.tag.slice(0, 4)) === weekYear);
  const weekItems = items.filter((it) => inWeek(it));
  const isInView = (it) => (viewMode === 'kw' ? inWeek(it) : (!it.tag || it.tag === dateFilter));
  const filteredItems = items.filter((it) => isInView(it));
  const machineSchedule = useMemo(
    () => buildScheduleByResource(filteredItems, 'machineId', 'machineSort', planningDays, MACHINE_CAP, dateFilter, 'zuschnittszeit'),
    [filteredItems, planningDays, dateFilter],
  );
  const lineSchedule = useMemo(
    () => buildScheduleByResource(filteredItems, 'lineId', 'lineSort', planningDays, LINE_CAP, dateFilter, 'produktionszeit'),
    [filteredItems, planningDays, dateFilter],
  );
  const unassigned = sortByMachine(filteredItems.filter((it) => !it.machineId));
  const weekSummary = useMemo(() => {
    if (viewMode !== 'kw') return [];
    return weekDays.map((iso) => {
      const ids = new Set();
      let hours = 0;
      Object.values(machineSchedule).forEach((ms) => {
        const segments = ms?.dayItems?.[iso] || [];
        segments.forEach((seg) => {
          ids.add(seg.item.itemId);
          hours += seg.hours;
        });
      });
      return { iso, count: ids.size, hours };
    });
  }, [viewMode, weekDays, machineSchedule]);

  const activeDay = dateFilter;
  const machineStats = useMemo(() => {
    const map = {};
    machines.forEach((m) => { map[m.id] = { hours: 0, mix: {} }; });
    machines.forEach((m) => {
      const segments = machineSchedule[m.id]?.dayItems?.[activeDay] || [];
      const mix = {};
      let hours = 0;
      segments.forEach((seg) => {
        hours += seg.hours;
        mix[seg.item.produkt] = (mix[seg.item.produkt] || 0) + seg.hours;
      });
      map[m.id] = { hours, mix };
    });
    return map;
  }, [machineSchedule, activeDay]);

  const lineStats = useMemo(() => {
    const map = {};
    lines.forEach((l) => { map[l.id] = { hours: 0, mix: {} }; });
    lines.forEach((l) => {
      const segments = lineSchedule[l.id]?.dayItems?.[activeDay] || [];
      const mix = {};
      let hours = 0;
      segments.forEach((seg) => {
        hours += seg.hours;
        mix[seg.item.produkt] = (mix[seg.item.produkt] || 0) + seg.hours;
      });
      map[l.id] = { hours, mix };
    });
    return map;
  }, [lineSchedule, activeDay]);

  const overloadedLines = useMemo(() => {
    return lines
      .map((l) => {
        const totals = lineSchedule[l.id]?.dayTotals || {};
        const over = Object.values(totals).some((h) => h > LINE_CAP);
        const used = Math.max(0, ...Object.values(totals));
        return over ? { ...l, used } : null;
      })
      .filter(Boolean);
  }, [lineSchedule]);

  const overloadedMachines = useMemo(() => {
    return machines
      .map((m) => {
        const totals = machineSchedule[m.id]?.dayTotals || {};
        const over = Object.values(totals).some((h) => h > MACHINE_CAP);
        const used = Math.max(0, ...Object.values(totals));
        return over ? { ...m, used } : null;
      })
      .filter(Boolean);
  }, [machineSchedule]);

  const rebalanceSuggestions = useMemo(() => {
    const suggestions = [];
    const capacityByLine = {};
    lines.forEach((l) => { capacityByLine[l.id] = LINE_CAP; });
    const loadByLine = {};
    lines.forEach((l) => { loadByLine[l.id] = lineStats[l.id]?.hours || 0; });
    const freeByLine = {};
    lines.forEach((l) => { freeByLine[l.id] = Math.max(0, capacityByLine[l.id] - loadByLine[l.id]); });

    overloadedLines.forEach((ol) => {
    const lineItems = sortByLine(filteredItems.filter((it) => it.lineId === ol.id));
      const candidates = lineItems.slice().sort((a, b) => b.produktionszeit - a.produktionszeit);
      candidates.forEach((it) => {
        if (loadByLine[ol.id] <= LINE_CAP) return;
        const pref = (linePref[it.produkt] || []).filter((id) => id !== ol.id);
        const target = pref.find((id) => freeByLine[id] >= it.produktionszeit);
        if (!target) return;
        suggestions.push({
          itemId: it.itemId,
          produkt: it.produkt,
          from: ol.id,
          to: target,
          produktionszeit: it.produktionszeit,
        });
        loadByLine[ol.id] -= it.produktionszeit;
        freeByLine[ol.id] = Math.max(0, LINE_CAP - loadByLine[ol.id]);
        loadByLine[target] += it.produktionszeit;
        freeByLine[target] = Math.max(0, LINE_CAP - loadByLine[target]);
      });
    });
    return suggestions.slice(0, 8);
  }, [filteredItems, lineStats, overloadedLines]);

  function applyAutoPlan() {
    const pool = filteredItems.filter((it) => !it.machineId);
    if (pool.length === 0) return;
    const orderedPool = [...pool].sort((a, b) => a.produkt.localeCompare(b.produkt) || b.zuschnittszeit - a.zuschnittszeit);
    const buckets = new Map();
    orderedPool.forEach((it) => {
      if (!buckets.has(it.produkt)) buckets.set(it.produkt, []);
      buckets.get(it.produkt).push(it);
    });
    const machineIds = visibleMachines.map((m) => m.id);
    if (machineIds.length === 0) return;
    let next = [...items];
    const machineLoad = {};
    machineIds.forEach((id) => { machineLoad[id] = 0; });
    next.forEach((it) => {
      if (it.machineId && machineIds.includes(it.machineId)) machineLoad[it.machineId] += it.zuschnittszeit;
    });
    const takeOrder = [];
    let added = true;
    while (added) {
      added = false;
      buckets.forEach((list) => {
        if (list.length > 0) {
          takeOrder.push(list.shift());
          added = true;
        }
      });
    }
    takeOrder.forEach((it) => {
      const target = machineIds.slice().sort((a, b) => machineLoad[a] - machineLoad[b])[0];
      machineLoad[target] += it.zuschnittszeit;
      next = next.map((x) => (x.itemId === it.itemId ? { ...x, machineId: target, lineId: preferredLineId(it.produkt), tag: dateFilter } : x));
      const targetItems = sortByMachine(next.filter((x) => x.machineId === target));
      targetItems.forEach((x, i) => { next = next.map((it2) => (it2.itemId === x.itemId ? { ...it2, machineSort: i } : it2)); });
      const lineId = preferredLineId(it.produkt);
      next = syncLineSortByMachine(next, lineId);
    });
    persist(next);
  }

  const dayItemIds = useMemo(() => {
    const ids = new Set();
    Object.values(machineSchedule).forEach((ms) => {
      (ms?.dayItems?.[activeDay] || []).forEach((seg) => ids.add(seg.item.itemId));
    });
    return ids;
  }, [machineSchedule, activeDay]);
  const plannedCount = dayItemIds.size;
  const releasedCount = filteredItems.filter((it) => it.releasedAt && dayItemIds.has(it.itemId)).length;
  const canReleaseAll = overloadedLines.length === 0 && overloadedMachines.length === 0;

  return (
    <div style={s.page}>
      <div style={s.header}>Reihenfolgeplanung</div>

      <div style={{ ...s.card, marginTop: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 240px) minmax(180px, 220px) minmax(150px, 210px) minmax(170px, 220px) 1fr auto', gap: 10, alignItems: 'center' }}>
          <div>
            <div style={s.label}>Halle</div>
            <select style={s.input} value={hallFilter} onChange={(e) => persist(items, e.target.value, dateFilter, viewMode)}>
              <option value="alle">Alle</option>
              <option value="4.1">Halle 4.1</option>
              <option value="4.3">Halle 4.3</option>
            </select>
          </div>
          <div>
            <div style={s.label}>Datum</div>
            <input style={s.input} type="date" value={dateFilter} onChange={(e) => persist(items, hallFilter, e.target.value, viewMode)} />
          </div>
          <div>
            <div style={s.label}>Ansicht</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                style={viewMode === 'tag' ? s.primaryButton : s.button}
                onClick={() => persist(items, hallFilter, dateFilter, 'tag')}
              >
                Tag
              </button>
              <button
                style={viewMode === 'kw' ? s.primaryButton : s.button}
                onClick={() => persist(items, hallFilter, dateFilter, 'kw')}
              >
                KW
              </button>
            </div>
          </div>
          <div>
            <div style={s.label}>Planung</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                style={planView === 'maschinen' ? s.primaryButton : s.button}
                onClick={() => persist(items, hallFilter, dateFilter, viewMode, 'maschinen')}
              >
                Maschinen
              </button>
              <button
                style={planView === 'linien' ? s.primaryButton : s.button}
                onClick={() => persist(items, hallFilter, dateFilter, viewMode, 'linien')}
              >
                Linien
              </button>
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {viewMode === 'kw' ? `KW ${weekNumber} (${weekDays[0]} bis ${weekDays[weekDays.length - 1]})` : 'Filter wirkt auf Maschinen- und Linienlisten (optional nach Datum).'}
            <div style={{ marginTop: 4 }}>
              Zeitlogik: <strong>Zuschnittszeit = Maschine</strong> | <strong>Produktionszeit = Linie</strong>
            </div>
            {viewMode === 'kw' && (
              <>
                <div style={{ marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button style={s.button} onClick={() => persist(items, hallFilter, addDays(dateFilter, -7), viewMode)}>Vorherige KW</button>
                  <button style={s.button} onClick={() => persist(items, hallFilter, addDays(dateFilter, 7), viewMode)}>Nächste KW</button>
                </div>
                <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(130px, 1fr))', gap: 6 }}>
                  {weekSummary.map((d) => {
                    const isActive = d.iso === dateFilter;
                    return (
                      <button
                        key={d.iso}
                        style={isActive ? s.primaryButton : s.button}
                        onClick={() => persist(items, hallFilter, d.iso, viewMode)}
                      >
                        {dayName(d.iso)} {d.iso} · {d.count} Pos. · {d.hours} h
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <span style={s.badge}>Geplant: {plannedCount}</span>
            <span style={releasedCount ? s.successBadge : s.warnBadge}>Freigabe: {releasedCount}</span>
            <span style={overloadedLines.length ? s.warnBadge : s.successBadge}>
              Überlastete Linien: {overloadedLines.length}
            </span>
            <span style={overloadedMachines.length ? s.warnBadge : s.successBadge}>
              Überlastete Maschinen: {overloadedMachines.length}
            </span>
            <button
              style={canReleaseAll ? s.primaryButton : { ...s.primaryButton, opacity: 0.5, cursor: 'not-allowed' }}
              disabled={!canReleaseAll}
              onClick={releaseAll}
              title={canReleaseAll ? '' : 'Freigabe nur möglich, wenn keine Kapazitäten überschritten sind.'}
            >
              Produktionsfreigabe
            </button>
            <button style={s.button} onClick={revokeAll}>Freigabe aufheben</button>
          </div>
        </div>
      </div>

      {planView === 'maschinen' && (
      <div style={{ ...s.card, marginTop: 10 }}>
        <div style={s.sectionTitle}>Maschinenplanung (Reihenfolge, Auslastung, Produktmix)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(260px, 1fr))', gap: 10 }}>
          {visibleMachines.map((m) => {
            const dayItemsByMachine = machineSchedule[m.id]?.dayItems || {};
            const mix = Object.entries(machineStats[m.id]?.mix || {});
            const used = machineStats[m.id]?.hours || 0;
            const cap = MACHINE_CAP;
            const pct = Math.min(100, Math.round((used / cap) * 100));
            const free = Math.max(0, cap - used);
            const capColor = used >= cap ? '#dc2626' : used >= cap * 0.85 ? '#d97706' : '#22c55e';
            const weekTotals = machineSchedule[m.id]?.dayTotals || {};
            const weekUsed = Object.values(weekTotals).reduce((sum, val) => sum + val, 0);
            const weekCap = MACHINE_CAP * planningDays.length;
            const weekFree = Math.max(0, weekCap - weekUsed);
            const displayDays = viewMode === 'kw' ? weekDays : [activeDay];
            return (
              <div key={m.id} style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: 8, background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><b>{m.name}</b><span>Halle {m.hall}</span></div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                  Geplant: {used} h | Kapazität: {cap} h | Frei: {free} h
                </div>
                {viewMode === 'kw' && (
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    KW gesamt: {weekUsed} h | Kapazität: {weekCap} h | Frei: {weekFree} h
                  </div>
                )}
                <div style={{ marginTop: 6, ...s.capBar }}>
                  <div style={{ ...s.capFill, width: `${pct}%`, background: capColor }} />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {mix.map(([prod, h]) => <span key={`${m.id}-${prod}`} style={{ ...s.badge, background: '#eef2ff', color: '#1e3a8a' }}>{prod}: {h} h</span>)}
                  {mix.length === 0 && <span style={{ color: '#94a3b8', fontSize: 11 }}>Kein Mix</span>}
                </div>
                <div style={s.subtleCard}>
                  <div style={s.tableHeader}>
                    <div>Freigabe</div><div>Projekt</div><div>Produkt</div><div>Abruftermin</div><div>Stück</div><div>Zuschnitt</div><div>Produktion</div><div />
                  </div>
                  {displayDays.map((day) => {
                    const segments = dayItemsByMachine[day] || [];
                    if (viewMode === 'kw' && segments.length === 0) return null;
                    return (
                      <React.Fragment key={`${m.id}-${day}`}>
                        {viewMode === 'kw' && <div style={s.dayGroupHeader}>{dayName(day)} {day}</div>}
                        {segments.map((seg, idx) => {
                          const it = seg.item;
                          const zuschnittLabel = seg.hours < seg.totalHours ? `${seg.hours} h (${seg.totalHours} h ges.)` : `${seg.hours} h`;
                          return (
                            <div key={`${it.itemId}-${day}-${idx}`} draggable
                              onDragStart={() => { setDrag({ kind: 'machine', itemId: it.itemId, sourceId: m.id }); setDrop(null); }}
                              onDragEnd={() => { setDrag(null); setDrop(null); }}
                              onDragOver={(e) => e.preventDefault()}
                              onDragEnter={(e) => { e.preventDefault(); if (drag?.kind === 'machine' && drag.itemId !== it.itemId) setDrop({ kind: 'machine', targetId: m.id, itemId: it.itemId }); }}
                              onDrop={(e) => { e.preventDefault(); dropOnMachine(m.id, it.itemId); }}
                              style={{
                                ...s.rowItem,
                                cursor: drag?.itemId === it.itemId ? 'grabbing' : 'grab',
                                background: drop?.kind === 'machine' && drop?.targetId === m.id && drop?.itemId === it.itemId
                                  ? '#fef9c3'
                                  : drag?.itemId === it.itemId
                                    ? '#dbeafe'
                                    : productCardStyle(it.produkt).background,
                                opacity: drag?.itemId === it.itemId ? 0.65 : 1,
                              }}>
                              <div>{it.releasedAt ? <span style={s.successBadge}>Freigegeben</span> : <span style={s.warnBadge}>Offen</span>}</div>
                              <div>{it.projekt}</div>
                              <div>{it.produkt}</div>
                              <div>
                                {it.tag || '-'}
                                <TerminverschiebungIndicator
                                  record={it}
                                  fieldKey="tag"
                                  onOpen={() => setTerminModal({
                                    record: it,
                                    fieldKey: 'tag',
                                    title: `Historie Abruftermin - ${it.itemId}`,
                                  })}
                                />
                              </div>
                              <div>{it.stueck}</div>
                              <div>
                                <div>{zuschnittLabel}</div>
                                {isZuschnittszeitNachgebessert(it) && (
                                  <div style={{ fontSize: 10, color: '#0f766e', fontWeight: 700 }}>
                                    Ursprung: {getOriginalZuschnittszeit(it)} h
                                  </div>
                                )}
                                {it.zuschnittszeitNachgebessertVon && (
                                  <div style={{ fontSize: 10, color: '#0369a1' }}>
                                    AV: {it.zuschnittszeitNachgebessertVon}
                                  </div>
                                )}
                              </div>
                              <div>
                                <div>{it.produktionszeit} h</div>
                                {isProduktionszeitNachgebessert(it) && (
                                  <div style={{ fontSize: 10, color: '#0f766e', fontWeight: 700 }}>
                                    Ursprung: {getOriginalProduktionszeit(it)} h
                                  </div>
                                )}
                                {it.produktionszeitNachgebessertVon && (
                                  <div style={{ fontSize: 10, color: '#0369a1' }}>
                                    AV: {it.produktionszeitNachgebessertVon}
                                  </div>
                                )}
                              </div>
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                <button
                                  style={it.releasedAt || canReleaseItem(it) ? s.button : { ...s.button, opacity: 0.5, cursor: 'not-allowed' }}
                                  disabled={!it.releasedAt && !canReleaseItem(it)}
                                  onClick={() => toggleReleaseItem(it.itemId)}
                                >
                                  {it.releasedAt ? 'Freigabe zurück' : 'Freigeben'}
                                </button>
                                <button style={s.button} onClick={() => removeFromPlanning(it.itemId)}>Entfernen</button>
                              </div>
                            </div>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                  <div onDragOver={(e) => e.preventDefault()} onDragEnter={(e) => { e.preventDefault(); if (drag?.kind === 'machine') setDrop({ kind: 'machine', targetId: m.id, itemId: null }); }} onDrop={(e) => { e.preventDefault(); dropOnMachine(m.id, null); }}
                    style={{ borderTop: '1px dashed #cbd5e1', padding: 6, fontSize: 11, background: drop?.kind === 'machine' && drop?.targetId === m.id && drop?.itemId == null ? '#fef9c3' : '#fafafa' }}>
                    Hier ablegen (Ende der Maschine)
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      <div style={{ ...s.card, marginTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={s.sectionTitle}>Nicht zugeordnet</div>
          <button style={s.primaryButton} onClick={applyAutoPlan}>Vorschläge für alle übernehmen</button>
        </div>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={(e) => { e.preventDefault(); if (drag?.kind === 'machine') setDrop({ kind: 'unassigned' }); }}
          onDrop={(e) => { e.preventDefault(); dropOnUnassigned(); }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(260px, 1fr))',
            gap: 8,
            border: drop?.kind === 'unassigned' ? '1px dashed #f59e0b' : '1px dashed #e2e8f0',
            borderRadius: 8,
            padding: 8,
            background: drop?.kind === 'unassigned' ? '#fef3c7' : 'transparent',
          }}
        >
          {unassigned.map((it) => (
            <div key={it.itemId} draggable
              onDragStart={() => { setDrag({ kind: 'machine', itemId: it.itemId, sourceId: null }); setDrop(null); }}
              onDragEnd={() => { setDrag(null); setDrop(null); }}
              style={{
                ...s.compactCard,
                background: drag?.itemId === it.itemId ? '#dbeafe' : productCardStyle(it.produkt).background,
                borderColor: productCardStyle(it.produkt).borderColor,
                cursor: 'grab',
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                <div style={{ fontWeight: 700 }}>{it.itemId}</div>
                <span style={{ ...s.badge, ...productStyle(it.produkt) }}>{it.produkt}</span>
              </div>
              <div style={{ ...s.meta, marginTop: 2 }}>{it.projekt}</div>
              <div style={{ ...s.meta, marginTop: 2 }}>
                Abruftermin: {it.tag || '-'}
                <TerminverschiebungIndicator
                  record={it}
                  fieldKey="tag"
                  onOpen={() => setTerminModal({
                    record: it,
                    fieldKey: 'tag',
                    title: `Historie Abruftermin - ${it.itemId}`,
                  })}
                />
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ ...s.badge, background: '#f1f5f9', color: '#334155' }}>{it.stueck} Stk</span>
                <span style={{ ...s.badge, background: '#f1f5f9', color: '#334155' }}>Zuschnitt: {it.zuschnittszeit} h</span>
                <span style={{ ...s.badge, background: '#f1f5f9', color: '#334155' }}>Produktion: {it.produktionszeit} h</span>
                {isZuschnittszeitNachgebessert(it) && (
                  <span style={{ ...s.badge, background: '#ecfeff', color: '#0f766e' }}>Zuschnitt Ursprung: {getOriginalZuschnittszeit(it)} h</span>
                )}
                {isProduktionszeitNachgebessert(it) && (
                  <span style={{ ...s.badge, background: '#ecfeff', color: '#0f766e' }}>Produktion Ursprung: {getOriginalProduktionszeit(it)} h</span>
                )}
                <span style={{ ...s.badge, background: '#e0f2fe', color: '#075985' }}>Vorschlag: {lineName(preferredLineId(it.produkt))}</span>
              </div>
            </div>
          ))}
          {unassigned.length === 0 && <div style={{ color: '#64748b', fontSize: 13 }}>Alle Positionen sind Maschinen zugeordnet.</div>}
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Drag & Drop: Aufträge hier ablegen, um sie von Maschinen zu entfernen.</div>
        </div>
      </div>

      {planView === 'linien' && (
      <div style={{ ...s.card, marginTop: 10 }}>
        <div style={s.sectionTitle}>Linienplanung (Reihenfolge, Auslastung, Produktmix)</div>
        {overloadedLines.length > 0 && (
          <div style={{ marginBottom: 8, padding: 8, borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b', fontSize: 12 }}>
            Achtung: {overloadedLines.length} Linie(n) sind überlastet. Vorschläge zur Umverteilung siehe unten.
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(260px, 1fr))', gap: 10 }}>
          {visibleLines.map((l) => {
            const dayItemsByLine = lineSchedule[l.id]?.dayItems || {};
            const mix = Object.entries(lineStats[l.id]?.mix || {});
            const used = lineStats[l.id]?.hours || 0;
            const cap = LINE_CAP;
            const pct = Math.min(100, Math.round((used / cap) * 100));
            const free = Math.max(0, cap - used);
            const capColor = used >= cap ? '#dc2626' : used >= cap * 0.85 ? '#d97706' : '#22c55e';
            const isOver = Object.values(lineSchedule[l.id]?.dayTotals || {}).some((h) => h > LINE_CAP);
            const displayDays = viewMode === 'kw' ? weekDays : [activeDay];
            return (
              <div key={l.id} style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: 8, background: '#fff', ...(isOver ? s.dangerCard : null) }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b>{l.name}</b>
                  <span>Halle {l.hall}</span>
                </div>
                <div style={{ fontSize: 11, color: isOver ? s.dangerText.color : '#64748b', marginTop: 2 }}>
                  Geplant: {used} h | Kapazität: {cap} h | Frei: {free} h
                </div>
                {isOver && <div style={{ marginTop: 4 }}><span style={s.warnBadge}>Überlastet</span></div>}
                <div style={{ marginTop: 6, ...s.capBar }}>
                  <div style={{ ...s.capFill, width: `${pct}%`, background: capColor }} />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {mix.map(([prod, h]) => <span key={`${l.id}-${prod}`} style={{ ...s.badge, background: '#ecfeff', color: '#0e7490' }}>{prod}: {h} h</span>)}
                  {mix.length === 0 && <span style={{ color: '#94a3b8', fontSize: 11 }}>Kein Mix</span>}
                </div>
                <div style={s.subtleCard}>
                  <div style={s.tableHeader}>
                    <div>Freigabe</div><div>Projekt</div><div>Produkt</div><div>Abruftermin</div><div>Stück</div><div>Zuschnitt</div><div>Produktion</div><div />
                  </div>
                  {displayDays.map((day) => {
                    const segments = dayItemsByLine[day] || [];
                    if (viewMode === 'kw' && segments.length === 0) return null;
                    return (
                      <React.Fragment key={`${l.id}-${day}`}>
                        {viewMode === 'kw' && <div style={s.dayGroupHeader}>{dayName(day)} {day}</div>}
                        {segments.map((seg, idx) => {
                          const it = seg.item;
                          const produktionLabel = seg.hours < seg.totalHours ? `${seg.hours} h (${seg.totalHours} h ges.)` : `${seg.hours} h`;
                          return (
                            <div key={`${it.itemId}-${day}-${idx}`} draggable
                              onDragStart={() => { setDrag({ kind: 'line', itemId: it.itemId, sourceId: l.id }); setDrop(null); }}
                              onDragEnd={() => { setDrag(null); setDrop(null); }}
                              onDragOver={(e) => e.preventDefault()}
                              onDragEnter={(e) => { e.preventDefault(); if (drag?.kind === 'line' && drag.itemId !== it.itemId) setDrop({ kind: 'line', targetId: l.id, itemId: it.itemId }); }}
                              onDrop={(e) => { e.preventDefault(); dropOnLine(l.id, it.itemId); }}
                              style={{
                                ...s.rowItem,
                                cursor: drag?.itemId === it.itemId ? 'grabbing' : 'grab',
                                background: drop?.kind === 'line' && drop?.targetId === l.id && drop?.itemId === it.itemId
                                  ? '#fef9c3'
                                  : drag?.itemId === it.itemId
                                    ? '#dbeafe'
                                    : productCardStyle(it.produkt).background,
                                opacity: drag?.itemId === it.itemId ? 0.65 : 1,
                              }}>
                              <div>{it.releasedAt ? <span style={s.successBadge}>Freigegeben</span> : <span style={s.warnBadge}>Offen</span>}</div>
                              <div>{it.projekt}</div>
                              <div>{it.produkt}</div>
                              <div>
                                {it.tag || '-'}
                                <TerminverschiebungIndicator
                                  record={it}
                                  fieldKey="tag"
                                  onOpen={() => setTerminModal({
                                    record: it,
                                    fieldKey: 'tag',
                                    title: `Historie Abruftermin - ${it.itemId}`,
                                  })}
                                />
                              </div>
                              <div>{it.stueck}</div>
                              <div>
                                <div>{it.zuschnittszeit} h</div>
                                {isZuschnittszeitNachgebessert(it) && (
                                  <div style={{ fontSize: 10, color: '#0f766e', fontWeight: 700 }}>
                                    Ursprung: {getOriginalZuschnittszeit(it)} h
                                  </div>
                                )}
                                {it.zuschnittszeitNachgebessertVon && (
                                  <div style={{ fontSize: 10, color: '#0369a1' }}>
                                    AV: {it.zuschnittszeitNachgebessertVon}
                                  </div>
                                )}
                              </div>
                              <div>
                                <div>{produktionLabel}</div>
                                {isProduktionszeitNachgebessert(it) && (
                                  <div style={{ fontSize: 10, color: '#0f766e', fontWeight: 700 }}>
                                    Ursprung: {getOriginalProduktionszeit(it)} h
                                  </div>
                                )}
                                {it.produktionszeitNachgebessertVon && (
                                  <div style={{ fontSize: 10, color: '#0369a1' }}>
                                    AV: {it.produktionszeitNachgebessertVon}
                                  </div>
                                )}
                              </div>
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                <button
                                  style={it.releasedAt || canReleaseItem(it) ? s.button : { ...s.button, opacity: 0.5, cursor: 'not-allowed' }}
                                  disabled={!it.releasedAt && !canReleaseItem(it)}
                                  onClick={() => toggleReleaseItem(it.itemId)}
                                >
                                  {it.releasedAt ? 'Freigabe zurück' : 'Freigeben'}
                                </button>
                                <button style={s.button} onClick={() => removeFromPlanning(it.itemId)}>Entfernen</button>
                              </div>
                            </div>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                  <div onDragOver={(e) => e.preventDefault()} onDragEnter={(e) => { e.preventDefault(); if (drag?.kind === 'line') setDrop({ kind: 'line', targetId: l.id, itemId: null }); }} onDrop={(e) => { e.preventDefault(); dropOnLine(l.id, null); }}
                    style={{ borderTop: '1px dashed #cbd5e1', padding: 6, fontSize: 11, background: drop?.kind === 'line' && drop?.targetId === l.id && drop?.itemId == null ? '#fef9c3' : '#fafafa' }}>
                    Hier ablegen (Ende der Linie)
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {rebalanceSuggestions.length > 0 && (
          <div style={{ marginTop: 10, borderTop: '1px solid #e2e8f0', paddingTop: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Vorschläge zur Auslastungsverteilung</div>
            {rebalanceSuggestions.map((sug) => (
              <div key={`${sug.itemId}-${sug.to}`} style={{ fontSize: 12, color: '#334155', padding: '4px 0' }}>
                {sug.itemId} ({sug.produkt}, {sug.produktionszeit} h Produktion): {lineName(sug.from)} {'->'} {lineName(sug.to)}
              </div>
            ))}
          </div>
        )}
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



