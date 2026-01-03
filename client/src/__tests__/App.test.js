import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupAuthInterceptor } from '../utils/authInterceptor';
import App from '../App.vue';

// Helper to create a dummy valid JWT
const createToken = (payload) => {
    return `header.${btoa(JSON.stringify(payload))}.signature`;
};

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('App.vue', () => {
    let cleanupInterceptor;

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

        // Setup the interceptor for tests that need it
        cleanupInterceptor = setupAuthInterceptor();
    });

    afterEach(() => {
        if (cleanupInterceptor) cleanupInterceptor();
    });

    it('logs user out if token is expired on mount', async () => {
        // Create an expired token (exp in the past)
        const expiredToken = createToken({
            sub: 'user1',
            name: 'Test',
            exp: Math.floor(Date.now() / 1000) - 3600
        });

        const user = { id: 'user1', name: 'Test', idToken: expiredToken };
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

        expect(wrapper.vm.user).toBeNull();
        expect(localStorage.getItem('track_star_user')).toBeNull();
    });

    it('reloads page on 401 response from server', async () => {
        const validToken = createToken({ sub: 'user1', name: 'Test', exp: Math.floor(Date.now() / 1000) + 3600 });
        const user = { id: 'user1', name: 'Test', idToken: validToken };
        localStorage.setItem('track_star_user', JSON.stringify(user));

        // Mock window.location.reload
        const originalLocation = window.location;
        delete window.location;
        window.location = { ...originalLocation, reload: vi.fn() };

        mount(App, {
            global: {
                stubs: {
                    'router-link': true,
                    'router-view': { template: '<div><slot :Component="{}"></slot></div>' }
                }
            }
        });
        await flushPromises();

        mockFetch.mockResolvedValueOnce({
            status: 401,
            ok: false
        });

        await window.fetch('/api/test');

        expect(window.location.reload).toHaveBeenCalled();
        expect(localStorage.getItem('track_star_user')).toBeNull();

        // Restore window.location
        window.location = originalLocation;
    });
});
