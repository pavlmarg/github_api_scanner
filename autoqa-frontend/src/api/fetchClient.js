// Grab the base URL from Vite's environment variables, or default to your local Spring Boot API
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const apiFetch = async (endpoint, options = {}) => {
    const token = localStorage.getItem(token);

    // Set up our headers
    const headers = new Headers(options.headers || {});

    // Inject the token if it exists
    if (token){
        headers.set('Authorization', 'Bearer ${token}');
    }

    // Automatically stringify JSON payloads for POST/PUT requests
    if (options.body && typeof(options.body === 'object')) {
        headers.set('Content-Type', 'application/json');
        options.body = JSON.stringify(options.body);
    }

    // Execute the native fetch call
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options, 
        headers,   
    });

    // Global 401 Error Handling 
    if (response.status === 401) {
        console.error("Session expired or unauthorized. Logging out...");
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Unauthorized');
    }

    // Auto-parse the JSON response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'API Error');
        }
        return data;
    }

    // Fallback for non-JSON errors
    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }
    return response;
};