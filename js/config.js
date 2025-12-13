const CONFIG = {
    // API_BASE_URL: 'http://localhost:8000', // Local Development
    API_BASE_URL: 'https://tangian.alwaysdata.net', // Production / Hosted Backend

    // Helper to get full API URL
    apiUrl: function (path) {
        if (!this.API_BASE_URL) {
            console.warn('CONFIG.API_BASE_URL is missing! Requesting path relative to root:', path);
        }
        return `${this.API_BASE_URL}${path}`;
    }
};

// Global Console warning to ensure we know where we are pointing
console.log('App configured for:', CONFIG.API_BASE_URL);
