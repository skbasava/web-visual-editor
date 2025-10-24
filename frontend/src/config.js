/**
 * Application Configuration
 * Centralized configuration for API URLs
 */

// Backend API base URL
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

// WebSocket URL
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

// API endpoint
export const API_URL = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';

console.log('🔧 Config:', { BACKEND_URL, WS_URL, API_URL });
