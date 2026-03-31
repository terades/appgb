import React, { useEffect, useMemo, useRef, useState } from 'react';
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

const DAY_CAP = 120;
const WEEK_CAP = DAY_CAP * 5;
const STORE_KEY = 'feinplanung_v6';
const GROB_KEY = 'grobplanung_v1';
const HIGH_PRIO_SHIFT_THRESHOLD = 2;
const THOMAS_MIX_EMAIL = 'thomas.mix@goldbeck.de';
const DEMO_DAY_COUNT = 5; // Starttag + 4 Folgetage
const DEMO_DATA_VERSION = 3;
const TABLE_PAGE_SIZE = 10;
const DELIVERY_BUFFER_DAYS = 5;
const PRODUCTION_TIME_FACTOR = 1.1;
const KW_CAPACITY_DAYS = 5;
const EXTERNAL_SCOPE_OPTIONS = [
  { value: 'zuschnitte', label: 'Nur Zuschnitte' },
  { value: 'komplettierung', label: 'Nur Komplettierung' },
  { value: 'alles', label: 'Alles zusammen' },
];
const navSections = [
  {
    title: 'Schichten',
    items: ['Schichtplanung', 'Schichtklassen'],
    open: false,
  },
  {
    title: 'Produktionsauftraege',
    items: [
      'Uebersicht',
      'Planung',
      'Bauteillisten',
      'Artikel',
      'Arbeitsplaene',
      'Arbeitsganggruppen',
      'Vorlagen',
      'Auftragspool',
      'Projektuebersicht',
    ],
    open: true,
  },
  {
    title: 'Lagerverwaltung',
    items: ['Bestandsuebersicht', 'Ladungstraeger'],
    open: false,
  },
  {
    title: 'Produktionssteuerung',
    items: ['Tagesproduktionsplan', 'Teams', 'Auftragspools'],
    open: false,
  },
  {
    title: 'Checklisten',
    items: ['Uebersicht', 'Eintraege', 'Zuweisungsregeln'],
    open: false,
  },
  {
    title: 'Reporting',
    items: ['Ressourcenstatus', 'Produktionsvorgaenge', 'Gutteilmeldung'],
    open: false,
  },
  {
    title: 'Automatische Produktion',
    items: ['Zuschnittsplaene', 'Maschinenrueckmeldungen'],
    open: false,
  },
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
const BASE_TEAMS_PER_LINE = 3;
const PERSONS_PER_TEAM = 4;
const BASE_PERSONS_PER_LINE = BASE_TEAMS_PER_LINE * PERSONS_PER_TEAM;
const SHIFT_TEAMS = lines.flatMap((line) => ([
  { id: `${line.id}-team-a`, name: `Team A ${line.name}`, hall: line.hall, homeLineId: line.id },
  { id: `${line.id}-team-b`, name: `Team B ${line.name}`, hall: line.hall, homeLineId: line.id },
  { id: `${line.id}-team-c`, name: `Team C ${line.name}`, hall: line.hall, homeLineId: line.id },
]));
const SHIFT_PERSONS = SHIFT_TEAMS.flatMap((team) => (
  Array.from({ length: PERSONS_PER_TEAM }, (_, idx) => ({
    id: `${team.id}-p${idx + 1}`,
    name: `${team.name} · P${idx + 1}`,
    teamId: team.id,
    hall: team.hall,
    homeLineId: team.homeLineId,
  }))
));

const axStock = {
  PRF_FENSTER_70: 880, PRF_FLUEGEL_55: 530, PRF_TUER_90: 420, PRF_FASSADE_120: 1100, PRF_AWE_65: 210,
  BESCHLAG_A: 160, BESCHLAG_B: 140, DICHTUNG_X: 2000, ECKVERBINDER: 520, GLAS_STD: 130, GLAS_AWE: 22,
};

const baseOrders = [
  { id: 'PA-2026-2001', projekt: 'MX4100A-BTL77100', freigegebenVon: 'Nina Schulz', produkte: [
    { typ: 'Fenster', stueck: 40, h: 84, mat: { PRF_FENSTER_70: 170, BESCHLAG_A: 32, DICHTUNG_X: 260, GLAS_STD: 34 } },
    { typ: 'Fluegel', stueck: 32, h: 64, mat: { PRF_FLUEGEL_55: 130, BESCHLAG_A: 26, DICHTUNG_X: 210, ECKVERBINDER: 64 } },
  ]},
  { id: 'PA-2026-2002', projekt: 'QZ5500C-BTL88230', freigegebenVon: 'Jonas Richter', produkte: [
    { typ: 'Fassaden', stueck: 28, h: 96, mat: { PRF_FASSADE_120: 240, BESCHLAG_B: 24, DICHTUNG_X: 280 } },
    { typ: 'AWE', stueck: 14, h: 72, mat: { PRF_AWE_65: 120, BESCHLAG_B: 20, GLAS_AWE: 18 } },
  ]},
  { id: 'PA-2026-2003', projekt: 'FE9900E-BTL51120', freigegebenVon: 'Fatma Yildiz', produkte: [
    { typ: 'Fenster', stueck: 38, h: 90, mat: { PRF_FENSTER_70: 165, BESCHLAG_A: 30, DICHTUNG_X: 250, GLAS_STD: 32 } },
  ]},
  { id: 'PA-2026-2004', projekt: 'TU4410C-BTL22310', freigegebenVon: 'Anna Becker', produkte: [
    { typ: 'Tueren', stueck: 24, h: 80, mat: { PRF_TUER_90: 120, BESCHLAG_B: 36, DICHTUNG_X: 150, ECKVERBINDER: 40 } },
  ]},
  { id: 'PA-2026-2005', projekt: 'FA2201B-BTL66500', freigegebenVon: 'Lukas Meyer', produkte: [
    { typ: 'Fassaden', stueck: 30, h: 102, mat: { PRF_FASSADE_120: 260, BESCHLAG_B: 26, DICHTUNG_X: 320 } },
    { typ: 'Fenster', stueck: 20, h: 58, mat: { PRF_FENSTER_70: 100, BESCHLAG_A: 16, DICHTUNG_X: 160, GLAS_STD: 18 } },
  ]},
  { id: 'PA-2026-2006', projekt: 'AW3301D-BTL70010', freigegebenVon: 'Tobias Klein', produkte: [
    { typ: 'AWE', stueck: 10, h: 66, mat: { PRF_AWE_65: 95, BESCHLAG_B: 16, GLAS_AWE: 10 } },
  ]},
  { id: 'PA-2026-2007', projekt: 'FL7700E-BTL11020', freigegebenVon: 'Nina Schulz', produkte: [
    { typ: 'Fluegel', stueck: 36, h: 86, mat: { PRF_FLUEGEL_55: 145, BESCHLAG_A: 28, DICHTUNG_X: 220, ECKVERBINDER: 72 } },
  ]},
  { id: 'PA-2026-2008', projekt: 'FE2201F-BTL99070', freigegebenVon: 'Anna Becker', produkte: [
    { typ: 'Fenster', stueck: 26, h: 62, mat: { PRF_FENSTER_70: 110, BESCHLAG_A: 19, DICHTUNG_X: 165, GLAS_STD: 20 } },
    { typ: 'Tueren', stueck: 12, h: 44, mat: { PRF_TUER_90: 62, BESCHLAG_B: 14, DICHTUNG_X: 85, ECKVERBINDER: 18 } },
  ]},
  { id: 'PA-2026-2009', projekt: 'FA5550A-BTL77001', freigegebenVon: 'Jonas Richter', produkte: [
    { typ: 'Fassaden', stueck: 22, h: 74, mat: { PRF_FASSADE_120: 180, BESCHLAG_B: 18, DICHTUNG_X: 220 } },
  ]},
  { id: 'PA-2026-2010', projekt: 'AW8800C-BTL33880', freigegebenVon: 'Fatma Yildiz', produkte: [
    { typ: 'AWE', stueck: 18, h: 92, mat: { PRF_AWE_65: 150, BESCHLAG_B: 25, GLAS_AWE: 26 } }, // Fehlmaterial
  ]},
  { id: 'PA-2026-2011', projekt: 'TU9909B-BTL77119', freigegebenVon: 'Lukas Meyer', produkte: [
    { typ: 'Tueren', stueck: 20, h: 70, mat: { PRF_TUER_90: 130, BESCHLAG_B: 22, DICHTUNG_X: 130, ECKVERBINDER: 25 } },
  ]},
  { id: 'PA-2026-2012', projekt: 'FE7711D-BTL41001', freigegebenVon: 'Tobias Klein', produkte: [
    { typ: 'Fenster', stueck: 42, h: 108, mat: { PRF_FENSTER_70: 190, BESCHLAG_A: 36, DICHTUNG_X: 300, GLAS_STD: 38 } },
    { typ: 'AWE', stueck: 8, h: 40, mat: { PRF_AWE_65: 60, BESCHLAG_B: 9, GLAS_AWE: 8 } },
  ]},
  { id: 'PA-2026-2013', projekt: 'FE4402A-BTL12011', freigegebenVon: 'Nina Schulz', produkte: [
    { typ: 'Fenster', stueck: 34, h: 88, mat: { PRF_FENSTER_70: 155, BESCHLAG_A: 28, DICHTUNG_X: 235, GLAS_STD: 30 } },
  ]},
  { id: 'PA-2026-2014', projekt: 'TU3308D-BTL55220', freigegebenVon: 'Jonas Richter', produkte: [
    { typ: 'Tueren', stueck: 28, h: 92, mat: { PRF_TUER_90: 145, BESCHLAG_B: 30, DICHTUNG_X: 170, ECKVERBINDER: 36 } },
    { typ: 'Fenster', stueck: 12, h: 36, mat: { PRF_FENSTER_70: 66, BESCHLAG_A: 10, DICHTUNG_X: 98, GLAS_STD: 11 } },
  ]},
  { id: 'PA-2026-2015', projekt: 'FA1180F-BTL44100', freigegebenVon: 'Fatma Yildiz', produkte: [
    { typ: 'Fassaden', stueck: 26, h: 84, mat: { PRF_FASSADE_120: 220, BESCHLAG_B: 22, DICHTUNG_X: 270 } },
  ]},
  { id: 'PA-2026-2016', projekt: 'FL5501C-BTL00990', freigegebenVon: 'Anna Becker', produkte: [
    { typ: 'Fluegel', stueck: 30, h: 76, mat: { PRF_FLUEGEL_55: 125, BESCHLAG_A: 24, DICHTUNG_X: 190, ECKVERBINDER: 58 } },
    { typ: 'AWE', stueck: 9, h: 42, mat: { PRF_AWE_65: 68, BESCHLAG_B: 10, GLAS_AWE: 9 } },
  ]},
  { id: 'PA-2026-2017', projekt: 'AW7719B-BTL70077', freigegebenVon: 'Lukas Meyer', produkte: [
    { typ: 'AWE', stueck: 16, h: 78, mat: { PRF_AWE_65: 132, BESCHLAG_B: 21, GLAS_AWE: 20 } },
  ]},
  { id: 'PA-2026-2018', projekt: 'FE2209X-BTL13004', freigegebenVon: 'Tobias Klein', produkte: [
    { typ: 'Fenster', stueck: 22, h: 58, mat: { PRF_FENSTER_70: 98, BESCHLAG_A: 16, DICHTUNG_X: 142, GLAS_STD: 17 } },
    { typ: 'Fluegel', stueck: 18, h: 44, mat: { PRF_FLUEGEL_55: 78, BESCHLAG_A: 14, DICHTUNG_X: 120, ECKVERBINDER: 34 } },
  ]},
  { id: 'PA-2026-2019', projekt: 'FA3300R-BTL88081', freigegebenVon: 'Nina Schulz', produkte: [
    { typ: 'Fassaden', stueck: 32, h: 110, mat: { PRF_FASSADE_120: 285, BESCHLAG_B: 30, DICHTUNG_X: 350 } },
  ]},
  { id: 'PA-2026-2020', projekt: 'TU1111N-BTL31313', freigegebenVon: 'Jonas Richter', produkte: [
    { typ: 'Tueren', stueck: 18, h: 62, mat: { PRF_TUER_90: 108, BESCHLAG_B: 18, DICHTUNG_X: 118, ECKVERBINDER: 24 } },
    { typ: 'AWE', stueck: 6, h: 28, mat: { PRF_AWE_65: 52, BESCHLAG_B: 8, GLAS_AWE: 6 } },
  ]},
  { id: 'PA-2026-2021', projekt: 'FL9910M-BTL17171', freigegebenVon: 'Fatma Yildiz', produkte: [
    { typ: 'Fluegel', stueck: 40, h: 98, mat: { PRF_FLUEGEL_55: 170, BESCHLAG_A: 34, DICHTUNG_X: 260, ECKVERBINDER: 80 } },
  ]},
  { id: 'PA-2026-2022', projekt: 'FE5512K-BTL45123', freigegebenVon: 'Anna Becker', produkte: [
    { typ: 'Fenster', stueck: 36, h: 94, mat: { PRF_FENSTER_70: 172, BESCHLAG_A: 29, DICHTUNG_X: 248, GLAS_STD: 33 } },
    { typ: 'Tueren', stueck: 10, h: 38, mat: { PRF_TUER_90: 58, BESCHLAG_B: 12, DICHTUNG_X: 72, ECKVERBINDER: 15 } },
  ]},
  { id: 'PA-2026-2023', projekt: 'DP2023X-BTL60000', freigegebenVon: 'Nina Schulz', produkte: [
    { typ: 'Fenster', stueck: 14, h: 38, mat: { PRF_FENSTER_70: 60, BESCHLAG_A: 11, DICHTUNG_X: 87, GLAS_STD: 12 } },
    { typ: 'Fassaden', stueck: 8, h: 24, mat: { PRF_FASSADE_120: 64, BESCHLAG_B: 7, DICHTUNG_X: 72 } },
  ]},
  { id: 'PA-2026-2024', projekt: 'DP2024X-BTL60173', freigegebenVon: 'Jonas Richter', produkte: [
    { typ: 'Tueren', stueck: 17, h: 45, mat: { PRF_TUER_90: 87, BESCHLAG_B: 19, DICHTUNG_X: 88, ECKVERBINDER: 17 } },
    { typ: 'AWE', stueck: 13, h: 35, mat: { PRF_AWE_65: 92, BESCHLAG_B: 16, GLAS_AWE: 14 } },
  ]},
  { id: 'PA-2026-2025', projekt: 'DP2025X-BTL60346', freigegebenVon: 'Fatma Yildiz', produkte: [
    { typ: 'Fassaden', stueck: 20, h: 52, mat: { PRF_FASSADE_120: 160, BESCHLAG_B: 18, DICHTUNG_X: 180 } },
    { typ: 'Fluegel', stueck: 18, h: 46, mat: { PRF_FLUEGEL_55: 72, BESCHLAG_A: 14, DICHTUNG_X: 108, ECKVERBINDER: 36 } },
  ]},
  { id: 'PA-2026-2026', projekt: 'DP2026X-BTL60519', freigegebenVon: 'Anna Becker', produkte: [
    { typ: 'AWE', stueck: 23, h: 59, mat: { PRF_AWE_65: 163, BESCHLAG_B: 28, GLAS_AWE: 25 } },
    { typ: 'Fenster', stueck: 23, h: 57, mat: { PRF_FENSTER_70: 99, BESCHLAG_A: 18, DICHTUNG_X: 143, GLAS_STD: 20 } },
  ]},
  { id: 'PA-2026-2027', projekt: 'DP2027X-BTL60692', freigegebenVon: 'Lukas Meyer', produkte: [
    { typ: 'Fluegel', stueck: 26, h: 66, mat: { PRF_FLUEGEL_55: 104, BESCHLAG_A: 20, DICHTUNG_X: 156, ECKVERBINDER: 52 } },
    { typ: 'Tueren', stueck: 9, h: 68, mat: { PRF_TUER_90: 46, BESCHLAG_B: 10, DICHTUNG_X: 47, ECKVERBINDER: 9 } },
  ]},
  { id: 'PA-2026-2028', projekt: 'DP2028X-BTL60865', freigegebenVon: 'Tobias Klein', produkte: [
    { typ: 'Fenster', stueck: 29, h: 73, mat: { PRF_FENSTER_70: 125, BESCHLAG_A: 23, DICHTUNG_X: 180, GLAS_STD: 25 } },
    { typ: 'Fassaden', stueck: 14, h: 27, mat: { PRF_FASSADE_120: 112, BESCHLAG_B: 13, DICHTUNG_X: 126 } },
  ]},
  { id: 'PA-2026-2029', projekt: 'DP2029X-BTL61038', freigegebenVon: 'Nina Schulz', produkte: [
    { typ: 'Tueren', stueck: 32, h: 80, mat: { PRF_TUER_90: 163, BESCHLAG_B: 35, DICHTUNG_X: 166, ECKVERBINDER: 32 } },
    { typ: 'AWE', stueck: 19, h: 38, mat: { PRF_AWE_65: 135, BESCHLAG_B: 23, GLAS_AWE: 21 } },
  ]},
  { id: 'PA-2026-2030', projekt: 'DP2030X-BTL61211', freigegebenVon: 'Jonas Richter', produkte: [
    { typ: 'Fassaden', stueck: 35, h: 87, mat: { PRF_FASSADE_120: 280, BESCHLAG_B: 32, DICHTUNG_X: 315 } },
    { typ: 'Fluegel', stueck: 24, h: 49, mat: { PRF_FLUEGEL_55: 96, BESCHLAG_A: 19, DICHTUNG_X: 144, ECKVERBINDER: 48 } },
  ]},
  { id: 'PA-2026-2031', projekt: 'DP2031X-BTL61384', freigegebenVon: 'Fatma Yildiz', produkte: [
    { typ: 'AWE', stueck: 38, h: 94, mat: { PRF_AWE_65: 270, BESCHLAG_B: 46, GLAS_AWE: 42 } },
    { typ: 'Fenster', stueck: 10, h: 60, mat: { PRF_FENSTER_70: 43, BESCHLAG_A: 8, DICHTUNG_X: 62, GLAS_STD: 8 } },
  ]},
  { id: 'PA-2026-2032', projekt: 'DP2032X-BTL61557', freigegebenVon: 'Anna Becker', produkte: [
    { typ: 'Fluegel', stueck: 41, h: 101, mat: { PRF_FLUEGEL_55: 164, BESCHLAG_A: 32, DICHTUNG_X: 246, ECKVERBINDER: 82 } },
    { typ: 'Tueren', stueck: 15, h: 71, mat: { PRF_TUER_90: 76, BESCHLAG_B: 16, DICHTUNG_X: 78, ECKVERBINDER: 15 } },
  ]},
  { id: 'PA-2026-2033', projekt: 'DP2033X-BTL61730', freigegebenVon: 'Lukas Meyer', produkte: [
    { typ: 'Fenster', stueck: 15, h: 108, mat: { PRF_FENSTER_70: 64, BESCHLAG_A: 12, DICHTUNG_X: 93, GLAS_STD: 13 } },
    { typ: 'Fassaden', stueck: 20, h: 30, mat: { PRF_FASSADE_120: 160, BESCHLAG_B: 18, DICHTUNG_X: 180 } },
  ]},
  { id: 'PA-2026-2034', projekt: 'DP2034X-BTL61903', freigegebenVon: 'Tobias Klein', produkte: [
    { typ: 'Tueren', stueck: 18, h: 115, mat: { PRF_TUER_90: 92, BESCHLAG_B: 20, DICHTUNG_X: 94, ECKVERBINDER: 18 } },
    { typ: 'AWE', stueck: 25, h: 41, mat: { PRF_AWE_65: 178, BESCHLAG_B: 30, GLAS_AWE: 28 } },
  ]},
  { id: 'PA-2026-2035', projekt: 'DP2035X-BTL62076', freigegebenVon: 'Nina Schulz', produkte: [
    { typ: 'Fassaden', stueck: 21, h: 44, mat: { PRF_FASSADE_120: 168, BESCHLAG_B: 19, DICHTUNG_X: 189 } },
    { typ: 'Fluegel', stueck: 11, h: 52, mat: { PRF_FLUEGEL_55: 44, BESCHLAG_A: 9, DICHTUNG_X: 66, ECKVERBINDER: 22 } },
  ]},
  { id: 'PA-2026-2036', projekt: 'DP2036X-BTL62249', freigegebenVon: 'Jonas Richter', produkte: [
    { typ: 'AWE', stueck: 24, h: 51, mat: { PRF_AWE_65: 170, BESCHLAG_B: 29, GLAS_AWE: 26 } },
    { typ: 'Fenster', stueck: 16, h: 63, mat: { PRF_FENSTER_70: 69, BESCHLAG_A: 13, DICHTUNG_X: 99, GLAS_STD: 14 } },
  ]},
  { id: 'PA-2026-2037', projekt: 'DP2037X-BTL62422', freigegebenVon: 'Fatma Yildiz', produkte: [
    { typ: 'Fluegel', stueck: 27, h: 58, mat: { PRF_FLUEGEL_55: 108, BESCHLAG_A: 21, DICHTUNG_X: 162, ECKVERBINDER: 54 } },
    { typ: 'Tueren', stueck: 21, h: 74, mat: { PRF_TUER_90: 107, BESCHLAG_B: 23, DICHTUNG_X: 109, ECKVERBINDER: 21 } },
  ]},
  { id: 'PA-2026-2038', projekt: 'DP2038X-BTL62595', freigegebenVon: 'Anna Becker', produkte: [
    { typ: 'Fenster', stueck: 30, h: 65, mat: { PRF_FENSTER_70: 129, BESCHLAG_A: 24, DICHTUNG_X: 186, GLAS_STD: 26 } },
    { typ: 'Fassaden', stueck: 26, h: 33, mat: { PRF_FASSADE_120: 208, BESCHLAG_B: 23, DICHTUNG_X: 234 } },
  ]},
  { id: 'PA-2026-2039', projekt: 'DP2039X-BTL62768', freigegebenVon: 'Lukas Meyer', produkte: [
    { typ: 'Tueren', stueck: 33, h: 72, mat: { PRF_TUER_90: 168, BESCHLAG_B: 36, DICHTUNG_X: 172, ECKVERBINDER: 33 } },
    { typ: 'AWE', stueck: 12, h: 44, mat: { PRF_AWE_65: 85, BESCHLAG_B: 14, GLAS_AWE: 13 } },
  ]},
  { id: 'PA-2026-2040', projekt: 'DP2040X-BTL62941', freigegebenVon: 'Tobias Klein', produkte: [
    { typ: 'Fassaden', stueck: 36, h: 79, mat: { PRF_FASSADE_120: 288, BESCHLAG_B: 32, DICHTUNG_X: 324 } },
    { typ: 'Fluegel', stueck: 17, h: 55, mat: { PRF_FLUEGEL_55: 68, BESCHLAG_A: 13, DICHTUNG_X: 102, ECKVERBINDER: 34 } },
  ]},
  { id: 'PA-2026-2041', projekt: 'DP2041X-BTL63114', freigegebenVon: 'Nina Schulz', produkte: [
    { typ: 'AWE', stueck: 39, h: 86, mat: { PRF_AWE_65: 277, BESCHLAG_B: 47, GLAS_AWE: 43 } },
    { typ: 'Fenster', stueck: 22, h: 66, mat: { PRF_FENSTER_70: 95, BESCHLAG_A: 18, DICHTUNG_X: 136, GLAS_STD: 19 } },
  ]},
  { id: 'PA-2026-2042', projekt: 'DP2042X-BTL63287', freigegebenVon: 'Jonas Richter', produkte: [
    { typ: 'Fluegel', stueck: 42, h: 93, mat: { PRF_FLUEGEL_55: 168, BESCHLAG_A: 33, DICHTUNG_X: 252, ECKVERBINDER: 84 } },
    { typ: 'Tueren', stueck: 8, h: 25, mat: { PRF_TUER_90: 41, BESCHLAG_B: 9, DICHTUNG_X: 42, ECKVERBINDER: 8 } },
  ]},
  { id: 'PA-2026-2043', projekt: 'DP2043X-BTL63460', freigegebenVon: 'Fatma Yildiz', produkte: [
    { typ: 'Fenster', stueck: 16, h: 100, mat: { PRF_FENSTER_70: 69, BESCHLAG_A: 13, DICHTUNG_X: 99, GLAS_STD: 14 } },
    { typ: 'Fassaden', stueck: 13, h: 36, mat: { PRF_FASSADE_120: 104, BESCHLAG_B: 12, DICHTUNG_X: 117 } },
  ]},
  { id: 'PA-2026-2044', projekt: 'DP2044X-BTL63633', freigegebenVon: 'Anna Becker', produkte: [
    { typ: 'Tueren', stueck: 19, h: 107, mat: { PRF_TUER_90: 97, BESCHLAG_B: 21, DICHTUNG_X: 99, ECKVERBINDER: 19 } },
    { typ: 'AWE', stueck: 18, h: 47, mat: { PRF_AWE_65: 128, BESCHLAG_B: 22, GLAS_AWE: 20 } },
  ]},
  { id: 'PA-2026-2045', projekt: 'DP2045X-BTL63806', freigegebenVon: 'Lukas Meyer', produkte: [
    { typ: 'Fassaden', stueck: 22, h: 114, mat: { PRF_FASSADE_120: 176, BESCHLAG_B: 20, DICHTUNG_X: 198 } },
    { typ: 'Fluegel', stueck: 23, h: 58, mat: { PRF_FLUEGEL_55: 92, BESCHLAG_A: 18, DICHTUNG_X: 138, ECKVERBINDER: 46 } },
  ]},
  { id: 'PA-2026-2046', projekt: 'DP2046X-BTL63979', freigegebenVon: 'Tobias Klein', produkte: [
    { typ: 'AWE', stueck: 25, h: 43, mat: { PRF_AWE_65: 178, BESCHLAG_B: 30, GLAS_AWE: 28 } },
    { typ: 'Fenster', stueck: 9, h: 69, mat: { PRF_FENSTER_70: 39, BESCHLAG_A: 7, DICHTUNG_X: 56, GLAS_STD: 8 } },
  ]},
  { id: 'PA-2026-2047', projekt: 'DP2047X-BTL64152', freigegebenVon: 'Nina Schulz', produkte: [
    { typ: 'Fluegel', stueck: 28, h: 50, mat: { PRF_FLUEGEL_55: 112, BESCHLAG_A: 22, DICHTUNG_X: 168, ECKVERBINDER: 56 } },
    { typ: 'Tueren', stueck: 14, h: 28, mat: { PRF_TUER_90: 71, BESCHLAG_B: 15, DICHTUNG_X: 73, ECKVERBINDER: 14 } },
  ]},
  { id: 'PA-2026-2048', projekt: 'DP2048X-BTL64325', freigegebenVon: 'Jonas Richter', produkte: [
    { typ: 'Fenster', stueck: 31, h: 57, mat: { PRF_FENSTER_70: 133, BESCHLAG_A: 25, DICHTUNG_X: 192, GLAS_STD: 26 } },
    { typ: 'Fassaden', stueck: 19, h: 39, mat: { PRF_FASSADE_120: 152, BESCHLAG_B: 17, DICHTUNG_X: 171 } },
  ]},
  { id: 'PA-2026-2049', projekt: 'DP2049X-BTL64498', freigegebenVon: 'Fatma Yildiz', produkte: [
    { typ: 'Tueren', stueck: 34, h: 64, mat: { PRF_TUER_90: 173, BESCHLAG_B: 37, DICHTUNG_X: 177, ECKVERBINDER: 34 } },
    { typ: 'AWE', stueck: 24, h: 50, mat: { PRF_AWE_65: 170, BESCHLAG_B: 29, GLAS_AWE: 26 } },
  ]},
  { id: 'PA-2026-2050', projekt: 'DP2050X-BTL64671', freigegebenVon: 'Anna Becker', produkte: [
    { typ: 'Fassaden', stueck: 37, h: 71, mat: { PRF_FASSADE_120: 296, BESCHLAG_B: 33, DICHTUNG_X: 333 } },
    { typ: 'Fluegel', stueck: 10, h: 61, mat: { PRF_FLUEGEL_55: 40, BESCHLAG_A: 8, DICHTUNG_X: 60, ECKVERBINDER: 20 } },
  ]},
  { id: 'PA-2026-2051', projekt: 'DP2051X-BTL64844', freigegebenVon: 'Lukas Meyer', produkte: [
    { typ: 'AWE', stueck: 40, h: 78, mat: { PRF_AWE_65: 284, BESCHLAG_B: 48, GLAS_AWE: 44 } },
    { typ: 'Fenster', stueck: 15, h: 72, mat: { PRF_FENSTER_70: 64, BESCHLAG_A: 12, DICHTUNG_X: 93, GLAS_STD: 13 } },
  ]},
  { id: 'PA-2026-2052', projekt: 'DP2052X-BTL65017', freigegebenVon: 'Tobias Klein', produkte: [
    { typ: 'Fluegel', stueck: 14, h: 85, mat: { PRF_FLUEGEL_55: 56, BESCHLAG_A: 11, DICHTUNG_X: 84, ECKVERBINDER: 28 } },
    { typ: 'Tueren', stueck: 20, h: 31, mat: { PRF_TUER_90: 102, BESCHLAG_B: 22, DICHTUNG_X: 104, ECKVERBINDER: 20 } },
  ]},
  { id: 'PA-2026-2053', projekt: 'DP2053X-BTL65190', freigegebenVon: 'Nina Schulz', produkte: [
    { typ: 'Fenster', stueck: 17, h: 92, mat: { PRF_FENSTER_70: 73, BESCHLAG_A: 14, DICHTUNG_X: 105, GLAS_STD: 14 } },
    { typ: 'Fassaden', stueck: 25, h: 42, mat: { PRF_FASSADE_120: 200, BESCHLAG_B: 22, DICHTUNG_X: 225 } },
  ]},
  { id: 'PA-2026-2054', projekt: 'DP2054X-BTL65363', freigegebenVon: 'Jonas Richter', produkte: [
    { typ: 'Tueren', stueck: 20, h: 99, mat: { PRF_TUER_90: 102, BESCHLAG_B: 22, DICHTUNG_X: 104, ECKVERBINDER: 20 } },
    { typ: 'AWE', stueck: 11, h: 53, mat: { PRF_AWE_65: 78, BESCHLAG_B: 13, GLAS_AWE: 12 } },
  ]},
  { id: 'PA-2026-2055', projekt: 'DP2055X-BTL65536', freigegebenVon: 'Fatma Yildiz', produkte: [
    { typ: 'Fassaden', stueck: 23, h: 106, mat: { PRF_FASSADE_120: 184, BESCHLAG_B: 21, DICHTUNG_X: 207 } },
    { typ: 'Fluegel', stueck: 16, h: 64, mat: { PRF_FLUEGEL_55: 64, BESCHLAG_A: 12, DICHTUNG_X: 96, ECKVERBINDER: 32 } },
  ]},
  { id: 'PA-2026-2056', projekt: 'DP2056X-BTL65709', freigegebenVon: 'Anna Becker', produkte: [
    { typ: 'AWE', stueck: 26, h: 113, mat: { PRF_AWE_65: 185, BESCHLAG_B: 31, GLAS_AWE: 29 } },
    { typ: 'Fenster', stueck: 21, h: 75, mat: { PRF_FENSTER_70: 90, BESCHLAG_A: 17, DICHTUNG_X: 130, GLAS_STD: 18 } },
  ]},
  { id: 'PA-2026-2057', projekt: 'DP2057X-BTL65882', freigegebenVon: 'Lukas Meyer', produkte: [
    { typ: 'Fluegel', stueck: 29, h: 42, mat: { PRF_FLUEGEL_55: 116, BESCHLAG_A: 23, DICHTUNG_X: 174, ECKVERBINDER: 58 } },
    { typ: 'Tueren', stueck: 26, h: 34, mat: { PRF_TUER_90: 133, BESCHLAG_B: 29, DICHTUNG_X: 135, ECKVERBINDER: 26 } },
  ]},
  { id: 'PA-2026-2058', projekt: 'DP2058X-BTL66055', freigegebenVon: 'Tobias Klein', produkte: [
    { typ: 'Fenster', stueck: 32, h: 49, mat: { PRF_FENSTER_70: 138, BESCHLAG_A: 26, DICHTUNG_X: 198, GLAS_STD: 27 } },
    { typ: 'Fassaden', stueck: 12, h: 45, mat: { PRF_FASSADE_120: 96, BESCHLAG_B: 11, DICHTUNG_X: 108 } },
  ]},
  { id: 'PA-2026-2059', projekt: 'DP2059X-BTL66228', freigegebenVon: 'Nina Schulz', produkte: [
    { typ: 'Tueren', stueck: 35, h: 56, mat: { PRF_TUER_90: 178, BESCHLAG_B: 38, DICHTUNG_X: 182, ECKVERBINDER: 35 } },
    { typ: 'AWE', stueck: 17, h: 56, mat: { PRF_AWE_65: 121, BESCHLAG_B: 20, GLAS_AWE: 19 } },
  ]},
  { id: 'PA-2026-2060', projekt: 'DP2060X-BTL66401', freigegebenVon: 'Jonas Richter', produkte: [
    { typ: 'Fassaden', stueck: 38, h: 63, mat: { PRF_FASSADE_120: 304, BESCHLAG_B: 34, DICHTUNG_X: 342 } },
    { typ: 'Fluegel', stueck: 22, h: 67, mat: { PRF_FLUEGEL_55: 88, BESCHLAG_A: 17, DICHTUNG_X: 132, ECKVERBINDER: 44 } },
  ]},
  { id: 'PA-2026-2061', projekt: 'DP2061X-BTL66574', freigegebenVon: 'Fatma Yildiz', produkte: [
    { typ: 'AWE', stueck: 41, h: 70, mat: { PRF_AWE_65: 291, BESCHLAG_B: 49, GLAS_AWE: 45 } },
    { typ: 'Fenster', stueck: 8, h: 26, mat: { PRF_FENSTER_70: 34, BESCHLAG_A: 6, DICHTUNG_X: 50, GLAS_STD: 7 } },
  ]},
  { id: 'PA-2026-2062', projekt: 'DP2062X-BTL66747', freigegebenVon: 'Anna Becker', produkte: [
    { typ: 'Fluegel', stueck: 15, h: 77, mat: { PRF_FLUEGEL_55: 60, BESCHLAG_A: 12, DICHTUNG_X: 90, ECKVERBINDER: 30 } },
    { typ: 'Tueren', stueck: 13, h: 37, mat: { PRF_TUER_90: 66, BESCHLAG_B: 14, DICHTUNG_X: 68, ECKVERBINDER: 13 } },
  ]},
  { id: 'PA-2026-2063', projekt: 'DP2063X-BTL66920', freigegebenVon: 'Lukas Meyer', produkte: [
    { typ: 'Fenster', stueck: 18, h: 84, mat: { PRF_FENSTER_70: 77, BESCHLAG_A: 14, DICHTUNG_X: 112, GLAS_STD: 15 } },
    { typ: 'Fassaden', stueck: 18, h: 48, mat: { PRF_FASSADE_120: 144, BESCHLAG_B: 16, DICHTUNG_X: 162 } },
  ]},
  { id: 'PA-2026-2064', projekt: 'DP2064X-BTL67093', freigegebenVon: 'Tobias Klein', produkte: [
    { typ: 'Tueren', stueck: 21, h: 91, mat: { PRF_TUER_90: 107, BESCHLAG_B: 23, DICHTUNG_X: 109, ECKVERBINDER: 21 } },
    { typ: 'AWE', stueck: 23, h: 59, mat: { PRF_AWE_65: 163, BESCHLAG_B: 28, GLAS_AWE: 25 } },
  ]},
  { id: 'PA-2026-2065', projekt: 'DP2065X-BTL67266', freigegebenVon: 'Nina Schulz', produkte: [
    { typ: 'Fassaden', stueck: 24, h: 98, mat: { PRF_FASSADE_120: 192, BESCHLAG_B: 22, DICHTUNG_X: 216 } },
    { typ: 'Fluegel', stueck: 9, h: 70, mat: { PRF_FLUEGEL_55: 36, BESCHLAG_A: 7, DICHTUNG_X: 54, ECKVERBINDER: 18 } },
  ]},
  { id: 'PA-2026-2066', projekt: 'DP2066X-BTL67439', freigegebenVon: 'Jonas Richter', produkte: [
    { typ: 'AWE', stueck: 27, h: 105, mat: { PRF_AWE_65: 192, BESCHLAG_B: 32, GLAS_AWE: 30 } },
    { typ: 'Fenster', stueck: 14, h: 29, mat: { PRF_FENSTER_70: 60, BESCHLAG_A: 11, DICHTUNG_X: 87, GLAS_STD: 12 } },
  ]},
  { id: 'PA-2026-2067', projekt: 'DP2067X-BTL67612', freigegebenVon: 'Fatma Yildiz', produkte: [
    { typ: 'Fluegel', stueck: 30, h: 112, mat: { PRF_FLUEGEL_55: 120, BESCHLAG_A: 23, DICHTUNG_X: 180, ECKVERBINDER: 60 } },
    { typ: 'Tueren', stueck: 19, h: 40, mat: { PRF_TUER_90: 97, BESCHLAG_B: 21, DICHTUNG_X: 99, ECKVERBINDER: 19 } },
  ]},
  { id: 'PA-2026-2068', projekt: 'DP2068X-BTL67785', freigegebenVon: 'Anna Becker', produkte: [
    { typ: 'Fenster', stueck: 33, h: 41, mat: { PRF_FENSTER_70: 142, BESCHLAG_A: 26, DICHTUNG_X: 205, GLAS_STD: 28 } },
    { typ: 'Fassaden', stueck: 24, h: 51, mat: { PRF_FASSADE_120: 192, BESCHLAG_B: 22, DICHTUNG_X: 216 } },
  ]},
  { id: 'PA-2026-2069', projekt: 'DP2069X-BTL67958', freigegebenVon: 'Lukas Meyer', produkte: [
    { typ: 'Tueren', stueck: 36, h: 48, mat: { PRF_TUER_90: 184, BESCHLAG_B: 40, DICHTUNG_X: 187, ECKVERBINDER: 36 } },
    { typ: 'AWE', stueck: 10, h: 62, mat: { PRF_AWE_65: 71, BESCHLAG_B: 12, GLAS_AWE: 11 } },
  ]},
  { id: 'PA-2026-2070', projekt: 'DP2070X-BTL68131', freigegebenVon: 'Tobias Klein', produkte: [
    { typ: 'Fassaden', stueck: 39, h: 55, mat: { PRF_FASSADE_120: 312, BESCHLAG_B: 35, DICHTUNG_X: 351 } },
    { typ: 'Fluegel', stueck: 15, h: 73, mat: { PRF_FLUEGEL_55: 60, BESCHLAG_A: 12, DICHTUNG_X: 90, ECKVERBINDER: 30 } },
  ]},
];

const linePref = {
  Fenster: ['fensterlinie', 'fluegellinie-41', 'fluegellinie-43'],
  Tueren: ['tuerenlinie', 'vorbereitung'],
  Fassaden: ['fassaden', 'flexlinie'],
  AWE: ['awe-linie', 'flexlinie'],
  Fluegel: ['fluegellinie-41', 'fluegellinie-43', 'fensterlinie'],
};
const productOrder = ['Fenster', 'Tueren', 'Fassaden', 'AWE', 'Fluegel'];
const productColors = {
  Fenster: '#0ea5e9',
  Tueren: '#ef4444',
  Fassaden: '#8b5cf6',
  AWE: '#22c55e',
  Fluegel: '#f97316',
};
const lineChartColors = ['#2563eb', '#0891b2', '#16a34a', '#ca8a04', '#dc2626', '#7c3aed', '#db2777', '#ea580c'];

const s = {
  page: { minHeight: '100vh', background: '#eef2f7', padding: 18, fontFamily: 'Segoe UI, sans-serif', color: '#0f172a' },
  card: { background: '#ffffff', border: '1px solid #d7dde6', borderRadius: 10, padding: 12, boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)' },
  header: { background: 'linear-gradient(90deg, #2aa7dc 0%, #4cbce8 100%)', color: '#fff', borderRadius: 10, padding: '12px 14px', fontWeight: 700, fontSize: 26, textAlign: 'center' },
  sectionTitle: { fontWeight: 700, marginBottom: 8, fontSize: 15 },
  label: { display: 'block', fontSize: 12, color: '#475569', marginBottom: 4 },
  input: { width: '100%', border: '1px solid #c7d0dc', borderRadius: 7, padding: '7px 9px', fontSize: 13, background: '#fff' },
  button: { border: '1px solid #b9c6d5', borderRadius: 7, background: '#fff', padding: '7px 10px', cursor: 'pointer', fontSize: 13 },
  primaryButton: { border: '1px solid #2a92c2', borderRadius: 7, background: '#e8f6fd', color: '#0f5f84', padding: '7px 10px', cursor: 'pointer', fontSize: 13, fontWeight: 700 },
  row: { display: 'grid', gap: 10 },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(140px, 1fr))', gap: 8 },
  kpiCard: { background: '#f8fafc', border: '1px solid #dbe3ec', borderRadius: 8, padding: '7px 9px' },
  kpiLabel: { fontSize: 11, color: '#64748b' },
  kpiValue: { fontSize: 18, fontWeight: 700 },
  infoStrip: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  tableWrap: { overflowX: 'auto', border: '1px solid #dbe3ec', borderRadius: 8 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13, background: '#fff' },
  th: { padding: '7px 8px', background: '#ecf1f6', textAlign: 'left', fontSize: 12, color: '#334155', borderBottom: '1px solid #dbe3ec', position: 'sticky', top: 0, zIndex: 1 },
  td: { padding: '6px 8px', borderTop: '1px solid #edf1f5' },
  badge: { display: 'inline-block', borderRadius: 999, padding: '2px 8px', fontSize: 11, fontWeight: 700 },
  collapseBtn: { width: '100%', textAlign: 'left', border: '1px solid #d7dde6', background: '#f8fbff', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', fontWeight: 700, color: '#0f3050' },
};

function SidebarSection({ title, items, open, activeItem, onItemClick }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          fontSize: 20,
          fontWeight: 600,
          color: '#0f172a',
          marginBottom: open ? 10 : 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>{title}</span>
        <span style={{ fontSize: 14 }}>{open ? 'v' : '>'}</span>
      </div>
      {open && (
        <div style={{ paddingLeft: 8 }}>
          {items.map((item) => {
            const canSelect = item === 'Planung';
            const active = item === activeItem;
            return (
              <div
                key={`${title}-${item}`}
                onClick={() => {
                  if (canSelect) onItemClick(item);
                }}
                style={{
                  margin: '8px 0',
                  fontSize: 18,
                  fontWeight: active ? 700 : 400,
                  color: active ? '#0f172a' : '#1f2937',
                  borderLeft: active ? '4px solid #42b4e5' : '4px solid transparent',
                  paddingLeft: 10,
                  cursor: canSelect ? 'pointer' : 'default',
                  opacity: canSelect || active ? 1 : 0.8,
                }}
              >
                {item}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function isoToday() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function addDays(iso, days) { const d = new Date(`${iso}T00:00:00`); d.setDate(d.getDate() + days); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function fmt(iso) { return new Date(`${iso}T00:00:00`).toLocaleDateString('de-DE'); }
function calcProductionDurationDays(stunden) {
  const hours = Math.max(0, Number(stunden) || 0);
  return Math.max(1, Math.ceil((hours * PRODUCTION_TIME_FACTOR) / DAY_CAP));
}
function getPlannedProductionEnd(abrufTermin) {
  if (!abrufTermin) return '';
  return addDays(abrufTermin, -DELIVERY_BUFFER_DAYS);
}
function getPlannedProductionStart(abrufTermin, stunden) {
  const productionEnd = getPlannedProductionEnd(abrufTermin);
  if (!productionEnd) return '';
  const durationDays = calcProductionDurationDays(stunden);
  return addDays(productionEnd, -durationDays);
}
function dateDiffDays(fromIso, toIso) {
  if (!fromIso || !toIso) return null;
  const from = new Date(`${fromIso}T00:00:00`);
  const to = new Date(`${toIso}T00:00:00`);
  return Math.round((to - from) / 86400000);
}
function productionOrderNo(itemId) {
  const digits = String(itemId || '').replace(/\D/g, '');
  return `300${digits.slice(-7).padStart(7, '0')}`;
}
function defaultMatForProduct(produkt, stueck) {
  const qty = Number(stueck) || 0;
  const base = {
    Fenster: { PRF_FENSTER_70: 4.4, BESCHLAG_A: 0.8, DICHTUNG_X: 6.3, GLAS_STD: 0.85 },
    Tueren: { PRF_TUER_90: 5.2, BESCHLAG_B: 1.1, DICHTUNG_X: 5.4, ECKVERBINDER: 1.0 },
    Fassaden: { PRF_FASSADE_120: 8.1, BESCHLAG_B: 0.9, DICHTUNG_X: 9.4 },
    AWE: { PRF_AWE_65: 7.2, BESCHLAG_B: 1.3, GLAS_AWE: 1.1 },
    Fluegel: { PRF_FLUEGEL_55: 4.0, BESCHLAG_A: 0.78, DICHTUNG_X: 6.0, ECKVERBINDER: 2.0 },
  };
  const tpl = base[produkt] || {};
  const mat = {};
  Object.entries(tpl).forEach(([k, v]) => { mat[k] = Math.max(1, Math.round(v * qty)); });
  return mat;
}
function lName(id) { return lines.find((x) => x.id === id)?.name || '-'; }
function getIsoWeek(dateIso) { const d = new Date(`${dateIso}T00:00:00`); const u = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = u.getUTCDay() || 7; u.setUTCDate(u.getUTCDate() + 4 - day); const ys = new Date(Date.UTC(u.getUTCFullYear(), 0, 1)); return Math.ceil((((u - ys) / 86400000) + 1) / 7); }
function weekRange(startWeek, count = 1) { return Array.from({ length: count }, (_, i) => ((startWeek - 1 + i) % 53) + 1); }
function makeItems(start, startWeek) {
  const seedOrders = baseOrders.slice(0, 8);
  const dayPlans = [
    [
      { produkt: 'Fenster', stueck: 40, stunden: 84 }, { produkt: 'Fluegel', stueck: 32, stunden: 64 },
      { produkt: 'Tueren', stueck: 24, stunden: 80 }, { produkt: 'Fassaden', stueck: 28, stunden: 96 },
      { produkt: 'AWE', stueck: 14, stunden: 72 }, { produkt: 'Fenster', stueck: 26, stunden: 62 },
      { produkt: 'Tueren', stueck: 12, stunden: 44 }, { produkt: 'Fassaden', stueck: 22, stunden: 74 },
    ],
    [
      { produkt: 'Fassaden', stueck: 30, stunden: 108 }, { produkt: 'Fenster', stueck: 34, stunden: 90 },
      { produkt: 'AWE', stueck: 18, stunden: 84 }, { produkt: 'Tueren', stueck: 26, stunden: 88 },
      { produkt: 'Fluegel', stueck: 28, stunden: 70 }, { produkt: 'Fenster', stueck: 22, stunden: 56 },
      { produkt: 'Fassaden', stueck: 20, stunden: 68 }, { produkt: 'AWE', stueck: 12, stunden: 60 },
    ],
    [
      { produkt: 'Fluegel', stueck: 38, stunden: 92 }, { produkt: 'Tueren', stueck: 22, stunden: 74 },
      { produkt: 'Fenster', stueck: 30, stunden: 78 }, { produkt: 'AWE', stueck: 16, stunden: 76 },
      { produkt: 'Fassaden', stueck: 24, stunden: 82 }, { produkt: 'Tueren', stueck: 18, stunden: 66 },
      { produkt: 'Fenster', stueck: 28, stunden: 72 }, { produkt: 'Fluegel', stueck: 26, stunden: 64 },
    ],
    [
      { produkt: 'AWE', stueck: 20, stunden: 94 }, { produkt: 'Fassaden', stueck: 26, stunden: 86 },
      { produkt: 'Tueren', stueck: 30, stunden: 98 }, { produkt: 'Fenster', stueck: 24, stunden: 60 },
      { produkt: 'Fluegel', stueck: 34, stunden: 82 }, { produkt: 'Fassaden', stueck: 18, stunden: 66 },
      { produkt: 'AWE', stueck: 10, stunden: 46 }, { produkt: 'Fenster', stueck: 32, stunden: 88 },
    ],
    [
      { produkt: 'Fenster', stueck: 44, stunden: 112 }, { produkt: 'Tueren', stueck: 20, stunden: 70 },
      { produkt: 'Fluegel', stueck: 36, stunden: 90 }, { produkt: 'Fassaden', stueck: 22, stunden: 78 },
      { produkt: 'AWE', stueck: 14, stunden: 64 }, { produkt: 'Tueren', stueck: 16, stunden: 58 },
      { produkt: 'Fenster', stueck: 26, stunden: 68 }, { produkt: 'Fassaden', stueck: 24, stunden: 84 },
    ],
  ];

  return Array.from({ length: DEMO_DAY_COUNT }, (_, dayOffset) => {
    const planTag = addDays(start, dayOffset);
    const dayPlan = dayPlans[dayOffset] || dayPlans[dayPlans.length - 1];
    return dayPlan.map((plan, idx) => {
      const seed = seedOrders[idx % seedOrders.length] || { id: `PA-2026-${2000 + idx}`, projekt: `DEMO-${idx + 1}`, freigegebenVon: '-' };
      const abrufTermin = planTag;
      const productionStart = getPlannedProductionStart(abrufTermin, plan.stunden) || planTag;
      return {
        itemId: `${seed.id}-D${dayOffset + 1}`,
        auftragsId: `${seed.id}-D${dayOffset + 1}`,
        projekt: seed.projekt,
        freigegebenVon: seed.freigegebenVon,
        produkt: plan.produkt,
        stueck: plan.stueck,
        stunden: plan.stunden,
        mat: defaultMatForProduct(plan.produkt, plan.stueck),
        tag: '',
        kw: getIsoWeek(productionStart) || startWeek,
        abrufTermin,
        montageTermin: planTag,
        montageShiftCount: 0,
        manualPrio: false,
        lineId: '',
        sort: undefined,
        external: false,
        externalFirma: '',
        externalLogistik: '',
      };
    });
  }).flat();
}
function dayName(iso) { return ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][new Date(`${iso}T00:00:00`).getDay()]; }
function productColor(produkt) { return productColors[produkt] || '#64748b'; }
function lineColor(lineId) {
  const idx = lines.findIndex((x) => x.id === lineId);
  return idx === -1 ? '#64748b' : lineChartColors[idx % lineChartColors.length];
}
function hashText(value) {
  const input = String(value || '');
  let h = 0;
  for (let i = 0; i < input.length; i += 1) h = ((h << 5) - h) + input.charCodeAt(i);
  return Math.abs(h);
}
function getDemoMaterialScenario(item) {
  const itemId = String(item?.itemId || '');
  const demoMatch = itemId.match(/^PA-2026-(\d+)-D(\d+)$/);
  let bucket;
  if (demoMatch) {
    const orderOffset = Number(demoMatch[1]) - 2001;
    const dayOffset = Number(demoMatch[2]) - 1;
    if (Number.isFinite(orderOffset) && Number.isFinite(dayOffset) && orderOffset >= 0 && dayOffset >= 0) {
      // 8 Positionen pro Demotag -> 40 Positionen gesamt; %10 erzeugt exakt 70/30 Verteilung.
      bucket = ((dayOffset * 8) + orderOffset) % 10;
    }
  }
  if (!Number.isFinite(bucket)) {
    bucket = hashText(item?.itemId || item?.auftragsId || item?.projekt || '') % 10;
  }
  if (bucket <= 6) return 'ok_all_booked'; // 70%
  if (bucket === 7) return 'late_delivery';
  if (bucket === 8) return 'missing_delivery';
  return 'mixed_issue';
}
function getAxBestellungenForItem(item) {
  const scenario = getDemoMaterialScenario(item);
  const productionStart = item?.tag || item?.abrufTermin || '';
  return Object.entries(item?.mat || {}).map(([material, need], idx) => {
    const seed = hashText(`${item.itemId}-${material}-${idx}`);
    let confirmedDate = '';
    let arrivedQty = 0;
    let bookedQty = 0;
    if (scenario === 'ok_all_booked') {
      confirmedDate = productionStart ? addDays(productionStart, -2 - (seed % 2)) : '';
      arrivedQty = need;
      bookedQty = need;
    } else if (scenario === 'late_delivery') {
      confirmedDate = productionStart ? addDays(productionStart, 1 + (seed % 2)) : '';
      arrivedQty = Math.max(0, Math.round(Number(need) * 0.35));
      bookedQty = Math.max(0, Math.round(arrivedQty * 0.4));
    } else if (scenario === 'missing_delivery') {
      confirmedDate = '';
      arrivedQty = Math.max(0, Math.round(Number(need) * 0.55));
      bookedQty = Math.max(0, Math.round(arrivedQty * 0.6));
    } else {
      const variant = idx % 3;
      if (variant === 0) confirmedDate = productionStart ? addDays(productionStart, 2) : '';
      if (variant === 1) confirmedDate = '';
      if (variant === 2) confirmedDate = productionStart ? addDays(productionStart, -1) : '';
      arrivedQty = Math.max(0, Math.round(Number(need) * (0.35 + ((seed % 4) * 0.1))));
      bookedQty = Math.max(0, Math.round(arrivedQty * 0.5));
    }
    return {
      id: `${item.itemId}-${material}-${idx}`,
      orderNo: `AX-${String(seed).slice(-6).padStart(6, '0')}`,
      material,
      need: Number(need) || 0,
      confirmedDate,
      arrivedQty,
      bookedQty,
    };
  });
}
function getIsoWeekDates(week, year = new Date().getFullYear()) {
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
function getYearFromIso(iso) {
  const y = Number(String(iso || '').slice(0, 4));
  return Number.isFinite(y) && y > 1900 ? y : new Date().getFullYear();
}
function normalizeGrobItemsForFein(items, fallbackStart, fallbackKW) {
  if (!Array.isArray(items)) return null;
  return items.map((it, index) => {
    const fallbackTag = addDays(fallbackStart, index % DEMO_DAY_COUNT);
    const abrufTermin = it.abrufTermin || it.tag || fallbackTag;
    const productionStart = getPlannedProductionStart(abrufTermin, it.stunden) || it.tag || fallbackTag;
    const hasPlanning = Boolean(it.lineId) && Boolean(it.tag);
    return ({
    itemId: it.itemId || `${it.auftragsId || 'GROB'}-${index + 1}`,
    auftragsId: it.auftragsId || `GROB-${index + 1}`,
    projekt: it.projekt || '-',
    freigegebenVon: it.freigegebenVon || '-',
    produkt: it.produkt || 'Fenster',
    stueck: Number(it.stueck) || 0,
    stunden: Number(it.stunden) || 0,
    mat: it.mat || {},
    tag: hasPlanning ? it.tag : '',
    kw: getIsoWeek(productionStart) || fallbackKW,
    abrufTermin,
    montageTermin: it.montageTermin || it.abrufTermin || productionStart,
    montageShiftCount: Number(it.montageShiftCount) || 0,
    manualPrio: Boolean(it.manualPrio),
    lineId: hasPlanning ? it.lineId : '',
    sort: hasPlanning ? it.sort : undefined,
    external: Boolean(it.external),
    externalFirma: it.externalFirma || '',
    externalLogistik: it.externalLogistik || '',
    terminverschiebungen: Array.isArray(it.terminverschiebungen) ? it.terminverschiebungen : [],
  });
  });
}
function normalizeExistingFeinItems(items, fallbackStart, fallbackKW, keepPlanning = true) {
  if (!Array.isArray(items)) return null;
  return items.map((it, index) => {
    const fallbackTag = addDays(fallbackStart, index % DEMO_DAY_COUNT);
    const abrufTermin = it.abrufTermin || it.tag || fallbackTag;
    const productionStart = getPlannedProductionStart(abrufTermin, it.stunden) || it.tag || fallbackTag;
    const hasPlanning = keepPlanning && Boolean(it.lineId) && Boolean(it.tag);
    return ({
    ...it,
    tag: hasPlanning ? it.tag : '',
    kw: getIsoWeek(productionStart) || fallbackKW,
    lineId: hasPlanning ? it.lineId : '',
    sort: hasPlanning ? it.sort : undefined,
    abrufTermin,
    montageTermin: it.montageTermin || it.abrufTermin || productionStart,
    montageShiftCount: Number(it.montageShiftCount) || 0,
    manualPrio: Boolean(it.manualPrio),
    externalFirma: it.externalFirma || '',
    externalLogistik: it.externalLogistik || '',
    terminverschiebungen: Array.isArray(it.terminverschiebungen) ? it.terminverschiebungen : [],
  });
  });
}

function ensureMinUnplannedItems(items, minCount = 6) {
  if (!Array.isArray(items) || items.length === 0 || minCount <= 0) return items;
  const currentUnplanned = items.filter((it) => !it.external && (!it.tag || !it.lineId)).length;
  if (currentUnplanned >= minCount) return items;

  let needed = minCount - currentUnplanned;
  return items.map((it) => {
    if (needed <= 0) return it;
    if (it.external) return it;
    if (!it.tag || !it.lineId) return it;
    needed -= 1;
    return { ...it, tag: '', lineId: '', sort: undefined };
  });
}

const DEP_PARENT_PRODUCTS = new Set(['Fenster', 'AWE']);
const DEP_CHILD_PRODUCT = 'Fluegel';

function getDependencyBucketKey(item) {
  const base = item?.auftragsId || item?.itemId || item?.projekt || '-';
  return String(base).replace(/-D\d+$/, '');
}

function buildDependencyMap(items) {
  const buckets = {};
  (items || []).forEach((it) => {
    const bucketKey = getDependencyBucketKey(it);
    if (!buckets[bucketKey]) buckets[bucketKey] = { parents: [], children: [] };
    if (DEP_PARENT_PRODUCTS.has(it.produkt)) buckets[bucketKey].parents.push(it);
    if (it.produkt === DEP_CHILD_PRODUCT) buckets[bucketKey].children.push(it);
  });

  const groups = {};
  Object.entries(buckets).forEach(([bucketKey, bucket]) => {
    const parents = [...bucket.parents].sort((a, b) => a.itemId.localeCompare(b.itemId));
    const children = [...bucket.children].sort((a, b) => a.itemId.localeCompare(b.itemId));
    if (parents.length === 0 || children.length === 0) return;
    children.forEach((child, idx) => {
      const parent = parents[idx % parents.length];
      const groupId = `${bucketKey}:${parent.itemId}`;
      if (!groups[groupId]) groups[groupId] = { parentId: parent.itemId, childIds: new Set() };
      groups[groupId].childIds.add(child.itemId);
    });
  });

  const map = {};
  Object.entries(groups).forEach(([groupId, group]) => {
    const childIds = [...group.childIds];
    map[group.parentId] = {
      groupId,
      role: 'parent',
      parentId: group.parentId,
      childIds,
      linkedIds: childIds,
    };
    childIds.forEach((childId) => {
      map[childId] = {
        groupId,
        role: 'child',
        parentId: group.parentId,
        childIds,
        linkedIds: [group.parentId, ...childIds.filter((id) => id !== childId)],
      };
    });
  });
  return map;
}

export default function FeinplanungScreen() {
  const [activeMenuItem, setActiveMenuItem] = useState('Planung');
  const defaultStart = isoToday();
  const defaultWeek = getIsoWeek(defaultStart);
  const saved = typeof window !== 'undefined' ? window.localStorage.getItem(STORE_KEY) : null;
  const parsedRaw = saved ? JSON.parse(saved) : null;
  const parsed = parsedRaw?.demoDataVersion === DEMO_DATA_VERSION ? parsedRaw : null;
  const grobSaved = typeof window !== 'undefined' ? window.localStorage.getItem(GROB_KEY) : null;
  const grobParsed = grobSaved ? JSON.parse(grobSaved) : null;
  const minDemoItems = DEMO_DAY_COUNT * 8;
  const grobItemsForFein = !parsed?.items && Array.isArray(grobParsed?.items) && grobParsed.items.length >= minDemoItems
    ? normalizeGrobItemsForFein(grobParsed.items, defaultStart, defaultWeek)
    : null;

  const [slotMode, setSlotMode] = useState(parsed?.slotMode || grobParsed?.slotMode || 'tag');
  const [start, setStart] = useState(parsed?.start || grobParsed?.start || defaultStart);
  const [end, setEnd] = useState(parsed?.end || defaultStart);
  const [selectedKW, setSelectedKW] = useState(parsed?.selectedKW || grobParsed?.selectedKW || defaultWeek);
  const [hallFilter, setHallFilter] = useState(parsed?.hallFilter || 'alle');
  const [lineFilter, setLineFilter] = useState(parsed?.lineFilter || 'alle');
  const [productFilter, setProductFilter] = useState(parsed?.productFilter || 'alle');
  const baseInitialItems = parsed?.items
    ? normalizeExistingFeinItems(parsed.items, defaultStart, defaultWeek, Boolean(parsed?.fixed))
    : (grobItemsForFein || makeItems(defaultStart, defaultWeek));
  const initialItems = ensureMinUnplannedItems(baseInitialItems, 6);
  const [items, setItems] = useState(initialItems);
  const [fixed, setFixed] = useState(parsed?.fixed || false);
  const [history, setHistory] = useState(parsed?.history || []);
  const [missingModal, setMissingModal] = useState(null);
  const [axModal, setAxModal] = useState(null);
  const [materialPlanWarningModal, setMaterialPlanWarningModal] = useState(null);
  const pendingMaterialPlanActionRef = useRef(null);
  const [externalModal, setExternalModal] = useState(null);
  const [fixConfirmModal, setFixConfirmModal] = useState(false);
  const [capacityWarningModal, setCapacityWarningModal] = useState(null);
  const [reasonModal, setReasonModal] = useState(null);
  const [reason, setReason] = useState('');
  const [drag, setDrag] = useState(null);
  const [drop, setDrop] = useState(null);
  const [terminModal, setTerminModal] = useState(null);
  const [shiftModal, setShiftModal] = useState(null);
  const [staffAssignments, setStaffAssignments] = useState(parsed?.staffAssignments || {});
  const [personAssignments, setPersonAssignments] = useState(parsed?.personAssignments || {});
  const [tablePage, setTablePage] = useState(1);
  const [showCompactTable, setShowCompactTable] = useState(false);
  const [open, setOpen] = useState({
    setup: true,
    actions: true,
    machinePlan: true,
    linePlan: true,
  });

  function persist(next) {
    setSlotMode(next.slotMode); setStart(next.start); setEnd(next.end); setSelectedKW(next.selectedKW); setHallFilter(next.hallFilter);
    setLineFilter(next.lineFilter || 'alle'); setProductFilter(next.productFilter || 'alle');
    setItems(next.items); setFixed(next.fixed); setHistory(next.history);
    setStaffAssignments(next.staffAssignments || {});
    setPersonAssignments(next.personAssignments || {});
    if (typeof window !== 'undefined') window.localStorage.setItem(STORE_KEY, JSON.stringify(next));
  }

  function makeState(
    nextItems,
    nextFixed = fixed,
    nextHistory = history,
    nextSlotMode = slotMode,
    nextStart = start,
    nextEnd = end,
    nextSelectedKW = selectedKW,
    nextHall = hallFilter,
    nextLine = lineFilter,
    nextProduct = productFilter,
    nextStaffAssignments = staffAssignments,
    nextPersonAssignments = personAssignments,
  ) {
    return {
      demoDataVersion: DEMO_DATA_VERSION,
      slotMode: nextSlotMode,
      start: nextStart,
      end: nextEnd,
      selectedKW: nextSelectedKW,
      hallFilter: nextHall,
      lineFilter: nextLine,
      productFilter: nextProduct,
      items: nextItems,
      fixed: nextFixed,
      history: nextHistory,
      staffAssignments: nextStaffAssignments,
      personAssignments: nextPersonAssignments,
    };
  }

  function missingForItem(item) {
    const scenario = getDemoMaterialScenario(item);
    if (scenario !== 'mixed_issue') return [];
    return Object.entries(item.mat || {})
      .filter((_, idx) => idx % 4 === 0)
      .map(([mat, need]) => {
        const have = Math.max(0, Math.round(Number(need) * 0.7));
        return { mat, need, have, miss: Math.max(0, need - have) };
      })
      .filter((entry) => entry.miss > 0);
  }
  function hasMat(item) { return missingForItem(item).length === 0; }
  function getMaterialFreigabe(item) {
    const miss = missingForItem(item);
    const rows = getAxBestellungenForItem(item);
    const productionStart = item?.tag || item?.abrufTermin || '';
    const allBooked = rows.length > 0 && rows.every((row) => row.arrivedQty >= row.need && row.bookedQty >= row.need);
    const allConfirmedBeforeStart = Boolean(productionStart) && rows.length > 0 && rows.every((row) => Boolean(row.confirmedDate) && row.confirmedDate <= productionStart);
    const ready = miss.length === 0 && (allBooked || allConfirmedBeforeStart);
    return { ready, miss, allBooked, allConfirmedBeforeStart };
  }

  function collectMaterialPlanningWarnings(itemIds) {
    const ids = Array.from(new Set((itemIds || []).filter(Boolean)));
    return ids
      .map((id) => items.find((it) => it.itemId === id))
      .filter(Boolean)
      .map((item) => {
        const freigabe = getMaterialFreigabe(item);
        if (freigabe.ready) return null;
        const reasons = [];
        if (freigabe.miss.length > 0) {
          reasons.push(
            `Fehlteile: ${freigabe.miss.slice(0, 3).map((m) => `${m.mat} (-${m.miss})`).join(', ')}${freigabe.miss.length > 3 ? ' ...' : ''}`,
          );
        }
        if (!freigabe.allBooked) {
          reasons.push('AX ist nicht vollstaendig eingebucht.');
        }
        if (!freigabe.allConfirmedBeforeStart) {
          reasons.push('Liefertermine sind nicht rechtzeitig vor Produktionsbeginn bestaetigt.');
        }
        if (reasons.length === 0) reasons.push('Materialstatus ist nicht OK.');
        return {
          itemId: item.itemId,
          projekt: item.projekt,
          produkt: item.produkt,
          reasons,
        };
      })
      .filter(Boolean);
  }

  function runPlanningWithMaterialWarning(itemIds, proceed) {
    const warnings = collectMaterialPlanningWarnings(itemIds);
    if (warnings.length === 0) {
      proceed();
      return;
    }
    pendingMaterialPlanActionRef.current = proceed;
    setMaterialPlanWarningModal({ warnings });
  }

  const visibleLines = useMemo(() => lines.filter((l) => hallFilter === 'alle' || l.hall === hallFilter), [hallFilter]);
  const lineFilterOptions = useMemo(() => visibleLines, [visibleLines]);
  const productFilterOptions = useMemo(() => {
    const present = new Set(items.map((it) => it.produkt).filter(Boolean));
    const ordered = productOrder.filter((p) => present.has(p));
    const rest = [...present].filter((p) => !productOrder.includes(p)).sort();
    return [...ordered, ...rest];
  }, [items]);
  const matchesProductFilter = (it) => productFilter === 'alle' || it.produkt === productFilter;
  const matchesLineFilter = (it) => lineFilter === 'alle' || it.lineId === lineFilter;
  const matchesLineAndProductFilter = (it) => matchesProductFilter(it) && matchesLineFilter(it);
  const slotKeys = useMemo(() => (slotMode === 'kw' ? [`KW-${selectedKW}`] : [`D-${start}`]), [slotMode, selectedKW, start]);
  const currentSlotKey = slotKeys[0];
  const slotCap = slotMode === 'kw' ? WEEK_CAP : DAY_CAP;
  function itemSlotKey(it) { return slotMode === 'kw' ? `KW-${it.kw}` : `D-${it.tag}`; }
  function slotLabel(it) { return slotMode === 'kw' ? `KW ${it.kw}` : fmt(it.tag); }
  function isItemPlanned(it) {
    if (!it?.lineId) return false;
    return Boolean(it?.tag) || Boolean(it?.kw);
  }
  const currentSlotLabel = slotMode === 'kw' ? `KW ${selectedKW}` : fmt(start);
  const dependencyMap = useMemo(() => buildDependencyMap(items), [items]);
  const itemById = useMemo(() => {
    const map = {};
    items.forEach((it) => { map[it.itemId] = it; });
    return map;
  }, [items]);

  function getLinkedGroupIds(itemId) {
    const dep = dependencyMap[itemId];
    if (!dep) return [itemId];
    return [itemId, ...(dep.linkedIds || [])];
  }

  function resolveForcedFluegelLineId(sourceItem, targetItem) {
    if (!sourceItem || !targetItem || targetItem.produkt !== 'Fluegel') return '';
    let parentProduct = '';
    if (sourceItem.produkt === 'Fenster' || sourceItem.produkt === 'AWE') {
      parentProduct = sourceItem.produkt;
    } else {
      const sourceDep = dependencyMap[sourceItem.itemId];
      const parentItem = sourceDep?.parentId ? itemById[sourceDep.parentId] : null;
      parentProduct = parentItem?.produkt || '';
    }
    if (parentProduct === 'Fenster') return 'fluegellinie-41';
    if (parentProduct === 'AWE') return 'fluegellinie-43';
    return '';
  }

  function applyLinkedLineRules(nextItems, sourceItemId, requestedLineId, linkedIds) {
    if (!requestedLineId || !Array.isArray(linkedIds) || linkedIds.length === 0) return nextItems;
    const sourceItem = nextItems.find((it) => it.itemId === sourceItemId) || itemById[sourceItemId];
    if (!sourceItem) return nextItems;

    const linkedIdSet = new Set(linkedIds);
    const touchedLines = new Set();
    let adjusted = nextItems.map((it) => {
      if (!linkedIdSet.has(it.itemId) || it.external) return it;
      const forcedFluegelLine = resolveForcedFluegelLineId(sourceItem, it);
      const nextLineId = forcedFluegelLine || requestedLineId;
      if (it.lineId !== nextLineId) {
        if (it.lineId) touchedLines.add(it.lineId);
        if (nextLineId) touchedLines.add(nextLineId);
      }
      return { ...it, lineId: nextLineId, sort: undefined };
    });

    touchedLines.forEach((lineId) => {
      if (!lineId) return;
      const ordered = sortLine(adjusted.filter((it) => it.lineId === lineId));
      const indexById = {};
      ordered.forEach((it, idx) => { indexById[it.itemId] = idx; });
      adjusted = adjusted.map((it) => (
        it.lineId === lineId && indexById[it.itemId] !== undefined
          ? { ...it, sort: indexById[it.itemId] }
          : it
      ));
    });

    return adjusted;
  }

  function applySharedSlotSync(nextItems, changedIds) {
    if (!Array.isArray(changedIds) || changedIds.length === 0) return nextItems;
    const sourceById = {};
    nextItems.forEach((it) => { sourceById[it.itemId] = it; });
    const nextById = { ...sourceById };
    const touchedGroups = new Set();
    changedIds.forEach((id) => {
      const dep = dependencyMap[id];
      if (!dep || touchedGroups.has(dep.groupId)) return;
      touchedGroups.add(dep.groupId);
      const source = sourceById[id];
      if (!source) return;
      getLinkedGroupIds(id).forEach((linkedId) => {
        const linked = nextById[linkedId];
        if (!linked || linked.external) return;
        nextById[linkedId] = {
          ...linked,
          tag: source.tag,
          kw: source.kw,
          abrufTermin: source.abrufTermin,
          montageTermin: source.montageTermin,
        };
      });
    });
    return nextItems.map((it) => nextById[it.itemId] || it);
  }

  function hasLinkedTimingMismatch(item) {
    const dep = dependencyMap[item?.itemId];
    if (!dep) return false;
    return (dep.linkedIds || []).some((linkedId) => {
      const linked = itemById[linkedId];
      if (!linked) return false;
      return linked.abrufTermin !== item.abrufTermin || linked.montageTermin !== item.montageTermin || linked.tag !== item.tag || linked.kw !== item.kw;
    });
  }

  const slotStaffAssignments = useMemo(() => {
    const slotMap = staffAssignments?.[currentSlotKey] || {};
    const merged = {};
    SHIFT_TEAMS.forEach((team) => {
      merged[team.id] = slotMap[team.id] || team.homeLineId;
    });
    return merged;
  }, [staffAssignments, currentSlotKey]);

  const slotPersonAssignments = useMemo(() => {
    const slotMap = personAssignments?.[currentSlotKey] || {};
    const merged = {};
    SHIFT_PERSONS.forEach((person) => {
      merged[person.id] = slotMap[person.id] || person.homeLineId;
    });
    return merged;
  }, [personAssignments, currentSlotKey]);

  const lineTeamCount = useMemo(() => {
    const map = {};
    lines.forEach((line) => { map[line.id] = 0; });
    Object.values(slotStaffAssignments).forEach((lineId) => {
      if (map[lineId] !== undefined) map[lineId] += 1;
    });
    return map;
  }, [slotStaffAssignments]);

  const linePersonCount = useMemo(() => {
    const map = {};
    lines.forEach((line) => { map[line.id] = 0; });
    Object.values(slotPersonAssignments).forEach((lineId) => {
      if (map[lineId] !== undefined) map[lineId] += 1;
    });
    return map;
  }, [slotPersonAssignments]);

  const lineCapacityMap = useMemo(() => {
    const map = {};
    lines.forEach((line) => {
      const personCount = linePersonCount[line.id] || 0;
      map[line.id] = Math.max(0, Math.round((slotCap * personCount) / BASE_PERSONS_PER_LINE));
    });
    return map;
  }, [linePersonCount, slotCap]);

  function lineCapFor(lineId) {
    return lineCapacityMap[lineId] ?? slotCap;
  }

  const lineLoad = useMemo(() => {
    const map = {};
    items.forEach((it) => { if (it.external) return; if (it.lineId) map[`${it.lineId}|${itemSlotKey(it)}`] = (map[`${it.lineId}|${itemSlotKey(it)}`] || 0) + it.stunden; });
    return map;
  }, [items, slotMode]);

  function canLine(item, lineId) {
    if (item.external) return false;
    if (!lineId) return true;
    const slot = itemSlotKey(item);
    const own = item.lineId === lineId ? item.stunden : 0;
    const used = (lineLoad[`${lineId}|${slot}`] || 0) - own + item.stunden;
    return used <= lineCapFor(lineId);
  }
  function getLineCapacityCheck(item, lineId) {
    if (!item || !lineId) return null;
    const slot = itemSlotKey(item);
    const own = item.lineId === lineId ? item.stunden : 0;
    const usedBefore = (lineLoad[`${lineId}|${slot}`] || 0) - own;
    const usedAfter = usedBefore + item.stunden;
    const cap = lineCapFor(lineId);
    return {
      usedBefore,
      usedAfter,
      cap,
      overBy: Math.max(0, usedAfter - cap),
    };
  }
  function openCapacityWarning(item, lineId) {
    if (!item || !lineId) return;
    const check = getLineCapacityCheck(item, lineId);
    setCapacityWarningModal({
      itemId: item.itemId,
      projekt: item.projekt,
      produkt: item.produkt,
      stunden: item.stunden,
      lineName: lName(lineId),
      cap: check?.cap ?? 0,
      usedAfter: check?.usedAfter ?? 0,
      overBy: check?.overBy ?? 0,
    });
  }
  function getSuggestionCapacityCheck(itemId, suggestion, sourceItems = items) {
    if (!itemId || !suggestion?.lineId) return null;
    const linkedIds = getLinkedGroupIds(itemId);
    const groupItems = sourceItems.filter((it) => linkedIds.includes(it.itemId) && !it.external);
    if (groupItems.length === 0) return null;

    const targetSlot = suggestion.slot
      || (suggestion.kw ? `KW-${suggestion.kw}` : (suggestion.day ? `D-${suggestion.day}` : null));
    if (!targetSlot) return null;

    const sourceItem = sourceItems.find((it) => it.itemId === itemId) || itemById[itemId];
    if (!sourceItem) return null;

    const lineHours = {};
    groupItems.forEach((it) => {
      const forcedFluegelLine = resolveForcedFluegelLineId(sourceItem, it);
      const targetLineId = forcedFluegelLine || suggestion.lineId;
      lineHours[targetLineId] = (lineHours[targetLineId] || 0) + (Number(it.stunden) || 0);
    });

    const checks = Object.entries(lineHours).map(([lineId, groupedHours]) => {
      const usedBefore = sourceItems.reduce((sum, it) => {
        if (it.external || it.lineId !== lineId) return sum;
        if (linkedIds.includes(it.itemId)) return sum;
        return itemSlotKey(it) === targetSlot ? sum + (Number(it.stunden) || 0) : sum;
      }, 0);
      const cap = lineCapFor(lineId);
      const usedAfter = usedBefore + groupedHours;
      return {
        lineId,
        groupedHours,
        usedBefore,
        usedAfter,
        cap,
        overBy: Math.max(0, usedAfter - cap),
      };
    });

    const worst = checks.sort((a, b) => b.overBy - a.overBy || b.usedAfter - a.usedAfter)[0];
    const groupHours = groupItems.reduce((sum, it) => sum + (Number(it.stunden) || 0), 0);

    return {
      linkedIds,
      groupHours,
      usedBefore: worst?.usedBefore || 0,
      usedAfter: worst?.usedAfter || 0,
      cap: worst?.cap || 0,
      overBy: worst?.overBy || 0,
      lineId: worst?.lineId || suggestion.lineId,
      targetSlot,
      checks,
    };
  }
  function openSuggestionCapacityWarning(itemId, suggestion, sourceItems = items) {
    const check = getSuggestionCapacityCheck(itemId, suggestion, sourceItems);
    if (!check) return;
    const refItem = sourceItems.find((it) => it.itemId === itemId) || sourceItems.find((it) => check.linkedIds.includes(it.itemId));
    if (!refItem) return;
    setCapacityWarningModal({
      itemId: check.linkedIds.length > 1 ? `${refItem.itemId} (+${check.linkedIds.length - 1})` : refItem.itemId,
      projekt: refItem.projekt,
      produkt: check.linkedIds.length > 1 ? 'Verbundauftrag' : refItem.produkt,
      stunden: check.groupHours,
      lineName: lName(check.lineId || suggestion.lineId),
      cap: check.cap,
      usedAfter: check.usedAfter,
      overBy: check.overBy,
    });
  }

  function updateShiftTeam(teamId, targetLineId) {
    if (!teamId || !targetLineId) return;
    withReason('Schichtplanung angepasst', (r) => {
      const slotMap = staffAssignments?.[currentSlotKey] || {};
      const nextSlotMap = { ...slotMap, [teamId]: targetLineId };
      const nextStaffAssignments = { ...staffAssignments, [currentSlotKey]: nextSlotMap };
      const personSlotMap = personAssignments?.[currentSlotKey] || {};
      const nextPersonSlotMap = { ...personSlotMap };
      SHIFT_PERSONS.filter((person) => person.teamId === teamId).forEach((person) => {
        nextPersonSlotMap[person.id] = targetLineId;
      });
      const nextPersonAssignments = { ...personAssignments, [currentSlotKey]: nextPersonSlotMap };
      const nextHistory = r
        ? [...history, { ts: new Date().toISOString(), label: 'Schichtplanung angepasst', reason: r }]
        : history;
      persist(makeState(items, fixed, nextHistory, slotMode, start, end, selectedKW, hallFilter, lineFilter, productFilter, nextStaffAssignments, nextPersonAssignments));
    });
  }

  function updateShiftPerson(personId, targetLineId) {
    if (!personId || !targetLineId) return;
    withReason('Personaleinsatz angepasst', (r) => {
      const slotMap = personAssignments?.[currentSlotKey] || {};
      const nextSlotMap = { ...slotMap, [personId]: targetLineId };
      const nextPersonAssignments = { ...personAssignments, [currentSlotKey]: nextSlotMap };
      const nextHistory = r
        ? [...history, { ts: new Date().toISOString(), label: 'Personaleinsatz angepasst', reason: r }]
        : history;
      persist(makeState(items, fixed, nextHistory, slotMode, start, end, selectedKW, hallFilter, lineFilter, productFilter, staffAssignments, nextPersonAssignments));
    });
  }

  function withReason(label, fn) {
    if (!fixed) { fn(''); return; }
    setReason('');
    setReasonModal({ label, fn });
  }
  function confirmReason() {
    if (!reasonModal || !reason.trim()) return;
    reasonModal.fn(reason.trim());
    setReasonModal(null);
    setReason('');
  }
  function applyChange(label, nextItems, reasonText) {
    const applyKwModeDerivedStartDates = (sourceItems) => {
      if (slotMode !== 'kw') return sourceItems;
      const baseYear = getYearFromIso(start);
      const groups = {};
      sourceItems.forEach((it) => {
        if (it.external || !it.lineId || !it.kw) return;
        const key = `${it.kw}|${it.lineId}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(it);
      });

      const derivedStartById = {};
      Object.entries(groups).forEach(([key, lineItems]) => {
        const [kwRaw, lineId] = key.split('|');
        const kw = Number(kwRaw);
        if (!kw || !lineId) return;
        const weekDays = getIsoWeekDates(kw, baseYear);
        if (!Array.isArray(weekDays) || weekDays.length === 0) return;
        const dayCap = Math.max(1, (lineCapFor(lineId) || WEEK_CAP) / KW_CAPACITY_DAYS);
        let consumed = 0;
        const ordered = sortLine(lineItems);
        ordered.forEach((it) => {
          const startDayIndex = Math.min(weekDays.length - 1, Math.max(0, Math.floor(consumed / dayCap)));
          derivedStartById[it.itemId] = weekDays[startDayIndex];
          consumed += Number(it.stunden) || 0;
        });
      });

      return sourceItems.map((it) => {
        if (!Object.prototype.hasOwnProperty.call(derivedStartById, it.itemId)) return it;
        return { ...it, tag: derivedStartById[it.itemId] };
      });
    };

    const normalizedItems = applyKwModeDerivedStartDates(nextItems);
    const nextHistory = reasonText ? [...history, { ts: new Date().toISOString(), label, reason: reasonText }] : history;
    persist(makeState(normalizedItems, fixed, nextHistory));
  }
  function confirmFixPlanning() {
    const nextHistory = [
      ...history,
      {
        ts: new Date().toISOString(),
        label: 'Planung fixiert',
        reason: 'Bestaetigung Popup: Mail an alle Montageleiter zur verplanten Bauteilliste ausgelöst.',
      },
    ];
    persist(makeState(items, true, nextHistory));
    setFixConfirmModal(false);
  }
  function updateItem(itemId, changes, label) {
    withReason(label, (r) => {
      const shouldPropagateTiming = Object.prototype.hasOwnProperty.call(changes, 'abrufTermin')
        || Object.prototype.hasOwnProperty.call(changes, 'tag')
        || Object.prototype.hasOwnProperty.call(changes, 'kw');
      const shouldPropagateLine = Object.prototype.hasOwnProperty.call(changes, 'lineId');
      const linkedIds = (shouldPropagateTiming || shouldPropagateLine) ? getLinkedGroupIds(itemId) : [itemId];
      const executeUpdate = () => {
        let next = items.map((it) => {
          if (!linkedIds.includes(it.itemId)) return it;
          let updated = { ...it, ...changes };
          if (Object.prototype.hasOwnProperty.call(changes, 'abrufTermin')) {
            const targetDate = changes.abrufTermin || '';
            updated = withTerminverschiebung(updated, {
              fieldKey: 'abrufTermin',
              label: 'Abruftermin',
              fromValue: it.abrufTermin || '',
              toValue: targetDate,
              changedBy: 'AV Planung',
              bereich: 'Feinplanung',
            });
            if (targetDate) {
              const productionStart = getPlannedProductionStart(targetDate, updated.stunden) || targetDate;
              updated.tag = productionStart;
              updated.kw = getIsoWeek(productionStart) || updated.kw;
            }
          }
          return updated;
        });
        if (shouldPropagateLine) {
          const requestedLineId = changes.lineId || '';
          if (requestedLineId) {
            next = applyLinkedLineRules(next, itemId, requestedLineId, linkedIds);
          } else {
            next = next.map((it) => (linkedIds.includes(it.itemId) ? { ...it, lineId: '', sort: undefined } : it));
          }
        }
        const synced = shouldPropagateTiming ? applySharedSlotSync(next, [itemId]) : next;
        applyChange(label, synced, r);
      };

      if (shouldPropagateLine && Boolean(changes.lineId)) {
        runPlanningWithMaterialWarning(linkedIds, executeUpdate);
        return;
      }
      executeUpdate();
    });
  }
  function updateMontageTermin(itemId, nextMontageTermin) {
    withReason('Montagetermin geaendert', (r) => {
      const linkedIds = getLinkedGroupIds(itemId);
      const next = items.map((it) => {
        if (!linkedIds.includes(it.itemId)) return it;
        const oldDate = it.montageTermin || '';
        const changed = Boolean(nextMontageTermin) && nextMontageTermin !== oldDate;
        const updated = {
          ...it,
          montageTermin: nextMontageTermin,
          montageShiftCount: changed ? (Number(it.montageShiftCount) || 0) + 1 : (Number(it.montageShiftCount) || 0),
        };
        return withTerminverschiebung(updated, {
          fieldKey: 'montageTermin',
          label: 'Montagetermin',
          fromValue: oldDate,
          toValue: nextMontageTermin || '',
          changedBy: 'AV Planung',
          bereich: 'Feinplanung',
        });
      });
      const synced = applySharedSlotSync(next, [itemId]);
      applyChange('Montagetermin geaendert', synced, r);
    });
  }
  function updateProductionStart(itemId, nextTag) {
    if (!nextTag) return;
    updateItem(itemId, { tag: nextTag, kw: getIsoWeek(nextTag) }, 'Produktionsbeginn geaendert');
  }
  function setManualPrio(itemId, value) {
    const next = items.map((it) => (it.itemId === itemId ? { ...it, manualPrio: Boolean(value) } : it));
    applyChange('Prio geaendert', next, '');
  }
  function toggleExternal(itemId) {
    const item = items.find((x) => x.itemId === itemId);
    if (!item) return;
    if (!item.external) {
      setExternalModal({ itemId, scope: item.externalLogistik || 'alles' });
      return;
    }
    withReason('Externe Produktion geaendert', (r) => {
      const next = items.map((it) => {
        if (it.itemId !== itemId) return it;
        return { ...it, external: false, externalFirma: '', externalLogistik: '' };
      });
      applyChange('Externe Produktion geaendert', next, r);
    });
  }

  function externalMailtoFor(item) {
    if (!item) return `mailto:${THOMAS_MIX_EMAIL}`;
    const scopeLabel = EXTERNAL_SCOPE_OPTIONS.find((opt) => opt.value === item.externalLogistik)?.label || 'Alles zusammen';
    const subject = encodeURIComponent(`Bitte extern verplanen: ${item.itemId}`);
    const body = encodeURIComponent(
      `Hallo Thomas,\n\n` +
      `bitte den folgenden Auftrag extern verplanen:\n` +
      `Position: ${item.itemId}\n` +
      `Projekt: ${item.projekt}\n` +
      `Produkt: ${item.produkt}\n` +
      `Umfang externe Vergabe: ${scopeLabel}\n` +
      `Stück: ${item.stueck}\n` +
      `Stunden: ${item.stunden}\n` +
      `Abruftermin: ${item.abrufTermin || '-'}\n` +
      `Montagetermin: ${item.montageTermin || '-'}\n\n` +
      `Danke.`
    );
    return `mailto:${THOMAS_MIX_EMAIL}?subject=${subject}&body=${body}`;
  }

  function confirmExternal() {
    if (!externalModal) return;
    const id = externalModal.itemId;
    const selectedScope = externalModal.scope || 'alles';
    const item = items.find((x) => x.itemId === id);
    const mailto = externalMailtoFor({ ...(item || {}), externalLogistik: selectedScope });
    withReason('Externe Produktion geaendert', (r) => {
      const next = items.map((it) => {
        if (it.itemId !== id) return it;
        return { ...it, external: true, lineId: '', sort: undefined, externalFirma: 'Thomas Mix', externalLogistik: selectedScope };
      });
      applyChange('Externe Produktion geaendert', next, r);
    });
    setExternalModal(null);
    if (typeof window !== 'undefined') window.location.href = mailto;
  }
  function sortLine(arr) { return [...arr].sort((a, b) => (a.sort ?? Number.MAX_SAFE_INTEGER) - (b.sort ?? Number.MAX_SAFE_INTEGER) || a.itemId.localeCompare(b.itemId)); }

  function dropOnLine(targetLineId, targetItemId = null) {
    if (!drag) return;
    withReason('Linien-Reihenfolge/Verschiebung', (r) => {
      const dragged = items.find((x) => x.itemId === drag.itemId);
      if (!dragged) return;
      if (!canLine(dragged, targetLineId)) {
        openCapacityWarning(dragged, targetLineId);
        return;
      }
      const executeMove = () => {
        let next = items.map((it) => (it.itemId === dragged.itemId ? { ...it, lineId: targetLineId } : it));
        const target = sortLine(next.filter((x) => x.lineId === targetLineId && x.itemId !== dragged.itemId));
        const insertAt = targetItemId ? Math.max(0, target.findIndex((x) => x.itemId === targetItemId)) : target.length;
        target.splice(insertAt, 0, { ...dragged, lineId: targetLineId });
        const map = {}; target.forEach((x, i) => { map[x.itemId] = i; });
        next = next.map((it) => (it.lineId === targetLineId && map[it.itemId] !== undefined ? { ...it, sort: map[it.itemId] } : it));
        const source = sortLine(next.filter((x) => x.lineId === drag.lineId));
        const smap = {}; source.forEach((x, i) => { smap[x.itemId] = i; });
        next = next.map((it) => (it.lineId === drag.lineId && smap[it.itemId] !== undefined ? { ...it, sort: smap[it.itemId] } : it));
        applyChange('Linie verschoben', next, r);
        setDrag(null); setDrop(null);
      };
      runPlanningWithMaterialWarning([dragged.itemId], executeMove);
    });
  }

  const lineCards = useMemo(() => visibleLines.map((l) => {
    const planned = sortLine(items.filter((x) => x.lineId === l.id && itemSlotKey(x) === currentSlotKey && matchesProductFilter(x)));
    const used = planned.reduce((sAcc, x) => sAcc + x.stunden, 0);
    const cap = Math.max(1, lineCapFor(l.id));
    const p = Math.min(100, Math.round((used / cap) * 100));
    const color = used >= cap ? '#dc2626' : used >= cap * 0.85 ? '#d97706' : '#42b4e5';
    const marks = [];
    let k = 0; planned.forEach((x, i) => { k += x.stunden; if (i < planned.length - 1) marks.push(Math.min(100, (k / cap) * 100)); });
    return { ...l, planned, used, cap, p, color, marks };
  }), [items, visibleLines, lineCapacityMap, currentSlotKey, slotMode, productFilter]);

  const displayedLineCards = useMemo(
    () => lineCards.filter((line) => lineFilter === 'alle' || line.id === lineFilter),
    [lineCards, lineFilter],
  );

  const hallMatch = (it) => {
    if (!it.lineId) return false;
    if (hallFilter === 'alle') return true;
    const line = lines.find((l) => l.id === it.lineId);
    return line?.hall === hallFilter;
  };

  const missingItems = items.map((it) => ({ it, miss: missingForItem(it) })).filter((x) => x.miss.length > 0);
  const kwDaySummary = useMemo(() => {
    if (slotMode !== 'kw') return [];
    const days = getIsoWeekDates(selectedKW);
    return days.map((iso) => {
      const dayPlanned = items.filter((it) => !it.external && it.tag === iso && it.lineId);
      const hours = dayPlanned.reduce((sum, it) => sum + it.stunden, 0);
      return { iso, count: dayPlanned.length, hours };
    });
  }, [slotMode, selectedKW, items]);

  const suggestionsByItem = useMemo(() => {
    const tmpLine = { ...lineLoad };
    const capByLine = { ...lineCapacityMap };
    const map = {};
    const planningWeekDays = getIsoWeekDates(selectedKW, getYearFromIso(start));
    const open = [...items]
      .filter((it) => !it.external && hasMat(it))
      .sort((a, b) => b.stunden - a.stunden);

    open.forEach((it) => {
      const prefLines = (linePref[it.produkt] || lines.map((x) => x.id)).filter((lid) => visibleLines.some((v) => v.id === lid));
      const calculatedStart = getPlannedProductionStart(it.abrufTermin, it.stunden) || '';
      const targetDay = it.tag || calculatedStart || it.abrufTermin || it.montageTermin || start;
      const targetKW = it.kw || getIsoWeek(targetDay) || selectedKW;
      let targetSlots = slotMode === 'kw' ? [`KW-${targetKW}`] : [];
      if (slotMode !== 'kw') {
        const weekSlots = planningWeekDays.map((iso) => `D-${iso}`);
        const preferredSlot = targetDay ? `D-${targetDay}` : '';
        targetSlots = weekSlots.includes(preferredSlot)
          ? [preferredSlot, ...weekSlots.filter((slot) => slot !== preferredSlot)]
          : weekSlots;
      }
      if (it.lineId) {
        const lk = `${it.lineId}|${itemSlotKey(it)}`;
        tmpLine[lk] = Math.max(0, (tmpLine[lk] || 0) - it.stunden);
      }
      let found = null;
      for (const slot of targetSlots) {
        const lineId = prefLines.find((lid) => ((tmpLine[`${lid}|${slot}`] || 0) + it.stunden) <= (capByLine[lid] || 0));
        if (!lineId) continue;
        found = { slot, lineId, day: slot.startsWith('D-') ? slot.replace('D-', '') : null, kw: slot.startsWith('KW-') ? Number(slot.replace('KW-', '')) : null };
        tmpLine[`${lineId}|${slot}`] = (tmpLine[`${lineId}|${slot}`] || 0) + it.stunden;
        break;
      }
      if (found) {
        map[it.itemId] = found;
        return;
      }
      const fallbackSlot = targetSlots[0] || slotKeys[0];
      const fallbackLine = prefLines[0] || visibleLines[0]?.id || lines[0]?.id;
      if (fallbackSlot && fallbackLine) {
        map[it.itemId] = {
          slot: fallbackSlot,
          lineId: fallbackLine,
          day: fallbackSlot.startsWith('D-') ? fallbackSlot.replace('D-', '') : null,
          kw: fallbackSlot.startsWith('KW-') ? Number(fallbackSlot.replace('KW-', '')) : null,
        };
      }
    });
    return map;
  }, [items, lineLoad, slotKeys, slotCap, visibleLines, lineCapacityMap, slotMode, selectedKW, start]);

  function applySuggestion(itemId, options = {}) {
    const sgg = suggestionsByItem[itemId];
    if (!sgg) return;
    const skipMaterialWarning = Boolean(options?.skipMaterialWarning);
    const forceCurrentSlot = Boolean(options?.forceCurrentSlot);
    const effectiveSuggestion = forceCurrentSlot
      ? (slotMode === 'kw'
        ? { ...sgg, slot: `KW-${selectedKW}`, kw: selectedKW, day: null }
        : { ...sgg, slot: `D-${start}`, day: start, kw: getIsoWeek(start) || selectedKW })
      : sgg;
    const linkedIds = getLinkedGroupIds(itemId);
    if (!skipMaterialWarning) {
      runPlanningWithMaterialWarning(linkedIds, () => applySuggestion(itemId, { ...options, skipMaterialWarning: true }));
      return;
    }
    const check = getSuggestionCapacityCheck(itemId, effectiveSuggestion, items);
    if (check && check.usedAfter > check.cap) {
      openSuggestionCapacityWarning(itemId, effectiveSuggestion, items);
      return;
    }
    let next = items.map((it) => (
      linkedIds.includes(it.itemId)
        ? { ...it, tag: effectiveSuggestion.day || it.tag, kw: effectiveSuggestion.kw || it.kw }
        : it
    ));
    next = applyLinkedLineRules(next, itemId, effectiveSuggestion.lineId, linkedIds);
    applyChange('Vorschlag übernommen', next, '');
  }

  function applyAllSuggestions(options = {}) {
    const skipMaterialWarning = Boolean(options?.skipMaterialWarning);
    const ids = Object.keys(suggestionsByItem);
    if (ids.length === 0) return;
    if (!skipMaterialWarning) {
      const warningIds = [];
      ids.forEach((id) => getLinkedGroupIds(id).forEach((linkedId) => warningIds.push(linkedId)));
      runPlanningWithMaterialWarning(warningIds, () => applyAllSuggestions({ ...options, skipMaterialWarning: true }));
      return;
    }
    let next = [...items];
    const done = new Set();
    ids.forEach((id) => {
      if (done.has(id)) return;
      const sgg = suggestionsByItem[id];
      if (!sgg) return;
      const check = getSuggestionCapacityCheck(id, sgg, next);
      if (check && check.usedAfter > check.cap) {
        openSuggestionCapacityWarning(id, sgg, next);
        return;
      }
      const linkedIds = getLinkedGroupIds(id);
      linkedIds.forEach((linkedId) => done.add(linkedId));
      next = next.map((it) => (
        linkedIds.includes(it.itemId)
          ? { ...it, tag: sgg.day || it.tag, kw: sgg.kw || it.kw }
          : it
      ));
      next = applyLinkedLineRules(next, id, sgg.lineId, linkedIds);
    });
    applyChange('Alle Vorschläge übernommen', next, '');
  }
  const horizonCap = useMemo(
    () => visibleLines.reduce((sum, line) => sum + lineCapFor(line.id), 0),
    [visibleLines, lineCapacityMap],
  );
  const plannedHours = items.filter((x) => !x.external && hallMatch(x)).reduce((sum, x) => sum + x.stunden, 0);
  const externalCount = items.filter((x) => x.external).length;
  const capacityChart = useMemo(() => {
    const toLineLoad = (slotItems) => {
      const lineLoad = {};
      slotItems.forEach((it) => {
        if (!it.lineId) return;
        if (!lineLoad[it.lineId]) lineLoad[it.lineId] = { hours: 0, pieces: 0 };
        lineLoad[it.lineId].hours += it.stunden;
        lineLoad[it.lineId].pieces += it.stueck;
      });
      const orderedLoad = [...Object.entries(lineLoad)].sort((a, b) => {
        const ai = lines.findIndex((x) => x.id === a[0]);
        const bi = lines.findIndex((x) => x.id === b[0]);
        const av = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
        const bv = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
        return av - bv || a[0].localeCompare(b[0]);
      });
      return {
        lineLoad,
        hours: orderedLoad.reduce((sum, [, stats]) => sum + stats.hours, 0),
      };
    };
    if (slotMode === 'kw') {
      const weeks = weekRange(selectedKW, 3);
      return weeks.map((kw, idx) => {
        const slotItems = items.filter((it) => !it.external && it.kw === kw && hallMatch(it));
        const slot = toLineLoad(slotItems);
        return {
        key: `KW-${kw}`,
        label: `KW ${kw}`,
        sub: '',
        hours: slot.hours,
        displayHours: slot.hours,
        lineLoad: slot.lineLoad,
      };
      });
    }
    const weekDays = getIsoWeekDates(selectedKW, getYearFromIso(start));
    return weekDays.map((iso) => {
      const slotItems = items.filter((it) => !it.external && it.tag === iso && hallMatch(it));
      const slot = toLineLoad(slotItems);
      return {
        key: `D-${iso}`,
        label: dayName(iso),
        sub: fmt(iso),
        hours: slot.hours,
        displayHours: slot.hours,
        lineLoad: slot.lineLoad,
      };
    });
  }, [slotMode, selectedKW, start, items, visibleLines, lineCapacityMap, hallFilter]);
  const resourceCapacityChart = useMemo(() => (
    visibleLines.map((line) => {
      const cap = lineCapFor(line.id);
      const points = capacityChart.map((slot) => ({
        key: `${line.id}-${slot.key}`,
        label: slot.label,
        sub: slot.sub,
        hours: slot.lineLoad?.[line.id]?.hours || 0,
      }));
      const totalHours = points.reduce((sum, point) => sum + point.hours, 0);
      const avgUtilization = cap > 0 && points.length > 0 ? (totalHours / (cap * points.length)) * 100 : 0;
      return {
        id: line.id,
        name: line.name,
        cap,
        points,
        totalHours,
        avgUtilization,
      };
    })
  ), [visibleLines, capacityChart, lineCapacityMap]);
  const resourceChartMax = useMemo(() => {
    const maxPlanned = resourceCapacityChart.reduce((outerMax, resource) => (
      Math.max(outerMax, ...resource.points.map((point) => point.hours))
    ), 0);
    const maxCap = resourceCapacityChart.reduce((outerMax, resource) => Math.max(outerMax, resource.cap), 0);
    return Math.max(maxPlanned, maxCap, 1);
  }, [resourceCapacityChart]);
  const groupedSortedItems = useMemo(() => {
    const toKey = (iso) => (iso ? Number(iso.replace(/-/g, '')) : Number.MAX_SAFE_INTEGER);
    const groups = {};
    items.filter((it) => matchesLineAndProductFilter(it)).forEach((it) => {
      const dep = dependencyMap[it.itemId];
      const groupKey = dep ? `dep:${dep.groupId}` : `single:${it.itemId}`;
      if (!groups[groupKey]) groups[groupKey] = { key: groupKey, depGroupId: dep?.groupId || null, items: [] };
      groups[groupKey].items.push(it);
    });
    const sortedGroups = Object.values(groups).map((group) => {
      const orderedItems = [...group.items].sort((a, b) => {
        const depA = dependencyMap[a.itemId];
        const depB = dependencyMap[b.itemId];
        const roleA = depA?.role || 'single';
        const roleB = depB?.role || 'single';
        if (roleA !== roleB) {
          if (roleA === 'parent') return -1;
          if (roleB === 'parent') return 1;
        }
        return a.itemId.localeCompare(b.itemId);
      });
      const abrufKey = Math.min(...orderedItems.map((it) => toKey(it.abrufTermin)));
      const montageKey = Math.min(...orderedItems.map((it) => toKey(it.montageTermin)));
      return { ...group, items: orderedItems, abrufKey, montageKey };
    }).sort((a, b) => (
      a.abrufKey - b.abrufKey
      || a.montageKey - b.montageKey
      || a.key.localeCompare(b.key)
    ));
    return sortedGroups.map((group, idx) => ({ ...group, visualIndex: idx + 1 }));
  }, [items, dependencyMap, lineFilter, productFilter]);
  const sortedItems = useMemo(() => groupedSortedItems.flatMap((group) => group.items), [groupedSortedItems]);
  const tablePageCount = useMemo(() => Math.max(1, Math.ceil(groupedSortedItems.length / TABLE_PAGE_SIZE)), [groupedSortedItems.length]);
  const currentTablePage = Math.min(tablePage, tablePageCount);
  const pagedGroups = useMemo(() => {
    const from = (currentTablePage - 1) * TABLE_PAGE_SIZE;
    return groupedSortedItems.slice(from, from + TABLE_PAGE_SIZE);
  }, [groupedSortedItems, currentTablePage]);
  const pagedItems = useMemo(() => {
    return pagedGroups.flatMap((group) => group.items);
  }, [pagedGroups]);
  const rowMetaByItem = useMemo(() => {
    const map = {};
    pagedGroups.forEach((group) => {
      group.items.forEach((it, idx) => {
        map[it.itemId] = {
          isGroup: Boolean(group.depGroupId),
          groupSize: group.items.length,
          isFirst: idx === 0,
          isLast: idx === group.items.length - 1,
          groupNo: group.visualIndex,
        };
      });
    });
    return map;
  }, [pagedGroups]);
  const axRows = useMemo(() => (
    axModal?.item ? getAxBestellungenForItem(axModal.item) : []
  ), [axModal]);
  const selectedShiftLineCard = useMemo(
    () => (shiftModal?.lineId ? displayedLineCards.find((line) => line.id === shiftModal.lineId) || null : null),
    [shiftModal, displayedLineCards],
  );
  const shiftTeamsForModal = useMemo(() => {
    if (!selectedShiftLineCard) return [];
    return SHIFT_TEAMS
      .filter((team) => team.hall === selectedShiftLineCard.hall)
      .map((team) => {
        const assignedLineId = slotStaffAssignments[team.id] || team.homeLineId;
        const persons = SHIFT_PERSONS.filter((person) => person.teamId === team.id);
        const assignedPersonCount = persons.filter((person) => (slotPersonAssignments[person.id] || person.homeLineId) === assignedLineId).length;
        return { ...team, assignedLineId, personCount: persons.length, assignedPersonCount };
      });
  }, [selectedShiftLineCard, slotStaffAssignments, slotPersonAssignments]);
  const shiftPersonsForModal = useMemo(() => {
    if (!selectedShiftLineCard) return [];
    return SHIFT_PERSONS
      .filter((person) => person.hall === selectedShiftLineCard.hall)
      .map((person) => ({ ...person, assignedLineId: slotPersonAssignments[person.id] || person.homeLineId }));
  }, [selectedShiftLineCard, slotPersonAssignments]);
  const shiftTargetLines = useMemo(() => {
    if (!selectedShiftLineCard) return [];
    return lines.filter((line) => line.hall === selectedShiftLineCard.hall);
  }, [selectedShiftLineCard]);

  function setPlanningWeek(nextKW, preferredDay = '') {
    const kw = Number(nextKW);
    if (!kw) return;
    const weekDays = getIsoWeekDates(kw, getYearFromIso(start));
    if (!weekDays.length) return;
    const nextDay = weekDays.includes(preferredDay) ? preferredDay : weekDays[0];
    persist(makeState(items, fixed, history, slotMode, nextDay, nextDay, kw, hallFilter));
  }

  function setPlanningDayInSelectedWeek(nextDay) {
    if (!nextDay) return;
    const weekDays = getIsoWeekDates(selectedKW, getYearFromIso(start));
    if (!weekDays.includes(nextDay)) return;
    persist(makeState(items, fixed, history, slotMode, nextDay, nextDay, selectedKW, hallFilter));
  }

  function quickAssignLine(item, lineId) {
    if (!item?.itemId) return;
    const nextLine = lineId || '';
    if (nextLine && !canLine(item, nextLine)) {
      openCapacityWarning(item, nextLine);
      return;
    }
    const nextSort = nextLine ? sortLine(items.filter((x) => x.lineId === nextLine)).length : undefined;
    updateItem(item.itemId, { lineId: nextLine, sort: nextSort }, nextLine ? 'Linie geaendert' : 'Linie entfernt');
  }

  const unplannedQueue = useMemo(() => (
    items
      .filter((it) => !it.external && !isItemPlanned(it) && matchesProductFilter(it) && lineFilter === 'alle')
      .sort((a, b) => {
        const aInSlot = itemSlotKey(a) === currentSlotKey ? 0 : 1;
        const bInSlot = itemSlotKey(b) === currentSlotKey ? 0 : 1;
        return aInSlot - bInSlot
          || (suggestionsByItem[a.itemId]?.day || '').localeCompare(suggestionsByItem[b.itemId]?.day || '')
          || b.stunden - a.stunden
          || a.itemId.localeCompare(b.itemId);
      })
  ), [items, currentSlotKey, slotMode, selectedKW, start, suggestionsByItem, productFilter, lineFilter]);

  const plannedActiveSlot = useMemo(() => (
    items
      .filter((it) => !it.external && isItemPlanned(it) && itemSlotKey(it) === currentSlotKey && matchesLineAndProductFilter(it))
      .sort((a, b) => (a.lineId || '').localeCompare(b.lineId || '')
        || (a.sort ?? Number.MAX_SAFE_INTEGER) - (b.sort ?? Number.MAX_SAFE_INTEGER)
        || a.itemId.localeCompare(b.itemId))
  ), [items, currentSlotKey, slotMode, selectedKW, start, lineFilter, productFilter]);

  useEffect(() => {
    setTablePage(1);
  }, [lineFilter, productFilter, hallFilter]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#e9edf2', color: '#111827', fontFamily: 'Segoe UI, sans-serif' }}>
      <aside
        style={{
          width: 360,
          background: '#f2f4f6',
          borderRight: '1px solid #d3d7dc',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              padding: '22px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              borderBottom: '1px solid #d3d7dc',
              fontWeight: 700,
            }}
          >
            <span style={{ fontSize: 28 }}>=</span>
            <span style={{ color: '#42b4e5' }}>[#]</span>
            <span style={{ fontSize: 40 }}>Xecution App</span>
          </div>
          <div style={{ padding: '20px 24px' }}>
            {navSections.map((section) => (
              <SidebarSection
                key={section.title}
                title={section.title}
                items={section.items}
                open={section.open}
                activeItem={activeMenuItem}
                onItemClick={setActiveMenuItem}
              />
            ))}
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid #d3d7dc',
            padding: '18px 24px',
            color: '#6b7280',
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 700, color: '#111827' }}>GOLDBECK</div>
          <div style={{ fontSize: 14, marginTop: 4 }}>Version 1.0</div>
        </div>
      </aside>

      <main style={{ flex: 1, padding: 24 }}>
        <div style={s.page}>
          <div style={s.header}>Feinplanung</div>

      <div style={{ marginTop: 10 }}>
        <button style={s.collapseBtn} onClick={() => setOpen((p) => ({ ...p, setup: !p.setup }))}>
          {open.setup ? '?' : '?'} Planungsrahmen
        </button>
      </div>
      {open.setup && (
      <div style={{ ...s.card, marginTop: 8, ...s.row }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(180px, 1fr)) auto', gap: 10, alignItems: 'end' }}>
          <label>
            <div style={s.label}>Planungsbasis</div>
            <select style={s.input} value={slotMode} onChange={(e) => persist(makeState(items, fixed, history, e.target.value))}>
            <option value="tag">Tag</option><option value="kw">KW</option>
            </select>
          </label>
          {slotMode === 'tag' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 1fr) minmax(220px, 1fr)', gap: 8 }}>
              <label>
                <div style={s.label}>Planungs-KW</div>
                <select style={s.input} value={selectedKW} onChange={(e) => setPlanningWeek(Number(e.target.value), start)}>
                  {Array.from({ length: 53 }, (_, i) => i + 1).map((kw) => <option key={`tag-kw-${kw}`} value={kw}>KW {kw}</option>)}
                </select>
              </label>
              <label>
                <div style={s.label}>Tag in KW</div>
                <select style={s.input} value={start} onChange={(e) => setPlanningDayInSelectedWeek(e.target.value)}>
                  {getIsoWeekDates(selectedKW, getYearFromIso(start)).map((iso) => (
                    <option key={`tag-day-${iso}`} value={iso}>{dayName(iso)} {fmt(iso)}</option>
                  ))}
                </select>
              </label>
            </div>
          ) : (
            <label>
              <div style={s.label}>Planungs-KW</div>
              <select style={s.input} value={selectedKW} onChange={(e) => setPlanningWeek(Number(e.target.value), start)}>
              {Array.from({ length: 53 }, (_, i) => i + 1).map((kw) => <option key={kw} value={kw}>KW {kw}</option>)}
            </select>
            </label>
          )}
          <label>
            <div style={s.label}>Halle</div>
            <select style={s.input} value={hallFilter} onChange={(e) => persist(makeState(items, fixed, history, slotMode, start, end, selectedKW, e.target.value))}>
            <option value="alle">Alle</option><option value="4.1">Halle 4.1</option><option value="4.3">Halle 4.3</option>
            </select>
          </label>
          <div style={{ ...s.card, padding: '8px 10px', background: '#f8fbff' }}>
            <div style={{ fontSize: 12 }}><b>Aktiver Slot:</b> {slotMode === 'kw' ? `KW ${selectedKW}` : fmt(start)}</div>
            <div style={{ fontSize: 12, marginTop: 2 }}><b>Fixierung:</b> {fixed ? 'aktiv' : 'nicht fixiert'}</div>
            {slotMode === 'kw' && (
              <div style={{ marginTop: 6, borderTop: '1px solid #dbe3ec', paddingTop: 6 }}>
                <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>Tage in dieser KW (Mo-Sa):</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(120px, 1fr))', gap: 6 }}>
                  {kwDaySummary.map((d) => (
                    <div key={d.iso} style={{ border: '1px solid #dbe3ec', borderRadius: 6, padding: '4px 6px', background: '#ffffff' }}>
                      <div style={{ fontSize: 11, fontWeight: 700 }}>{dayName(d.iso)} {fmt(d.iso)}</div>
                      <div style={{ fontSize: 11, color: '#334155' }}>{d.count} Pos. | {d.hours} h</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            style={fixed ? { ...s.button, opacity: 0.6, cursor: 'not-allowed' } : s.primaryButton}
            disabled={fixed}
            onClick={() => { if (!fixed) setFixConfirmModal(true); }}
          >
            {fixed ? 'Fixiert' : 'Planung fixieren'}
          </button>
        </div>
        <div style={{ marginTop: 10, border: '1px solid #dbe3ec', borderRadius: 10, background: 'linear-gradient(180deg, #f8fbff 0%, #f3f7fc 100%)', padding: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0f3050' }}>Ansichtsfilter</div>
            <div style={{ fontSize: 11, color: '#475569' }}>
              Linie: <b>{lineFilter === 'alle' ? 'Alle' : lName(lineFilter)}</b> | Produkt: <b>{productFilter === 'alle' ? 'Alle' : productFilter}</b>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) minmax(200px, 1fr) auto', gap: 10, alignItems: 'end' }}>
            <label>
              <div style={s.label}>Linie</div>
              <select
                style={{ ...s.input, background: '#ffffff', borderColor: '#bfcfe0' }}
                value={lineFilter}
                onChange={(e) => persist(makeState(items, fixed, history, slotMode, start, end, selectedKW, hallFilter, e.target.value, productFilter))}
              >
                <option value="alle">Alle Linien</option>
                {lineFilterOptions.map((line) => <option key={line.id} value={line.id}>{line.name}</option>)}
              </select>
            </label>
            <label>
              <div style={s.label}>Produkt</div>
              <select
                style={{ ...s.input, background: '#ffffff', borderColor: '#bfcfe0' }}
                value={productFilter}
                onChange={(e) => persist(makeState(items, fixed, history, slotMode, start, end, selectedKW, hallFilter, lineFilter, e.target.value))}
              >
                <option value="alle">Alle Produkte</option>
                {productFilterOptions.map((produkt) => <option key={produkt} value={produkt}>{produkt}</option>)}
              </select>
            </label>
            <button
              type="button"
              style={{ ...s.button, background: '#ffffff', borderColor: '#9fb9d1', fontWeight: 700, color: '#0f4c75', height: 36 }}
              onClick={() => persist(makeState(items, fixed, history, slotMode, start, end, selectedKW, hallFilter, 'alle', 'alle'))}
            >
              Filter zurücksetzen
            </button>
          </div>
        </div>

        <div style={s.kpiGrid}>
          <div style={s.kpiCard}><div style={s.kpiLabel}>Verplant</div><div style={s.kpiValue}>{plannedHours} h</div></div>
          <div style={s.kpiCard}><div style={s.kpiLabel}>Kapazität Slot</div><div style={s.kpiValue}>{horizonCap} h</div></div>
          <div style={s.kpiCard}><div style={s.kpiLabel}>Fehlteile Positionen</div><div style={s.kpiValue}>{missingItems.length}</div></div>
          <div style={s.kpiCard}><div style={s.kpiLabel}>Extern vergeben</div><div style={s.kpiValue}>{externalCount}</div></div>
        </div>

        <div style={{ ...s.card, marginTop: 10, background: '#f8fafc' }}>
          <div style={{ fontWeight: 700, marginBottom: 2 }}>Kapazität & Auslastung pro Ressource</div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
            {slotMode === 'kw' ? 'Verlauf pro KW' : 'Verlauf pro Tag'} mit Kapazitätslinie je Ressource
          </div>
          {resourceCapacityChart.length === 0 ? (
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Keine Ressourcen im aktuellen Filter.</div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {resourceCapacityChart.map((resource) => (
                  <span key={`resource-legend-${resource.id}`} style={{ ...s.badge, background: '#ffffff', color: '#334155', border: `1px solid ${lineColor(resource.id)}` }}>
                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 999, background: lineColor(resource.id), marginRight: 6 }} />
                    {resource.name}: {resource.cap} h | Ø {Math.round(resource.avgUtilization)}%
                  </span>
                ))}
              </div>
              <div style={{ overflowX: 'auto', paddingBottom: 2 }}>
                <div style={{ minWidth: `${Math.max(1700, capacityChart.length * Math.max(300, resourceCapacityChart.length * 52))}px`, border: '1px solid #dbe3ec', borderRadius: 12, padding: '22px 14px 14px', background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${capacityChart.length}, minmax(300px, 1fr))`, gap: 18, alignItems: 'end', height: 440 }}>
                    {capacityChart.map((slot, slotIdx) => (
                      <div key={`slot-resource-group-${slot.key}`} style={{ display: 'grid', gap: 8, alignItems: 'end' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'end', height: 340 }}>
                          {resourceCapacityChart.map((resource) => {
                            const point = resource.points[slotIdx];
                            const hours = point?.hours || 0;
                            const barHeight = (hours / resourceChartMax) * 100;
                            const capHeight = (resource.cap / resourceChartMax) * 100;
                            const overload = hours > resource.cap;
                            return (
                              <div
                                key={`${slot.key}-${resource.id}`}
                                title={`${resource.name}: ${hours} h | Kapazität: ${resource.cap} h`}
                                style={{ position: 'relative', width: 44, height: 320, borderRadius: 7, background: '#eef2f7', overflow: 'hidden', boxShadow: overload ? 'inset 0 0 0 1px #dc2626' : 'inset 0 0 0 1px #d1d9e3' }}
                              >
                                <div
                                  style={{
                                    position: 'absolute',
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    height: hours > 0 ? `${Math.max(2, barHeight)}%` : '0%',
                                    background: overload ? 'linear-gradient(180deg, #fb7185 0%, #dc2626 100%)' : lineColor(resource.id),
                                  }}
                                />
                                <div style={{ position: 'absolute', left: 0, right: 0, bottom: `${capHeight}%`, borderTop: '2px dashed #ef4444' }} />
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{slot.label}</div>
                          {slot.sub ? <div style={{ fontSize: 12, color: '#64748b' }}>{slot.sub}</div> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', fontSize: 12, color: '#334155' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 14, height: 14, borderRadius: 3, background: '#64748b', display: 'inline-block' }} />
                      Balken: Geplante Stunden
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 16, borderTop: '2px dashed #ef4444', display: 'inline-block' }} />
                      Rot gestrichelt: Kapazität je Ressource
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 14, height: 14, borderRadius: 3, background: 'linear-gradient(180deg, #fb7185 0%, #dc2626 100%)', display: 'inline-block' }} />
                      Roter Balken: Überlast
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      <div style={{ marginTop: 10 }}>
        <button style={s.collapseBtn} onClick={() => setOpen((p) => ({ ...p, actions: !p.actions }))}>
          {open.actions ? '?' : '?'} Hinweise und Aktionen
        </button>
      </div>
      {open.actions && (
      <div style={{ ...s.card, marginTop: 8, ...s.infoStrip }}>
        <div style={{ fontSize: 13 }}>
          <b>Materialregel:</b> Verplanung nur bei vollstaendigem AX-Materialeingang.
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button style={s.button} onClick={() => setMissingModal({ mode: 'all' })}>Fehlteile anzeigen</button>
          <button style={s.primaryButton} onClick={applyAllSuggestions}>Alle Vorschläge ({Object.keys(suggestionsByItem).length})</button>
        </div>
      </div>
      )}


      <div style={{ marginTop: 10 }}>
        <button style={s.collapseBtn} onClick={() => setOpen((p) => ({ ...p, machinePlan: !p.machinePlan }))}>
          {open.machinePlan ? '?' : '?'} Feinplanung
        </button>
      </div>
      {open.machinePlan && (
      <div style={{ ...s.card, marginTop: 8 }}>
        <div style={s.sectionTitle}>1) Feinplanung</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(320px, 1fr))', gap: 10, marginBottom: 10 }}>
          <div style={{ border: '1px solid #dbe3ec', borderRadius: 8, background: '#f8fafc', padding: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
              Ungeplant ({unplannedQueue.length})
            </div>
            <div style={{ display: 'grid', gap: 6, maxHeight: 280, overflow: 'auto' }}>
              {unplannedQueue.slice(0, 10).map((it) => (
                <div key={`uq-${it.itemId}`} style={{ border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', padding: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{it.projekt} | {it.produkt}</div>
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                    {it.stunden} h | Status: Nicht eingeplant | Montagetermin-KW: {it.montageTermin ? `KW ${getIsoWeek(it.montageTermin)}` : '-'}
                  </div>
                  <div style={{ fontSize: 11, color: '#0369a1', marginTop: 2 }}>
                    Vorschlag: {suggestionsByItem[it.itemId]?.day ? fmt(suggestionsByItem[it.itemId].day) : '-'} | {suggestionsByItem[it.itemId]?.lineId ? lName(suggestionsByItem[it.itemId].lineId) : '-'}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    {suggestionsByItem[it.itemId] ? (
                      <button type="button" style={s.primaryButton} onClick={() => applySuggestion(it.itemId, { forceCurrentSlot: true })}>
                        Uebernehmen
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
              {unplannedQueue.length === 0 ? <div style={{ fontSize: 12, color: '#64748b' }}>Keine ungeplanten Aufträge.</div> : null}
            </div>
          </div>

          <div style={{ border: '1px solid #dbe3ec', borderRadius: 8, background: '#f8fafc', padding: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
              Geplant im aktiven Slot ({plannedActiveSlot.length})
            </div>
            <div style={{ display: 'grid', gap: 6, maxHeight: 280, overflow: 'auto' }}>
              {plannedActiveSlot.slice(0, 12).map((it) => (
                <div key={`ps-${it.itemId}`} style={{ border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', padding: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{it.projekt} | {it.produkt}</div>
                    <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{it.stunden} h | {lName(it.lineId)} | {slotLabel(it)}</div>
                  </div>
                  <button type="button" style={s.button} onClick={() => quickAssignLine(it, '')}>Aus Linie</button>
                </div>
              ))}
              {plannedActiveSlot.length === 0 ? <div style={{ fontSize: 12, color: '#64748b' }}>Noch keine Zuordnung im aktiven Slot.</div> : null}
            </div>
          </div>
        </div>

        <div style={{ fontSize: 12, color: '#334155', marginBottom: 6, fontWeight: 700 }}>Hauptplanung (Detailtabelle)</div>
        <div style={{ ...s.tableWrap, marginBottom: 10 }}>
          <table style={s.table}>
            <thead><tr>
              <th style={s.th}>Produktionsauftragsnummer</th><th style={s.th}>Projekt</th><th style={s.th}>Montageleiter</th><th style={s.th}>Produkt</th><th style={s.th}>Verbund</th><th style={s.th}>Stück</th><th style={s.th}>Stunden</th>
              <th style={s.th}>Abruftermin</th><th style={s.th}>Montagetermin</th><th style={s.th}>Produktionsbeginn</th><th style={s.th}>Abruf vs Montage</th><th style={s.th}>Prio</th><th style={s.th}>Extern</th><th style={s.th}>Material</th><th style={s.th}>Linie</th><th style={s.th}>Vorschlag</th>
            </tr></thead>
            <tbody>
              {pagedItems.map((it) => {
                const materialFreigabe = getMaterialFreigabe(it);
                const miss = materialFreigabe.miss;
                const ok = materialFreigabe.ready;
                const isPlanned = isItemPlanned(it);
                const shiftCount = Number(it.montageShiftCount) || 0;
                const isHighPrio = shiftCount >= HIGH_PRIO_SHIFT_THRESHOLD;
                const isPrio = isHighPrio || Boolean(it.manualPrio);
                const abrufMontageDiff = dateDiffDays(it.abrufTermin, it.montageTermin);
                const hasAbrufMontageDeviation = abrufMontageDiff !== null && abrufMontageDiff !== 0;
                const dep = dependencyMap[it.itemId] || null;
                const linkedCount = dep ? ((dep.linkedIds?.length || 0) + 1) : 1;
                const linkedTimingMismatch = dep ? hasLinkedTimingMismatch(it) : false;
                const depParentProduct = dep?.parentId ? (itemById[dep.parentId]?.produkt || 'Verbund') : 'Verbund';
                const calculatedProductionStart = getPlannedProductionStart(it.abrufTermin, it.stunden) || it.tag;
                const productionEnd = getPlannedProductionEnd(it.abrufTermin);
                const productionSlotMismatch = Boolean(it.tag) && Boolean(calculatedProductionStart) && it.tag !== calculatedProductionStart;
                const rowMeta = rowMetaByItem[it.itemId] || {};
                const baseRowBackground = isPrio ? '#fef2f2' : (it.external ? '#fff7ed' : it.lineId ? '#ecfeff' : '#fff');
                const groupedBackground = rowMeta.isGroup && !isPrio && !it.external
                  ? (rowMeta.groupNo % 2 === 0 ? '#f8fbff' : '#f7fcf8')
                  : baseRowBackground;
                return (
                  <tr key={it.itemId} style={{
                    background: isPlanned ? '#eef2f7' : groupedBackground,
                    color: isPlanned ? '#64748b' : undefined,
                    opacity: isPlanned ? 0.88 : 1,
                    boxShadow: rowMeta.isGroup ? 'inset 4px 0 0 #38bdf8' : 'none',
                    borderTop: rowMeta.isGroup && rowMeta.isFirst ? '2px solid #bae6fd' : undefined,
                    borderBottom: rowMeta.isGroup && rowMeta.isLast ? '2px solid #bae6fd' : undefined,
                  }}>
                    <td style={{ ...s.td, fontWeight: 700 }}>
                      {isHighPrio ? <span title={`Montagetermin ${shiftCount}x verschoben`} style={{ ...s.badge, background: '#fee2e2', color: '#991b1b', marginRight: 6 }}>!</span> : null}
                      <span title={it.itemId}>{productionOrderNo(it.itemId)}</span>
                    </td><td style={s.td}>{it.projekt}</td><td style={s.td}>{it.freigegebenVon || '-'}</td><td style={s.td}>{it.produkt}</td>
                    <td style={s.td}>
                      {dep ? (
                        <>
                          <span
                            title={linkedTimingMismatch ? 'Zeitabweichung in gekoppelter Gruppe' : 'Zeitgleich mit gekoppelter Gruppe'}
                            style={linkedTimingMismatch
                              ? { ...s.badge, background: '#fee2e2', color: '#991b1b' }
                              : { ...s.badge, background: '#dcfce7', color: '#166534' }}
                          >
                            {depParentProduct}+Fluegel ({linkedCount}) {linkedTimingMismatch ? 'Nicht gleich' : 'Zeitgleich'}
                          </span>
                          <div style={{ fontSize: 10, color: '#0369a1', marginTop: 2, fontWeight: 700 }}>
                            Verbund #{rowMeta.groupNo || '-'} {rowMeta.groupSize > 1 ? `(${rowMeta.groupSize} Zeilen)` : ''}
                          </div>
                        </>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>-</span>
                      )}
                    </td><td style={s.td}>{it.stueck}</td><td style={{ ...s.td, fontWeight: 700 }}>{it.stunden} h</td>
                    <td style={s.td}>
                      <span style={{ ...s.badge, background: '#e2e8f0', color: '#334155' }}>
                        {it.abrufTermin ? fmt(it.abrufTermin) : '-'}
                      </span>
                      <TerminverschiebungIndicator
                        record={it}
                        fieldKey="abrufTermin"
                        onOpen={() => setTerminModal({
                          record: it,
                          fieldKey: 'abrufTermin',
                          title: `Historie Abruftermin - ${it.itemId}`,
                        })}
                      />
                    </td>
                    <td style={s.td}>
                      <span style={shiftCount > 0
                        ? { ...s.badge, background: '#fef3c7', color: '#92400e' }
                        : { ...s.badge, background: '#e2e8f0', color: '#334155' }}
                      >
                        {it.montageTermin ? fmt(it.montageTermin) : '-'}
                      </span>
                      <TerminverschiebungIndicator
                        record={it}
                        fieldKey="montageTermin"
                        onOpen={() => setTerminModal({
                          record: it,
                          fieldKey: 'montageTermin',
                          title: `Historie Montagetermin - ${it.itemId}`,
                        })}
                      />
                      {shiftCount > 0 ? <div style={{ fontSize: 10, color: isHighPrio ? '#991b1b' : '#64748b', marginTop: 2 }}>verschoben: {shiftCount}x</div> : null}
                    </td>
                    <td style={s.td}>
                      <input
                        style={s.input}
                        type="date"
                        value={it.tag || ''}
                        disabled={isPlanned}
                        onChange={(e) => updateProductionStart(it.itemId, e.target.value)}
                      />
                      <div style={{ fontSize: 10, color: productionSlotMismatch ? '#92400e' : '#166534', marginTop: 2 }}>
                        Soll: {calculatedProductionStart ? fmt(calculatedProductionStart) : '-'}
                      </div>
                      <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                        Ende: {productionEnd ? fmt(productionEnd) : '-'}
                      </div>
                    </td>
                    <td style={s.td}>
                      {hasAbrufMontageDeviation ? (
                        <span style={{ ...s.badge, background: '#fef3c7', color: '#92400e' }}>
                          Abweichung ({abrufMontageDiff > 0 ? `+${abrufMontageDiff}` : abrufMontageDiff}t)
                        </span>
                      ) : (
                        <span style={{ ...s.badge, background: '#dcfce7', color: '#166534' }}>Gleich</span>
                      )}
                    </td>
                    <td style={s.td}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={isPrio}
                          disabled={isHighPrio || isPlanned}
                          title={isHighPrio ? 'Automatisch Prio wegen mehrfach verschobenem Montagetermin' : 'Als Prio markieren'}
                          onChange={(e) => setManualPrio(it.itemId, e.target.checked)}
                        />
                        <span style={isPrio ? { ...s.badge, background: '#fee2e2', color: '#991b1b' } : { color: '#94a3b8' }}>
                          {isPrio ? 'Prio' : '-'}
                        </span>
                      </label>
                    </td>
                    <td style={s.td}>
                      <button disabled={isPlanned} onClick={() => toggleExternal(it.itemId)} style={it.external ? { ...s.button, borderColor: '#fdba74', background: '#ffedd5', color: '#9a3412', fontWeight: 700 } : s.button}>
                        {it.external ? 'Extern aktiv' : 'Intern'}
                      </button>
                    </td>
                    <td style={s.td}>
                      {ok ? (
                        <button
                          type="button"
                          disabled={isPlanned}
                          style={{ ...s.button, borderColor: '#86efac', background: '#dcfce7', color: '#166534', fontWeight: 700 }}
                          onClick={() => setAxModal({ item: it })}
                        >
                          OK
                        </button>
                      ) : miss.length > 0 ? (
                        <button disabled={isPlanned} style={s.button} onClick={() => setMissingModal({ mode: 'one', item: it, miss })}>Fehlt ({miss.length})</button>
                      ) : (
                        <button disabled={isPlanned} style={s.button} onClick={() => setAxModal({ item: it })}>AX offen</button>
                      )}
                      {!ok && miss.length === 0 ? (
                        <div style={{ fontSize: 10, color: '#92400e', marginTop: 2 }}>
                          Nicht komplett eingebucht oder Liefertermin nach Produktionsbeginn
                        </div>
                      ) : null}
                    </td>
                    <td style={s.td}>
                      <select style={s.input} value={it.lineId} disabled={it.external || isPlanned} onChange={(e) => {
                        const nextLine = e.target.value; if (!canLine(it, nextLine)) { openCapacityWarning(it, nextLine); return; }
                        const nextSort = nextLine ? sortLine(items.filter((x) => x.lineId === nextLine)).length : undefined;
                        updateItem(it.itemId, { lineId: nextLine, sort: nextSort }, 'Linie geaendert');
                      }}>
                        <option value="">Nicht geplant</option>
                        {(linePref[it.produkt] || visibleLines.map((x) => x.id)).filter((id) => visibleLines.some((v) => v.id === id)).map((id) => <option key={id} value={id} disabled={!canLine(it, id)}>{lName(id)}</option>)}
                      </select>
                      <div style={{ fontSize: 10, color: isItemPlanned(it) ? '#166534' : '#991b1b', marginTop: 2 }}>
                        {isItemPlanned(it) ? 'Eingeplant' : 'Nicht eingeplant'}
                      </div>
                    </td>
                    <td style={s.td}>
                      {it.external ? (
                        <span style={{ ...s.badge, background: '#ffedd5', color: '#9a3412' }}>Extern vergeben</span>
                      ) : (!isItemPlanned(it) && suggestionsByItem[it.itemId]) ? (
                        <button style={s.primaryButton} onClick={() => applySuggestion(it.itemId)}>{lName(suggestionsByItem[it.itemId].lineId)} ({suggestionsByItem[it.itemId].kw ? `KW ${suggestionsByItem[it.itemId].kw}` : fmt(suggestionsByItem[it.itemId].day)})</button>
                      ) : (
                        <span style={{ color: '#64748b' }}>Kein Vorschlag</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 8 }}>
          <div style={{ fontSize: 12, color: '#334155', fontWeight: 700 }}>Kompakte Planungstabelle</div>
          <button type="button" style={s.button} onClick={() => setShowCompactTable((p) => !p)}>
            {showCompactTable ? 'Kompakte Tabelle einklappen' : 'Kompakte Tabelle ausklappen'}
          </button>
        </div>
        {showCompactTable && (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead><tr>
              <th style={s.th}>Produktionsauftragsnummer</th><th style={s.th}>Projekt</th><th style={s.th}>Produkt</th><th style={s.th}>Stunden</th>
              <th style={s.th}>Status</th><th style={s.th}>Produktionsbeginn</th><th style={s.th}>Material</th><th style={s.th}>Linie</th><th style={s.th}>Aktion</th>
            </tr></thead>
            <tbody>
              {pagedItems.map((it) => {
                const materialFreigabe = getMaterialFreigabe(it);
                const miss = materialFreigabe.miss;
                const ok = materialFreigabe.ready;
                const sgg = suggestionsByItem[it.itemId];
                const isPlanned = isItemPlanned(it);
                return (
                  <tr key={`compact-${it.itemId}`} style={{ background: isPlanned ? '#ecfeff' : '#fff' }}>
                    <td style={{ ...s.td, fontWeight: 700 }}>{productionOrderNo(it.itemId)}</td>
                    <td style={s.td}>{it.projekt}</td>
                    <td style={s.td}>{it.produkt}</td>
                    <td style={{ ...s.td, fontWeight: 700 }}>{it.stunden} h</td>
                    <td style={s.td}>
                      {isPlanned ? (
                        <span style={{ ...s.badge, background: '#dcfce7', color: '#166534' }}>Eingeplant</span>
                      ) : (
                        <span style={{ ...s.badge, background: '#fee2e2', color: '#991b1b' }}>Nicht eingeplant</span>
                      )}
                    </td>
                    <td style={s.td}>
                      <div>{it.tag ? fmt(it.tag) : '-'}</div>
                      {!isPlanned && sgg?.day ? (
                        <div style={{ fontSize: 11, color: '#0369a1', marginTop: 2 }}>Vorschlag: {fmt(sgg.day)}</div>
                      ) : null}
                    </td>
                    <td style={s.td}>
                      {ok ? (
                        <span style={{ ...s.badge, background: '#dcfce7', color: '#166534' }}>OK</span>
                      ) : miss.length > 0 ? (
                        <button style={s.button} onClick={() => setMissingModal({ mode: 'one', item: it, miss })}>Fehlt ({miss.length})</button>
                      ) : (
                        <button style={s.button} onClick={() => setAxModal({ item: it })}>AX offen</button>
                      )}
                    </td>
                    <td style={s.td}>
                      <div>{it.lineId ? lName(it.lineId) : '-'}</div>
                      {!isPlanned && sgg?.lineId ? (
                        <div style={{ fontSize: 11, color: '#0369a1', marginTop: 2 }}>Vorschlag: {lName(sgg.lineId)}</div>
                      ) : null}
                    </td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {!isPlanned && sgg ? <button style={s.primaryButton} onClick={() => applySuggestion(it.itemId)}>Uebernehmen</button> : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}

        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 12, color: '#475569' }}>
            Seite {currentTablePage} von {tablePageCount} | {sortedItems.length} Eintraege
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={currentTablePage <= 1 ? { ...s.button, opacity: 0.6, cursor: 'not-allowed' } : s.button} disabled={currentTablePage <= 1} onClick={() => setTablePage((p) => Math.max(1, p - 1))}>Zurueck</button>
            <button style={currentTablePage >= tablePageCount ? { ...s.button, opacity: 0.6, cursor: 'not-allowed' } : s.button} disabled={currentTablePage >= tablePageCount} onClick={() => setTablePage((p) => Math.min(tablePageCount, p + 1))}>Weiter</button>
          </div>
        </div>
      </div>
      )}

      <div style={{ marginTop: 10 }}>
        <button style={s.collapseBtn} onClick={() => setOpen((p) => ({ ...p, linePlan: !p.linePlan }))}>
          {open.linePlan ? '?' : '?'} Linienbelegung
        </button>
      </div>
      {open.linePlan && (
      <div style={{ ...s.card, marginTop: 8 }}>
        <div style={s.sectionTitle}>2) Linienbelegung (Drag & Drop, zwischen Linien möglich)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(340px, 1fr))', gap: 10 }}>
          {displayedLineCards.map((line) => (
            <div key={line.id} style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: 8, background: '#fff', boxShadow: drop?.lineId === line.id ? '0 0 0 2px rgba(234,179,8,0.35)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <b>{line.name}</b>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>Halle {line.hall}</span>
                  <button type="button" style={s.button} onClick={() => setShiftModal({ lineId: line.id })}>
                    Schichtplanung
                  </button>
                </div>
              </div>
              <div style={{ position: 'relative', height: 10, background: '#e5e7eb', borderRadius: 999, marginTop: 6 }}>
                <div style={{ width: `${line.p}%`, height: '100%', background: line.color, borderRadius: 999 }} />
                {line.marks.map((p, i) => <div key={`${line.id}-${i}`} style={{ position: 'absolute', left: `${p}%`, top: -3, width: 3, height: 16, background: '#000' }} />)}
              </div>
              <div style={{ fontSize: 12, marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{line.used}/{line.cap} h</span>
                <span style={{ ...s.badge, background: '#f1f5f9', color: '#334155' }}>{line.planned.length} Positionen</span>
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, marginTop: 6 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 0.8fr 0.8fr 1fr', background: '#f8fafc', fontSize: 11, fontWeight: 700 }}>
                  <div style={{ padding: 6 }}>Projekt</div><div style={{ padding: 6 }}>Produkt</div><div style={{ padding: 6 }}>Stück</div><div style={{ padding: 6 }}>h</div><div style={{ padding: 6 }}>{slotMode === 'kw' ? 'KW' : 'Tag'}</div>
                </div>
                {line.planned.map((it) => (
                  <div key={it.itemId} draggable onDragStart={() => { setDrag({ itemId: it.itemId, lineId: line.id }); setDrop(null); }} onDragEnd={() => { setDrag(null); setDrop(null); }}
                    onDragOver={(e) => e.preventDefault()} onDragEnter={(e) => { e.preventDefault(); if (drag && drag.itemId !== it.itemId) setDrop({ lineId: line.id, itemId: it.itemId }); }}
                    onDrop={(e) => { e.preventDefault(); dropOnLine(line.id, it.itemId); }}
                    style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 0.8fr 0.8fr 1fr', borderTop: '1px solid #e2e8f0', cursor: drag?.itemId === it.itemId ? 'grabbing' : 'grab', background: drop?.lineId === line.id && drop?.itemId === it.itemId ? '#fef9c3' : drag?.itemId === it.itemId ? '#dbeafe' : '#fff', opacity: drag?.itemId === it.itemId ? 0.65 : 1 }}>
                    <div style={{ padding: 6 }}>{it.projekt}</div><div style={{ padding: 6 }}>{it.produkt}</div><div style={{ padding: 6 }}>{it.stueck}</div><div style={{ padding: 6 }}>{it.stunden}</div><div style={{ padding: 6 }}>{slotLabel(it)}</div>
                  </div>
                ))}
                <div onDragOver={(e) => e.preventDefault()} onDragEnter={(e) => { e.preventDefault(); if (drag) setDrop({ lineId: line.id, itemId: null }); }} onDrop={(e) => { e.preventDefault(); dropOnLine(line.id, null); }}
                  style={{ borderTop: '1px dashed #cbd5e1', padding: 6, fontSize: 11, background: drop?.lineId === line.id && drop?.itemId == null ? '#fef9c3' : '#fafafa' }}>
                  Hier ablegen (Ende der Linie)
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {shiftModal && selectedShiftLineCard && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30 }}>
          <div style={{ width: 'min(840px, 94vw)', maxHeight: '84vh', overflow: 'auto', background: '#fff', borderRadius: 8, border: '1px solid #cbd5e1' }}>
            <div style={{ padding: 10, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <b>Schichtplanung: {selectedShiftLineCard.name}</b>
              <button type="button" style={s.button} onClick={() => setShiftModal(null)}>Schließen</button>
            </div>
            <div style={{ padding: 10, display: 'grid', gap: 10 }}>
              <div style={{ fontSize: 12, color: '#475569' }}>
                Aktiver Slot: <b>{currentSlotLabel}</b> | Kapazität Linie: <b>{selectedShiftLineCard.cap} h</b> | Geplant: <b>{selectedShiftLineCard.used} h</b> | Frei: <b>{Math.max(0, selectedShiftLineCard.cap - selectedShiftLineCard.used)} h</b>
              </div>
              <div style={{ fontSize: 12, color: '#475569' }}>
                Teams zwischen Linien verschieben, um Engpässe zu glätten. Die Linienkapazität aktualisiert sich sofort in der Planung.
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', background: '#f8fafc', fontSize: 11, fontWeight: 700 }}>
                  <div style={{ padding: 8 }}>Team</div>
                  <div style={{ padding: 8 }}>Heimatlinie</div>
                  <div style={{ padding: 8 }}>Einsatzlinie</div>
                </div>
                {shiftTeamsForModal.map((team) => (
                  <div key={team.id} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', borderTop: '1px solid #e2e8f0', alignItems: 'center' }}>
                    <div style={{ padding: 8 }}>{team.name}</div>
                    <div style={{ padding: 8, color: '#64748b' }}>{lName(team.homeLineId)}</div>
                    <div style={{ padding: 8 }}>
                      <select
                        style={s.input}
                        value={team.assignedLineId}
                        onChange={(e) => updateShiftTeam(team.id, e.target.value)}
                      >
                        {shiftTargetLines.map((line) => (
                          <option key={`${team.id}-${line.id}`} value={line.id}>{line.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {missingModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 'min(760px, 92vw)', maxHeight: '80vh', overflow: 'auto', background: '#fff', borderRadius: 8, border: '1px solid #cbd5e1' }}>
            <div style={{ padding: 10, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
              <b>{missingModal.mode === 'one' ? `Fehlteile ${missingModal.item.itemId}` : 'Fehlteile (nur fehlende Positionen)'}</b>
              <button style={s.button} onClick={() => setMissingModal(null)}>Schließen</button>
            </div>
            <div style={{ padding: 10 }}>
              {missingModal.mode === 'one' ? missingModal.miss.map((m) => <div key={m.mat} style={{ padding: '6px 0' }}>{m.mat}: fehlt {m.miss}</div>) : (missingItems.length === 0 ? <div>Keine Fehlteile vorhanden.</div> : missingItems.map(({ it, miss }) => <div key={it.itemId} style={{ borderTop: '1px solid #e2e8f0', padding: '8px 0' }}><b>{it.itemId} - {it.projekt} ({it.produkt})</b>{miss.map((m) => <div key={`${it.itemId}-${m.mat}`}>{m.mat}: fehlt {m.miss}</div>)}</div>))}
            </div>
          </div>
        </div>
      )}

      {axModal?.item && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2100 }}>
          <div style={{ width: 'min(980px, 96vw)', maxHeight: '86vh', overflow: 'auto', background: '#fff', borderRadius: 8, border: '1px solid #cbd5e1' }}>
            <div style={{ padding: 10, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <b>AX Bestellungen - {axModal.item.itemId}</b>
              <button style={s.button} onClick={() => setAxModal(null)}>Schließen</button>
            </div>
            <div style={{ padding: 10, fontSize: 12, color: '#334155' }}>
              <div>Produktionsbeginn: <b>{axModal.item.tag ? fmt(axModal.item.tag) : '-'}</b></div>
              <div style={{ marginTop: 2 }}>Projekt: <b>{axModal.item.projekt}</b> | Produkt: <b>{axModal.item.produkt}</b></div>
            </div>
            <div style={{ padding: '0 10px 10px' }}>
              <table style={{ ...s.table, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                <thead>
                  <tr>
                    <th style={s.th}>AX Bestellung</th>
                    <th style={s.th}>Material</th>
                    <th style={s.th}>Bedarf</th>
                    <th style={s.th}>Bestaetigter Liefertermin</th>
                    <th style={s.th}>Angekommen / Eingebucht</th>
                    <th style={s.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {axRows.map((row) => {
                    const productionStart = axModal.item.tag || '';
                    const hasConfirmed = Boolean(row.confirmedDate);
                    const delayed = hasConfirmed && productionStart && row.confirmedDate > productionStart;
                    const isArrivedAndBooked = row.arrivedQty >= row.need && row.bookedQty >= row.need;
                    let statusLabel = 'Termin bestaetigt';
                    let statusStyle = { ...s.badge, background: '#dbeafe', color: '#1d4ed8' };
                    if (!hasConfirmed) {
                      statusLabel = 'Kein Termin bestaetigt';
                      statusStyle = { ...s.badge, background: '#fee2e2', color: '#991b1b' };
                    } else if (delayed) {
                      statusLabel = 'Termin nach Produktionsbeginn';
                      statusStyle = { ...s.badge, background: '#fecaca', color: '#991b1b' };
                    } else if (isArrivedAndBooked) {
                      statusLabel = 'Angekommen und eingebucht';
                      statusStyle = { ...s.badge, background: '#dcfce7', color: '#166534' };
                    } else if (row.arrivedQty > 0) {
                      statusLabel = 'Teilweise eingetroffen';
                      statusStyle = { ...s.badge, background: '#fef3c7', color: '#92400e' };
                    }
                    return (
                      <tr key={row.id}>
                        <td style={s.td}>{row.orderNo}</td>
                        <td style={s.td}>{row.material}</td>
                        <td style={s.td}>{row.need}</td>
                        <td style={s.td}>{row.confirmedDate ? fmt(row.confirmedDate) : <span style={{ color: '#991b1b' }}>Kein Datum</span>}</td>
                        <td style={s.td}>{row.arrivedQty} / {row.bookedQty}</td>
                        <td style={s.td}><span style={statusStyle}>{statusLabel}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {reasonModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 'min(600px, 92vw)', background: '#fff', borderRadius: 8, border: '1px solid #cbd5e1' }}>
            <div style={{ padding: 10, borderBottom: '1px solid #e2e8f0' }}><b>Begruendung erforderlich</b> - {reasonModal.label}</div>
            <div style={{ padding: 10 }}>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} style={{ width: '100%', minHeight: 90 }} placeholder="Begruendung eingeben..." />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button style={s.button} onClick={() => { setReasonModal(null); setReason(''); }}>Abbrechen</button>
                <button style={!reason.trim() ? { ...s.primaryButton, opacity: 0.6, cursor: 'not-allowed' } : s.primaryButton} disabled={!reason.trim()} onClick={confirmReason}>Aenderung speichern</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {externalModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 'min(520px, 92vw)', background: '#fff', borderRadius: 8, border: '1px solid #cbd5e1' }}>
            <div style={{ padding: 10, borderBottom: '1px solid #e2e8f0' }}><b>Externe Produktion</b> - Mail an Thomas Mix</div>
            <div style={{ padding: 10 }}>
              <div style={{ fontSize: 13, color: '#334155' }}>
                Bitte auswaehlen, was extern vergeben werden soll.
              </div>
              <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
                {EXTERNAL_SCOPE_OPTIONS.map((opt) => (
                  <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155' }}>
                    <input
                      type="radio"
                      name="external-scope"
                      checked={(externalModal.scope || 'alles') === opt.value}
                      onChange={() => setExternalModal((prev) => ({ ...(prev || {}), scope: opt.value }))}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              <div style={{ fontSize: 13, color: '#334155', marginTop: 8 }}>
                Mit <b>Mail senden</b> oeffnet sich dein Mailprogramm mit der Auswahl zur Verplanung.
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                <button style={s.button} onClick={() => { setExternalModal(null); }}>Abbrechen</button>
                <button style={s.primaryButton} onClick={confirmExternal}>Mail senden</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {materialPlanWarningModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2250 }}>
          <div style={{ width: 'min(760px, 95vw)', background: '#fff', borderRadius: 8, border: '1px solid #cbd5e1' }}>
            <div style={{ padding: 10, borderBottom: '1px solid #e2e8f0', background: '#fef3c7', color: '#92400e' }}>
              <b>Warnung: Materialstatus nicht OK</b>
            </div>
            <div style={{ padding: 12, fontSize: 13, color: '#334155', display: 'grid', gap: 8 }}>
              <div>
                Mindestens ein Auftrag hat keinen Materialstatus <b>OK</b>. Die Verplanung ist trotzdem moeglich,
                es besteht jedoch das Risiko, dass nicht wie geplant produziert werden kann.
              </div>
              <div style={{ maxHeight: 260, overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: 6, background: '#f8fafc', padding: 8 }}>
                {(materialPlanWarningModal.warnings || []).map((entry) => (
                  <div key={`mat-warn-${entry.itemId}`} style={{ borderTop: '1px solid #e2e8f0', padding: '6px 0' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{entry.itemId} | {entry.projekt} | {entry.produkt}</div>
                    {entry.reasons.map((reason) => (
                      <div key={`${entry.itemId}-${reason}`} style={{ fontSize: 12, color: '#475569' }}>- {reason}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: 12, borderTop: '1px solid #e2e8f0' }}>
              <button
                style={s.button}
                onClick={() => {
                  pendingMaterialPlanActionRef.current = null;
                  setMaterialPlanWarningModal(null);
                }}
              >
                Abbrechen
              </button>
              <button
                style={{ ...s.primaryButton, background: '#fef3c7', borderColor: '#f59e0b', color: '#92400e' }}
                onClick={() => {
                  const pending = pendingMaterialPlanActionRef.current;
                  pendingMaterialPlanActionRef.current = null;
                  setMaterialPlanWarningModal(null);
                  if (pending) pending();
                }}
              >
                Trotzdem verplanen
              </button>
            </div>
          </div>
        </div>
      )}

      {fixConfirmModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2200 }}>
          <div style={{ width: 'min(720px, 94vw)', background: '#fff', borderRadius: 8, border: '1px solid #cbd5e1' }}>
            <div style={{ padding: 10, borderBottom: '1px solid #e2e8f0' }}>
              <b>Feinplanung fixieren - Bestaetigung</b>
            </div>
            <div style={{ padding: 12, fontSize: 13, color: '#334155', display: 'grid', gap: 8 }}>
              <div>
                Mit der Fixierung wird im Hintergrund eine Mail an alle Montageleiter gesendet
                mit dem Vermerk, dass ihre Bauteilliste jetzt in die Produktion verplant wurde.
              </div>
              <div>
                Nach 2 Tagen ohne Reaktion sind Terminverschiebungen nur noch mit triftigem Grund moeglich.
              </div>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>
                Dieses Popup gilt als Bestaetigung.
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: 12, borderTop: '1px solid #e2e8f0' }}>
              <button style={s.button} onClick={() => setFixConfirmModal(false)}>Abbrechen</button>
              <button style={s.primaryButton} onClick={confirmFixPlanning}>Bestaetigen und fixieren</button>
            </div>
          </div>
        </div>
      )}

      {capacityWarningModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2300 }}>
          <div style={{ width: 'min(640px, 94vw)', background: '#fff', borderRadius: 8, border: '1px solid #cbd5e1' }}>
            <div style={{ padding: 10, borderBottom: '1px solid #e2e8f0' }}>
              <b>Kapazitaetswarnung</b>
            </div>
            <div style={{ padding: 12, fontSize: 13, color: '#334155', display: 'grid', gap: 8 }}>
              <div>
                Der Auftrag kann nicht verplant werden, weil die Linienkapazitaet ueberschritten wird.
              </div>
              <div>
                <b>Auftrag:</b> {capacityWarningModal.itemId} | {capacityWarningModal.projekt} | {capacityWarningModal.produkt} ({capacityWarningModal.stunden} h)
              </div>
              <div>
                <b>Linie:</b> {capacityWarningModal.lineName}
              </div>
              <div>
                <b>Kapazitaet:</b> {capacityWarningModal.cap} h | <b>Nach Verplanung:</b> {capacityWarningModal.usedAfter} h | <b>Ueberplanung:</b> {capacityWarningModal.overBy} h
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: 12, borderTop: '1px solid #e2e8f0' }}>
              <button style={s.primaryButton} onClick={() => setCapacityWarningModal(null)}>Verstanden</button>
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
      </main>
    </div>
  );
}















