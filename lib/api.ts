import axios from "axios"
import { getSession } from "next-auth/react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://your-api-url.com"

export type DashboardStatsResponse = {
  success: boolean
  data: {
    overview: {
      totalUsers: number
      totalDrivers: number
      totalRides: number
      totalRevenue: number
      activeRides: number
      pendingDrivers: number
      pendingReports: number
    }
    monthlyStats: Array<{
      _id: { year: number; month: number }
      rides: number
      revenue: number
    }>
  }
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})



// DriverItem and DriversListResponse types
export type DriverItem = {
  _id: string
  status: "pending" | "approved" | "rejected" | string
  userId: null | {
    _id: string
    fullName: string
    email: string
    phoneNumber: string
    profileImage: string | null
  }
  vehicleId: string | null
  completedRides?: number
}

export type DriversListResponse = {
  success: boolean
  page: number
  totalPages: number
  totalDrivers: number
  data: DriverItem[]
}

export type CommissionRide = {
  _id: string
  createdAt?: string
  commission?: { rate?: number; amount?: number } | null
}

export type CommissionResponse = {
  success: boolean
  data: {
    rides: CommissionRide[]
    totalCommission: number
    pagination: {
      current: number
      pages: number
      total: number
    }
  }
}


api.interceptors.request.use(
  async (config) => {
    const session = await getSession()
    if (session?.user?.accessToken) {
      config.headers.Authorization = `Bearer ${session.user.accessToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     if (error.response?.status === 401) {
//       if (typeof window !== "undefined") {
//         window.location.href = "/api/auth/signout"
//       }
//     }
//     return Promise.reject(error)
//   },
// )

// Auth API
export const authApi = {
  login: (data: { emailOrPhone: string; password: string }) => api.post("/api/auth/login", data),
  requestPasswordReset: (data: { emailOrPhone: string }) => api.post("/api/auth/request-password-reset", data),
  verifyOTP: (data: { email: string; otp: string; type: string }) => api.post("/api/auth/verify-otp", data),
  resetPassword: (data: { emailOrPhone: string; newPassword: string }) => api.post("/api/auth/reset-password", data),
  changePassword: (data: { oldPassword: string; newPassword: string }) => api.post("/api/auth/change-password", data),
}


/// update profile uploadProfileImage
// src/api/profileApi.ts (or wherever your API functions live)

export const profileApi = {
  // Get current user profile
  getProfile: () => api.get("/api/user/profile"),

  // Update text fields (name, email, phone, address, etc.)
  updateProfile: (data: Partial<{
    fullName: string;
    email: string;
    phoneNumber: string;
    country: string;
    city: string;
    state: string;
    zipcode: string;
    street_address: string;
  }>) => api.put("/api/user/profile", data), // JSON body, no multipart

  // Upload or update profile picture only
  uploadProfileImage: (file: File) => {
    const formData = new FormData();
    formData.append("profileImage", file); // Must match upload.single('profileImage')

    return api.put("/api/user/profile/picture", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// Dashboard Stats API
export const dashboardApi = {
  getStats: async () => {
    const res = await api.get<DashboardStatsResponse>("/api/admin/dashboard/stats")
    return res.data
  },
}

// Services API
export const servicesApi = {
  getAll: (page = 1) => api.get(`/api/service?page=${page}`),
  create: (data: FormData) =>
    api.post("/api/service/create", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id: string, data: FormData) =>
    api.put(`/api/service/services/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id: string) => api.delete(`/api/service/services/${id}`),
}

export const assignTexiApi = {
  assignVehicle: (payload: { vehicleId: string; driverId: string }) =>
    api.put("/api/admin/services/vehicle/assign-vehicle", payload),
};



// Taxi/Vehicle API
export const taxiApi = {
  getAll: (page = 1) => api.get(`/api/admin/vehicle?page=${page}`),
  getSingle: (serviceId: string) => api.get(`/api/service/vehicle/${serviceId}`),
  create: (serviceId: string, data: any) => api.post(`/api/admin/services/${serviceId}/vehicle`, data),
  update: (vehicleId: string, driverId: string) =>
    api.put("/api/admin/services/vehicle/assign-vehicle", { vehicleId, driverId }),
  delete: (id: string) => api.delete(`/api/admin/services/vehicle/${id}`),
}

// Drivers API 
export const driversApi = {
  getAll: async (page = 1) => {
    const res = await api.get<DriversListResponse>(`/api/admin/drivers?page=${page}`)
    return res.data
  },

  // single details if you need later
  getOne: async (driverId: string) => {
    const res = await api.get(`/api/admin/drivers/${driverId}`)
    return res.data
  },

  approve: async (driverId: string) => {
    const res = await api.put(`/api/admin/approved-driver/${driverId}`)
    return res.data
  },

  reject: async (driverId: string) => {
    const res = await api.put(`/api/admin/reject-driver/${driverId}`)
    return res.data
  },

  delete: async (driverId: string) => {
    const res = await api.delete(`/api/admin/drivers/${driverId}`)
    return res.data
  },
}

// Users API single user
export const usersApi = {
  getAll: (page = 1) => api.get(`/api/admin/users?page=${page}`),
  getOne: (id: string) => api.get(`/api/admin/users/${id}`),
  delete: (id: string) => api.delete(`/api/admin/users/${id}`),
}

// Ride History API and add delete ride
export const ridesApi = {
  getAll: (page = 1) => api.get(`/api/driver/trip-history?page=${page}`),
  delete: (id: string) => api.delete(`/api/admin/ride/${id}`),

}

// Promo Code API
export const promoCodeApi = {
  getAll: (page = 1) => api.get(`/api/admin/promo-codes?page=${page}`),
  create: (data: any) => api.post("/api/admin/promo-codes", data),
  update: (id: string, data: any) => api.put(`/api/admin/promo-codes/${id}`, data),
  delete: (id: string) => api.delete(`/api/admin/promo-codes/${id}`),
}

// Commission API
export const commissionApi = {
  getAll: (page = 1) => api.get(`/api/admin/commission/history?page=${page}`),
  create: (data: any) => api.post("/api/admin/commission", data),
  update: (id: string, data: any) => api.put(`/api/admin/commission/${id}`, data),
  delete: (id: string) => api.delete(`/api/admin/commission/${id}`),
  getById: (id: string) => api.get(`/api/admin/commission/${id}`),
};

// Driver Requests API
export const driverRequestsApi = {
  getAll: (page = 1) => api.get(`/api/admin/driver-requests?page=${page}`),
  approve: (id: string) => api.put(`/api/admin/driver-requests/${id}/approve`),
  reject: (id: string) => api.put(`/api/admin/driver-requests/${id}/reject`),
}


// notification api
export const notificationApi = {
  getAll: (page = 1) => api.get(`/api/notification?page=${page}`),
  
  markAsRead: (id: string) => api.put(`/api/notification/${id}/read`),
  
  // ADD THIS LINE:
  markAllAsRead: () => api.put(`/api/notification/read-all`), 
  
  delete: (id: string) => api.delete(`/api/notification/${id}`),
};

