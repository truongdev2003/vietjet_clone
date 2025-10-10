import { Download, Home, Plane, QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Footer from '../components/Footer';
import Header from '../components/Header';
import bookingService from '../services/bookingService';
import '../styles/BoardingPass.css';

const BoardingPass = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const qrCanvasRef = useRef(null);
  const barcodeCanvasRef = useRef(null);
  
  const [boarding, setBoarding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBoardingPass = async () => {
      try {
        const bookingCode = searchParams.get('booking');
        const bookingId = searchParams.get('id');

        if (!bookingCode && !bookingId) {
          setError('Không tìm thấy thông tin booking');
          setLoading(false);
          return;
        }

        // Fetch booking details
        const booking = bookingId 
          ? await bookingService.getBookingById(bookingId)
          : await bookingService.getBookingByCode(bookingCode);

        setBoarding(booking);

        // Generate QR Code
        if (qrCanvasRef.current) {
          const qrData = JSON.stringify({
            bookingCode: booking.bookingCode || booking._id,
            passenger: booking.passengers?.[0],
            flight: booking.flight?.flightNumber,
          });
          await QRCode.toCanvas(qrCanvasRef.current, qrData, {
            width: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF',
            },
          });
        }

        // Generate Barcode (simple implementation)
        if (barcodeCanvasRef.current) {
          const canvas = barcodeCanvasRef.current;
          const ctx = canvas.getContext('2d');
          const code = booking.bookingCode || booking._id?.slice(-8).toUpperCase();
          
          // Simple barcode visualization
          ctx.fillStyle = '#000000';
          const barWidth = 3;
          const gap = 2;
          let x = 0;
          
          for (let i = 0; i < code.length; i++) {
            const charCode = code.charCodeAt(i);
            const bars = charCode % 4 + 2; // 2-5 bars per character
            
            for (let j = 0; j < bars; j++) {
              ctx.fillRect(x, 0, barWidth, canvas.height);
              x += barWidth + gap;
            }
            x += gap * 2; // Space between characters
          }
        }

      } catch (err) {
        console.error('Error fetching boarding pass:', err);
        setError(err.message || 'Không thể tải thông tin thẻ lên máy bay');
      } finally {
        setLoading(false);
      }
    };

    fetchBoardingPass();
  }, [searchParams]);

  const handleDownload = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Đang tải thẻ lên máy bay...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !boarding) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Không tìm thấy thông tin
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/my-bookings')}
              className="btn-primary"
            >
              Quay lại booking của tôi
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const passenger = boarding.passengers?.[0] || {};
  const flight = boarding.flight || {};

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        {/* Action Buttons */}
        <div className="no-print mb-6 flex gap-4 justify-center">
          <button onClick={handleDownload} className="btn-download">
            <Download size={20} />
            Tải xuống / In thẻ
          </button>
          <button onClick={() => navigate('/my-bookings')} className="btn-secondary">
            <Home size={20} />
            Quay lại
          </button>
        </div>

        {/* Boarding Pass Card */}
        <div className="boarding-pass-container">
          <div className="boarding-pass">
            {/* Header */}
            <div className="bp-header">
              <div className="airline-logo">
                <Plane size={40} />
                <span className="airline-name">VietJet Air</span>
              </div>
              <div className="bp-title">BOARDING PASS</div>
            </div>

            {/* Main Content */}
            <div className="bp-body">
              {/* Passenger & Flight Info */}
              <div className="bp-main-info">
                <div className="bp-row">
                  <div className="bp-field bp-field-large">
                    <div className="bp-label">Passenger Name / Họ và tên</div>
                    <div className="bp-value bp-value-large">
                      {passenger.title} {passenger.firstName} {passenger.lastName}
                    </div>
                  </div>
                </div>

                <div className="bp-row bp-route">
                  <div className="bp-field">
                    <div className="bp-label">From / Từ</div>
                    <div className="bp-value bp-airport-code">
                      {flight.departure?.airport?.code?.iata || 
                       flight.departure?.airport?.code || 'N/A'}
                    </div>
                    <div className="bp-city">
                      {flight.departure?.airport?.city || ''}
                    </div>
                  </div>

                  <div className="bp-arrow">
                    <Plane size={32} />
                  </div>

                  <div className="bp-field">
                    <div className="bp-label">To / Đến</div>
                    <div className="bp-value bp-airport-code">
                      {flight.arrival?.airport?.code?.iata || 
                       flight.arrival?.airport?.code || 'N/A'}
                    </div>
                    <div className="bp-city">
                      {flight.arrival?.airport?.city || ''}
                    </div>
                  </div>
                </div>

                <div className="bp-row bp-details-grid">
                  <div className="bp-field">
                    <div className="bp-label">Flight / Chuyến bay</div>
                    <div className="bp-value">{flight.flightNumber || 'N/A'}</div>
                  </div>

                  <div className="bp-field">
                    <div className="bp-label">Date / Ngày</div>
                    <div className="bp-value">{formatDate(flight.departureTime)}</div>
                  </div>

                  <div className="bp-field">
                    <div className="bp-label">Time / Giờ</div>
                    <div className="bp-value">{formatTime(flight.departureTime)}</div>
                  </div>

                  <div className="bp-field">
                    <div className="bp-label">Gate / Cổng</div>
                    <div className="bp-value bp-highlight">
                      {flight.gate || 'TBA'}
                    </div>
                  </div>

                  <div className="bp-field">
                    <div className="bp-label">Seat / Ghế</div>
                    <div className="bp-value bp-highlight">
                      {passenger.seatNumber || 'N/A'}
                    </div>
                  </div>

                  <div className="bp-field">
                    <div className="bp-label">Class / Hạng</div>
                    <div className="bp-value">
                      {passenger.class === 'economy' ? 'Economy' : 'Business'}
                    </div>
                  </div>
                </div>

                <div className="bp-row">
                  <div className="bp-field">
                    <div className="bp-label">Booking Reference / Mã đặt chỗ</div>
                    <div className="bp-value bp-booking-code">
                      {boarding.bookingCode || boarding._id?.slice(-8).toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code & Barcode Section */}
              <div className="bp-codes">
                <div className="qr-section">
                  <canvas ref={qrCanvasRef} className="qr-code"></canvas>
                  <div className="qr-label">
                    <QrCode size={16} />
                    Scan QR Code
                  </div>
                </div>
                
                <div className="barcode-section">
                  <canvas 
                    ref={barcodeCanvasRef} 
                    width="300" 
                    height="80"
                    className="barcode"
                  ></canvas>
                  <div className="barcode-number">
                    {boarding.bookingCode || boarding._id?.slice(-8).toUpperCase()}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bp-footer">
              <div className="bp-footer-info">
                <div className="bp-footer-item">
                  <strong>Boarding Time:</strong> {formatTime(flight.boardingTime || flight.departureTime)}
                </div>
                <div className="bp-footer-item">
                  <strong>Sequence:</strong> {passenger.sequenceNumber || '001'}
                </div>
              </div>
              <div className="bp-footer-note">
                Please be at the gate 30 minutes before departure time
              </div>
            </div>
          </div>

          {/* Important Instructions */}
          <div className="no-print bp-instructions">
            <h3 className="instructions-title">📋 Hướng dẫn sử dụng thẻ lên máy bay</h3>
            <ul className="instructions-list">
              <li>✅ Xuất trình thẻ lên máy bay (in hoặc điện tử) tại quầy an ninh và cổng lên máy bay</li>
              <li>✅ Mang theo giấy tờ tùy thân hợp lệ (CMND/CCCD/Hộ chiếu)</li>
              <li>✅ Có mặt tại cổng lên máy bay trước giờ đóng cửa ít nhất 30 phút</li>
              <li>✅ Kiểm tra kỹ thông tin trên thẻ (tên, số ghế, giờ bay)</li>
              <li>✅ Lưu thẻ trên điện thoại hoặc in ra giấy để thuận tiện</li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BoardingPass;
