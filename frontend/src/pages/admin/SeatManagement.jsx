import { DollarSign, Lock, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import adminService from '../../services/adminService';
import '../../styles/admin/SeatManagement.css';

function SeatManagement() {
  const [flights, setFlights] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [seatMap, setSeatMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [seatConfig, setSeatConfig] = useState({
    row: '',
    column: '',
    class: 'economy',
    type: 'middle',
    price: 0,
    features: [],
    status: 'available',
    isBlocked: false
  });

  useEffect(() => {
    loadFlights();
  }, []);

  const loadFlights = async () => {
    try {
      setLoading(true);
      const response = await adminService.getFlights({ limit: 100 });
      setFlights(response.data?.flights || []);
      setError(null);
    } catch (err) {
      setError('Không thể tải danh sách chuyến bay');
    } finally {
      setLoading(false);
    }
  };

  const loadSeatMap = async (flightId) => {
    try {
      setLoading(true);
      const response = await adminService.getSeatMap(flightId);
      console.log('Seat Map Response:', response);
      
      // Flatten seatMap array of rows to single array of seats
      const flattenedSeats = [];
      if (response.data?.seatMap && Array.isArray(response.data.seatMap)) {
        response.data.seatMap.forEach(row => {
          if (row.seats && Array.isArray(row.seats)) {
            row.seats.forEach(seat => {
              flattenedSeats.push({
                ...seat,
                row: row.row,
                // Ensure we have seatNumber for API calls
                seatNumber: seat.seatNumber,
                // Map status fields
                isOccupied: seat.status === 'occupied',
                isBlocked: seat.status === 'blocked',
                extraFee: seat.price || 0
              });
            });
          }
        });
      }
      
      setSeatMap({
        seats: flattenedSeats,
        flight: response.data?.flight,
        availableCount: response.data?.availableCount || 0,
        occupiedCount: response.data?.occupiedCount || 0
      });
      setError(null);
    } catch (err) {
      console.error('Load seat map error:', err);
      setError('Không thể tải sơ đồ ghế');
    } finally {
      setLoading(false);
    }
  };

  const handleFlightChange = (flightId) => {
    const flight = flights.find(f => f._id === flightId);
    setSelectedFlight(flight);
    if (flightId) {
      loadSeatMap(flightId);
    }
  };

  const handleSeatClick = (seat) => {
    console.log('Seat clicked:', seat);
    setSelectedSeat(seat);
    setSeatConfig({
      seatNumber: seat.seatNumber,
      class: seat.class || 'economy',
      type: seat.type || 'middle',
      price: seat.price || 0,
      extraFee: seat.extraFee || seat.price || 0,
      features: seat.features || [],
      status: seat.status || 'available',
      isBlocked: seat.status === 'blocked'
    });
    setShowConfigModal(true);
  };

  const handleSeatConfigSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!selectedSeat?.seatNumber) {
        alert('Không tìm thấy thông tin ghế');
        return;
      }
      
      console.log('Updating seat:', selectedSeat.seatNumber, seatConfig);
      
      await adminService.updateSeatConfig(selectedFlight._id, selectedSeat.seatNumber, {
        class: seatConfig.class,
        type: seatConfig.type,
        price: parseFloat(seatConfig.extraFee) || parseFloat(seatConfig.price) || 0,
        features: seatConfig.features,
        status: seatConfig.isBlocked ? 'blocked' : 'available'
      });
      
      alert('Cập nhật cấu hình ghế thành công!');
      await loadSeatMap(selectedFlight._id);
      setShowConfigModal(false);
    } catch (err) {
      console.error('Update seat error:', err);
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const toggleSeatBlock = async (seat) => {
    try {
      if (!seat?.seatNumber) {
        alert('Không tìm thấy thông tin ghế');
        return;
      }
      
      const isCurrentlyBlocked = seat.status === 'blocked' || seat.isBlocked;
      console.log('Toggle block for seat:', seat.seatNumber, 'Currently blocked:', isCurrentlyBlocked);
      
      await adminService.toggleSeatBlock(selectedFlight._id, seat.seatNumber, !isCurrentlyBlocked);
      await loadSeatMap(selectedFlight._id);
    } catch (err) {
      console.error('Toggle seat block error:', err);
      alert(err.response?.data?.message || 'Không thể cập nhật trạng thái ghế');
    }
  };

  const getSeatClassName = (seat) => {
    let className = 'seat';
    if (seat.isOccupied) className += ' occupied';
    else if (seat.isBlocked) className += ' blocked';
    else if (seat.class === 'business') className += ' business';
    else if (seat.extraFee > 0) className += ' premium';
    else className += ' available';
    return className;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const calculateSeatStats = () => {
    if (!seatMap || !seatMap.seats) return { total: 0, occupied: 0, available: 0, blocked: 0, revenue: 0 };
    
    const total = seatMap.seats.length;
    const occupied = seatMap.seats.filter(s => s.isOccupied).length;
    const blocked = seatMap.seats.filter(s => s.isBlocked).length;
    const available = total - occupied - blocked;
    const revenue = seatMap.seats
      .filter(s => s.isOccupied)
      .reduce((sum, s) => sum + (s.extraFee || 0), 0);

    return { total, occupied, available, blocked, revenue };
  };

  const stats = calculateSeatStats();

  if (loading && !selectedFlight) return <AdminLayout><div className="loading">Đang tải...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="seat-management">
        <div className="page-header">
          <div>
            <h1>Quản Lý Sơ Đồ Ghế</h1>
            <p className="subtitle">Cấu hình ghế ngồi và giá ghế</p>
          </div>
          <button className="btn btn-primary" onClick={() => selectedFlight && loadSeatMap(selectedFlight._id)}>
            <RefreshCw size={18} /> Làm mới
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Flight Selector */}
        <div className="flight-selector">
          <label>Chọn chuyến bay:</label>
          <select
            onChange={(e) => handleFlightChange(e.target.value)}
            value={selectedFlight?._id || ''}
          >
            <option value="">-- Chọn chuyến bay --</option>
            {flights.map(flight => (
              <option key={flight._id} value={flight._id}>
                {flight.flightNumber} - {flight.route?.departure?.airport?.code?.iata} → {flight.route?.arrival?.airport?.code?.iata} ({new Date(flight.route?.departure?.time).toLocaleDateString('vi-VN')})
              </option>
            ))}
          </select>
        </div>

        {selectedFlight && seatMap && (
          <>
            {/* Statistics */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon primary">
                  <DollarSign size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Tổng ghế</div>
                  <div className="stat-value">{stats.total}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon success">
                  <DollarSign size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Đã bán</div>
                  <div className="stat-value">{stats.occupied}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon info">
                  <DollarSign size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Còn trống</div>
                  <div className="stat-value">{stats.available}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon warning">
                  <Lock size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Bị khóa</div>
                  <div className="stat-value">{stats.blocked}</div>
                </div>
              </div>
              <div className="stat-card full-width">
                <div className="stat-icon success">
                  <DollarSign size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Doanh thu từ ghế</div>
                  <div className="stat-value">{formatCurrency(stats.revenue)}</div>
                </div>
              </div>
            </div>

            {/* Seat Map Legend */}
            <div className="seat-legend">
              <div className="legend-item">
                <span className="legend-color available"></span>
                <span>Trống</span>
              </div>
              <div className="legend-item">
                <span className="legend-color occupied"></span>
                <span>Đã bán</span>
              </div>
              <div className="legend-item">
                <span className="legend-color blocked"></span>
                <span>Bị khóa</span>
              </div>
              <div className="legend-item">
                <span className="legend-color business"></span>
                <span>Business</span>
              </div>
              <div className="legend-item">
                <span className="legend-color premium"></span>
                <span>Premium (+phí)</span>
              </div>
            </div>

            {/* Seat Map */}
            <div className="seat-map-container">
              <div className="airplane-body">
                <div className="cockpit">🛫 Khoang lái</div>
                
                {/* Business Class */}
                {seatMap?.seats?.some(s => s.class === 'business') && (
                  <div className="cabin-section">
                    <div className="section-label">BUSINESS CLASS</div>
                    <div className="seat-grid business-grid">
                      {seatMap.seats
                        .filter(s => s.class === 'business')
                        .sort((a, b) => {
                          // Sort by row first, then by seatNumber
                          if (a.row !== b.row) return a.row - b.row;
                          return a.seatNumber.localeCompare(b.seatNumber);
                        })
                        .map(seat => (
                          <div
                            key={seat.seatNumber}
                            className={getSeatClassName(seat)}
                            onClick={() => !seat.isOccupied && handleSeatClick(seat)}
                            title={`${seat.seatNumber} - ${seat.isOccupied ? 'Đã bán' : seat.isBlocked ? 'Bị khóa' : 'Trống'}`}
                          >
                            <div className="seat-number">{seat.seatNumber}</div>
                            {seat.extraFee > 0 && <div className="seat-fee">+{formatCurrency(seat.extraFee)}</div>}
                            {seat.isBlocked && (
                              <div className="seat-lock" onClick={(e) => {
                                e.stopPropagation();
                                toggleSeatBlock(seat);
                              }}>
                                <Lock size={12} />
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Economy Class */}
                <div className="cabin-section">
                  <div className="section-label">ECONOMY CLASS</div>
                  <div className="seat-grid economy-grid">
                    {seatMap.seats
                      .filter(s => s.class !== 'business')
                      .sort((a, b) => {
                        // Sort by row first, then by seatNumber
                        if (a.row !== b.row) return a.row - b.row;
                        return a.seatNumber.localeCompare(b.seatNumber);
                      })
                      .map(seat => (
                        <div
                          key={seat.seatNumber}
                          className={getSeatClassName(seat)}
                          onClick={() => !seat.isOccupied && handleSeatClick(seat)}
                          title={`${seat.seatNumber} - ${seat.isOccupied ? 'Đã bán' : seat.isBlocked ? 'Bị khóa' : 'Trống'}`}
                        >
                          <div className="seat-number">{seat.seatNumber}</div>
                          {seat.extraFee > 0 && <div className="seat-fee">+{formatCurrency(seat.extraFee)}</div>}
                          {seat.isBlocked && (
                            <div className="seat-lock" onClick={(e) => {
                              e.stopPropagation();
                              toggleSeatBlock(seat);
                            }}>
                              <Lock size={12} />
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>

                <div className="tail">🔚</div>
              </div>
            </div>
          </>
        )}

        {/* Seat Config Modal */}
        {showConfigModal && (
          <div className="modal-overlay" onClick={() => setShowConfigModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Cấu Hình Ghế {seatConfig.seatNumber || selectedSeat?.seatNumber}</h2>
                <button className="close-btn" onClick={() => setShowConfigModal(false)}>×</button>
              </div>
              <form onSubmit={handleSeatConfigSubmit}>
                <div className="form-group">
                  <label>Hạng ghế</label>
                  <select
                    value={seatConfig.class}
                    onChange={(e) => setSeatConfig({ ...seatConfig, class: e.target.value })}
                  >
                    <option value="economy">Economy</option>
                    <option value="premium_economy">Premium Economy</option>
                    <option value="business">Business</option>
                    <option value="first">First Class</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Loại ghế</label>
                  <select
                    value={seatConfig.type}
                    onChange={(e) => setSeatConfig({ ...seatConfig, type: e.target.value })}
                  >
                    <option value="window">Cửa sổ (Window)</option>
                    <option value="middle">Giữa (Middle)</option>
                    <option value="aisle">Hành lang (Aisle)</option>
                    <option value="exit_row">Cửa thoát hiểm (Exit Row)</option>
                    <option value="bulkhead">Bulkhead</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Phí thêm (VND)</label>
                  <input
                    type="number"
                    value={seatConfig.extraFee}
                    onChange={(e) => setSeatConfig({ ...seatConfig, extraFee: Number(e.target.value) })}
                    min="0"
                  />
                  <small>Phí cho ghế đặc biệt (exit row, extra legroom, etc.)</small>
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={seatConfig.isBlocked}
                      onChange={(e) => setSeatConfig({ ...seatConfig, isBlocked: e.target.checked })}
                    />
                    Khóa ghế (không cho phép đặt)
                  </label>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowConfigModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Lưu cấu hình
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

export default SeatManagement;
