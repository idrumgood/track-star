const { getMonday, generateId } = require('../src/utils/dateUtils');

describe('dateUtils', () => {
    test('generateId returns YYYY-MM-DD format', () => {
        const date = new Date('2025-12-29T12:00:00Z');
        expect(generateId(date)).toBe('2025-12-29');
    });

    test('getMonday returns correct Monday for a given date', () => {
        const tuesday = new Date('2025-12-30T12:00:00Z');
        const monday = getMonday(tuesday);
        expect(generateId(monday)).toBe('2025-12-29');
    });

    test('getMonday returns same day if it is Monday', () => {
        const mondayOrig = new Date('2025-12-29T12:00:00Z');
        const monday = getMonday(mondayOrig);
        expect(generateId(monday)).toBe('2025-12-29');
    });

    test('getMonday returns previous Monday for Sunday', () => {
        const sunday = new Date('2025-12-28T12:00:00Z');
        const monday = getMonday(sunday);
        expect(generateId(monday)).toBe('2025-12-22');
    });
});
