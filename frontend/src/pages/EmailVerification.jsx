import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/EmailVerification.css';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token xác thực không hợp lệ');
      return;
    }

    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      setLoading(true);
      const response = await authService.verifyEmail(token);
      
      if (response.success) {
        setStatus('success');
        setMessage('Email đã được xác thực thành công!');
        
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Email đã được xác thực. Bạn có thể đăng nhập ngay bây giờ.' 
            }
          });
        }, 3000);
      }
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'Có lỗi xảy ra khi xác thực email');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setLoading(true);
      setMessage('Đã gửi email xác thực mới. Vui lòng kiểm tra hộp thư của bạn.');
      // Redirect to register page for resending
      setTimeout(() => {
        navigate('/register', {
          state: { message: 'Vui lòng nhập email để gửi lại email xác thực.' }
        });
      }, 2000);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="email-verification-container">
      <div className="email-verification-card">
        <div className="verification-icon">
          {status === 'verifying' && (
            <div className="spinner"></div>
          )}
          {status === 'success' && (
            <svg className="success-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          )}
          {status === 'error' && (
            <svg className="error-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>

        <div className="verification-content">
          <h1 className="verification-title">
            {status === 'verifying' && 'Đang xác thực email...'}
            {status === 'success' && 'Xác thực thành công!'}
            {status === 'error' && 'Xác thực thất bại'}
          </h1>

          <p className="verification-message">
            {message}
          </p>

          {status === 'success' && (
            <div className="success-actions">
              <p className="redirect-message">
                Bạn sẽ được chuyển hướng đến trang đăng nhập trong giây lát...
              </p>
              <Link to="/login" className="btn btn-primary">
                Đăng nhập ngay
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="error-actions">
              <button 
                className="btn btn-secondary"
                onClick={handleResendVerification}
                disabled={loading}
              >
                {loading ? 'Đang xử lý...' : 'Gửi lại email xác thực'}
              </button>
              <Link to="/register" className="btn btn-outline">
                Đăng ký lại
              </Link>
            </div>
          )}

          <div className="help-links">
            <Link to="/contact" className="help-link">
              Cần hỗ trợ?
            </Link>
            <Link to="/" className="help-link">
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;