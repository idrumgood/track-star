import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App.vue';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('App.vue', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        // Mock google accounts
        global.google = {
            accounts: {
                id: {
                    initialize: vi.fn(),
                    renderButton: vi.fn(),
                    prompt: vi.fn()
                }
            }
        };

        mockFetch.mockImplementation((url) => {
            if (url.includes('/api/config')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ googleClientId: '123' })
                });
            }
            if (url.includes('/api/week')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([]) // Return empty array for weekDays
                });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });
    });

    it('logs user out on 401 response from server', async () => {
        const user = { id: 'user1', name: 'Test', idToken: 'token' };
        localStorage.setItem('track_star_user', JSON.stringify(user));

        const wrapper = mount(App, {
            global: {
                stubs: {
                    'router-link': true,
                    'router-view': { template: '<div><slot :Component="{}"></slot></div>' }
                }
            }
        });
        await flushPromises();

        expect(wrapper.vm.user).toBeTruthy();

        // The interceptor is now installed on window.fetch
        // We need to trigger it. 
        // Note: the originalFetch inside the interceptor is our mockFetch

        mockFetch.mockResolvedValueOnce({
            status: 401,
            ok: false
        });

        // Use the hijacked fetch
        await window.fetch('/api/test');

        expect(wrapper.vm.user).toBeNull();
        expect(localStorage.getItem('track_star_user')).toBeNull();
    });
});
