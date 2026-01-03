import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import WeekView from '../WeekView.vue';

// Mock fetch globally
global.fetch = vi.fn();

describe('WeekView.vue', () => {
    const user = { id: 'user1', name: 'Test User', idToken: 'token123' };
    let mockDays;
    let wrapper;

    const generateMockDays = () => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date('2025-12-22T00:00:00.000Z');
            d.setDate(d.getDate() + i);
            const id = d.toISOString().split('T')[0];
            days.push({
                id: id,
                date: d.toISOString(),
                dayName: d.toLocaleDateString('en-US', { weekday: 'long' }),
                isRestDay: i === 1 || i === 6, // Tuesday and Sunday are rest days
                status: i === 0 ? 'completed' : 'pending', // Monday completed
                plannedActivity: 'Activity ' + i,
                extras: []
            });
        }
        return days;
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockDays = generateMockDays();

        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockDays)
        });

        // Mock date to 2025-12-29 (the Monday of the NEXT week in this mock, or actually 22nd is Monday)
        // Wait, if 22nd is Monday, then 29th is the next Monday.
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-12-29T12:00:00Z'));
    });

    afterEach(() => {
        if (wrapper) wrapper.unmount();
        vi.useRealTimers();
    });

    it('calculates completedCount correctly (including past rest days, excluding future ones)', async () => {
        // Set date to middle of the week for this test
        vi.setSystemTime(new Date('2025-12-24T12:00:00Z')); // Wednesday

        wrapper = mount(WeekView, {
            props: { user }
        });

        await flushPromises();

        // 22 (Mon, completed) -> +1
        // 23 (Tue, rest, past) -> +1
        // 24 (Wed, pending, today) -> +0
        // ...
        // Total: 2
        expect(wrapper.vm.completedCount).toBe(2);
    });

    it('sets status to skipped when uncompleting a past day', async () => {
        // Set date to Wednesday
        vi.setSystemTime(new Date('2025-12-24T12:00:00Z'));

        wrapper = mount(WeekView, {
            props: { user }
        });
        await flushPromises();

        // Mock successful update
        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ ...mockDays[0], status: 'skipped' })
        });

        await wrapper.vm.handleToggleComplete(mockDays[0].id);

        expect(wrapper.vm.weekDays[0].status).toBe('skipped');
    });

    it('sets status to pending when uncompleting today', async () => {
        // Set date to Monday (22nd)
        vi.setSystemTime(new Date('2025-12-22T12:00:00Z'));

        wrapper = mount(WeekView, {
            props: { user }
        });
        await flushPromises();

        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ ...mockDays[0], status: 'pending' })
        });

        await wrapper.vm.handleToggleComplete(mockDays[0].id);

        expect(wrapper.vm.weekDays[0].status).toBe('pending');
    });

    it('resets to current date and refetches when goToday is called', async () => {
        // 1. Initial mount at 2025-12-29
        vi.setSystemTime(new Date('2025-12-29T12:00:00Z'));
        wrapper = mount(WeekView, { props: { user } });
        await flushPromises();
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('2025-12-29'), expect.anything());

        // 2. Change week to next week
        await wrapper.vm.changeWeek(1);
        await flushPromises();
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('2026-01-05'), expect.anything());

        // 3. Move system time slightly (simulate time passing or just ensuring it uses "new Date()")
        vi.setSystemTime(new Date('2025-12-30T10:00:00Z'));

        // 4. Click Current Week
        await wrapper.vm.goToday();
        await flushPromises();

        // 5. Assert it fetches with the new "current" date
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('2025-12-30'), expect.anything());
        expect(wrapper.vm.currentDate.toISOString()).toContain('2025-12-30');
    });

    it('displays error message when fetch fails', async () => {
        fetch.mockResolvedValueOnce({
            ok: false,
            status: 500
        });

        wrapper = mount(WeekView, {
            props: { user }
        });

        await flushPromises();

        expect(wrapper.find('.error-container').exists()).toBe(true);
        expect(wrapper.text()).toContain('Failed to load your week');
    });

    it('retries fetch when "Try Again" is clicked', async () => {
        fetch.mockResolvedValueOnce({
            ok: false,
            status: 500
        });

        wrapper = mount(WeekView, {
            props: { user }
        });

        await flushPromises();
        expect(wrapper.find('.error-container').exists()).toBe(true);

        // Mock success for retry
        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockDays)
        });

        await wrapper.find('.retry-btn').trigger('click');
        await flushPromises();

        expect(wrapper.find('.error-container').exists()).toBe(false);
        expect(wrapper.vm.weekDays.length).toBe(7);
    });
});
