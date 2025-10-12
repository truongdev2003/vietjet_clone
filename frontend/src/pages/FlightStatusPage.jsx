import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  Plane,
  Search,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import AirportAutocomplete from "../components/AirportAutocomplete";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { getFlightStatusLabel } from "../constants/flightStatus";
import flightService from "../services/flightService";
import "../styles/FlightStatus.css";

const FlightStatusPage = () => {
  const [searchType, setSearchType] = useState("flightNumber"); // 'flightNumber' or 'route'
  const [searchData, setSearchData] = useState({
    flightNumber: "",
    date: new Date().toISOString().split("T")[0],
    from: "",
    to: "",
  });
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSearched(true);

    try {
      let response;

      if (searchType === "flightNumber") {
        // Validate flight number
        if (!searchData.flightNumber || searchData.flightNumber.trim() === "") {
          setError("Vui lòng nhập số hiệu chuyến bay");
          setLoading(false);
          return;
        }

        // Search by flight number using flightService
        response = await flightService.getFlightStatusByNumber(
          searchData.flightNumber,
          searchData.date
        );
        setFlights(response.data?.flights || []);
      } else {
        // Validate route inputs
        if (!searchData.from || searchData.from.trim() === "") {
          setError("Vui lòng chọn điểm đi");
          setLoading(false);
          return;
        }
        if (!searchData.to || searchData.to.trim() === "") {
          setError("Vui lòng chọn điểm đến");
          setLoading(false);
          return;
        }
        if (searchData.from === searchData.to) {
          setError("Điểm đi và điểm đến không thể giống nhau");
          setLoading(false);
          return;
        }

        response = await flightService.getFlightStatusByRoute(
          searchData.from,
          searchData.to,
          searchData.date
        );
        setFlights(response.data?.outboundFlights || []);
      }
      console.log("Search response:", response);
    } catch (error) {
      console.error("Search error:", error);
      setError(error.response?.data?.message || "Có lỗi xảy ra khi tìm kiếm");
      setFlights([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      scheduled: {
        label: getFlightStatusLabel("scheduled"),
        icon: <Clock className="status-icon" />,
        color: "status-scheduled",
      },
      boarding: {
        label: getFlightStatusLabel("boarding"),
        icon: <Plane className="status-icon" />,
        color: "status-boarding",
      },
      departed: {
        label: getFlightStatusLabel("departed"),
        icon: <Plane className="status-icon rotating" />,
        color: "status-departed",
      },
      in_flight: {
        label: getFlightStatusLabel("in_flight"),
        icon: <Plane className="status-icon" />,
        color: "status-in-flight",
      },
      landed: {
        label: "Đã hạ cánh",
        icon: <CheckCircle className="status-icon" />,
        color: "status-landed",
      },
      arrived: {
        label: getFlightStatusLabel("arrived"),
        icon: <CheckCircle className="status-icon" />,
        color: "status-arrived",
      },
      delayed: {
        label: getFlightStatusLabel("delayed"),
        icon: <AlertCircle className="status-icon" />,
        color: "status-delayed",
      },
      cancelled: {
        label: getFlightStatusLabel("cancelled"),
        icon: <XCircle className="status-icon" />,
        color: "status-cancelled",
      },
    };

    return (
      statusMap[status] || {
        label: status,
        icon: <Clock className="status-icon" />,
        color: "status-unknown",
      }
    );
  };

  const formatTime = (dateString) => {
    if (!dateString) return "--:--";
    return new Date(dateString).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "--";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDuration = (duration) => {
    if (!duration) return "--";

    // Handle both object { scheduled: 135, actual: 135 } and number format
    const minutes =
      typeof duration === "object"
        ? duration.actual || duration.scheduled || 0
        : duration;

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="flight-status-page">
      <Header />

      <div className="flight-status-hero">
        <div className="hero-content">
          <div className="hero-icon">
            <Plane size={48} />
          </div>
          <h1>Tình Trạng Chuyến Bay</h1>
          <p>Tra cứu thông tin chuyến bay thời gian thực</p>
        </div>
      </div>

      <div className="flight-status-container">
        <div className="search-section">
          <div className="search-tabs">
            <button
              className={`tab-button ${
                searchType === "flightNumber" ? "active" : ""
              }`}
              onClick={() => setSearchType("flightNumber")}
            >
              <Plane size={20} />
              Tìm theo số hiệu
            </button>
            <button
              className={`tab-button ${searchType === "route" ? "active" : ""}`}
              onClick={() => setSearchType("route")}
            >
              <MapPin size={20} />
              Tìm theo tuyến bay
            </button>
          </div>

          <form onSubmit={handleSearch} className="search-form">
            {searchType === "flightNumber" ? (
              <div className="form-row">
                <div className="form-group flex-2">
                  <label>
                    <Plane size={18} />
                    Số hiệu chuyến bay
                  </label>
                  <input
                    type="text"
                    value={searchData.flightNumber}
                    onChange={(e) =>
                      setSearchData({
                        ...searchData,
                        flightNumber: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="VD: VJ123"
                    required
                    className="input-field"
                  />
                </div>
                <div className="form-group flex-1">
                  <label>
                    <Calendar size={18} />
                    Ngày bay
                  </label>
                  <input
                    type="date"
                    value={searchData.date}
                    onChange={(e) =>
                      setSearchData({ ...searchData, date: e.target.value })
                    }
                    required
                    className="input-field"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="form-row">
                  <div className="form-group flex-1">
                    <AirportAutocomplete
                      label="Từ"
                      value={searchData.from}
                      onChange={(value) =>
                        setSearchData({ ...searchData, from: value })
                      }
                      placeholder="Thành phố/Sân bay"
                    />
                  </div>
                  <div className="form-group flex-1">
                    <AirportAutocomplete
                      label="Đến"
                      value={searchData.to}
                      onChange={(value) =>
                        setSearchData({ ...searchData, to: value })
                      }
                      placeholder="Thành phố/Sân bay"
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label>
                      <Calendar size={18} />
                      Ngày bay
                    </label>
                    <input
                      type="date"
                      value={searchData.date}
                      onChange={(e) =>
                        setSearchData({ ...searchData, date: e.target.value })
                      }
                      required
                      className="input-field"
                    />
                  </div>
                </div>
              </>
            )}

            <button type="submit" className="btn-search" disabled={loading}>
              <Search size={20} />
              {loading ? "Đang tìm kiếm..." : "Tìm kiếm"}
            </button>
          </form>
        </div>

        {error && (
          <div className="error-alert">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {loading && (
          <div className="loading-section">
            <div className="loading-spinner"></div>
            <p>Đang tìm kiếm chuyến bay...</p>
          </div>
        )}

        {!loading && searched && flights.length === 0 && !error && (
          <div className="no-results">
            <XCircle size={48} />
            <h3>Không tìm thấy chuyến bay</h3>
            <p>Vui lòng kiểm tra lại thông tin tìm kiếm</p>
          </div>
        )}

        {!loading && flights.length > 0 && (
          <div className="results-section">
            <h2>Kết quả tìm kiếm ({flights.length} chuyến bay)</h2>

            <div className="flights-list">
              {flights.map((flight, index) => {
                const statusInfo = getStatusInfo(flight.status);

                return (
                  <div key={index} className="flight-card">
                    <div className="flight-card-header">
                      <div className="flight-number-badge">
                        <Plane size={20} />
                        {flight.flightNumber}
                      </div>
                      <div className={`flight-status ${statusInfo.color}`}>
                        {statusInfo.icon}
                        {statusInfo.label}
                      </div>
                    </div>

                    <div className="flight-card-body">
                      <div className="flight-route">
                        <div className="route-point departure">
                          <div className="airport-code">
                            {flight.route?.departure?.airport?.code?.iata}
                          </div>
                          <div className="airport-name">
                            {flight.route?.departure?.airport?.name?.vi}
                          </div>
                          <div className="flight-time">
                            <Clock size={16} />
                            {formatTime(flight.route?.departure?.time)}
                          </div>
                          <div className="flight-date">
                            {formatDate(flight.route?.departure?.time)}
                          </div>
                        </div>

                        <div className="route-divider">
                          <div className="plane-icon-container">
                            <Plane className="plane-icon" size={24} />
                          </div>
                          <div className="flight-duration">
                            {formatDuration(flight.route?.duration)}
                          </div>
                        </div>

                        <div className="route-point arrival">
                          <div className="airport-code">
                            {flight.route?.arrival?.airport?.code?.iata}
                          </div>
                          <div className="airport-name">
                            {flight.route?.arrival?.airport?.name?.vi}
                          </div>
                          <div className="flight-time">
                            <Clock size={16} />
                            {formatTime(flight.route?.arrival?.time)}
                          </div>
                          <div className="flight-date">
                            {formatDate(flight.route?.arrival?.time)}
                          </div>
                        </div>
                      </div>

                      <div className="flight-details-grid">
                        <div className="detail-item">
                          <MapPin size={18} />
                          <div>
                            <div className="detail-label">Cổng khởi hành</div>
                            <div className="detail-value">
                              {flight.route?.departure?.gate || "Chưa công bố"}
                            </div>
                          </div>
                        </div>

                        <div className="detail-item">
                          <MapPin size={18} />
                          <div>
                            <div className="detail-label">Cổng đến</div>
                            <div className="detail-value">
                              {flight.route?.arrival?.gate || "Chưa công bố"}
                            </div>
                          </div>
                        </div>

                        <div className="detail-item">
                          <Plane size={18} />
                          <div>
                            <div className="detail-label">Loại máy bay</div>
                            <div className="detail-value">
                              {flight.aircraft?.type || "N/A"}
                            </div>
                          </div>
                        </div>

                        <div className="detail-item">
                          <CheckCircle size={18} />
                          <div>
                            <div className="detail-label">Số ghế trống</div>
                            <div className="detail-value">
                              {flight.inventory?.available ||
                                flight.totalAvailable ||
                                0}
                            </div>
                          </div>
                        </div>
                      </div>

                      {flight.status === "delayed" && (
                        <div className="delay-notice">
                          <AlertCircle size={20} />
                          <div>
                            <strong>Chuyến bay bị trễ</strong>
                            <p>Vui lòng theo dõi thông tin cập nhật từ hãng</p>
                          </div>
                        </div>
                      )}

                      {flight.status === "cancelled" && (
                        <div className="cancel-notice">
                          <XCircle size={20} />
                          <div>
                            <strong>Chuyến bay đã bị hủy</strong>
                            <p>Vui lòng liên hệ với hãng để được hỗ trợ</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flight-status-info">
          <h3>Thông tin hữu ích</h3>
          <div className="info-grid">
            <div className="info-card">
              <Clock size={24} />
              <h4>Check-in trực tuyến</h4>
              <p>Mở từ 24 giờ đến 1 giờ trước giờ khởi hành</p>
            </div>
            <div className="info-card">
              <MapPin size={24} />
              <h4>Đến sân bay</h4>
              <p>
                Có mặt ít nhất 2 giờ trước giờ bay quốc tế, 1 giờ cho nội địa
              </p>
            </div>
            <div className="info-card">
              <Plane size={24} />
              <h4>Cổng lên máy bay</h4>
              <p>Đóng cửa 15 phút trước giờ khởi hành</p>
            </div>
            <div className="info-card">
              <AlertCircle size={24} />
              <h4>Thông báo quan trọng</h4>
              <p>
                Theo dõi màn hình thông báo tại sân bay để cập nhật thông tin
                mới nhất
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default FlightStatusPage;
