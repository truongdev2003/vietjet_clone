import { Edit, Filter, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import adminService from "../../services/adminService";
import airportService from "../../services/airportService";

function RouteManagement() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);

  // Dropdown data
  const [airports, setAirports] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  // Fixed airline - VietJet Air only
  const VIETJET_AIRLINE = {
    _id: '6765cc6b46e6cc9c1c83b8ec',
    name: { full: { vi: 'VietJet Air' } },
    code: { iata: 'VJ' }
  };

  // Pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });

  // Filters (removed airline filter)
  const [filters, setFilters] = useState({
    type: '',
    status: ''
  });

  const [formData, setFormData] = useState({
    code: "",
    origin: "",
    destination: "",
    airline: "6765cc6b46e6cc9c1c83b8ec", // Fixed to VietJet Air
    type: "domestic",
    distance: {
      nauticalMiles: "",
      kilometers: ""
    },
    duration: {
      scheduled: "",
      minimum: "",
      maximum: ""
    },
    pricing: {
      baseFare: {
        economy: "",
        premiumEconomy: "",
        business: "",
        first: ""
      },
      currency: "VND"
    },
    status: "active"
  });

  // Helper function to get status value from route data
  const getStatusValue = (route) => {
    if (!route.status) return 'discontinued';
    
    // If status is already a string
    if (typeof route.status === 'string') {
      return route.status;
    }
    
    // If status is an object (from backend)
    if (typeof route.status === 'object') {
      if (route.status.isActive === false) {
        return 'discontinued';
      } else if (route.status.isOperational === false) {
        return 'suspended';
      } else {
        return 'active';
      }
    }
    
    return 'active';
  };

  // Helper function to get status display info
  const getStatusDisplay = (route) => {
    const statusValue = getStatusValue(route);
    
    const statusMap = {
      'active': {
        className: 'bg-green-100 text-green-800',
        text: 'Hoạt động'
      },
      'suspended': {
        className: 'bg-yellow-100 text-yellow-800',
        text: 'Tạm ngưng'
      },
      'discontinued': {
        className: 'bg-red-100 text-red-800',
        text: 'Ngưng'
      }
    };
    
    return statusMap[statusValue] || statusMap['active'];
  };

  useEffect(() => {
    loadDropdownData();
  }, []);

  useEffect(() => {
    loadRoutes();
  }, [pagination.currentPage, filters]);

  const loadDropdownData = async () => {
    setLoadingDropdowns(true);
    try {
      const airportsResponse = await airportService.getAllAirports({ limit: 200 });
      setAirports(airportsResponse?.data?.airports || []);
      
      console.log("✅ Loaded dropdown data:" ,airportsResponse?.data?.airports);
    } catch (err) {
      console.error("Error loading dropdown data:", err);
      setAirports([]);
    } finally {
      setLoadingDropdowns(false);
    }
  };

  const loadRoutes = async (page = pagination.currentPage) => {
    try {
      setLoading(true);
      
      const params = {
        page,
        limit: 20,
        ...filters
      };

      const response = await adminService.getRoutes(params);
      
      const routesData = response?.data?.routes || [];
      
      // Debug: Log first route's status structure
      if (routesData.length > 0) {
        console.log("📊 Route status structure:", {
          firstRoute: routesData[0],
          statusType: typeof routesData[0].status,
          statusValue: routesData[0].status
        });
      }
      
      setRoutes(routesData);
      
      if (response?.data?.pagination) {
        setPagination(response.data.pagination);
      }
      
      setError(null);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách tuyến bay");
      console.error("Error loading routes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested fields
    if (name.includes('.')) {
      const keys = name.split('.');
      setFormData(prev => {
        const newData = { ...prev };
        let current = newData;
        
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
        return newData;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Auto-calculate kilometers from nautical miles if not provided
      const nauticalMiles = parseFloat(formData.distance.nauticalMiles);
      if (nauticalMiles && !formData.distance.kilometers) {
        formData.distance.kilometers = Math.round(nauticalMiles * 1.852);
      }

      if (editingRoute) {
        await adminService.updateRoute(editingRoute._id, formData);
      } else {
        await adminService.createRoute(formData);
      }
      
      setShowModal(false);
      setEditingRoute(null);
      resetForm();
      loadRoutes();
    } catch (err) {
      alert(err.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const handleEdit = (route) => {
    console.log("🔧 Editing route:", {
      route,
      statusRaw: route.status,
      statusType: typeof route.status,
      statusValue: getStatusValue(route)
    });
    
    setEditingRoute(route);
    
    setFormData({
      code: route.code || "",
      origin: route.origin?._id || "",
      destination: route.destination?._id || "",
      airline: route.airline?._id || "",
      type: route.type || "domestic",
      distance: {
        nauticalMiles: route.distance?.nauticalMiles || "",
        kilometers: route.distance?.kilometers || ""
      },
      duration: {
        scheduled: route.duration?.scheduled || "",
        minimum: route.duration?.minimum || "",
        maximum: route.duration?.maximum || ""
      },
      pricing: {
        baseFare: {
          economy: route.pricing?.baseFare?.economy || "",
          premiumEconomy: route.pricing?.baseFare?.premiumEconomy || "",
          business: route.pricing?.baseFare?.business || "",
          first: route.pricing?.baseFare?.first || ""
        },
        currency: route.pricing?.currency || "VND"
      },
      status: getStatusValue(route)
    });
    setShowModal(true);
  };

  const handleDelete = async (routeId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tuyến bay này?")) {
      return;
    }

    try {
      await adminService.deleteRoute(routeId);
      loadRoutes();
    } catch (err) {
      alert(err.response?.data?.message || "Không thể xóa tuyến bay");
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      origin: "",
      destination: "",
      airline: "",
      type: "domestic",
      distance: {
        nauticalMiles: "",
        kilometers: ""
      },
      duration: {
        scheduled: "",
        minimum: "",
        maximum: ""
      },
      pricing: {
        baseFare: {
          economy: "",
          premiumEconomy: "",
          business: "",
          first: ""
        },
        currency: "VND"
      },
      status: "active"
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const formatDistance = (route) => {
    if (!route.distance) return 'N/A';
    return `${route.distance.nauticalMiles || 0} NM (${route.distance.kilometers || 0} km)`;
  };

  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Quản lý Tuyến Bay</h2>
            <p className="text-gray-600 mt-1">Tổng: {pagination.totalItems} tuyến bay</p>
          </div>
          <button 
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
            onClick={() => {
              setEditingRoute(null);
              resetForm();
              setShowModal(true);
            }}
          >
            <Plus size={20} className="mr-2" />
            Thêm Tuyến Bay
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Tất cả loại tuyến</option>
              <option value="domestic">Nội địa</option>
              <option value="international">Quốc tế</option>
              <option value="regional">Khu vực</option>
            </select>

            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="suspended">Tạm ngưng</option>
              <option value="discontinued">Ngưng hoạt động</option>
            </select>

            <button
              onClick={() => loadRoutes(1)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center"
            >
              <Filter size={20} className="mr-2" />
              Lọc
            </button>
          </div>
        </div>

        {/* Routes Table */}
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
                      Mã tuyến
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tuyến bay
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Khoảng cách
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thời gian bay
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
                  {routes.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                        Không có dữ liệu tuyến bay
                      </td>
                    </tr>
                  ) : (
                    routes.map((route) => (
                      <tr key={route._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-red-600 font-mono">
                            {route.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {route.origin?.code?.iata || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {route.origin?.name?.vi || route.origin?.name?.en || ''}
                              </div>
                            </div>
                            <div className="text-gray-400">→</div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {route.destination?.code?.iata || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {route.destination?.name?.vi || route.destination?.name?.en || ''}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                            route.type === 'domestic' ? 'bg-blue-100 text-blue-800' :
                            route.type === 'international' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {route.type === 'domestic' ? 'Nội địa' : 
                             route.type === 'international' ? 'Quốc tế' : 'Khu vực'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {route.distance?.nauticalMiles || 0} NM
                          </div>
                          <div className="text-xs text-gray-500">
                            {route.distance?.kilometers || 0} km
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDuration(route.duration?.scheduled)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(() => {
                            const statusDisplay = getStatusDisplay(route);
                            return (
                              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${statusDisplay.className}`}>
                                {statusDisplay.text}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEdit(route)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Chỉnh sửa"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(route._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Xóa"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && routes.length > 0 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                  disabled={!pagination.hasPrevPage}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Trước
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                  disabled={!pagination.hasNextPage}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Hiển thị <span className="font-medium">{(pagination.currentPage - 1) * pagination.itemsPerPage + 1}</span> đến{' '}
                    <span className="font-medium">
                      {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
                    </span>{' '}
                    trong <span className="font-medium">{pagination.totalItems}</span> kết quả
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    {/* Previous button */}
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
                      disabled={!pagination.hasPrevPage}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.currentPage >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.currentPage - 2 + i;
                      }
                      return pageNum;
                    }).map((page) => (
                      <button
                        key={page}
                        onClick={() => setPagination(prev => ({ ...prev, currentPage: page }))}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pagination.currentPage
                            ? 'z-10 bg-red-50 border-red-500 text-red-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    {/* Next button */}
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.min(pagination.totalPages, prev.currentPage + 1) }))}
                      disabled={!pagination.hasNextPage}
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
        </div>

        {/* Modal Form */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingRoute ? "Chỉnh sửa tuyến bay" : "Thêm tuyến bay mới"}
                </h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">
                      Thông tin cơ bản
                    </h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mã tuyến *
                      </label>
                      <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleInputChange}
                        placeholder="VD: SGNHAN"
                        required
                        disabled={!!editingRoute}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Điểm đi *
                      </label>
                      <select
                        name="origin"
                        value={formData.origin}
                        onChange={handleInputChange}
                        required
                        disabled={loadingDropdowns}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
                      >
                        <option value="">-- Chọn sân bay --</option>
                        {airports.map(airport => (
                          <option key={airport._id} value={airport._id}>
                            {airport.code?.iata} - {airport.name?.vi || airport.name?.en}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Điểm đến *
                      </label>
                      <select
                        name="destination"
                        value={formData.destination}
                        onChange={handleInputChange}
                        required
                        disabled={loadingDropdowns}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
                      >
                        <option value="">-- Chọn sân bay --</option>
                        {airports.map(airport => (
                          <option key={airport._id} value={airport._id}>
                            {airport.code?.iata} - {airport.name?.vi || airport.name?.en}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Loại tuyến bay *
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="domestic">Nội địa</option>
                        <option value="international">Quốc tế</option>
                        <option value="regional">Khu vực</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Trạng thái
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="active">Hoạt động</option>
                        <option value="suspended">Tạm ngưng</option>
                        <option value="discontinued">Ngưng hoạt động</option>
                      </select>
                    </div>
                  </div>

                  {/* Distance & Duration */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">
                      Khoảng cách & Thời gian
                    </h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Khoảng cách (hải lý) *
                      </label>
                      <input
                        type="number"
                        name="distance.nauticalMiles"
                        value={formData.distance.nauticalMiles}
                        onChange={handleInputChange}
                        placeholder="VD: 500"
                        required
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Khoảng cách (km)
                      </label>
                      <input
                        type="number"
                        name="distance.kilometers"
                        value={formData.distance.kilometers}
                        onChange={handleInputChange}
                        placeholder="Tự động tính nếu để trống"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                      <small className="text-xs text-gray-500 italic">Tự động tính = Hải lý × 1.852</small>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Thời gian bay dự kiến (phút) *
                      </label>
                      <input
                        type="number"
                        name="duration.scheduled"
                        value={formData.duration.scheduled}
                        onChange={handleInputChange}
                        placeholder="VD: 120"
                        required
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Thời gian bay tối thiểu (phút)
                      </label>
                      <input
                        type="number"
                        name="duration.minimum"
                        value={formData.duration.minimum}
                        onChange={handleInputChange}
                        placeholder="VD: 110"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Thời gian bay tối đa (phút)
                      </label>
                      <input
                        type="number"
                        name="duration.maximum"
                        value={formData.duration.maximum}
                        onChange={handleInputChange}
                        placeholder="VD: 140"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>

                  {/* Pricing (Optional) */}
                  <div className="md:col-span-2 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">
                      Giá cơ bản (tùy chọn)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Economy
                        </label>
                        <input
                          type="number"
                          name="pricing.baseFare.economy"
                          value={formData.pricing.baseFare.economy}
                          onChange={handleInputChange}
                          placeholder="0"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Premium Economy
                        </label>
                        <input
                          type="number"
                          name="pricing.baseFare.premiumEconomy"
                          value={formData.pricing.baseFare.premiumEconomy}
                          onChange={handleInputChange}
                          placeholder="0"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Business
                        </label>
                        <input
                          type="number"
                          name="pricing.baseFare.business"
                          value={formData.pricing.baseFare.business}
                          onChange={handleInputChange}
                          placeholder="0"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Class
                        </label>
                        <input
                          type="number"
                          name="pricing.baseFare.first"
                          value={formData.pricing.baseFare.first}
                          onChange={handleInputChange}
                          placeholder="0"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    {editingRoute ? "Cập nhật" : "Thêm mới"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default RouteManagement;
