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
    ],
    open: false,
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
    title: 'Logistik',
    items: ['Produktionsuebersicht', 'LKW Kalender', 'Uebersicht Transportgestelle', 'Physischer Bestand', 'Externe Aufträge', 'Magazin'],
    open: true,
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

const demoToday = new Date();
const demoDay = (offset) => toIsoDate(addDays(demoToday, offset));
const demoDateTime = (offset, time = '06:00') => `${demoDay(offset)} ${time}`;

const logisticsData = [
  {
    paId: 'PA-2026-3001',
    projekt: 'MX4100A-BTL77100',
    produktmix: 'Fenster/Fluegel',
    produktionsstart: demoDateTime(8),
    abrufTermin: demoDay(4),
    quelleSF: true,
    quelleERP: true,
    lagerplatz: 'LZ-4.1-017',
    versandart: 'Spedition',
    abrufStatus: 'offen',
    versandpapierStatus: 'fehlend',
  },
  {
    paId: 'PA-2026-3002',
    projekt: 'QZ5500C-BTL88230',
    produktmix: 'Fassaden/AWE',
    produktionsstart: demoDateTime(9),
    abrufTermin: demoDay(5),
    quelleSF: true,
    quelleERP: true,
    lagerplatz: 'LZ-4.3-004',
    versandart: 'Eigenfuhrpark',
    abrufStatus: 'bereit',
    versandpapierStatus: 'in Arbeit',
  },
  {
    paId: 'PA-2026-3003',
    projekt: 'FE9900E-BTL51120',
    produktmix: 'Fenster',
    produktionsstart: demoDateTime(10),
    abrufTermin: demoDay(6),
    quelleSF: true,
    quelleERP: false,
    lagerplatz: 'LZ-4.1-031',
    versandart: 'Spedition',
    abrufStatus: 'offen',
    versandpapierStatus: 'fehlend',
  },
  {
    paId: 'PA-2026-3004',
    projekt: 'TU4410C-BTL22310',
    produktmix: 'Tueren',
    produktionsstart: demoDateTime(11),
    abrufTermin: demoDay(7),
    quelleSF: true,
    quelleERP: true,
    lagerplatz: 'LZ-4.1-009',
    versandart: 'Abholung Kunde',
    abrufStatus: 'bereit',
    versandpapierStatus: 'fertig',
  },
  {
    paId: 'PA-2026-3005',
    projekt: 'FA2201B-BTL66500',
    produktmix: 'Fassaden/Fenster',
    produktionsstart: demoDateTime(12),
    abrufTermin: demoDay(8),
    quelleSF: true,
    quelleERP: true,
    lagerplatz: 'LZ-4.3-010',
    versandart: 'Spedition',
    abrufStatus: 'offen',
    versandpapierStatus: 'in Arbeit',
  },
  {
    paId: 'PA-2026-3006',
    projekt: 'AW3301D-BTL70010',
    produktmix: 'AWE',
    produktionsstart: demoDateTime(13),
    abrufTermin: '',
    quelleSF: true,
    quelleERP: false,
    lagerplatz: 'LZ-4.3-013',
    versandart: 'Eigenfuhrpark',
    abrufStatus: 'offen',
    versandpapierStatus: 'fehlend',
  },
  {
    paId: 'PA-2026-3007',
    projekt: 'FL7700E-BTL11020',
    produktmix: 'Fluegel',
    produktionsstart: demoDateTime(14),
    abrufTermin: demoDay(10),
    quelleSF: true,
    quelleERP: true,
    lagerplatz: 'LZ-4.1-022',
    versandart: 'Spedition',
    abrufStatus: 'bereit',
    versandpapierStatus: 'fertig',
  },
  {
    paId: 'PA-2026-3008',
    projekt: 'FE2201F-BTL99070',
    produktmix: 'Fenster/Tueren',
    produktionsstart: demoDateTime(15),
    abrufTermin: '',
    quelleSF: true,
    quelleERP: true,
    lagerplatz: 'LZ-4.1-028',
    versandart: 'Abholung Kunde',
    abrufStatus: 'offen',
    versandpapierStatus: 'in Arbeit',
  },
  {
    paId: 'PA-2026-3009',
    projekt: 'BK8810A-BTL23010',
    produktmix: 'Fenster',
    produktionsstart: demoDateTime(16),
    abrufTermin: demoDay(12),
    quelleSF: true,
    quelleERP: true,
    lagerplatz: 'LZ-4.1-032',
    versandart: 'Spedition',
    abrufStatus: 'bereit',
    versandpapierStatus: 'fertig',
  },
  {
    paId: 'PA-2026-3010',
    projekt: 'DF2200C-BTL71040',
    produktmix: 'Fassaden',
    produktionsstart: demoDateTime(17),
    abrufTermin: demoDay(13),
    quelleSF: true,
    quelleERP: true,
    lagerplatz: 'LZ-4.3-021',
    versandart: 'Eigenfuhrpark',
    abrufStatus: 'offen',
    versandpapierStatus: 'in Arbeit',
  },
  {
    paId: 'PA-2026-3011',
    projekt: 'HN1160B-BTL60220',
    produktmix: 'Tueren/Fenster',
    produktionsstart: demoDateTime(18),
    abrufTermin: '',
    quelleSF: true,
    quelleERP: false,
    lagerplatz: 'LZ-4.1-019',
    versandart: 'Spedition',
    abrufStatus: 'offen',
    versandpapierStatus: 'fehlend',
  },
  {
    paId: 'PA-2026-3012',
    projekt: 'RW3320D-BTL41880',
    produktmix: 'AWE/Fassaden',
    produktionsstart: demoDateTime(19),
    abrufTermin: demoDay(15),
    quelleSF: true,
    quelleERP: true,
    lagerplatz: 'LZ-4.3-025',
    versandart: 'Abholung Kunde',
    abrufStatus: 'bereit',
    versandpapierStatus: 'fertig',
  },
  {
    paId: 'PA-2026-3013',
    projekt: 'VS4490A-BTL33400',
    produktmix: 'Fluegel',
    produktionsstart: demoDateTime(20),
    abrufTermin: demoDay(16),
    quelleSF: true,
    quelleERP: true,
    lagerplatz: 'LZ-4.1-041',
    versandart: 'Spedition',
    abrufStatus: 'offen',
    versandpapierStatus: 'in Arbeit',
  },
  {
    paId: 'PA-2026-3014',
    projekt: 'TR0085E-BTL55090',
    produktmix: 'Fenster/Fassaden',
    produktionsstart: demoDateTime(19, '11:00'),
    abrufTermin: '',
    quelleSF: true,
    quelleERP: true,
    lagerplatz: 'LZ-4.3-034',
    versandart: 'Eigenfuhrpark',
    abrufStatus: 'offen',
    versandpapierStatus: 'fehlend',
  },
];

const transportGestellData = [
  { ladungstraeger: 'L-38', abruf: 'bf0180c-MA0.1505', projekt: 'MX4100A-BTL77100', containerTyp: 'L-2400', datumVersand: demoDay(-56), versandInfo: 'angemeldet', nichtMehrVorOrt: false, montageleiter: 'Max Winter', bemerkung: '', standort: 'Baustelle' },
  { ladungstraeger: 'L-59', abruf: 'bi2252b-MA0.2501', projekt: 'QZ5500C-BTL88230', containerTyp: 'L-2400', datumVersand: demoDay(-42), versandInfo: '', nichtMehrVorOrt: false, montageleiter: 'Laura Hahn', bemerkung: '', standort: 'Baustelle' },
  { ladungstraeger: 'L-126', abruf: 'bn0173a-MA0.3555', projekt: 'FE9900E-BTL51120', containerTyp: 'L-2400', datumVersand: demoDay(-35), versandInfo: '', nichtMehrVorOrt: false, montageleiter: 'Jonas Weber', bemerkung: 'noch mit Elementen belegt', standort: 'Baustelle' },
  { ladungstraeger: 'L-35', abruf: 'eb0175b-MA0.1520', projekt: 'TU4410C-BTL22310', containerTyp: 'L-2400', datumVersand: demoDay(-28), versandInfo: 'angemeldet', nichtMehrVorOrt: false, montageleiter: 'Laura Hahn', bemerkung: '', standort: 'Ruecktransport geplant' },
  { ladungstraeger: 'L-213', abruf: 'fb2408a-MA0.1501', projekt: 'FA2201B-BTL66500', containerTyp: 'L-4000', datumVersand: demoDay(-21), versandInfo: '', nichtMehrVorOrt: false, montageleiter: 'Nina Roth', bemerkung: '', standort: 'Baustelle' },
  { ladungstraeger: 'L-162', abruf: 'hb0264a-MA0.1500', projekt: 'AW3301D-BTL70010', containerTyp: 'L-2400', datumVersand: demoDay(-18), versandInfo: '', nichtMehrVorOrt: true, montageleiter: 'Tom Berger', bemerkung: 'nicht mehr vor Ort', standort: 'Werk' },
  { ladungstraeger: 'L-548', abruf: 'hh0599b-MA0.2503', projekt: 'FL7700E-BTL11020', containerTyp: 'L-2400', datumVersand: demoDay(-14), versandInfo: '', nichtMehrVorOrt: false, montageleiter: 'Max Winter', bemerkung: '', standort: 'Baustelle' },
  { ladungstraeger: 'L-220', abruf: 'hh0600c-MA0.1508', projekt: 'FE2201F-BTL99070', containerTyp: 'L-4000', datumVersand: demoDay(-10), versandInfo: '', nichtMehrVorOrt: false, montageleiter: 'Eva Krueger', bemerkung: 'Baustelle hat sich um 6 Wochen verschoben', standort: 'Baustelle' },
  { ladungstraeger: 'A-16', abruf: 'hh0602a-MA0.2502', projekt: 'BK8810A-BTL23010', containerTyp: 'A-2000', datumVersand: demoDay(-9), versandInfo: '', nichtMehrVorOrt: true, montageleiter: 'Eva Krueger', bemerkung: 'Nicht mehr vor Ort', standort: 'Werk' },
  { ladungstraeger: 'L-92', abruf: 'hl1017b-MA0.2503', projekt: 'DF2200C-BTL71040', containerTyp: 'L-2400', datumVersand: demoDay(-7), versandInfo: '', nichtMehrVorOrt: true, montageleiter: 'Tom Berger', bemerkung: 'nicht mehr vor Ort', standort: 'Werk' },
  { ladungstraeger: 'L-509', abruf: 'ke4340-MA0.1', projekt: 'HN1160B-BTL60220', containerTyp: 'L-2400', datumVersand: demoDay(-5), versandInfo: '', nichtMehrVorOrt: false, montageleiter: 'Mia Lange', bemerkung: '', standort: 'Baustelle' },
  { ladungstraeger: 'L-107', abruf: 'ki0117a-MA0.2518', projekt: 'RW3320D-BTL41880', containerTyp: 'L-2400', datumVersand: demoDay(-3), versandInfo: 'angemeldet', nichtMehrVorOrt: false, montageleiter: 'Tom Berger', bemerkung: 'Abholbereit 4x Ruecklieferung Tueren', standort: 'Ruecktransport geplant' },
  { ladungstraeger: 'L-311', abruf: 'vs4490a-MA0.1402', projekt: 'VS4490A-BTL33400', containerTyp: 'L-2400', datumVersand: demoDay(-1), versandInfo: '', nichtMehrVorOrt: false, montageleiter: 'Mia Lange', bemerkung: '', standort: 'Baustelle' },
  { ladungstraeger: 'L-315', abruf: 'tr0085e-MA0.3301', projekt: 'TR0085E-BTL55090', containerTyp: 'L-4000', datumVersand: demoDay(0), versandInfo: 'angemeldet', nichtMehrVorOrt: false, montageleiter: 'Nina Roth', bemerkung: 'Rueckmeldung von Baustelle ausstehend', standort: 'Ruecktransport geplant' },
  { ladungstraeger: 'A-61', abruf: 'rw3320d-MA0.2010', projekt: 'RW3320D-BTL41880', containerTyp: 'A-2000', datumVersand: demoDay(2), versandInfo: '', nichtMehrVorOrt: false, montageleiter: 'Tom Berger', bemerkung: '', standort: 'Baustelle' },
];

const externalOrderData = [
  { id: 'ext-1', gestellnummer: 'L-505', projekt: 'BS0168B-2501', ort: 'Pfullendorf', lieferdatum: demoDay(-21), ruecklieferung: demoDay(-2), status: 'geplant' },
  { id: 'ext-2', gestellnummer: 'L-93', projekt: 'BS0168B-2501', ort: 'Pfullendorf', lieferdatum: demoDay(-20), ruecklieferung: demoDay(3), status: 'geplant' },
  { id: 'ext-3', gestellnummer: 'L-506', projekt: 'BG0134A-1510', ort: 'Berlin', lieferdatum: demoDay(-25), ruecklieferung: demoDay(-6), status: 'ueberfaellig' },
  { id: 'ext-4', gestellnummer: 'L-85', projekt: 'BG0134A-1510', ort: 'Berlin', lieferdatum: demoDay(-18), ruecklieferung: '', status: 'offen' },
  { id: 'ext-5', gestellnummer: 'L-101 / H-2750', projekt: 'BG0130C-2530-BTL52600', ort: 'Schoenefeld', lieferdatum: demoDay(-14), ruecklieferung: demoDay(7), status: 'geplant' },
  { id: 'ext-6', gestellnummer: '1 Palette', projekt: 'EB0195A-1502-BTL50400', ort: 'Arnstadt', lieferdatum: demoDay(-12), ruecklieferung: demoDay(9), status: 'geplant' },
  { id: 'ext-7', gestellnummer: 'L-132', projekt: 'EB0195A-1503-BTL50500+BTL50600', ort: 'Arnstadt', lieferdatum: demoDay(-11), ruecklieferung: demoDay(10), status: 'geplant' },
  { id: 'ext-8', gestellnummer: 'L-147', projekt: 'EB0195A-1503-BTL50500+BTL50600', ort: 'Arnstadt', lieferdatum: demoDay(-10), ruecklieferung: '', status: 'offen' },
  { id: 'ext-9', gestellnummer: 'L-532', projekt: 'EB0195A-1503-BTL50500+BTL50600', ort: 'Arnstadt', lieferdatum: demoDay(-9), ruecklieferung: demoDay(12), status: 'geplant' },
  { id: 'ext-10', gestellnummer: 'L-204', projekt: 'HH0588B-1541', ort: 'Gruenheide', lieferdatum: demoDay(-7), ruecklieferung: demoDay(14), status: 'geplant' },
  { id: 'ext-11', gestellnummer: 'L-204-B', projekt: 'HH0588B-1542', ort: 'Gruenheide', lieferdatum: demoDay(-6), ruecklieferung: '', status: 'offen' },
  { id: 'ext-12', gestellnummer: 'L-350', projekt: 'BL0141A-2510-BTL50300', ort: 'Potsdam', lieferdatum: demoDay(-4), ruecklieferung: demoDay(16), status: 'erledigt' },
];

function formatDateTimeLocal(value) {
  const d = new Date(value);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

function resolveLinieForLogisticsRow(row) {
  const lagerplatz = String(row?.lagerplatz || '').toLowerCase();
  const produktmix = String(row?.produktmix || '').toLowerCase();
  if (produktmix.includes('fassaden') || produktmix.includes('awe')) return 'Fassadenlinie';
  if (produktmix.includes('tueren')) return 'Türenline';
  if (produktmix.includes('fenster') || produktmix.includes('fluegel')) return 'Fensterlinie';
  if (lagerplatz.includes('4.3')) return 'Fassadenlinie';
  if (lagerplatz.includes('4.1')) return 'Fensterlinie';
  return '-';
}

function createUebergabeKommentareDemo(paId, projekt) {
  const items = [
    {
      id: `${paId}-kom-1`,
      vonAbteilung: 'Konstruktion',
      anAbteilung: 'AV',
      kommentar: `Zeichnung fuer ${projekt} freigegeben. Bitte Fertigungsfolge pruefen.`,
      erstelltVon: 'Konstruktion Team',
      erstelltAm: demoDay(-3),
    },
    {
      id: `${paId}-kom-2`,
      vonAbteilung: 'AV',
      anAbteilung: 'Einkauf',
      kommentar: 'Beschlaege und Dichtungen priorisiert bestellen. Liefertermin kritisch.',
      erstelltVon: 'AV Leitstand',
      erstelltAm: demoDay(-2),
    },
  ];
  if (paId.endsWith('05') || paId.endsWith('09')) {
    items.push({
      id: `${paId}-kom-3`,
      vonAbteilung: 'Einkauf',
      anAbteilung: 'Feinplanung',
      kommentar: 'Teil-Lieferung avisiert. Reihenfolge in Schirmer ggf. anpassen.',
      erstelltVon: 'Einkauf Dispo',
      erstelltAm: demoDay(-1),
    });
  }
  return items;
}

function createMagazinFreigabenDemoData() {
  const now = new Date();
  const templates = [
    // 6 Auftraege: Deadline heute (Schirmer-Start in 2 Tagen) und noch nicht gepackt
    { id: 'MAG-AUF-01', paId: 'PA-2026-3001', projekt: 'MX4100A-BTL77100', startOffsetDays: 2, startHour: 6, startMinute: 0, dauer: 100, freigegebenVon: 'Vorarbeiter Halle 4.1', gepackt: false },
    { id: 'MAG-AUF-02', paId: 'PA-2026-3002', projekt: 'QZ5500C-BTL88230', startOffsetDays: 2, startHour: 6, startMinute: 40, dauer: 90, freigegebenVon: 'Vorarbeiter Halle 4.3', gepackt: false },
    { id: 'MAG-AUF-03', paId: 'PA-2026-3003', projekt: 'FE9900E-BTL51120', startOffsetDays: 2, startHour: 7, startMinute: 20, dauer: 95, freigegebenVon: 'Vorarbeiter Halle 4.1', gepackt: false },
    { id: 'MAG-AUF-04', paId: 'PA-2026-3004', projekt: 'TU4410C-BTL22310', startOffsetDays: 2, startHour: 8, startMinute: 15, dauer: 85, freigegebenVon: 'Vorarbeiter Halle 4.1', gepackt: false },
    { id: 'MAG-AUF-05', paId: 'PA-2026-3005', projekt: 'FA2201B-BTL66500', startOffsetDays: 2, startHour: 9, startMinute: 0, dauer: 110, freigegebenVon: 'Vorarbeiter Halle 4.3', gepackt: false },
    { id: 'MAG-AUF-06', paId: 'PA-2026-3006', projekt: 'AW3301D-BTL70010', startOffsetDays: 2, startHour: 9, startMinute: 45, dauer: 80, freigegebenVon: 'Vorarbeiter Halle 4.3', gepackt: false },
    // weitere Demo-Auftraege mit spaeterer Deadline
    { id: 'MAG-AUF-07', paId: 'PA-2026-3007', projekt: 'FL7700E-BTL11020', startOffsetDays: 4, startHour: 6, startMinute: 30, dauer: 90, freigegebenVon: 'Vorarbeiter Halle 4.1', gepackt: false },
    { id: 'MAG-AUF-08', paId: 'PA-2026-3008', projekt: 'FE2201F-BTL99070', startOffsetDays: 5, startHour: 7, startMinute: 0, dauer: 105, freigegebenVon: 'Vorarbeiter Halle 4.1', gepackt: false },
    { id: 'MAG-AUF-09', paId: 'PA-2026-3009', projekt: 'BK8810A-BTL23010', startOffsetDays: 6, startHour: 8, startMinute: 0, dauer: 75, freigegebenVon: 'Vorarbeiter Halle 4.3', gepackt: false },
    { id: 'MAG-AUF-10', paId: 'PA-2026-3010', projekt: 'DF2200C-BTL71040', startOffsetDays: 7, startHour: 8, startMinute: 30, dauer: 95, freigegebenVon: 'Vorarbeiter Halle 4.3', gepackt: false },
  ];

  return templates.map((entry) => {
    const schirmerStartDate = new Date(now);
    schirmerStartDate.setDate(schirmerStartDate.getDate() + entry.startOffsetDays);
    schirmerStartDate.setHours(entry.startHour, entry.startMinute, 0, 0);

    const freigegebenDate = new Date(schirmerStartDate);
    freigegebenDate.setDate(freigegebenDate.getDate() - 2);
    freigegebenDate.setHours(9, 15, 0, 0);

    let gepacktAm = '';
    if (entry.gepackt) {
      const gepacktDate = new Date(now);
      gepacktDate.setDate(gepacktDate.getDate() - (entry.gepacktOffsetDays || 1));
      gepacktDate.setHours(entry.gepacktHour || 12, entry.gepacktMinute || 0, 0, 0);
      gepacktAm = formatDateTimeLocal(gepacktDate);
    }

    return {
      id: entry.id,
      paId: entry.paId,
      projekt: entry.projekt,
      freigegebenAm: formatDateTimeLocal(freigegebenDate),
      freigegebenVon: entry.freigegebenVon,
      schirmerStart: formatDateTimeLocal(schirmerStartDate),
      schirmerDauerMin: entry.dauer,
      gepackt: Boolean(entry.gepackt),
      gepacktAm,
      fehlteileAnzahl: 0,
      fehlteileHinweis: '',
      fehlteileGemeldetAm: '',
      fehlteileAnEinkaufAm: '',
      uebergabeKommentare: createUebergabeKommentareDemo(entry.paId, entry.projekt),
    };
  });
}

const magazinFreigabenData = createMagazinFreigabenDemoData();
const productionSnapshotByPa = {
  'PA-2026-3001': { produktionsStatus: 'In Produktion', fortschritt: 74, reststunden: 10, prognoseFertig: '2026-02-10 14:00' },
  'PA-2026-3002': { produktionsStatus: 'Pausiert', fortschritt: 89, reststunden: 4, prognoseFertig: '2026-02-11 11:00' },
  'PA-2026-3003': { produktionsStatus: 'Gesperrt', fortschritt: 58, reststunden: 14, prognoseFertig: '2026-02-13 09:00' },
  'PA-2026-3004': { produktionsStatus: 'Qualitaetspruefung', fortschritt: 96, reststunden: 1, prognoseFertig: '2026-02-13 08:00' },
  'PA-2026-3005': { produktionsStatus: 'nicht gestartet', fortschritt: 22, reststunden: 21, prognoseFertig: '2026-02-28 16:00' },
  'PA-2026-3006': { produktionsStatus: 'nicht gestartet', fortschritt: 14, reststunden: 24, prognoseFertig: '2026-03-01 13:00' },
  'PA-2026-3007': { produktionsStatus: 'In Produktion', fortschritt: 67, reststunden: 11, prognoseFertig: '2026-03-02 15:00' },
  'PA-2026-3008': { produktionsStatus: 'In Produktion', fortschritt: 52, reststunden: 16, prognoseFertig: '2026-03-03 10:00' },
  'PA-2026-3009': { produktionsStatus: 'Qualitaetspruefung', fortschritt: 94, reststunden: 2, prognoseFertig: '2026-03-04 12:00' },
  'PA-2026-3010': { produktionsStatus: 'In Produktion', fortschritt: 61, reststunden: 10, prognoseFertig: '2026-03-05 17:00' },
  'PA-2026-3011': { produktionsStatus: 'nicht gestartet', fortschritt: 19, reststunden: 20, prognoseFertig: '2026-03-06 11:30' },
  'PA-2026-3012': { produktionsStatus: 'Pausiert', fortschritt: 44, reststunden: 19, prognoseFertig: '2026-03-09 09:00' },
  'PA-2026-3013': { produktionsStatus: 'In Produktion', fortschritt: 72, reststunden: 8, prognoseFertig: '2026-03-09 14:30' },
  'PA-2026-3014': { produktionsStatus: 'nicht gestartet', fortschritt: 9, reststunden: 28, prognoseFertig: '2026-03-10 16:15' },
};

const fertigteileBestandData = [
  { artikelnummer: 'bi2277b-57011', produktname: 'Lochfenster (innen und aussen)', standort: 'Versandplatz 4.1', lagerort: 'Werk 4', lagerplatz: 'VSP-4.1-011', geplantesLieferdatum: demoDay(2), bauteilliste: 'BI2277B-BTL52000', ladungstraeger: 'L-38', physisch: 1, einheit: 'Stck', meldestatus: 'Fertig gemeldet' },
  { artikelnummer: 'bi2277b-57201', produktname: 'Tuer ohne Anforderungen (25.1-1)', standort: 'Versandplatz 4.1', lagerort: 'Werk 4', lagerplatz: 'VSP-4.1-011', geplantesLieferdatum: demoDay(3), bauteilliste: 'BI2277B-BTL52000', ladungstraeger: 'L-509', physisch: 2, einheit: 'Stck', meldestatus: 'Fertig gemeldet' },
  { artikelnummer: 'bn0178a-57000', produktname: 'Fensterelement', standort: 'Versandplatz 4.1', lagerort: 'Werk 4', lagerplatz: 'VSP-4.1-008', geplantesLieferdatum: demoDay(4), bauteilliste: 'BN0178A-BTL50500', ladungstraeger: 'L-220', physisch: 3, einheit: 'Stck', meldestatus: 'Fertig gemeldet' },
  { artikelnummer: 'do0110b-57201', produktname: 'Tuerelement T.A.-1.06', standort: 'Versandplatz 4.3', lagerort: 'Werk 4', lagerplatz: 'VSP-4.3-003', geplantesLieferdatum: demoDay(5), bauteilliste: 'DO0110B-BTL50000', ladungstraeger: 'A-16', physisch: 1, einheit: 'Stck', meldestatus: 'Fertig gemeldet' },
  { artikelnummer: 'fb2408a-57009', produktname: 'Fluegelset 90x220', standort: 'Versandplatz 4.3', lagerort: 'Werk 4', lagerplatz: 'VSP-4.3-007', geplantesLieferdatum: demoDay(6), bauteilliste: 'FB2408A-BTL51010', ladungstraeger: 'L-213', physisch: 1, einheit: 'Stck', meldestatus: 'Fertig gemeldet' },
  { artikelnummer: 'ki0117a-57218', produktname: 'Tuerblatt Entsorgung', standort: 'Versandplatz 4.1', lagerort: 'Werk 4', lagerplatz: 'VSP-4.1-020', geplantesLieferdatum: demoDay(7), bauteilliste: 'KI0117A-BTL55000', ladungstraeger: 'L-107', physisch: 4, einheit: 'Stck', meldestatus: 'Fertig gemeldet' },
  { artikelnummer: 'rw3320d-57112', produktname: 'AWE-Rahmen Nord', standort: 'Versandplatz 4.3', lagerort: 'Werk 4', lagerplatz: 'VSP-4.3-012', geplantesLieferdatum: demoDay(8), bauteilliste: 'RW3320D-BTL41880', ladungstraeger: 'A-61', physisch: 2, einheit: 'Stck', meldestatus: 'Fertig gemeldet' },
  { artikelnummer: 'vs4490a-57031', produktname: 'Fluegelpaket mit Beschlag', standort: 'Versandplatz 4.1', lagerort: 'Werk 4', lagerplatz: 'VSP-4.1-033', geplantesLieferdatum: demoDay(9), bauteilliste: 'VS4490A-BTL33400', ladungstraeger: 'L-311', physisch: 3, einheit: 'Stck', meldestatus: 'Fertig gemeldet' },
  { artikelnummer: 'tr0085e-57240', produktname: 'Fassadenkopfprofil', standort: 'Versandplatz 4.3', lagerort: 'Werk 4', lagerplatz: 'VSP-4.3-019', geplantesLieferdatum: demoDay(10), bauteilliste: 'TR0085E-BTL55090', ladungstraeger: 'L-315', physisch: 6, einheit: 'Stck', meldestatus: 'Fertig gemeldet' },
];

const paLadungstraegerBookings = {
  'PA-2026-3001': [
    {
      ladungstraeger: 'L-38',
      positionen: [
        { position: 'P-01', artikel: 'Fensterrahmen links', menge: 2, einheit: 'Stck' },
        { position: 'P-02', artikel: 'Fensterrahmen rechts', menge: 2, einheit: 'Stck' },
        { position: 'P-03', artikel: 'Fluegelpaket', menge: 1, einheit: 'Stck' },
      ],
    },
    {
      ladungstraeger: 'L-509',
      positionen: [
        { position: 'P-08', artikel: 'Beschlagsatz Fenster', menge: 4, einheit: 'Satz' },
      ],
    },
  ],
  'PA-2026-3002': [
    {
      ladungstraeger: 'L-220',
      positionen: [
        { position: 'P-11', artikel: 'Fassadenmodul Nord', menge: 3, einheit: 'Stck' },
        { position: 'P-12', artikel: 'AWE Paket', menge: 2, einheit: 'Stck' },
      ],
    },
  ],
  'PA-2026-3003': [
    {
      ladungstraeger: 'L-59',
      positionen: [
        { position: 'P-05', artikel: 'Fensterblock 1200', menge: 6, einheit: 'Stck' },
      ],
    },
  ],
  'PA-2026-3004': [
    {
      ladungstraeger: 'A-16',
      positionen: [
        { position: 'P-01', artikel: 'Tuerblatt T-01', menge: 4, einheit: 'Stck' },
        { position: 'P-02', artikel: 'Tuerblatt T-02', menge: 4, einheit: 'Stck' },
      ],
    },
  ],
  'PA-2026-3005': [
    {
      ladungstraeger: 'L-213',
      positionen: [
        { position: 'P-03', artikel: 'Fassadenelement Ost', menge: 2, einheit: 'Stck' },
        { position: 'P-04', artikel: 'Fensterpaket Sued', menge: 3, einheit: 'Stck' },
      ],
    },
    {
      ladungstraeger: 'L-548',
      positionen: [
        { position: 'P-09', artikel: 'Anschlussprofile', menge: 10, einheit: 'Stck' },
      ],
    },
  ],
  'PA-2026-3006': [],
  'PA-2026-3007': [
    {
      ladungstraeger: 'L-126',
      positionen: [
        { position: 'P-02', artikel: 'Fluegelset Standard', menge: 5, einheit: 'Stck' },
      ],
    },
  ],
  'PA-2026-3008': [
    {
      ladungstraeger: 'L-107',
      positionen: [
        { position: 'P-14', artikel: 'Fensterpaket West', menge: 3, einheit: 'Stck' },
        { position: 'P-15', artikel: 'Tuerpaket Eingangsseite', menge: 2, einheit: 'Stck' },
      ],
    },
  ],
  'PA-2026-3009': [
    {
      ladungstraeger: 'A-16',
      positionen: [
        { position: 'P-03', artikel: 'Fensterelement Sued', menge: 2, einheit: 'Stck' },
        { position: 'P-04', artikel: 'Fensterelement West', menge: 2, einheit: 'Stck' },
      ],
    },
  ],
  'PA-2026-3010': [
    {
      ladungstraeger: 'L-220',
      positionen: [
        { position: 'P-08', artikel: 'Fassadenriegel 2m', menge: 6, einheit: 'Stck' },
      ],
    },
    {
      ladungstraeger: 'L-315',
      positionen: [
        { position: 'P-09', artikel: 'Kopfprofil innen', menge: 4, einheit: 'Stck' },
      ],
    },
  ],
  'PA-2026-3011': [
    {
      ladungstraeger: 'L-509',
      positionen: [
        { position: 'P-01', artikel: 'Tuerzarge links', menge: 3, einheit: 'Stck' },
      ],
    },
  ],
  'PA-2026-3012': [
    {
      ladungstraeger: 'A-61',
      positionen: [
        { position: 'P-10', artikel: 'AWE-Rahmen Nord', menge: 2, einheit: 'Stck' },
      ],
    },
  ],
  'PA-2026-3013': [
    {
      ladungstraeger: 'L-311',
      positionen: [
        { position: 'P-05', artikel: 'Fluegelset Komfort', menge: 5, einheit: 'Stck' },
      ],
    },
  ],
  'PA-2026-3014': [
    {
      ladungstraeger: 'L-315',
      positionen: [
        { position: 'P-11', artikel: 'Fassadenkopfprofil', menge: 6, einheit: 'Stck' },
      ],
    },
  ],
};

const PACKLIST_SUPPLIERS = ['WSS', 'SC', 'DORMA'];

function supplierSeed(input) {
  const text = String(input || '');
  let seed = 0;
  for (let i = 0; i < text.length; i += 1) {
    seed = ((seed << 5) - seed) + text.charCodeAt(i);
    seed |= 0;
  }
  return Math.abs(seed);
}

function supplierForPosition(paId, position) {
  const seed = supplierSeed(`${paId}-${position?.position || ''}-${position?.artikel || ''}`);
  return PACKLIST_SUPPLIERS[seed % PACKLIST_SUPPLIERS.length];
}

function buildPacklisteForPa(paId) {
  const bookings = paLadungstraegerBookings[paId] || [];
  const parts = bookings.flatMap((booking) => (
    (booking.positionen || []).map((position, idx) => ({
      partId: `${paId}-${booking.ladungstraeger}-${position.position || idx}-${position.artikel || 'teil'}`,
      lieferant: supplierForPosition(paId, position),
      ladungstraeger: booking.ladungstraeger,
      position: position.position,
      artikel: position.artikel,
      menge: Number(position.menge) || 0,
      einheit: position.einheit || 'Stck',
    }))
  ));

  if (parts.length === 0) {
    return PACKLIST_SUPPLIERS.map((lieferant, idx) => ({
      lieferant,
      sumMenge: idx === 0 ? 2 : 1,
      teile: [{
        partId: `${paId}-${lieferant}-GEN-${idx + 1}`,
        ladungstraeger: '-',
        position: `GEN-${idx + 1}`,
        artikel: `Standardbauteil ${lieferant}`,
        menge: idx === 0 ? 2 : 1,
        einheit: 'Stck',
      }],
    }));
  }

  const grouped = PACKLIST_SUPPLIERS.reduce((acc, key) => ({ ...acc, [key]: [] }), {});
  parts.forEach((part) => {
    grouped[part.lieferant].push(part);
  });

  return PACKLIST_SUPPLIERS.map((lieferant) => {
    const teile = grouped[lieferant] || [];
    const sumMenge = teile.reduce((sum, part) => sum + (Number(part.menge) || 0), 0);
    return { lieferant, teile, sumMenge };
  }).filter((group) => group.teile.length > 0);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const calendarStatusMeta = {
  abholung_montage: { label: 'Abholung durch Montage', bg: '#d9f99d', border: '#84cc16', text: '#365314' },
  versand_dhl_express: { label: 'Versand mit DHL Express', bg: '#fbcfe8', border: '#ec4899', text: '#831843' },
  transport_hamm: { label: 'Transport nach Hamm', bg: '#bae6fd', border: '#0ea5e9', text: '#0c4a6e' },
  storno: { label: 'Storno des Abrufs/Transports', bg: '#ddd6fe', border: '#8b5cf6', text: '#4c1d95' },
  offen_transport_noetig: { label: 'Transport muss noch bestellt werden', bg: '#fde68a', border: '#f59e0b', text: '#78350f' },
  transport_bestellt: { label: 'Transport ist bestellt', bg: '#fecaca', border: '#ef4444', text: '#7f1d1d' },
  verladen: { label: 'Transport ist verladen', bg: '#bbf7d0', border: '#16a34a', text: '#14532d' },
};

function createInitialTruckBookings(weekStart) {
  const dayIso = (offset) => toIsoDate(addDays(weekStart, offset));
  return [
    { id: 'LKW-1', paId: 'PA-2026-3001', datum: dayIso(0), start: '06:30', ende: '07:30', lkw: 'DHL-241', art: 'Abruf', status: 'versand_dhl_express' },
    { id: 'LKW-2', paId: 'PA-2026-3004', datum: dayIso(0), start: '07:45', ende: '08:30', lkw: 'MNT-018', art: 'Abruf', status: 'abholung_montage' },
    { id: 'LKW-3', paId: 'PA-2026-3004', datum: dayIso(0), start: '09:10', ende: '09:50', lkw: 'SPED-103', art: 'Versand', status: 'transport_bestellt' },
    { id: 'LKW-4', paId: 'PA-2026-3002', datum: dayIso(0), start: '11:00', ende: '11:40', lkw: 'HAM-660', art: 'Versand', status: 'transport_hamm' },
    { id: 'LKW-5', paId: 'PA-2026-3008', datum: dayIso(0), start: '14:20', ende: '15:10', lkw: 'SPED-889', art: 'Abruf', status: 'offen_transport_noetig' },
    { id: 'LKW-6', paId: 'PA-2026-3002', datum: dayIso(1), start: '06:00', ende: '07:15', lkw: 'SPED-552', art: 'Abruf', status: 'transport_bestellt' },
    { id: 'LKW-7', paId: 'PA-2026-3003', datum: dayIso(1), start: '08:00', ende: '09:00', lkw: 'DHL-901', art: 'Abruf', status: 'versand_dhl_express' },
    { id: 'LKW-8', paId: 'PA-2026-3005', datum: dayIso(1), start: '10:10', ende: '11:00', lkw: 'MNT-044', art: 'Abruf', status: 'abholung_montage' },
    { id: 'LKW-9', paId: 'PA-2026-3001', datum: dayIso(1), start: '12:15', ende: '13:00', lkw: 'SPED-318', art: 'Versand', status: 'verladen' },
    { id: 'LKW-10', paId: 'PA-2026-3006', datum: dayIso(1), start: '15:00', ende: '15:45', lkw: 'SPED-771', art: 'Abruf', status: 'storno' },
    { id: 'LKW-11', paId: 'PA-2026-3005', datum: dayIso(2), start: '06:20', ende: '07:10', lkw: 'HAM-204', art: 'Versand', status: 'transport_hamm' },
    { id: 'LKW-12', paId: 'PA-2026-3006', datum: dayIso(2), start: '07:30', ende: '09:00', lkw: 'SPED-118', art: 'Abruf', status: 'offen_transport_noetig' },
    { id: 'LKW-13', paId: 'PA-2026-3007', datum: dayIso(2), start: '09:30', ende: '10:10', lkw: 'DHL-667', art: 'Versand', status: 'versand_dhl_express' },
    { id: 'LKW-14', paId: 'PA-2026-3008', datum: dayIso(2), start: '11:20', ende: '12:10', lkw: 'SPED-404', art: 'Abruf', status: 'transport_bestellt' },
    { id: 'LKW-15', paId: 'PA-2026-3003', datum: dayIso(2), start: '14:45', ende: '15:25', lkw: 'MNT-012', art: 'Abruf', status: 'abholung_montage' },
    { id: 'LKW-16', paId: 'PA-2026-3007', datum: dayIso(3), start: '06:45', ende: '08:00', lkw: 'DHL-667', art: 'Versand', status: 'verladen' },
    { id: 'LKW-17', paId: 'PA-2026-3008', datum: dayIso(3), start: '08:20', ende: '09:10', lkw: 'GBK-404', art: 'Abruf', status: 'transport_bestellt' },
    { id: 'LKW-18', paId: 'PA-2026-3002', datum: dayIso(3), start: '10:00', ende: '10:50', lkw: 'HAM-332', art: 'Versand', status: 'transport_hamm' },
    { id: 'LKW-19', paId: 'PA-2026-3004', datum: dayIso(3), start: '12:00', ende: '12:40', lkw: 'SPED-018', art: 'Versand', status: 'storno' },
    { id: 'LKW-20', paId: 'PA-2026-3005', datum: dayIso(3), start: '15:10', ende: '16:00', lkw: 'DHL-990', art: 'Versand', status: 'versand_dhl_express' },
    { id: 'LKW-21', paId: 'PA-2026-3005', datum: dayIso(4), start: '07:00', ende: '08:00', lkw: 'SPED-781', art: 'Versand', status: 'verladen' },
    { id: 'LKW-22', paId: 'PA-2026-3002', datum: dayIso(4), start: '09:30', ende: '10:30', lkw: 'DHL-332', art: 'Abruf', status: 'transport_bestellt' },
    { id: 'LKW-23', paId: 'PA-2026-3001', datum: dayIso(4), start: '11:30', ende: '12:20', lkw: 'MNT-221', art: 'Abruf', status: 'abholung_montage' },
    { id: 'LKW-24', paId: 'PA-2026-3006', datum: dayIso(4), start: '14:00', ende: '14:50', lkw: 'SPED-910', art: 'Abruf', status: 'offen_transport_noetig' },
    { id: 'LKW-25', paId: 'PA-2026-3009', datum: dayIso(0), start: '15:10', ende: '16:00', lkw: 'MNT-330', art: 'Abruf', status: 'abholung_montage' },
    { id: 'LKW-26', paId: 'PA-2026-3010', datum: dayIso(1), start: '13:20', ende: '14:10', lkw: 'SPED-771', art: 'Versand', status: 'transport_bestellt' },
    { id: 'LKW-27', paId: 'PA-2026-3011', datum: dayIso(2), start: '12:10', ende: '13:00', lkw: 'MNT-074', art: 'Abruf', status: 'abholung_montage' },
    { id: 'LKW-28', paId: 'PA-2026-3012', datum: dayIso(3), start: '14:15', ende: '15:05', lkw: 'HAM-992', art: 'Versand', status: 'transport_hamm' },
    { id: 'LKW-29', paId: 'PA-2026-3013', datum: dayIso(4), start: '06:10', ende: '07:00', lkw: 'MNT-551', art: 'Abruf', status: 'abholung_montage' },
    { id: 'LKW-30', paId: 'PA-2026-3014', datum: dayIso(4), start: '16:00', ende: '16:45', lkw: 'SPED-221', art: 'Versand', status: 'offen_transport_noetig' },
  ];
}

function formatDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(value) {
  const d = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value.includes(' ') ? value.replace(' ', 'T') : `${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function diffDays(fromDate, toDate) {
  const ms = toDate.getTime() - fromDate.getTime();
  return Math.floor(ms / 86400000);
}

function toIsoDate(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function subtractWorkdays(date, days) {
  const d = new Date(date);
  let remaining = Math.max(0, Number(days) || 0);
  while (remaining > 0) {
    d.setDate(d.getDate() - 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return d;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getIsoWeekInfo(value) {
  const input = new Date(value);
  if (Number.isNaN(input.getTime())) return null;
  const d = new Date(Date.UTC(input.getFullYear(), input.getMonth(), input.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  const year = d.getUTCFullYear();
  return {
    year,
    week,
    id: `${year}-${String(week).padStart(2, '0')}`,
    label: `KW ${String(week).padStart(2, '0')} (${year})`,
  };
}

function startOfIsoWeek(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseClockToMinutes(value) {
  const [hh, mm] = String(value || '').split(':').map((x) => Number(x));
  if (Number.isNaN(hh) || Number.isNaN(mm)) return 0;
  return (hh * 60) + mm;
}

function productionOrderNo(value) {
  const digits = String(value || '').replace(/\D/g, '');
  const last = digits.slice(-7).padStart(7, '0');
  return `300-${last}`;
}

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
        <span style={{ fontSize: 14 }}>{open ? '▼' : '▶'}</span>
      </div>
      {open && (
        <div style={{ paddingLeft: 8 }}>
          {items.map((item, idx) => {
            const active = title === 'Logistik' ? activeItem === item : idx === 0;
            return (
              <div
                key={`${title}-${item}`}
                onClick={title === 'Logistik' && onItemClick ? () => onItemClick(item) : undefined}
                style={{
                  margin: '8px 0',
                  fontSize: 18,
                  fontWeight: active ? 700 : 400,
                  color: active ? '#0f172a' : '#1f2937',
                  borderLeft: active ? '4px solid #42b4e5' : '4px solid transparent',
                  paddingLeft: 10,
                  cursor: title === 'Logistik' ? 'pointer' : 'default',
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

function statusBadge(type) {
  if (type === 'fertig') return { background: '#d1fae5', color: '#166534', border: '1px solid #a7f3d0' };
  if (type === 'bereit') return { background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' };
  if (type === 'in Arbeit') return { background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' };
  return { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' };
}

function productionBadge(type) {
  if (type === 'Gesperrt') return { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' };
  if (type === 'Pausiert') return { background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' };
  if (type === 'In Produktion') return { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #93c5fd' };
  if (type === 'Qualitaetspruefung') return { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' };
  return { background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' };
}

function productionStatusLabel(type) {
  if (type === 'Qualitaetspruefung') return 'Qualitätsprüfung';
  return type;
}

function timingStatus(row) {
  const prognose = parseDate(row.prognoseFertig);
  const abrufDeadline = parseDate(`${row.abrufTermin} 23:59`);
  if (!prognose || !abrufDeadline) return 'unbekannt';
  const diffH = (prognose - abrufDeadline) / 3600000;
  if (diffH <= 0) return 'termingerecht';
  if (diffH <= 12) return 'risiko';
  return 'verspaetet';
}

function timingStatusByLkw(prognoseFertig, lkwTermin) {
  const prognose = parseDate(prognoseFertig);
  const deadline = parseDate(lkwTermin);
  if (!prognose || !deadline) return 'unbekannt';
  const diffH = (prognose - deadline) / 3600000;
  if (diffH <= 0) return 'termingerecht';
  if (diffH <= 8) return 'risiko';
  return 'verspaetet';
}

function timingBadge(type) {
  if (type === 'termingerecht') return { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' };
  if (type === 'risiko') return { background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' };
  if (type === 'verspaetet') return { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' };
  return { background: '#e2e8f0', color: '#334155', border: '1px solid #cbd5e1' };
}

function gestellAmpel(row) {
  if (row.nichtMehrVorOrt || row.standort === 'Werk') return 'ok';
  if (row.standort === 'Ruecktransport geplant') return 'warnung';
  const d = parseDate(row.datumVersand);
  if (!d) return 'warnung';
  const age = diffDays(d, new Date());
  if (age > 70) return 'kritisch';
  if (age > 35) return 'warnung';
  return 'ok';
}

function gestellAmpelBadge(type) {
  if (type === 'kritisch') return { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' };
  if (type === 'warnung') return { background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' };
  return { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' };
}

function externalStatusBadge(type) {
  if (type === 'erledigt') return { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' };
  if (type === 'geplant') return { background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' };
  if (type === 'ueberfaellig') return { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' };
  return { background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' };
}

export default function LogistikScreen({
  activeLogistikView: controlledActiveLogistikView,
  hideSidebar = false,
  initialActiveLogistikView = 'Produktionsuebersicht',
} = {}) {
  const [internalActiveLogistikView, setInternalActiveLogistikView] = useState(initialActiveLogistikView);
  const activeLogistikView = controlledActiveLogistikView || internalActiveLogistikView;
  const setActiveLogistikView = controlledActiveLogistikView ? () => {} : setInternalActiveLogistikView;
  const [gestellData, setGestellData] = useState(transportGestellData);
  const [externalOrders, setExternalOrders] = useState(() => (
    externalOrderData.map((row) => ({
      ...row,
      terminverschiebungen: Array.isArray(row.terminverschiebungen) ? row.terminverschiebungen : [],
    }))
  ));
  const [terminModal, setTerminModal] = useState(null);
  const [search, setSearch] = useState('');
  const [produktionStatusFilter, setProduktionStatusFilter] = useState('alle');
  const [produktionTerminFilter, setProduktionTerminFilter] = useState('alle');
  const [produktionEndeKwFilter, setProduktionEndeKwFilter] = useState('alle');
  const [produktionEndeTageFilter, setProduktionEndeTageFilter] = useState('alle');
  const [produktionAbrufTerminFilter, setProduktionAbrufTerminFilter] = useState('alle');
  const [produktionMontageTerminFilter, setProduktionMontageTerminFilter] = useState('alle');
  const [abrufFilter, setAbrufFilter] = useState('alle');
  const [shippingOnlyMissingDocs, setShippingOnlyMissingDocs] = useState(false);
  const [calendarSearch, setCalendarSearch] = useState('');
  const [calendarArtFilter, setCalendarArtFilter] = useState('alle');
  const [calendarStatusFilter, setCalendarStatusFilter] = useState('alle');
  const [truckBookings, setTruckBookings] = useState(() => createInitialTruckBookings(startOfIsoWeek(new Date())));
  const [createCalendarModalOpen, setCreateCalendarModalOpen] = useState(false);
  const [newCalendarEntry, setNewCalendarEntry] = useState({
    paId: logisticsData[0]?.paId || '',
    datum: toIsoDate(new Date()),
    start: '08:00',
    ende: '09:00',
    lkw: '',
    art: 'Abruf',
    status: 'transport_bestellt',
  });
  const [bestandSearch, setBestandSearch] = useState('');
  const [bestandStandortFilter, setBestandStandortFilter] = useState('alle');
  const [bestandLagerplatzFilter, setBestandLagerplatzFilter] = useState('alle');
  const [bestandLadungstraegerFilter, setBestandLadungstraegerFilter] = useState('alle');
  const [bestandViewMode, setBestandViewMode] = useState('produkt');
  const [gestellSearch, setGestellSearch] = useState('');
  const [gestellStandortFilter, setGestellStandortFilter] = useState('alle');
  const [gestellNurKritisch, setGestellNurKritisch] = useState(false);
  const [ladungstraegerModal, setLadungstraegerModal] = useState(null);
  const [calendarEntryModal, setCalendarEntryModal] = useState(null);
  const [reminderModal, setReminderModal] = useState(null);
  const [editingBemerkungKey, setEditingBemerkungKey] = useState(null);
  const [editingBemerkungValue, setEditingBemerkungValue] = useState('');
  const [externalSearch, setExternalSearch] = useState('');
  const [externalOrtFilter, setExternalOrtFilter] = useState('alle');
  const [externalStatusFilter, setExternalStatusFilter] = useState('alle');
  const [magazinSearch, setMagazinSearch] = useState('');
  const [magazinNurOffen, setMagazinNurOffen] = useState(false);
  const [magazinFreigaben, setMagazinFreigaben] = useState(magazinFreigabenData);
  const [packlisteModal, setPacklisteModal] = useState(null);
  const [kommentarModal, setKommentarModal] = useState(null);
  const [packlisteChecksByOrder, setPacklisteChecksByOrder] = useState({});
  const [packlisteMissingQtyByOrder, setPacklisteMissingQtyByOrder] = useState({});
  const [open, setOpen] = useState({
    filter: true,
    abruf: true,
    versand: true,
    kalender: true,
    bestand: true,
    magazin: true,
    gestelle: true,
    external: true,
    offenePunkte: true,
  });
  const isProductionView = activeLogistikView === 'Produktionsuebersicht';
  const isCalendarView = activeLogistikView === 'LKW Kalender';
  const isGestelleView = activeLogistikView === 'Uebersicht Transportgestelle';
  const isBestandView = activeLogistikView === 'Physischer Bestand';
  const isExternalView = activeLogistikView === 'Externe Aufträge';
  const isMagazinView = activeLogistikView === 'Magazin';

  const now = new Date();
  const horizonStart = addDays(now, 7);
  const horizonEnd = addDays(now, 20);
  const weekStart = startOfIsoWeek(now);
  const calendarStartHour = 6;
  const calendarEndHour = 18;
  const calendarHourHeight = 46;
  const calendarHeight = (calendarEndHour - calendarStartHour) * calendarHourHeight;
  const weekDays = useMemo(
    () => Array.from({ length: 5 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const firstLkwByPa = useMemo(() => {
    const map = {};
    truckBookings.forEach((booking) => {
      const key = booking.paId;
      const current = map[key];
      const nextIso = `${booking.datum} ${booking.start}`;
      if (!current) {
        map[key] = booking;
        return;
      }
      const currentIso = `${current.datum} ${current.start}`;
      if (parseDate(nextIso) < parseDate(currentIso)) map[key] = booking;
    });
    return map;
  }, [truckBookings]);

  const firstMontageByPa = useMemo(() => {
    const map = {};
    truckBookings.forEach((booking) => {
      if (booking.status !== 'abholung_montage') return;
      const current = map[booking.paId];
      if (!current) {
        map[booking.paId] = booking;
        return;
      }
      const currentIso = `${current.datum} ${current.start}`;
      const nextIso = `${booking.datum} ${booking.start}`;
      if (parseDate(nextIso) < parseDate(currentIso)) map[booking.paId] = booking;
    });
    return map;
  }, [truckBookings]);

  const projectByPa = useMemo(() => {
    return logisticsData.reduce((acc, row) => {
      acc[row.paId] = row.projekt;
      return acc;
    }, {});
  }, []);

  const linieByPa = useMemo(() => {
    return logisticsData.reduce((acc, row) => {
      acc[row.paId] = resolveLinieForLogisticsRow(row);
      return acc;
    }, {});
  }, []);

  const filteredTruckBookings = useMemo(() => {
    return truckBookings.filter((booking) => {
      if (calendarArtFilter !== 'alle' && booking.art !== calendarArtFilter) return false;
      if (calendarStatusFilter !== 'alle' && booking.status !== calendarStatusFilter) return false;
      if (!calendarSearch.trim()) return true;
      const q = calendarSearch.trim().toLowerCase();
      const projekt = (projectByPa[booking.paId] || '').toLowerCase();
      return (
        booking.paId.toLowerCase().includes(q) ||
        booking.lkw.toLowerCase().includes(q) ||
        projekt.includes(q)
      );
    });
  }, [truckBookings, calendarArtFilter, calendarStatusFilter, calendarSearch, projectByPa]);

  const magazinRows = useMemo(() => {
    const q = magazinSearch.trim().toLowerCase();
    return magazinFreigaben
      .filter((row) => {
        if (magazinNurOffen && row.gepackt) return false;
        if (!q) return true;
        return (
          row.paId.toLowerCase().includes(q)
          || row.projekt.toLowerCase().includes(q)
        );
      });
  }, [magazinFreigaben, magazinSearch, magazinNurOffen]);

  const unPackedMagazinRows = useMemo(
    () => magazinRows.filter((row) => !row.gepackt),
    [magazinRows],
  );

  const packedMagazinRows = useMemo(
    () => magazinRows.filter((row) => row.gepackt),
    [magazinRows],
  );

  const fehlteileRows = useMemo(
    () => magazinRows.filter((row) => getFehlteileMeta(row).hasFehlteile),
    [magazinRows, packlisteMissingQtyByOrder],
  );

  const magazinKpis = useMemo(() => {
    const total = magazinRows.length;
    const gepackt = packedMagazinRows.length;
    const offen = total - gepackt;
    const now = new Date();
    const running = unPackedMagazinRows.filter((row) => {
      const start = parseDate(row.schirmerStart);
      if (!start) return false;
      const ende = addDays(start, 0);
      ende.setMinutes(ende.getMinutes() + row.schirmerDauerMin);
      return now >= start && now <= ende;
    }).length;
    return { total, gepackt, offen, running };
  }, [magazinRows, packedMagazinRows, unPackedMagazinRows]);

  const overduePackRows = useMemo(() => {
    return unPackedMagazinRows
      .map((row) => ({ ...row, deadlineMeta: getPackDeadlineMeta(row) }))
      .filter((row) => row.deadlineMeta.status === 'ueberfaellig')
      .sort((a, b) => {
        const aTime = rowToTime(a.deadlineMeta.deadlineDate);
        const bTime = rowToTime(b.deadlineMeta.deadlineDate);
        return aTime - bTime;
      });
  }, [unPackedMagazinRows]);

  function rowToTime(dateValue) {
    if (!dateValue) return Number.MAX_SAFE_INTEGER;
    const d = new Date(dateValue);
    return Number.isNaN(d.getTime()) ? Number.MAX_SAFE_INTEGER : d.getTime();
  }

  const packKpis = useMemo(() => {
    const now = new Date();
    const todayIso = toIsoDate(now);
    const tomorrowIso = toIsoDate(addDays(now, 1));
    let shouldPacked = 0;
    let packedFromShould = 0;
    let dueTodayOpen = 0;
    let dueTomorrowOpen = 0;
    let checklistCompleteOpen = 0;

    magazinRows.forEach((row) => {
      const schirmerStart = parseDate(row.schirmerStart);
      if (!schirmerStart) return;
      const deadline = addDays(schirmerStart, -2);
      deadline.setHours(23, 59, 59, 999);
      const deadlineIso = toIsoDate(deadline);

      if (!row.gepackt && deadlineIso === todayIso) dueTodayOpen += 1;
      if (!row.gepackt && deadlineIso === tomorrowIso) dueTomorrowOpen += 1;

      if (deadlineIso <= todayIso) {
        shouldPacked += 1;
        if (row.gepackt) packedFromShould += 1;
      }

      if (!row.gepackt) {
        const groups = buildPacklisteForPa(row.paId);
        const checks = packlisteChecksByOrder[row.paId] || {};
        const totalParts = groups.reduce((sum, group) => sum + (group.teile?.length || 0), 0);
        const checkedParts = groups.reduce((sum, group) => (
          sum + (group.teile || []).filter((part) => Boolean(checks[part.partId])).length
        ), 0);
        if (totalParts > 0 && checkedParts >= totalParts) checklistCompleteOpen += 1;
      }
    });

    const ratio = shouldPacked === 0 ? 0 : Math.round((packedFromShould / shouldPacked) * 100);
    return {
      shouldPacked,
      packedFromShould,
      missingFromShould: Math.max(0, shouldPacked - packedFromShould),
      dueTodayOpen,
      dueTomorrowOpen,
      checklistCompleteOpen,
      ratio,
    };
  }, [magazinRows, packlisteChecksByOrder]);

  const schirmerRows = useMemo(() => {
    const now = new Date();
    const rows = [...unPackedMagazinRows]
      .map((row) => {
        const start = parseDate(row.schirmerStart);
        const ende = start ? new Date(start.getTime() + (row.schirmerDauerMin * 60000)) : null;
        let schirmerStatus = 'geplant';
        if (start && ende && now >= start && now <= ende) schirmerStatus = 'wird_gepackt';
        else if (ende && now > ende) schirmerStatus = 'ueberfaellig';
        const groups = buildPacklisteForPa(row.paId);
        const checks = packlisteChecksByOrder[row.paId] || {};
        const totalParts = groups.reduce((sum, group) => sum + (group.teile?.length || 0), 0);
        const checkedParts = groups.reduce((sum, group) => (
          sum + (group.teile || []).filter((part) => Boolean(checks[part.partId])).length
        ), 0);
        const schirmerFortschritt = totalParts > 0
          ? Math.round((checkedParts / totalParts) * 100)
          : 0;
        return {
          ...row,
          schirmerStatus,
          schirmerFortschritt,
          schirmerEnde: ende ? toIsoDate(ende) + ' ' + ende.toTimeString().slice(0, 5) : '',
        };
      })
      .sort((a, b) => {
        const aStart = parseDate(a.schirmerStart);
        const bStart = parseDate(b.schirmerStart);
        return (aStart?.getTime() || Number.MAX_SAFE_INTEGER) - (bStart?.getTime() || Number.MAX_SAFE_INTEGER);
      });
    if (!rows.some((row) => row.schirmerStatus === 'wird_gepackt')) {
      const firstOpenIdx = rows.findIndex((row) => !row.gepackt);
      if (firstOpenIdx >= 0) rows[firstOpenIdx] = { ...rows[firstOpenIdx], schirmerStatus: 'wird_gepackt' };
    }
    return rows;
  }, [unPackedMagazinRows, packlisteChecksByOrder]);

  function getPackDeadlineMeta(row) {
    const schirmerStart = parseDate(row.schirmerStart);
    if (!schirmerStart) {
      return {
        deadlineDate: null,
        deadlineLabel: '-',
        status: 'unbekannt',
      };
    }
    const deadlineDate = addDays(schirmerStart, -2);
    const deadlineEnd = new Date(deadlineDate);
    deadlineEnd.setHours(23, 59, 59, 999);
    const now = new Date();

    if (row.gepackt) {
      return {
        deadlineDate,
        deadlineLabel: formatDate(toIsoDate(deadlineDate)),
        status: 'erfuellt',
      };
    }
    if (now > deadlineEnd) {
      return {
        deadlineDate,
        deadlineLabel: formatDate(toIsoDate(deadlineDate)),
        status: 'ueberfaellig',
      };
    }
    const todayIso = toIsoDate(now);
    const deadlineIso = toIsoDate(deadlineDate);
    if (todayIso === deadlineIso) {
      return {
        deadlineDate,
        deadlineLabel: formatDate(deadlineIso),
        status: 'heute',
      };
    }
    return {
      deadlineDate,
      deadlineLabel: formatDate(deadlineIso),
      status: 'ok',
    };
  }

  function getPacklisteStats(paId) {
    const groups = buildPacklisteForPa(paId);
    const checks = packlisteChecksByOrder[paId] || {};
    const total = groups.reduce((sum, group) => sum + (group.teile?.length || 0), 0);
    const checked = groups.reduce((sum, group) => (
      sum + (group.teile || []).filter((part) => Boolean(checks[part.partId])).length
    ), 0);
    return {
      total,
      checked,
      allChecked: total > 0 && checked >= total,
    };
  }

  function getPartMengeNumber(part) {
    const raw = String(part?.menge ?? '').replace(',', '.').trim();
    const parsed = Number.parseFloat(raw);
    if (Number.isNaN(parsed)) return 1;
    return Math.max(0, parsed);
  }

  function getFehlteileCountForPa(paId) {
    const groups = buildPacklisteForPa(paId);
    const missingQtyMap = packlisteMissingQtyByOrder[paId] || {};
    return groups.reduce((sum, group) => (
      sum + (group.teile || []).reduce((inner, part) => {
        const missingQty = Number(missingQtyMap[part.partId] || 0);
        return inner + (Number.isFinite(missingQty) ? Math.max(0, missingQty) : 0);
      }, 0)
    ), 0);
  }

  function getFehlteileHinweisForPa(paId) {
    const groups = buildPacklisteForPa(paId);
    const missingQtyMap = packlisteMissingQtyByOrder[paId] || {};
    const parts = [];
    groups.forEach((group) => {
      (group.teile || []).forEach((part) => {
        const qty = Number(missingQtyMap[part.partId] || 0);
        if (!Number.isFinite(qty) || qty <= 0) return;
        parts.push(`${qty}x ${part.artikel}`);
      });
    });
    if (parts.length === 0) return '';
    return `Fehlende Positionen: ${parts.join(', ')}`;
  }

  function getFehlteileMeta(row) {
    const count = getFehlteileCountForPa(row?.paId);
    const hasFehlteile = count > 0;
    const einkaufInfoDate = row?.fehlteileAnEinkaufAm ? formatDateTime(row.fehlteileAnEinkaufAm) : '';
    return {
      count,
      hasFehlteile,
      label: hasFehlteile ? `${count} fehlend` : 'Keine Fehlteile',
      einkaufInformiert: Boolean(row?.fehlteileAnEinkaufAm),
      einkaufInfoLabel: einkaufInfoDate ? `EK informiert: ${einkaufInfoDate}` : '',
    };
  }

  function getUebergabeKommentare(row) {
    const list = Array.isArray(row?.uebergabeKommentare) ? row.uebergabeKommentare : [];
    return [...list].sort((a, b) => rowToTime(b.erstelltAm) - rowToTime(a.erstelltAm));
  }

  function openKommentareForOrder(row) {
    setKommentarModal({
      orderId: row.id,
      paId: row.paId,
      projekt: row.projekt,
      kommentare: getUebergabeKommentare(row),
    });
  }

  function sendFehlteileToEinkaufForPa(paId, projekt) {
    const count = getFehlteileCountForPa(paId);
    if (count <= 0) {
      window.alert('Bitte in der Packliste mindestens eine Position als "Fehlt" markieren.');
      return;
    }
    const hinweis = getFehlteileHinweisForPa(paId);
    const now = new Date();
    const nowText = `${toIsoDate(now)} ${now.toTimeString().slice(0, 5)}`;
    setMagazinFreigaben((prev) => prev.map((row) => {
      if (row.paId !== paId) return row;
      return {
        ...row,
        fehlteileAnzahl: count,
        fehlteileHinweis: hinweis,
        fehlteileGemeldetAm: nowText,
        fehlteileAnEinkaufAm: nowText,
      };
    }));
    window.alert(
      `Fehlteile an Einkauf kommuniziert: ${productionOrderNo(paId)} | ${projekt} | ${count} Fehlteil${count === 1 ? '' : 'e'}.`,
    );
  }

  function setPacklisteTeilChecked(paId, partId, checked) {
    setPacklisteChecksByOrder((prev) => ({
      ...prev,
      [paId]: {
        ...(prev[paId] || {}),
        [partId]: checked,
      },
    }));
    if (checked) {
      setPacklisteMissingQtyByOrder((prev) => ({
        ...prev,
        [paId]: {
          ...(prev[paId] || {}),
          [partId]: 0,
        },
      }));
    }
  }

  function setPacklisteTeilMissing(paId, partId, missing, maxQty = 1) {
    const nextMissingQty = missing ? Math.max(1, Math.round(maxQty)) : 0;
    setPacklisteMissingQtyByOrder((prev) => ({
      ...prev,
      [paId]: {
        ...(prev[paId] || {}),
        [partId]: nextMissingQty,
      },
    }));
    if (missing) {
      setPacklisteChecksByOrder((prev) => ({
        ...prev,
        [paId]: {
          ...(prev[paId] || {}),
          [partId]: false,
        },
      }));
    }
  }

  function setPacklisteTeilMissingQty(paId, partId, qty, maxQty = 1) {
    const parsed = Number.parseInt(String(qty), 10);
    let nextQty = Number.isNaN(parsed) ? 0 : parsed;
    nextQty = Math.max(0, Math.min(Math.max(1, Math.round(maxQty)), nextQty));
    setPacklisteMissingQtyByOrder((prev) => ({
      ...prev,
      [paId]: {
        ...(prev[paId] || {}),
        [partId]: nextQty,
      },
    }));
    if (nextQty > 0) {
      setPacklisteChecksByOrder((prev) => ({
        ...prev,
        [paId]: {
          ...(prev[paId] || {}),
          [partId]: false,
        },
      }));
    }
  }

  function bestaetigeGepackt(orderId) {
    const rowToPack = magazinFreigaben.find((row) => row.id === orderId);
    if (rowToPack) {
      const fehlteileMeta = getFehlteileMeta(rowToPack);
      if (fehlteileMeta.hasFehlteile) {
        window.alert(`Fehlteile offen: ${fehlteileMeta.label}. Bitte erst auf 0 setzen.`);
        return;
      }
      const stats = getPacklisteStats(rowToPack.paId);
      if (!stats.allChecked) {
        window.alert(`Packliste unvollstaendig: ${stats.checked}/${stats.total} Positionen abgehakt.`);
        return;
      }
    }
    setMagazinFreigaben((prev) => prev.map((row) => {
      if (row.id !== orderId) return row;
      if (row.gepackt) return row;
      const now = new Date();
      return {
        ...row,
        gepackt: true,
        gepacktAm: `${toIsoDate(now)} ${now.toTimeString().slice(0, 5)}`,
      };
    }));
  }

  function openPacklisteForOrder(row) {
    setPacklisteModal({
      paId: row.paId,
      projekt: row.projekt,
      groups: buildPacklisteForPa(row.paId),
    });
  }

  function printPackliste() {
    if (!packlisteModal) return;
    const checks = packlisteChecksByOrder[packlisteModal.paId] || {};
    const stats = getPacklisteStats(packlisteModal.paId);
    const groupsHtml = (packlisteModal.groups || []).map((group) => {
      const rowsHtml = (group.teile || []).map((part) => {
        const isChecked = Boolean(checks[part.partId]);
        return `
          <tr>
            <td>${isChecked ? 'x' : ''}</td>
            <td>${escapeHtml(part.ladungstraeger)}</td>
            <td>${escapeHtml(part.position)}</td>
            <td>${escapeHtml(part.artikel)}</td>
            <td>${escapeHtml(part.menge)}</td>
            <td>${escapeHtml(part.einheit)}</td>
          </tr>
        `;
      }).join('');

      return `
        <section style="margin-top:16px;">
          <h3 style="margin:0 0 8px 0;">Lieferant: ${escapeHtml(group.lieferant)} (Gesamtmenge: ${escapeHtml(group.sumMenge)})</h3>
          <table style="width:100%; border-collapse:collapse; font-size:12px;">
            <thead>
              <tr>
                <th style="border:1px solid #999; padding:6px;">OK</th>
                <th style="border:1px solid #999; padding:6px;">Ladungstraeger</th>
                <th style="border:1px solid #999; padding:6px;">Position</th>
                <th style="border:1px solid #999; padding:6px;">Artikel</th>
                <th style="border:1px solid #999; padding:6px;">Menge</th>
                <th style="border:1px solid #999; padding:6px;">Einheit</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </section>
      `;
    }).join('');

    const html = `
      <!doctype html>
      <html lang="de">
        <head>
          <meta charset="utf-8" />
          <title>Packliste ${escapeHtml(productionOrderNo(packlisteModal.paId))}</title>
        </head>
        <body style="font-family: Segoe UI, Arial, sans-serif; margin: 18px; color: #111827;">
          <h1 style="margin:0 0 10px 0;">Packliste</h1>
          <div style="margin-bottom:6px;"><b>Auftrag:</b> ${escapeHtml(productionOrderNo(packlisteModal.paId))}</div>
          <div style="margin-bottom:6px;"><b>Projekt:</b> ${escapeHtml(packlisteModal.projekt)}</div>
          <div style="margin-bottom:10px;"><b>Checkliste:</b> ${escapeHtml(stats.checked)}/${escapeHtml(stats.total)} ${stats.allChecked ? '(komplett)' : '(unvollstaendig)'}</div>
          ${groupsHtml || '<div>Keine Packlistenpositionen vorhanden.</div>'}
        </body>
      </html>
    `;

    const popup = window.open('', '_blank', 'width=1024,height=768');
    if (!popup) {
      window.alert('Druckfenster konnte nicht geoeffnet werden.');
      return;
    }
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    popup.print();
  }

  function openCreateCalendarModal() {
    setNewCalendarEntry({
      paId: logisticsData[0]?.paId || '',
      datum: toIsoDate(weekDays[0] || new Date()),
      start: '08:00',
      ende: '09:00',
      lkw: '',
      art: 'Abruf',
      status: 'transport_bestellt',
    });
    setCreateCalendarModalOpen(true);
  }

  function saveCalendarEntry() {
    if (!newCalendarEntry.paId || !newCalendarEntry.datum || !newCalendarEntry.start || !newCalendarEntry.ende || !newCalendarEntry.lkw.trim()) {
      window.alert('Bitte Auftrag, Datum, Start, Ende und LKW ausfuellen.');
      return;
    }
    if (parseClockToMinutes(newCalendarEntry.ende) <= parseClockToMinutes(newCalendarEntry.start)) {
      window.alert('Die Endzeit muss nach der Startzeit liegen.');
      return;
    }
    const nextId = `LKW-${Date.now()}`;
    setTruckBookings((prev) => [...prev, { id: nextId, ...newCalendarEntry, lkw: newCalendarEntry.lkw.trim() }]);
    setCreateCalendarModalOpen(false);
  }

  function openReminderModal(row) {
    setReminderModal({
      ...row,
      sendForProject: false,
    });
  }

  function sendReminderMail() {
    if (!reminderModal) return;
    const projectRows = gestellData.filter((row) => row.projekt === reminderModal.projekt);
    const count = reminderModal.sendForProject ? projectRows.length : 1;
    window.alert(
      reminderModal.sendForProject
        ? `Erinnerungs-Mail wurde fuer ${count} Gestelle des Projekts ${reminderModal.projekt} vorgemerkt.`
        : `Erinnerungs-Mail wurde fuer ${reminderModal.ladungstraeger} vorgemerkt.`,
    );
    setReminderModal(null);
  }

  function gestellRowKey(row) {
    return `${row.ladungstraeger}__${row.abruf}`;
  }

  function startBemerkungEdit(row) {
    setEditingBemerkungKey(gestellRowKey(row));
    setEditingBemerkungValue(row.bemerkung || '');
  }

  function cancelBemerkungEdit() {
    setEditingBemerkungKey(null);
    setEditingBemerkungValue('');
  }

  function saveBemerkungEdit() {
    if (!editingBemerkungKey) return;
    const nextValue = editingBemerkungValue.trim();
    setGestellData((prev) => prev.map((row) => (
      gestellRowKey(row) === editingBemerkungKey ? { ...row, bemerkung: nextValue } : row
    )));
    cancelBemerkungEdit();
  }

  function markGestellReturned(rowToUpdate) {
    const rowKey = gestellRowKey(rowToUpdate);
    const rueckgabeHinweis = `Rueckgabe eingebucht am ${formatDate(new Date())}`;
    setGestellData((prev) => prev.map((row) => {
      if (gestellRowKey(row) !== rowKey) return row;
      const nextBemerkung = row.bemerkung
        ? `${row.bemerkung} | ${rueckgabeHinweis}`
        : rueckgabeHinweis;
      return {
        ...row,
        standort: 'Werk',
        nichtMehrVorOrt: true,
        versandInfo: 'zurückgebracht',
        bemerkung: nextBemerkung,
      };
    }));
  }

  const filtered = useMemo(() => {
    const todayStart = startOfDay(new Date());
    const inTageRange = (prognoseFertig) => {
      if (produktionEndeTageFilter === 'alle') return true;
      const prognoseDate = parseDate(prognoseFertig);
      if (!prognoseDate) return false;
      const diff = diffDays(todayStart, startOfDay(prognoseDate));
      if (produktionEndeTageFilter === '0-3') return diff >= 0 && diff <= 3;
      if (produktionEndeTageFilter === '4-7') return diff >= 4 && diff <= 7;
      if (produktionEndeTageFilter === '8-14') return diff >= 8 && diff <= 14;
      if (produktionEndeTageFilter === '15+') return diff >= 15;
      return true;
    };

    return logisticsData
      .filter((row) => {
        const prodDate = parseDate(row.produktionsstart);
        if (!prodDate) return false;
        return prodDate >= horizonStart && prodDate <= horizonEnd;
      })
      .map((row) => {
        const snapshot = productionSnapshotByPa[row.paId] || {
          produktionsStatus: 'nicht gestartet',
          fortschritt: 0,
          reststunden: 0,
          prognoseFertig: row.produktionsstart,
        };
        const merged = { ...row, ...snapshot };
        const prognoseDate = parseDate(snapshot.prognoseFertig);
        const lkw = firstLkwByPa[row.paId] || null;
        const lkwTermin = lkw ? `${lkw.datum} ${lkw.start}` : '';
        const montageBooking = firstMontageByPa[row.paId] || null;
        const montageTermin = montageBooking ? `${montageBooking.datum} ${montageBooking.start}` : '';
        const montageTerminDate = montageTermin ? parseDate(montageTermin) : null;
        const abrufTerminDate = row.abrufTermin ? parseDate(`${row.abrufTermin} 23:59`) : null;
        const verladetagBasis = montageTerminDate || abrufTerminDate;
        const verladetagDate = verladetagBasis ? subtractWorkdays(verladetagBasis, 1) : null;
        const verladeTermin = verladetagDate ? formatDateTimeLocal(verladetagDate) : '';
        const lkwBestellt = !!lkw && lkw.status !== 'offen_transport_noetig';
        const lkwArt = lkw?.art || '-';
        const teileGesamt = snapshot.teileGesamt || Math.max(10, Math.round((Number(snapshot.fortschritt) || 0) / 2) + 20);
        const teileFertig = snapshot.teileFertig || Math.round((teileGesamt * (Number(snapshot.fortschritt) || 0)) / 100);
        const terminlage = lkw ? timingStatusByLkw(snapshot.prognoseFertig, lkwTermin) : timingStatus(merged);
        const abrufGesetzt = Boolean(row.abrufTermin);
        const prognoseKw = getIsoWeekInfo(prognoseDate);
        return {
          ...merged,
          teileGesamt,
          teileFertig,
          terminlage,
          lkwTermin: verladeTermin,
          lkwPlanTermin: lkwTermin,
          montageTermin,
          abrufGesetzt,
          prognoseKwId: prognoseKw?.id || '',
          prognoseKwLabel: prognoseKw?.label || '-',
          lkwBestellt,
          lkwArt,
          ladungstraegerBookings: paLadungstraegerBookings[row.paId] || [],
        };
      })
      .filter((row) => (abrufFilter === 'alle' ? true : row.abrufStatus === abrufFilter))
      .filter((row) => (shippingOnlyMissingDocs ? row.versandpapierStatus !== 'fertig' : true))
      .filter((row) => {
        if (!search.trim()) return true;
        const q = search.trim().toLowerCase();
        return row.paId.toLowerCase().includes(q) || row.projekt.toLowerCase().includes(q);
      })
      .filter((row) => (produktionStatusFilter === 'alle' ? true : row.produktionsStatus === produktionStatusFilter))
      .filter((row) => (produktionTerminFilter === 'alle' ? true : row.terminlage === produktionTerminFilter))
      .filter((row) => (produktionAbrufTerminFilter === 'alle'
        ? true
        : (produktionAbrufTerminFilter === 'mit' ? row.abrufGesetzt : !row.abrufGesetzt)))
      .filter((row) => (produktionMontageTerminFilter === 'alle'
        ? true
        : (produktionMontageTerminFilter === 'mit' ? Boolean(row.montageTermin) : !row.montageTermin)))
      .filter((row) => (produktionEndeKwFilter === 'alle' ? true : row.prognoseKwId === produktionEndeKwFilter))
      .filter((row) => inTageRange(row.prognoseFertig))
      .sort((a, b) => {
        const ad = parseDate(a.prognoseFertig);
        const bd = parseDate(b.prognoseFertig);
        return (ad?.getTime() || Number.MAX_SAFE_INTEGER) - (bd?.getTime() || Number.MAX_SAFE_INTEGER);
      });
  }, [
    search,
    abrufFilter,
    shippingOnlyMissingDocs,
    horizonStart,
    horizonEnd,
    firstLkwByPa,
    firstMontageByPa,
    produktionStatusFilter,
    produktionTerminFilter,
    produktionEndeKwFilter,
    produktionEndeTageFilter,
    produktionAbrufTerminFilter,
    produktionMontageTerminFilter,
  ]);

  const produktionKwOptions = useMemo(() => {
    const values = new Map();
    logisticsData.forEach((row) => {
      const prodDate = parseDate(row.produktionsstart);
      if (!prodDate || prodDate < horizonStart || prodDate > horizonEnd) return;
      const snapshot = productionSnapshotByPa[row.paId];
      const prognose = parseDate(snapshot?.prognoseFertig || row.produktionsstart);
      const info = getIsoWeekInfo(prognose);
      if (!info) return;
      values.set(info.id, info.label);
    });
    return [...values.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([id, label]) => ({ id, label }));
  }, [horizonEnd, horizonStart]);

  const kpis = useMemo(() => {
    const total = filtered.length;
    const offen = filtered.filter((x) => x.abrufStatus === 'offen').length;
    const bereit = filtered.filter((x) => x.abrufStatus === 'bereit').length;
    const termingerecht = filtered.filter((x) => x.terminlage === 'termingerecht').length;
    const risiko = filtered.filter((x) => x.terminlage === 'risiko').length;
    const verspaetet = filtered.filter((x) => x.terminlage === 'verspaetet').length;
    return { total, offen, bereit, termingerecht, risiko, verspaetet };
  }, [filtered]);

  const bookingsByDay = useMemo(() => {
    const map = {};
    weekDays.forEach((day) => { map[toIsoDate(day)] = []; });
    filteredTruckBookings.forEach((booking) => {
      if (map[booking.datum]) map[booking.datum].push(booking);
    });
    return map;
  }, [filteredTruckBookings, weekDays]);

  const gestellRows = useMemo(() => {
    return gestellData
      .map((row) => ({ ...row, ampel: gestellAmpel(row) }))
      .filter((row) => {
        if (!gestellSearch.trim()) return true;
        const q = gestellSearch.trim().toLowerCase();
        return (
          row.ladungstraeger.toLowerCase().includes(q) ||
          row.abruf.toLowerCase().includes(q) ||
          (row.projekt || '').toLowerCase().includes(q) ||
          row.montageleiter.toLowerCase().includes(q)
        );
      })
      .filter((row) => (gestellStandortFilter === 'alle' ? true : row.standort === gestellStandortFilter))
      .filter((row) => (gestellNurKritisch ? row.ampel === 'kritisch' : true))
      .sort((a, b) => {
        const ad = parseDate(a.datumVersand);
        const bd = parseDate(b.datumVersand);
        return (ad?.getTime() || Number.MAX_SAFE_INTEGER) - (bd?.getTime() || Number.MAX_SAFE_INTEGER);
      });
  }, [gestellData, gestellSearch, gestellStandortFilter, gestellNurKritisch]);

  const gestellKpis = useMemo(() => {
    const total = gestellRows.length;
    const baustelle = gestellRows.filter((x) => x.standort === 'Baustelle').length;
    const werk = gestellRows.filter((x) => x.standort === 'Werk').length;
    const ruecktransport = gestellRows.filter((x) => x.standort === 'Ruecktransport geplant').length;
    const kritisch = gestellRows.filter((x) => x.ampel === 'kritisch').length;
    return { total, baustelle, werk, ruecktransport, kritisch };
  }, [gestellRows]);

  const bestandRows = useMemo(() => {
    return fertigteileBestandData
      .filter((row) => {
        if (!bestandSearch.trim()) return true;
        const q = bestandSearch.trim().toLowerCase();
        return (
          row.artikelnummer.toLowerCase().includes(q) ||
          row.produktname.toLowerCase().includes(q) ||
          row.bauteilliste.toLowerCase().includes(q)
        );
      })
      .filter((row) => (bestandStandortFilter === 'alle' ? true : row.standort === bestandStandortFilter))
      .filter((row) => (bestandLagerplatzFilter === 'alle' ? true : row.lagerplatz === bestandLagerplatzFilter))
      .filter((row) => (bestandLadungstraegerFilter === 'alle' ? true : row.ladungstraeger === bestandLadungstraegerFilter))
      .sort((a, b) => a.artikelnummer.localeCompare(b.artikelnummer));
  }, [bestandSearch, bestandStandortFilter, bestandLagerplatzFilter, bestandLadungstraegerFilter]);

  const bestandKpis = useMemo(() => {
    const total = bestandRows.length;
    const distinctPa = new Set(bestandRows.map((x) => x.bauteilliste)).size;
    const distinctCarrier = new Set(bestandRows.map((x) => x.ladungstraeger)).size;
    const distinctPlaetze = new Set(bestandRows.map((x) => x.lagerplatz)).size;
    return { total, distinctPa, distinctCarrier, distinctPlaetze };
  }, [bestandRows]);

  const bestandStandortOptions = useMemo(() => {
    const values = new Set([
      ...fertigteileBestandData.map((x) => x.standort),
      ...gestellData.map((x) => x.standort),
    ]);
    return [...values].filter(Boolean).sort();
  }, [gestellData]);

  const bestandCarrierOptions = useMemo(() => {
    const values = new Set([
      ...fertigteileBestandData.map((x) => x.ladungstraeger),
      ...Object.values(paLadungstraegerBookings).flat().map((x) => x.ladungstraeger),
    ]);
    return [...values].filter(Boolean).sort();
  }, []);

  const bestandLagerplatzOptions = useMemo(() => {
    const values = new Set([
      ...fertigteileBestandData.map((x) => x.lagerplatz),
    ]);
    return [...values].filter(Boolean).sort();
  }, []);

  const bestandCarrierRows = useMemo(() => {
    const projectByPa = logisticsData.reduce((acc, row) => {
      acc[row.paId] = row.projekt;
      return acc;
    }, {});

    const carrierMap = new Map();

    fertigteileBestandData.forEach((row) => {
      const key = row.ladungstraeger;
      if (!carrierMap.has(key)) {
        const gestellInfo = gestellData.find((x) => x.ladungstraeger === key);
        carrierMap.set(key, {
          ladungstraeger: key,
          standort: row.standort || gestellInfo?.standort || '-',
          lagerplaetze: new Set(),
          artikel: [],
          auftraege: new Set(),
          positionen: [],
        });
      }
      const entry = carrierMap.get(key);
      entry.lagerplaetze.add(row.lagerplatz);
      entry.artikel.push({
        artikelnummer: row.artikelnummer,
        produktname: row.produktname,
        menge: row.physisch,
        einheit: row.einheit,
        bauteilliste: row.bauteilliste,
      });
    });

    Object.entries(paLadungstraegerBookings).forEach(([paId, bookings]) => {
      bookings.forEach((booking) => {
        const key = booking.ladungstraeger;
        if (!carrierMap.has(key)) {
          const gestellInfo = gestellData.find((x) => x.ladungstraeger === key);
          carrierMap.set(key, {
            ladungstraeger: key,
            standort: gestellInfo?.standort || '-',
            lagerplaetze: new Set(),
            artikel: [],
            auftraege: new Set(),
            positionen: [],
          });
        }
        const entry = carrierMap.get(key);
        entry.auftraege.add(paId);
        booking.positionen.forEach((pos) => {
          entry.positionen.push({
            paId,
            projekt: projectByPa[paId] || '-',
            position: pos.position,
            artikel: pos.artikel,
            menge: pos.menge,
            einheit: pos.einheit,
          });
        });
      });
    });

    const q = bestandSearch.trim().toLowerCase();
    return [...carrierMap.values()]
      .map((entry) => ({
        ...entry,
        lagerplaetze: [...entry.lagerplaetze].sort(),
        auftraege: [...entry.auftraege].sort(),
      }))
      .filter((entry) => {
        if (bestandStandortFilter !== 'alle' && entry.standort !== bestandStandortFilter) return false;
        if (bestandLagerplatzFilter !== 'alle' && !entry.lagerplaetze.includes(bestandLagerplatzFilter)) return false;
        if (bestandLadungstraegerFilter !== 'alle' && entry.ladungstraeger !== bestandLadungstraegerFilter) return false;
        if (!q) return true;
        const inHeader = entry.ladungstraeger.toLowerCase().includes(q)
          || entry.standort.toLowerCase().includes(q)
          || entry.auftraege.some((paId) => paId.toLowerCase().includes(q));
        if (inHeader) return true;
        const inPos = entry.positionen.some((pos) =>
          pos.artikel.toLowerCase().includes(q) ||
          pos.position.toLowerCase().includes(q) ||
          pos.projekt.toLowerCase().includes(q)
        );
        if (inPos) return true;
        return entry.artikel.some((a) =>
          a.artikelnummer.toLowerCase().includes(q) ||
          a.produktname.toLowerCase().includes(q) ||
          a.bauteilliste.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.ladungstraeger.localeCompare(b.ladungstraeger));
  }, [bestandSearch, bestandStandortFilter, bestandLagerplatzFilter, bestandLadungstraegerFilter, gestellData]);

  const bestandCarrierKpis = useMemo(() => {
    const carriers = bestandCarrierRows.length;
    const auftraege = new Set(bestandCarrierRows.flatMap((x) => x.auftraege)).size;
    const positionen = bestandCarrierRows.reduce((sum, x) => sum + x.positionen.length, 0);
    const standorte = new Set(bestandCarrierRows.map((x) => x.standort)).size;
    return { carriers, auftraege, positionen, standorte };
  }, [bestandCarrierRows]);

  const externalRows = useMemo(() => {
    return externalOrders
      .map((row) => {
        if (row.status === 'erledigt') return row;
        const due = parseDate(row.ruecklieferung);
        if (!due) return row;
        const isOverdue = due < new Date();
        return isOverdue ? { ...row, status: 'ueberfaellig' } : row;
      })
      .filter((row) => {
        if (!externalSearch.trim()) return true;
        const q = externalSearch.trim().toLowerCase();
        return (
          row.gestellnummer.toLowerCase().includes(q) ||
          row.projekt.toLowerCase().includes(q) ||
          row.ort.toLowerCase().includes(q)
        );
      })
      .filter((row) => (externalOrtFilter === 'alle' ? true : row.ort === externalOrtFilter))
      .filter((row) => (externalStatusFilter === 'alle' ? true : row.status === externalStatusFilter))
      .sort((a, b) => {
        const ad = parseDate(a.lieferdatum);
        const bd = parseDate(b.lieferdatum);
        return (ad?.getTime() || Number.MAX_SAFE_INTEGER) - (bd?.getTime() || Number.MAX_SAFE_INTEGER);
      });
  }, [externalOrders, externalSearch, externalOrtFilter, externalStatusFilter]);

  const externalKpis = useMemo(() => {
    const total = externalRows.length;
    const offen = externalRows.filter((x) => x.status === 'offen').length;
    const geplant = externalRows.filter((x) => x.status === 'geplant').length;
    const erledigt = externalRows.filter((x) => x.status === 'erledigt').length;
    const ueberfaellig = externalRows.filter((x) => x.status === 'ueberfaellig').length;
    return { total, offen, geplant, erledigt, ueberfaellig };
  }, [externalRows]);

  function updateExternalOrder(orderId, patch) {
    setExternalOrders((prev) => prev.map((row) => {
      if (row.id !== orderId) return row;
      let next = { ...row, ...patch };
      if (Object.prototype.hasOwnProperty.call(patch, 'ruecklieferung')) {
        next = withTerminverschiebung(next, {
          fieldKey: 'ruecklieferung',
          label: 'Ruecklieferung',
          fromValue: row.ruecklieferung || '',
          toValue: patch.ruecklieferung || '',
          changedBy: 'Logistik',
          bereich: 'Logistik',
        });
      }
      return next;
    }));
  }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#dfe2e6',
        fontFamily: 'Segoe UI, Tahoma, sans-serif',
        color: '#0f172a',
      }}
    >
      {!hideSidebar && (
        <aside
          style={{
            width: 340,
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
                padding: '18px 20px',
                fontSize: 36,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                borderBottom: '1px solid #d3d7dc',
                fontWeight: 700,
              }}
            >
              <span style={{ fontSize: 28 }}>=</span>
              <span style={{ color: '#42b4e5' }}>X</span>
              <span style={{ fontSize: 40 }}>Xecution App</span>
            </div>
            <div style={{ padding: '20px 24px' }}>
              {navSections.map((section) => (
                <SidebarSection
                  key={section.title}
                  title={section.title}
                  items={section.items}
                  open={section.open}
                  activeItem={section.title === 'Logistik' ? activeLogistikView : null}
                  onItemClick={section.title === 'Logistik' ? setActiveLogistikView : undefined}
                />
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #d3d7dc', padding: '18px 24px', color: '#6b7280' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#111827' }}>GOLDBECK</div>
            <div style={{ fontSize: 14, marginTop: 4 }}>Version 1.0</div>
          </div>
        </aside>
      )}

      <main style={{ flex: 1, padding: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              background: '#42b4e5',
              color: '#ffffff',
              borderRadius: 10,
              textAlign: 'center',
              fontSize: 34,
              fontWeight: 700,
              padding: '14px 18px',
            }}
          >
            Logistik - {activeLogistikView}
          </div>
        </div>

        {isProductionView && (
          <>
        <div style={{ marginTop: 2 }}>
          <button
            type="button"
            onClick={() => setOpen((p) => ({ ...p, filter: !p.filter }))}
            style={{
              width: '100%',
              textAlign: 'left',
              border: '1px solid #d3d7dc',
              background: '#e7eaee',
              borderRadius: 8,
              padding: '8px 10px',
              cursor: 'pointer',
              fontWeight: 700,
              color: '#0f3050',
            }}
          >
            {open.filter ? '▼' : '▶'} Filter & Auswahl
          </button>
        </div>
        {open.filter && (
        <section
          style={{
            background: '#f2f4f6',
            borderRadius: 10,
            border: '1px solid #d3d7dc',
            padding: 18,
            marginTop: 8,
            marginBottom: 14,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
            <label style={{ display: 'block' }}>
              <div style={{ marginBottom: 6, fontSize: 13, color: '#4b5563' }}>Suche PA / Projekt</div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="z. B. PA-2026-3001 oder MX4100A"
                style={{ width: '100%', border: '1px solid #c7cdd4', borderRadius: 6, padding: '10px 12px', fontSize: 14 }}
              />
            </label>

            <label style={{ display: 'block' }}>
              <div style={{ marginBottom: 6, fontSize: 13, color: '#4b5563' }}>Produktionsstatus</div>
              <select
                value={produktionStatusFilter}
                onChange={(e) => setProduktionStatusFilter(e.target.value)}
                style={{ width: '100%', border: '1px solid #c7cdd4', borderRadius: 6, padding: '10px 12px', fontSize: 14, background: '#ffffff' }}
              >
                <option value="alle">Alle</option>
                <option value="Gesperrt">Gesperrt</option>
                <option value="Pausiert">Pausiert</option>
                <option value="In Produktion">In Produktion</option>
                <option value="Qualitaetspruefung">Qualitaetspruefung</option>
                <option value="nicht gestartet">nicht gestartet</option>
              </select>
            </label>

            <label style={{ display: 'block' }}>
              <div style={{ marginBottom: 6, fontSize: 13, color: '#4b5563' }}>Terminlage (LKW)</div>
              <select
                value={produktionTerminFilter}
                onChange={(e) => setProduktionTerminFilter(e.target.value)}
                style={{ width: '100%', border: '1px solid #c7cdd4', borderRadius: 6, padding: '10px 12px', fontSize: 14, background: '#ffffff' }}
              >
                <option value="alle">Alle</option>
                <option value="termingerecht">termingerecht</option>
                <option value="risiko">risiko</option>
                <option value="verspaetet">verspaetet</option>
              </select>
            </label>

            <label style={{ display: 'block' }}>
              <div style={{ marginBottom: 6, fontSize: 13, color: '#4b5563' }}>Prod.-Ende KW</div>
              <select
                value={produktionEndeKwFilter}
                onChange={(e) => setProduktionEndeKwFilter(e.target.value)}
                style={{ width: '100%', border: '1px solid #c7cdd4', borderRadius: 6, padding: '10px 12px', fontSize: 14, background: '#ffffff' }}
              >
                <option value="alle">Alle</option>
                {produktionKwOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </label>

            <label style={{ display: 'block' }}>
              <div style={{ marginBottom: 6, fontSize: 13, color: '#4b5563' }}>Prod.-Ende in Tagen</div>
              <select
                value={produktionEndeTageFilter}
                onChange={(e) => setProduktionEndeTageFilter(e.target.value)}
                style={{ width: '100%', border: '1px solid #c7cdd4', borderRadius: 6, padding: '10px 12px', fontSize: 14, background: '#ffffff' }}
              >
                <option value="alle">Alle</option>
                <option value="0-3">0-3 Tage</option>
                <option value="4-7">4-7 Tage</option>
                <option value="8-14">8-14 Tage</option>
                <option value="15+">15+ Tage</option>
              </select>
            </label>

            <label style={{ display: 'block' }}>
              <div style={{ marginBottom: 6, fontSize: 13, color: '#4b5563' }}>Abruftermin</div>
              <select
                value={produktionAbrufTerminFilter}
                onChange={(e) => setProduktionAbrufTerminFilter(e.target.value)}
                style={{ width: '100%', border: '1px solid #c7cdd4', borderRadius: 6, padding: '10px 12px', fontSize: 14, background: '#ffffff' }}
              >
                <option value="alle">Alle</option>
                <option value="mit">Mit Abruf</option>
                <option value="ohne">Ohne Abruf</option>
              </select>
            </label>

            <label style={{ display: 'block' }}>
              <div style={{ marginBottom: 6, fontSize: 13, color: '#4b5563' }}>Montagetermin</div>
              <select
                value={produktionMontageTerminFilter}
                onChange={(e) => setProduktionMontageTerminFilter(e.target.value)}
                style={{ width: '100%', border: '1px solid #c7cdd4', borderRadius: 6, padding: '10px 12px', fontSize: 14, background: '#ffffff' }}
              >
                <option value="alle">Alle</option>
                <option value="mit">Mit Montagetermin</option>
                <option value="ohne">Ohne Montagetermin</option>
              </select>
            </label>

            <label style={{ display: 'block' }}>
              <div style={{ marginBottom: 6, fontSize: 13, color: '#4b5563' }}>Abrufstatus</div>
              <select
                value={abrufFilter}
                onChange={(e) => setAbrufFilter(e.target.value)}
                style={{ width: '100%', border: '1px solid #c7cdd4', borderRadius: 6, padding: '10px 12px', fontSize: 14, background: '#ffffff' }}
              >
                <option value="alle">Alle</option>
                <option value="offen">offen</option>
                <option value="bereit">bereit</option>
              </select>
            </label>

            <label style={{ display: 'block' }}>
              <div style={{ marginBottom: 6, fontSize: 13, color: '#4b5563' }}>Versandpapiere</div>
              <select
                value={shippingOnlyMissingDocs ? 'nur-offen' : 'alle'}
                onChange={(e) => setShippingOnlyMissingDocs(e.target.value === 'nur-offen')}
                style={{ width: '100%', border: '1px solid #c7cdd4', borderRadius: 6, padding: '10px 12px', fontSize: 14, background: '#ffffff' }}
              >
                <option value="alle">Alle</option>
                <option value="nur-offen">Nur offen / in Arbeit</option>
              </select>
            </label>

            <button
              type="button"
              onClick={() => {
                setSearch('');
                setProduktionStatusFilter('alle');
                setProduktionTerminFilter('alle');
                setProduktionEndeKwFilter('alle');
                setProduktionEndeTageFilter('alle');
                setProduktionAbrufTerminFilter('alle');
                setProduktionMontageTerminFilter('alle');
                setAbrufFilter('alle');
                setShippingOnlyMissingDocs(false);
              }}
              style={{ border: '1px solid #42b4e5', background: '#ffffff', color: '#2088b5', borderRadius: 6, padding: '10px 14px', fontSize: 14, cursor: 'pointer' }}
            >
              Filter zurücksetzen
            </button>
          </div>
        </section>
        )}

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(120px, 1fr))', gap: 10, marginBottom: 14 }}>
          <div style={{ background: '#f2f4f6', border: '1px solid #d3d7dc', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ fontSize: 11, color: '#6b7280' }}>PA im Horizont</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{kpis.total}</div>
          </div>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ fontSize: 11, color: '#7f1d1d' }}>Abrufe offen</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#991b1b' }}>{kpis.offen}</div>
          </div>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ fontSize: 11, color: '#1e3a8a' }}>Abrufe bereit</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1d4ed8' }}>{kpis.bereit}</div>
          </div>
          <div style={{ background: '#ecfdf5', border: '1px solid #86efac', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ fontSize: 11, color: '#166534' }}>Termingerecht</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#15803d' }}>{kpis.termingerecht}</div>
          </div>
          <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ fontSize: 11, color: '#854d0e' }}>Terminrisiko</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#a16207' }}>{kpis.risiko}</div>
          </div>
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ fontSize: 11, color: '#7f1d1d' }}>Verspaetet</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#b91c1c' }}>{kpis.verspaetet}</div>
          </div>
        </section>

        <div style={{ marginTop: 2 }}>
          <button
            type="button"
            onClick={() => setOpen((p) => ({ ...p, abruf: !p.abruf }))}
            style={{
              width: '100%',
              textAlign: 'left',
              border: '1px solid #d3d7dc',
              background: '#e7eaee',
              borderRadius: 8,
              padding: '8px 10px',
              cursor: 'pointer',
              fontWeight: 700,
              color: '#0f3050',
            }}
          >
            {open.abruf ? '▼' : '▶'} Uebersicht geplante PA's zu Abrufen
          </button>
        </div>
        {open.abruf && (
        <section style={{ background: '#f2f4f6', borderRadius: 10, border: '1px solid #d3d7dc', marginTop: 8, marginBottom: 14, overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px', fontSize: 15, fontWeight: 700, background: '#e7eaee', borderBottom: '1px solid #d3d7dc' }}>
            Uebersicht geplante PA's zu Abrufen (Horizont: {formatDate(horizonStart)} - {formatDate(horizonEnd)})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr 1.1fr 1.1fr 1fr 1fr 1fr 1fr 0.9fr 0.9fr 1fr 1fr 1fr', background: '#eef1f4', fontSize: 12, fontWeight: 700, color: '#4b5563' }}>
            <div style={{ padding: '8px 10px' }}>Produktionsauftragsnummer</div>
            <div style={{ padding: '8px 10px' }}>Projekt</div>
            <div style={{ padding: '8px 10px' }}>Produkte</div>
            <div style={{ padding: '8px 10px' }}>Abruftermin</div>
            <div style={{ padding: '8px 10px' }}>Montagetermin</div>
            <div style={{ padding: '8px 10px' }}>Voraussichtliches Produktionsende</div>
            <div style={{ padding: '8px 10px' }}>Verladetag (-1 WT)</div>
            <div style={{ padding: '8px 10px' }}>LKW bestellt / Art</div>
            <div style={{ padding: '8px 10px' }}>Lagerplatz</div>
            <div style={{ padding: '8px 10px' }}>Ladungstraeger</div>
            <div style={{ padding: '8px 10px' }}>Produktion</div>
            <div style={{ padding: '8px 10px' }}>Fortschritt (%)</div>
            <div style={{ padding: '8px 10px' }}>Fortschritt (Teile)</div>
            <div style={{ padding: '8px 10px' }}>Terminlage</div>
          </div>
          {filtered.map((row) => (
            <div key={row.paId} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr 1.1fr 1.1fr 1fr 1fr 1fr 1fr 0.9fr 0.9fr 1fr 1fr 1fr', background: '#ffffff', borderTop: '1px solid #e2e7ec', fontSize: 13, alignItems: 'center' }}>
              <div style={{ padding: '9px 10px', fontWeight: 700 }}>{productionOrderNo(row.paId)}</div>
              <div style={{ padding: '9px 10px' }}>{row.projekt}</div>
              <div style={{ padding: '9px 10px' }}>{row.produktmix}</div>
              <div style={{ padding: '9px 10px' }}>
                {row.abrufGesetzt ? formatDate(row.abrufTermin) : <span style={{ color: '#991b1b', fontWeight: 700 }}>Kein Abruf gesetzt</span>}
                <TerminverschiebungIndicator
                  record={row}
                  fieldKey="abrufTermin"
                  onOpen={() => setTerminModal({
                    record: row,
                    fieldKey: 'abrufTermin',
                    title: `Historie Abruftermin - ${row.paId}`,
                  })}
                />
              </div>
              <div style={{ padding: '9px 10px' }}>
                {row.montageTermin ? formatDateTime(row.montageTermin) : <span style={{ color: '#64748b' }}>-</span>}
              </div>
              <div style={{ padding: '9px 10px' }}>
                {formatDateTime(row.prognoseFertig)}
                <TerminverschiebungIndicator
                  record={row}
                  fieldKey="prognoseFertig"
                  onOpen={() => setTerminModal({
                    record: row,
                    fieldKey: 'prognoseFertig',
                    title: `Historie Produktionsende - ${row.paId}`,
                  })}
                />
              </div>
              <div style={{ padding: '9px 10px' }}>
                {row.lkwTermin ? formatDateTime(row.lkwTermin) : '-'}
                <TerminverschiebungIndicator
                  record={row}
                  fieldKey="lkwTermin"
                  onOpen={() => setTerminModal({
                    record: row,
                    fieldKey: 'lkwTermin',
                    title: `Historie Verladetermin - ${row.paId}`,
                  })}
                />
              </div>
              <div style={{ padding: '9px 10px' }}>
                <span style={{
                  display: 'inline-block',
                  borderRadius: 12,
                  padding: '2px 8px',
                  fontSize: 12,
                  fontWeight: 700,
                  background: row.lkwBestellt ? '#dcfce7' : '#fee2e2',
                  border: row.lkwBestellt ? '1px solid #86efac' : '1px solid #fca5a5',
                  color: row.lkwBestellt ? '#166534' : '#991b1b',
                }}>
                  {row.lkwBestellt ? `Ja (${row.lkwArt})` : `Nein (${row.lkwArt})`}
                </span>
              </div>
              <div style={{ padding: '9px 10px' }}>{row.lagerplatz}</div>
              <div style={{ padding: '9px 10px' }}>
                {row.ladungstraegerBookings.length > 0 ? (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {row.ladungstraegerBookings.map((booking) => (
                      <button
                        key={`${row.paId}-${booking.ladungstraeger}`}
                        type="button"
                        onClick={() => setLadungstraegerModal({ paId: row.paId, projekt: row.projekt, booking })}
                        style={{
                          border: '1px solid #93c5fd',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          borderRadius: 999,
                          padding: '2px 8px',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {booking.ladungstraeger}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: '#94a3b8' }}>-</span>
                )}
              </div>
              <div style={{ padding: '9px 10px' }}>
                <span style={{ display: 'inline-block', borderRadius: 12, padding: '2px 8px', fontSize: 12, fontWeight: 700, ...productionBadge(row.produktionsStatus) }}>
                  {productionStatusLabel(row.produktionsStatus)}
                </span>
              </div>
              <div style={{ padding: '9px 10px', fontWeight: 700 }}>{row.fortschritt}%</div>
              <div style={{ padding: '9px 10px', fontWeight: 700 }}>{row.teileFertig} / {row.teileGesamt}</div>
              <div style={{ padding: '9px 10px' }}>
                <span style={{ display: 'inline-block', borderRadius: 12, padding: '2px 8px', fontSize: 12, fontWeight: 700, ...timingBadge(row.terminlage) }}>
                  {row.terminlage}
                </span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ padding: 12, color: '#6b7280' }}>Keine PA im gewaehlten Horizont / Filter.</div>}
        </section>
        )}

        <div style={{ marginTop: 2 }}>
          <button
            type="button"
            onClick={() => setOpen((p) => ({ ...p, versand: !p.versand }))}
            style={{
              width: '100%',
              textAlign: 'left',
              border: '1px solid #d3d7dc',
              background: '#e7eaee',
              borderRadius: 8,
              padding: '8px 10px',
              cursor: 'pointer',
              fontWeight: 700,
              color: '#0f3050',
            }}
          >
            {open.versand ? '▼' : '▶'} Versand + Versandpapiere
          </button>
        </div>
        {open.versand && (
        <section style={{ background: '#f2f4f6', borderRadius: 10, border: '1px solid #d3d7dc', marginTop: 8, marginBottom: 14, overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px', fontSize: 15, fontWeight: 700, background: '#e7eaee', borderBottom: '1px solid #d3d7dc' }}>
            Versand + Versandpapiere
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr 1fr 1fr 1fr', background: '#eef1f4', fontSize: 12, fontWeight: 700, color: '#4b5563' }}>
            <div style={{ padding: '8px 10px' }}>PA</div>
            <div style={{ padding: '8px 10px' }}>Projekt</div>
            <div style={{ padding: '8px 10px' }}>Versandart</div>
            <div style={{ padding: '8px 10px' }}>Versandpapierstatus</div>
            <div style={{ padding: '8px 10px' }}>Terminlage Teile</div>
            <div style={{ padding: '8px 10px' }}>Nächste Aktion</div>
          </div>
          {filtered.map((row) => {
            const nextAction = row.terminlage === 'verspaetet'
              ? 'Eskalation an Produktion'
              : row.versandpapierStatus === 'fertig'
                ? 'Versand disponieren'
                : 'Versandpapiere erstellen';
            return (
              <div key={`${row.paId}-shipping`} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr 1fr 1fr 1fr', background: '#ffffff', borderTop: '1px solid #e2e7ec', fontSize: 13, alignItems: 'center' }}>
                <div style={{ padding: '9px 10px', fontWeight: 700 }}>{row.paId}</div>
                <div style={{ padding: '9px 10px' }}>{row.projekt}</div>
                <div style={{ padding: '9px 10px' }}>{row.versandart}</div>
                <div style={{ padding: '9px 10px' }}>
                  <span style={{ display: 'inline-block', borderRadius: 12, padding: '2px 8px', fontSize: 12, fontWeight: 700, ...statusBadge(row.versandpapierStatus) }}>
                    {row.versandpapierStatus}
                  </span>
                </div>
                <div style={{ padding: '9px 10px' }}>
                  <span style={{ display: 'inline-block', borderRadius: 12, padding: '2px 8px', fontSize: 12, fontWeight: 700, ...timingBadge(row.terminlage) }}>
                    {row.terminlage}
                  </span>
                </div>
                <div style={{ padding: '9px 10px' }}>{nextAction}</div>
              </div>
            );
          })}
        </section>
        )}
          </>
        )}

        {isCalendarView && (
          <>
        <div style={{ marginTop: 2 }}>
          <button
            type="button"
            onClick={() => setOpen((p) => ({ ...p, kalender: !p.kalender }))}
            style={{
              width: '100%',
              textAlign: 'left',
              border: '1px solid #d3d7dc',
              background: '#e7eaee',
              borderRadius: 8,
              padding: '8px 10px',
              cursor: 'pointer',
              fontWeight: 700,
              color: '#0f3050',
            }}
          >
            {open.kalender ? '▼' : '▶'} LKW-Kalender (Arbeitswoche)
          </button>
        </div>
        {open.kalender && (
        <section style={{ background: '#f2f4f6', borderRadius: 10, border: '1px solid #d3d7dc', marginTop: 8, marginBottom: 14, overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px', fontSize: 15, fontWeight: 700, background: '#e7eaee', borderBottom: '1px solid #d3d7dc' }}>
            Bestellte LKW nach Tag/Uhrzeit (PA-Bezug)
          </div>
          <div style={{ padding: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr auto auto', gap: 10, alignItems: 'end', marginBottom: 10 }}>
              <label>
                <div style={{ marginBottom: 5, fontSize: 12, color: '#4b5563' }}>Suche PA / LKW</div>
                <input
                  type="text"
                  value={calendarSearch}
                  onChange={(e) => setCalendarSearch(e.target.value)}
                  placeholder="z. B. PA-2026-3002 oder DHL-332"
                  style={{ width: '100%', border: '1px solid #c7cdd4', borderRadius: 6, padding: '8px 10px', fontSize: 13 }}
                />
              </label>
              <label>
                <div style={{ marginBottom: 5, fontSize: 12, color: '#4b5563' }}>LKW-Art</div>
                <select
                  value={calendarArtFilter}
                  onChange={(e) => setCalendarArtFilter(e.target.value)}
                  style={{ width: '100%', border: '1px solid #c7cdd4', borderRadius: 6, padding: '8px 10px', fontSize: 13, background: '#fff' }}
                >
                  <option value="alle">Alle</option>
                  <option value="Abruf">Abruf</option>
                  <option value="Versand">Versand</option>
                </select>
              </label>
              <label>
                <div style={{ marginBottom: 5, fontSize: 12, color: '#4b5563' }}>Status</div>
                <select
                  value={calendarStatusFilter}
                  onChange={(e) => setCalendarStatusFilter(e.target.value)}
                  style={{ width: '100%', border: '1px solid #c7cdd4', borderRadius: 6, padding: '8px 10px', fontSize: 13, background: '#fff' }}
                >
                  <option value="alle">Alle</option>
                  {Object.entries(calendarStatusMeta).map(([key, meta]) => (
                    <option key={key} value={key}>{meta.label}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => {
                  setCalendarSearch('');
                  setCalendarArtFilter('alle');
                  setCalendarStatusFilter('alle');
                }}
                style={{ border: '1px solid #42b4e5', background: '#ffffff', color: '#2088b5', borderRadius: 6, padding: '8px 12px', fontSize: 13, cursor: 'pointer' }}
              >
                Filter zurücksetzen
              </button>
              <button
                type="button"
                onClick={openCreateCalendarModal}
                style={{ border: '1px solid #93c5fd', background: '#eff6ff', color: '#1d4ed8', borderRadius: 6, padding: '8px 12px', fontSize: 13, cursor: 'pointer', fontWeight: 700 }}
              >
                Neuer Eintrag
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(260px, 1fr))', gap: 8, marginBottom: 8 }}>
              {Object.entries(calendarStatusMeta).map(([key, meta]) => (
                <div key={key} style={{ border: `1px solid ${meta.border}`, background: meta.bg, color: meta.text, borderRadius: 8, padding: '5px 8px', fontSize: 12, fontWeight: 700 }}>
                  {meta.label}
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '72px repeat(5, minmax(180px, 1fr))', gap: 8 }}>
              <div />
              {weekDays.map((day) => (
                <div key={`head-${toIsoDate(day)}`} style={{ fontSize: 12, fontWeight: 700, color: '#334155', textAlign: 'center' }}>
                  {day.toLocaleDateString('de-DE', { weekday: 'short' })} {formatDate(toIsoDate(day))}
                </div>
              ))}
              <div style={{ position: 'relative', height: calendarHeight }}>
                {Array.from({ length: calendarEndHour - calendarStartHour + 1 }, (_, i) => calendarStartHour + i).map((hour) => (
                  <div key={`t-${hour}`} style={{ position: 'absolute', top: (hour - calendarStartHour) * calendarHourHeight - 7, left: 0, fontSize: 11, color: '#64748b' }}>
                    {String(hour).padStart(2, '0')}:00
                  </div>
                ))}
              </div>
              {weekDays.map((day) => {
                const dayIso = toIsoDate(day);
                const dayBookings = bookingsByDay[dayIso] || [];
                return (
                  <div key={`col-${dayIso}`} style={{ position: 'relative', height: calendarHeight, background: '#ffffff', border: '1px solid #dbe3ec', borderRadius: 6, overflow: 'hidden' }}>
                    {Array.from({ length: calendarEndHour - calendarStartHour }, (_, i) => (
                      <div key={`${dayIso}-line-${i}`} style={{ position: 'absolute', left: 0, right: 0, top: i * calendarHourHeight, borderTop: '1px solid #eef2f7' }} />
                    ))}
                    {dayBookings.map((booking) => {
                      const statusMeta = calendarStatusMeta[booking.status] || calendarStatusMeta.transport_bestellt;
                      const projectLabel = projectByPa[booking.paId] || booking.paId;
                      const startMin = parseClockToMinutes(booking.start);
                      const endMin = parseClockToMinutes(booking.ende);
                      const top = ((startMin - (calendarStartHour * 60)) / 60) * calendarHourHeight;
                      const height = Math.max(24, ((endMin - startMin) / 60) * calendarHourHeight);
                      return (
                        <div
                          key={booking.id}
                          title={`${projectLabel} | ${booking.lkw} | ${booking.start}-${booking.ende}`}
                          onClick={() => {
                            const paInfo = logisticsData.find((x) => x.paId === booking.paId) || null;
                            const snapshot = productionSnapshotByPa[booking.paId] || null;
                            const gestelle = paLadungstraegerBookings[booking.paId] || [];
                            setCalendarEntryModal({ booking, paInfo, snapshot, gestelle });
                          }}
                          style={{
                            position: 'absolute',
                            left: 4,
                            right: 4,
                            top,
                            height,
                            background: statusMeta.bg,
                            border: `1px solid ${statusMeta.border}`,
                            borderRadius: 6,
                            padding: '3px 5px',
                            fontSize: 11,
                            color: statusMeta.text,
                            overflow: 'hidden',
                            lineHeight: 1.2,
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ fontWeight: 700 }}>{booking.start}-{booking.ende} | {booking.lkw}</div>
                          <div>{projectLabel}</div>
                          <div style={{ fontSize: 10 }}>{statusMeta.label}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        )}
          </>
        )}

        {isBestandView && (
          <>
        <div style={{ marginTop: 2 }}>
          <button
            type="button"
            onClick={() => setOpen((p) => ({ ...p, bestand: !p.bestand }))}
            style={{
              width: '100%',
              textAlign: 'left',
              border: '1px solid #d3d7dc',
              background: '#e7eaee',
              borderRadius: 8,
              padding: '8px 10px',
              cursor: 'pointer',
              fontWeight: 700,
              color: '#0f3050',
            }}
          >
            {open.bestand ? '▼' : '▶'} Fertiggemeldete Teile auf Versandplaetzen
          </button>
        </div>
        {open.bestand && (
        <section style={{ background: '#f2f4f6', borderRadius: 10, border: '1px solid #d3d7dc', marginTop: 8, marginBottom: 14, overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px', fontSize: 15, fontWeight: 700, background: '#e7eaee', borderBottom: '1px solid #d3d7dc' }}>
            Physischer Bestand (nur versandbereit)
          </div>

          <div style={{ padding: 12, borderBottom: '1px solid #dbe3ec', display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setBestandViewMode('produkt')}
              style={bestandViewMode === 'produkt'
                ? { border: '1px solid #93c5fd', background: '#dbeafe', color: '#1d4ed8', borderRadius: 999, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }
                : { border: '1px solid #cbd5e1', background: '#fff', color: '#334155', borderRadius: 999, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              Produkt-BTL-Basis
            </button>
            <button
              type="button"
              onClick={() => setBestandViewMode('ladungstraeger')}
              style={bestandViewMode === 'ladungstraeger'
                ? { border: '1px solid #93c5fd', background: '#dbeafe', color: '#1d4ed8', borderRadius: 999, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }
                : { border: '1px solid #cbd5e1', background: '#fff', color: '#334155', borderRadius: 999, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              Ladungstraegerbasis
            </button>
          </div>

          <div style={{ padding: 12, borderBottom: '1px solid #dbe3ec' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
              <label>
                <div style={{ marginBottom: 5, fontSize: 12, color: '#4b5563' }}>
                  {bestandViewMode === 'produkt'
                    ? 'Suche Artikel / Produkt / Bauteilliste'
                    : 'Suche Ladungstraeger / Auftrag / Position / Artikel'}
                </div>
                <input
                  type="text"
                  value={bestandSearch}
                  onChange={(e) => setBestandSearch(e.target.value)}
                  placeholder={bestandViewMode === 'produkt' ? 'z. B. bi2277b-57011' : 'z. B. L-38, PA-2026-3001, P-01'}
                  style={{ width: '100%', border: '1px solid #c7cdd4', borderRadius: 6, padding: '8px 10px', fontSize: 13 }}
                />
              </label>
              <label>
                <div style={{ marginBottom: 5, fontSize: 12, color: '#4b5563' }}>Standort</div>
                <select
                  value={bestandStandortFilter}
                  onChange={(e) => setBestandStandortFilter(e.target.value)}
                  style={{ width: '100%', border: '1px solid #c7cdd4', borderRadius: 6, padding: '8px 10px', fontSize: 13, background: '#fff' }}
                >
                  <option value="alle">Alle</option>
                  {bestandStandortOptions.map((ort) => (
                    <option key={ort} value={ort}>{ort}</option>
                  ))}
                </select>
              </label>
              <label>
                <div style={{ marginBottom: 5, fontSize: 12, color: '#4b5563' }}>Lagerplatz</div>
                <select
                  value={bestandLagerplatzFilter}
                  onChange={(e) => setBestandLagerplatzFilter(e.target.value)}
                  style={{ width: '100%', border: '1px solid #c7cdd4', borderRadius: 6, padding: '8px 10px', fontSize: 13, background: '#fff' }}
                >
                  <option value="alle">Alle</option>
                  {bestandLagerplatzOptions.map((platz) => (
                    <option key={platz} value={platz}>{platz}</option>
                  ))}
                </select>
              </label>
              <label>
                <div style={{ marginBottom: 5, fontSize: 12, color: '#4b5563' }}>Ladungstraeger</div>
                <select
                  value={bestandLadungstraegerFilter}
                  onChange={(e) => setBestandLadungstraegerFilter(e.target.value)}
                  style={{ width: '100%', border: '1px solid #c7cdd4', borderRadius: 6, padding: '8px 10px', fontSize: 13, background: '#fff' }}
                >
                  <option value="alle">Alle</option>
                  {bestandCarrierOptions.map((id) => (
                    <option key={id} value={id}>{id}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => {
                  setBestandSearch('');
                  setBestandStandortFilter('alle');
                  setBestandLagerplatzFilter('alle');
                  setBestandLadungstraegerFilter('alle');
                }}
                style={{ border: '1px solid #42b4e5', background: '#ffffff', color: '#2088b5', borderRadius: 6, padding: '8px 12px', fontSize: 13, cursor: 'pointer' }}
              >
                Filter zurücksetzen
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(140px, 1fr))', gap: 10, padding: 12, borderBottom: '1px solid #dbe3ec' }}>
            <div style={{ background: '#ffffff', border: '1px solid #d3d7dc', borderRadius: 8, padding: '7px 9px' }}>
              <div style={{ fontSize: 11, color: '#6b7280' }}>{bestandViewMode === 'produkt' ? 'Artikel gesamt' : 'Ladungstraeger gesamt'}</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{bestandViewMode === 'produkt' ? bestandKpis.total : bestandCarrierKpis.carriers}</div>
            </div>
            <div style={{ background: '#ecfdf5', border: '1px solid #86efac', borderRadius: 8, padding: '7px 9px' }}>
              <div style={{ fontSize: 11, color: '#166534' }}>{bestandViewMode === 'produkt' ? 'Bauteillisten' : 'Aufträge'}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#15803d' }}>{bestandViewMode === 'produkt' ? bestandKpis.distinctPa : bestandCarrierKpis.auftraege}</div>
            </div>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '7px 9px' }}>
              <div style={{ fontSize: 11, color: '#1e3a8a' }}>{bestandViewMode === 'produkt' ? 'Ladungstraeger' : 'Positionen auf Gestellen'}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1d4ed8' }}>{bestandViewMode === 'produkt' ? bestandKpis.distinctCarrier : bestandCarrierKpis.positionen}</div>
            </div>
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '7px 9px' }}>
              <div style={{ fontSize: 11, color: '#075985' }}>{bestandViewMode === 'produkt' ? 'Versandplaetze' : 'Standorte'}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0369a1' }}>{bestandViewMode === 'produkt' ? bestandKpis.distinctPlaetze : bestandCarrierKpis.standorte}</div>
            </div>
          </div>

          {bestandViewMode === 'produkt' ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr 0.6fr 0.8fr 1fr 1fr 1fr 0.7fr 0.7fr', background: '#eef1f4', fontSize: 12, fontWeight: 700, color: '#4b5563' }}>
                <div style={{ padding: '8px 10px' }}>Artikelnummer</div>
                <div style={{ padding: '8px 10px' }}>Produktname</div>
                <div style={{ padding: '8px 10px' }}>Standort</div>
                <div style={{ padding: '8px 10px' }}>Lagerort</div>
                <div style={{ padding: '8px 10px' }}>Geplantes Lieferdatum</div>
                <div style={{ padding: '8px 10px' }}>Bauteilliste</div>
                <div style={{ padding: '8px 10px' }}>Ladungstraeger</div>
                <div style={{ padding: '8px 10px' }}>Physisch</div>
                <div style={{ padding: '8px 10px' }}>Meldestatus</div>
              </div>
              {bestandRows.map((row) => (
                <div key={`${row.artikelnummer}-${row.lagerplatz}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr 0.6fr 0.8fr 1fr 1fr 1fr 0.7fr 0.7fr', background: '#ffffff', borderTop: '1px solid #e2e7ec', fontSize: 13, alignItems: 'center' }}>
                  <div style={{ padding: '8px 10px', fontWeight: 700 }}>{row.artikelnummer}</div>
                  <div style={{ padding: '8px 10px' }}>{row.produktname}</div>
                  <div style={{ padding: '8px 10px' }}>{row.standort}</div>
                  <div style={{ padding: '8px 10px' }}>{row.lagerort}</div>
                  <div style={{ padding: '8px 10px' }}>{row.geplantesLieferdatum ? formatDate(row.geplantesLieferdatum) : '-'}</div>
                  <div style={{ padding: '8px 10px' }}>{row.bauteilliste}</div>
                  <div style={{ padding: '8px 10px' }}>{row.ladungstraeger}</div>
                  <div style={{ padding: '8px 10px', fontWeight: 700 }}>{row.physisch},00 {row.einheit}</div>
                  <div style={{ padding: '8px 10px' }}>
                    <span style={{ display: 'inline-block', borderRadius: 12, padding: '2px 8px', fontSize: 12, fontWeight: 700, background: '#dcfce7', border: '1px solid #86efac', color: '#166534' }}>
                      {row.meldestatus}
                    </span>
                  </div>
                </div>
              ))}
              {bestandRows.length === 0 && <div style={{ padding: 12, color: '#6b7280' }}>Keine Bestandsdaten für die aktuelle Filterkombination.</div>}
            </>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 0.8fr 1fr 2fr 2.6fr', background: '#eef1f4', fontSize: 12, fontWeight: 700, color: '#4b5563' }}>
                <div style={{ padding: '8px 10px' }}>Ladungstraeger</div>
                <div style={{ padding: '8px 10px' }}>Standort</div>
                <div style={{ padding: '8px 10px' }}>Lagerplatz</div>
                <div style={{ padding: '8px 10px' }}>Gebuchte Aufträge</div>
                <div style={{ padding: '8px 10px' }}>Positionen je Auftrag</div>
              </div>
              {bestandCarrierRows.map((row) => (
                <div key={row.ladungstraeger} style={{ display: 'grid', gridTemplateColumns: '0.8fr 0.8fr 1fr 2fr 2.6fr', background: '#ffffff', borderTop: '1px solid #e2e7ec', fontSize: 13, alignItems: 'start' }}>
                  <div style={{ padding: '8px 10px', fontWeight: 700 }}>{row.ladungstraeger}</div>
                  <div style={{ padding: '8px 10px' }}>{row.standort}</div>
                  <div style={{ padding: '8px 10px' }}>{row.lagerplaetze.length > 0 ? row.lagerplaetze.join(', ') : '-'}</div>
                  <div style={{ padding: '8px 10px' }}>
                    {row.auftraege.length > 0 ? row.auftraege.map((paId) => (
                      <div key={`${row.ladungstraeger}-${paId}`} style={{ marginBottom: 4 }}>
                        <b>{productionOrderNo(paId)}</b>
                      </div>
                    )) : <span style={{ color: '#94a3b8' }}>Keine Aufträge verknüpft</span>}
                  </div>
                  <div style={{ padding: '8px 10px' }}>
                    {row.positionen.length > 0 ? row.positionen.map((pos, idx) => (
                      <div key={`${row.ladungstraeger}-${pos.paId}-${pos.position}-${idx}`} style={{ marginBottom: 4 }}>
                        <b>{productionOrderNo(pos.paId)}</b> | {pos.position} - {pos.artikel} ({pos.menge} {pos.einheit})
                      </div>
                    )) : <span style={{ color: '#94a3b8' }}>Keine Positionen vorhanden</span>}
                  </div>
                </div>
              ))}
              {bestandCarrierRows.length === 0 && <div style={{ padding: 12, color: '#6b7280' }}>Keine Ladungstraeger für die aktuelle Filterkombination.</div>}
            </>
          )}
        </section>
        )}
          </>
        )}

        {isMagazinView && (
          <>
        <div style={{ marginTop: 2 }}>
          <button
            type="button"
            onClick={() => setOpen((p) => ({ ...p, magazin: !p.magazin }))}
            style={{
              width: '100%',
              textAlign: 'left',
              border: '1px solid #d3d7dc',
              background: '#e7eaee',
              borderRadius: 8,
              padding: '8px 10px',
              cursor: 'pointer',
              fontWeight: 700,
              color: '#0f3050',
            }}
          >
            {open.magazin ? '▼' : '▶'} Magazinbestand
          </button>
        </div>
        {open.magazin && (
        <section style={{ background: '#f2f4f6', borderRadius: 10, border: '1px solid #d3d7dc', marginTop: 8, marginBottom: 14, overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px', fontSize: 15, fontWeight: 700, background: '#e7eaee', borderBottom: '1px solid #d3d7dc' }}>
            Magazin - Schirmer-Reihenfolge & Packstatus
          </div>

          <div style={{ padding: 12, borderBottom: '1px solid #dbe3ec' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr auto auto', gap: 10, alignItems: 'end' }}>
              <label>
                <div style={{ marginBottom: 5, fontSize: 12, color: '#4b5563' }}>Suche PA / Projekt</div>
                <input
                  type="text"
                  value={magazinSearch}
                  onChange={(e) => setMagazinSearch(e.target.value)}
                  placeholder="z. B. PA-2026-3001 oder MX4100A"
                  style={{ width: '100%', border: '1px solid #c7cdd4', borderRadius: 6, padding: '8px 10px', fontSize: 13 }}
                />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={magazinNurOffen}
                  onChange={(e) => setMagazinNurOffen(e.target.checked)}
                />
                <span style={{ fontSize: 12, color: '#334155', fontWeight: 700 }}>Nur nicht gepackt</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setMagazinSearch('');
                  setMagazinNurOffen(false);
                }}
                style={{ border: '1px solid #42b4e5', background: '#ffffff', color: '#2088b5', borderRadius: 6, padding: '8px 12px', fontSize: 13, cursor: 'pointer' }}
              >
                Filter zuruecksetzen
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(140px, 1fr))', gap: 10, padding: 12, borderBottom: '1px solid #dbe3ec' }}>
            <div style={{ background: '#ffffff', border: '1px solid #d3d7dc', borderRadius: 8, padding: '7px 9px' }}>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Auftraege im Fokus</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{magazinKpis.total}</div>
            </div>
            <div style={{ background: '#ecfdf5', border: '1px solid #86efac', borderRadius: 8, padding: '7px 9px' }}>
              <div style={{ fontSize: 11, color: '#166534' }}>Gepackt</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#15803d' }}>{magazinKpis.gepackt}</div>
            </div>
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '7px 9px' }}>
              <div style={{ fontSize: 11, color: '#7f1d1d' }}>Offen</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#b91c1c' }}>{magazinKpis.offen}</div>
            </div>
            <div style={{ background: '#fff1f2', border: '1px solid #fda4af', borderRadius: 8, padding: '7px 9px' }}>
              <div style={{ fontSize: 11, color: '#9f1239' }}>Mit Fehlteilen</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#be123c' }}>{fehlteileRows.length}</div>
            </div>
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '7px 9px' }}>
              <div style={{ fontSize: 11, color: '#7f1d1d' }}>Packung ueberfaellig</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#b91c1c' }}>{overduePackRows.length}</div>
            </div>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '7px 9px' }}>
              <div style={{ fontSize: 11, color: '#92400e' }}>Soll bereits gepackt sein</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#a16207' }}>{packKpis.shouldPacked}</div>
            </div>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '7px 9px' }}>
              <div style={{ fontSize: 11, color: '#1e3a8a' }}>Davon als gepackt markiert</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1d4ed8' }}>{packKpis.packedFromShould}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(180px, 1fr))', gap: 10, padding: '0 12px 12px 12px', borderBottom: '1px solid #dbe3ec' }}>
            <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 8, padding: '7px 9px' }}>
              <div style={{ fontSize: 11, color: '#854d0e' }}>Heute noch zu packen</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#a16207' }}>{packKpis.dueTodayOpen}</div>
            </div>
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '7px 9px' }}>
              <div style={{ fontSize: 11, color: '#075985' }}>Morgen faellig</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0369a1' }}>{packKpis.dueTomorrowOpen}</div>
            </div>
            <div style={{ background: '#ecfeff', border: '1px solid #a5f3fc', borderRadius: 8, padding: '7px 9px' }}>
              <div style={{ fontSize: 11, color: '#0e7490' }}>Offene mit kompletter Checkliste</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0e7490' }}>{packKpis.checklistCompleteOpen}</div>
            </div>
          </div>
          <div style={{ padding: 12, borderBottom: '1px solid #dbe3ec', background: '#f8fafc' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              Tacho Packstatus (Soll gepackt vs. als gepackt markiert)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 12, alignItems: 'center' }}>
              <div style={{ background: '#ffffff', border: '1px solid #dbe3ec', borderRadius: 8, padding: 10 }}>
                <svg viewBox="0 0 220 130" width="100%" height="120" role="img" aria-label="Packstatus Tacho">
                  <path
                    d="M 20 110 A 90 90 0 0 1 200 110"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="16"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 20 110 A 90 90 0 0 1 200 110"
                    fill="none"
                    stroke={packKpis.ratio >= 100 ? '#16a34a' : packKpis.ratio >= 70 ? '#0ea5e9' : '#f59e0b'}
                    strokeWidth="16"
                    strokeLinecap="round"
                    pathLength="100"
                    strokeDasharray={`${packKpis.ratio} 100`}
                  />
                  <text x="110" y="95" textAnchor="middle" style={{ fontSize: 26, fontWeight: 700, fill: '#0f172a' }}>
                    {packKpis.ratio}%
                  </text>
                </svg>
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <div style={{ fontSize: 13, color: '#334155' }}>
                  <b>Soll gepackt sein:</b> {packKpis.shouldPacked}
                </div>
                <div style={{ fontSize: 13, color: '#334155' }}>
                  <b>Davon als gepackt markiert:</b> {packKpis.packedFromShould}
                </div>
                <div style={{ fontSize: 13, color: '#334155' }}>
                  <b>Fehlend trotz Faelligkeit:</b> {packKpis.missingFromShould}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  Grundlage: Deadline = Schirmer-Start minus 2 Tage. Fuer die KPI gilt: Deadline-Datum bis inkl. heute.
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: '8px 12px', borderBottom: '1px solid #dbe3ec', background: '#fffbeb', fontSize: 12, color: '#92400e', fontWeight: 700 }}>
            Regel: Pack-Deadline = Schirmer-Starttag minus 2 Tage (bis 23:59 Uhr)
          </div>

          <div style={{ padding: '10px 12px', fontSize: 14, fontWeight: 700, color: '#334155', borderTop: '1px solid #dbe3ec', borderBottom: '1px solid #dbe3ec', marginTop: 8 }}>
            1) Schirmer - laufend und naechste Tage (Reihenfolge)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.8fr 1.1fr 1fr 0.9fr 1fr 1.1fr 1fr', background: '#eef1f4', fontSize: 12, fontWeight: 700, color: '#4b5563' }}>
            <div style={{ padding: '8px 10px' }}>Projekt</div>
            <div style={{ padding: '8px 10px' }}>Linie</div>
            <div style={{ padding: '8px 10px' }}>Start Schirmer</div>
            <div style={{ padding: '8px 10px' }}>Pack-Deadline</div>
            <div style={{ padding: '8px 10px' }}>Status</div>
            <div style={{ padding: '8px 10px' }}>Fehlteile</div>
            <div style={{ padding: '8px 10px' }}>Aktion</div>
            <div style={{ padding: '8px 10px' }}>Fortschritt</div>
          </div>
          {schirmerRows.map((row) => {
            const packStats = getPacklisteStats(row.paId);
            const fehlteileMeta = getFehlteileMeta(row);
            const deadlineMeta = getPackDeadlineMeta(row);
            const disableMarkPacked = row.gepackt || !packStats.allChecked || fehlteileMeta.hasFehlteile;
            return (
            <div key={`${row.id}-schirmer`} style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.8fr 1.1fr 1fr 0.9fr 1fr 1.1fr 1fr', background: '#ffffff', borderTop: '1px solid #e2e7ec', fontSize: 13, alignItems: 'center' }}>
              <div style={{ padding: '8px 10px' }}>{row.projekt}</div>
              <div style={{ padding: '8px 10px', fontWeight: 700 }}>{linieByPa[row.paId] || '-'}</div>
              <div style={{ padding: '8px 10px' }}>{formatDateTime(row.schirmerStart)}</div>
              <div style={{ padding: '8px 10px' }}>
                <span style={deadlineMeta.status === 'ueberfaellig'
                  ? { display: 'inline-block', borderRadius: 12, padding: '2px 8px', fontSize: 12, fontWeight: 700, background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b' }
                  : deadlineMeta.status === 'heute'
                    ? { display: 'inline-block', borderRadius: 12, padding: '2px 8px', fontSize: 12, fontWeight: 700, background: '#fef3c7', border: '1px solid #fde047', color: '#92400e' }
                    : deadlineMeta.status === 'erfuellt'
                      ? { display: 'inline-block', borderRadius: 12, padding: '2px 8px', fontSize: 12, fontWeight: 700, background: '#dcfce7', border: '1px solid #86efac', color: '#166534' }
                      : { display: 'inline-block', borderRadius: 12, padding: '2px 8px', fontSize: 12, fontWeight: 700, background: '#eff6ff', border: '1px solid #93c5fd', color: '#1d4ed8' }}
                >
                  {deadlineMeta.deadlineLabel}
                </span>
              </div>
              <div style={{ padding: '8px 10px' }}>
                <span style={row.schirmerStatus === 'wird_gepackt'
                  ? { display: 'inline-block', borderRadius: 12, padding: '2px 8px', fontSize: 12, fontWeight: 700, background: '#dbeafe', border: '1px solid #93c5fd', color: '#1d4ed8' }
                  : row.schirmerStatus === 'ueberfaellig'
                    ? { display: 'inline-block', borderRadius: 12, padding: '2px 8px', fontSize: 12, fontWeight: 700, background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b' }
                    : row.schirmerStatus === 'gepackt'
                      ? { display: 'inline-block', borderRadius: 12, padding: '2px 8px', fontSize: 12, fontWeight: 700, background: '#dcfce7', border: '1px solid #86efac', color: '#166534' }
                      : { display: 'inline-block', borderRadius: 12, padding: '2px 8px', fontSize: 12, fontWeight: 700, background: '#fef3c7', border: '1px solid #fde047', color: '#92400e' }}
                >
                  {row.schirmerStatus === 'wird_gepackt' ? 'wird gepackt' : row.schirmerStatus}
                </span>
              </div>
              <div style={{ padding: '8px 10px' }}>
                <div style={{ display: 'grid', gap: 4 }}>
                  <div
                    style={fehlteileMeta.hasFehlteile
                      ? { display: 'inline-block', border: '1px solid #fda4af', borderRadius: 6, background: '#fff1f2', color: '#9f1239', padding: '6px 10px', fontSize: 12, fontWeight: 700 }
                      : { display: 'inline-block', border: '1px solid #cbd5e1', borderRadius: 6, background: '#f8fafc', color: '#475569', padding: '6px 10px', fontSize: 12, fontWeight: 700 }}
                    title={getFehlteileHinweisForPa(row.paId) || 'Fehlteile in Packliste markieren'}
                  >
                    {fehlteileMeta.label}
                  </div>
                  {fehlteileMeta.einkaufInformiert && (
                    <div style={{ fontSize: 10, color: '#be123c', fontWeight: 700 }}>{fehlteileMeta.einkaufInfoLabel}</div>
                  )}
                </div>
              </div>
              <div style={{ padding: '8px 10px' }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => bestaetigeGepackt(row.id)}
                    disabled={disableMarkPacked}
                    title={row.gepackt
                      ? 'Bereits bestaetigt'
                      : fehlteileMeta.hasFehlteile
                        ? 'Erst Fehlteile auf 0 setzen'
                        : (packStats.allChecked ? 'Packliste komplett' : 'Packliste zuerst komplett abhaken')}
                    style={disableMarkPacked
                      ? { border: '1px solid #cbd5e1', borderRadius: 6, background: '#f8fafc', color: '#94a3b8', padding: '6px 10px', fontSize: 12, cursor: 'not-allowed', fontWeight: 700 }
                      : row.gepackt
                      ? { border: '1px solid #cbd5e1', borderRadius: 6, background: '#f8fafc', color: '#94a3b8', padding: '6px 10px', fontSize: 12, cursor: 'not-allowed', fontWeight: 700 }
                      : { border: '1px solid #86efac', borderRadius: 6, background: '#dcfce7', color: '#166534', padding: '6px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}
                  >
                    {row.gepackt ? 'Bereits bestaetigt' : 'Gepackt bestaetigen'}
                  </button>
                  <button
                    type="button"
                    onClick={() => openPacklisteForOrder(row)}
                    style={{ border: '1px solid #93c5fd', borderRadius: 6, background: '#eff6ff', color: '#1d4ed8', padding: '6px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}
                  >
                    Packliste
                  </button>
                  <button
                    type="button"
                    onClick={() => openKommentareForOrder(row)}
                    style={{ border: '1px solid #a7f3d0', borderRadius: 6, background: '#ecfdf5', color: '#065f46', padding: '6px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}
                  >
                    Kommentare
                  </button>
                  <div style={{ width: '100%', fontSize: 10, color: (packStats.allChecked && !fehlteileMeta.hasFehlteile) ? '#166534' : '#92400e', fontWeight: 700 }}>
                    Checkliste {packStats.checked}/{packStats.total}{fehlteileMeta.hasFehlteile ? ' | Fehlteile offen' : ''}
                  </div>
                </div>
              </div>
              <div style={{ padding: '8px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 8, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${row.schirmerFortschritt}%`,
                        height: '100%',
                        borderRadius: 999,
                        background: row.schirmerFortschritt >= 100 ? '#16a34a' : '#38bdf8',
                      }}
                    />
                  </div>
                  <div style={{ minWidth: 34, fontWeight: 700, color: '#334155' }}>{row.schirmerFortschritt}%</div>
                </div>
              </div>
            </div>
            );
          })}

          <div style={{ padding: '10px 12px', fontSize: 14, fontWeight: 700, color: '#991b1b', borderTop: '1px solid #dbe3ec', borderBottom: '1px solid #dbe3ec', marginTop: 8, background: '#fef2f2' }}>
            2) Sollte bereits gepackt sein, ist aber noch offen ({overduePackRows.length})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.8fr 1.2fr 1.2fr 1fr 1fr 1fr', background: '#eef1f4', fontSize: 12, fontWeight: 700, color: '#4b5563' }}>
            <div style={{ padding: '8px 10px' }}>Projekt</div>
            <div style={{ padding: '8px 10px' }}>Linie</div>
            <div style={{ padding: '8px 10px' }}>Start Schirmer</div>
            <div style={{ padding: '8px 10px' }}>Pack-Deadline</div>
            <div style={{ padding: '8px 10px' }}>Checkliste</div>
            <div style={{ padding: '8px 10px' }}>Fehlteile</div>
            <div style={{ padding: '8px 10px' }}>Aktion</div>
          </div>
          {overduePackRows.map((row) => {
            const packStats = getPacklisteStats(row.paId);
            const fehlteileMeta = getFehlteileMeta(row);
            return (
              <div key={`overdue-pack-${row.id}`} style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.8fr 1.2fr 1.2fr 1fr 1fr 1fr', background: '#ffffff', borderTop: '1px solid #e2e7ec', fontSize: 13, alignItems: 'center' }}>
                <div style={{ padding: '8px 10px' }}>{row.projekt}</div>
                <div style={{ padding: '8px 10px', fontWeight: 700 }}>{linieByPa[row.paId] || '-'}</div>
                <div style={{ padding: '8px 10px' }}>{formatDateTime(row.schirmerStart)}</div>
                <div style={{ padding: '8px 10px' }}>
                  <span style={{ display: 'inline-block', borderRadius: 12, padding: '2px 8px', fontSize: 12, fontWeight: 700, background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b' }}>
                    {row.deadlineMeta.deadlineLabel}
                  </span>
                </div>
                <div style={{ padding: '8px 10px', fontWeight: 700, color: packStats.allChecked ? '#166534' : '#92400e' }}>
                  {packStats.checked}/{packStats.total}
                </div>
                <div style={{ padding: '8px 10px' }}>
                  <div style={{ display: 'grid', gap: 4 }}>
                    <div
                      style={fehlteileMeta.hasFehlteile
                        ? { display: 'inline-block', border: '1px solid #fda4af', borderRadius: 6, background: '#fff1f2', color: '#9f1239', padding: '6px 10px', fontSize: 12, fontWeight: 700 }
                        : { display: 'inline-block', border: '1px solid #cbd5e1', borderRadius: 6, background: '#f8fafc', color: '#475569', padding: '6px 10px', fontSize: 12, fontWeight: 700 }}
                    >
                      {fehlteileMeta.label}
                    </div>
                    {fehlteileMeta.einkaufInformiert && (
                      <div style={{ fontSize: 10, color: '#be123c', fontWeight: 700 }}>{fehlteileMeta.einkaufInfoLabel}</div>
                    )}
                  </div>
                </div>
                <div style={{ padding: '8px 10px' }}>
                  <button
                    type="button"
                    onClick={() => openPacklisteForOrder(row)}
                    style={{ border: '1px solid #93c5fd', borderRadius: 6, background: '#eff6ff', color: '#1d4ed8', padding: '6px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}
                  >
                    Packliste oeffnen
                  </button>
                  <button
                    type="button"
                    onClick={() => openKommentareForOrder(row)}
                    style={{ marginLeft: 6, border: '1px solid #a7f3d0', borderRadius: 6, background: '#ecfdf5', color: '#065f46', padding: '6px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}
                  >
                    Kommentare
                  </button>
                </div>
              </div>
            );
          })}
          {overduePackRows.length === 0 && (
            <div style={{ padding: 12, color: '#64748b' }}>Keine ueberfaelligen Packauftraege.</div>
          )}

          <div style={{ padding: '10px 12px', fontSize: 14, fontWeight: 700, color: '#166534', borderTop: '1px solid #dbe3ec', borderBottom: '1px solid #dbe3ec', marginTop: 8, background: '#ecfdf5' }}>
            3) Bereits gepackt ({packedMagazinRows.length})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.8fr 1.2fr 1.2fr 1fr 1fr 0.9fr', background: '#eef1f4', fontSize: 12, fontWeight: 700, color: '#4b5563' }}>
            <div style={{ padding: '8px 10px' }}>Projekt</div>
            <div style={{ padding: '8px 10px' }}>Linie</div>
            <div style={{ padding: '8px 10px' }}>Schirmer Start</div>
            <div style={{ padding: '8px 10px' }}>Pack-Deadline</div>
            <div style={{ padding: '8px 10px' }}>Gepackt am</div>
            <div style={{ padding: '8px 10px' }}>Fehlteile</div>
            <div style={{ padding: '8px 10px' }}>Packliste</div>
          </div>
          {packedMagazinRows.map((row) => {
            const deadlineMeta = getPackDeadlineMeta(row);
            const fehlteileMeta = getFehlteileMeta(row);
            return (
              <div key={`packed-${row.id}`} style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.8fr 1.2fr 1.2fr 1fr 1fr 0.9fr', background: '#ffffff', borderTop: '1px solid #e2e7ec', fontSize: 13, alignItems: 'center' }}>
                <div style={{ padding: '8px 10px' }}>{row.projekt}</div>
                <div style={{ padding: '8px 10px', fontWeight: 700 }}>{linieByPa[row.paId] || '-'}</div>
                <div style={{ padding: '8px 10px' }}>{formatDateTime(row.schirmerStart)}</div>
                <div style={{ padding: '8px 10px' }}>
                  <span style={{ display: 'inline-block', borderRadius: 12, padding: '2px 8px', fontSize: 12, fontWeight: 700, background: '#dcfce7', border: '1px solid #86efac', color: '#166534' }}>
                    {deadlineMeta.deadlineLabel}
                  </span>
                </div>
                <div style={{ padding: '8px 10px', fontWeight: 700, color: '#166534' }}>{row.gepacktAm || '-'}</div>
                <div style={{ padding: '8px 10px' }}>
                  <div style={{ display: 'grid', gap: 4 }}>
                    <div
                      style={fehlteileMeta.hasFehlteile
                        ? { display: 'inline-block', border: '1px solid #fda4af', borderRadius: 6, background: '#fff1f2', color: '#9f1239', padding: '6px 10px', fontSize: 12, fontWeight: 700 }
                        : { display: 'inline-block', border: '1px solid #cbd5e1', borderRadius: 6, background: '#f8fafc', color: '#475569', padding: '6px 10px', fontSize: 12, fontWeight: 700 }}
                    >
                      {fehlteileMeta.label}
                    </div>
                    {fehlteileMeta.einkaufInformiert && (
                      <div style={{ fontSize: 10, color: '#be123c', fontWeight: 700 }}>{fehlteileMeta.einkaufInfoLabel}</div>
                    )}
                  </div>
                </div>
                <div style={{ padding: '8px 10px' }}>
                  <button
                    type="button"
                    onClick={() => openPacklisteForOrder(row)}
                    style={{ border: '1px solid #93c5fd', borderRadius: 6, background: '#eff6ff', color: '#1d4ed8', padding: '6px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}
                  >
                    Oeffnen
                  </button>
                  <button
                    type="button"
                    onClick={() => openKommentareForOrder(row)}
                    style={{ marginLeft: 6, border: '1px solid #a7f3d0', borderRadius: 6, background: '#ecfdf5', color: '#065f46', padding: '6px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}
                  >
                    Kommentare
                  </button>
                </div>
              </div>
            );
          })}
          {packedMagazinRows.length === 0 && (
            <div style={{ padding: 12, color: '#64748b' }}>Noch keine gepackten Auftraege.</div>
          )}
        </section>
        )}
          </>
        )}

        {isExternalView && (
          <>
        <div style={{ marginTop: 2 }}>
          <button
            type="button"
            onClick={() => setOpen((p) => ({ ...p, external: !p.external }))}
            style={{
              width: '100%',
              textAlign: 'left',
              border: '1px solid #d3d7dc',
              background: '#e7eaee',
              borderRadius: 8,
              padding: '8px 10px',
              cursor: 'pointer',
              fontWeight: 700,
              color: '#0f3050',
            }}
          >
            {open.external ? '▼' : '▶'} Externe Fertigung - Gestelle & Termine
          </button>
        </div>
        {open.external && (
        <section style={{ background: '#f2f4f6', borderRadius: 10, border: '1px solid #d3d7dc', marginTop: 8, marginBottom: 14, overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px', fontSize: 15, fontWeight: 700, background: '#e7eaee', borderBottom: '1px solid #d3d7dc' }}>
            Externe Aufträge - Verwaltung von Transportgestellen und Rücklieferterminen
          </div>

          <div style={{ padding: 12, borderBottom: '1px solid #dbe3ec' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
              <label>
                <div style={{ marginBottom: 5, fontSize: 12, color: '#4b5563' }}>Suche Gestell / Projekt / Ort</div>
                <input
                  type="text"
                  value={externalSearch}
                  onChange={(e) => setExternalSearch(e.target.value)}
                  placeholder="z. B. L-505, BS0168B-2501, Pfullendorf"
                  style={{ width: '100%', border: '1px solid #c7cdd4', borderRadius: 6, padding: '8px 10px', fontSize: 13 }}
                />
              </label>
              <label>
                <div style={{ marginBottom: 5, fontSize: 12, color: '#4b5563' }}>Ort</div>
                <select
                  value={externalOrtFilter}
                  onChange={(e) => setExternalOrtFilter(e.target.value)}
                  style={{ width: '100%', border: '1px solid #c7cdd4', borderRadius: 6, padding: '8px 10px', fontSize: 13, background: '#fff' }}
                >
                  <option value="alle">Alle</option>
                  {[...new Set(externalOrderData.map((x) => x.ort))].sort().map((ort) => (
                    <option key={ort} value={ort}>{ort}</option>
                  ))}
                </select>
              </label>
              <label>
                <div style={{ marginBottom: 5, fontSize: 12, color: '#4b5563' }}>Status</div>
                <select
                  value={externalStatusFilter}
                  onChange={(e) => setExternalStatusFilter(e.target.value)}
                  style={{ width: '100%', border: '1px solid #c7cdd4', borderRadius: 6, padding: '8px 10px', fontSize: 13, background: '#fff' }}
                >
                  <option value="alle">Alle</option>
                  <option value="offen">offen</option>
                  <option value="geplant">geplant</option>
                  <option value="ueberfaellig">ueberfaellig</option>
                  <option value="erledigt">erledigt</option>
                </select>
              </label>
              <button
                type="button"
                onClick={() => {
                  setExternalSearch('');
                  setExternalOrtFilter('alle');
                  setExternalStatusFilter('alle');
                }}
                style={{ border: '1px solid #42b4e5', background: '#ffffff', color: '#2088b5', borderRadius: 6, padding: '8px 12px', fontSize: 13, cursor: 'pointer' }}
              >
                Filter zurücksetzen
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(140px, 1fr))', gap: 10, padding: 12, borderBottom: '1px solid #dbe3ec' }}>
            <div style={{ background: '#ffffff', border: '1px solid #d3d7dc', borderRadius: 8, padding: '7px 9px' }}>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Eintraege gesamt</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{externalKpis.total}</div>
            </div>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '7px 9px' }}>
              <div style={{ fontSize: 11, color: '#92400e' }}>Offen</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#a16207' }}>{externalKpis.offen}</div>
            </div>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '7px 9px' }}>
              <div style={{ fontSize: 11, color: '#1e3a8a' }}>Geplant</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1d4ed8' }}>{externalKpis.geplant}</div>
            </div>
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '7px 9px' }}>
              <div style={{ fontSize: 11, color: '#7f1d1d' }}>Ueberfaellig</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#b91c1c' }}>{externalKpis.ueberfaellig}</div>
            </div>
            <div style={{ background: '#ecfdf5', border: '1px solid #86efac', borderRadius: 8, padding: '7px 9px' }}>
              <div style={{ fontSize: 11, color: '#166534' }}>Erledigt</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#15803d' }}>{externalKpis.erledigt}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.5fr 1fr 0.9fr 0.9fr 1fr', background: '#eef1f4', fontSize: 12, fontWeight: 700, color: '#4b5563' }}>
            <div style={{ padding: '8px 10px' }}>Gestellnummer</div>
            <div style={{ padding: '8px 10px' }}>Projekt</div>
            <div style={{ padding: '8px 10px' }}>Ort</div>
            <div style={{ padding: '8px 10px' }}>Lieferdatum</div>
            <div style={{ padding: '8px 10px' }}>Ruecklieferung</div>
            <div style={{ padding: '8px 10px' }}>Status</div>
          </div>
          {externalRows.map((row) => (
            <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.5fr 1fr 0.9fr 0.9fr 1fr', background: '#ffffff', borderTop: '1px solid #e2e7ec', fontSize: 13, alignItems: 'center' }}>
              <div style={{ padding: '9px 10px', fontWeight: 700 }}>{row.gestellnummer}</div>
              <div style={{ padding: '9px 10px' }}>{row.projekt}</div>
              <div style={{ padding: '9px 10px' }}>{row.ort}</div>
              <div style={{ padding: '9px 10px' }}>
                {formatDate(row.lieferdatum)}
                <TerminverschiebungIndicator
                  record={row}
                  fieldKey="lieferdatum"
                  onOpen={() => setTerminModal({
                    record: row,
                    fieldKey: 'lieferdatum',
                    title: `Historie Lieferdatum - ${row.gestellnummer}`,
                  })}
                />
              </div>
              <div style={{ padding: '6px 10px' }}>
                <input
                  type="date"
                  value={row.ruecklieferung || ''}
                  onChange={(e) => updateExternalOrder(row.id, { ruecklieferung: e.target.value })}
                  style={{ width: '100%', border: '1px solid #c7cdd4', borderRadius: 6, padding: '6px 8px', fontSize: 12, background: '#fff' }}
                />
                <TerminverschiebungIndicator
                  record={row}
                  fieldKey="ruecklieferung"
                  onOpen={() => setTerminModal({
                    record: row,
                    fieldKey: 'ruecklieferung',
                    title: `Historie Ruecklieferung - ${row.gestellnummer}`,
                  })}
                />
              </div>
              <div style={{ padding: '6px 10px' }}>
                <span style={{ display: 'inline-block', borderRadius: 12, padding: '2px 8px', fontSize: 12, fontWeight: 700, ...externalStatusBadge(row.status) }}>
                  {row.status}
                </span>
              </div>
            </div>
          ))}
          {externalRows.length === 0 && <div style={{ padding: 12, color: '#6b7280' }}>Keine externen Aufträge für die aktuelle Filterkombination.</div>}
        </section>
        )}
          </>
        )}

        {isGestelleView && (
          <>
        <div style={{ marginTop: 2 }}>
          <button
            type="button"
            onClick={() => setOpen((p) => ({ ...p, gestelle: !p.gestelle }))}
            style={{
              width: '100%',
              textAlign: 'left',
              border: '1px solid #d3d7dc',
              background: '#e7eaee',
              borderRadius: 8,
              padding: '8px 10px',
              cursor: 'pointer',
              fontWeight: 700,
              color: '#0f3050',
            }}
          >
            {open.gestelle ? '▼' : '▶'} Transportgestelle Standort
          </button>
        </div>
        {open.gestelle && (
        <section style={{ background: '#f2f4f6', borderRadius: 10, border: '1px solid #d3d7dc', marginTop: 8, marginBottom: 14, overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px', fontSize: 15, fontWeight: 700, background: '#e7eaee', borderBottom: '1px solid #d3d7dc' }}>
            Standortuebersicht Transportgestelle
          </div>

          <div style={{ padding: 12, borderBottom: '1px solid #dbe3ec' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
              <label>
                <div style={{ marginBottom: 5, fontSize: 12, color: '#4b5563' }}>Suche Gestell / Abruf / Projekt / Montageleiter</div>
                <input
                  type="text"
                  value={gestellSearch}
                  onChange={(e) => setGestellSearch(e.target.value)}
                  placeholder="z. B. L-162, hb0264a, MX4100A-BTL77100"
                  style={{ width: '100%', border: '1px solid #c7cdd4', borderRadius: 6, padding: '8px 10px', fontSize: 13 }}
                />
              </label>
              <label>
                <div style={{ marginBottom: 5, fontSize: 12, color: '#4b5563' }}>Standort</div>
                <select
                  value={gestellStandortFilter}
                  onChange={(e) => setGestellStandortFilter(e.target.value)}
                  style={{ width: '100%', border: '1px solid #c7cdd4', borderRadius: 6, padding: '8px 10px', fontSize: 13, background: '#fff' }}
                >
                  <option value="alle">Alle</option>
                  <option value="Baustelle">Baustelle</option>
                  <option value="Ruecktransport geplant">Ruecktransport geplant</option>
                  <option value="Werk">Werk</option>
                </select>
              </label>
              <label>
                <div style={{ marginBottom: 5, fontSize: 12, color: '#4b5563' }}>Priorisierung</div>
                <select
                  value={gestellNurKritisch ? 'kritisch' : 'alle'}
                  onChange={(e) => setGestellNurKritisch(e.target.value === 'kritisch')}
                  style={{ width: '100%', border: '1px solid #c7cdd4', borderRadius: 6, padding: '8px 10px', fontSize: 13, background: '#fff' }}
                >
                  <option value="alle">Alle</option>
                  <option value="kritisch">Nur kritisch</option>
                </select>
              </label>
              <button
                type="button"
                onClick={() => {
                  setGestellSearch('');
                  setGestellStandortFilter('alle');
                  setGestellNurKritisch(false);
                }}
                style={{ border: '1px solid #42b4e5', background: '#ffffff', color: '#2088b5', borderRadius: 6, padding: '8px 12px', fontSize: 13, cursor: 'pointer' }}
              >
                Filter zurücksetzen
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(120px, 1fr))', gap: 10, padding: 12, borderBottom: '1px solid #dbe3ec' }}>
            <div style={{ background: '#ffffff', border: '1px solid #d3d7dc', borderRadius: 8, padding: '7px 9px' }}>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Gestelle gesamt</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{gestellKpis.total}</div>
            </div>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '7px 9px' }}>
              <div style={{ fontSize: 11, color: '#1e3a8a' }}>Auf Baustelle</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1d4ed8' }}>{gestellKpis.baustelle}</div>
            </div>
            <div style={{ background: '#ecfdf5', border: '1px solid #86efac', borderRadius: 8, padding: '7px 9px' }}>
              <div style={{ fontSize: 11, color: '#166534' }}>Im Werk</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#15803d' }}>{gestellKpis.werk}</div>
            </div>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '7px 9px' }}>
              <div style={{ fontSize: 11, color: '#92400e' }}>Ruecktransport geplant</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#a16207' }}>{gestellKpis.ruecktransport}</div>
            </div>
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '7px 9px' }}>
              <div style={{ fontSize: 11, color: '#7f1d1d' }}>Kritisch</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#b91c1c' }}>{gestellKpis.kritisch}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.2fr 1.2fr 0.9fr 1fr 1.1fr 1.2fr 1fr 1.8fr 1.2fr', background: '#eef1f4', fontSize: 12, fontWeight: 700, color: '#4b5563' }}>
            <div style={{ padding: '8px 10px' }}>Ladungstraeger</div>
            <div style={{ padding: '8px 10px' }}>Abruf</div>
            <div style={{ padding: '8px 10px' }}>Projekt</div>
            <div style={{ padding: '8px 10px' }}>Containertyp</div>
            <div style={{ padding: '8px 10px' }}>Datum Versand</div>
            <div style={{ padding: '8px 10px' }}>Standort</div>
            <div style={{ padding: '8px 10px' }}>Montageleiter</div>
            <div style={{ padding: '8px 10px' }}>Status</div>
            <div style={{ padding: '8px 10px' }}>Bemerkung</div>
            <div style={{ padding: '8px 10px' }}>Aktion</div>
          </div>
          {gestellRows.map((row) => {
            const rowKey = gestellRowKey(row);
            const isEditingBemerkung = editingBemerkungKey === rowKey;
            return (
            <div key={`${row.ladungstraeger}-${row.abruf}`} style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.2fr 1.2fr 0.9fr 1fr 1.1fr 1.2fr 1fr 1.8fr 1.2fr', background: '#ffffff', borderTop: '1px solid #e2e7ec', fontSize: 13, alignItems: 'center' }}>
              <div style={{ padding: '9px 10px', fontWeight: 700 }}>{row.ladungstraeger}</div>
              <div style={{ padding: '9px 10px' }}>{row.abruf}</div>
              <div style={{ padding: '9px 10px' }}>{row.projekt || '-'}</div>
              <div style={{ padding: '9px 10px' }}>{row.containerTyp}</div>
              <div style={{ padding: '9px 10px' }}>
                {formatDate(row.datumVersand)} {row.versandInfo ? <span style={{ color: '#0369a1', fontWeight: 700 }}>({row.versandInfo})</span> : ''}
              </div>
              <div style={{ padding: '9px 10px' }}>
                <span style={{ display: 'inline-block', borderRadius: 12, padding: '2px 8px', fontSize: 12, fontWeight: 700, background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155' }}>
                  {row.standort}
                </span>
              </div>
              <div style={{ padding: '9px 10px' }}>{row.montageleiter}</div>
              <div style={{ padding: '9px 10px' }}>
                <span style={{ display: 'inline-block', borderRadius: 12, padding: '2px 8px', fontSize: 12, fontWeight: 700, ...gestellAmpelBadge(row.ampel) }}>
                  {row.ampel}
                </span>
              </div>
              <div style={{ padding: '6px 10px' }}>
                {isEditingBemerkung ? (
                  <input
                    autoFocus
                    value={editingBemerkungValue}
                    onChange={(e) => setEditingBemerkungValue(e.target.value)}
                    onBlur={saveBemerkungEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveBemerkungEdit();
                      if (e.key === 'Escape') cancelBemerkungEdit();
                    }}
                    placeholder="Bemerkung eingeben..."
                    style={{ width: '100%', border: '1px solid #c7cdd4', borderRadius: 6, padding: '6px 8px', fontSize: 12 }}
                  />
                ) : (
                  <div
                    onClick={() => startBemerkungEdit(row)}
                    title="Klicken zum Bearbeiten"
                    style={{ cursor: 'pointer', minHeight: 20, display: 'flex', alignItems: 'center' }}
                  >
                    {row.bemerkung || <span style={{ color: '#94a3b8' }}>Bemerkung hinzufuegen</span>}
                  </div>
                )}
              </div>
              <div style={{ padding: '6px 10px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => markGestellReturned(row)}
                  title="Gestell als zurückgebracht einbuchen"
                  style={{
                    border: '1px solid #86efac',
                    background: '#ecfdf5',
                    color: '#166534',
                    borderRadius: 6,
                    padding: '4px 8px',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  Zurueckgebucht
                </button>
                <button
                  type="button"
                  onClick={() => openReminderModal(row)}
                  title="Erinnerungs-E-Mail senden"
                  style={{
                    border: '1px solid #93c5fd',
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    borderRadius: 6,
                    padding: '4px 8px',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  ✉
                </button>
              </div>
            </div>
            );
          })}
          {gestellRows.length === 0 && <div style={{ padding: 12, color: '#6b7280' }}>Keine Transportgestelle für die aktuelle Filterkombination.</div>}
        </section>
        )}
          </>
        )}

        {isGestelleView && (
        <>
        <div style={{ marginTop: 2 }}>
          <button
            type="button"
            onClick={() => setOpen((p) => ({ ...p, offenePunkte: !p.offenePunkte }))}
            style={{
              width: '100%',
              textAlign: 'left',
              border: '1px solid #d3d7dc',
              background: '#e7eaee',
              borderRadius: 8,
              padding: '8px 10px',
              cursor: 'pointer',
              fontWeight: 700,
              color: '#0f3050',
            }}
          >
            {open.offenePunkte ? '▼' : '▶'} Offene Punkte
          </button>
        </div>
        {open.offenePunkte && (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(260px, 1fr))', gap: 12, marginTop: 8 }}>
          <div style={{ background: '#f5d0e6', border: '1px solid #e9a6cf', borderRadius: 8, padding: '12px 14px', minHeight: 110 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Offener Punkt</div>
            <div style={{ lineHeight: 1.4 }}>Wie sind die Lagerplaetze angelegt und wie will man in Zukunft damit umgehen?</div>
          </div>
          <div style={{ background: '#f5d0e6', border: '1px solid #e9a6cf', borderRadius: 8, padding: '12px 14px', minHeight: 110 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Offener Punkt</div>
            <div style={{ lineHeight: 1.4 }}>Strukturliste Mandant 500: Wie und wo abbilden?</div>
          </div>
        </section>
        )}
        </>
        )}

        {ladungstraegerModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30 }}>
            <div style={{ width: 'min(760px, 92vw)', background: '#ffffff', borderRadius: 8, border: '1px solid #cbd5e1', overflow: 'hidden' }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700 }}>
                  Ladungstraeger {ladungstraegerModal.booking.ladungstraeger} - {ladungstraegerModal.paId}
                </div>
                <button
                  type="button"
                  onClick={() => setLadungstraegerModal(null)}
                  style={{ border: '1px solid #b9c6d5', borderRadius: 6, background: '#fff', padding: '6px 10px', cursor: 'pointer', fontSize: 13 }}
                >
                  Schließen
                </button>
              </div>
              <div style={{ padding: '10px 12px', fontSize: 13, color: '#334155' }}>
                Projekt: <b>{ladungstraegerModal.projekt}</b>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 2fr 0.8fr 0.8fr', background: '#eef1f4', fontSize: 12, fontWeight: 700, color: '#4b5563' }}>
                <div style={{ padding: '8px 10px' }}>Position</div>
                <div style={{ padding: '8px 10px' }}>Artikel</div>
                <div style={{ padding: '8px 10px' }}>Menge</div>
                <div style={{ padding: '8px 10px' }}>Einheit</div>
              </div>
              {ladungstraegerModal.booking.positionen.map((pos) => (
                <div key={`${ladungstraegerModal.booking.ladungstraeger}-${pos.position}`} style={{ display: 'grid', gridTemplateColumns: '0.9fr 2fr 0.8fr 0.8fr', borderTop: '1px solid #e2e7ec', fontSize: 13 }}>
                  <div style={{ padding: '8px 10px', fontWeight: 700 }}>{pos.position}</div>
                  <div style={{ padding: '8px 10px' }}>{pos.artikel}</div>
                  <div style={{ padding: '8px 10px' }}>{pos.menge}</div>
                  <div style={{ padding: '8px 10px' }}>{pos.einheit}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {createCalendarModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 31 }}>
            <div style={{ width: 'min(620px, 92vw)', background: '#ffffff', borderRadius: 8, border: '1px solid #cbd5e1', overflow: 'hidden' }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 700 }}>
                Neuer LKW-Kalendereintrag
              </div>
              <div style={{ padding: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <label>
                    <div style={{ marginBottom: 5, fontSize: 12, color: '#4b5563' }}>Auftrag</div>
                    <select
                      value={newCalendarEntry.paId}
                      onChange={(e) => setNewCalendarEntry((prev) => ({ ...prev, paId: e.target.value }))}
                      style={{ width: '100%', border: '1px solid #c7cdd4', borderRadius: 6, padding: '8px 10px', fontSize: 13, background: '#fff' }}
                    >
                      {logisticsData.map((row) => (
                        <option key={row.paId} value={row.paId}>
                          {productionOrderNo(row.paId)} | {row.projekt}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <div style={{ marginBottom: 5, fontSize: 12, color: '#4b5563' }}>Datum</div>
                    <input
                      type="date"
                      value={newCalendarEntry.datum}
                      onChange={(e) => setNewCalendarEntry((prev) => ({ ...prev, datum: e.target.value }))}
                      style={{ width: '100%', border: '1px solid #c7cdd4', borderRadius: 6, padding: '8px 10px', fontSize: 13 }}
                    />
                  </label>
                  <label>
                    <div style={{ marginBottom: 5, fontSize: 12, color: '#4b5563' }}>Start</div>
                    <input
                      type="time"
                      value={newCalendarEntry.start}
                      onChange={(e) => setNewCalendarEntry((prev) => ({ ...prev, start: e.target.value }))}
                      style={{ width: '100%', border: '1px solid #c7cdd4', borderRadius: 6, padding: '8px 10px', fontSize: 13 }}
                    />
                  </label>
                  <label>
                    <div style={{ marginBottom: 5, fontSize: 12, color: '#4b5563' }}>Ende</div>
                    <input
                      type="time"
                      value={newCalendarEntry.ende}
                      onChange={(e) => setNewCalendarEntry((prev) => ({ ...prev, ende: e.target.value }))}
                      style={{ width: '100%', border: '1px solid #c7cdd4', borderRadius: 6, padding: '8px 10px', fontSize: 13 }}
                    />
                  </label>
                  <label>
                    <div style={{ marginBottom: 5, fontSize: 12, color: '#4b5563' }}>LKW</div>
                    <input
                      type="text"
                      value={newCalendarEntry.lkw}
                      onChange={(e) => setNewCalendarEntry((prev) => ({ ...prev, lkw: e.target.value }))}
                      placeholder="z. B. SPED-411"
                      style={{ width: '100%', border: '1px solid #c7cdd4', borderRadius: 6, padding: '8px 10px', fontSize: 13 }}
                    />
                  </label>
                  <label>
                    <div style={{ marginBottom: 5, fontSize: 12, color: '#4b5563' }}>LKW-Art</div>
                    <select
                      value={newCalendarEntry.art}
                      onChange={(e) => setNewCalendarEntry((prev) => ({ ...prev, art: e.target.value }))}
                      style={{ width: '100%', border: '1px solid #c7cdd4', borderRadius: 6, padding: '8px 10px', fontSize: 13, background: '#fff' }}
                    >
                      <option value="Abruf">Abruf</option>
                      <option value="Versand">Versand</option>
                    </select>
                  </label>
                  <label style={{ gridColumn: '1 / -1' }}>
                    <div style={{ marginBottom: 5, fontSize: 12, color: '#4b5563' }}>Status</div>
                    <select
                      value={newCalendarEntry.status}
                      onChange={(e) => setNewCalendarEntry((prev) => ({ ...prev, status: e.target.value }))}
                      style={{ width: '100%', border: '1px solid #c7cdd4', borderRadius: 6, padding: '8px 10px', fontSize: 13, background: '#fff' }}
                    >
                      {Object.entries(calendarStatusMeta).map(([key, meta]) => (
                        <option key={key} value={key}>{meta.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
              <div style={{ padding: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setCreateCalendarModalOpen(false)}
                  style={{ border: '1px solid #b9c6d5', borderRadius: 6, background: '#fff', padding: '6px 10px', cursor: 'pointer', fontSize: 13 }}
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={saveCalendarEntry}
                  style={{ border: '1px solid #93c5fd', borderRadius: 6, background: '#eff6ff', color: '#1d4ed8', padding: '6px 10px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
                >
                  Eintrag speichern
                </button>
              </div>
            </div>
          </div>
        )}

        {calendarEntryModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 32 }}>
            <div style={{ width: 'min(900px, 94vw)', maxHeight: '88vh', overflow: 'auto', background: '#ffffff', borderRadius: 8, border: '1px solid #cbd5e1' }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700 }}>
                  LKW-Detail: {calendarEntryModal.booking.lkw} | {formatDate(calendarEntryModal.booking.datum)} {calendarEntryModal.booking.start}-{calendarEntryModal.booking.ende}
                </div>
                <button
                  type="button"
                  onClick={() => setCalendarEntryModal(null)}
                  style={{ border: '1px solid #b9c6d5', borderRadius: 6, background: '#fff', padding: '6px 10px', cursor: 'pointer', fontSize: 13 }}
                >
                  Schließen
                </button>
              </div>

              <div style={{ padding: 12, display: 'grid', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(180px, 1fr))', gap: 10 }}>
                  <div style={{ background: '#f8fafc', border: '1px solid #dbe3ec', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Auftrag</div>
                    <div style={{ fontWeight: 700 }}>{productionOrderNo(calendarEntryModal.booking.paId)}</div>
                  </div>
                  <div style={{ background: '#f8fafc', border: '1px solid #dbe3ec', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Projekt</div>
                    <div style={{ fontWeight: 700 }}>{calendarEntryModal.paInfo?.projekt || '-'}</div>
                  </div>
                  <div style={{ background: '#f8fafc', border: '1px solid #dbe3ec', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>LKW-Status</div>
                    <div style={{ fontWeight: 700 }}>{calendarStatusMeta[calendarEntryModal.booking.status]?.label || '-'}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(180px, 1fr))', gap: 10 }}>
                  <div style={{ background: '#ffffff', border: '1px solid #dbe3ec', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Produktion</div>
                    <div>{calendarEntryModal.snapshot?.produktionsStatus || '-'}</div>
                  </div>
                  <div style={{ background: '#ffffff', border: '1px solid #dbe3ec', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Fortschritt</div>
                    <div>{calendarEntryModal.snapshot?.fortschritt ?? '-'}{calendarEntryModal.snapshot ? '%' : ''}</div>
                  </div>
                  <div style={{ background: '#ffffff', border: '1px solid #dbe3ec', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Vorauss. Ende</div>
                    <div>{calendarEntryModal.snapshot?.prognoseFertig ? formatDateTime(calendarEntryModal.snapshot.prognoseFertig) : '-'}</div>
                  </div>
                </div>

                <div style={{ fontWeight: 700 }}>Gestelle und Positionen</div>
                {calendarEntryModal.gestelle.length === 0 ? (
                  <div style={{ color: '#64748b' }}>Keine Gestellbuchungen vorhanden.</div>
                ) : (
                  <div style={{ display: 'grid', gap: 10 }}>
                    {calendarEntryModal.gestelle.map((gestell) => (
                      <div key={`${calendarEntryModal.booking.id}-${gestell.ladungstraeger}`} style={{ border: '1px solid #dbe3ec', borderRadius: 8, overflow: 'hidden' }}>
                        <div style={{ padding: '8px 10px', background: '#eff6ff', borderBottom: '1px solid #dbe3ec', fontWeight: 700 }}>
                          Gestell {gestell.ladungstraeger}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 2fr 0.8fr 0.8fr', background: '#f8fafc', fontSize: 12, fontWeight: 700, color: '#475569' }}>
                          <div style={{ padding: '7px 10px' }}>Position</div>
                          <div style={{ padding: '7px 10px' }}>Artikel</div>
                          <div style={{ padding: '7px 10px' }}>Menge</div>
                          <div style={{ padding: '7px 10px' }}>Einheit</div>
                        </div>
                        {gestell.positionen.map((pos) => (
                          <div key={`${gestell.ladungstraeger}-${pos.position}`} style={{ display: 'grid', gridTemplateColumns: '0.9fr 2fr 0.8fr 0.8fr', borderTop: '1px solid #e2e7ec', fontSize: 13 }}>
                            <div style={{ padding: '7px 10px', fontWeight: 700 }}>{pos.position}</div>
                            <div style={{ padding: '7px 10px' }}>{pos.artikel}</div>
                            <div style={{ padding: '7px 10px' }}>{pos.menge}</div>
                            <div style={{ padding: '7px 10px' }}>{pos.einheit}</div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {reminderModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 31 }}>
            <div style={{ width: 'min(520px, 92vw)', background: '#ffffff', borderRadius: 8, border: '1px solid #cbd5e1', overflow: 'hidden' }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 700 }}>
                Erinnerungs-E-Mail
              </div>
              <div style={{ padding: '12px', fontSize: 14, color: '#334155' }}>
                Soll eine Erinnerungs-E-Mail für
                <b> {reminderModal.ladungstraeger}</b> (Abruf <b>{reminderModal.abruf}</b>) an
                <b> {reminderModal.montageleiter}</b> gesendet werden?
              </div>
              <div style={{ padding: '0 12px 12px 12px', display: 'grid', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <input
                    type="radio"
                    name="reminder-scope"
                    checked={!reminderModal.sendForProject}
                    onChange={() => setReminderModal((prev) => (prev ? { ...prev, sendForProject: false } : prev))}
                  />
                  Nur fuer dieses Gestell ({reminderModal.ladungstraeger})
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <input
                    type="radio"
                    name="reminder-scope"
                    checked={Boolean(reminderModal.sendForProject)}
                    onChange={() => setReminderModal((prev) => (prev ? { ...prev, sendForProject: true } : prev))}
                  />
                  Fuer alle Gestelle im Projekt {reminderModal.projekt}
                  ({gestellData.filter((row) => row.projekt === reminderModal.projekt).length})
                </label>
              </div>
              <div style={{ padding: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setReminderModal(null)}
                  style={{ border: '1px solid #b9c6d5', borderRadius: 6, background: '#fff', padding: '6px 10px', cursor: 'pointer', fontSize: 13 }}
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={sendReminderMail}
                  style={{ border: '1px solid #93c5fd', borderRadius: 6, background: '#eff6ff', color: '#1d4ed8', padding: '6px 10px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
                >
                  Mail senden
                </button>
              </div>
            </div>
          </div>
        )}
        {kommentarModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 32 }}>
            <div style={{ width: 'min(840px, 95vw)', maxHeight: '86vh', overflow: 'auto', background: '#ffffff', borderRadius: 8, border: '1px solid #cbd5e1' }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Kommentare je Abteilung</span>
                <button
                  type="button"
                  onClick={() => setKommentarModal(null)}
                  style={{ border: '1px solid #b9c6d5', borderRadius: 6, background: '#fff', padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}
                >
                  Schliessen
                </button>
              </div>
              <div style={{ padding: '10px 12px', fontSize: 13, color: '#334155', borderBottom: '1px solid #e2e8f0' }}>
                <b>{productionOrderNo(kommentarModal.paId)}</b> | {kommentarModal.projekt}
              </div>
              <div style={{ padding: 12, display: 'grid', gap: 10 }}>
                {kommentarModal.kommentare.length === 0 ? (
                  <div style={{ color: '#64748b' }}>Keine weitergegebenen Kommentare vorhanden.</div>
                ) : kommentarModal.kommentare.map((entry) => (
                  <div key={entry.id} style={{ border: '1px solid #dbe3ec', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ padding: '8px 10px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 8, fontSize: 12 }}>
                      <div><b>Von:</b> {entry.vonAbteilung}</div>
                      <div><b>An:</b> {entry.anAbteilung}</div>
                      <div><b>Zeit:</b> {formatDateTime(entry.erstelltAm)}</div>
                    </div>
                    <div style={{ padding: '8px 10px', fontSize: 13, color: '#0f172a' }}>
                      {entry.kommentar}
                    </div>
                    <div style={{ padding: '6px 10px', borderTop: '1px solid #e2e8f0', fontSize: 11, color: '#64748b' }}>
                      Erfasst von: {entry.erstelltVon}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {packlisteModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 33 }}>
            <div style={{ width: 'min(920px, 95vw)', maxHeight: '88vh', overflow: 'auto', background: '#ffffff', borderRadius: 8, border: '1px solid #cbd5e1' }}>
              {(() => {
                const modalStats = getPacklisteStats(packlisteModal.paId);
                const missingCount = getFehlteileCountForPa(packlisteModal.paId);
                return (
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', background: missingCount > 0 ? '#fff1f2' : (modalStats.allChecked ? '#ecfdf5' : '#fffbeb'), color: missingCount > 0 ? '#9f1239' : (modalStats.allChecked ? '#166534' : '#92400e'), fontSize: 12, fontWeight: 700 }}>
                    Checkliste: {modalStats.checked}/{modalStats.total} Positionen abgehakt {modalStats.allChecked ? '- komplett' : '- bitte vollstaendig abhaken'} | Fehlteile: {missingCount}
                  </div>
                );
              })()}
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700 }}>
                  Packliste - {productionOrderNo(packlisteModal.paId)} | {packlisteModal.projekt}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => sendFehlteileToEinkaufForPa(packlisteModal.paId, packlisteModal.projekt)}
                    disabled={getFehlteileCountForPa(packlisteModal.paId) <= 0}
                    style={getFehlteileCountForPa(packlisteModal.paId) <= 0
                      ? { border: '1px solid #cbd5e1', borderRadius: 6, background: '#f8fafc', color: '#94a3b8', padding: '6px 10px', cursor: 'not-allowed', fontSize: 13, fontWeight: 700 }
                      : { border: '1px solid #e11d48', borderRadius: 6, background: '#ffe4e6', color: '#9f1239', padding: '6px 10px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
                  >
                    Fehlteile an Einkauf melden
                  </button>
                  <button
                    type="button"
                    onClick={printPackliste}
                    style={{ border: '1px solid #93c5fd', borderRadius: 6, background: '#eff6ff', color: '#1d4ed8', padding: '6px 10px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
                  >
                    Drucken
                  </button>
                  <button
                    type="button"
                    onClick={() => setPacklisteModal(null)}
                    style={{ border: '1px solid #b9c6d5', borderRadius: 6, background: '#fff', padding: '6px 10px', cursor: 'pointer', fontSize: 13 }}
                  >
                    Schliessen
                  </button>
                </div>
              </div>
              <div style={{ padding: 12, display: 'grid', gap: 10 }}>
                {packlisteModal.groups.length === 0 ? (
                  <div style={{ color: '#64748b' }}>Keine Packlistenpositionen vorhanden.</div>
                ) : (
                  packlisteModal.groups.map((group) => (
                    <div key={`${packlisteModal.paId}-${group.lieferant}`} style={{ border: '1px solid #dbe3ec', borderRadius: 8, overflow: 'hidden' }}>
                      <div style={{ padding: '8px 10px', background: '#eff6ff', borderBottom: '1px solid #dbe3ec', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Lieferant: {group.lieferant}</span>
                        <span style={{ fontSize: 12, color: '#1d4ed8' }}>Gesamtmenge: {group.sumMenge}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '0.6fr 0.7fr 0.9fr 0.9fr 0.8fr 2fr 0.7fr 0.7fr', background: '#f8fafc', fontSize: 12, fontWeight: 700, color: '#475569' }}>
                        <div style={{ padding: '7px 10px' }}>OK</div>
                        <div style={{ padding: '7px 10px' }}>Fehlt</div>
                        <div style={{ padding: '7px 10px' }}>Fehlmenge</div>
                        <div style={{ padding: '7px 10px' }}>Ladungstraeger</div>
                        <div style={{ padding: '7px 10px' }}>Position</div>
                        <div style={{ padding: '7px 10px' }}>Artikel</div>
                        <div style={{ padding: '7px 10px' }}>Menge</div>
                        <div style={{ padding: '7px 10px' }}>Einheit</div>
                      </div>
                      {group.teile.map((part, idx) => {
                        const maxMissingQty = Math.max(1, Math.round(getPartMengeNumber(part)));
                        const missingQty = Number(packlisteMissingQtyByOrder[packlisteModal.paId]?.[part.partId] || 0);
                        return (
                        <div key={`${group.lieferant}-${part.position}-${idx}`} style={{ display: 'grid', gridTemplateColumns: '0.6fr 0.7fr 0.9fr 0.9fr 0.8fr 2fr 0.7fr 0.7fr', borderTop: '1px solid #e2e7ec', fontSize: 13, alignItems: 'center' }}>
                          <div style={{ padding: '7px 10px' }}>
                            <input
                              type="checkbox"
                              checked={Boolean(packlisteChecksByOrder[packlisteModal.paId]?.[part.partId])}
                              onChange={(e) => setPacklisteTeilChecked(packlisteModal.paId, part.partId, e.target.checked)}
                            />
                          </div>
                          <div style={{ padding: '7px 10px' }}>
                            <input
                              type="checkbox"
                              checked={missingQty > 0}
                              onChange={(e) => setPacklisteTeilMissing(packlisteModal.paId, part.partId, e.target.checked, maxMissingQty)}
                            />
                          </div>
                          <div style={{ padding: '7px 10px' }}>
                            <input
                              type="number"
                              min="0"
                              max={maxMissingQty}
                              value={missingQty}
                              onChange={(e) => setPacklisteTeilMissingQty(packlisteModal.paId, part.partId, e.target.value, maxMissingQty)}
                              style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 6, padding: '4px 6px', fontSize: 12 }}
                            />
                          </div>
                          <div style={{ padding: '7px 10px' }}>{part.ladungstraeger}</div>
                          <div style={{ padding: '7px 10px', fontWeight: 700 }}>{part.position}</div>
                          <div style={{ padding: '7px 10px' }}>{part.artikel}</div>
                          <div style={{ padding: '7px 10px', fontWeight: 700 }}>{part.menge}</div>
                          <div style={{ padding: '7px 10px' }}>{part.einheit}</div>
                        </div>
                      );
                      })}
                    </div>
                  ))
                )}
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
      </main>
    </div>
  );
}









