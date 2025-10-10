import { Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Footer from '../components/Footer';
import Header from '../components/Header';
import seatService from '../services/seatService';
import '../styles/SeatSelection.css';

const SeatSelection = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flightId, setFlightId] = useState('');
  const [passengerCount, setPassengerCount] = useState(1);

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const flightIdParam = searchParams.get('flight');
        const passengers = parseInt(searchParams.get('passengers') || '1');
        
        if (!flightIdParam) {
          setError('Không tìm thấy thông tin chuyến bay');
          setLoading(false);
          return;
        }

        setFlightId(flightIdParam);
        setPassengerCount(passengers);

        // Fetch seat map from API
        const seatData = await seatService.getSeatsByFlight(flightIdParam);
        setSeats(seatData || generateDemoSeats());
        
      } catch (err) {
        console.error('Error fetching seats:', err);
        // Use demo data on error
        setSeats(generateDemoSeats());
      } finally {
        setLoading(false);
      }
    };

    fetchSeats();
  }, [searchParams]);

  // Generate demo seat layout for demonstration
  const generateDemoSeats = () => {
    const seatMap = [];
    const rows = 30;
    const columns = ['A', 'B', 'C', 'D', 'E', 'F'];
    
    for (let row = 1; row <= rows; row++) {
      for (let col of columns) {
        const seatNumber = `${row}${col}`;
        const isExit = row === 10 || row === 20;
        const isPremium = row <= 3;
        const isOccupied = Math.random() > 0.7;
        
        seatMap.push({
          seatNumber,
          row,
          column: col,
          class: isPremium ? 'business' : 'economy',
          status: isOccupied ? 'occupied' : 'available',
          isExit,
          price: isPremium ? 500000 : isExit ? 200000 : 100000,
        });
      }
    }
    
    return seatMap;
  };

  const handleSeatClick = (seat) => {
    if (seat.status === 'occupied') return;

    const isSelected = selectedSeats.some(s => s.seatNumber === seat.seatNumber);

    if (isSelected) {
      setSelectedSeats(selectedSeats.filter(s => s.seatNumber !== seat.seatNumber));
    } else {
      if (selectedSeats.length >= passengerCount) {
        alert(`Bạn chỉ có thể chọn tối đa ${passengerCount} ghế`);
        return;
      }
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const handleContinue = () => {
    if (selectedSeats.length < passengerCount) {
      alert(`Vui lòng chọn đủ ${passengerCount} ghế`);
      return;
    }

    // Navigate to booking page with selected seats
    const seatNumbers = selectedSeats.map(s => s.seatNumber).join(',');
    navigate(`/booking?flight=${flightId}&seats=${seatNumbers}`);
  };

  const handleSkip = () => {
    navigate(`/booking?flight=${flightId}`);
  };

  const getTotalPrice = () => {
    return selectedSeats.reduce((total, seat) => total + seat.price, 0);
  };

  const getSeatClass = (seat) => {
    const isSelected = selectedSeats.some(s => s.seatNumber === seat.seatNumber);
    
    if (isSelected) return 'seat selected';
    if (seat.status === 'occupied') return 'seat occupied';
    if (seat.class === 'business') return 'seat premium';
    if (seat.isExit) return 'seat exit';
    return 'seat available';
  };

  const groupSeatsByRow = () => {
    const grouped = {};
    seats.forEach(seat => {
      if (!grouped[seat.row]) {
        grouped[seat.row] = [];
      }
      grouped[seat.row].push(seat);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Đang tải sơ đồ ghế...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Có lỗi xảy ra</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button onClick={() => navigate(-1)} className="btn-primary">
              Quay lại
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const seatsByRow = groupSeatsByRow();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Chọn chỗ ngồi của bạn
          </h1>
          <p className="text-gray-600 text-lg">
            Chọn {passengerCount} ghế cho chuyến bay của bạn
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Đã chọn: {selectedSeats.length}/{passengerCount}
          </p>
        </div>

        <div className="seat-selection-container">
          {/* Seat Map */}
          <div className="seat-map-section">
            {/* Legend */}
            <div className="seat-legend">
              <div className="legend-item">
                <div className="seat available"></div>
                <span>Trống</span>
              </div>
              <div className="legend-item">
                <div className="seat selected"></div>
                <span>Đã chọn</span>
              </div>
              <div className="legend-item">
                <div className="seat occupied"></div>
                <span>Đã đặt</span>
              </div>
              <div className="legend-item">
                <div className="seat premium"></div>
                <span>Thương gia</span>
              </div>
              <div className="legend-item">
                <div className="seat exit"></div>
                <span>Cửa thoát hiểm</span>
              </div>
            </div>

            {/* Airplane Nose */}
            <div className="airplane-nose">
              <div className="nose-shape">✈️</div>
              <div className="cockpit-label">Buồng lái</div>
            </div>

            {/* Seat Grid */}
            <div className="seat-grid">
              {/* Column Headers */}
              <div className="seat-row header-row">
                <div className="row-number"></div>
                <div className="seat-group">
                  <div className="seat-header">A</div>
                  <div className="seat-header">B</div>
                  <div className="seat-header">C</div>
                </div>
                <div className="aisle"></div>
                <div className="seat-group">
                  <div className="seat-header">D</div>
                  <div className="seat-header">E</div>
                  <div className="seat-header">F</div>
                </div>
              </div>

              {/* Seat Rows */}
              {Object.entries(seatsByRow).map(([rowNum, rowSeats]) => {
                const leftSeats = rowSeats.filter(s => ['A', 'B', 'C'].includes(s.column));
                const rightSeats = rowSeats.filter(s => ['D', 'E', 'F'].includes(s.column));

                return (
                  <div key={rowNum} className="seat-row">
                    <div className="row-number">{rowNum}</div>
                    
                    <div className="seat-group">
                      {leftSeats.map(seat => (
                        <button
                          key={seat.seatNumber}
                          className={getSeatClass(seat)}
                          onClick={() => handleSeatClick(seat)}
                          disabled={seat.status === 'occupied'}
                          title={`${seat.seatNumber} - ${seat.price.toLocaleString('vi-VN')} VNĐ`}
                        >
                          <span className="seat-number">{seat.column}</span>
                        </button>
                      ))}
                    </div>

                    <div className="aisle"></div>

                    <div className="seat-group">
                      {rightSeats.map(seat => (
                        <button
                          key={seat.seatNumber}
                          className={getSeatClass(seat)}
                          onClick={() => handleSeatClick(seat)}
                          disabled={seat.status === 'occupied'}
                          title={`${seat.seatNumber} - ${seat.price.toLocaleString('vi-VN')} VNĐ`}
                        >
                          <span className="seat-number">{seat.column}</span>
                        </button>
                      ))}
                    </div>
                    
                    <div className="row-number">{rowNum}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary Panel */}
          <div className="summary-panel">
            <div className="summary-card">
              <h3 className="summary-title">Ghế đã chọn</h3>
              
              {selectedSeats.length === 0 ? (
                <div className="empty-state">
                  <p className="text-gray-500 text-center">
                    Chưa chọn ghế nào
                  </p>
                </div>
              ) : (
                <div className="selected-seats-list">
                  {selectedSeats.map((seat, index) => (
                    <div key={seat.seatNumber} className="selected-seat-item">
                      <div className="seat-info">
                        <span className="seat-badge">{seat.seatNumber}</span>
                        <span className="seat-type">
                          {seat.class === 'business' ? 'Thương gia' : 
                           seat.isExit ? 'Cửa thoát hiểm' : 'Phổ thông'}
                        </span>
                      </div>
                      <div className="seat-price-remove">
                        <span className="seat-price">
                          {seat.price.toLocaleString('vi-VN')} VNĐ
                        </span>
                        <button
                          onClick={() => handleSeatClick(seat)}
                          className="remove-seat"
                          title="Bỏ chọn"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedSeats.length > 0 && (
                <div className="summary-total">
                  <span className="total-label">Tổng cộng:</span>
                  <span className="total-price">
                    {getTotalPrice().toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
              )}

              <div className="summary-actions">
                <button
                  onClick={handleContinue}
                  className="btn-continue"
                  disabled={selectedSeats.length < passengerCount}
                >
                  <Check size={20} />
                  Tiếp tục
                  {selectedSeats.length < passengerCount && 
                    ` (${passengerCount - selectedSeats.length} ghế)`
                  }
                </button>
                <button onClick={handleSkip} className="btn-skip">
                  Bỏ qua chọn ghế
                </button>
              </div>

              {/* Info */}
              <div className="seat-info-box">
                <h4 className="info-title">💡 Lưu ý</h4>
                <ul className="info-list">
                  <li>Ghế thương gia có không gian rộng rãi hơn</li>
                  <li>Ghế cửa thoát hiểm có khoảng để chân lớn</li>
                  <li>Bạn có thể thay đổi ghế sau khi đặt vé</li>
                  <li>Giá ghế đã bao gồm trong tổng giá vé</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SeatSelection;
