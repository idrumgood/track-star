import { describe, it, expect } from 'vitest';
import { calculateStats } from '../statsCalculator';

describe('statsCalculator', () => {
    const mockDays = [
        { id: '2026-01-01', status: 'completed', plannedActivity: 'Run', extras: [] },
        { id: '2026-01-02', status: 'skipped', plannedActivity: 'Gym', extras: [] },
        { id: '2026-01-03', isRestDay: true, plannedActivity: 'Rest', extras: [] },
        { id: '2026-01-04', status: 'completed', plannedActivity: 'Bike', extras: [{ name: 'Walk' }] }
    ];

    it('calculates summary metrics correctly', () => {
        const stats = calculateStats(mockDays, '2026-01-01', '2026-01-04');
        expect(stats.summary.totalDays).toBe(4);
        expect(stats.summary.completed).toBe(2);
        expect(stats.summary.skipped).toBe(1);
        expect(stats.summary.restDays).toBe(1);
        expect(stats.summary.extraActivitiesCount).toBe(1);
        // Consistency: 2 / (4 - 1) = 2/3 = 67%
        expect(stats.summary.consistency).toBe(67);
    });

    it('calculates streaks correctly', () => {
        const stats = calculateStats(mockDays, '2026-01-01', '2026-01-04');
        // Jan 1: Comp (streak 1)
        // Jan 2: Skip (streak 0, longest 1)
        // Jan 3: Rest (streak 1)
        // Jan 4: Comp (streak 2)
        expect(stats.streaks.longest).toBe(2);
    });

    it('calculates activity distribution correctly', () => {
        const stats = calculateStats(mockDays, '2026-01-01', '2026-01-04');
        const bike = stats.activities.find(a => a.name === 'Bike');
        const walk = stats.activities.find(a => a.name === 'Walk');
        expect(bike.count).toBe(1);
        expect(walk.count).toBe(1);
    });
});
