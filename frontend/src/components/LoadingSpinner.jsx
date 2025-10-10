import '../styles/LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', message = 'Đang tải...' }) => {
  return (
    <div className={`loading-spinner-container ${size}`}>
      <div className="spinner">
        <div className="spinner-circle"></div>
        <div className="spinner-plane"></div>
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
