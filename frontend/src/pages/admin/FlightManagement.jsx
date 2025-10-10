import { Clock, Edit, Filter, MapPin, Plane, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { FLIGHT_STATUS_OPTIONS, getFlightStatusColor, getFlightStatusLabel } from '../../constants/flightStatus';
import adminService from '../../services/adminService';
import aircraftService from '../../services/aircraftService';
import airportService from '../../services/airportService';

const FlightManagement = () => {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // State cho dropdown data
  const [airports, setAirports] = useState([]);
  const [aircrafts, setAircrafts] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  const [formData, setFormData] = useState({
    flightNumber: '',
    departureAirport: '',
    arrivalAirport: '',
    departureTime: '',
    arrivalTime: '',
    aircraft: '',
    status: 'scheduled',
    price: '',
  });

  useEffect(() => {
    loadFlights();
    loadDropdownData();
  }, [pagination.page, statusFilter, dateFrom, dateTo]);  // Removed 'search' from dependencies

  const loadDropdownData = async () => {
    setLoadingDropdowns(true);
    try {
      // Load airports và aircraft song song
      const [airportsResponse, aircraftsResponse] = await Promise.all([
        airportService.getAllAirports({ limit: 100 }),
        aircraftService.getAvailableAircraft()
      ]);

      console.log('Airports response:', airportsResponse);
      console.log('Aircrafts response:', aircraftsResponse);

      // Xử lý response từ API
      const airportsData = airportsResponse?.data?.airports || airportsResponse?.airports || [];
      const aircraftsData = aircraftsResponse?.data || aircraftsResponse || [];

      console.log('Airports data:', airportsData);
      console.log('Aircrafts data:', aircraftsData);

      setAirports(airportsData);
      setAircrafts(aircraftsData);
    } catch (err) {
      console.error('Error loading dropdown data:', err);
      // Fallback nếu có lỗi
      setAirports([]);
      setAircrafts([]);
    } finally {
      setLoadingDropdowns(false);
    }
  };

  const loadFlights = async () => {
    setLoading(true);
    setError('');
    try {
      // Chỉ gửi params khi có giá trị
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      
      // Chỉ thêm filter khi có giá trị
      if (statusFilter) params.status = statusFilter;
      if (dateFrom) params.fromDate = dateFrom;
      if (dateTo) params.toDate = dateTo;
      if (search) params.search = search;
      
      const response = await adminService.getFlights(params);
      console.log("Fetched flights response:", response);
      
      // Backend trả về data.flights và data.total, data.pages
      const flightsData = response.data?.flights || response.flights || [];
      const totalCount = response.data?.total || response.total || 0;
      const totalPages = response.data?.pages || response.pages || 0;
      
      setFlights(flightsData);
      setPagination(prev => ({
        ...prev,
        total: totalCount,
        pages: totalPages,
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách chuyến bay');
      // Mock data for demo
      const mockFlights = Array.from({ length: 10 }, (_, i) => ({
        _id: `flight${i + 1}`,
        flightNumber: `VJ${100 + i}`,
        route: {
          departure: {
            airport: {
              code: { iata: 'HAN' },
              name: { vi: 'Nội Bài' },
            },
            time: new Date(Date.now() + i * 86400000).toISOString(),
          },
          arrival: {
            airport: {
              code: { iata: 'SGN' },
              name: { vi: 'Tân Sơn Nhất' },
            },
            time: new Date(Date.now() + i * 86400000 + 7200000).toISOString(),
          },
        },
        aircraft: {
          type: {
            manufacturer: 'Airbus',
            model: 'A320',
          },
          registration: `VN-${String.fromCharCode(65 + i)}${100 + i}`,
        },
        status: ['scheduled', 'boarding', 'departed', 'arrived', 'cancelled'][i % 5],
        pricing: {
          economy: {
            base: 1500000 + i * 100000,
          },
        },
        createdAt: new Date().toISOString(),
      }));
      setFlights(mockFlights);
      setPagination(prev => ({ ...prev, total: 50, pages: 5 }));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFlight = async (e) => {
    e.preventDefault();
    try {
      // Find selected aircraft to get its type
      const selectedAircraft = aircrafts.find(a => a._id === formData.aircraft);
      if (!selectedAircraft) {
        alert('Vui lòng chọn máy bay');
        return;
      }

      // Calculate duration in minutes from departure and arrival times
      const departureTime = new Date(formData.departureTime);
      const arrivalTime = new Date(formData.arrivalTime);
      const durationMinutes = Math.floor((arrivalTime - departureTime) / (1000 * 60));

      if (durationMinutes < 30) {
        alert('Thời gian bay phải ít nhất 30 phút');
        return;
      }

      // Build aircraft type string (manufacturer + model + variant if available)
      const aircraftType = selectedAircraft.variant 
        ? `${selectedAircraft.manufacturer} ${selectedAircraft.model}-${selectedAircraft.variant}`
        : `${selectedAircraft.manufacturer} ${selectedAircraft.model}`;

      // Transform formData to match backend schema
      const flightData = {
        flightNumber: formData.flightNumber,
        route: {
          departure: {
            airport: formData.departureAirport,
            time: formData.departureTime
          },
          arrival: {
            airport: formData.arrivalAirport,
            time: formData.arrivalTime
          },
          distance: 1000, // Default distance, backend should calculate this
          duration: {
            scheduled: durationMinutes
          }
        },
        aircraft: {
          type: aircraftType,
          registration: selectedAircraft.registration
        },
        status: formData.status,
        pricing: {
          economy: {
            base: parseFloat(formData.price) || 0
          },
          business: {
            base: parseFloat(formData.price) * 2 || 0 // Business giá gấp đôi economy
          }
        },
        seats: {
          economy: {
            total: selectedAircraft.totalSeats ? Math.floor(selectedAircraft.totalSeats * 0.8) : 144, // 80% ghế economy
            available: selectedAircraft.totalSeats ? Math.floor(selectedAircraft.totalSeats * 0.8) : 144
          },
          business: {
            total: selectedAircraft.totalSeats ? Math.floor(selectedAircraft.totalSeats * 0.2) : 36, // 20% ghế business
            available: selectedAircraft.totalSeats ? Math.floor(selectedAircraft.totalSeats * 0.2) : 36
          }
        }
      };

      console.log('Creating flight with data:', flightData);
      await adminService.createFlight(flightData);
      setShowCreateModal(false);
      resetForm();
      loadFlights();
      alert('Tạo chuyến bay thành công!');
    } catch (err) {
      console.error('Create flight error:', err);
      alert(err.response?.data?.message || err.message || 'Không thể tạo chuyến bay');
    }
  };

  const handleUpdateFlight = async (e) => {
    e.preventDefault();
    try {
      // Find selected aircraft to get its type
      const selectedAircraft = aircrafts.find(a => a._id === formData.aircraft);
      if (!selectedAircraft) {
        alert('Vui lòng chọn máy bay');
        return;
      }

      // Calculate duration in minutes from departure and arrival times
      const departureTime = new Date(formData.departureTime);
      const arrivalTime = new Date(formData.arrivalTime);
      const durationMinutes = Math.floor((arrivalTime - departureTime) / (1000 * 60));

      if (durationMinutes < 30) {
        alert('Thời gian bay phải ít nhất 30 phút');
        return;
      }

      // Build aircraft type string (manufacturer + model + variant if available)
      const aircraftType = selectedAircraft.variant 
        ? `${selectedAircraft.manufacturer} ${selectedAircraft.model}-${selectedAircraft.variant}`
        : `${selectedAircraft.manufacturer} ${selectedAircraft.model}`;

      // Transform formData to match backend schema
      const flightData = {
        flightNumber: formData.flightNumber,
        route: {
          departure: {
            airport: formData.departureAirport,
            time: formData.departureTime
          },
          arrival: {
            airport: formData.arrivalAirport,
            time: formData.arrivalTime
          },
          distance: 1000,
          duration: {
            scheduled: durationMinutes
          }
        },
        aircraft: {
          type: aircraftType,
          registration: selectedAircraft.registration
        },
        status: formData.status,
        pricing: {
          economy: {
            base: parseFloat(formData.price) || 0
          },
          business: {
            base: parseFloat(formData.price) * 2 || 0
          }
        },
        seats: {
          economy: {
            total: selectedAircraft.totalSeats ? Math.floor(selectedAircraft.totalSeats * 0.8) : 144,
            available: selectedAircraft.totalSeats ? Math.floor(selectedAircraft.totalSeats * 0.8) : 144
          },
          business: {
            total: selectedAircraft.totalSeats ? Math.floor(selectedAircraft.totalSeats * 0.2) : 36,
            available: selectedAircraft.totalSeats ? Math.floor(selectedAircraft.totalSeats * 0.2) : 36
          }
        }
      };

      await adminService.updateFlight(selectedFlight._id, flightData);
      setShowEditModal(false);
      resetForm();
      loadFlights();
      alert('Cập nhật chuyến bay thành công!');
    } catch (err) {
      console.error('Update flight error:', err);
      alert(err.response?.data?.message || err.message || 'Không thể cập nhật chuyến bay');
    }
  };

  const handleDeleteFlight = async (flightId) => {
    if (!window.confirm('Bạn có chắc muốn xóa chuyến bay này? Hành động này không thể hoàn tác!')) {
      return;
    }

    try {
      await adminService.deleteFlight(flightId);
      setFlights(flights.filter(f => f._id !== flightId));
      alert('Xóa chuyến bay thành công!');
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa chuyến bay');
    }
  };

  const handleEdit = (flight) => {
    console.log('Editing flight:', flight);
    
    setSelectedFlight(flight);
    
    // Format datetime for datetime-local input
    const formatDateTimeLocal = (date) => {
      if (!date) return '';
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Find aircraft by type (since backend stores type as string, not ID)
    const aircraftType = flight.aircraft?.type;
    const matchedAircraft = aircrafts.find(a => {
      const fullType = a.model || `${a.manufacturer} ${a.model}`;
      return fullType === aircraftType;
    });

    setFormData({
      flightNumber: flight.flightNumber,
      departureAirport: flight.route?.departure?.airport?._id || '',
      arrivalAirport: flight.route?.arrival?.airport?._id || '',
      departureTime: formatDateTimeLocal(flight.route?.departure?.time),
      arrivalTime: formatDateTimeLocal(flight.route?.arrival?.time),
      aircraft: matchedAircraft?._id || '',
      status: flight.status,
      price: flight.pricing?.economy?.base || '',
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      flightNumber: '',
      departureAirport: '',
      arrivalAirport: '',
      departureTime: '',
      arrivalTime: '',
      aircraft: '',
      status: 'scheduled',
      price: '',
    });
    setSelectedFlight(null);
  };

  // Không cần định nghĩa getStatusBadge và getStatusLabel nữa vì đã import từ constants

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Helper function to safely render airport/object names
  const renderName = (name) => {
    if (!name) return '';
    if (typeof name === 'object') {
      return name?.vi || name?.en || '';
    }
    return name;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Quản lý Chuyến bay</h2>
            <p className="text-gray-600 mt-1">Tổng: {pagination.total} chuyến bay</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Tạo chuyến bay mới
          </button>
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
                placeholder="Tìm số hiệu, tuyến bay..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    setPagination(prev => ({ ...prev, page: 1 }));
                    loadFlights();
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
              {FLIGHT_STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <input
              type="date"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="Từ ngày"
            />

            <input
              type="date"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="Đến ngày"
            />

            <button
              onClick={loadFlights}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center"
            >
              <Filter size={20} className="mr-2" />
              Lọc
            </button>
          </div>
        </div>

        {/* Flights Table */}
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
                      Số hiệu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tuyến bay
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thời gian
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Máy bay
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Giá
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {flights.map((flight) => (
                    <tr key={flight._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Plane className="text-red-600 mr-2" size={18} />
                          <div className="text-sm font-medium text-gray-900">
                            {flight.flightNumber}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <MapPin size={14} className="mr-1" />
                          {flight.route?.departure?.airport?.code?.iata} ({renderName(flight.route?.departure?.airport?.name)})
                        </div>
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <MapPin size={14} className="mr-1" />
                          {flight.route?.arrival?.airport?.code?.iata} ({renderName(flight.route?.arrival?.airport?.name)})
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <Clock size={14} className="mr-1" />
                          {formatDateTime(flight.route?.departure?.time)}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <Clock size={14} className="mr-1" />
                          {formatDateTime(flight.route?.arrival?.time)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {flight.aircraft?.type || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">{flight.aircraft?.registration || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(flight.pricing?.economy?.base || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs rounded-full font-semibold ${getFlightStatusColor(flight.status)}`}>
                          {getFlightStatusLabel(flight.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(flight)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Chỉnh sửa"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteFlight(flight._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Xóa"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && flights.length > 0 && (
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
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    {/* Previous button */}
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      «
                    </button>
                    
                    {/* Page numbers */}
                    {(() => {
                      const pages = [];
                      const totalPages = pagination.pages;
                      const currentPage = pagination.page;
                      
                      if (totalPages <= 7) {
                        // Show all pages if total is 7 or less
                        for (let i = 1; i <= totalPages; i++) {
                          pages.push(i);
                        }
                      } else {
                        // Always show first page
                        pages.push(1);
                        
                        if (currentPage > 3) {
                          pages.push('...');
                        }
                        
                        // Show pages around current page
                        const start = Math.max(2, currentPage - 1);
                        const end = Math.min(totalPages - 1, currentPage + 1);
                        
                        for (let i = start; i <= end; i++) {
                          if (!pages.includes(i)) {
                            pages.push(i);
                          }
                        }
                        
                        if (currentPage < totalPages - 2) {
                          pages.push('...');
                        }
                        
                        // Always show last page
                        if (!pages.includes(totalPages)) {
                          pages.push(totalPages);
                        }
                      }
                      
                      return pages.map((page, index) => {
                        if (page === '...') {
                          return (
                            <span
                              key={`ellipsis-${index}`}
                              className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                            >
                              ...
                            </span>
                          );
                        }
                        
                        return (
                          <button
                            key={page}
                            onClick={() => setPagination(prev => ({ ...prev, page }))}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === currentPage
                                ? 'z-10 bg-red-50 border-red-500 text-red-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      });
                    })()}
                    
                    {/* Next button */}
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page + 1) }))}
                      disabled={pagination.page >= pagination.pages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      »
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}

          {!loading && flights.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Không tìm thấy chuyến bay nào</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  {showCreateModal ? 'Tạo chuyến bay mới' : 'Chỉnh sửa chuyến bay'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={showCreateModal ? handleCreateFlight : handleUpdateFlight} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số hiệu <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={formData.flightNumber}
                      onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value })}
                      placeholder="VJ123"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trạng thái <span className="text-red-600">*</span>
                    </label>
                    <select
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      {FLIGHT_STATUS_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sân bay đi <span className="text-red-600">*</span>
                    </label>
                    <select
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={formData.departureAirport}
                      onChange={(e) => setFormData({ ...formData, departureAirport: e.target.value })}
                      disabled={loadingDropdowns}
                    >
                      <option value="">
                        {loadingDropdowns ? 'Đang tải...' : airports.length === 0 ? 'Không có sân bay' : 'Chọn sân bay đi'}
                      </option>
                      {airports.map((airport) => {
                        const airportCode = airport.code?.iata || airport.code || '';
                        const airportName = renderName(airport.name);
                        return (
                          <option key={airport._id} value={airport._id}>
                            {airportCode} - {airportName}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sân bay đến <span className="text-red-600">*</span>
                    </label>
                    <select
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={formData.arrivalAirport}
                      onChange={(e) => setFormData({ ...formData, arrivalAirport: e.target.value })}
                      disabled={loadingDropdowns}
                    >
                      <option value="">
                        {loadingDropdowns ? 'Đang tải...' : airports.length === 0 ? 'Không có sân bay' : 'Chọn sân bay đến'}
                      </option>
                      {airports.map((airport) => {
                        const airportCode = airport.code?.iata || airport.code || '';
                        const airportName = renderName(airport.name);
                        return (
                          <option key={airport._id} value={airport._id}>
                            {airportCode} - {airportName}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thời gian khởi hành <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={formData.departureTime}
                      onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thời gian đến <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={formData.arrivalTime}
                      onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Máy bay <span className="text-red-600">*</span>
                    </label>
                    <select
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={formData.aircraft}
                      onChange={(e) => setFormData({ ...formData, aircraft: e.target.value })}
                      disabled={loadingDropdowns}
                    >
                      <option value="">
                        {loadingDropdowns ? 'Đang tải...' : aircrafts.length === 0 ? 'Không có máy bay' : 'Chọn máy bay'}
                      </option>
                      {aircrafts.map((aircraft) => (
                        <option key={aircraft._id} value={aircraft._id}>
                          {aircraft.registration} - {aircraft.manufacturer} {aircraft.model}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giá vé (VND) <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="1500000"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    {showCreateModal ? 'Tạo chuyến bay' : 'Cập nhật'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default FlightManagement;
