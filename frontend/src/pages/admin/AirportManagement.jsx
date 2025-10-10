import { Edit, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import airportService from "../../services/airportService";
import "../../styles/admin/AirportManagement.css";

function AirportManagement() {
  const [airports, setAirports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAirport, setEditingAirport] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCountry, setFilterCountry] = useState("");

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    city: "",
    country: "",
    timezone: "",
    latitude: "",
    longitude: "",
    terminals: 1,
    runways: 1,
    status: "active",
  });

  useEffect(() => {
    loadAirports();
  }, []);

  const loadAirports = async () => {
    try {
      setLoading(true);
      const response = await airportService.getAllAirports({ limit: 100 });
      setAirports(response?.data?.airports || []);
      setError(null);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách sân bay");
      console.error("Error loading airports:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Chuyển đổi formData sang format backend cần
      const airportData = {
        code: {
          iata: formData.code.toUpperCase(),
          icao: formData.code.toUpperCase() + (formData.code.length === 3 ? 'X' : '') // Tạm thời, nên có input riêng
        },
        name: {
          vi: formData.name,
          en: formData.name
        },
        location: {
          city: {
            vi: formData.city,
            en: formData.city
          },
          country: {
            vi: formData.country,
            en: formData.country,
            code: 'VN' // Tạm thời, nên có input riêng
          },
          coordinates: {
            type: 'Point',
            coordinates: [
              parseFloat(formData.longitude) || 0,
              parseFloat(formData.latitude) || 0
            ]
          }
        },
        operational: {
          timezone: formData.timezone || 'Asia/Ho_Chi_Minh',
          runways: Array.from({ length: parseInt(formData.runways) || 1 }, (_, i) => ({
            name: `Runway ${i + 1}`,
            length: 3000,
            width: 45,
            surface: 'Asphalt',
            heading: `${String(i * 18).padStart(2, '0')}/${String(18 + i * 18).padStart(2, '0')}`
          }))
        },
        infrastructure: {
          terminals: Array.from({ length: parseInt(formData.terminals) || 1 }, (_, i) => ({
            name: `Terminal ${i + 1}`,
            code: `T${i + 1}`,
            gates: []
          }))
        },
        status: {
          isActive: formData.status === 'active',
          isOperational: formData.status === 'active'
        }
      };

      if (editingAirport) {
        await airportService.updateAirport(editingAirport._id, airportData);
      } else {
        await airportService.createAirport(airportData);
      }
      loadAirports();
      handleCloseModal();
    } catch (err) {
      alert(err.message || "Có lỗi xảy ra");
    }
  };

  const handleEdit = (airport) => {
    setEditingAirport(airport);
    setFormData({
      code: airport.code?.iata || airport.code || "",
      name: airport.name?.vi || airport.name?.en || airport.name || "",
      city:
        airport.location?.city?.vi ||
        airport.location?.city?.en ||
        airport.city ||
        "",
      country:
        airport.location?.country?.vi ||
        airport.location?.country?.en ||
        airport.country ||
        "",
      timezone: airport.operational?.timezone || airport.timezone || "",
      latitude: airport.location?.coordinates?.coordinates?.[1] || "",
      longitude: airport.location?.coordinates?.coordinates?.[0] || "",
      terminals: airport.infrastructure?.terminals?.length || 1,
      runways: airport.operational?.runways?.length || 1,
      status: airport.status?.isActive ? "active" : "inactive",
    });
    setShowModal(true);
  };

  const handleDelete = async (airportId) => {
    if (window.confirm("Bạn có chắc muốn xóa sân bay này?")) {
      try {
        await airportService.deleteAirport(airportId);
        loadAirports();
      } catch (err) {
        alert(err.message || "Không thể xóa sân bay");
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAirport(null);
    setFormData({
      code: "",
      name: "",
      city: "",
      country: "",
      timezone: "",
      latitude: "",
      longitude: "",
      terminals: 1,
      runways: 1,
      status: "active",
    });
  };

  const filteredAirports = airports.filter((airport) => {
    const airportName =
      airport.name?.vi || airport.name?.en || airport.name || "";
    const airportCode = airport.code?.iata || airport.code || "";
    const airportCity =
      airport.location?.city?.vi ||
      airport.location?.city?.en ||
      airport.city ||
      "";
    const airportCountry =
      airport.location?.country?.vi ||
      airport.location?.country?.en ||
      airport.country ||
      "";

    const matchesSearch =
      airportName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      airportCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      airportCity.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCountry = !filterCountry || airportCountry === filterCountry;
    return matchesSearch && matchesCountry;
  });

  const countries = [
    ...new Set(
      airports.map(
        (a) =>
          a.location?.country?.vi ||
          a.location?.country?.en ||
          a.country ||
          "Unknown"
      )
    ),
  ];

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

  if (loading)
    return (
      <AdminLayout>
        <div className="loading">Đang tải...</div>
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <div className="page-header">
        <h1>Quản Lý Sân Bay</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Thêm Sân Bay Mới
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="filters">
        <input
          type="text"
          placeholder="Tìm kiếm sân bay..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={filterCountry}
          onChange={(e) => setFilterCountry(e.target.value)}
          className="filter-select"
        >
          <option value="">Tất cả quốc gia</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </div>

      <div className="airports-table">
        <table>
          <thead>
            <tr>
              <th>Mã</th>
              <th>Tên Sân Bay</th>
              <th>Thành Phố</th>
              <th>Quốc Gia</th>
              <th>Nhà Ga</th>
              <th>Đường Băng</th>
              <th>Trạng Thái</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredAirports.map((airport) => (
              <tr key={airport._id}>
                <td>
                  <strong>{renderCode(airport.code)}</strong>
                </td>
                <td>{renderName(airport.name)}</td>
                <td>
                  {renderName(airport.location?.city) || airport.city || ''}
                </td>
                <td>
                  {airport.location?.country?.vi ||
                    airport.location?.country?.en ||
                    airport.country}
                </td>
                <td>{airport.infrastructure?.terminals?.length || 0}</td>
                <td>{airport.operational?.runways?.length || 0}</td>
                <td>
                  <span className={`status-badge status-${airport.status?.isActive ? 'active' : 'inactive'}`}>
                    {airport.status?.isActive ? "Hoạt động" : "Ngừng"}
                  </span>
                </td>
                <td>
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => handleEdit(airport)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Chỉnh sửa"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(airport._id)}
                      className="text-red-600 hover:text-red-900"
                      title="Xóa sân bay"
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

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {editingAirport ? "Chỉnh Sửa Sân Bay" : "Thêm Sân Bay Mới"}
              </h2>
              <button className="close-btn" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Mã Sân Bay *</label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    required
                    maxLength={3}
                    placeholder="VD: SGN"
                  />
                </div>
                <div className="form-group">
                  <label>Tên Sân Bay *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Thành Phố *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Quốc Gia *</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Múi Giờ</label>
                  <input
                    type="text"
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleInputChange}
                    placeholder="VD: Asia/Ho_Chi_Minh"
                  />
                </div>
                <div className="form-group">
                  <label>Vĩ Độ</label>
                  <input
                    type="number"
                    step="0.000001"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Kinh Độ</label>
                  <input
                    type="number"
                    step="0.000001"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Số Nhà Ga</label>
                  <input
                    type="number"
                    min="1"
                    name="terminals"
                    value={formData.terminals}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Số Đường Băng</label>
                  <input
                    type="number"
                    min="1"
                    name="runways"
                    value={formData.runways}
                    onChange={handleInputChange}
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
                    <option value="inactive">Ngừng hoạt động</option>
                  </select>
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
                  {editingAirport ? "Cập Nhật" : "Thêm Mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AirportManagement;
