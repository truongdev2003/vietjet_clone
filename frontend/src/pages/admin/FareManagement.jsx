import { Edit, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import adminService from "../../services/adminService";
import "../../styles/admin/FareManagement.css";

function FareManagement() {
  const [fares, setFares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingFare, setEditingFare] = useState(null);

  // State cho dropdown data
  const [airports, setAirports] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  // Hardcoded airlines (vì backend chưa có API)
  const airlines = [
    { _id: '6765cc6b46e6cc9c1c83b8ec', name: { full: { vi: 'VietJet Air' } }, code: { iata: 'VJ' } },
    { _id: '68e2aaf509a5db22056eaf93', name: { full: { vi: 'Tổng công ty Hàng không Việt Nam' } }, code: { iata: 'VN' } },
    { _id: '68e2aaf509a5db22056eaf94', name: { full: { vi: 'Bamboo Airways' } }, code: { iata: 'QH' } },
    { _id: '68e2aaf509a5db22056eaf95', name: { full: { vi: 'Vietravel Airlines' } }, code: { iata: 'VU' } },
    { _id: '68e2aaf509a5db22056eaf96', name: { full: { vi: 'Pacific Airlines' } }, code: { iata: 'BL' } }
  ];

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // Filter state
  const [filters, setFilters] = useState({
    cabinClass: '',
    status: '',
    route: ''
  });

  const [formData, setFormData] = useState({
    code: "",
    cabinClass: "economy",
    tripType: "one_way",
    basePrice: "",
    currency: "VND",
    route: "",
    validFrom: "",
    validTo: "",
    refundable: false,
    changeable: false,
    advancePurchase: 0,
    cabinBaggage: 7,
    checkedBaggage: 20,
    status: "active",
  });

  useEffect(() => {
    loadDropdownData();
  }, []);

  useEffect(() => {
    loadFares();
  }, [pagination.page, filters]);

  // Helper function to get status value from fare data
  const getStatusValue = (fare) => {
    if (!fare.status) return 'pending';
    
    // If status is already a string
    if (typeof fare.status === 'string') {
      return fare.status;
    }
    
    // If status is an object (from backend)
    if (typeof fare.status === 'object' && fare.status.current) {
      return fare.status.current;
    }
    
    return 'pending';
  };

  // Helper function to get status display info
  const getStatusDisplay = (fare) => {
    const statusValue = getStatusValue(fare);
    
    const statusMap = {
      'active': {
        className: 'status-badge status-active',
        text: 'Hoạt động'
      },
      'pending': {
        className: 'status-badge status-pending',
        text: 'Chờ duyệt'
      },
      'inactive': {
        className: 'status-badge status-inactive',
        text: 'Ngừng'
      },
      'expired': {
        className: 'status-badge status-expired',
        text: 'Hết hạn'
      }
    };
    
    return statusMap[statusValue] || statusMap['pending'];
  };

  const loadDropdownData = async () => {
    setLoadingDropdowns(true);
    try {
      // Load airports, routes (airlines hardcoded)
      const [airportsResponse, routesResponse] = await Promise.all([
        adminService.getAirports(),
        adminService.getRoutes().catch(() => ({ data: { routes: [] } }))
      ]);
      
      setAirports(airportsResponse.data?.airports || []);
      setRoutes(routesResponse.data?.routes || []);
      
      console.log("✅ Loaded dropdown data:", {
        airports: airportsResponse.data?.airports?.length || 0,
        routes: routesResponse.data?.routes?.length || 0,
        airlines: airlines.length
      });
    } catch (err) {
      console.error("Error loading dropdown data:", err);
      setAirports([]);
      setRoutes([]);
    } finally {
      setLoadingDropdowns(false);
    }
  };

  const loadFares = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });
      
      console.log("📤 Loading fares with params:", params);
      
      const response = await adminService.getFares(params);
      console.log("📥 Fetched fares data:", response);
      
      // Backend returns: { success, message, data: { fares: [...], pagination: {...} } }
      const faresData = response.data?.fares || [];
      const paginationData = response.data?.pagination || {};
      
      // Debug: Log first fare's status structure
      if (faresData.length > 0) {
        console.log("📊 Fare status structure:", {
          firstFare: faresData[0],
          statusType: typeof faresData[0].status,
          statusValue: faresData[0].status,
          extractedStatus: getStatusValue(faresData[0])
        });
      }
      
      setFares(Array.isArray(faresData) ? faresData : []);
      
      // Cập nhật pagination từ backend
      if (paginationData) {
        setPagination(prev => ({
          ...prev,
          page: paginationData.currentPage || prev.page,
          total: paginationData.totalItems || 0,
          pages: paginationData.totalPages || 0,
        }));
      }
      
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải danh sách giá vé");
      console.error("Error loading fares:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Calculate total price (baseFare + any fees/taxes if applicable)
      const basePrice = parseFloat(formData.basePrice);
      const totalPrice = basePrice; // For now, total = baseFare (can add fees later)
      
      // Generate name based on cabin class and route
      const cabinClassName = {
        'economy': 'Phổ Thông',
        'premium_economy': 'Phổ Thông Đặc Biệt',
        'business': 'Thương Gia',
        'first': 'Hạng Nhất'
      }[formData.cabinClass] || formData.cabinClass;
      
      const cabinClassNameEn = {
        'economy': 'Economy',
        'premium_economy': 'Premium Economy',
        'business': 'Business',
        'first': 'First Class'
      }[formData.cabinClass] || formData.cabinClass;
      
      // Transform formData to backend schema
      const submitData = {
        code: editingFare ? editingFare.code : formData.code.toUpperCase(),
        name: {
          vi: editingFare?.name?.vi || `Giá vé ${cabinClassName} - ${formData.code}`,
          en: editingFare?.name?.en || `${cabinClassNameEn} Fare - ${formData.code}`
        },
        cabinClass: formData.cabinClass,
        tripType: formData.tripType,
        type: "published",
        route: formData.route,
        airline: '6765cc6b46e6cc9c1c83b8ec', // VietJet Air (fixed)
        pricing: {
          baseFare: {
            amount: basePrice,
            currency: formData.currency
          },
          total: totalPrice, // ✅ THÊM FIELD NÀY
          ageBasedPricing: {
            adult: basePrice,
            child: basePrice * 0.75,
            infant: basePrice * 0.1
          }
        },
        validity: {
          startDate: formData.validFrom,
          endDate: formData.validTo
        },
        conditions: {
          booking: {
            advancePurchase: {
              minimum: parseInt(formData.advancePurchase) || 0,
              maximum: 365
            }
          }
        },
        rules: {
          cancellation: {
            allowed: formData.refundable,
            refundable: formData.refundable
          },
          changes: {
            allowed: formData.changeable
          }
        },
        inclusions: {
          baggage: {
            carryOn: {
              weight: parseInt(formData.cabinBaggage) || 7,
              pieces: 1
            },
            checked: {
              weight: parseInt(formData.checkedBaggage) || 20,
              pieces: 1
            }
          }
        },
        status: {
          current: formData.status
        }
      };

      console.log("📤 Submitting fare data:", submitData);

      if (editingFare) {
        await adminService.updateFare(editingFare._id, submitData);
      } else {
        await adminService.createFare(submitData);
      }
      loadFares();
      handleCloseModal();
    } catch (err) {
      console.error("❌ Error submitting fare:", err);
      alert(err.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const handleEdit = (fare) => {
    console.log("� Editing fare:", {
      fare,
      statusRaw: fare.status,
      statusType: typeof fare.status,
      statusValue: getStatusValue(fare)
    });
    
    setEditingFare(fare);
    
    // Extract data từ nested structure
    const extractedData = {
      code: fare.code || "",
      cabinClass: fare.cabinClass || "economy",
      tripType: fare.tripType || "one_way",
      basePrice: fare.pricing?.baseFare?.amount || "",
      currency: fare.pricing?.baseFare?.currency || "VND",
      route: typeof fare.route === 'object' ? fare.route?._id : fare.route || "",
      validFrom: fare.validity?.startDate ? new Date(fare.validity.startDate).toISOString().split("T")[0] : "",
      validTo: fare.validity?.endDate ? new Date(fare.validity.endDate).toISOString().split("T")[0] : "",
      refundable: fare.rules?.cancellation?.allowed || false,
      changeable: fare.rules?.changes?.allowed || false,
      advancePurchase: fare.conditions?.booking?.advancePurchase?.minimum || 0,
      cabinBaggage: fare.inclusions?.baggage?.carryOn?.weight || 7,
      checkedBaggage: fare.inclusions?.baggage?.checked?.weight || 20,
      status: getStatusValue(fare),
    };
    
    console.log("✅ Extracted form data:", extractedData);
    
    setFormData(extractedData);
    setShowModal(true);
  };

  const handleDelete = async (fareId) => {
    if (window.confirm("Bạn có chắc muốn xóa giá vé này?")) {
      try {
        await adminService.deleteFare(fareId);
        loadFares();
      } catch (err) {
        alert(err.response?.data?.message || "Không thể xóa giá vé");
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingFare(null);
    setFormData({
      code: "",
      cabinClass: "economy",
      tripType: "one_way",
      basePrice: "",
      currency: "VND",
      route: "",
      validFrom: "",
      validTo: "",
      refundable: false,
      changeable: false,
      advancePurchase: 0,
      cabinBaggage: 7,
      checkedBaggage: 20,
      status: "active",
    });
  };

  const formatPrice = (price, currency = "VND") => {
    // Kiểm tra giá trị hợp lệ
    if (!price || isNaN(price)) return "0 ₫";

    // Đảm bảo currency hợp lệ
    const validCurrency =
      currency && ["VND", "USD", "EUR"].includes(currency) ? currency : "VND";

    try {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: validCurrency,
      }).format(price);
    } catch (error) {
      // Fallback nếu có lỗi
      return `${new Intl.NumberFormat("vi-VN").format(price)} ${validCurrency}`;
    }
  };

  // Helper function to safely render airport/object names
  const renderName = (name) => {
    if (!name) return '';
    if (typeof name === 'object') {
      return name?.vi || name?.en || '';
    }
    return name;
  };

  const renderCode = (code) => {
    if (!code) return '';
    if (typeof code === 'object') {
      return code?.iata || code?.icao || '';
    }
    return code;
  };

  const getFareClassName = (fareClass) => {
    const names = {
      economy: "Phổ Thông",
      premium_economy: "Phổ Thông Đặc Biệt",
      business: "Thương Gia",
      first: "Hạng Nhất",
    };
    return names[fareClass] || fareClass;
  };

  const getRouteDisplay = (route) => {
    // Nếu route là object (populated)
    if (route && typeof route === "object") {
      if (route.code) return route.code;
      if (route.origin && route.destination) {
        return `${route.origin} - ${route.destination}`;
      }
      return "N/A";
    }
    // Nếu route là string hoặc null/undefined
    return route || "Tất cả";
  };

  if (loading)
    return (
      <AdminLayout>
        <div className="loading">Đang tải...</div>
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <div className="fare-management">
        <div className="page-header">
          <div>
            <h1>Quản Lý Giá Vé</h1>
            <p className="text-gray-600 mt-1">Tổng: {pagination.total} giá vé</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            + Thêm Giá Vé Mới
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Filters Section */}
        <div className="filters-section" style={{marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
          <select
            value={filters.cabinClass}
            onChange={(e) => {
              setFilters(prev => ({ ...prev, cabinClass: e.target.value }));
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            style={{padding: '8px', borderRadius: '4px', border: '1px solid #ddd'}}
          >
            <option value="">Tất cả hạng vé</option>
            <option value="economy">Phổ Thông</option>
            <option value="premium_economy">Phổ Thông Đặc Biệt</option>
            <option value="business">Thương Gia</option>
            <option value="first">Hạng Nhất</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => {
              setFilters(prev => ({ ...prev, status: e.target.value }));
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            style={{padding: '8px', borderRadius: '4px', border: '1px solid #ddd'}}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="pending">Chờ duyệt</option>
            <option value="inactive">Ngừng</option>
            <option value="expired">Hết hạn</option>
          </select>

          <select
            value={filters.route}
            onChange={(e) => {
              setFilters(prev => ({ ...prev, route: e.target.value }));
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            style={{padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minWidth: '200px'}}
          >
            <option value="">Tất cả tuyến bay</option>
            {routes.map((route) => (
              <option key={route._id} value={route._id}>
                {route.code} - {route.routeName || 'N/A'}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setFilters({ cabinClass: '', status: '', route: '' });
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            style={{padding: '8px 16px', borderRadius: '4px', border: '1px solid #ddd', background: '#f5f5f5', cursor: 'pointer'}}
          >
            Xóa bộ lọc
          </button>
        </div>

        <div className="fares-table">
          <table>
            <thead>
              <tr>
                <th>Hạng Vé</th>
                <th>Giá Cơ Bản</th>
                <th>Tuyến Bay</th>
                <th>Hiệu Lực</th>
                <th>Hoàn/Đổi</th>
                <th>Hành Lý (kg)</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {fares.map((fare) => (
                <tr key={fare._id}>
                  <td>
                    <strong>{getFareClassName(fare.cabinClass)}</strong>
                  </td>
                  <td>
                    {formatPrice(
                      fare.pricing?.baseFare?.amount || 0,
                      fare.pricing?.baseFare?.currency
                    )}
                  </td>
                  <td>{getRouteDisplay(fare.route)}</td>
                  <td>
                    {fare.validity?.startDate &&
                      new Date(fare.validity.startDate).toLocaleDateString(
                        "vi-VN"
                      )}{" "}
                    -
                    {fare.validity?.endDate &&
                      new Date(fare.validity.endDate).toLocaleDateString(
                        "vi-VN"
                      )}
                  </td>
                  <td>
                    {fare.rules?.cancellation?.allowed ? "✓ Hoàn" : "✗ Hoàn"} /
                    {fare.rules?.changes?.allowed ? "✓ Đổi" : "✗ Đổi"}
                  </td>
                  <td>
                    Xách tay: {fare.inclusions?.baggage?.carryOn?.weight || 7}kg
                    <br />
                    Ký gửi: {fare.inclusions?.baggage?.checked?.weight || 20}kg
                  </td>
                  <td>
                    {(() => {
                      const statusDisplay = getStatusDisplay(fare);
                      return (
                        <span className={statusDisplay.className}>
                          {statusDisplay.text}
                        </span>
                      );
                    })()}
                  </td>
                  <td>
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(fare)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Chỉnh sửa"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(fare._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Xóa giá vé"
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

        {/* Pagination */}
        {!loading && fares.length > 0  && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page + 1) }))}
                disabled={pagination.page >= pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  {/* Previous button */}
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
                  
                  {/* Page numbers */}
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
                          <span key="dots-start" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                            ...
                          </span>
                        );
                      }
                    }
                    
                    // Page numbers
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
                          <span key="dots-end" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
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
                  
                  {/* Next button */}
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

        {showModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingFare ? "Chỉnh Sửa Giá Vé" : "Thêm Giá Vé Mới"}</h2>
                <button className="close-btn" onClick={handleCloseModal}>
                  ×
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  {!editingFare && (
                    <div className="form-group">
                      <label>Mã Giá Vé *</label>
                      <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleInputChange}
                        required
                        placeholder="VD: FARE001"
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label>Hạng Vé *</label>
                    <select
                      name="cabinClass"
                      value={formData.cabinClass}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="economy">Phổ Thông</option>
                      <option value="premium_economy">
                        Phổ Thông Đặc Biệt
                      </option>
                      <option value="business">Thương Gia</option>
                      <option value="first">Hạng Nhất</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Loại Vé *</label>
                    <select
                      name="tripType"
                      value={formData.tripType}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="one_way">Một chiều</option>
                      <option value="round_trip">Khứ hồi</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Giá Cơ Bản *</label>
                    <input
                      type="number"
                      name="basePrice"
                      value={formData.basePrice}
                      onChange={handleInputChange}
                      required
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Đơn Vị Tiền Tệ</label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                    >
                      <option value="VND">VND</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tuyến Bay *</label>
                    <select
                      name="route"
                      value={formData.route}
                      onChange={handleInputChange}
                      required
                      disabled={loadingDropdowns}
                    >
                      <option value="">Chọn tuyến bay</option>
                      {routes.map((route) => (
                        <option key={route._id} value={route._id}>
                          {route.code} - {route.routeName || 'N/A'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Hiệu Lực Từ</label>
                    <input
                      type="date"
                      name="validFrom"
                      value={formData.validFrom}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Hiệu Lực Đến</label>
                    <input
                      type="date"
                      name="validTo"
                      value={formData.validTo}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Đặt Trước (ngày)</label>
                    <input
                      type="number"
                      name="advancePurchase"
                      value={formData.advancePurchase}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Hành Lý Xách Tay (kg)</label>
                    <input
                      type="number"
                      name="cabinBaggage"
                      value={formData.cabinBaggage}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Hành Lý Ký Gửi (kg)</label>
                    <input
                      type="number"
                      name="checkedBaggage"
                      value={formData.checkedBaggage}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Trạng Thái</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="active">Hoạt động</option>
                      <option value="pending">Chờ duyệt</option>
                      <option value="inactive">Ngừng hoạt động</option>
                      <option value="expired">Hết hạn</option>
                    </select>
                  </div>
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        name="refundable"
                        checked={formData.refundable}
                        onChange={handleInputChange}
                      />
                      Cho phép hoàn vé
                    </label>
                  </div>
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        name="changeable"
                        checked={formData.changeable}
                        onChange={handleInputChange}
                      />
                      Cho phép đổi vé
                    </label>
                  </div>
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCloseModal}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingFare ? "Cập Nhật" : "Thêm Mới"}
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

export default FareManagement;
