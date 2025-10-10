/**
 * API Endpoints Constants
 * Centralized location for all API endpoint paths
 */

// Authentication endpoints
export const AUTH_ENDPOINTS = {
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh-token',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',
  RESEND_VERIFICATION: '/auth/resend-verification-email',
  PROFILE: '/auth/profile',
  CONTACT_INFO: '/auth/contact-info',
  CHANGE_PASSWORD: '/auth/change-password',
};

// Flight endpoints
export const FLIGHT_ENDPOINTS = {
  SEARCH: '/flights/search',
  DETAIL: '/flights',
  SCHEDULES: '/flights/schedules',
};

// Booking endpoints
export const BOOKING_ENDPOINTS = {
  CREATE: '/bookings',
  LIST: '/bookings',
  DETAIL: '/bookings',
  UPDATE: '/bookings',
  CANCEL: '/bookings',
};

// Airport endpoints
export const AIRPORT_ENDPOINTS = {
  LIST: '/airports',
  SEARCH: '/airports/search',
};

// Payment endpoints
export const PAYMENT_ENDPOINTS = {
  CREATE: '/payments',
  VERIFY: '/payments/verify',
  GATEWAY: '/payment-gateway',
};

// Seat endpoints
export const SEAT_ENDPOINTS = {
  AVAILABLE: '/seats/available',
  SELECT: '/seats/select',
};

// Check-in endpoints
export const CHECKIN_ENDPOINTS = {
  START: '/checkin',
  COMPLETE: '/checkin/complete',
};

// Fare endpoints
export const FARE_ENDPOINTS = {
  LIST: '/fares',
  DETAIL: '/fares',
};

// Admin endpoints
export const ADMIN_ENDPOINTS = {
  DASHBOARD: '/admin/dashboard',
  USERS: '/admin/users',
  BOOKINGS: '/admin/bookings',
  REPORTS: '/admin/reports',
  FLIGHT_UPDATES: '/admin/flight-updates',
};

export default {
  AUTH_ENDPOINTS,
  FLIGHT_ENDPOINTS,
  BOOKING_ENDPOINTS,
  AIRPORT_ENDPOINTS,
  PAYMENT_ENDPOINTS,
  SEAT_ENDPOINTS,
  CHECKIN_ENDPOINTS,
  FARE_ENDPOINTS,
  ADMIN_ENDPOINTS,
};
