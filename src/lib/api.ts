import axios from 'axios';
import { useMutation } from '@tanstack/react-query';

// Define your LeaseFormData type
interface LeaseFormData {
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
  securityDeposit: number;
  additionalCharges?: number;
  annualRentIncrease: number;
  leaseType: 'RESIDENTIAL' | 'COMMERCIAL';
  utilitiesIncluded: boolean;
  monthlyMaintenanceFee: number;
  latePaymentPenalty: number;
  notes?: string;
}

// Create Axios instance
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific error statuses
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
      window.location.href = '/sign-in';
    }
    return Promise.reject(error);
  }
);

// Lease API functions
export const leaseApi = {
  saveLease: (data: LeaseFormData) => api.post('/leases', data),
};

// React Query hook
export const useSaveLease = () => {
  return useMutation({
    mutationFn: leaseApi.saveLease,
    onSuccess: () => {
      // Handle success (e.g., show toast, redirect)
    },
    onError: (error) => {
      // Handle error (e.g., show error message)
    },
  });
};

export default api;