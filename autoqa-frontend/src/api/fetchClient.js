// Grab the base URL from Vite's environment variables, or default to your local Spring Boot API
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const apiFetch = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');

    const headers = new Headers(options.headers || {});

    if (token){
        headers.set('Authorization', `Bearer ${token}`);
    }

    if (options.body && typeof options.body === 'object') {
        headers.set('Content-Type', 'application/json');
        options.body = JSON.stringify(options.body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options, 
        headers,   
    });

    // 1. Parse the JSON FIRST so we can read your custom backend messages
    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        data = await response.json();
    }

    // 2. Global 401 Error Handling
    if (response.status === 401) {
        // Only wipe the token and redirect if the user is NOT already on the login page
        if (window.location.pathname !== '/login') {
            console.error("Session expired. Logging out...");
            localStorage.removeItem('token');
            window.location.href = '/login'; // This triggers the reload
        }
        
        // Throw your actual backend message (e.g., "Wrong account name...") instead of a bland "Unauthorized"
        throw new Error(data?.message || 'Unauthorized');
    }

    // 3. Handle all other errors (400 Bad Request, 409 Conflict, etc.)
    if (!response.ok) {
        throw new Error(data?.message || `API Error: ${response.status}`);
    }

    // If it's a success, return the parsed data (or the raw response if it wasn't JSON)
    return data || response;
};