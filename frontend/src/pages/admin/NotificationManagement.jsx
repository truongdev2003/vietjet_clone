import { Bell, RefreshCw, Send, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import adminService from '../../services/adminService';
import '../../styles/admin/NotificationManagement.css';

function NotificationManagement() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPromotionalModal, setShowPromotionalModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');

  const [formData, setFormData] = useState({
    userId: '',
    type: 'system',
    title: '',
    message: '',
    priority: 'normal',
    data: {}
  });

  const [promotionalData, setPromotionalData] = useState({
    title: '',
    message: '',
    targetAudience: 'all',
    discountCode: '',
    validUntil: ''
  });

  useEffect(() => {
    loadNotifications();
  }, [typeFilter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const params = { type: typeFilter };
      const response = await adminService.getNotifications(params);
      // Backend trả về: { success, data: { notifications: [], pagination: {} } }
      setNotifications(response.data?.notifications || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách thông báo');
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotification = async (e) => {
    e.preventDefault();
    try {
      await adminService.createNotification(formData);
      alert('Gửi thông báo thành công!');
      loadNotifications();
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleSendPromotional = async (e) => {
    e.preventDefault();
    try {
      await adminService.sendPromotionalNotification(promotionalData);
      alert('Gửi thông báo khuyến mãi thành công!');
      loadNotifications();
      setShowPromotionalModal(false);
      resetPromotionalForm();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      type: 'system',
      title: '',
      message: '',
      priority: 'normal',
      data: {}
    });
  };

  const resetPromotionalForm = () => {
    setPromotionalData({
      title: '',
      message: '',
      targetAudience: 'all',
      discountCode: '',
      validUntil: ''
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('vi-VN');
  };

  const getTypeBadge = (type) => {
    const badges = {
      flight_update: { class: 'info', text: 'Cập nhật chuyến bay', icon: '✈️' },
      booking: { class: 'success', text: 'Đặt vé', icon: '📋' },
      payment: { class: 'warning', text: 'Thanh toán', icon: '💳' },
      promotion: { class: 'danger', text: 'Khuyến mãi', icon: '🎁' },
      system: { class: 'secondary', text: 'Hệ thống', icon: '⚙️' },
      account: { class: 'primary', text: 'Tài khoản', icon: '👤' }
    };
    const badge = badges[type] || { class: 'secondary', text: type, icon: '📢' };
    return (
      <span className={`type-badge type-${badge.class}`}>
        <span className="badge-icon">{badge.icon}</span>
        {badge.text}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      urgent: { class: 'danger', text: 'Khẩn cấp' },
      high: { class: 'warning', text: 'Cao' },
      normal: { class: 'info', text: 'Bình thường' },
      low: { class: 'secondary', text: 'Thấp' }
    };
    const badge = badges[priority] || { class: 'info', text: priority };
    return <span className={`priority-badge priority-${badge.class}`}>{badge.text}</span>;
  };

  if (loading) return <AdminLayout><div className="loading">Đang tải...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="notification-management">
        <div className="page-header">
          <div>
            <h1>Quản Lý Thông Báo</h1>
            <p className="subtitle">Gửi và quản lý thông báo cho khách hàng</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-success" onClick={() => setShowPromotionalModal(true)}>
              <Send size={18} /> Gửi khuyến mãi
            </button>
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Bell size={18} /> Tạo thông báo
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Statistics */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon primary">
              <Bell size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Tổng thông báo</div>
              <div className="stat-value">{notifications.length}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon success">
              <Users size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Đã đọc</div>
              <div className="stat-value">
                {notifications.filter(n => n.read).length}
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon warning">
              <Bell size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Chưa đọc</div>
              <div className="stat-value">
                {notifications.filter(n => !n.read).length}
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon danger">
              <Send size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Khuyến mãi</div>
              <div className="stat-value">
                {notifications.filter(n => n.type === 'promotion').length}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">Tất cả loại</option>
            <option value="flight_update">Cập nhật chuyến bay</option>
            <option value="booking">Đặt vé</option>
            <option value="payment">Thanh toán</option>
            <option value="promotion">Khuyến mãi</option>
            <option value="system">Hệ thống</option>
            <option value="account">Tài khoản</option>
          </select>
          <button className="btn btn-secondary" onClick={loadNotifications}>
            <RefreshCw size={18} /> Làm mới
          </button>
        </div>

        {/* Notifications List */}
        <div className="notifications-list">
          {notifications.map(notification => (
            <div key={notification._id} className={`notification-card ${notification.read ? 'read' : 'unread'}`}>
              <div className="notification-header">
                <div className="notification-meta">
                  {getTypeBadge(notification.type)}
                  {getPriorityBadge(notification.priority)}
                  {!notification.read && <span className="unread-dot">●</span>}
                </div>
                <div className="notification-date">{formatDate(notification.createdAt)}</div>
              </div>
              <div className="notification-body">
                <h3>{notification.title}</h3>
                <p>{notification.message}</p>
                {notification.data && Object.keys(notification.data).length > 0 && (
                  <div className="notification-data">
                    <small>Data: {JSON.stringify(notification.data)}</small>
                  </div>
                )}
              </div>
              <div className="notification-footer">
                <span className="notification-user">
                  Người nhận: {notification.user?.personalInfo?.firstName} {notification.user?.personalInfo?.lastName}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Create Notification Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Tạo Thông Báo Mới</h2>
                <button className="close-btn" onClick={() => setShowCreateModal(false)}>×</button>
              </div>
              <form onSubmit={handleCreateNotification}>
                <div className="form-group">
                  <label>User ID *</label>
                  <input
                    type="text"
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    placeholder="ID người dùng (để trống = gửi tất cả)"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Loại thông báo *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      required
                    >
                      <option value="system">Hệ thống</option>
                      <option value="flight_update">Cập nhật chuyến bay</option>
                      <option value="booking">Đặt vé</option>
                      <option value="payment">Thanh toán</option>
                      <option value="account">Tài khoản</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Độ ưu tiên *</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      required
                    >
                      <option value="low">Thấp</option>
                      <option value="normal">Bình thường</option>
                      <option value="high">Cao</option>
                      <option value="urgent">Khẩn cấp</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Tiêu đề *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Nội dung *</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={4}
                    required
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Gửi thông báo
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Promotional Notification Modal */}
        {showPromotionalModal && (
          <div className="modal-overlay" onClick={() => setShowPromotionalModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Gửi Thông Báo Khuyến Mãi</h2>
                <button className="close-btn" onClick={() => setShowPromotionalModal(false)}>×</button>
              </div>
              <form onSubmit={handleSendPromotional}>
                <div className="form-group">
                  <label>Tiêu đề *</label>
                  <input
                    type="text"
                    value={promotionalData.title}
                    onChange={(e) => setPromotionalData({ ...promotionalData, title: e.target.value })}
                    placeholder="VD: Giảm 20% cho tất cả chuyến bay"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Nội dung *</label>
                  <textarea
                    value={promotionalData.message}
                    onChange={(e) => setPromotionalData({ ...promotionalData, message: e.target.value })}
                    rows={4}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Đối tượng *</label>
                    <select
                      value={promotionalData.targetAudience}
                      onChange={(e) => setPromotionalData({ ...promotionalData, targetAudience: e.target.value })}
                      required
                    >
                      <option value="all">Tất cả khách hàng</option>
                      <option value="new">Khách hàng mới</option>
                      <option value="vip">VIP/Gold members</option>
                      <option value="frequent">Khách bay thường xuyên</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Mã giảm giá</label>
                    <input
                      type="text"
                      value={promotionalData.discountCode}
                      onChange={(e) => setPromotionalData({ ...promotionalData, discountCode: e.target.value })}
                      placeholder="VD: SALE20"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Hiệu lực đến</label>
                  <input
                    type="datetime-local"
                    value={promotionalData.validUntil}
                    onChange={(e) => setPromotionalData({ ...promotionalData, validUntil: e.target.value })}
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowPromotionalModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-success">
                    Gửi khuyến mãi
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

export default NotificationManagement;
