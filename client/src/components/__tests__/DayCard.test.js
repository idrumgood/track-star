import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import DayCard from '../DayCard.vue';

describe('DayCard.vue', () => {
    const day = {
        id: '2025-12-29',
        date: '2025-12-29T00:00:00.000Z',
        dayName: 'Monday',
        plannedActivity: 'Running',
        isRestDay: false,
        status: 'pending',
        extras: []
    };

    it('renders planned activity', () => {
        const wrapper = mount(DayCard, {
            props: { day }
        });
        expect(wrapper.text()).toContain('Running');
    });

    it('shows DONE overlay when completed', () => {
        const completedDay = { ...day, status: 'completed' };
        const wrapper = mount(DayCard, {
            props: { day: completedDay }
        });
        expect(wrapper.find('.stamp-overlay').exists()).toBe(true);
        expect(wrapper.find('.stamp-overlay').text()).toBe('DONE');
    });

    it('shows Rest indicator for rest days', () => {
        const restDay = { ...day, isRestDay: true, plannedActivity: '' };
        const wrapper = mount(DayCard, {
            props: { day: restDay }
        });
        expect(wrapper.find('.rest-indicator').exists()).toBe(true);
        expect(wrapper.text()).toContain('Rest');
    });

    it('emits toggle-complete when clicked', async () => {
        const wrapper = mount(DayCard, {
            props: { day, isReadOnly: false, allowCompletion: true }
        });
        await wrapper.trigger('click');
        expect(wrapper.emitted('toggle-complete')).toBeTruthy();
        expect(wrapper.emitted('toggle-complete')[0]).toEqual([day.id]);
    });
});
