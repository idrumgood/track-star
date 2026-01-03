export const setupAuthInterceptor = () => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const response = await originalFetch(...args);
        if (response.status === 401) {
            const savedUser = localStorage.getItem('track_star_user');
            if (savedUser) {
                console.warn("Session expired or unauthorized. Logging out...");
                localStorage.removeItem('track_star_user');
                window.location.reload();
            }
        }
        return response;
    };
    return () => { window.fetch = originalFetch; }; // Return cleanup function
};
