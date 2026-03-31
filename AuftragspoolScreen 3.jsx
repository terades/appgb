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

const auftragszentrumMitarbeiter = ['Max Mustermann', 'Anna Becker', 'Lukas Meyer', 'Fatma Yildiz', 'Tobias Klein'];
const konstruktionMitarbeiter = ['Anna Becker', 'Tobias Klein', 'Fatma Yildiz', 'Jonas Richter', 'Nina Schulz'];

const orderData = [
  {
    id: 'PA-2026-1101',
    auftrag: 'KN0171B-BTL60110',
    status: 'in Konstruktion',
    konstrukteur: 'Jonas Richter',
    statusSollBis: '2026-02-18',
    dokumenteVorhanden: 5,
    produkte: [
      { typ: 'Fassaden', stueckzahl: 24, status: 'in Konstruktion', geplanteStunden: 18 },
    ],
    dokumente: { Werksauftrag: true, Fluegelliste: true, Positionsplan: false },
    faelligBis: '2026-02-24',
    produktionsstart: '2026-02-25 06:00',
    geplanteStunden: 18,
  },
  {
    id: 'PA-2026-1102',
    auftrag: 'BI2285A-BTL61520',
    status: 'in Konstruktion',
    konstrukteur: 'Anna Becker',
    statusSollBis: '2026-02-20',
    dokumenteVorhanden: 4,
    produkte: [
      { typ: 'Fenster', stueckzahl: 12, status: 'in Konstruktion', geplanteStunden: 8 },
      { typ: 'Tueren', stueckzahl: 4, status: 'in Konstruktion', geplanteStunden: 4 },
    ],
    dokumente: { Werksauftrag: true, Fluegelliste: false, Positionsplan: false },
    faelligBis: '2026-02-26',
    produktionsstart: '2026-02-27 14:00',
    geplanteStunden: 12,
  },
  {
    id: 'PA-2026-1103',
    auftrag: 'RR0160A-BTL66200',
    status: 'in Konstruktion',
    konstrukteur: 'Nina Schulz',
    statusSollBis: '2026-02-22',
    dokumenteVorhanden: 7,
    produkte: [
      { typ: 'AWE', stueckzahl: 16, status: 'in Konstruktion', geplanteStunden: 20 },
    ],
    dokumente: { Werksauftrag: true, Fluegelliste: true, Positionsplan: true },
    faelligBis: '2026-03-02',
    produktionsstart: '2026-03-03 06:00',
    geplanteStunden: 20,
  },
  {
    id: 'PA-2026-1104',
    auftrag: 'TU7731D-BTL31010',
    status: 'in Konstruktion',
    konstrukteur: 'Fatma Yildiz',
    statusSollBis: '2026-02-23',
    dokumenteVorhanden: 3,
    produkte: [
      { typ: 'Tueren', stueckzahl: 8, status: 'in Konstruktion', geplanteStunden: 8 },
    ],
    dokumente: { Werksauftrag: true, Fluegelliste: true, Positionsplan: false },
    faelligBis: '2026-03-03',
    produktionsstart: '2026-03-04 06:00',
    geplanteStunden: 8,
  },
  {
    id: 'PA-2026-1105',
    auftrag: 'FA1150C-BTL71012',
    status: 'in Konstruktion',
    konstrukteur: 'Tobias Klein',
    statusSollBis: '2026-02-25',
    dokumenteVorhanden: 4,
    produkte: [
      { typ: 'Fassaden', stueckzahl: 20, status: 'in Konstruktion', geplanteStunden: 18 },
      { typ: 'Fenster', stueckzahl: 6, status: 'in Konstruktion', geplanteStunden: 6 },
    ],
    dokumente: { Werksauftrag: true, Fluegelliste: true, Positionsplan: false },
    faelligBis: '2026-03-05',
    produktionsstart: '2026-03-02 06:00',
    geplanteStunden: 24,
  },
  {
    id: 'PA-2026-1106',
    auftrag: 'FE4470E-BTL34120',
    status: 'in Konstruktion',
    konstrukteur: 'Jonas Richter',
    statusSollBis: '2026-02-27',
    dokumenteVorhanden: 6,
    produkte: [
      { typ: 'Fenster', stueckzahl: 10, status: 'in Konstruktion', geplanteStunden: 10 },
    ],
    dokumente: { Werksauftrag: true, Fluegelliste: false, Positionsplan: true },
    faelligBis: '2026-03-06',
    produktionsstart: '2026-03-09 06:00',
    geplanteStunden: 10,
  },
  {
    id: 'PA-2026-1107',
    auftrag: 'GH2201F-BTL98010',
    status: 'AV Auftragspool',
    konstrukteurUebergebenVon: 'Nina Schulz',
    statusSollBis: '2026-02-24',
    dokumenteVorhanden: 6,
    produkte: [
      { typ: 'AWE', stueckzahl: 11, status: 'AV Auftragspool', geplanteStunden: 9 },
      { typ: 'Fenster', stueckzahl: 5, status: 'AV Auftragspool', geplanteStunden: 4 },
    ],
    dokumente: { Werksauftrag: true, Fluegelliste: true, Positionsplan: false },
    montageterminOriginal: '2026-03-10',
    kommentare: [
      {
        id: 'demo-kom-1107-1',
        rolle: 'Konstruktion',
        autor: 'Nina Schulz',
        text: 'Werkplanung geprüft, Übergabe an AV vorbereitet.',
        createdAt: '2026-02-24T09:15:00',
      },
    ],
    faelligBis: '2026-03-02',
    produktionsstart: '2026-03-13 06:00',
    geplanteStunden: 13,
  },
  {
    id: 'PA-2026-1108',
    auftrag: 'LM7710A-BTL54100',
    status: 'AV Auftragspool',
    konstrukteurUebergebenVon: 'Anna Becker',
    statusSollBis: '2026-02-25',
    dokumenteVorhanden: 5,
    produkte: [
      { typ: 'Tueren', stueckzahl: 7, status: 'AV Auftragspool', geplanteStunden: 6 },
    ],
    dokumente: { Werksauftrag: true, Fluegelliste: true, Positionsplan: false },
    faelligBis: '2026-03-17',
    produktionsstart: '2026-03-18 14:00',
    geplanteStunden: 6,
  },
  {
    id: 'PA-2026-1109',
    auftrag: 'QR3309D-BTL21970',
    status: 'AV Auftragspool',
    konstrukteurUebergebenVon: 'Tobias Klein',
    statusSollBis: '2026-02-26',
    dokumenteVorhanden: 7,
    produkte: [
      { typ: 'Fassaden', stueckzahl: 16, status: 'AV Auftragspool', geplanteStunden: 15 },
    ],
    dokumente: { Werksauftrag: true, Fluegelliste: true, Positionsplan: true },
    kommentare: [
      {
        id: 'demo-kom-1109-1',
        rolle: 'Konstruktion',
        autor: 'Tobias Klein',
        text: 'Zeichnung angepasst, Freigabe für AV erfolgt.',
        createdAt: '2026-02-26T14:25:00',
      },
    ],
    faelligBis: '2026-03-20',
    produktionsstart: '2026-03-23 06:00',
    geplanteStunden: 15,
  },
  {
    id: 'PA-2026-1110',
    auftrag: 'ST5581B-BTL32020',
    status: 'AV Auftragspool',
    konstrukteurUebergebenVon: 'Fatma Yildiz',
    statusSollBis: '2026-02-27',
    dokumenteVorhanden: 4,
    produkte: [
      { typ: 'Fenster', stueckzahl: 13, status: 'AV Auftragspool', geplanteStunden: 9 },
      { typ: 'AWE', stueckzahl: 3, status: 'AV Auftragspool', geplanteStunden: 2 },
    ],
    dokumente: { Werksauftrag: true, Fluegelliste: false, Positionsplan: true },
    montageterminOriginal: '2026-03-20',
    faelligBis: '2026-03-03',
    produktionsstart: '2026-03-25 06:00',
    geplanteStunden: 11,
  },
  {
    id: 'PA-2026-1111',
    auftrag: 'UV9904C-BTL20330',
    status: 'in Bearbeitung',
    konstrukteurUebergebenVon: 'Jonas Richter',
    bearbeiter: 'Anna Becker',
    statusSollBis: '2026-02-28',
    dokumenteVorhanden: 5,
    produkte: [
      { typ: 'Tueren', stueckzahl: 10, status: 'in Bearbeitung', geplanteStunden: 7 },
      { typ: 'Fassaden', stueckzahl: 4, status: 'in Bearbeitung', geplanteStunden: 5 },
    ],
    dokumente: { Werksauftrag: true, Fluegelliste: true, Positionsplan: false },
    faelligBis: '2026-03-10',
    produktionsstart: '2026-03-11 06:00',
    geplanteStunden: 12,
  },
  {
    id: 'PA-2026-1112',
    auftrag: 'WX1200E-BTL76770',
    status: 'in Bearbeitung',
    konstrukteurUebergebenVon: 'Nina Schulz',
    bearbeiter: 'Lukas Meyer',
    statusSollBis: '2026-03-01',
    dokumenteVorhanden: 3,
    produkte: [
      { typ: 'AWE', stueckzahl: 9, status: 'in Bearbeitung', geplanteStunden: 6 },
    ],
    dokumente: { Werksauftrag: true, Fluegelliste: true, Positionsplan: true },
    faelligBis: '2026-03-26',
    produktionsstart: '2026-03-27 06:00',
    geplanteStunden: 6,
  },
  {
    id: 'PA-2026-1113',
    auftrag: 'XM4432D-BTL55870',
    status: 'in Bearbeitung',
    konstrukteurUebergebenVon: 'Anna Becker',
    bearbeiter: 'Fatma Yildiz',
    statusSollBis: '2026-03-02',
    dokumenteVorhanden: 6,
    produkte: [
      { typ: 'Fassaden', stueckzahl: 14, status: 'in Bearbeitung', geplanteStunden: 13 },
    ],
    dokumente: { Werksauftrag: true, Fluegelliste: true, Positionsplan: true },
    montageterminOriginal: '2026-03-27',
    faelligBis: '2026-03-30',
    produktionsstart: '2026-03-31 06:00',
    geplanteStunden: 13,
  },
  {
    id: 'PA-2026-1114',
    auftrag: 'OP9910H-BTL40700',
    status: 'in Bearbeitung',
    konstrukteurUebergebenVon: 'Tobias Klein',
    bearbeiter: 'Tobias Klein',
    statusSollBis: '2026-03-03',
    dokumenteVorhanden: 5,
    produkte: [
      { typ: 'Fenster', stueckzahl: 11, status: 'in Bearbeitung', geplanteStunden: 10 },
    ],
    dokumente: { Werksauftrag: true, Fluegelliste: true, Positionsplan: false },
    faelligBis: '2026-04-01',
    produktionsstart: '2026-04-02 06:00',
    geplanteStunden: 10,
  },
  {
    id: 'PA-2026-1115',
    auftrag: 'TT4100K-BTL33880',
    status: 'AV Arbeit fertig',
    konstrukteurUebergebenVon: 'Fatma Yildiz',
    freigegebenVon: 'Lukas Meyer',
    statusSollBis: '2026-03-04',
    dokumenteVorhanden: 7,
    produkte: [
      { typ: 'AWE', stueckzahl: 8, status: 'AV Arbeit fertig', geplanteStunden: 7 },
    ],
    dokumente: { Werksauftrag: true, Fluegelliste: true, Positionsplan: true },
    faelligBis: '2026-03-27',
    produktionsstart: '2026-03-28 06:00',
    geplanteStunden: 7,
  },
  {
    id: 'PA-2026-1116',
    auftrag: 'GL7300R-BTL12650',
    status: 'bestellt',
    statusSollBis: '2026-02-26',
    dokumenteVorhanden: 2,
    produkte: [
      { typ: 'Tueren', stueckzahl: 9, status: 'bestellt', geplanteStunden: 8 },
    ],
    dokumente: { Werksauftrag: false, Fluegelliste: true, Positionsplan: false },
    faelligBis: '2026-03-10',
    produktionsstart: '2026-03-11 14:00',
    geplanteStunden: 8,
  },
  {
    id: 'PA-2026-1117',
    auftrag: 'NV0020M-BTL44390',
    status: 'bestellt',
    statusSollBis: '2026-03-01',
    dokumenteVorhanden: 3,
    produkte: [
      { typ: 'Fassaden', stueckzahl: 6, status: 'bestellt', geplanteStunden: 5 },
    ],
    dokumente: { Werksauftrag: false, Fluegelliste: true, Positionsplan: true },
    faelligBis: '2026-03-12',
    produktionsstart: '2026-03-13 06:00',
    geplanteStunden: 5,
  },
  {
    id: 'PA-2026-1118',
    auftrag: 'BK8802P-BTL59110',
    status: 'in Konstruktion',
    konstrukteur: 'Nina Schulz',
    statusSollBis: '2026-03-05',
    dokumenteVorhanden: 4,
    produkte: [
      { typ: 'Fenster', stueckzahl: 15, status: 'in Konstruktion', geplanteStunden: 11 },
      { typ: 'Tueren', stueckzahl: 3, status: 'in Konstruktion', geplanteStunden: 3 },
    ],
    dokumente: { Werksauftrag: true, Fluegelliste: true, Positionsplan: false },
    faelligBis: '2026-03-31',
    produktionsstart: '2026-04-01 06:00',
    geplanteStunden: 14,
  },
  {
    id: 'PA-2026-1119',
    auftrag: 'CR5501L-BTL47200',
    status: 'in Konstruktion',
    konstrukteur: 'Jonas Richter',
    statusSollBis: '2026-03-06',
    dokumenteVorhanden: 6,
    produkte: [
      { typ: 'AWE', stueckzahl: 12, status: 'in Konstruktion', geplanteStunden: 10 },
    ],
    dokumente: { Werksauftrag: true, Fluegelliste: false, Positionsplan: true },
    faelligBis: '2026-04-03',
    produktionsstart: '2026-04-06 06:00',
    geplanteStunden: 10,
  },
  {
    id: 'PA-2026-1120',
    auftrag: 'DM1240Q-BTL33820',
    status: 'AV Auftragspool',
    konstrukteurUebergebenVon: 'Tobias Klein',
    statusSollBis: '2026-03-04',
    dokumenteVorhanden: 5,
    produkte: [
      { typ: 'Fassaden', stueckzahl: 9, status: 'AV Auftragspool', geplanteStunden: 8 },
      { typ: 'Fenster', stueckzahl: 4, status: 'AV Auftragspool', geplanteStunden: 3 },
    ],
    dokumente: { Werksauftrag: true, Fluegelliste: true, Positionsplan: true },
    kommentare: [
      {
        id: 'demo-kom-1120-1',
        rolle: 'Konstruktion',
        autor: 'Tobias Klein',
        text: 'Bauteilliste finalisiert und an AV übergeben.',
        createdAt: '2026-03-04T10:40:00',
      },
    ],
    faelligBis: '2026-03-10',
    produktionsstart: '2026-03-19 06:00',
    geplanteStunden: 11,
  },
  {
    id: 'PA-2026-1121',
    auftrag: 'EN3320H-BTL70910',
    status: 'AV Auftragspool',
    konstrukteurUebergebenVon: 'Fatma Yildiz',
    statusSollBis: '2026-03-07',
    dokumenteVorhanden: 4,
    produkte: [
      { typ: 'Tueren', stueckzahl: 10, status: 'AV Auftragspool', geplanteStunden: 7 },
    ],
    dokumente: { Werksauftrag: true, Fluegelliste: true, Positionsplan: false },
    faelligBis: '2026-03-28',
    produktionsstart: '2026-03-30 14:00',
    geplanteStunden: 7,
  },
  {
    id: 'PA-2026-1122',
    auftrag: 'FP7400J-BTL26560',
    status: 'AV Auftragspool',
    konstrukteurUebergebenVon: 'Anna Becker',
    statusSollBis: '2026-03-08',
    dokumenteVorhanden: 7,
    produkte: [
      { typ: 'AWE', stueckzahl: 14, status: 'AV Auftragspool', geplanteStunden: 11 },
      { typ: 'Fassaden', stueckzahl: 5, status: 'AV Auftragspool', geplanteStunden: 4 },
    ],
    dokumente: { Werksauftrag: true, Fluegelliste: true, Positionsplan: true },
    montageterminOriginal: '2026-03-31',
    kommentare: [
      {
        id: 'demo-kom-1122-1',
        rolle: 'Konstruktion',
        autor: 'Anna Becker',
        text: 'Materialdetails nachgezogen, Übergabe dokumentiert.',
        createdAt: '2026-03-08T11:05:00',
      },
    ],
    faelligBis: '2026-04-02',
    produktionsstart: '2026-04-03 06:00',
    geplanteStunden: 15,
  },
  {
    id: 'PA-2026-1123',
    auftrag: 'GS1180R-BTL84120',
    status: 'in Bearbeitung',
    konstrukteurUebergebenVon: 'Nina Schulz',
    bearbeiter: 'Anna Becker',
    statusSollBis: '2026-03-05',
    dokumenteVorhanden: 6,
    produkte: [
      { typ: 'Fenster', stueckzahl: 18, status: 'in Bearbeitung', geplanteStunden: 12 },
    ],
    dokumente: { Werksauftrag: true, Fluegelliste: true, Positionsplan: true },
    faelligBis: '2026-03-21',
    produktionsstart: '2026-03-23 06:00',
    geplanteStunden: 12,
  },
  {
    id: 'PA-2026-1124',
    auftrag: 'HT9005S-BTL15440',
    status: 'in Bearbeitung On Hold',
    konstrukteurUebergebenVon: 'Jonas Richter',
    bearbeiter: 'Lukas Meyer',
    statusSollBis: '2026-03-06',
    dokumenteVorhanden: 5,
    produkte: [
      { typ: 'Tueren', stueckzahl: 9, status: 'in Bearbeitung On Hold', geplanteStunden: 8 },
      { typ: 'AWE', stueckzahl: 2, status: 'in Bearbeitung On Hold', geplanteStunden: 2 },
    ],
    dokumente: { Werksauftrag: true, Fluegelliste: false, Positionsplan: true },
    faelligBis: '2026-03-27',
    produktionsstart: '2026-03-30 06:00',
    geplanteStunden: 10,
  },
  {
    id: 'PA-2026-1125',
    auftrag: 'IU5560T-BTL50300',
    status: 'AV Arbeit fertig',
    konstrukteurUebergebenVon: 'Tobias Klein',
    freigegebenVon: 'Fatma Yildiz',
    statusSollBis: '2026-03-09',
    dokumenteVorhanden: 8,
    produkte: [
      { typ: 'Fassaden', stueckzahl: 7, status: 'AV Arbeit fertig', geplanteStunden: 6 },
      { typ: 'Fenster', stueckzahl: 6, status: 'AV Arbeit fertig', geplanteStunden: 5 },
    ],
    dokumente: { Werksauftrag: true, Fluegelliste: true, Positionsplan: true },
    faelligBis: '2026-04-04',
    produktionsstart: '2026-04-06 06:00',
    geplanteStunden: 11,
  },
  {
    id: 'PA-2026-1126',
    auftrag: 'JV4201U-BTL99210',
    status: 'bestellt',
    statusSollBis: '2026-03-10',
    dokumenteVorhanden: 2,
    produkte: [
      { typ: 'Tueren', stueckzahl: 8, status: 'bestellt', geplanteStunden: 6 },
    ],
    dokumente: { Werksauftrag: false, Fluegelliste: true, Positionsplan: false },
    faelligBis: '2026-04-08',
    produktionsstart: '2026-04-09 14:00',
    geplanteStunden: 6,
  },
  {
    id: 'PA-2026-1127',
    auftrag: 'KW3077V-BTL61830',
    status: 'bestellt',
    statusSollBis: '2026-03-12',
    dokumenteVorhanden: 1,
    produkte: [
      { typ: 'AWE', stueckzahl: 11, status: 'bestellt', geplanteStunden: 7 },
    ],
    dokumente: { Werksauftrag: false, Fluegelliste: false, Positionsplan: true },
    faelligBis: '2026-04-10',
    produktionsstart: '2026-04-13 06:00',
    geplanteStunden: 7,
  },
];

function getSecondaryProduktTyp(existingTypes = []) {
  const typeOrder = ['Fassaden', 'Fenster', 'Tueren', 'AWE'];
  return typeOrder.find((typ) => !existingTypes.includes(typ)) || 'AWE';
}

function parseProjektAndBtl(auftrag = '') {
  const match = auftrag.match(/^(.*)-BTL(\d+)$/);
  if (!match) {
    return null;
  }
  return { projektKey: match[1], btl: Number(match[2] || 0), width: match[2].length || 5 };
}

function formatBtlNumber(value, width = 5) {
  return String(Math.max(0, Number(value) || 0)).padStart(width, '0');
}

function buildAuftragWithBtl(projektKey, btl, width = 5) {
  return `${projektKey}-BTL${formatBtlNumber(btl, width)}`;
}

function buildNextDemoId(usedIds, nextNumericId) {
  let running = nextNumericId;
  while (usedIds.has(`PA-2026-${String(running).padStart(4, '0')}`)) {
    running += 1;
  }
  return running;
}

function expandAuftragspoolProjectsWithMultipleBtl(inputOrders) {
  const orders = [...inputOrders];
  const usedIds = new Set(orders.map((order) => order.id));
  let nextNumericId = Math.max(
    1100,
    ...orders.map((order) => Number((order.id || '').split('-').pop()) || 0)
  ) + 1;

  const poolByProjekt = new Map();
  orders.forEach((order) => {
    if (order.status !== 'AV Auftragspool') {
      return;
    }
    const parsed = parseProjektAndBtl(order.auftrag);
    if (!parsed) {
      return;
    }
    if (!poolByProjekt.has(parsed.projektKey)) {
      poolByProjekt.set(parsed.projektKey, []);
    }
    poolByProjekt.get(parsed.projektKey).push({ order, parsed });
  });

  poolByProjekt.forEach((items) => {
    if (items.length >= 2) {
      return;
    }
    const source = items[0];
    if (!source) {
      return;
    }
    const nextIdNumeric = buildNextDemoId(usedIds, nextNumericId);
    nextNumericId = nextIdNumeric + 1;
    const nextId = `PA-2026-${String(nextIdNumeric).padStart(4, '0')}`;
    usedIds.add(nextId);

    const nextBtl = (source.parsed.btl || 10000) + 17;
    const clone = {
      ...source.order,
      id: nextId,
      auftrag: buildAuftragWithBtl(source.parsed.projektKey, nextBtl, source.parsed.width),
      geplanteStunden: Math.max(2, (Number(source.order.geplanteStunden) || 8) - 1),
      produkte: (source.order.produkte || []).map((produkt) => ({
        ...produkt,
        stueckzahl: Math.max(1, (Number(produkt.stueckzahl) || 4) - 1),
      })),
      kommentare: [
        ...(source.order.kommentare || []),
        {
          id: `${nextId}-demo-konstruktion`,
          rolle: 'Konstruktion',
          autor: source.order.konstrukteurUebergebenVon || source.order.konstrukteur || konstruktionMitarbeiter[0],
          text: 'Zusatz-BTL für dasselbe Projekt an AV übergeben.',
          createdAt: new Date().toISOString(),
        },
      ],
    };
    orders.push(clone);
  });

  return orders;
}

function ensureTwoBauteillistenForDemo(inputOrders) {
  return inputOrders.map((order) => {
    if (!Array.isArray(order.produkte) || order.produkte.length >= 2) {
      return order;
    }
    const first = order.produkte[0];
    const secondaryType = getSecondaryProduktTyp([first?.typ].filter(Boolean));
    const baseHours = Math.max(2, Math.round((Number(order.geplanteStunden) || Number(first?.geplanteStunden) || 6) * 0.35));
    const secondProdukt = {
      typ: secondaryType,
      stueckzahl: Math.max(1, Math.round((Number(first?.stueckzahl) || 6) * 0.4)),
      status: first?.status || order.status,
      geplanteStunden: baseHours,
      vorabdispoGemacht: Boolean(order.vorabdispoGemacht),
      vorabdispoVon: order.vorabdispoVon || '',
    };
    return {
      ...order,
      produkte: [first, secondProdukt],
    };
  });
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateFromDate(date) {
  if (!date || Number.isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateTime(value) {
  if (!value || typeof value !== 'string') {
    return value || '-';
  }
  const date = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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
        <span style={{ fontSize: 14 }}>{open ? 'v' : '>'}</span>
      </div>
      {open && (
        <div style={{ paddingLeft: 8 }}>
          {items.map((item) => {
            const canSelect = item === 'Auftragspool' || item === 'Projektuebersicht';
            const active = item === activeItem;
            return (
              <div
                key={`${title}-${item}`}
                onClick={() => {
                  if (canSelect) {
                    onItemClick(item);
                  }
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

function getStatusPillStyles(status) {
  if (status === 'bestellt') {
    return {
      background: '#fff6db',
      color: '#8a6300',
      border: '1px solid #f5d78d',
    };
  }
  if (status === 'AV Auftragspool') {
    return {
      background: '#e0e7ff',
      color: '#3730a3',
      border: '1px solid #c7d2fe',
    };
  }
  if (status === 'AV Arbeit fertig') {
    return {
      background: '#e8f5ea',
      color: '#1f5130',
      border: '1px solid #b9ddc3',
    };
  }
  if (status === 'in Bearbeitung') {
    return {
      background: '#dcf2ff',
      color: '#0f5f84',
      border: '1px solid #7bc2e4',
    };
  }
  if (status === 'in Bearbeitung On Hold') {
    return {
      background: '#fef3c7',
      color: '#92400e',
      border: '1px solid #fcd34d',
    };
  }
  return {
    background: '#ffe9c7',
    color: '#8a4b00',
    border: '1px solid #f1c27a',
  };
}

function parseDateLoose(value) {
  if (!value) {
    return null;
  }
  const normalized = value.includes('T')
    ? value
    : (value.includes(' ') ? value.replace(' ', 'T') : `${value}T23:59:59`);
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function getIsoWeekNumber(date = new Date()) {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  return Math.ceil((((utcDate - yearStart) / 86400000) + 1) / 7);
}

function getWeekStartMonday(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const shift = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - shift);
  return date;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getFertigungsendeDate(order) {
  const montagetermin = parseDateLoose(order.faelligBis);
  if (!montagetermin) {
    return null;
  }
  return addDays(montagetermin, -5);
}

function getUebergabeDatum(order) {
  return order.uebergabeDatum || order.statusSollBis || '';
}

function getTerminVerschiebung(order) {
  const original = parseDateLoose(order.montageterminOriginal || order.abrufterminOriginal || '');
  const current = parseDateLoose(order.faelligBis);
  if (!original || !current) {
    return { shifted: false, label: '' };
  }
  const dayMs = 86400000;
  const diffDays = Math.round((current.getTime() - original.getTime()) / dayMs);
  if (diffDays === 0) {
    return { shifted: false, label: '' };
  }
  if (diffDays > 0) {
    return { shifted: true, label: `Termin +${diffDays} T` };
  }
  return { shifted: true, label: `Termin ${diffDays} T` };
}

function isTerminAenderungQuittiert(order) {
  if (!order.terminAenderungQuittiert) {
    return false;
  }
  const terminShift = getTerminVerschiebung(order);
  return terminShift.shifted;
}

function isDateWithinNextDays(value, days) {
  const date = parseDateLoose(value);
  if (!date) {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = addDays(today, days);
  horizon.setHours(23, 59, 59, 999);
  return date >= today && date <= horizon;
}

function isOrderDelayed(order) {
  const now = new Date();
  const statusDeadline = parseDateLoose(order.statusSollBis);
  const releaseDeadline = parseDateLoose(order.faelligBis);
  const statusOverdue = statusDeadline ? now > statusDeadline : false;
  const releaseOverdue = releaseDeadline ? now > releaseDeadline : false;
  return statusOverdue || releaseOverdue;
}

function getAbrufMeta(value) {
  const date = parseDateLoose(value);
  return getDateMeta(date);
}

function getDateMeta(date) {
  if (!date) {
    return {
      text: 'kein Termin',
      style: { background: '#e5e7eb', color: '#374151', border: '1px solid #d1d5db' },
    };
  }
  const now = new Date();
  const dayMs = 86400000;
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / dayMs);
  if (diffDays < 0) {
    return {
      text: `${Math.abs(diffDays)} T ueberfaellig`,
      style: { background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' },
    };
  }
  if (diffDays <= 2) {
    return {
      text: `in ${diffDays} T`,
      style: { background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' },
    };
  }
  return {
    text: `in ${diffDays} T`,
    style: { background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' },
  };
}

function getAuftragspoolFristMeta(order) {
  const fertigungsende = getFertigungsendeDate(order);
  if (!fertigungsende) {
    return {
      level: 'none',
      rowBackground: '',
      badge: null,
    };
  }
  const now = new Date();
  const dayMs = 86400000;
  const diffDays = Math.ceil((fertigungsende.getTime() - now.getTime()) / dayMs);
  if (diffDays <= 14) {
    return {
      level: 'red',
      rowBackground: '#fff1f2',
      badge: {
        text: '<= 2 Wochen bis Fertigungsende',
        style: { background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' },
      },
    };
  }
  if (diffDays <= 21) {
    return {
      level: 'orange',
      rowBackground: '#fff7ed',
      badge: {
        text: '<= 3 Wochen bis Fertigungsende',
        style: { background: '#ffedd5', color: '#9a3412', border: '1px solid #fdba74' },
      },
    };
  }
  return {
    level: 'none',
    rowBackground: '',
    badge: null,
  };
}

function isVorabdispoDone(order) {
  return Boolean(order.vorabdispoGemacht);
}

function getVorabdispoBadgeMeta(order) {
  if (isVorabdispoDone(order)) {
    return {
      text: `VORABDISPO: JA${order.vorabdispoVon ? ` (${order.vorabdispoVon})` : ''}`,
      style: {
        background: '#dcfce7',
        color: '#166534',
        border: '1px solid #86efac',
      },
    };
  }
  return {
    text: 'VORABDISPO: NEIN',
    style: {
      background: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fca5a5',
    },
  };
}

function getLatestKonstruktionKommentar(order) {
  const kommentare = (order.kommentare || []).filter((kommentar) => kommentar.rolle === 'Konstruktion');
  if (kommentare.length === 0) {
    return null;
  }
  return kommentare[kommentare.length - 1];
}

const bearbeitungsstandChecklist = [
  { key: 'unterlagenGeprueft', label: 'Unterlagen geprüft' },
  { key: 'materialbedarfGeprueft', label: 'Materialbedarf geprüft' },
  { key: 'bestellvorschlagErstellt', label: 'Bestellvorschlag erstellt' },
  { key: 'liefertermineGeprueft', label: 'Liefertermine geprüft' },
  { key: 'kapazitaetGeprueft', label: 'Kapazität geprüft' },
  { key: 'fertigungVorbereitet', label: 'Fertigung vorbereitet' },
  { key: 'internAbgestimmt', label: 'Intern abgestimmt' },
  { key: 'freigabeVorbereitet', label: 'Freigabe vorbereitet' },
];

function createInitialBearbeitungsstand() {
  return bearbeitungsstandChecklist.reduce((acc, item) => {
    acc[item.key] = false;
    return acc;
  }, {});
}

function getBearbeitungsstandProgress(order) {
  const stand = order.bearbeitungsstand || {};
  const done = bearbeitungsstandChecklist.filter((item) => {
    const value = stand[item.key];
    if (typeof value === 'object' && value !== null) {
      return Boolean(value.done);
    }
    return Boolean(value);
  }).length;
  return { done, total: bearbeitungsstandChecklist.length };
}

function getBearbeitungsstandDoneItems(order) {
  const stand = order.bearbeitungsstand || {};
  return bearbeitungsstandChecklist.filter((item) => {
    const value = stand[item.key];
    if (typeof value === 'object' && value !== null) {
      return Boolean(value.done);
    }
    return Boolean(value);
  });
}

function getOriginalGeplanteStunden(order) {
  const original = Number(order?.ursprungsGeplanteStunden);
  if (Number.isFinite(original)) {
    return original;
  }
  return Number(order?.geplanteStunden) || 0;
}

function isStundenNachgebessert(order) {
  return Number(order?.geplanteStunden || 0) !== getOriginalGeplanteStunden(order);
}

export default function AuftragspoolScreen() {
  const [orders, setOrders] = useState(() => (
    ensureTwoBauteillistenForDemo(
      expandAuftragspoolProjectsWithMultipleBtl(orderData)
    ).map((order) => ({
      ...order,
      ursprungsGeplanteStunden: getOriginalGeplanteStunden(order),
      terminverschiebungen: Array.isArray(order.terminverschiebungen) ? order.terminverschiebungen : [],
    }))
  ));
  const [forecastOpen, setForecastOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('alle');
  const [produktFilter, setProduktFilter] = useState('alle');
  const [mitarbeiterFilter, setMitarbeiterFilter] = useState('alle');
  const [searchFilter, setSearchFilter] = useState('');
  const [activeAvUser, setActiveAvUser] = useState('Max Mustermann');
  const [expandedOrderIds, setExpandedOrderIds] = useState([]);
  const [draggedOrderId, setDraggedOrderId] = useState('');
  const [draggedSource, setDraggedSource] = useState('');
  const [isBearbeitungDropActive, setIsBearbeitungDropActive] = useState(false);
  const [isOnHoldDropActive, setIsOnHoldDropActive] = useState(false);
  const [finishModalOrderId, setFinishModalOrderId] = useState('');
  const [finishChecklist, setFinishChecklist] = useState({
    logikalUebergabe: false,
    maschinendateien: false,
    auftraegeGeprueft: false,
    bestellvorschlaege: false,
  });
  const [onHoldModalOrderId, setOnHoldModalOrderId] = useState('');
  const [onHoldComment, setOnHoldComment] = useState('');
  const [bearbeitungsstandModalOrderId, setBearbeitungsstandModalOrderId] = useState('');
  const [commentDrafts, setCommentDrafts] = useState({});
  const [activeMenuItem, setActiveMenuItem] = useState('Auftragspool');
  const [expandedProjektKeys, setExpandedProjektKeys] = useState([]);
  const [projectDetailOrderId, setProjectDetailOrderId] = useState('');
  const [projectDetailRole, setProjectDetailRole] = useState('AV');
  const [projectDetailComment, setProjectDetailComment] = useState('');
  const [terminModal, setTerminModal] = useState(null);
  const [stundenEditDrafts, setStundenEditDrafts] = useState({});
  const [projektSearchFilter, setProjektSearchFilter] = useState('');
  const [projektStatusFilter, setProjektStatusFilter] = useState('alle');
  const [projektMitarbeiterFilter, setProjektMitarbeiterFilter] = useState('alle');
  const [projectDetailDraft, setProjectDetailDraft] = useState({
    status: '',
    bearbeiter: '',
    statusSollBis: '',
    faelligBis: '',
    produktionsstart: '',
    geplanteStunden: 0,
    vorabdispoGemacht: false,
  });
  const aktuelleKw = getIsoWeekNumber();
  const erwartungHorizonDays = 28;
  const isProjektuebersichtView = activeMenuItem === 'Projektuebersicht';

  const mitarbeiterOptions = useMemo(() => {
    const names = new Set([
      ...auftragszentrumMitarbeiter,
      ...konstruktionMitarbeiter,
    ]);
    orders.forEach((order) => {
      [order.bearbeiter, order.konstrukteur, order.konstrukteurUebergebenVon, order.freigegebenVon]
        .filter(Boolean)
        .forEach((name) => names.add(name));
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'de'));
  }, [orders]);

  function orderIncludesMitarbeiter(order, nameFilter) {
    if (nameFilter === 'alle') {
      return true;
    }
    return [
      order.bearbeiter,
      order.konstrukteur,
      order.konstrukteurUebergebenVon,
      order.freigegebenVon,
    ].includes(nameFilter);
  }

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        if (statusFilter === 'alle') {
          return true;
        }
        if (statusFilter === 'avBereit') {
          return order.status === 'AV Auftragspool' || order.status === 'in Bearbeitung' || order.status === 'in Bearbeitung On Hold';
        }
        return order.status === statusFilter;
      })
      .filter((order) => {
        if (produktFilter === 'alle') {
          return true;
        }
        return order.produkte.some((produkt) => produkt.typ === produktFilter);
      })
      .filter((order) => {
        if (!searchFilter.trim()) {
          return true;
        }
        const query = searchFilter.toLowerCase();
        return (
          order.id.toLowerCase().includes(query) ||
          order.auftrag.toLowerCase().includes(query)
        );
      })
      .filter((order) => orderIncludesMitarbeiter(order, mitarbeiterFilter))
      .sort((a, b) => {
        const bestelltA = a.status === 'bestellt' ? 1 : 0;
        const bestelltB = b.status === 'bestellt' ? 1 : 0;
        if (bestelltA !== bestelltB) {
          return bestelltA - bestelltB;
        }
        const dateA = getFertigungsendeDate(a);
        const dateB = getFertigungsendeDate(b);
        const timeA = dateA ? dateA.getTime() : Number.MAX_SAFE_INTEGER;
        const timeB = dateB ? dateB.getTime() : Number.MAX_SAFE_INTEGER;
        return timeA - timeB;
      });
  }, [orders, statusFilter, produktFilter, mitarbeiterFilter, searchFilter]);

  const overview = useMemo(() => {
    const total = filteredOrders.length;
    const bestellt = filteredOrders.filter((order) => order.status === 'bestellt').length;
    const inKonstruktion = filteredOrders.filter((order) => order.status === 'in Konstruktion').length;
    const avAuftragspool = filteredOrders.filter((order) => order.status === 'AV Auftragspool').length;
    const inBearbeitung = filteredOrders.filter((order) => order.status === 'in Bearbeitung').length;
    const inBearbeitungOnHold = filteredOrders.filter((order) => order.status === 'in Bearbeitung On Hold').length;
    const avArbeitFertig = filteredOrders.filter((order) => order.status === 'AV Arbeit fertig').length;
    const konstruiert = filteredOrders.filter(
      (order) => (
        order.status === 'in Konstruktion'
        || order.status === 'AV Auftragspool'
        || order.status === 'in Bearbeitung'
        || order.status === 'in Bearbeitung On Hold'
        || order.status === 'AV Arbeit fertig'
      )
    ).length;
    const bestelltNichtKonstruiert = filteredOrders.filter(
      (order) => order.status === 'bestellt'
    ).length;
    const ueberfaellig = filteredOrders.filter((order) => isOrderDelayed(order)).length;
    return {
      total,
      bestellt,
      inKonstruktion,
      avAuftragspool,
      inBearbeitung,
      inBearbeitungOnHold,
      avArbeitFertig,
      konstruiert,
      bestelltNichtKonstruiert,
      ueberfaellig,
    };
  }, [filteredOrders]);

  const projektOverview = useMemo(() => {
    const projektMap = new Map();
    orders.forEach((order) => {
      const parsed = parseProjektAndBtl(order.auftrag || '');
      const projektKey = parsed?.projektKey || order.auftrag || order.id;
      if (!projektMap.has(projektKey)) {
        projektMap.set(projektKey, {
          projektKey,
          btls: [],
          statuses: new Set(),
          konstrukteure: new Set(),
          avBearbeiter: new Set(),
          kommentarCount: 0,
          bearbeitungCount: 0,
          totalStunden: 0,
          offeneTerminAenderungen: 0,
        });
      }
      const projekt = projektMap.get(projektKey);
      const terminShift = getTerminVerschiebung(order);
      const terminUnquittiert = terminShift.shifted && !isTerminAenderungQuittiert(order);
      const bearbeitungsstandProgress = getBearbeitungsstandProgress(order);
      const kommentare = (order.kommentare || []).slice().sort(
        (a, b) => (parseDateLoose(b.createdAt)?.getTime() || 0) - (parseDateLoose(a.createdAt)?.getTime() || 0)
      );
      const bearbeitungen = (order.bearbeitungen || []).slice().sort(
        (a, b) => (parseDateLoose(b.createdAt)?.getTime() || 0) - (parseDateLoose(a.createdAt)?.getTime() || 0)
      );

      projekt.statuses.add(order.status);
      if (order.konstrukteur || order.konstrukteurUebergebenVon) {
        projekt.konstrukteure.add(order.konstrukteur || order.konstrukteurUebergebenVon);
      }
      if (order.bearbeiter) {
        projekt.avBearbeiter.add(order.bearbeiter);
      }
      projekt.kommentarCount += kommentare.length;
      projekt.bearbeitungCount += bearbeitungen.length;
      projekt.totalStunden += Number(order.geplanteStunden) || 0;
      if (terminUnquittiert) {
        projekt.offeneTerminAenderungen += 1;
      }

      projekt.btls.push({
        id: order.id,
        auftrag: order.auftrag,
        btl: parsed?.btl || null,
        status: order.status,
        konstrukteur: order.konstrukteur || order.konstrukteurUebergebenVon || '-',
        bearbeiter: order.bearbeiter || '-',
        freigegebenVon: order.freigegebenVon || '-',
        statusSollBis: order.statusSollBis,
        uebergabeDatum: getUebergabeDatum(order),
        faelligBis: order.faelligBis,
        produktionsstart: order.produktionsstart,
        geplanteStunden: Number(order.geplanteStunden) || 0,
        ursprungsGeplanteStunden: getOriginalGeplanteStunden(order),
        stundenNachgebessert: isStundenNachgebessert(order),
        stundenNachgebessertVon: order.stundenNachgebessertVon || '',
        stundenNachgebessertAm: order.stundenNachgebessertAm || '',
        produkteText: (order.produkte || []).map((produkt) => `${produkt.typ} (${produkt.stueckzahl})`).join(', '),
        vorabdispo: getVorabdispoBadgeMeta(order).text,
        terminLabel: terminShift.shifted ? terminShift.label : '-',
        terminQuittiert: terminShift.shifted ? (isTerminAenderungQuittiert(order) ? 'Ja' : 'Nein') : '-',
        bearbeitungsstand:
          bearbeitungsstandProgress.total > 0
            ? `${bearbeitungsstandProgress.done}/${bearbeitungsstandProgress.total}`
            : '-',
        kommentare,
        bearbeitungen,
      });
    });

    return Array.from(projektMap.values())
      .map((projekt) => ({
        ...projekt,
        statuses: Array.from(projekt.statuses.values()),
        konstrukteure: Array.from(projekt.konstrukteure.values()),
        avBearbeiter: Array.from(projekt.avBearbeiter.values()),
        btls: projekt.btls.sort((a, b) => {
          if (a.btl && b.btl) {
            return a.btl - b.btl;
          }
          return a.auftrag.localeCompare(b.auftrag, 'de');
        }),
      }))
      .sort((a, b) => a.projektKey.localeCompare(b.projektKey, 'de'));
  }, [orders]);

  const projektStatusOptions = useMemo(
    () => Array.from(new Set(orders.map((order) => order.status).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'de')),
    [orders]
  );

  const filteredProjektOverview = useMemo(() => {
    const query = projektSearchFilter.trim().toLowerCase();
    return projektOverview
      .filter((projekt) => {
        if (!query) {
          return true;
        }
        if (projekt.projektKey.toLowerCase().includes(query)) {
          return true;
        }
        return projekt.btls.some((btl) => (
          `${btl.id} ${btl.auftrag}`.toLowerCase().includes(query)
        ));
      })
      .filter((projekt) => {
        if (projektStatusFilter === 'alle') {
          return true;
        }
        return projekt.statuses.includes(projektStatusFilter);
      })
      .filter((projekt) => {
        if (projektMitarbeiterFilter === 'alle') {
          return true;
        }
        return projekt.avBearbeiter.includes(projektMitarbeiterFilter)
          || projekt.konstrukteure.includes(projektMitarbeiterFilter);
      });
  }, [projektOverview, projektSearchFilter, projektStatusFilter, projektMitarbeiterFilter]);
  const matchesProduktAndSearch = (order) => {
    if (produktFilter !== 'alle' && !order.produkte.some((produkt) => produkt.typ === produktFilter)) {
      return false;
    }
    if (searchFilter.trim()) {
      const query = searchFilter.toLowerCase();
      if (!order.id.toLowerCase().includes(query) && !order.auftrag.toLowerCase().includes(query)) {
        return false;
      }
    }
    if (!orderIncludesMitarbeiter(order, mitarbeiterFilter)) {
      return false;
    }
    return true;
  };

  const avInBearbeitungOrders = useMemo(
    () => orders
      .filter((order) => order.status === 'in Bearbeitung')
      .filter((order) => order.bearbeiter === activeAvUser)
      .filter(matchesProduktAndSearch)
      .sort((a, b) => (getFertigungsendeDate(a)?.getTime() || Number.MAX_SAFE_INTEGER) - (getFertigungsendeDate(b)?.getTime() || Number.MAX_SAFE_INTEGER)),
    [orders, activeAvUser, produktFilter, mitarbeiterFilter, searchFilter]
  );

  const avOnHoldOrders = useMemo(
    () => orders
      .filter((order) => order.status === 'in Bearbeitung On Hold')
      .filter((order) => order.bearbeiter === activeAvUser)
      .filter(matchesProduktAndSearch)
      .sort((a, b) => (getFertigungsendeDate(a)?.getTime() || Number.MAX_SAFE_INTEGER) - (getFertigungsendeDate(b)?.getTime() || Number.MAX_SAFE_INTEGER)),
    [orders, activeAvUser, produktFilter, mitarbeiterFilter, searchFilter]
  );

  const avPoolOrders = useMemo(
    () => orders
      .filter((order) => order.status === 'AV Auftragspool')
      .filter(matchesProduktAndSearch)
      .sort((a, b) => (getFertigungsendeDate(a)?.getTime() || Number.MAX_SAFE_INTEGER) - (getFertigungsendeDate(b)?.getTime() || Number.MAX_SAFE_INTEGER)),
    [orders, produktFilter, mitarbeiterFilter, searchFilter]
  );

  const erwartungOrders = useMemo(
    () => orders
      .filter((order) => order.status === 'in Konstruktion')
      .filter((order) => isDateWithinNextDays(order.statusSollBis, erwartungHorizonDays))
      .filter(matchesProduktAndSearch)
      .sort((a, b) => (parseDateLoose(a.statusSollBis)?.getTime() || Number.MAX_SAFE_INTEGER) - (parseDateLoose(b.statusSollBis)?.getTime() || Number.MAX_SAFE_INTEGER)),
    [orders, erwartungHorizonDays, produktFilter, mitarbeiterFilter, searchFilter]
  );

  const terminAenderungOrders = useMemo(
    () => orders
      .filter(matchesProduktAndSearch)
      .filter((order) => getTerminVerschiebung(order).shifted)
      .filter((order) => !isTerminAenderungQuittiert(order))
      .sort((a, b) => (getFertigungsendeDate(a)?.getTime() || Number.MAX_SAFE_INTEGER) - (getFertigungsendeDate(b)?.getTime() || Number.MAX_SAFE_INTEGER)),
    [orders, produktFilter, mitarbeiterFilter, searchFilter]
  );

  const weeklyHoursChart = useMemo(() => {
    const weekCount = 8;
    const firstWeek = getWeekStartMonday(new Date());
    const weekMs = 7 * 86400000;
    const buckets = Array.from({ length: weekCount }, (_, index) => {
      const weekStart = addDays(firstWeek, index * 7);
      return {
        key: `${weekStart.toISOString().slice(0, 10)}-${index}`,
        weekStart,
        kw: getIsoWeekNumber(weekStart),
        avBereit: 0,
        baldInAv: 0,
        sonstig: 0,
      };
    });
    filteredOrders.forEach((order) => {
      const dueDate = parseDateLoose(order.faelligBis);
      if (!dueDate) {
        return;
      }
      const orderWeek = getWeekStartMonday(dueDate);
      const bucketIndex = Math.floor((orderWeek.getTime() - firstWeek.getTime()) / weekMs);
      if (bucketIndex < 0 || bucketIndex >= weekCount) {
        return;
      }
      const orderHours = Number(order.geplanteStunden) || 0;
      if (order.status === 'AV Auftragspool' || order.status === 'in Bearbeitung' || order.status === 'in Bearbeitung On Hold') {
        buckets[bucketIndex].avBereit += orderHours;
      } else if (order.status === 'in Konstruktion') {
        buckets[bucketIndex].baldInAv += orderHours;
      } else {
        buckets[bucketIndex].sonstig += orderHours;
      }
    });
    const maxHours = Math.max(
      1,
      ...buckets.map((bucket) => bucket.avBereit + bucket.baldInAv + bucket.sonstig)
    );
    return { buckets, maxHours };
  }, [filteredOrders]);

  function applyForecastFilter(nextStatus) {
    setStatusFilter(nextStatus);
  }

  function toggleOrderDetails(orderId) {
    setExpandedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  }

  function startDragOrder(orderId, source) {
    setDraggedOrderId(orderId);
    setDraggedSource(source);
  }

  function endDragOrder() {
    setDraggedOrderId('');
    setDraggedSource('');
    setIsBearbeitungDropActive(false);
    setIsOnHoldDropActive(false);
  }

  function handleBearbeitungDragOver(event) {
    if (!draggedOrderId) {
      return;
    }
    event.preventDefault();
    setIsBearbeitungDropActive(true);
  }

  function handleBearbeitungDrop(event) {
    event.preventDefault();
    setIsBearbeitungDropActive(false);
    if (!draggedOrderId) {
      return;
    }
    const draggedOrder = orders.find((order) => order.id === draggedOrderId);
    if (!draggedOrder) {
      setDraggedOrderId('');
      setDraggedSource('');
      return;
    }
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== draggedOrder.id) {
          return order;
        }
        if (draggedSource === 'pool' && order.status === 'AV Auftragspool') {
          return {
            ...order,
            status: 'in Bearbeitung',
            bearbeiter: activeAvUser,
            uebergabeDatum: order.uebergabeDatum || new Date().toISOString().slice(0, 10),
            konstrukteurUebergebenVon: order.konstrukteurUebergebenVon || order.konstrukteur || konstruktionMitarbeiter[0],
            bearbeitungsstand: order.bearbeitungsstand || createInitialBearbeitungsstand(),
            produkte: order.produkte.map((produkt) => ({ ...produkt, status: 'in Bearbeitung' })),
          };
        }
        if (draggedSource === 'onHold' && order.status === 'in Bearbeitung On Hold') {
          return {
            ...order,
            status: 'in Bearbeitung',
            bearbeiter: order.bearbeiter || activeAvUser,
            produkte: order.produkte.map((produkt) => ({ ...produkt, status: 'in Bearbeitung' })),
          };
        }
        return order;
      })
    );
    endDragOrder();
  }

  function handleOnHoldDragOver(event) {
    if (!draggedOrderId) {
      return;
    }
    event.preventDefault();
    setIsOnHoldDropActive(true);
  }

  function handleOnHoldDrop(event) {
    event.preventDefault();
    setIsOnHoldDropActive(false);
    if (!draggedOrderId) {
      return;
    }
    const draggedOrder = orders.find((order) => order.id === draggedOrderId);
    if (!draggedOrder || draggedSource !== 'bearbeitung' || draggedOrder.status !== 'in Bearbeitung') {
      endDragOrder();
      return;
    }
    setOnHoldModalOrderId(draggedOrder.id);
    setOnHoldComment('');
    endDragOrder();
  }

  function requestAvFertig(orderId) {
    setFinishModalOrderId(orderId);
    setFinishChecklist({
      logikalUebergabe: false,
      maschinendateien: false,
      auftraegeGeprueft: false,
      bestellvorschlaege: false,
    });
  }

  function closeFinishModal() {
    setFinishModalOrderId('');
    setFinishChecklist({
      logikalUebergabe: false,
      maschinendateien: false,
      auftraegeGeprueft: false,
      bestellvorschlaege: false,
    });
  }

  function setFinishCheckValue(key, checked) {
    setFinishChecklist((prev) => ({ ...prev, [key]: checked }));
  }

  function setCommentDraft(orderId, value) {
    setCommentDrafts((prev) => ({ ...prev, [orderId]: value }));
  }

  function addOrderComment(orderId, rolle) {
    const text = (commentDrafts[orderId] || '').trim();
    if (!text) {
      return;
    }
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) {
          return order;
        }
        const autor = rolle === 'Konstruktion'
          ? (order.konstrukteurUebergebenVon || order.konstrukteur || konstruktionMitarbeiter[0])
          : (order.bearbeiter || activeAvUser);
        const kommentar = {
          id: `${order.id}-${Date.now()}`,
          rolle,
          autor,
          text,
          createdAt: new Date().toISOString(),
        };
        return {
          ...order,
          kommentare: [...(order.kommentare || []), kommentar],
        };
      })
    );
    setCommentDrafts((prev) => ({ ...prev, [orderId]: '' }));
  }

  function setVorabdispoStatus(orderId, checked) {
    if (!checked) {
      return;
    }
    setOrders((prev) => {
      const targetOrder = prev.find((order) => order.id === orderId);
      if (!targetOrder) {
        return prev;
      }

      const targetProjektKey = parseProjektAndBtl(targetOrder.auftrag || '')?.projektKey || '';
      return prev.map((order) => {
        const orderProjektKey = parseProjektAndBtl(order.auftrag || '')?.projektKey || '';
        const isSameProject = targetProjektKey && orderProjektKey === targetProjektKey;
        const shouldUpdate = isSameProject || order.id === orderId;
        if (!shouldUpdate) {
          return order;
        }

        return {
          ...order,
          vorabdispoGemacht: true,
          vorabdispoVon: activeAvUser,
          produkte: order.produkte.map((produkt) => ({
            ...produkt,
            vorabdispoGemacht: true,
            vorabdispoVon: activeAvUser,
          })),
        };
      });
    });
  }

  function closeOnHoldModal() {
    setOnHoldModalOrderId('');
    setOnHoldComment('');
  }

  function openBearbeitungsstandModal(orderId) {
    setBearbeitungsstandModalOrderId(orderId);
  }

  function closeBearbeitungsstandModal() {
    setBearbeitungsstandModalOrderId('');
  }

  function setBearbeitungsstandValue(orderId, key, checked) {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) {
          return order;
        }
        const current = order.bearbeitungsstand || createInitialBearbeitungsstand();
        return {
          ...order,
          bearbeitungsstand: {
            ...current,
            [key]: checked
              ? {
                done: true,
                doneAt: new Date().toISOString(),
                doneBy: activeAvUser,
              }
              : false,
          },
        };
      })
    );
  }

  function toggleProjektRow(projektKey) {
    setExpandedProjektKeys((prev) => (
      prev.includes(projektKey)
        ? prev.filter((key) => key !== projektKey)
        : [...prev, projektKey]
    ));
  }

  function openProjectDetailModal(orderId) {
    const order = orders.find((item) => item.id === orderId);
    if (!order) {
      return;
    }
    setProjectDetailOrderId(orderId);
    setProjectDetailRole('AV');
    setProjectDetailComment('');
    setProjectDetailDraft({
      status: order.status || '',
      bearbeiter: order.bearbeiter || '',
      statusSollBis: order.statusSollBis || '',
      faelligBis: order.faelligBis || '',
      produktionsstart: order.produktionsstart || '',
      geplanteStunden: Number(order.geplanteStunden) || 0,
      vorabdispoGemacht: Boolean(order.vorabdispoGemacht),
    });
  }

  function closeProjectDetailModal() {
    setProjectDetailOrderId('');
    setProjectDetailComment('');
    setProjectDetailRole('AV');
  }

  function startAuftragspoolStundenEdit(orderId) {
    const order = orders.find((item) => item.id === orderId);
    if (!order) {
      return;
    }
    setStundenEditDrafts((prev) => ({
      ...prev,
      [orderId]: String(Number(order.geplanteStunden) || 0),
    }));
  }

  function cancelAuftragspoolStundenEdit(orderId) {
    setStundenEditDrafts((prev) => {
      const next = { ...prev };
      delete next[orderId];
      return next;
    });
  }

  function saveAuftragspoolStundenEdit(orderId) {
    const raw = stundenEditDrafts[orderId];
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return;
    }
    const nextHours = Math.round(parsed * 100) / 100;
    const nowIso = new Date().toISOString();
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) {
          return order;
        }
        const currentHours = Number(order.geplanteStunden) || 0;
        if (currentHours === nextHours) {
          return order;
        }
        const originalHours = getOriginalGeplanteStunden(order);
        const isAdjusted = nextHours !== originalHours;
        return {
          ...order,
          geplanteStunden: nextHours,
          ursprungsGeplanteStunden: originalHours,
          stundenNachgebessert: isAdjusted,
          stundenNachgebessertVon: isAdjusted ? activeAvUser : '',
          stundenNachgebessertAm: isAdjusted ? nowIso : '',
          bearbeitungen: [
            ...(order.bearbeitungen || []),
            {
              id: `${order.id}-hours-edit-${Date.now()}`,
              autor: activeAvUser,
              text: `Stundenkorrektur im Auftragspool: ${currentHours} -> ${nextHours} | Ursprung: ${originalHours}`,
              createdAt: nowIso,
            },
          ],
        };
      })
    );
    cancelAuftragspoolStundenEdit(orderId);
  }

  function saveProjectDetailModal() {
    if (!projectDetailOrderId) {
      return;
    }
    const nowIso = new Date().toISOString();
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== projectDetailOrderId) {
          return order;
        }
        const originalHours = getOriginalGeplanteStunden(order);
        const newHours = Number(projectDetailDraft.geplanteStunden) || 0;
        const stundenGeaendert = (Number(order.geplanteStunden) || 0) !== newHours;
        const changes = [];
        if (order.status !== projectDetailDraft.status) {
          changes.push(`Status: ${order.status} -> ${projectDetailDraft.status}`);
        }
        if ((order.bearbeiter || '') !== (projectDetailDraft.bearbeiter || '')) {
          changes.push(`Bearbeiter: ${order.bearbeiter || '-'} -> ${projectDetailDraft.bearbeiter || '-'}`);
        }
        if ((order.statusSollBis || '') !== (projectDetailDraft.statusSollBis || '')) {
          changes.push(`Soll bis: ${order.statusSollBis || '-'} -> ${projectDetailDraft.statusSollBis || '-'}`);
        }
        if ((order.faelligBis || '') !== (projectDetailDraft.faelligBis || '')) {
          changes.push(`Montagetermin: ${order.faelligBis || '-'} -> ${projectDetailDraft.faelligBis || '-'}`);
        }
        if ((order.produktionsstart || '') !== (projectDetailDraft.produktionsstart || '')) {
          changes.push(`Produktionsstart: ${order.produktionsstart || '-'} -> ${projectDetailDraft.produktionsstart || '-'}`);
        }
        if (stundenGeaendert) {
          changes.push(`Stunden (AV): ${Number(order.geplanteStunden) || 0} -> ${newHours} | Ursprung: ${originalHours}`);
        }
        if (Boolean(order.vorabdispoGemacht) !== Boolean(projectDetailDraft.vorabdispoGemacht)) {
          changes.push(`Vorabdispo: ${order.vorabdispoGemacht ? 'Ja' : 'Nein'} -> ${projectDetailDraft.vorabdispoGemacht ? 'Ja' : 'Nein'}`);
        }

        let updatedOrder = {
          ...order,
          status: projectDetailDraft.status,
          bearbeiter: projectDetailDraft.bearbeiter,
          statusSollBis: projectDetailDraft.statusSollBis,
          faelligBis: projectDetailDraft.faelligBis,
          produktionsstart: projectDetailDraft.produktionsstart,
          geplanteStunden: newHours,
          ursprungsGeplanteStunden: originalHours,
          stundenNachgebessert: stundenGeaendert ? true : Boolean(order.stundenNachgebessert),
          stundenNachgebessertVon: stundenGeaendert ? activeAvUser : (order.stundenNachgebessertVon || ''),
          stundenNachgebessertAm: stundenGeaendert ? nowIso : (order.stundenNachgebessertAm || ''),
          vorabdispoGemacht: Boolean(projectDetailDraft.vorabdispoGemacht),
          vorabdispoVon: projectDetailDraft.vorabdispoGemacht
            ? (order.vorabdispoVon || activeAvUser)
            : '',
          produkte: (order.produkte || []).map((produkt) => ({
            ...produkt,
            status: projectDetailDraft.status || produkt.status,
          })),
          bearbeitungen: changes.length > 0
            ? [
              ...(order.bearbeitungen || []),
              {
                id: `${order.id}-edit-${Date.now()}`,
                autor: activeAvUser,
                text: changes.join(' | '),
                createdAt: nowIso,
              },
            ]
            : (order.bearbeitungen || []),
        };
        updatedOrder = withTerminverschiebung(updatedOrder, {
          fieldKey: 'statusSollBis',
          label: 'Status Soll bis',
          fromValue: order.statusSollBis || '',
          toValue: projectDetailDraft.statusSollBis || '',
          changedBy: activeAvUser,
          bereich: 'Auftragspool',
          changedAt: nowIso,
        });
        updatedOrder = withTerminverschiebung(updatedOrder, {
          fieldKey: 'faelligBis',
          label: 'Montagetermin',
          fromValue: order.faelligBis || '',
          toValue: projectDetailDraft.faelligBis || '',
          changedBy: activeAvUser,
          bereich: 'Auftragspool',
          changedAt: nowIso,
        });
        updatedOrder = withTerminverschiebung(updatedOrder, {
          fieldKey: 'produktionsstart',
          label: 'Produktionsstart',
          fromValue: order.produktionsstart || '',
          toValue: projectDetailDraft.produktionsstart || '',
          changedBy: activeAvUser,
          bereich: 'Auftragspool',
          changedAt: nowIso,
        });
        return updatedOrder;
      })
    );
    closeProjectDetailModal();
  }

  function addProjectDetailComment() {
    const text = projectDetailComment.trim();
    if (!projectDetailOrderId || !text) {
      return;
    }
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== projectDetailOrderId) {
          return order;
        }
        return {
          ...order,
          kommentare: [
            ...(order.kommentare || []),
            {
              id: `${order.id}-detail-comment-${Date.now()}`,
              rolle: projectDetailRole,
              autor: projectDetailRole === 'Konstruktion'
                ? (order.konstrukteurUebergebenVon || order.konstrukteur || konstruktionMitarbeiter[0])
                : (order.bearbeiter || activeAvUser),
              text,
              createdAt: new Date().toISOString(),
            },
          ],
        };
      })
    );
    setProjectDetailComment('');
  }

  function confirmOnHoldWithComment() {
    const text = onHoldComment.trim();
    if (!onHoldModalOrderId || !text) {
      return;
    }
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== onHoldModalOrderId || order.status !== 'in Bearbeitung') {
          return order;
        }
        const kommentar = {
          id: `${order.id}-${Date.now()}`,
          rolle: 'AV',
          autor: order.bearbeiter || activeAvUser,
          text: `On Hold: ${text}`,
          createdAt: new Date().toISOString(),
        };
        return {
          ...order,
          status: 'in Bearbeitung On Hold',
          produkte: order.produkte.map((produkt) => ({ ...produkt, status: 'in Bearbeitung On Hold' })),
          kommentare: [...(order.kommentare || []), kommentar],
        };
      })
    );
    closeOnHoldModal();
  }

  function confirmAvFertig(orderId) {
    const allChecked = Object.values(finishChecklist).every(Boolean);
    if (!allChecked) {
      return;
    }
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId || order.status !== 'in Bearbeitung') {
          return order;
        }
        return {
          ...order,
          status: 'AV Arbeit fertig',
          freigegebenVon: order.bearbeiter || order.freigegebenVon || 'Unbekannt',
          bearbeiter: '',
          produkte: order.produkte.map((produkt) => ({
            ...produkt,
            status: 'AV Arbeit fertig',
          })),
        };
      })
    );
    closeFinishModal();
  }

  function quittiereTerminAenderung(orderId) {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) {
          return order;
        }
        if (!getTerminVerschiebung(order).shifted) {
          return order;
        }
        return {
          ...order,
          terminAenderungQuittiert: true,
          terminAenderungQuittiertVon: activeAvUser,
          terminAenderungQuittiertAm: new Date().toISOString(),
        };
      })
    );
  }

  const finishModalOrder = finishModalOrderId
    ? orders.find((order) => order.id === finishModalOrderId)
    : null;
  const onHoldModalOrder = onHoldModalOrderId
    ? orders.find((order) => order.id === onHoldModalOrderId)
    : null;
  const bearbeitungsstandModalOrder = bearbeitungsstandModalOrderId
    ? orders.find((order) => order.id === bearbeitungsstandModalOrderId)
    : null;
  const projectDetailOrder = projectDetailOrderId
    ? orders.find((order) => order.id === projectDetailOrderId)
    : null;
  const canConfirmFinish = Object.values(finishChecklist).every(Boolean);
  const tileEntryCardStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid #dbe3ec',
    background: '#ffffff',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
  };
  const tileTitleStyle = { fontSize: 12, fontWeight: 700, color: '#0f172a' };
  const tileMetaStyle = { fontSize: 11, color: '#64748b' };

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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            marginBottom: 18,
          }}
        >
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
            {isProjektuebersichtView ? 'Projektuebersicht' : 'Auftragspool'}
          </div>
        </div>

        {isProjektuebersichtView ? (
          <section
            style={{
              background: '#f2f4f6',
              borderRadius: 10,
              border: '1px solid #d3d7dc',
              padding: 16,
              display: 'grid',
              gap: 12,
            }}
          >
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #d8e1ea',
                borderRadius: 8,
                padding: 10,
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr auto',
                gap: 8,
                alignItems: 'end',
              }}
            >
              <label style={{ display: 'grid', gap: 4, fontSize: 12, color: '#334155' }}>
                <span>Suche Projekt / BTL</span>
                <input
                  type="text"
                  value={projektSearchFilter}
                  onChange={(event) => setProjektSearchFilter(event.target.value)}
                  placeholder="Projektkey, Auftrags-ID oder Auftrag..."
                  style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 10px', fontSize: 12 }}
                />
              </label>
              <label style={{ display: 'grid', gap: 4, fontSize: 12, color: '#334155' }}>
                <span>Status</span>
                <select
                  value={projektStatusFilter}
                  onChange={(event) => setProjektStatusFilter(event.target.value)}
                  style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 10px', fontSize: 12, background: '#fff' }}
                >
                  <option value="alle">Alle</option>
                  {projektStatusOptions.map((status) => (
                    <option key={`projekt-status-${status}`} value={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'grid', gap: 4, fontSize: 12, color: '#334155' }}>
                <span>Mitarbeiter</span>
                <select
                  value={projektMitarbeiterFilter}
                  onChange={(event) => setProjektMitarbeiterFilter(event.target.value)}
                  style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 10px', fontSize: 12, background: '#fff' }}
                >
                  <option value="alle">Alle</option>
                  {mitarbeiterOptions.map((name) => (
                    <option key={`projekt-mf-${name}`} value={name}>{name}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => {
                  setProjektSearchFilter('');
                  setProjektStatusFilter('alle');
                  setProjektMitarbeiterFilter('alle');
                }}
                style={{ border: '1px solid #42b4e5', background: '#ffffff', color: '#2088b5', borderRadius: 6, padding: '8px 10px', fontSize: 12, cursor: 'pointer' }}
              >
                Filter zurücksetzen
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(140px, 1fr))', gap: 10 }}>
              <div style={{ background: '#ffffff', border: '1px solid #d8e1ea', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 11, color: '#6b7280' }}>Projekte gesamt</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{filteredProjektOverview.length}</div>
              </div>
              <div style={{ background: '#ffffff', border: '1px solid #d8e1ea', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 11, color: '#6b7280' }}>BTLs gesamt</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{filteredProjektOverview.reduce((sum, projekt) => sum + projekt.btls.length, 0)}</div>
              </div>
              <div style={{ background: '#ffffff', border: '1px solid #d8e1ea', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 11, color: '#6b7280' }}>Kommentare</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>
                  {filteredProjektOverview.reduce((sum, projekt) => sum + projekt.kommentarCount, 0)}
                </div>
              </div>
              <div style={{ background: '#ffffff', border: '1px solid #d8e1ea', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 11, color: '#6b7280' }}>Bearbeitungen</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>
                  {filteredProjektOverview.reduce((sum, projekt) => sum + projekt.bearbeitungCount, 0)}
                </div>
              </div>
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 11, color: '#9a3412' }}>Offene Terminverschiebungen</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#9a3412' }}>
                  {filteredProjektOverview.reduce((sum, projekt) => sum + projekt.offeneTerminAenderungen, 0)}
                </div>
              </div>
            </div>

            <div style={{ border: '1px solid #d8e1ea', borderRadius: 10, overflow: 'hidden', background: '#ffffff' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '40px 1.4fr 0.8fr 1fr 1fr 0.7fr 0.7fr 0.9fr', background: '#ecf1f6', borderBottom: '1px solid #d8e1ea', fontSize: 11, fontWeight: 700, color: '#334155' }}>
                <div style={{ padding: '8px 10px' }} />
                <div style={{ padding: '8px 10px' }}>Projekt</div>
                <div style={{ padding: '8px 10px' }}>BTLs</div>
                <div style={{ padding: '8px 10px' }}>Status</div>
                <div style={{ padding: '8px 10px' }}>AV / Konstruktion</div>
                <div style={{ padding: '8px 10px' }}>Std.</div>
                <div style={{ padding: '8px 10px' }}>Kommentare</div>
                <div style={{ padding: '8px 10px' }}>Offene Termine</div>
              </div>
              {filteredProjektOverview.map((projekt) => {
                const expanded = expandedProjektKeys.includes(projekt.projektKey);
                return (
                  <div key={`projekt-overview-${projekt.projektKey}`} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <div
                      onClick={() => toggleProjektRow(projekt.projektKey)}
                      style={{ display: 'grid', gridTemplateColumns: '40px 1.4fr 0.8fr 1fr 1fr 0.7fr 0.7fr 0.9fr', cursor: 'pointer', background: expanded ? '#f8fafc' : '#ffffff' }}
                    >
                      <div style={{ padding: '10px', fontWeight: 700 }}>{expanded ? '-' : '+'}</div>
                      <div style={{ padding: '10px', fontWeight: 700 }}>{projekt.projektKey}</div>
                      <div style={{ padding: '10px' }}>{projekt.btls.length}</div>
                      <div style={{ padding: '10px' }}>{projekt.statuses.join(', ') || '-'}</div>
                      <div style={{ padding: '10px' }}>
                        AV: {projekt.avBearbeiter.join(', ') || '-'}
                        <div style={{ fontSize: 11, color: '#64748b' }}>K: {projekt.konstrukteure.join(', ') || '-'}</div>
                      </div>
                      <div style={{ padding: '10px', fontWeight: 700 }}>{projekt.totalStunden} h</div>
                      <div style={{ padding: '10px' }}>{projekt.kommentarCount}</div>
                      <div style={{ padding: '10px', color: '#9a3412', fontWeight: 700 }}>{projekt.offeneTerminAenderungen}</div>
                    </div>
                    {expanded && (
                      <div style={{ background: '#f8fafc', borderTop: '1px solid #dbe3ec', padding: 10 }}>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', minWidth: 1000, borderCollapse: 'collapse', fontSize: 12, background: '#ffffff', border: '1px solid #e2e8f0' }}>
                            <thead>
                              <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#334155' }}>
                                <th style={{ padding: '7px 8px', borderBottom: '1px solid #e2e8f0' }}>Bauteilliste</th>
                                <th style={{ padding: '7px 8px', borderBottom: '1px solid #e2e8f0' }}>Status</th>
                                <th style={{ padding: '7px 8px', borderBottom: '1px solid #e2e8f0' }}>Bearbeiter</th>
                                <th style={{ padding: '7px 8px', borderBottom: '1px solid #e2e8f0' }}>Montagetermin</th>
                                <th style={{ padding: '7px 8px', borderBottom: '1px solid #e2e8f0' }}>Stunden</th>
                                <th style={{ padding: '7px 8px', borderBottom: '1px solid #e2e8f0' }}>Kommentare</th>
                                <th style={{ padding: '7px 8px', borderBottom: '1px solid #e2e8f0' }}>Aktion</th>
                              </tr>
                            </thead>
                            <tbody>
                              {projekt.btls.map((btl) => (
                                <tr key={`btl-sub-${btl.id}`} onClick={() => openProjectDetailModal(btl.id)} style={{ borderBottom: '1px solid #e2e8f0', cursor: 'pointer' }}>
                                  <td style={{ padding: '7px 8px' }}>
                                    <div style={{ fontWeight: 700 }}>{btl.id}</div>
                                    <div>{btl.auftrag}</div>
                                  </td>
                                  <td style={{ padding: '7px 8px' }}>
                                    <span style={{ borderRadius: 999, padding: '2px 7px', fontSize: 10, fontWeight: 700, ...getStatusPillStyles(btl.status) }}>
                                      {btl.status}
                                    </span>
                                  </td>
                                  <td style={{ padding: '7px 8px' }}>{btl.bearbeiter}</td>
                                  <td style={{ padding: '7px 8px' }}>{formatDate(btl.faelligBis)}</td>
                                  <td style={{ padding: '7px 8px', fontWeight: 700 }}>
                                    <div>{btl.geplanteStunden} h</div>
                                    {btl.stundenNachgebessert && (
                                      <div style={{ fontSize: 10, color: '#0f766e', fontWeight: 600 }}>
                                        Ursprung: {btl.ursprungsGeplanteStunden} h
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ padding: '7px 8px' }}>{btl.kommentare.length}</td>
                                  <td style={{ padding: '7px 8px' }}>
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        openProjectDetailModal(btl.id);
                                      }}
                                      style={{ border: '1px solid #93c5fd', background: '#eff6ff', color: '#1d4ed8', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                                    >
                                      Details
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredProjektOverview.length === 0 && (
                <div style={{ padding: 16, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                  Keine Projekte für die ausgewählten Filter gefunden.
                </div>
              )}
            </div>
          </section>
        ) : (
          <>
        <section
          style={{
            background: '#f2f4f6',
            borderRadius: 10,
            border: '1px solid #d3d7dc',
            padding: 18,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
              gap: 12,
              alignItems: 'end',
            }}
          >
            <label style={{ display: 'block' }}>
              <div style={{ marginBottom: 6, fontSize: 13, color: '#4b5563' }}>Suche Auftrag</div>
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="z. B. PA-2026-1042 oder KN0171B "
                style={{
                  width: '100%',
                  border: '1px solid #c7cdd4',
                  borderRadius: 6,
                  padding: '10px 12px',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </label>

            <label style={{ display: 'block' }}>
              <div style={{ marginBottom: 6, fontSize: 13, color: '#4b5563' }}>Status</div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: '100%',
                  border: '1px solid #c7cdd4',
                  borderRadius: 6,
                  padding: '10px 12px',
                  fontSize: 14,
                  background: '#ffffff',
                }}
              >
                <option value="alle">Alle</option>
                <option value="bestellt">bestellt</option>
                <option value="in Konstruktion">in Konstruktion</option>
                <option value="avBereit">AV bereit (Pool + Bearbeitung)</option>
                <option value="AV Auftragspool">AV Auftragspool</option>
                <option value="in Bearbeitung">in Bearbeitung</option>
                <option value="in Bearbeitung On Hold">in Bearbeitung On Hold</option>
                <option value="AV Arbeit fertig">AV Arbeit fertig</option>
              </select>
            </label>

            <label style={{ display: 'block' }}>
              <div style={{ marginBottom: 6, fontSize: 13, color: '#4b5563' }}>Produkt</div>
              <select
                value={produktFilter}
                onChange={(e) => setProduktFilter(e.target.value)}
                style={{
                  width: '100%',
                  border: '1px solid #c7cdd4',
                  borderRadius: 6,
                  padding: '10px 12px',
                  fontSize: 14,
                  background: '#ffffff',
                }}
              >
                <option value="alle">Alle</option>
                <option value="Fassaden">Fassaden</option>
                <option value="Fenster">Fenster</option>
                <option value="AWE">AWE</option>
                <option value="Tueren">Tueren</option>
              </select>
            </label>

            <label style={{ display: 'block' }}>
              <div style={{ marginBottom: 6, fontSize: 13, color: '#4b5563' }}>Mitarbeiter</div>
              <select
                value={mitarbeiterFilter}
                onChange={(e) => setMitarbeiterFilter(e.target.value)}
                style={{
                  width: '100%',
                  border: '1px solid #c7cdd4',
                  borderRadius: 6,
                  padding: '10px 12px',
                  fontSize: 14,
                  background: '#ffffff',
                }}
              >
                <option value="alle">Alle</option>
                {mitarbeiterOptions.map((name) => (
                  <option key={`mf-${name}`} value={name}>{name}</option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => {
                setSearchFilter('');
                setStatusFilter('alle');
                setProduktFilter('alle');
                setMitarbeiterFilter('alle');
              }}
              style={{
                border: '1px solid #42b4e5',
                background: '#ffffff',
                color: '#2088b5',
                borderRadius: 6,
                padding: '10px 14px',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Filter zurücksetzen
            </button>
          </div>
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, minmax(120px, 1fr))',
            gap: 10,
            marginBottom: 14,
          }}
        >
          <div style={{ background: '#f2f4f6', border: '1px solid #d3d7dc', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Aufträge gesamt</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{overview.total}</div>
          </div>
          <div style={{ background: '#f2f4f6', border: '1px solid #d3d7dc', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ fontSize: 11, color: '#6b7280' }}>In Konstruktion</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{overview.inKonstruktion}</div>
          </div>
          <div style={{ background: '#f2f4f6', border: '1px solid #d3d7dc', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ fontSize: 11, color: '#6b7280' }}>AV Auftragspool</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{overview.avAuftragspool}</div>
          </div>
          <div style={{ background: '#f2f4f6', border: '1px solid #d3d7dc', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ fontSize: 11, color: '#6b7280' }}>In Bearbeitung</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{overview.inBearbeitung}</div>
          </div>
          <div style={{ background: '#fdecec', border: '1px solid #efb6b6', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ fontSize: 11, color: '#9b4a4a' }}>Ueberfaellig</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#7a1f1f' }}>{overview.ueberfaellig}</div>
          </div>
        </section>

        <section
          style={{
            background: '#f2f4f6',
            borderRadius: 10,
            border: '1px solid #d3d7dc',
            marginBottom: 14,
            overflow: 'hidden',
          }}
        >
          <button
            type="button"
            onClick={() => setForecastOpen((prev) => !prev)}
            style={{
              width: '100%',
              textAlign: 'left',
              background: '#e7eaee',
              border: 'none',
              borderBottom: forecastOpen ? '1px solid #d3d7dc' : 'none',
              padding: '12px 14px',
              fontSize: 16,
              fontWeight: 700,
              color: '#1f2937',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>Forecast</span>
            <span>{forecastOpen ? 'v' : '>'}</span>
          </button>
          {forecastOpen && (
            <div style={{ padding: 14 }}>
              <div
                style={{
                  position: 'relative',
                  height: 250,
                  border: '1px solid #dbe3ec',
                  borderRadius: 8,
                  background: '#ffffff',
                  padding: '14px 10px 22px 40px',
                }}
              >
                {[0, 25, 50, 75, 100].map((percent) => {
                  const value = Math.round((weeklyHoursChart.maxHours * percent) / 100);
                  const y = 190 - (percent / 100) * 190;
                  return (
                    <div key={percent}>
                      <div
                        style={{
                          position: 'absolute',
                          left: 40,
                          right: 10,
                          top: y + 14,
                          borderTop: '1px solid #d6dbe1',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          left: 8,
                          top: y + 4,
                          fontSize: 11,
                          color: '#6b7280',
                        }}
                      >
                        {value} h
                      </div>
                    </div>
                  );
                })}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${Math.max(1, weeklyHoursChart.buckets.length)}, minmax(58px, 1fr))`,
                    alignItems: 'flex-end',
                    gap: 8,
                    height: 200,
                  }}
                >
                  {weeklyHoursChart.buckets.map((bucket) => {
                    const scale = 170 / weeklyHoursChart.maxHours;
                    const hAvBereit = Math.max(0, Math.round(bucket.avBereit * scale));
                    const hBaldInAv = Math.max(0, Math.round(bucket.baldInAv * scale));
                    const hSonstig = Math.max(0, Math.round(bucket.sonstig * scale));
                    const total = bucket.avBereit + bucket.baldInAv + bucket.sonstig;
                    const isCurrent = bucket.kw === aktuelleKw;
                    return (
                      <div key={bucket.key} style={{ position: 'relative', height: 198 }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, textAlign: 'center', fontSize: 10, color: '#4b5563', fontWeight: 700 }}>{total} h</div>
                        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 20, height: 170, border: isCurrent ? '1px solid #93c5fd' : '1px solid transparent', background: isCurrent ? '#eff6ff' : 'transparent', borderRadius: 6 }} />
                        <div
                          onClick={() => applyForecastFilter('bestellt')}
                          style={{
                            position: 'absolute',
                            left: 4,
                            right: 4,
                            bottom: 20,
                            height: hSonstig,
                            background: '#cbd5e1',
                            cursor: 'pointer',
                          }}
                        />
                        <div
                          onClick={() => applyForecastFilter('in Konstruktion')}
                          style={{
                            position: 'absolute',
                            left: 4,
                            right: 4,
                            bottom: 20 + hSonstig,
                            height: hBaldInAv,
                            background: '#5e9be0',
                            cursor: 'pointer',
                          }}
                        />
                        <div
                          onClick={() => applyForecastFilter('avBereit')}
                          style={{
                            position: 'absolute',
                            left: 4,
                            right: 4,
                            bottom: 20 + hSonstig + hBaldInAv,
                            height: hAvBereit,
                            background: '#27466b',
                            cursor: 'pointer',
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            textAlign: 'center',
                            fontSize: 11,
                            color: isCurrent ? '#b91c1c' : '#4b5563',
                            fontWeight: isCurrent ? 700 : 500,
                          }}
                        >
                          {isCurrent ? `KW ${bucket.kw} (akt.)` : `KW ${bucket.kw}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 8, fontSize: 12, color: '#4b5563' }}>
                <button
                  type="button"
                  onClick={() => applyForecastFilter('avBereit')}
                  style={{ border: 'none', background: 'transparent', padding: 0, fontSize: 12, color: '#4b5563', cursor: 'pointer' }}
                >
                  <span style={{ display: 'inline-block', width: 14, height: 10, background: '#27466b', marginRight: 6 }} />
                  AV bereit (Pool + Bearbeitung)
                </button>
                <button
                  type="button"
                  onClick={() => applyForecastFilter('in Konstruktion')}
                  style={{ border: 'none', background: 'transparent', padding: 0, fontSize: 12, color: '#4b5563', cursor: 'pointer' }}
                >
                  <span style={{ display: 'inline-block', width: 14, height: 10, background: '#5e9be0', marginRight: 6 }} />
                  Bald in AV (in Konstruktion)
                </button>
                <button
                  type="button"
                  onClick={() => applyForecastFilter('bestellt')}
                  style={{ border: 'none', background: 'transparent', padding: 0, fontSize: 12, color: '#4b5563', cursor: 'pointer' }}
                >
                  <span style={{ display: 'inline-block', width: 14, height: 10, background: '#cbd5e1', marginRight: 6 }} />
                  Sonstige
                </button>
                <button
                  type="button"
                  onClick={() => applyForecastFilter('alle')}
                  style={{ border: '1px solid #c7cdd4', background: '#ffffff', borderRadius: 6, padding: '2px 8px', fontSize: 12, color: '#4b5563', cursor: 'pointer' }}
                >
                  Filter loesen
                </button>
              </div>
            </div>
          )}
        </section>

        
        <section
          style={{
            background: '#eef3f8',
            borderRadius: 10,
            border: '1px solid #d8e1ea',
            padding: 12,
            marginBottom: 14,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 360px) auto', gap: 8, alignItems: 'end', marginBottom: 10 }}>
            <label style={{ display: 'block' }}>
              <div style={{ marginBottom: 6, fontSize: 12, color: '#4b5563', fontWeight: 700 }}>Aktiver AV Mitarbeiter</div>
              <select
                value={activeAvUser}
                onChange={(event) => setActiveAvUser(event.target.value)}
                style={{ width: '100%', border: '1px solid #c7cdd4', borderRadius: 6, padding: '8px 10px', fontSize: 13, background: '#fff' }}
              >
                {auftragszentrumMitarbeiter.map((name) => (
                  <option key={`active-user-${name}`} value={name}>{name}</option>
                ))}
              </select>
            </label>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Wenn du einen Auftrag in die Bearbeitung ziehst, wird automatisch <strong>{activeAvUser}</strong> als Bearbeiter gesetzt.
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #d8e1ea', borderRadius: 8, overflow: 'hidden', marginBottom: 10 }}>
            <div style={{ padding: '8px 10px', background: '#fff7ed', borderBottom: '1px solid #fed7aa', fontWeight: 700, fontSize: 13, color: '#9a3412' }}>
              Terminverschiebungen Abruf-/Montagetermin ({terminAenderungOrders.length})
            </div>
            {terminAenderungOrders.length > 0 ? terminAenderungOrders.slice(0, 8).map((order, index) => {
              const terminShift = getTerminVerschiebung(order);
              const quittiert = isTerminAenderungQuittiert(order);
              return (
                <div
                  key={`termin-shift-${order.id}`}
                  style={{
                    ...tileEntryCardStyle,
                    margin: '8px 10px',
                    borderLeft: quittiert ? '4px solid #86efac' : '4px solid #dc2626',
                    background: quittiert ? '#f8fffb' : '#fee2e2',
                    border: quittiert ? tileEntryCardStyle.border : '1px solid #fca5a5',
                    borderTop: index === 0 ? '1px solid #fca5a5' : (quittiert ? tileEntryCardStyle.border : '1px solid #fca5a5'),
                  }}
                >
                  <div>
                    <div style={tileTitleStyle}>{order.id} - {order.auftrag}</div>
                    <div style={{ ...tileMetaStyle, color: '#9a3412' }}>
                      {terminShift.label} | Montagetermin: {formatDate(order.faelligBis)}
                    </div>
                    {quittiert ? (
                      <div style={{ fontSize: 11, color: '#166534', marginTop: 4, fontWeight: 700 }}>
                        Quittiert von {order.terminAenderungQuittiertVon || '-'} am {formatDateTime(order.terminAenderungQuittiertAm)}
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: '#991b1b', marginTop: 2, fontWeight: 700 }}>
                        Noch nicht quittiert
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {!quittiert && (
                      <button
                        type="button"
                        onClick={() => quittiereTerminAenderung(order.id)}
                        style={{
                          border: '1px solid #f59e0b',
                          background: '#fef3c7',
                          color: '#92400e',
                          borderRadius: 8,
                          padding: '6px 10px',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Quittieren als {activeAvUser}
                      </button>
                    )}
                  </div>
                </div>
              );
            }) : (
              <div style={{ padding: 10, fontSize: 12, color: '#64748b' }}>Keine Terminverschiebungen vorhanden.</div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 10 }}>
            <div
              onDragOver={handleBearbeitungDragOver}
              onDragLeave={() => setIsBearbeitungDropActive(false)}
              onDrop={handleBearbeitungDrop}
              style={{
                background: '#ffffff',
                border: isBearbeitungDropActive ? '2px dashed #2563eb' : '1px solid #d8e1ea',
                borderRadius: 8,
                overflow: 'hidden',
                boxShadow: isBearbeitungDropActive ? '0 0 0 3px rgba(37, 99, 235, 0.15)' : 'none',
              }}
            >
              <div style={{ padding: '8px 10px', background: '#eaf0f6', borderBottom: '1px solid #d8e1ea', fontWeight: 700, fontSize: 13, color: '#1f2937' }}>
                AV in Bearbeitung ({avInBearbeitungOrders.length})
              </div>
              <div style={{ padding: '8px 10px', fontSize: 11, color: '#64748b', borderBottom: '1px solid #e2e8f0', background: '#f8fbff' }}>
                Ziehe Aufträge aus der unteren Tabelle hierher. Bearbeiter wird automatisch auf {activeAvUser} gesetzt.
              </div>
              {avInBearbeitungOrders.length > 0 ? avInBearbeitungOrders.slice(0, 6).map((order, index) => (
                (() => {
                  const vorabdispoBadge = getVorabdispoBadgeMeta(order);
                  const bearbeitungsstandProgress = getBearbeitungsstandProgress(order);
                  const bearbeitungsstandDoneItems = getBearbeitungsstandDoneItems(order);
                  const isEditingHours = Object.prototype.hasOwnProperty.call(stundenEditDrafts, order.id);
                  return (
                <div
                  key={`av-ready-${order.id}`}
                  draggable
                  onDragStart={() => startDragOrder(order.id, 'bearbeitung')}
                  onDragEnd={endDragOrder}
                  style={{
                    ...tileEntryCardStyle,
                    margin: '8px 10px',
                    borderLeft: isOrderDelayed(order) ? '4px solid #ef4444' : '4px solid #38bdf8',
                    borderTop: index === 0 ? '1px solid #dbe3ec' : tileEntryCardStyle.border,
                    background: isOrderDelayed(order) ? '#fff7f7' : '#ffffff',
                    cursor: 'grab',
                    opacity: draggedOrderId === order.id ? 0.6 : 1,
                  }}
                >
                  <div>
                    <button
                      type="button"
                      onClick={() => openProjectDetailModal(order.id)}
                      style={{
                        ...tileTitleStyle,
                        border: 'none',
                        background: 'transparent',
                        padding: 0,
                        margin: 0,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      {order.id} - {order.auftrag}
                    </button>
                    <div style={tileMetaStyle}>Uebergeben von Konstruktion: {order.konstrukteurUebergebenVon || 'Unbekannt'}</div>
                    <div style={tileMetaStyle}>Übergabe am: {formatDate(getUebergabeDatum(order))}</div>
                    <div style={{ fontSize: 11, color: '#0369a1', marginTop: 3, fontWeight: 700 }}>Bearbeiter AV: {order.bearbeiter || 'Unbekannt'}</div>
                    <span style={{ display: 'inline-block', marginTop: 4, borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 800, letterSpacing: 0.2, ...vorabdispoBadge.style }}>
                      {vorabdispoBadge.text}
                    </span>
                    <div
                      style={{
                        marginTop: 6,
                        border: `1px solid ${isVorabdispoDone(order) ? '#86efac' : '#cbd5e1'}`,
                        background: isVorabdispoDone(order) ? '#f0fdf4' : '#f8fafc',
                        borderRadius: 8,
                        padding: '6px 8px',
                      }}
                    >
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#334155', fontWeight: 700 }}>
                        <input
                          type="checkbox"
                          checked={isVorabdispoDone(order)}
                          disabled={isVorabdispoDone(order)}
                          onChange={(event) => setVorabdispoStatus(order.id, event.target.checked)}
                        />
                        Vorabdispo Projekt
                      </label>
                      <div style={{ marginTop: 3, fontSize: 10, color: isVorabdispoDone(order) ? '#166534' : '#64748b' }}>
                        {isVorabdispoDone(order)
                          ? `Gesetzt von ${order.vorabdispoVon || 'Unbekannt'}`
                          : 'Nach Setzen nicht mehr rueckgaengig'}
                      </div>
                    </div>
                    <div style={{ marginTop: 6, display: 'grid', gap: 4 }}>
                      {(order.kommentare || []).slice(-2).map((kommentar) => (
                        <div key={kommentar.id} style={{ fontSize: 11, color: '#475569', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '3px 6px' }}>
                          <strong>{kommentar.rolle} ({kommentar.autor || 'Unbekannt'}):</strong> {kommentar.text}
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                      <input
                        type="text"
                        value={commentDrafts[order.id] || ''}
                        onChange={(event) => setCommentDraft(order.id, event.target.value)}
                        placeholder="AV Kommentar..."
                        style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: 6, padding: '5px 8px', fontSize: 11 }}
                      />
                      <button
                        type="button"
                        onClick={() => addOrderComment(order.id, 'AV')}
                        style={{ border: '1px solid #93c5fd', background: '#eff6ff', color: '#1d4ed8', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                      >
                        +
                      </button>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 11, color: '#334155', fontWeight: 700 }}>
                      Bearbeitungsstand: {bearbeitungsstandProgress.done}/{bearbeitungsstandProgress.total}
                    </div>
                    {bearbeitungsstandDoneItems.length > 0 && (
                      <div style={{ marginTop: 5, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {bearbeitungsstandDoneItems.slice(0, 3).map((item) => (
                          <span
                            key={`done-${order.id}-${item.key}`}
                            style={{
                              border: '1px solid #86efac',
                              background: '#f0fdf4',
                              color: '#166534',
                              borderRadius: 999,
                              padding: '1px 7px',
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                          >
                            {item.label}
                          </span>
                        ))}
                        {bearbeitungsstandDoneItems.length > 3 && (
                          <span style={{ fontSize: 10, color: '#475569', fontWeight: 700 }}>
                            +{bearbeitungsstandDoneItems.length - 3} weitere
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={tileMetaStyle}>Fertigungsende: {formatDateFromDate(getFertigungsendeDate(order))}</div>
                    <div style={tileMetaStyle}>
                      Montagetermin: {formatDate(order.faelligBis)}
                      <TerminverschiebungIndicator
                        record={order}
                        fieldKey="faelligBis"
                        onOpen={() => setTerminModal({
                          record: order,
                          fieldKey: 'faelligBis',
                          title: `Historie Montagetermin - ${order.id}`,
                        })}
                      />
                    </div>
                    {getTerminVerschiebung(order).shifted && (
                      <span style={{ display: 'inline-block', marginTop: 3, borderRadius: 999, padding: '1px 7px', fontSize: 10, fontWeight: 700, background: '#fff7ed', color: '#9a3412', border: '1px solid #fdba74' }}>
                        {getTerminVerschiebung(order).label}
                      </span>
                    )}
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{order.geplanteStunden} h</div>
                    {isStundenNachgebessert(order) && (
                      <div style={{ fontSize: 10, color: '#0f766e', fontWeight: 700 }}>
                        Ursprung: {getOriginalGeplanteStunden(order)} h
                      </div>
                    )}
                    {isEditingHours ? (
                      <div style={{ marginTop: 6, display: 'grid', gap: 5, justifyItems: 'end' }}>
                        <input
                          type="number"
                          min="0"
                          step="0.25"
                          value={stundenEditDrafts[order.id]}
                          onChange={(event) => setStundenEditDrafts((prev) => ({ ...prev, [order.id]: event.target.value }))}
                          style={{ width: 90, border: '1px solid #94a3b8', borderRadius: 6, padding: '4px 6px', fontSize: 11 }}
                        />
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            type="button"
                            onClick={() => saveAuftragspoolStundenEdit(order.id)}
                            style={{ border: '1px solid #16a34a', background: '#dcfce7', color: '#166534', borderRadius: 6, padding: '2px 6px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                          >
                            Speichern
                          </button>
                          <button
                            type="button"
                            onClick={() => cancelAuftragspoolStundenEdit(order.id)}
                            style={{ border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', borderRadius: 6, padding: '2px 6px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                          >
                            Abbruch
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startAuftragspoolStundenEdit(order.id)}
                        style={{ marginTop: 6, border: '1px solid #0ea5e9', background: '#f0f9ff', color: '#0369a1', borderRadius: 6, padding: '2px 6px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Stunden anpassen
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openBearbeitungsstandModal(order.id)}
                      style={{
                        marginTop: 6,
                        border: '1px solid #38bdf8',
                        background: '#f0f9ff',
                        color: '#075985',
                        borderRadius: 999,
                        padding: '3px 10px',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Bearbeitungsstand
                    </button>
                    <button
                      type="button"
                      onClick={() => requestAvFertig(order.id)}
                      style={{
                        marginTop: 6,
                        border: '1px solid #16a34a',
                        background: '#dcfce7',
                        color: '#166534',
                        borderRadius: 999,
                        padding: '3px 10px',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      AV Fertig
                    </button>
                  </div>
                </div>
                  );
                })()
              )) : (
                <div style={{ padding: 10, fontSize: 12, color: '#64748b' }}>Keine Aufträge in AV Bearbeitung.</div>
              )}
            </div>

            <div
              onDragOver={handleOnHoldDragOver}
              onDragLeave={() => setIsOnHoldDropActive(false)}
              onDrop={handleOnHoldDrop}
              style={{
                background: '#ffffff',
                border: isOnHoldDropActive ? '2px dashed #f59e0b' : '1px solid #d8e1ea',
                borderRadius: 8,
                overflow: 'hidden',
                boxShadow: isOnHoldDropActive ? '0 0 0 3px rgba(245, 158, 11, 0.2)' : 'none',
              }}
            >
              <div style={{ padding: '8px 10px', background: '#eaf0f6', borderBottom: '1px solid #d8e1ea', fontWeight: 700, fontSize: 13, color: '#1f2937' }}>
                AV On Hold ({avOnHoldOrders.length})
              </div>
              <div style={{ padding: '8px 10px', fontSize: 11, color: '#64748b', borderBottom: '1px solid #e2e8f0', background: '#fffbeb' }}>
                Ziehe Aufträge aus "AV in Bearbeitung" hierher, um sie auf On Hold zu setzen.
              </div>
              {avOnHoldOrders.length > 0 ? avOnHoldOrders.slice(0, 6).map((order, index) => (
                (() => {
                  const vorabdispoBadge = getVorabdispoBadgeMeta(order);
                  const bearbeitungsstandProgress = getBearbeitungsstandProgress(order);
                  const bearbeitungsstandDoneItems = getBearbeitungsstandDoneItems(order);
                  return (
                <div
                  key={`av-hold-${order.id}`}
                  draggable
                  onDragStart={() => startDragOrder(order.id, 'onHold')}
                  onDragEnd={endDragOrder}
                  style={{
                    ...tileEntryCardStyle,
                    margin: '8px 10px',
                    borderLeft: '4px solid #f59e0b',
                    borderTop: index === 0 ? '1px solid #dbe3ec' : tileEntryCardStyle.border,
                    background: '#fffdf5',
                    cursor: 'grab',
                    opacity: draggedOrderId === order.id ? 0.6 : 1,
                  }}
                >
                  <div>
                    <div style={tileTitleStyle}>{order.id} - {order.auftrag}</div>
                    <div style={{ fontSize: 11, color: '#92400e', fontWeight: 700 }}>On Hold | Bearbeiter AV: {order.bearbeiter || 'Unbekannt'}</div>
                    <span style={{ display: 'inline-block', marginTop: 4, borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 800, letterSpacing: 0.2, ...vorabdispoBadge.style }}>
                      {vorabdispoBadge.text}
                    </span>
                    <div
                      style={{
                        marginTop: 6,
                        border: `1px solid ${isVorabdispoDone(order) ? '#86efac' : '#fcd34d'}`,
                        background: isVorabdispoDone(order) ? '#f0fdf4' : '#fffbeb',
                        borderRadius: 8,
                        padding: '6px 8px',
                      }}
                    >
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#92400e', fontWeight: 700 }}>
                        <input
                          type="checkbox"
                          checked={isVorabdispoDone(order)}
                          disabled={isVorabdispoDone(order)}
                          onChange={(event) => setVorabdispoStatus(order.id, event.target.checked)}
                        />
                        Vorabdispo Projekt
                      </label>
                      <div style={{ marginTop: 3, fontSize: 10, color: isVorabdispoDone(order) ? '#166534' : '#92400e' }}>
                        {isVorabdispoDone(order)
                          ? `Gesetzt von ${order.vorabdispoVon || 'Unbekannt'}`
                          : 'Nach Setzen nicht mehr rueckgaengig'}
                      </div>
                    </div>
                    <div style={{ marginTop: 6, display: 'grid', gap: 4 }}>
                      {(order.kommentare || []).slice(-2).map((kommentar) => (
                        <div key={kommentar.id} style={{ fontSize: 11, color: '#78350f', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '3px 6px' }}>
                          <strong>{kommentar.rolle} ({kommentar.autor || 'Unbekannt'}):</strong> {kommentar.text}
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                      <input
                        type="text"
                        value={commentDrafts[order.id] || ''}
                        onChange={(event) => setCommentDraft(order.id, event.target.value)}
                        placeholder="AV Kommentar..."
                        style={{ flex: 1, border: '1px solid #fcd34d', borderRadius: 6, padding: '5px 8px', fontSize: 11 }}
                      />
                      <button
                        type="button"
                        onClick={() => addOrderComment(order.id, 'AV')}
                        style={{ border: '1px solid #fcd34d', background: '#fef3c7', color: '#92400e', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                      >
                        +
                      </button>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 11, color: '#78350f', fontWeight: 700 }}>
                      Bearbeitungsstand: {bearbeitungsstandProgress.done}/{bearbeitungsstandProgress.total}
                    </div>
                    {bearbeitungsstandDoneItems.length > 0 && (
                      <div style={{ marginTop: 5, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {bearbeitungsstandDoneItems.slice(0, 3).map((item) => (
                          <span
                            key={`hold-done-${order.id}-${item.key}`}
                            style={{
                              border: '1px solid #86efac',
                              background: '#f0fdf4',
                              color: '#166534',
                              borderRadius: 999,
                              padding: '1px 7px',
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                          >
                            {item.label}
                          </span>
                        ))}
                        {bearbeitungsstandDoneItems.length > 3 && (
                          <span style={{ fontSize: 10, color: '#78350f', fontWeight: 700 }}>
                            +{bearbeitungsstandDoneItems.length - 3} weitere
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ ...tileMetaStyle, color: '#92400e' }}>Fertigungsende: {formatDateFromDate(getFertigungsendeDate(order))}</div>
                    <div style={{ ...tileMetaStyle, color: '#92400e' }}>
                      Montagetermin: {formatDate(order.faelligBis)}
                      <TerminverschiebungIndicator
                        record={order}
                        fieldKey="faelligBis"
                        onOpen={() => setTerminModal({
                          record: order,
                          fieldKey: 'faelligBis',
                          title: `Historie Montagetermin - ${order.id}`,
                        })}
                      />
                    </div>
                    {getTerminVerschiebung(order).shifted && (
                      <span style={{ display: 'inline-block', marginTop: 3, borderRadius: 999, padding: '1px 7px', fontSize: 10, fontWeight: 700, background: '#fff7ed', color: '#9a3412', border: '1px solid #fdba74' }}>
                        {getTerminVerschiebung(order).label}
                      </span>
                    )}
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{order.geplanteStunden} h</div>
                    {isStundenNachgebessert(order) && (
                      <div style={{ fontSize: 10, color: '#0f766e', fontWeight: 700 }}>
                        Ursprung: {getOriginalGeplanteStunden(order)} h
                      </div>
                    )}
                  </div>
                </div>
                  );
                })()
              )) : (
                <div style={{ padding: 10, fontSize: 12, color: '#64748b' }}>Keine Aufträge On Hold.</div>
              )}
            </div>
          </div>
        </section>

        <section style={{ background: '#eef3f8', borderRadius: 10, border: '1px solid #d8e1ea', padding: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1f2937', marginBottom: 10 }}>Von Konstruktion uebergeben - noch nicht in AV Bearbeitung</div>
          {avPoolOrders.length > 0 ? (
            <div style={{ overflowX: 'auto', border: '1px solid #dbe3ec', borderRadius: 8, background: '#ffffff' }}>
              <table style={{ width: '100%', minWidth: 1480, borderCollapse: 'separate', borderSpacing: 0, fontSize: 13 }}>
                <thead>
                  <tr>
                    {['', 'Auftrags-ID', 'Auftrag', 'Status', 'Konstrukteur -> AV', 'Bearbeiter AV', 'Produkte', 'Fertigungsende', 'Montagetermin', 'Produktionsstunden', 'Vorabdispo', 'Drag nach AV'].map((head) => (
                      <th
                        key={head}
                        style={{
                          textAlign: 'left',
                          padding: '9px 10px',
                          background: '#ecf1f6',
                          color: '#334155',
                          borderBottom: '1px solid #dbe3ec',
                          borderRight: '1px solid #e2e8f0',
                          fontSize: 11,
                          textTransform: 'uppercase',
                          letterSpacing: 0.3,
                          position: 'sticky',
                          top: 0,
                          zIndex: 2,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {avPoolOrders.map((order, index) => {
                    const isExpanded = expandedOrderIds.includes(order.id);
                    const delayed = isOrderDelayed(order);
                    const statusStyles = getStatusPillStyles(order.status);
                    const fristMeta = getAuftragspoolFristMeta(order);
                    const vorabdispoBadge = getVorabdispoBadgeMeta(order);
                    const montageterminMeta = getAbrufMeta(order.faelligBis);
                    const fertigungsendeDate = getFertigungsendeDate(order);
                    const fertigungsendeMeta = getDateMeta(fertigungsendeDate);
                    const terminShift = getTerminVerschiebung(order);
                    const terminUnquittiert = terminShift.shifted && !isTerminAenderungQuittiert(order);
                    const konstruktionKommentar = getLatestKonstruktionKommentar(order);
                    const produktTypen = order.produkte.map((produkt) => produkt.typ);
                    const isEditingHours = Object.prototype.hasOwnProperty.call(stundenEditDrafts, order.id);
                    return (
                      <React.Fragment key={order.id}>
                        <tr
                          draggable
                          onDragStart={() => startDragOrder(order.id, 'pool')}
                          onDragEnd={endDragOrder}
                          style={{
                            background: terminUnquittiert
                              ? '#fee2e2'
                              : (delayed
                              ? '#fff7f7'
                              : (fristMeta.rowBackground || (index % 2 === 0 ? '#ffffff' : '#f8fbff'))),
                            borderBottom: terminUnquittiert ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                            cursor: 'grab',
                            opacity: draggedOrderId === order.id ? 0.6 : 1,
                          }}
                        >
                          <td style={{ padding: '10px 10px', verticalAlign: 'top', borderRight: '1px solid #eef2f7' }}>
                            <button
                              type="button"
                              onClick={() => toggleOrderDetails(order.id)}
                              style={{ border: '1px solid #cbd5e1', background: '#ffffff', borderRadius: 6, cursor: 'pointer', width: 24, height: 24, fontSize: 13, fontWeight: 700 }}
                            >
                              {isExpanded ? '-' : '+'}
                            </button>
                          </td>
                          <td style={{ padding: '10px 10px', fontWeight: 700, verticalAlign: 'top', borderRight: '1px solid #eef2f7', fontFamily: 'Consolas, monospace', fontSize: 12 }}>{order.id}</td>
                          <td style={{ padding: '10px 10px', verticalAlign: 'top', borderRight: '1px solid #eef2f7', fontWeight: 600 }}>{order.auftrag}</td>
                          <td style={{ padding: '10px 10px', verticalAlign: 'top', borderRight: '1px solid #eef2f7' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              <span style={{ display: 'inline-block', borderRadius: 999, padding: '2px 9px', fontSize: 11, fontWeight: 700, ...statusStyles }}>{order.status}</span>
                              {delayed && <span style={{ display: 'inline-block', borderRadius: 999, padding: '2px 9px', fontSize: 11, fontWeight: 700, background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>Ueberfaellig</span>}
                              {!delayed && fristMeta.badge && (
                                <span style={{ display: 'inline-block', borderRadius: 999, padding: '2px 9px', fontSize: 11, fontWeight: 700, ...fristMeta.badge.style }}>
                                  {fristMeta.badge.text}
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '10px 10px', verticalAlign: 'top', borderRight: '1px solid #eef2f7' }}>
                            <div>{order.konstrukteurUebergebenVon || (order.status === 'in Konstruktion' ? `offen (${order.konstrukteur || 'Unbekannt'})` : '-')}</div>
                            <div style={{ marginTop: 2, fontSize: 11, color: '#64748b' }}>Übergabe: {formatDate(getUebergabeDatum(order))}</div>
                            {konstruktionKommentar && (
                              <div style={{ marginTop: 4, fontSize: 11, color: '#4338ca', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 6, padding: '3px 6px' }}>
                                Konstruktion ({konstruktionKommentar.autor || 'Unbekannt'}): {konstruktionKommentar.text}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '10px 10px', verticalAlign: 'top', borderRight: '1px solid #eef2f7' }}>
                            <span style={{ color: '#64748b' }}>Noch nicht gestartet</span>
                          </td>
                          <td style={{ padding: '10px 10px', verticalAlign: 'top', borderRight: '1px solid #eef2f7' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {produktTypen.map((typ) => (
                                <span key={`${order.id}-typ-${typ}`} style={{ border: '1px solid #dbe3ec', background: '#f8fafc', borderRadius: 999, padding: '2px 8px', fontSize: 11, color: '#334155', fontWeight: 600 }}>
                                  {typ}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: '10px 10px', verticalAlign: 'top', borderRight: '1px solid #eef2f7' }}>
                            <div>{formatDateFromDate(fertigungsendeDate)}</div>
                            <span style={{ display: 'inline-block', marginTop: 3, borderRadius: 999, padding: '1px 7px', fontSize: 10, fontWeight: 700, ...fertigungsendeMeta.style }}>{fertigungsendeMeta.text}</span>
                          </td>
                          <td style={{ padding: '10px 10px', verticalAlign: 'top', borderRight: '1px solid #eef2f7' }}>
                            <div>
                              {formatDate(order.faelligBis)}
                              <TerminverschiebungIndicator
                                record={order}
                                fieldKey="faelligBis"
                                onOpen={() => setTerminModal({
                                  record: order,
                                  fieldKey: 'faelligBis',
                                  title: `Historie Montagetermin - ${order.id}`,
                                })}
                              />
                            </div>
                            <span style={{ display: 'inline-block', marginTop: 3, borderRadius: 999, padding: '1px 7px', fontSize: 10, fontWeight: 700, ...montageterminMeta.style }}>{montageterminMeta.text}</span>
                            {terminShift.shifted && (
                              <>
                                <span style={{ display: 'inline-block', marginTop: 3, borderRadius: 999, padding: '1px 7px', fontSize: 10, fontWeight: 700, background: '#fff7ed', color: '#9a3412', border: '1px solid #fdba74' }}>
                                  {terminShift.label}
                                </span>
                                <span style={{ display: 'inline-block', marginTop: 3, marginLeft: 4, borderRadius: 999, padding: '1px 7px', fontSize: 10, fontWeight: 700, background: isTerminAenderungQuittiert(order) ? '#dcfce7' : '#fee2e2', color: isTerminAenderungQuittiert(order) ? '#166534' : '#991b1b', border: `1px solid ${isTerminAenderungQuittiert(order) ? '#bbf7d0' : '#fecaca'}` }}>
                                  {isTerminAenderungQuittiert(order) ? 'Quittiert' : 'Nicht quittiert'}
                                </span>
                              </>
                            )}
                          </td>
                          <td style={{ padding: '10px 10px', verticalAlign: 'top', fontWeight: 700, borderRight: '1px solid #eef2f7' }}>
                            <div>{order.geplanteStunden} h</div>
                            {isStundenNachgebessert(order) && (
                              <div style={{ fontSize: 10, color: '#0f766e', fontWeight: 700 }}>
                                Ursprung: {getOriginalGeplanteStunden(order)} h
                              </div>
                            )}
                            {isEditingHours ? (
                              <div style={{ marginTop: 6, display: 'grid', gap: 5 }}>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.25"
                                  value={stundenEditDrafts[order.id]}
                                  onChange={(event) => setStundenEditDrafts((prev) => ({ ...prev, [order.id]: event.target.value }))}
                                  style={{ width: 90, border: '1px solid #94a3b8', borderRadius: 6, padding: '4px 6px', fontSize: 11 }}
                                />
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <button
                                    type="button"
                                    onClick={() => saveAuftragspoolStundenEdit(order.id)}
                                    style={{ border: '1px solid #16a34a', background: '#dcfce7', color: '#166534', borderRadius: 6, padding: '2px 6px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    Speichern
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => cancelAuftragspoolStundenEdit(order.id)}
                                    style={{ border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', borderRadius: 6, padding: '2px 6px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    Abbruch
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => startAuftragspoolStundenEdit(order.id)}
                                style={{ marginTop: 6, border: '1px solid #0ea5e9', background: '#f0f9ff', color: '#0369a1', borderRadius: 6, padding: '2px 6px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                              >
                                Stunden anpassen
                              </button>
                            )}
                          </td>
                          <td style={{ padding: '10px 10px', verticalAlign: 'top', borderRight: '1px solid #eef2f7' }}>
                            <label style={{ display: 'grid', gap: 4 }}>
                              <span style={{ display: 'inline-block', width: 'fit-content', borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 800, letterSpacing: 0.2, ...vorabdispoBadge.style }}>
                                {vorabdispoBadge.text}
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#334155' }}>
                                <input
                                  type="checkbox"
                                  checked={isVorabdispoDone(order)}
                                  disabled
                                  onChange={(event) => setVorabdispoStatus(order.id, event.target.checked)}
                                />
                                Vorabdispo gemacht
                              </span>
                              {!isVorabdispoDone(order) && (
                                <span style={{ fontSize: 10, color: '#64748b' }}>
                                  Erst setzbar, wenn Auftrag in Bearbeitung ist.
                                </span>
                              )}
                              {isVorabdispoDone(order) && (
                                <span style={{ fontSize: 11, color: '#166534', fontWeight: 700 }}>
                                  von {order.vorabdispoVon || 'Unbekannt'}
                                </span>
                              )}
                            </label>
                          </td>
                          <td style={{ padding: '10px 10px', verticalAlign: 'top' }}>
                            <div style={{ display: 'grid', gap: 6 }}>
                              <button
                                type="button"
                                style={{ border: '1px solid #2563eb', background: '#eff6ff', color: '#1d4ed8', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700, cursor: 'grab' }}
                              >
                                Nach oben ziehen
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={12} style={{ padding: '10px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                              <div style={{ display: 'grid', gap: 10 }}>
                                <div style={{ border: `1px solid ${isVorabdispoDone(order) ? '#86efac' : '#fca5a5'}`, borderRadius: 8, background: isVorabdispoDone(order) ? '#f0fdf4' : '#fff1f2', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#334155', fontWeight: 700 }}>
                                    <input
                                      type="checkbox"
                                      checked={isVorabdispoDone(order)}
                                      disabled
                                      onChange={(event) => setVorabdispoStatus(order.id, event.target.checked)}
                                    />
                                    Vorabdispo für gesamtes Projekt
                                  </label>
                                  <span style={{ display: 'inline-block', borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 800, letterSpacing: 0.2, ...vorabdispoBadge.style }}>
                                    {vorabdispoBadge.text}
                                  </span>
                                </div>
                                <div style={{ border: '1px solid #dbe3ec', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 0.8fr 1.2fr 1fr 1.5fr 1.2fr', background: '#ecf1f6', color: '#334155', fontSize: 11, fontWeight: 700 }}>
                                    <div style={{ padding: '7px 10px' }}>Produkt</div>
                                    <div style={{ padding: '7px 10px' }}>Stückzahl</div>
                                    <div style={{ padding: '7px 10px' }}>Status</div>
                                    <div style={{ padding: '7px 10px' }}>Produktionsstunden</div>
                                    <div style={{ padding: '7px 10px' }}>Produktionsstart</div>
                                    <div style={{ padding: '7px 10px' }}>Vorabdispo</div>
                                  </div>
                                  {order.produkte.map((produkt, produktIndex) => (
                                    <div key={`${order.id}-detail-${produkt.typ}-${produktIndex}`} style={{ display: 'grid', gridTemplateColumns: '1.7fr 0.8fr 1.2fr 1fr 1.5fr 1.2fr', borderTop: produktIndex === 0 ? 'none' : '1px solid #e2e8f0', fontSize: 12 }}>
                                      <div style={{ padding: '8px 10px' }}>{produkt.typ}</div>
                                      <div style={{ padding: '8px 10px' }}>{produkt.stueckzahl}</div>
                                      <div style={{ padding: '8px 10px' }}>{produkt.status}</div>
                                      <div style={{ padding: '8px 10px', fontWeight: 700 }}>{produkt.geplanteStunden} h</div>
                                      <div style={{ padding: '8px 10px' }}>
                                        {formatDateTime(order.produktionsstart)}
                                        <TerminverschiebungIndicator
                                          record={order}
                                          fieldKey="produktionsstart"
                                          onOpen={() => setTerminModal({
                                            record: order,
                                            fieldKey: 'produktionsstart',
                                            title: `Historie Produktionsstart - ${order.id}`,
                                          })}
                                        />
                                      </div>
                                      <div style={{ padding: '8px 10px' }}>
                                        {produkt.vorabdispoGemacht ? (
                                          <span style={{ display: 'inline-block', borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 800, background: '#dcfce7', color: '#166534', border: '1px solid #86efac' }}>
                                            Ja ({produkt.vorabdispoVon || order.vorabdispoVon || '-'})
                                          </span>
                                        ) : (
                                          <span style={{ display: 'inline-block', borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 800, background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}>Nein</span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <div style={{ border: '1px solid #dbe3ec', borderRadius: 8, background: '#ffffff', padding: 10 }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Kommentare</div>
                                  <div style={{ display: 'grid', gap: 6, marginBottom: 8 }}>
                                    {(order.kommentare || []).length > 0 ? (order.kommentare || []).map((kommentar) => (
                                      <div key={kommentar.id} style={{ border: '1px solid #e2e8f0', borderRadius: 6, background: '#f8fafc', padding: '6px 8px' }}>
                                        <div style={{ fontSize: 11, color: '#64748b' }}>
                                          {kommentar.rolle} - {kommentar.autor} - {formatDateTime(kommentar.createdAt)}
                                        </div>
                                        <div style={{ fontSize: 12, color: '#0f172a' }}>{kommentar.text}</div>
                                      </div>
                                    )) : (
                                      <div style={{ fontSize: 12, color: '#64748b' }}>Noch keine Kommentare vorhanden.</div>
                                    )}
                                  </div>

                                  <div style={{ display: 'flex', gap: 8 }}>
                                    <input
                                      type="text"
                                      value={commentDrafts[order.id] || ''}
                                      onChange={(event) => setCommentDraft(order.id, event.target.value)}
                                      placeholder="Kommentar von Konstruktion..."
                                      style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: 6, padding: '7px 9px', fontSize: 12 }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => addOrderComment(order.id, 'Konstruktion')}
                                      style={{ border: '1px solid #c7d2fe', background: '#eef2ff', color: '#3730a3', borderRadius: 6, padding: '6px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                                    >
                                      Konstruktion Kommentar
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ background: '#ffffff', border: '1px solid #d8e1ea', borderRadius: 10, padding: '18px 14px', textAlign: 'center', color: '#6b7280' }}>
              Keine Aufträge für diese Filter gefunden.
            </div>
          )}
        </section>

        <section style={{ background: '#eef3f8', borderRadius: 10, border: '1px solid #d8e1ea', padding: 12, marginTop: 12 }}>
          <div style={{ background: '#ffffff', border: '1px solid #d8e1ea', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '8px 10px', background: '#eaf0f6', borderBottom: '1px solid #d8e1ea', fontWeight: 700, fontSize: 13, color: '#1f2937' }}>
              In Erwartung naechste {erwartungHorizonDays} Tage ({erwartungOrders.length})
            </div>
            {erwartungOrders.length > 0 ? erwartungOrders.slice(0, 8).map((order, index) => (
              <div
                key={`av-coming-${order.id}`}
                style={{
                  ...tileEntryCardStyle,
                  margin: '8px 10px',
                  borderLeft: '4px solid #93c5fd',
                  borderTop: index === 0 ? '1px solid #dbe3ec' : tileEntryCardStyle.border,
                }}
              >
                <div>
                  <div style={tileTitleStyle}>{order.id} - {order.auftrag}</div>
                  <div style={tileMetaStyle}>
                    Konstrukteur: {order.konstrukteur || 'Unbekannt'} | Soll bis: {formatDate(order.statusSollBis)}
                    <TerminverschiebungIndicator
                      record={order}
                      fieldKey="statusSollBis"
                      onOpen={() => setTerminModal({
                        record: order,
                        fieldKey: 'statusSollBis',
                        title: `Historie Soll bis - ${order.id}`,
                      })}
                    />
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={tileMetaStyle}>Fertigungsende: {formatDateFromDate(getFertigungsendeDate(order))}</div>
                  <div style={tileMetaStyle}>
                    Montagetermin: {formatDate(order.faelligBis)}
                    <TerminverschiebungIndicator
                      record={order}
                      fieldKey="faelligBis"
                      onOpen={() => setTerminModal({
                        record: order,
                        fieldKey: 'faelligBis',
                        title: `Historie Montagetermin - ${order.id}`,
                      })}
                    />
                  </div>
                  {getTerminVerschiebung(order).shifted && (
                    <span style={{ display: 'inline-block', marginTop: 3, borderRadius: 999, padding: '1px 7px', fontSize: 10, fontWeight: 700, background: '#fff7ed', color: '#9a3412', border: '1px solid #fdba74' }}>
                      {getTerminVerschiebung(order).label}
                    </span>
                  )}
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{order.geplanteStunden} h</div>
                  {isStundenNachgebessert(order) && (
                    <div style={{ fontSize: 10, color: '#0f766e', fontWeight: 700 }}>
                      Ursprung: {getOriginalGeplanteStunden(order)} h
                    </div>
                  )}
                </div>
              </div>
            )) : (
              <div style={{ padding: 10, fontSize: 12, color: '#64748b' }}>Keine erwarteten Aufträge im Zeitraum.</div>
            )}
          </div>
        </section>

        </>
        )}

        {projectDetailOrder && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.45)',
              display: 'grid',
              placeItems: 'center',
              zIndex: 1200,
              padding: 20,
            }}
          >
            <div
              style={{
                width: 'min(1100px, 96vw)',
                maxHeight: '90vh',
                overflow: 'auto',
                background: '#ffffff',
                border: '1px solid #d8e1ea',
                borderRadius: 12,
                boxShadow: '0 20px 48px rgba(15, 23, 42, 0.28)',
              }}
            >
              <div style={{ padding: '12px 14px', background: '#eaf0f6', borderBottom: '1px solid #d8e1ea', fontWeight: 700, color: '#1f2937' }}>
                Bauteilliste Detail - {projectDetailOrder.id} - {projectDetailOrder.auftrag}
              </div>
              <div style={{ padding: 14, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                <div style={{ display: 'grid', gap: 10 }}>
                  <div style={{ border: '1px solid #dbe3ec', borderRadius: 8, padding: 10, background: '#f8fafc' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Stammdaten bearbeiten</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(170px, 1fr))', gap: 8 }}>
                      <label style={{ display: 'grid', gap: 4, fontSize: 12 }}>
                        <span>Status</span>
                        <select value={projectDetailDraft.status} onChange={(event) => setProjectDetailDraft((prev) => ({ ...prev, status: event.target.value }))} style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: '6px 8px', fontSize: 12 }}>
                          <option value="bestellt">bestellt</option>
                          <option value="in Konstruktion">in Konstruktion</option>
                          <option value="AV Auftragspool">AV Auftragspool</option>
                          <option value="in Bearbeitung">in Bearbeitung</option>
                          <option value="in Bearbeitung On Hold">in Bearbeitung On Hold</option>
                          <option value="AV Arbeit fertig">AV Arbeit fertig</option>
                        </select>
                      </label>
                      <label style={{ display: 'grid', gap: 4, fontSize: 12 }}>
                        <span>Bearbeiter</span>
                        <select value={projectDetailDraft.bearbeiter} onChange={(event) => setProjectDetailDraft((prev) => ({ ...prev, bearbeiter: event.target.value }))} style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: '6px 8px', fontSize: 12 }}>
                          <option value="">-</option>
                          {mitarbeiterOptions.map((name) => (
                            <option key={`detail-user-${name}`} value={name}>{name}</option>
                          ))}
                        </select>
                      </label>
                      <label style={{ display: 'grid', gap: 4, fontSize: 12 }}>
                        <span>Status Soll bis</span>
                        <input type="date" value={projectDetailDraft.statusSollBis || ''} onChange={(event) => setProjectDetailDraft((prev) => ({ ...prev, statusSollBis: event.target.value }))} style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: '6px 8px', fontSize: 12 }} />
                      </label>
                      <label style={{ display: 'grid', gap: 4, fontSize: 12 }}>
                        <span>Montagetermin</span>
                        <input type="date" value={projectDetailDraft.faelligBis || ''} onChange={(event) => setProjectDetailDraft((prev) => ({ ...prev, faelligBis: event.target.value }))} style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: '6px 8px', fontSize: 12 }} />
                      </label>
                      <label style={{ display: 'grid', gap: 4, fontSize: 12 }}>
                        <span>Produktionsstart</span>
                        <input type="text" value={projectDetailDraft.produktionsstart || ''} onChange={(event) => setProjectDetailDraft((prev) => ({ ...prev, produktionsstart: event.target.value }))} style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: '6px 8px', fontSize: 12 }} />
                      </label>
                      <label style={{ display: 'grid', gap: 4, fontSize: 12 }}>
                        <span>Nachgebesserte Stunden (AV)</span>
                        <input type="number" min="0" value={projectDetailDraft.geplanteStunden} onChange={(event) => setProjectDetailDraft((prev) => ({ ...prev, geplanteStunden: Number(event.target.value) || 0 }))} style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: '6px 8px', fontSize: 12 }} />
                      </label>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 11, color: '#334155' }}>
                      Ursprungsstunden aus System: <strong>{getOriginalGeplanteStunden(projectDetailOrder)} h</strong>
                    </div>
                    {isStundenNachgebessert(projectDetailOrder) && (
                      <div style={{ marginTop: 3, fontSize: 11, color: '#0f766e' }}>
                        Aktuell AV-nachgebessert auf <strong>{projectDetailOrder.geplanteStunden} h</strong>
                        {projectDetailOrder.stundenNachgebessertVon ? ` von ${projectDetailOrder.stundenNachgebessertVon}` : ''}
                        {projectDetailOrder.stundenNachgebessertAm ? ` am ${formatDateTime(projectDetailOrder.stundenNachgebessertAm)}` : ''}
                      </div>
                    )}
                    <label style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700 }}>
                      <input type="checkbox" checked={Boolean(projectDetailDraft.vorabdispoGemacht)} onChange={(event) => setProjectDetailDraft((prev) => ({ ...prev, vorabdispoGemacht: event.target.checked }))} />
                      Vorabdispo gesetzt
                    </label>
                  </div>

                  <div style={{ border: '1px solid #dbe3ec', borderRadius: 8, padding: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Bearbeitungsstand</div>
                    <div style={{ display: 'grid', gap: 6 }}>
                      {bearbeitungsstandChecklist.map((item) => {
                        const standValue = (projectDetailOrder.bearbeitungsstand || {})[item.key];
                        const isDone = typeof standValue === 'object' && standValue !== null ? Boolean(standValue.done) : Boolean(standValue);
                        const doneAt = typeof standValue === 'object' && standValue !== null ? standValue.doneAt : '';
                        const doneBy = typeof standValue === 'object' && standValue !== null ? standValue.doneBy : '';
                        return (
                          <label key={`project-detail-stand-${item.key}`} style={{ display: 'grid', gap: 2, border: '1px solid #e2e8f0', borderRadius: 6, padding: '6px 8px', background: isDone ? '#f0fdf4' : '#ffffff' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                              <input type="checkbox" checked={isDone} onChange={(event) => setBearbeitungsstandValue(projectDetailOrder.id, item.key, event.target.checked)} />
                              {item.label}
                            </span>
                            {isDone && (
                              <span style={{ fontSize: 10, color: '#166534' }}>
                                {doneBy || '-'} | {formatDateTime(doneAt)}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 10 }}>
                  <div style={{ border: '1px solid #dbe3ec', borderRadius: 8, padding: 10, background: '#ffffff' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Kommentare</div>
                    <div style={{ maxHeight: 180, overflow: 'auto', display: 'grid', gap: 6, marginBottom: 8 }}>
                      {(projectDetailOrder.kommentare || []).length > 0 ? (projectDetailOrder.kommentare || [])
                        .slice()
                        .sort((a, b) => (parseDateLoose(b.createdAt)?.getTime() || 0) - (parseDateLoose(a.createdAt)?.getTime() || 0))
                        .map((kommentar) => (
                          <div key={kommentar.id} style={{ border: '1px solid #e2e8f0', borderRadius: 6, background: '#f8fafc', padding: '6px 8px' }}>
                            <div style={{ fontSize: 11, color: '#64748b' }}>{kommentar.rolle} - {kommentar.autor} - {formatDateTime(kommentar.createdAt)}</div>
                            <div style={{ fontSize: 12, color: '#0f172a' }}>{kommentar.text}</div>
                          </div>
                        )) : (
                          <div style={{ fontSize: 12, color: '#64748b' }}>Keine Kommentare vorhanden.</div>
                        )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 6 }}>
                      <select value={projectDetailRole} onChange={(event) => setProjectDetailRole(event.target.value)} style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: '6px 8px', fontSize: 12 }}>
                        <option value="AV">AV</option>
                        <option value="Konstruktion">Konstruktion</option>
                      </select>
                      <input type="text" value={projectDetailComment} onChange={(event) => setProjectDetailComment(event.target.value)} placeholder="Kommentar eingeben..." style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: '6px 8px', fontSize: 12 }} />
                      <button type="button" onClick={addProjectDetailComment} style={{ border: '1px solid #93c5fd', background: '#eff6ff', color: '#1d4ed8', borderRadius: 6, padding: '6px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Kommentar</button>
                    </div>
                  </div>

                  <div style={{ border: '1px solid #dbe3ec', borderRadius: 8, padding: 10, background: '#ffffff' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Bearbeitungsverlauf (mit Datum)</div>
                    <div style={{ maxHeight: 240, overflow: 'auto', display: 'grid', gap: 6 }}>
                      {(projectDetailOrder.bearbeitungen || []).length > 0 ? (projectDetailOrder.bearbeitungen || [])
                        .slice()
                        .sort((a, b) => (parseDateLoose(b.createdAt)?.getTime() || 0) - (parseDateLoose(a.createdAt)?.getTime() || 0))
                        .map((entry) => (
                          <div key={entry.id} style={{ border: '1px solid #e2e8f0', borderRadius: 6, background: '#f8fafc', padding: '6px 8px' }}>
                            <div style={{ fontSize: 11, color: '#64748b' }}>{entry.autor || '-'} - {formatDateTime(entry.createdAt)}</div>
                            <div style={{ fontSize: 12, color: '#0f172a' }}>{entry.text}</div>
                          </div>
                        )) : (
                          <div style={{ fontSize: 12, color: '#64748b' }}>Noch keine Bearbeitungen dokumentiert.</div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: 14, borderTop: '1px solid #e2e8f0' }}>
                <button type="button" onClick={closeProjectDetailModal} style={{ border: '1px solid #cbd5e1', background: '#ffffff', borderRadius: 8, padding: '8px 12px', fontSize: 13, cursor: 'pointer' }}>
                  Schließen
                </button>
                <button type="button" onClick={saveProjectDetailModal} style={{ border: '1px solid #16a34a', background: '#dcfce7', color: '#166534', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  Speichern
                </button>
              </div>
            </div>
          </div>
        )}

        {!isProjektuebersichtView && finishModalOrder && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.45)',
              display: 'grid',
              placeItems: 'center',
              zIndex: 1200,
              padding: 20,
            }}
          >
            <div
              style={{
                width: 'min(560px, 95vw)',
                background: '#ffffff',
                border: '1px solid #d8e1ea',
                borderRadius: 12,
                boxShadow: '0 20px 48px rgba(15, 23, 42, 0.28)',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '12px 14px', background: '#eaf0f6', borderBottom: '1px solid #d8e1ea', fontWeight: 700, color: '#1f2937' }}>
                AV Fertig - Checkliste
              </div>
              <div style={{ padding: 14, display: 'grid', gap: 10 }}>
                <div style={{ fontSize: 13, color: '#334155' }}>
                  <strong>{finishModalOrder.id}</strong> - {finishModalOrder.auftrag}
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#1f2937' }}>
                  <input type="checkbox" checked={finishChecklist.logikalUebergabe} onChange={(event) => setFinishCheckValue('logikalUebergabe', event.target.checked)} />
                  Logikal Übergabe gemacht
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#1f2937' }}>
                  <input type="checkbox" checked={finishChecklist.maschinendateien} onChange={(event) => setFinishCheckValue('maschinendateien', event.target.checked)} />
                  Maschinendateien erstellt
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#1f2937' }}>
                  <input type="checkbox" checked={finishChecklist.auftraegeGeprueft} onChange={(event) => setFinishCheckValue('auftraegeGeprueft', event.target.checked)} />
                  Aufträge geprüft
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#1f2937' }}>
                  <input type="checkbox" checked={finishChecklist.bestellvorschlaege} onChange={(event) => setFinishCheckValue('bestellvorschlaege', event.target.checked)} />
                  Bestellvorschlaege für den Einkauf gemacht
                </label>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={closeFinishModal}
                    style={{ border: '1px solid #cbd5e1', background: '#ffffff', borderRadius: 8, padding: '8px 12px', fontSize: 13, cursor: 'pointer' }}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmAvFertig(finishModalOrder.id)}
                    disabled={!canConfirmFinish}
                    style={{
                      border: '1px solid #16a34a',
                      background: canConfirmFinish ? '#dcfce7' : '#e5e7eb',
                      color: canConfirmFinish ? '#166534' : '#9ca3af',
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: canConfirmFinish ? 'pointer' : 'not-allowed',
                    }}
                  >
                    AV Fertig setzen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isProjektuebersichtView && onHoldModalOrder && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.45)',
              display: 'grid',
              placeItems: 'center',
              zIndex: 1200,
              padding: 20,
            }}
          >
            <div
              style={{
                width: 'min(560px, 95vw)',
                background: '#ffffff',
                border: '1px solid #d8e1ea',
                borderRadius: 12,
                boxShadow: '0 20px 48px rgba(15, 23, 42, 0.28)',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '12px 14px', background: '#fffbeb', borderBottom: '1px solid #fcd34d', fontWeight: 700, color: '#92400e' }}>
                Auftrag auf On Hold setzen
              </div>
              <div style={{ padding: 14, display: 'grid', gap: 10 }}>
                <div style={{ fontSize: 13, color: '#334155' }}>
                  <strong>{onHoldModalOrder.id}</strong> - {onHoldModalOrder.auftrag}
                </div>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 12, color: '#334155', fontWeight: 700 }}>Kommentar (Pflicht)</span>
                  <textarea
                    value={onHoldComment}
                    onChange={(event) => setOnHoldComment(event.target.value)}
                    placeholder="Grund für On Hold eintragen..."
                    rows={4}
                    style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 10px', fontSize: 13, resize: 'vertical' }}
                  />
                </label>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={closeOnHoldModal}
                    style={{ border: '1px solid #cbd5e1', background: '#ffffff', borderRadius: 8, padding: '8px 12px', fontSize: 13, cursor: 'pointer' }}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    onClick={confirmOnHoldWithComment}
                    disabled={!onHoldComment.trim()}
                    style={{
                      border: '1px solid #f59e0b',
                      background: onHoldComment.trim() ? '#fef3c7' : '#e5e7eb',
                      color: onHoldComment.trim() ? '#92400e' : '#9ca3af',
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: onHoldComment.trim() ? 'pointer' : 'not-allowed',
                    }}
                  >
                    On Hold setzen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isProjektuebersichtView && bearbeitungsstandModalOrder && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.45)',
              display: 'grid',
              placeItems: 'center',
              zIndex: 1200,
              padding: 20,
            }}
          >
            <div
              style={{
                width: 'min(700px, 96vw)',
                background: '#ffffff',
                border: '1px solid #d8e1ea',
                borderRadius: 12,
                boxShadow: '0 20px 48px rgba(15, 23, 42, 0.28)',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '12px 14px', background: '#e0f2fe', borderBottom: '1px solid #bae6fd', fontWeight: 700, color: '#0c4a6e' }}>
                Bearbeitungsstand - Checkliste
              </div>
              <div style={{ padding: 14, display: 'grid', gap: 10 }}>
                <div style={{ fontSize: 13, color: '#334155' }}>
                  <strong>{bearbeitungsstandModalOrder.id}</strong> - {bearbeitungsstandModalOrder.auftrag}
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {bearbeitungsstandChecklist.map((item) => {
                    const current = bearbeitungsstandModalOrder.bearbeitungsstand || createInitialBearbeitungsstand();
                    const isDone = Boolean(current[item.key]);
                    return (
                      <label
                        key={`stand-${item.key}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                          fontSize: 13,
                          color: '#1f2937',
                          border: `1px solid ${isDone ? '#86efac' : '#dbe3ec'}`,
                          background: isDone ? '#f0fdf4' : '#ffffff',
                          borderRadius: 8,
                          padding: '7px 10px',
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={(event) => setBearbeitungsstandValue(bearbeitungsstandModalOrder.id, item.key, event.target.checked)}
                        />
                        {item.label}
                        </span>
                        {isDone && (
                          <span style={{ borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 700, color: '#166534', background: '#dcfce7', border: '1px solid #86efac' }}>
                            Erledigt
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
                  <button
                    type="button"
                    onClick={closeBearbeitungsstandModal}
                    style={{ border: '1px solid #cbd5e1', background: '#ffffff', borderRadius: 8, padding: '8px 12px', fontSize: 13, cursor: 'pointer' }}
                  >
                    Schließen
                  </button>
                </div>
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




