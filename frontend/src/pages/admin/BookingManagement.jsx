import { Calendar, Eye, Filter, Search, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import adminService from '../../services/adminService';

const BookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    loadBookings();
  }, [pagination.page, statusFilter, dateFrom, dateTo]);

  const loadBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
        status: statusFilter,
        dateFrom,
        dateTo,
      };
      const response = await adminService.getBookings(params);
      setBookings(response.data.bookings || []);
      
      // Map backend pagination structure to frontend
      const backendPagination = response.data.pagination || {};
      setPagination(prev => ({
        ...prev,
        page: backendPagination.page || prev.page,
        total: backendPagination.total || 0,
        pages: backendPagination.pages || 0,
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách bookings');
      // Mock data for demo
      const mockBookings = Array.from({ length: 10 }, (_, i) => ({
        _id: `BK${String(i + 1).padStart(6, '0')}`,
        bookingCode: `VJ${String(i + 1000).padStart(6, '0')}`,
        user: {
          _id: `user${i + 1}`,
          personalInfo: {
            firstName: `User${i + 1}`,
            lastName: 'Test',
          },
          contactInfo: {
            email: `user${i + 1}@example.com`,
          },
        },
        flight: {
          _id: `flight${i + 1}`,
          flightNumber: `VJ${100 + i}`,
          route: {
            from: { code: 'HAN', name: 'Hà Nội' },
            to: { code: 'SGN', name: 'TP.HCM' },
          },
          departureTime: new Date(Date.now() + i * 86400000).toISOString(),
        },
        passengers: [
          {
            firstName: 'Nguyen',
            lastName: 'Van A',
            type: 'adult',
          },
        ],
        totalPrice: 2500000 + i * 100000,
        status: ['pending', 'confirmed', 'cancelled'][i % 3],
        paymentStatus: ['pending', 'paid', 'refunded'][i % 3],
        createdAt: new Date(Date.now() - i * 3600000).toISOString(),
      }));
      setBookings(mockBookings);
      setPagination(prev => ({ ...prev, total: 100, pages: 10 }));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Bạn có chắc muốn hủy booking này?')) {
      return;
    }

    try {
      await adminService.cancelBooking(bookingId);
      setBookings(bookings.map(b => 
        b._id === bookingId 
          ? { ...b, status: 'cancelled', paymentStatus: 'refunded' } 
          : b
      ));
      alert('Đã hủy booking và hoàn tiền thành công');
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể hủy booking');
    }
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
    };
    return badges[status] || badges.pending;
  };

  const getPaymentBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      refunded: 'bg-gray-100 text-gray-800',
      failed: 'bg-red-100 text-red-800',
    };
    return badges[status] || badges.pending;
  };

  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Quản lý Bookings</h2>
            <p className="text-gray-600 mt-1">Tổng: {pagination.total} bookings</p>
          </div>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            {error} (Hiển thị dữ liệu mẫu)
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Mã booking, email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    setPagination(prev => ({ ...prev, page: 1 }));
                    loadBookings();
                  }
                }}
              />
            </div>

            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>

            <input
              type="date"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              placeholder="Từ ngày"
            />

            <input
              type="date"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              placeholder="Đến ngày"
            />

            <button
              onClick={() => {
                setPagination(prev => ({ ...prev, page: 1 }));
                loadBookings();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center"
            >
              <Filter size={20} className="mr-2" />
              Lọc
            </button>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <svg className="animate-spin h-12 w-12 text-red-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-4 text-gray-600">Đang tải...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mã Booking
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Khách hàng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chuyến bay
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Giá
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày đặt
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((booking) => {
                    // Tính tổng số hành khách từ tất cả các chuyến bay
                    const totalPassengers = booking.flights?.reduce((total, flight) => 
                      total + (flight.passengers?.length || 0), 0) || 0;
                    
                    // Lấy chuyến bay đầu tiên để hiển thị
                    const firstFlight = booking.flights?.[0]?.flight;
                    const departureTime = firstFlight?.route?.departure?.time;
                    
                    return (
                    <tr key={booking._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{booking.bookingReference}</div>
                        <div className="text-xs text-gray-500">{totalPassengers} hành khách</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {booking.user?.personalInfo?.firstName} {booking.user?.personalInfo?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{booking.user?.contactInfo?.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {firstFlight?.flightNumber || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {firstFlight?.route?.departure?.airport?.code?.iata || 'N/A'} → {firstFlight?.route?.arrival?.airport?.code?.iata || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center mt-1">
                          <Calendar size={12} className="mr-1" />
                          {departureTime ? new Date(departureTime).toLocaleDateString('vi-VN') : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(booking.payment?.totalAmount || booking.totalPrice || 0)}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full inline-block ${getPaymentBadge(booking.paymentStatus || booking.payment?.status)}`}>
                          {booking.paymentStatus || booking.payment?.status || 'pending'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs rounded-full font-semibold ${getStatusBadge(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(booking.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleViewDetails(booking)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Xem chi tiết"
                          >
                            <Eye size={18} />
                          </button>
                          {booking.status !== 'cancelled' && (
                            <button
                              onClick={() => handleCancelBooking(booking._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Hủy booking"
                            >
                              <XCircle size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && bookings.length > 0 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Trước
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Hiển thị <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> đến{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    trong <span className="font-medium">{pagination.total}</span> kết quả
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    {/* Previous Button */}
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {/* Page Numbers */}
                    {(() => {
                      const pages = [];
                      const maxVisible = 5;
                      let startPage = Math.max(1, pagination.page - Math.floor(maxVisible / 2));
                      let endPage = Math.min(pagination.pages, startPage + maxVisible - 1);
                      
                      if (endPage - startPage + 1 < maxVisible) {
                        startPage = Math.max(1, endPage - maxVisible + 1);
                      }

                      // First page
                      if (startPage > 1) {
                        pages.push(
                          <button
                            key={1}
                            onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            1
                          </button>
                        );
                        if (startPage > 2) {
                          pages.push(
                            <span key="ellipsis1" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                              ...
                            </span>
                          );
                        }
                      }

                      // Visible pages
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => setPagination(prev => ({ ...prev, page: i }))}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              i === pagination.page
                                ? 'z-10 bg-red-50 border-red-500 text-red-600'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {i}
                          </button>
                        );
                      }

                      // Last page
                      if (endPage < pagination.pages) {
                        if (endPage < pagination.pages - 1) {
                          pages.push(
                            <span key="ellipsis2" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                              ...
                            </span>
                          );
                        }
                        pages.push(
                          <button
                            key={pagination.pages}
                            onClick={() => setPagination(prev => ({ ...prev, page: pagination.pages }))}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            {pagination.pages}
                          </button>
                        );
                      }

                      return pages;
                    })()}

                    {/* Next Button */}
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page + 1) }))}
                      disabled={pagination.page >= pagination.pages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}

          {!loading && bookings.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Không tìm thấy booking nào</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedBooking && (() => {
        const totalPassengers = selectedBooking.flights?.reduce((total, flight) => 
          total + (flight.passengers?.length || 0), 0) || 0;
        const firstFlight = selectedBooking.flights?.[0]?.flight;
        const departureTime = firstFlight?.route?.departure?.time;
        
        return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Chi tiết Booking</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Booking Info */}
                <div className="border-b pb-4">
                  <h4 className="font-semibold text-lg mb-3">Thông tin booking</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Mã booking</p>
                      <p className="font-medium">{selectedBooking.bookingReference}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Trạng thái</p>
                      <span className={`px-3 py-1 text-xs rounded-full font-semibold ${getStatusBadge(selectedBooking.status)}`}>
                        {selectedBooking.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Ngày đặt</p>
                      <p className="font-medium">{new Date(selectedBooking.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Thanh toán</p>
                      <span className={`px-3 py-1 text-xs rounded-full font-semibold ${getPaymentBadge(selectedBooking.payment?.status || 'pending')}`}>
                        {selectedBooking.payment?.status || 'pending'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Flight Info */}
                <div className="border-b pb-4">
                  <h4 className="font-semibold text-lg mb-3">Thông tin chuyến bay</h4>
                  {selectedBooking.flights?.map((flightBooking, idx) => (
                    <div key={idx} className="mb-4 p-3 bg-gray-50 rounded">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Số hiệu</p>
                          <p className="font-medium">{flightBooking.flight?.flightNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Tuyến bay</p>
                          <p className="font-medium">
                            {flightBooking.flight?.route?.departure?.airport?.code?.iata || 'N/A'} → {flightBooking.flight?.route?.arrival?.airport?.code?.iata || 'N/A'}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm text-gray-500">Khởi hành</p>
                          <p className="font-medium">
                            {flightBooking.flight?.route?.departure?.time ? 
                              new Date(flightBooking.flight.route.departure.time).toLocaleString('vi-VN') : 
                              'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Passenger Info */}
                <div className="border-b pb-4">
                  <h4 className="font-semibold text-lg mb-3">Hành khách ({totalPassengers})</h4>
                  {selectedBooking.flights?.map((flightBooking, flightIdx) => (
                    <div key={flightIdx}>
                      <p className="text-sm font-medium text-gray-700 mb-2">Chuyến bay {flightIdx + 1}</p>
                      {flightBooking.passengers?.map((passenger, idx) => (
                        <div key={idx} className="mb-3 p-3 bg-gray-50 rounded">
                          <p className="font-medium">
                            {idx + 1}. {passenger.firstName} {passenger.lastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            Loại: {passenger.type === 'adult' ? 'Người lớn' : passenger.type === 'child' ? 'Trẻ em' : 'Em bé'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Price Info */}
                <div>
                  <h4 className="font-semibold text-lg mb-3">Thông tin giá</h4>
                  <div className="bg-red-50 p-4 rounded">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Tổng cộng:</span>
                      <span className="text-2xl font-bold text-red-600">
                        {formatCurrency(selectedBooking.payment?.totalAmount || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Đóng
                </button>
                {selectedBooking.status !== 'cancelled' && (
                  <button
                    onClick={() => {
                      handleCancelBooking(selectedBooking._id);
                      setShowDetailModal(false);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Hủy booking
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        );
      })()}
    </AdminLayout>
  );
};

export default BookingManagement;
