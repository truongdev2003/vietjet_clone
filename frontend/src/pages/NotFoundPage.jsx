import { Home, PlaneTakeoff, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import Header from '../components/Header';
import '../styles/NotFound.css';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <div className="notfound-page">
      <div className="notfound-container">
        <div className="notfound-content">
          {/* Animated Plane Icon */}
          <div className="notfound-icon">
            <PlaneTakeoff size={120} strokeWidth={1.5} />
            <div className="icon-circle circle-1"></div>
            <div className="icon-circle circle-2"></div>
            <div className="icon-circle circle-3"></div>
          </div>

          {/* 404 Text */}
          <h1 className="notfound-title">404</h1>
          <h2 className="notfound-subtitle">Oops! Trang không tồn tại</h2>
          <p className="notfound-description">
            Chúng tôi không thể tìm thấy trang bạn đang tìm kiếm. 
            Có thể trang này đã được di chuyển hoặc không còn tồn tại.
          </p>

          {/* Action Buttons */}
          <div className="notfound-actions">
            <button 
              className="btn-primary"
              onClick={() => navigate('/')}
            >
              <Home size={20} />
              Về trang chủ
            </button>
            <button 
              className="btn-secondary"
              onClick={() => navigate('/search')}
            >
              <Search size={20} />
              Tìm chuyến bay
            </button>
          </div>

          {/* Quick Links */}
          <div className="quick-links">
            <p className="quick-links-title">Hoặc truy cập:</p>
            <div className="links-grid">
              <button onClick={() => navigate('/my-bookings')} className="quick-link">
                Booking của tôi
              </button>
              <button onClick={() => navigate('/checkin')} className="quick-link">
                Check-in
              </button>
              <button onClick={() => navigate('/flight-status')} className="quick-link">
                Tình trạng bay
              </button>
              <button onClick={() => navigate('/contact')} className="quick-link">
                Liên hệ
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </>
  );
};

export default NotFoundPage;
