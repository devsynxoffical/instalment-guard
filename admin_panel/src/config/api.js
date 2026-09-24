// Centralized API configuration for local and cloud deployment (Railway / Vercel / Render)
const rawBase = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '' : 'http://localhost:5000');
export const API_BASE_URL = rawBase.replace(/\/$/, '');
