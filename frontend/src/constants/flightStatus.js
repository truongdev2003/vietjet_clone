/**
 * Flight Status Constants and Utilities
 * Định nghĩa các trạng thái chuyến bay và tiện ích liên quan
 */

export const FLIGHT_STATUS = {
  SCHEDULED: 'scheduled',
  BOARDING: 'boarding',
  DEPARTED: 'departed',
  IN_FLIGHT: 'in_flight',
  ARRIVED: 'arrived',
  CANCELLED: 'cancelled',
  DELAYED: 'delayed',
};

export const FLIGHT_STATUS_LABELS = {
  [FLIGHT_STATUS.SCHEDULED]: 'Đã lên lịch',
  [FLIGHT_STATUS.BOARDING]: 'Đang lên máy bay',
  [FLIGHT_STATUS.DEPARTED]: 'Đã cất cánh',
  [FLIGHT_STATUS.IN_FLIGHT]: 'Đang bay',
  [FLIGHT_STATUS.ARRIVED]: 'Đã hạ cánh',
  [FLIGHT_STATUS.CANCELLED]: 'Đã hủy',
  [FLIGHT_STATUS.DELAYED]: 'Bị trễ',
};

export const FLIGHT_STATUS_COLORS = {
  [FLIGHT_STATUS.SCHEDULED]: 'bg-blue-100 text-blue-800',
  [FLIGHT_STATUS.BOARDING]: 'bg-yellow-100 text-yellow-800',
  [FLIGHT_STATUS.DEPARTED]: 'bg-purple-100 text-purple-800',
  [FLIGHT_STATUS.IN_FLIGHT]: 'bg-indigo-100 text-indigo-800',
  [FLIGHT_STATUS.ARRIVED]: 'bg-green-100 text-green-800',
  [FLIGHT_STATUS.CANCELLED]: 'bg-red-100 text-red-800',
  [FLIGHT_STATUS.DELAYED]: 'bg-orange-100 text-orange-800',
};

/**
 * Lấy label tiếng Việt của status
 * @param {string} status - Flight status key
 * @returns {string} Label tiếng Việt
 */
export const getFlightStatusLabel = (status) => {
  return FLIGHT_STATUS_LABELS[status] || status;
};

/**
 * Lấy class CSS cho badge status
 * @param {string} status - Flight status key
 * @returns {string} CSS classes
 */
export const getFlightStatusColor = (status) => {
  return FLIGHT_STATUS_COLORS[status] || FLIGHT_STATUS_COLORS[FLIGHT_STATUS.SCHEDULED];
};

/**
 * Danh sách tất cả status options cho dropdown
 */
export const FLIGHT_STATUS_OPTIONS = [
  { value: FLIGHT_STATUS.SCHEDULED, label: FLIGHT_STATUS_LABELS[FLIGHT_STATUS.SCHEDULED] },
  { value: FLIGHT_STATUS.BOARDING, label: FLIGHT_STATUS_LABELS[FLIGHT_STATUS.BOARDING] },
  { value: FLIGHT_STATUS.DEPARTED, label: FLIGHT_STATUS_LABELS[FLIGHT_STATUS.DEPARTED] },
  { value: FLIGHT_STATUS.IN_FLIGHT, label: FLIGHT_STATUS_LABELS[FLIGHT_STATUS.IN_FLIGHT] },
  { value: FLIGHT_STATUS.ARRIVED, label: FLIGHT_STATUS_LABELS[FLIGHT_STATUS.ARRIVED] },
  { value: FLIGHT_STATUS.CANCELLED, label: FLIGHT_STATUS_LABELS[FLIGHT_STATUS.CANCELLED] },
  { value: FLIGHT_STATUS.DELAYED, label: FLIGHT_STATUS_LABELS[FLIGHT_STATUS.DELAYED] },
];
