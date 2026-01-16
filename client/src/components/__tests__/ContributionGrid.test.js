import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ContributionGrid from '../ContributionGrid.vue';

describe('ContributionGrid', () => {
    const mockDays = [
        { id: '2026-01-01', status: 'completed', plannedActivity: 'Run', extras: [] },
        { id: '2026-01-02', status: 'skipped', plannedActivity: 'Gym', extras: [] },
        { id: '2026-01-03', isRestDay: true, plannedActivity: 'Rest', extras: [] },
        { id: '2026-01-04', status: 'completed', plannedActivity: 'Bike', extras: [{ name: 'Walk' }] }
    ];

    it('renders the grid header and legend', () => {
        const wrapper = mount(ContributionGrid, {
            props: {
                days: mockDays,
                startDate: '2026-01-01',
                endDate: '2026-01-10'
            }
        });

        expect(wrapper.find('h3').text().toUpperCase()).toBe('CONSISTENCY TIMELINE');
        expect(wrapper.find('.legend').exists()).toBe(true);
    });

    it('calculates levels correctly', () => {
        const wrapper = mount(ContributionGrid, {
            props: {
                days: mockDays,
                startDate: '2026-01-01',
                endDate: '2026-01-04'
            }
        });

        const squares = wrapper.findAll('.square');

        // Use a more robust way to find the square by matching the data-id or similar
        // Since I didn't add data-id, I'll search for the one with the correct status/activity in its tooltip
        const findSquare = (text) => squares.find(s => s.attributes('title')?.includes(text));

        const completedSquare = findSquare('Run');
        expect(completedSquare).toBeDefined();
        expect(completedSquare.classes()).toContain('level-2');

        const skippedSquare = findSquare('Gym');
        expect(skippedSquare).toBeDefined();
        expect(skippedSquare.classes()).toContain('level-skipped');

        const restSquare = findSquare('Rest');
        expect(restSquare).toBeDefined();
        expect(restSquare.classes()).toContain('level-rest');

        const extraSquare = findSquare('Bike');
        expect(extraSquare).toBeDefined();
        expect(extraSquare.classes()).toContain('level-4');
    });
});
