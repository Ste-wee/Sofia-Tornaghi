// Elenco dei campi modificabili dal pannello.
//
// Unica fonte di verità: il pannello costruisce il modulo a partire da qui,
// e il salvataggio accetta esclusivamente queste chiavi. Una chiave non
// prevista viene scartata, quindi dal pannello non si può scrivere altro
// dentro il file di contenuto.

export const GROUPS = [
  {
    title: 'Home',
    fields: [
      { name: 'hero_sub', label: 'Frase sotto il nome', type: 'text', hint: 'La prima cosa che si legge entrando nel sito.' },
      { name: 'recensioni_num', label: 'Numero recensioni', type: 'string', hint: 'Es. 16+' }
    ]
  },
  {
    title: 'Chi sono',
    fields: [
      { name: 'bio_p1', label: 'Primo paragrafo', type: 'text' },
      { name: 'bio_p2', label: 'Secondo paragrafo', type: 'text' }
    ]
  },
  {
    title: 'Aree di lavoro',
    fields: [
      { name: 'titolo_aree', label: 'Titolo della sezione', type: 'string' },
      { name: 'aree_intro', label: 'Introduzione', type: 'text' },
      { name: 'area1_titolo', label: 'Area 1 — titolo', type: 'string' },
      { name: 'area1_desc', label: 'Area 1 — descrizione', type: 'text' },
      { name: 'area2_titolo', label: 'Area 2 — titolo', type: 'string' },
      { name: 'area2_desc', label: 'Area 2 — descrizione', type: 'text' },
      { name: 'area3_titolo', label: 'Area 3 — titolo', type: 'string' },
      { name: 'area3_desc', label: 'Area 3 — descrizione', type: 'text' },
      { name: 'area4_titolo', label: 'Area 4 — titolo', type: 'string' },
      { name: 'area4_desc', label: 'Area 4 — descrizione', type: 'text' },
      { name: 'area5_titolo', label: 'Area 5 — titolo', type: 'string' },
      { name: 'area5_desc', label: 'Area 5 — descrizione', type: 'text' },
      { name: 'area6_titolo', label: 'Area 6 — titolo', type: 'string' },
      { name: 'area6_desc', label: 'Area 6 — descrizione', type: 'text' }
    ]
  },
  {
    title: 'Recensioni',
    fields: [
      { name: 'titolo_recensioni', label: 'Titolo della sezione', type: 'string' },
      { name: 'rec1_testo', label: 'Recensione 1 — testo', type: 'text' },
      { name: 'rec1_autore', label: 'Recensione 1 — autore', type: 'string' },
      { name: 'rec2_testo', label: 'Recensione 2 — testo', type: 'text' },
      { name: 'rec2_autore', label: 'Recensione 2 — autore', type: 'string' },
      { name: 'rec3_testo', label: 'Recensione 3 — testo', type: 'text' },
      { name: 'rec3_autore', label: 'Recensione 3 — autore', type: 'string' }
    ]
  },
  {
    title: 'Servizi e tariffe',
    fields: [
      { name: 'servizi_intro', label: 'Introduzione', type: 'text' },
      { name: 'serv1_nome', label: 'Servizio 1 — nome', type: 'string' },
      { name: 'serv1_prezzo', label: 'Servizio 1 — prezzo', type: 'string' },
      { name: 'serv2_nome', label: 'Servizio 2 — nome', type: 'string' },
      { name: 'serv2_prezzo', label: 'Servizio 2 — prezzo', type: 'string' },
      { name: 'serv3_nome', label: 'Servizio 3 — nome', type: 'string' },
      { name: 'serv3_prezzo', label: 'Servizio 3 — prezzo', type: 'string' },
      { name: 'serv4_nome', label: 'Servizio 4 — nome', type: 'string' },
      { name: 'serv4_prezzo', label: 'Servizio 4 — prezzo', type: 'string' },
      { name: 'serv5_nome', label: 'Servizio 5 — nome', type: 'string' },
      { name: 'serv5_prezzo', label: 'Servizio 5 — prezzo', type: 'string' },
      { name: 'serv6_nome', label: 'Servizio 6 — nome', type: 'string' },
      { name: 'serv6_prezzo', label: 'Servizio 6 — prezzo', type: 'string' }
    ]
  },
  {
    title: 'Contatti',
    fields: [
      { name: 'titolo_contatti', label: 'Titolo della sezione', type: 'string' },
      { name: 'contatti_intro', label: 'Introduzione', type: 'text' },
      { name: 'indirizzo', label: 'Indirizzo dello studio', type: 'string' },
      { name: 'telefono', label: 'Telefono', type: 'string' }
    ]
  },
  {
    title: 'Modulo contatti',
    fields: [
      {
        name: 'web3forms_key',
        label: 'Chiave Web3Forms',
        type: 'string',
        hint: 'Si ottiene gratis su web3forms.com indicando l\'indirizzo email a cui devono arrivare i messaggi. Senza questa chiave il modulo del sito non invia nulla.'
      }
    ]
  }
];

export const FIELDS = GROUPS.reduce(function (all, group) {
  return all.concat(group.fields);
}, []);

const FIELD_NAMES = FIELDS.map(function (field) { return field.name; });

const MAX_LENGTH = 2000;

// Tiene solo le chiavi previste, accetta solo stringhe e taglia i valori
// troppo lunghi: il file di contenuto non può gonfiarsi né ospitare
// strutture arbitrarie.
export function sanitizeValues(incoming) {
  const clean = {};
  if (!incoming || typeof incoming !== 'object') return clean;

  FIELD_NAMES.forEach(function (name) {
    const value = incoming[name];
    if (typeof value !== 'string') return;
    clean[name] = value.replace(/\r\n/g, '\n').trim().slice(0, MAX_LENGTH);
  });

  return clean;
}
