import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ConsistencyGrid from '../ConsistencyGrid.vue';

describe('ConsistencyGrid', () => {
    const mockDays = [
        { id: '2026-01-01', status: 'completed', plannedActivity: 'Run', extras: [] },
        { id: '2026-01-02', status: 'skipped', plannedActivity: 'Gym', extras: [] },
        { id: '2026-01-03', isRestDay: true, plannedActivity: 'Rest', extras: [] },
        { id: '2026-01-04', status: 'completed', plannedActivity: 'Bike', extras: [{ name: 'Walk' }] }
    ];

    it('renders the grid header and legend', () => {
        const wrapper = mount(ConsistencyGrid, {
            props: {
                days: mockDays,
                year: 2026
            }
        });

        expect(wrapper.find('h3').text().toUpperCase()).toBe('CONSISTENCY TIMELINE');
        expect(wrapper.find('.legend').exists()).toBe(true);
        expect(wrapper.find('.year-label').text()).toBe('2026');
    });

    it('calculates levels correctly', () => {
        const wrapper = mount(ConsistencyGrid, {
            props: {
                days: mockDays,
                year: 2026
            }
        });

        const squares = wrapper.findAll('.square');
        const findSquare = (text) => squares.find(s => s.attributes('title')?.includes(text));

        const completedSquare = findSquare('Run');
        expect(completedSquare).toBeDefined();
        expect(completedSquare.classes()).toContain('level-2');

        const extraSquare = findSquare('Bike');
        expect(extraSquare).toBeDefined();
        expect(extraSquare.classes()).toContain('level-4');
    });

    it('emits year-change event', async () => {
        const wrapper = mount(ConsistencyGrid, {
            props: {
                days: [],
                year: 2026
            }
        });

        const buttons = wrapper.findAll('.nav-btn-sm');
        await buttons[0].trigger('click'); // prev
        expect(wrapper.emitted('year-change')[0]).toEqual([-1]);

        await buttons[1].trigger('click'); // next
        expect(wrapper.emitted('year-change')[1]).toEqual([1]);
    });
});
