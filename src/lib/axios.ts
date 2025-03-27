import axios from 'axios';

// Create Axios instance
const api = axios.create({
  baseURL: '/api',
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token if exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
      window.location.href = '/sign-in';
    }
    return Promise.reject(error);
  }
);

// Lease API functions
export const LeaseAPI = {
  createLease: (data: LeaseData) => api.post('/leases', data),
  getLeases: () => api.get('/leases'),
  getLease: (id: string) => api.get(`/leases/${id}`),
  updateLease: (id: string, data: LeaseData) => api.put(`/leases/${id}`, data),
  deleteLease: (id: string) => api.delete(`/leases/${id}`),
  shareLease: (leaseId: string, email: string) => 
    api.post('/leases/share', { leaseId, email }),
};

// Type definitions
interface LeaseData {
  startDate: string;
  endDate: string;
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

export default api;