import { Filter, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import adminService from '../../services/adminService';

function CheckinManagement() {
  const [checkins, setCheckins] = useState([]);
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [flightFilter, setFlightFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    loadData();
  }, [pagination.page, flightFilter, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        flight: flightFilter,
        status: statusFilter
      };
      
      const [checkinsRes, flightsRes] = await Promise.all([
        adminService.getCheckins(params),
        adminService.getFlights({ limit: 100 })
      ]);
      
      setCheckins(checkinsRes.data?.checkins || []);
      setFlights(flightsRes.data?.flights || []);
      
      // Map backend pagination structure to frontend
      const backendPagination = checkinsRes.data?.pagination || {};
      setPagination(prev => ({
        ...prev,
        page: backendPagination.page || prev.page,
        total: backendPagination.total || 0,
        pages: backendPagination.pages || 0
      }));
      
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải dữ liệu');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheckin = async (checkin) => {
    if (window.confirm(`Xác nhận check-in thủ công cho hành khách ${checkin.passenger?.lastName} ${checkin.passenger?.firstName}?`)) {
      try {
        // Lấy passengerId từ _id của checkin (format: bookingId_flightId_passengerId)
        const idParts = checkin._id.split('_');
        const passengerId = idParts[2]; // Lấy phần passengerId
        const flightId = checkin.flight?._id;
        
        if (!flightId || !passengerId) {
          alert('Không thể xác định thông tin hành khách hoặc chuyến bay');
          return;
        }

        await adminService.performCheckin({ 
          bookingReference: checkin.bookingReference,
          flightId: flightId,
          passengers: [{
            passengerId: passengerId,
            autoAssignSeat: true // Tự động gán ghế nếu chưa có
          }]
        });
        
        alert('Check-in thành công!');
        loadData();
      } catch (err) {
        alert(err.response?.data?.message || 'Có lỗi xảy ra');
        console.error('Check-in error:', err);
      }
    }
  };

  const handlePrintBoardingPass = async (checkin) => {
    try {
      // Lấy passengerId từ _id của checkin (format: bookingId_flightId_passengerId)
      const idParts = checkin._id.split('_');
      const passengerId = idParts[2]; // Lấy phần passengerId
      
      if (!passengerId) {
        alert('Không thể xác định thông tin hành khách');
        return;
      }

      const response = await adminService.getBoardingPass(checkin.bookingReference, passengerId);
      // Open PDF in new window
      if (response.data?.url) {
        window.open(response.data.url, '_blank');
      } else if (response.url) {
        window.open(response.url, '_blank');
      } else {
        alert('Không tìm thấy thẻ lên máy bay');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể in boarding pass');
      console.error('Boarding pass error:', err);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('vi-VN');
  };

  const getStatusBadge = (status) => {
    const badges = {
      checked_in: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      checked_in: 'Đã check-in',
      pending: 'Chờ check-in',
      cancelled: 'Đã hủy'
    };
    return texts[status] || status;
  };

  const calculateCheckinRate = () => {
    if (pagination.total === 0) return 0;
    const checkedIn = checkins.filter(c => c.status === 'checked_in').length;
    return ((checkedIn / checkins.length) * 100).toFixed(1);
  };

  // Backend đã filter rồi, không cần filter ở frontend nữa
  const filteredCheckins = checkins.filter(checkin => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      checkin.bookingReference?.toLowerCase().includes(search) ||
      checkin.passenger?.firstName?.toLowerCase().includes(search) ||
      checkin.passenger?.lastName?.toLowerCase().includes(search)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Quản lý Check-in</h2>
            <p className="text-gray-600 mt-1">Tổng: {pagination.total} hành khách</p>
          </div>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Tìm mã booking, tên hành khách..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              value={flightFilter}
              onChange={(e) => {
                setFlightFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
            >
              <option value="">Tất cả chuyến bay</option>
              {flights.map(flight => (
                <option key={flight._id} value={flight._id}>
                  {flight.flightNumber} - {flight.route?.departure?.airport?.code?.iata} → {flight.route?.arrival?.airport?.code?.iata}
                </option>
              ))}
            </select>

            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="checked_in">Đã check-in</option>
              <option value="pending">Chờ check-in</option>
              <option value="cancelled">Đã hủy</option>
            </select>

            <button
              onClick={() => {
                setPagination(prev => ({ ...prev, page: 1 }));
                loadData();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center"
            >
              <Filter size={20} className="mr-2" />
              Lọc
            </button>
          </div>
        </div>

        {/* Checkins Table */}
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
                      Chuyến bay
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hành trình
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hành khách
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số ghế
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check-in
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày tạo
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCheckins.map(checkin => (
                    <tr key={checkin._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-semibold">
                          {checkin.bookingReference}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          {checkin.flight?.flightNumber || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {checkin.flight?.route?.departure?.time 
                            ? new Date(checkin.flight.route.departure.time).toLocaleString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900">
                              {checkin.flight?.route?.departure?.airport?.code?.iata || 'N/A'}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="font-semibold text-gray-900">
                              {checkin.flight?.route?.arrival?.airport?.code?.iata || 'N/A'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {checkin.flight?.route?.departure?.airport?.name?.vi || ''}
                          </div>
                          <div className="text-xs text-gray-500">
                            → {checkin.flight?.route?.arrival?.airport?.name?.vi || ''}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {checkin.passenger?.lastName} {checkin.passenger?.firstName}
                        </div>
                        {checkin.passenger?.type && (
                          <div className="text-xs text-gray-500">
                            {checkin.passenger.type}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {checkin.seat && checkin.seat !== 'N/A' ? checkin.seat : (
                            <span className="text-gray-400 font-normal">Chưa chọn</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getStatusBadge(checkin.status)}`}>
                          {getStatusText(checkin.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          {checkin.checkIn?.isCheckedIn ? (
                            <div>
                              <div className="text-green-600 font-semibold">✓ Đã check-in</div>
                              <div className="text-xs text-gray-500">
                                {checkin.checkIn.checkedInBy === 'online' ? 'Online' : 
                                 checkin.checkIn.checkedInBy === 'counter' ? 'Quầy' :
                                 checkin.checkIn.checkedInBy === 'kiosk' ? 'Kiosk' : 
                                 checkin.checkIn.checkedInBy}
                              </div>
                            </div>
                          ) : (
                            <div className="text-yellow-600">Chờ check-in</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {checkin.createdAt 
                          ? new Date(checkin.createdAt).toLocaleString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {checkin.status === 'pending' && !checkin.checkIn?.isCheckedIn && (
                            <button
                              onClick={() => handleManualCheckin(checkin)}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                            >
                              Check-in
                            </button>
                          )}
                          {(checkin.status === 'checked_in' || checkin.checkIn?.isCheckedIn) && (
                            <button
                              onClick={() => handlePrintBoardingPass(checkin)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                            >
                              In thẻ lên máy bay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && filteredCheckins.length > 0 && (
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

          {!loading && filteredCheckins.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Không tìm thấy check-in nào</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default CheckinManagement;
