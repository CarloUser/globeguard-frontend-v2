import {describe, expect, it} from 'vitest';
import {buildFaqSearchIndex, editDistance, highlightPattern, normalizeForSearch, queryTerms, searchFaq} from '../search';

const items = [
    {
        slug: 'sgw',
        question: 'Was ist ein Security Gateway, und was passiert ohne Freischaltung?',
        answerText: 'Neuere Fahrzeuge schützen ihre Diagnose-Schnittstelle mit einem Security Gateway (SGW).',
        groupTitle: 'Security Gateway (SGW)',
    },
    {
        slug: 'ruecksenden',
        question: 'Kann ich Hardware zurücksenden?',
        answerText: 'Ja, innerhalb von 14 Tagen ab Warenerhalt.',
        groupTitle: 'Retouren & Rückerstattungen',
    },
    {
        slug: 'lieferzeit',
        question: 'Wie lange dauert die Lieferung?',
        answerText: 'Schweiz und Liechtenstein: in der Regel 2–4 Werktage.',
        groupTitle: 'Bestellung, Versand & Preise',
    },
    {
        slug: 'ferndiagnose',
        question: 'Wie funktioniert die Ferndiagnose (Remote-Diagnostics)?',
        answerText: 'Die Ferndiagnose ist im ersten Jahr inklusive.',
        groupTitle: 'Updates, Lizenz & Ferndiagnose',
    },
    {
        slug: 'marken',
        question: 'Welche Marken und Fahrzeugklassen werden unterstützt?',
        answerText: 'PKW & Van – u. a. Škoda, VW-Gruppe.',
        groupTitle: 'Kompatibilität',
    },
];
const index = buildFaqSearchIndex(items);
const slugs = (query: string) => searchFaq(index, query).map(hit => hit.slug);

describe('normalizeForSearch', () => {
    it('folds umlauts, ß and accents', () => {
        expect(normalizeForSearch('Rückgabe Straße Škoda')).toBe('rueckgabe strasse skoda');
    });
});

describe('queryTerms', () => {
    it('drops question words but keeps a query made only of them', () => {
        expect(queryTerms('Wie lange dauert die Lieferung?')).toEqual(['lange', 'dauert', 'lieferung']);
        expect(queryTerms('wie')).toEqual(['wie']);
    });
});

describe('searchFaq', () => {
    it('finds a question by a word of the question', () => {
        expect(slugs('Lieferung')[0]).toBe('lieferzeit');
    });

    it('matches umlauts typed as ae/oe/ue and without them', () => {
        expect(slugs('zuruecksenden')).toContain('ruecksenden');
        expect(slugs('zurücksenden')).toContain('ruecksenden');
        expect(slugs('skoda')).toContain('marken');
    });

    it('uses synonyms', () => {
        expect(slugs('Sicherheitsgateway')).toContain('sgw');
        expect(slugs('Rückgabe')).toContain('ruecksenden');
        expect(slugs('remote')).toContain('ferndiagnose');
    });

    it('uses synonyms of a word typed with a typo or without the umlaut e', () => {
        expect(slugs('ruckgabe')).toContain('ruecksenden');
    });

    it('tolerates a typo', () => {
        expect(slugs('Ferndiagnsoe')).toContain('ferndiagnose');
        expect(slugs('Lieferumg')).toContain('lieferzeit');
    });

    it('ranks question matches above answer matches', () => {
        const hits = searchFaq(index, 'Security Gateway');
        expect(hits[0].slug).toBe('sgw');
    });

    it('returns nothing for an empty query or a word that is nowhere', () => {
        expect(slugs('')).toEqual([]);
        expect(slugs('Waschmaschine')).toEqual([]);
    });
});

describe('editDistance', () => {
    it('counts single edits and stops early above the limit', () => {
        expect(editDistance('lieferung', 'lieferumg')).toBe(1);
        expect(editDistance('abc', 'xyz', 1)).toBeGreaterThan(1);
    });
});

describe('highlightPattern', () => {
    it('matches the original spelling with umlauts', () => {
        const pattern = highlightPattern('zuruecksenden');
        expect('Kann ich Hardware zurücksenden?'.match(pattern!)?.[0]).toBe('zurücksenden');
    });
});
