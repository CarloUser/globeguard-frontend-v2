/**
 * Client-side FAQ search. The whole FAQ (about 55 questions) is on the page anyway, so a small
 * in-memory matcher answers instantly without a search service:
 *
 * - umlauts, ß and accents fold to ASCII (`Rückgabe` = `rueckgabe`, `Škoda` = `skoda`),
 * - every query word must match unless the query is long (then 60 % of the words),
 * - a word matches as a substring, through a synonym, or with one typo (two for long words),
 * - matches in the question count more than in the chapter title, which count more than in
 *   the answer.
 */

export interface FaqSearchItem {
    slug: string;
    question: string;
    /** Answer as plain text (HTML stripped). */
    answerText: string;
    groupTitle: string;
}

export interface FaqSearchHit {
    slug: string;
    score: number;
}

interface IndexedItem {
    slug: string;
    question: string;
    group: string;
    answer: string;
    words: string[];
}

const QUESTION_WEIGHT = 3;
const GROUP_WEIGHT = 2;
const ANSWER_WEIGHT = 1;
const FUZZY_FACTOR = 0.5;

/** Words people type that the FAQ text uses differently. Keys and values are normalized. */
const SYNONYMS: Record<string, readonly string[]> = {
    sicherheitsgateway: ['sgw', 'security gateway'],
    gateway: ['sgw'],
    sgw: ['security gateway'],
    freischaltung: ['sgw', 'lizenz'],
    remote: ['ferndiagnose', 'fernwartung'],
    teamviewer: ['ferndiagnose', 'support'],
    fernwartung: ['ferndiagnose'],
    ferndiagnose: ['fernwartung', 'remote'],
    rueckgabe: ['zuruecksenden', 'retoure', 'widerruf'],
    retoure: ['zuruecksenden', 'rueckgabe'],
    umtausch: ['zuruecksenden', 'retoure'],
    widerruf: ['zuruecksenden', 'widerrufsrecht'],
    zurueckschicken: ['zuruecksenden', 'retoure'],
    mwst: ['mehrwertsteuer', 'umsatzsteuer'],
    mehrwertsteuer: ['mwst'],
    ust: ['umsatzsteuer', 'mwst'],
    steuer: ['mwst', 'umsatzsteuer'],
    grenadier: ['ineos'],
    mac: ['macos'],
    macbook: ['macos'],
    iphone: ['ios'],
    kosten: ['preise', 'gebuehr', 'versandkosten'],
    preis: ['preise'],
    teuer: ['preise', 'kosten'],
    zoll: ['zollgebuehren', 'einfuhr'],
    lieferung: ['versand', 'lieferzeit'],
    lieferzeit: ['lieferung'],
    versand: ['lieferung'],
    porto: ['versandkosten', 'versand'],
    bezahlen: ['zahlung', 'zahlungsarten'],
    zahlen: ['zahlung', 'zahlungsarten'],
    kreditkarte: ['zahlung'],
    garantie: ['gewaehrleistung'],
    gewaehrleistung: ['garantie'],
    defekt: ['garantie', 'gewaehrleistung'],
    kaputt: ['garantie', 'gewaehrleistung'],
    handy: ['smartphone', 'app'],
    smartphone: ['app', 'troodon'],
    app: ['troodon'],
    pc: ['windows', 'diagcenter'],
    laptop: ['windows', 'notebook', 'diagcenter'],
    computer: ['windows', 'diagcenter'],
    steuergeraet: ['ecu'],
    ecu: ['steuergeraet'],
    fehlercode: ['fehler'],
    fehlerspeicher: ['fehler'],
    wohnmobil: ['camper', 'womo'],
    camper: ['womo', 'wohnmobil'],
    womo: ['camper'],
    aktualisieren: ['update'],
    hotspot: ['wlan'],
    wlan: ['wifi', 'hotspot'],
    wifi: ['wlan'],
    telefon: ['whatsapp'],
    anrufen: ['whatsapp'],
    abholen: ['abholung'],
    sprache: ['sprachen'],
};

/** Question words that would otherwise make phrased searches ("wie lange dauert …") fail. */
const STOPWORDS = new Set([
    'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer', 'und', 'oder',
    'ich', 'mein', 'meine', 'meinen', 'meinem', 'ist', 'sind', 'kann', 'koennen', 'zu', 'mit', 'fuer',
    'im', 'in', 'an', 'auf', 'von', 'ob', 'es', 'wo', 'wie', 'was', 'wann', 'welche', 'welcher',
    'welches', 'gibt', 'bei', 'auch', 'man', 'muss', 'mir', 'mich', 'ab', 'the', 'a', 'is', 'how',
]);

export function normalizeForSearch(text: string): string {
    return text
        .toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

/** Query words to match, without stop words (unless the query consists only of them). */
export function queryTerms(query: string): string[] {
    const words = normalizeForSearch(query).split(' ').filter(word => word.length >= 2);
    const meaningful = words.filter(word => !STOPWORDS.has(word));
    return [...new Set(meaningful.length > 0 ? meaningful : words)];
}

export function buildFaqSearchIndex(items: readonly FaqSearchItem[]): IndexedItem[] {
    return items.map(item => {
        const question = normalizeForSearch(item.question);
        const group = normalizeForSearch(item.groupTitle);
        const answer = normalizeForSearch(item.answerText);
        const words = [...new Set(`${question} ${group} ${answer}`.split(' ').filter(word => word.length >= 3))];
        return {slug: item.slug, question, group, answer, words};
    });
}

export function searchFaq(index: readonly IndexedItem[], query: string): FaqSearchHit[] {
    const terms = queryTerms(query);
    if (terms.length === 0) {
        return [];
    }
    const required = terms.length <= 2 ? terms.length : Math.ceil(terms.length * 0.6);

    const hits: FaqSearchHit[] = [];
    for (const item of index) {
        let score = 0;
        let matched = 0;
        for (const term of terms) {
            const termScore = scoreTerm(item, term);
            if (termScore > 0) {
                matched++;
                score += termScore;
            }
        }
        if (matched >= required) {
            hits.push({slug: item.slug, score});
        }
    }
    return hits.sort((left, right) => right.score - left.score);
}

/** Synonyms of a term, also when the term is a synonym key with a typo (`ruckgabe`). */
function synonymsFor(term: string): readonly string[] {
    const exact = SYNONYMS[term];
    if (exact) return exact;
    if (term.length < 5) return [];
    const key = Object.keys(SYNONYMS).find(candidate => Math.abs(candidate.length - term.length) <= 1 && editDistance(candidate, term, 1) <= 1);
    return key ? [key, ...SYNONYMS[key]] : [];
}

function scoreTerm(item: IndexedItem, term: string): number {
    let best = 0;
    for (const variant of [term, ...synonymsFor(term)]) {
        if (item.question.includes(variant)) best = Math.max(best, QUESTION_WEIGHT);
        else if (item.group.includes(variant)) best = Math.max(best, GROUP_WEIGHT);
        else if (item.answer.includes(variant)) best = Math.max(best, ANSWER_WEIGHT);
    }
    if (best > 0 || term.length < 5) {
        return best;
    }
    const maxDistance = term.length >= 8 ? 2 : 1;
    const fuzzy = item.words.find(word => Math.abs(word.length - term.length) <= maxDistance && editDistance(word, term, maxDistance) <= maxDistance);
    if (!fuzzy) {
        return 0;
    }
    const weight = item.question.includes(fuzzy) ? QUESTION_WEIGHT : item.group.includes(fuzzy) ? GROUP_WEIGHT : ANSWER_WEIGHT;
    return weight * FUZZY_FACTOR;
}

/** Levenshtein distance with an early exit once every cell of a row exceeds `max`. */
export function editDistance(a: string, b: string, max = Infinity): number {
    let previous = Array.from({length: b.length + 1}, (_, index) => index);
    for (let i = 1; i <= a.length; i++) {
        const current = [i];
        let rowMin = i;
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
            rowMin = Math.min(rowMin, current[j]);
        }
        if (rowMin > max) {
            return rowMin;
        }
        previous = current;
    }
    return previous[b.length];
}

/**
 * Regular expression that finds the query words in the original (non-normalized) text, for
 * highlighting: `ae` also matches `ä` and so on. Typo and synonym matches are not highlighted.
 */
export function highlightPattern(query: string): RegExp | null {
    const terms = queryTerms(query);
    if (terms.length === 0) {
        return null;
    }
    const alternatives = terms
        .sort((left, right) => right.length - left.length)
        .map(term =>
            term
                .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                .replace(/ae/g, '(?:ae|ä)')
                .replace(/oe/g, '(?:oe|ö)')
                .replace(/ue/g, '(?:ue|ü)')
                .replace(/ss/g, '(?:ss|ß)'),
        );
    return new RegExp(alternatives.join('|'), 'gi');
}
