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

  useEffect(() => {
    loadData();
  }, [flightFilter, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [checkinsRes, flightsRes] = await Promise.all([
        adminService.getCheckins({ flight: flightFilter, status: statusFilter }),
        adminService.getFlights({ limit: 100 })
      ]);
      setCheckins(checkinsRes.data?.checkins || []);
      setFlights(flightsRes.data?.flights || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải dữ liệu');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheckin = async (bookingRef) => {
    if (window.confirm('Xác nhận check-in thủ công cho booking này?')) {
      try {
        await adminService.performCheckin({ bookingReference: bookingRef });
        alert('Check-in thành công!');
        loadData();
      } catch (err) {
        alert(err.response?.data?.message || 'Có lỗi xảy ra');
      }
    }
  };

  const handlePrintBoardingPass = async (bookingRef, passengerId) => {
    try {
      const response = await adminService.getBoardingPass(bookingRef, passengerId);
      // Open PDF in new window
      window.open(response.data.url, '_blank');
    } catch (err) {
      alert('Không thể in boarding pass');
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
    if (checkins.length === 0) return 0;
    const checkedIn = checkins.filter(c => c.status === 'checked_in').length;
    return ((checkedIn / checkins.length) * 100).toFixed(1);
  };

  const filteredCheckins = checkins.filter(checkin => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      checkin.bookingReference?.toLowerCase().includes(search) ||
      checkin.passenger?.name?.toLowerCase().includes(search)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Quản lý Check-in</h2>
            <p className="text-gray-600 mt-1">Tổng: {checkins.length} hành khách</p>
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
              }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="checked_in">Đã check-in</option>
              <option value="pending">Chờ check-in</option>
              <option value="cancelled">Đã hủy</option>
            </select>

            <button
              onClick={loadData}
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
                      Hành khách
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số ghế
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thời gian
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
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{checkin.bookingReference}</code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{checkin.flight?.flightNumber}</div>
                        <div className="text-sm text-gray-500">
                          {checkin.flight?.route?.departure?.airport?.code?.iata} → {checkin.flight?.route?.arrival?.airport?.code?.iata}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{checkin.passenger?.firstName} {checkin.passenger?.lastName}</div>
                        <div className="text-sm text-gray-500">{checkin.passenger?.type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {checkin.seat || 'Chưa chọn'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getStatusBadge(checkin.status)}`}>
                          {getStatusText(checkin.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {checkin.checkIn?.checkedInAt ? formatDate(checkin.checkIn.checkedInAt) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {checkin.status === 'pending' && (
                            <button
                              onClick={() => handleManualCheckin(checkin.bookingReference)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Check-in
                            </button>
                          )}
                          {checkin.status === 'checked_in' && (
                            <button
                              onClick={() => handlePrintBoardingPass(checkin.bookingReference, checkin.passenger?._id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              In BP
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
