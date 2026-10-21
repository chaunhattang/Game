import axios from 'axios';
export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || ''}/api`,
  withCredentials: true,
  timeout: 8000,
});
export const errorMessage = (e) => e.response?.data?.error || e.message || 'Something went wrong.';
