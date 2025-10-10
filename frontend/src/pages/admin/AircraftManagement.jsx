import { useEffect, useState } from "react";
import {
    FaCheck,
    FaEdit,
    FaPlane,
    FaPlus,
    FaTimes,
    FaTrash,
} from "react-icons/fa";
import AdminLayout from "../../components/AdminLayout";
import aircraftService from "../../services/aircraftService";
import airportService from "../../services/airportService";
import "../../styles/admin/AircraftManagement.css";

const AircraftManagement = () => {
  const [aircraft, setAircraft] = useState([]);
  const [airports, setAirports] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' or 'edit'
  const [selectedAircraft, setSelectedAircraft] = useState(null);
  const [formData, setFormData] = useState({
    registration: "",
    manufacturer: "",
    model: "",
    variant: "",
    msn: "", // Manufacturer Serial Number - REQUIRED field
    status: "active", // Simple string matching backend controller
    currentLocation: "", // Airport ID
    baseAirport: "", // Airport ID
    airline: "", // Airline ID
    configuration: {
      totalSeats: 0,
      layout: "3-3",
      classes: [],
    },
    specifications: {
      engines: "",
      engineCount: 2,
      maxSeats: 0,
      mtow: 0,
      range: 0,
      serviceSpeed: 0,
    },
  });

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    manufacturer: "",
  });

  useEffect(() => {
    fetchAircraft();
    fetchAirports();
    fetchAirlines();
  }, [currentPage, filters]);

  // Debug: Log formData changes
  useEffect(() => {
    if (showModal) {
      console.log("📝 Form data changed:", {
        manufacturer: formData.manufacturer,
        status: formData.status,
        airline: formData.airline,
        currentLocation: formData.currentLocation,
        baseAirport: formData.baseAirport,
      });
    }
  }, [formData, showModal]);

  const fetchAircraft = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page: currentPage,
        limit: 10,
        ...filters,
      };
      const response = await aircraftService.getAllAircraft(params);
      console.log("Fetched aircraft data:", response.data);
      setAircraft(response.data.aircraft);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách máy bay");
    } finally {
      setLoading(false);
    }
  };

  const fetchAirports = async () => {
    try {
      const response = await airportService.getAllAirports({ limit: 1000 });
      console.log("✈️ Loaded airports:", response.data.airports?.length || 0);
      setAirports(response.data.airports || []);
    } catch (err) {
      console.error("Không thể tải danh sách sân bay:", err);
    }
  };

  const fetchAirlines = async () => {
    try {
      const hardcodedAirlines = [
        { _id: "6765cc6b46e6cc9c1c83b8ec", name: "VietJet Air", code: "VJ" },
      ];
      console.log("🏢 Loaded airlines:", hardcodedAirlines);
      setAirlines(hardcodedAirlines);
    } catch (err) {
      console.error("Không thể tải danh sách hãng bay:", err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const keys = name.split(".");
      setFormData((prev) => {
        const newData = { ...prev };
        let current = newData;
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        return newData;
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleOpenModal = (mode, aircraftData = null) => {
    setModalMode(mode);
    if (mode === "edit" && aircraftData) {
      setSelectedAircraft(aircraftData);

      console.log("🔍 Raw aircraft data from backend:", aircraftData);

      // Helper function to safely get ID from populated field
      const getIdFromField = (field) => {
        console.log("🔎 Getting ID from field:", field);
        if (!field) return "";
        if (typeof field === "string") return field;
        if (field._id) return field._id;
        if (field.id) return field.id;
        return "";
      };

      // Get current location airport ID
      const currentLocationId = aircraftData.operational?.currentLocation
        ?.airport
        ? getIdFromField(aircraftData.operational.currentLocation.airport)
        : "";

      // Get base airport ID
      const baseAirportId = getIdFromField(
        aircraftData.operational?.baseAirport
      );

      // Get airline ID
      const airlineId = getIdFromField(aircraftData.ownership?.airline);

      // Extract aircraft data - prioritize nested structure, fallback to flat
      const manufacturer =
        aircraftData.aircraft?.manufacturer || aircraftData.manufacturer || "";
      const model = aircraftData.aircraft?.model || aircraftData.model || "";
      const variant =
        aircraftData.aircraft?.variant || aircraftData.variant || "";
      const msn = aircraftData.aircraft?.msn || aircraftData.msn || "";
      const status =
        aircraftData.operational?.status || aircraftData.status || "active";

      console.log("✅ Extracted data for form:", {
        manufacturer,
        model,
        variant,
        msn,
        status,
        currentLocationId,
        baseAirportId,
        airlineId,
        airports: { current: currentLocationId, base: baseAirportId },
      });

      setFormData({
        registration: aircraftData.registration || "",
        manufacturer: manufacturer,
        model: model,
        variant: variant,
        msn: msn,
        status: status,
        currentLocation: currentLocationId,
        baseAirport: baseAirportId,
        airline: airlineId,
        configuration: aircraftData.configuration || {
          totalSeats: 0,
          layout: "3-3",
          classes: [],
        },
        specifications: aircraftData.specifications || {
          engines: "",
          engineCount: 2,
          maxSeats: 0,
          mtow: 0,
          range: 0,
          serviceSpeed: 0,
        },
      });
    } else {
      setFormData({
        registration: "",
        manufacturer: "",
        model: "",
        variant: "",
        msn: "",
        status: "active",
        currentLocation: "",
        baseAirport: "",
        airline: "",
        configuration: {
          totalSeats: 0,
          layout: "3-3",
          classes: [],
        },
        specifications: {
          engines: "",
          engineCount: 2,
          maxSeats: 0,
          mtow: 0,
          range: 0,
          serviceSpeed: 0,
        },
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedAircraft(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Transform flat formData to nested structure matching backend schema
      const aircraftData = {
        registration: formData.registration,
        manufacturer: formData.manufacturer, // Send flat for backward compatibility
        model: formData.model,
        variant: formData.variant,
        msn: formData.msn,
        status: formData.status,
        currentLocation: formData.currentLocation || undefined,
        baseAirport: formData.baseAirport || undefined,
        airline: formData.airline || undefined,
        configuration: formData.configuration,
        specifications: formData.specifications,
      };

      console.log("📤 Submitting aircraft data:", {
        mode: modalMode,
        formData,
        aircraftData,
      });

      if (modalMode === "create") {
        await aircraftService.createAircraft(aircraftData);
        setSuccess("Tạo máy bay thành công");
      } else {
        await aircraftService.updateAircraft(
          selectedAircraft._id,
          aircraftData
        );
        setSuccess("Cập nhật máy bay thành công");
      }
      handleCloseModal();
      fetchAircraft();
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa máy bay này?")) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await aircraftService.deleteAircraft(id);
      setSuccess("Xóa máy bay thành công");
      fetchAircraft();
    } catch (err) {
      setError(err.message || "Không thể xóa máy bay");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { label: "Hoạt động", className: "status-active" },
      maintenance: { label: "Bảo trì", className: "status-maintenance" },
      grounded: { label: "Ngừng bay", className: "status-grounded" },
      retired: { label: "Ngừng hoạt động", className: "status-retired" },
    };
    const statusInfo = statusMap[status] || { label: status, className: "" };
    return (
      <span className={`status-badge ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  // Helper function to safely render airport/object names
  const renderName = (name) => {
    if (!name) return "";
    if (typeof name === "object") {
      return name?.vi || name?.en || "";
    }
    return name;
  };

  const renderCode = (code) => {
    if (!code) return "";
    if (typeof code === "object") {
      return code?.iata || code?.icao || "";
    }
    return code;
  };

  return (
    <AdminLayout>
      <div className="page-header">
        <h1>
          <FaPlane /> Quản lý Máy bay
        </h1>
        <button
          className="btn btn-primary"
          onClick={() => handleOpenModal("create")}
        >
          <FaPlus /> Thêm máy bay
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Filters */}
      <div className="filters-section">
        <input
          type="text"
          name="search"
          placeholder="Tìm kiếm theo registration, hãng, model..."
          value={filters.search}
          onChange={handleFilterChange}
          className="filter-input"
        />
        <select
          name="manufacturer"
          value={filters.manufacturer}
          onChange={handleFilterChange}
          className="filter-select"
        >
          <option value="">Tất cả hãng sản xuất</option>
          <option value="Airbus">Airbus</option>
          <option value="Boeing">Boeing</option>
          <option value="ATR">ATR</option>
        </select>
        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          className="filter-select"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="maintenance">Bảo trì</option>
          <option value="grounded">Ngừng bay</option>
          <option value="retired">Ngừng hoạt động</option>
        </select>
      </div>

      {/* Aircraft List */}
      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : (
        <>
          <div className="aircraft-table">
            <table>
              <thead>
                <tr>
                  <th>Registration</th>
                  <th>Hãng sản xuất</th>
                  <th>Model</th>
                  <th>Số ghế</th>
                  <th>Trạng thái</th>
                  <th>Vị trí</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {aircraft.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  aircraft.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <strong>{item.registration}</strong>
                      </td>
                      <td>
                        {item.aircraft?.manufacturer ||
                          item.manufacturer ||
                          "N/A"}
                      </td>
                      <td>
                        {item.aircraft?.model || item.model || "N/A"}{" "}
                        {item.aircraft?.variant || item.variant || ""}
                      </td>
                      <td>{item.configuration?.totalSeats || 0}</td>
                      <td>
                        {getStatusBadge(item.operational?.status || "active")}
                      </td>
                      <td>
                        {item.operational?.currentLocation?.airport?.name?.vi ||
                          item.operational?.currentLocation?.airport?.name
                            ?.en ||
                          item.operational?.currentLocation?.airport?.code
                            ?.iata ||
                          item.operational?.baseAirport?.name?.vi ||
                          item.operational?.baseAirport?.code?.iata ||
                          "Chưa cập nhật"}
                      </td>
                      <td>
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenModal("edit", item)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Chỉnh sửa"
                          >
                            <FaEdit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Xóa máy bay"
                          >
                            <FaTrash size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                Trước
              </button>
              <span>
                Trang {currentPage} / {pagination.totalPages}
              </span>
              <button
                disabled={currentPage === pagination.totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {modalMode === "create"
                  ? "Thêm máy bay mới"
                  : "Cập nhật máy bay"}
              </h2>
              <button className="btn-close" onClick={handleCloseModal}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Registration *</label>
                  <input
                    type="text"
                    name="registration"
                    value={formData.registration}
                    onChange={handleInputChange}
                    required
                    placeholder="VN-A123"
                  />
                </div>

                <div className="form-group">
                  <label>Hãng sản xuất *</label>
                  <select
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Chọn hãng</option>
                    <option value="Airbus">Airbus</option>
                    <option value="Boeing">Boeing</option>
                    <option value="ATR">ATR</option>
                    <option value="Embraer">Embraer</option>
                    <option value="Bombardier">Bombardier</option>
                  </select>
                  {formData.manufacturer && (
                    <small style={{ color: "#666", fontSize: "11px" }}>
                      Đã chọn: {formData.manufacturer}
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label>Model *</label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    required
                    placeholder="A320"
                  />
                </div>

                <div className="form-group">
                  <label>Variant</label>
                  <input
                    type="text"
                    name="variant"
                    value={formData.variant}
                    onChange={handleInputChange}
                    placeholder="neo"
                  />
                </div>

                <div className="form-group">
                  <label>MSN (Serial Number) *</label>
                  <input
                    type="text"
                    name="msn"
                    value={formData.msn}
                    onChange={handleInputChange}
                    required
                    placeholder="12345"
                  />
                </div>

                <div className="form-group">
                  <label>Trạng thái</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="active">Hoạt động</option>
                    <option value="maintenance">Bảo trì</option>
                    <option value="grounded">Ngừng bay</option>
                    <option value="retired">Ngừng hoạt động</option>
                    <option value="stored">Lưu kho</option>
                  </select>
                  {formData.status && (
                    <small style={{ color: "#666", fontSize: "11px" }}>
                      Đã chọn: {formData.status}
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label>Sân bay hiện tại</label>
                  <select
                    name="currentLocation"
                    value={formData.currentLocation}
                    onChange={handleInputChange}
                    onFocus={() => {
                      console.log("🔍 Current Location Select Focus:", {
                        formValue: formData.currentLocation,
                        availableAirports: airports.map((a) => ({
                          id: a._id,
                          name: renderName(a.name),
                        })),
                        matched: airports.some(
                          (a) => a._id === formData.currentLocation
                        ),
                      });
                    }}
                  >
                    <option value="">-- Chọn sân bay --</option>
                    {airports.map((airport) => (
                      <option key={airport._id} value={airport._id}>
                        {renderName(airport.name)} ({renderCode(airport.code)})
                      </option>
                    ))}
                  </select>
                  {formData.currentLocation && (
                    <small style={{ color: "#666", fontSize: "11px" }}>
                      ID: {formData.currentLocation}
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label>Sân bay gốc</label>
                  <select
                    name="baseAirport"
                    value={formData.baseAirport}
                    onChange={handleInputChange}
                    onFocus={() => {
                      console.log("🔍 Base Airport Select Focus:", {
                        formValue: formData.baseAirport,
                        availableAirports: airports.map((a) => ({
                          id: a._id,
                          name: renderName(a.name),
                        })),
                        matched: airports.some(
                          (a) => a._id === formData.baseAirport
                        ),
                      });
                    }}
                  >
                    <option value="">-- Chọn sân bay --</option>
                    {airports.map((airport) => (
                      <option key={airport._id} value={airport._id}>
                        {renderName(airport.name)} ({renderCode(airport.code)})
                      </option>
                    ))}
                  </select>
                  {formData.baseAirport && (
                    <small style={{ color: "#666", fontSize: "11px" }}>
                      ID: {formData.baseAirport}
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label>Tổng số ghế</label>
                  <input
                    type="number"
                    name="configuration.totalSeats"
                    value={formData.configuration.totalSeats}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>Layout</label>
                  <input
                    type="text"
                    name="configuration.layout"
                    value={formData.configuration.layout}
                    onChange={handleInputChange}
                    placeholder="3-3"
                  />
                </div>

                <div className="form-group">
                  <label>Engines</label>
                  <input
                    type="text"
                    name="specifications.engines"
                    value={formData.specifications.engines}
                    onChange={handleInputChange}
                    placeholder="CFM56-5B4"
                  />
                </div>

                <div className="form-group">
                  <label>Số động cơ</label>
                  <input
                    type="number"
                    name="specifications.engineCount"
                    value={formData.specifications.engineCount}
                    onChange={handleInputChange}
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label>Max Seats</label>
                  <input
                    type="number"
                    name="specifications.maxSeats"
                    value={formData.specifications.maxSeats}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>Range (km)</label>
                  <input
                    type="number"
                    name="specifications.range"
                    value={formData.specifications.range}
                    onChange={handleInputChange}
                    min="0"
                  />
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
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  <FaCheck /> {modalMode === "create" ? "Tạo mới" : "Cập nhật"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AircraftManagement;
