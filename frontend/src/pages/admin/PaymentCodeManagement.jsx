import { Calendar, DollarSign, Edit2, Eye, Filter, Plus, Search, Tag, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import adminService from '../../services/adminService';

function PaymentCodeManagement() {
  const [paymentCodes, setPaymentCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCode, setSelectedCode] = useState(null);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discountType: 'percentage',
    value: '',
    minAmount: 0,
    maxDiscount: '',
    startDate: '',
    expiryDate: '',
    usageLimit: {
      total: '',
      perUser: 1
    },
    applicableFor: {
      fareClasses: [],
      userTypes: ['all']
    }
  });

  useEffect(() => {
    loadPaymentCodes();
    loadStats();
  }, [pagination.page, statusFilter]);

  const loadPaymentCodes = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter,
        search: searchTerm
      };
      const response = await adminService.getPaymentCodes(params);
      setPaymentCodes(response.data?.paymentCodes || []);
      
      const backendPagination = response.data?.pagination || {};
      setPagination(prev => ({
        ...prev,
        page: backendPagination.page || prev.page,
        total: backendPagination.total || 0,
        pages: backendPagination.pages || 0
      }));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách mã thanh toán');
      console.error('Error loading payment codes:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await adminService.getPaymentCodeStats();
      setStats(response.data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleCreate = () => {
    setSelectedCode(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      discountType: 'percentage',
      value: '',
      minAmount: 0,
      maxDiscount: '',
      startDate: '',
      expiryDate: '',
      usageLimit: {
        total: '',
        perUser: 1
      },
      applicableFor: {
        fareClasses: [],
        userTypes: ['all']
      }
    });
    setShowModal(true);
  };

  const handleEdit = (code) => {
    setSelectedCode(code);
    setFormData({
      code: code.code,
      name: code.name,
      description: code.description || '',
      discountType: code.discountType,
      value: code.value,
      minAmount: code.minAmount || 0,
      maxDiscount: code.maxDiscount || '',
      startDate: code.startDate ? new Date(code.startDate).toISOString().slice(0, 16) : '',
      expiryDate: code.expiryDate ? new Date(code.expiryDate).toISOString().slice(0, 16) : '',
      usageLimit: {
        total: code.usageLimit?.total || '',
        perUser: code.usageLimit?.perUser || 1
      },
      applicableFor: {
        fareClasses: code.applicableFor?.fareClasses || [],
        userTypes: code.applicableFor?.userTypes || ['all']
      }
    });
    setShowModal(true);
  };

  const handleViewDetail = (code) => {
    setSelectedCode(code);
    setShowDetailModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        value: parseFloat(formData.value),
        minAmount: parseFloat(formData.minAmount) || 0,
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
        usageLimit: {
          total: formData.usageLimit.total ? parseInt(formData.usageLimit.total) : null,
          perUser: parseInt(formData.usageLimit.perUser) || 1
        }
      };

      if (selectedCode) {
        await adminService.updatePaymentCode(selectedCode._id, submitData);
        alert('Cập nhật mã thanh toán thành công!');
      } else {
        await adminService.createPaymentCode(submitData);
        alert('Tạo mã thanh toán thành công!');
      }
      
      loadPaymentCodes();
      loadStats();
      setShowModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa mã thanh toán này?')) return;
    
    try {
      await adminService.deletePaymentCode(id);
      alert('Xóa mã thanh toán thành công!');
      loadPaymentCodes();
      loadStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi xóa');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await adminService.togglePaymentCodeStatus(id);
      loadPaymentCodes();
      loadStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('vi-VN');
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { class: 'success', text: 'Đang hoạt động' },
      inactive: { class: 'secondary', text: 'Tạm ngưng' },
      expired: { class: 'danger', text: 'Hết hạn' }
    };
    const badge = badges[status] || { class: 'secondary', text: status };
    return <span className={`status-badge status-${badge.class}`}>{badge.text}</span>;
  };

  const getDiscountText = (code) => {
    if (code.discountType === 'percentage') {
      return `${code.value}%`;
    }
    return formatCurrency(code.value);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Quản lý Mã thanh toán</h2>
            <p className="text-gray-600 mt-1">Tổng: {pagination.total} mã</p>
          </div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Tạo mã mới
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Tổng mã</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.counts?.total || 0}</p>
                </div>
                <Tag className="text-gray-400" size={32} />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Đang hoạt động</p>
                  <p className="text-2xl font-bold text-green-600">{stats.counts?.active || 0}</p>
                </div>
                <ToggleRight className="text-green-400" size={32} />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Hết hạn</p>
                  <p className="text-2xl font-bold text-red-600">{stats.counts?.expired || 0}</p>
                </div>
                <Calendar className="text-red-400" size={32} />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Tổng giảm giá</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatCurrency(stats.totalDiscount || 0)}
                  </p>
                </div>
                <DollarSign className="text-blue-400" size={32} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-yellow-50 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Tìm mã hoặc tên..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    setPagination(prev => ({ ...prev, page: 1 }));
                    loadPaymentCodes();
                  }
                }}
              />
            </div>

            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Tạm ngưng</option>
              <option value="expired">Hết hạn</option>
            </select>

            <button
              onClick={loadPaymentCodes}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <Filter className="inline mr-2" size={20} />
              Lọc
            </button>
          </div>
        </div>

        {/* Payment Codes Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giảm giá
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sử dụng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hết hạn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Đang tải...
                  </td>
                </tr>
              ) : paymentCodes.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                paymentCodes.map((code) => (
                  <tr key={code._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Tag className="mr-2 text-red-500" size={16} />
                        <span className="font-mono font-bold text-red-600">{code.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{code.name}</div>
                      {code.description && (
                        <div className="text-sm text-gray-500">{code.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-green-600">
                        {getDiscountText(code)}
                      </div>
                      {code.maxDiscount && (
                        <div className="text-xs text-gray-500">
                          Tối đa: {formatCurrency(code.maxDiscount)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {code.usedCount} / {code.usageLimit?.total || '∞'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(code.expiryDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(code.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetail(code)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Xem chi tiết"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(code)}
                          className="text-green-600 hover:text-green-900"
                          title="Chỉnh sửa"
                        >
                          <Edit2 size={18} />
                        </button>
                        {code.status !== 'expired' && (
                          <button
                            onClick={() => handleToggleStatus(code._id)}
                            className={`${code.status === 'active' ? 'text-yellow-600' : 'text-green-600'} hover:opacity-75`}
                            title={code.status === 'active' ? 'Tạm ngưng' : 'Kích hoạt'}
                          >
                            {code.status === 'active' ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                          </button>
                        )}
                        {code.usedCount === 0 && (
                          <button
                            onClick={() => handleDelete(code._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Xóa"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setPagination(prev => ({ ...prev, page }))}
                className={`px-4 py-2 rounded ${
                  pagination.page === page
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4">
                  {selectedCode ? 'Chỉnh sửa mã thanh toán' : 'Tạo mã thanh toán mới'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mã <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        disabled={!!selectedCode}
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                        placeholder="SUMMER2024"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tên <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Khuyến mãi mùa hè"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mô tả
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      rows="2"
                      placeholder="Mô tả chi tiết về mã giảm giá..."
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Loại giảm <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.discountType}
                        onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="percentage">Phần trăm (%)</option>
                        <option value="fixed">Số tiền cố định</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giá trị <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="any"
                        value={formData.value}
                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder={formData.discountType === 'percentage' ? '10' : '50000'}
                      />
                    </div>
                    {formData.discountType === 'percentage' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Giảm tối đa
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={formData.maxDiscount}
                          onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                          placeholder="200000"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Số tiền tối thiểu
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={formData.minAmount}
                        onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ngày bắt đầu
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ngày hết hạn <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={formData.expiryDate}
                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giới hạn tổng (để trống = không giới hạn)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.usageLimit.total}
                        onChange={(e) => setFormData({
                          ...formData,
                          usageLimit: { ...formData.usageLimit, total: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Không giới hạn"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giới hạn mỗi user
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.usageLimit.perUser}
                        onChange={(e) => setFormData({
                          ...formData,
                          usageLimit: { ...formData.usageLimit, perUser: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      {selectedCode ? 'Cập nhật' : 'Tạo mới'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedCode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-bold">Chi tiết mã thanh toán</h3>
                  {getStatusBadge(selectedCode.status)}
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Mã</label>
                      <div className="text-lg font-mono font-bold text-red-600">{selectedCode.code}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Tên</label>
                      <div className="text-lg font-semibold">{selectedCode.name}</div>
                    </div>
                  </div>

                  {selectedCode.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Mô tả</label>
                      <div className="text-gray-700">{selectedCode.description}</div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Loại giảm giá</label>
                      <div className="text-lg font-semibold">
                        {selectedCode.discountType === 'percentage' ? 'Phần trăm' : 'Số tiền cố định'}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Giá trị</label>
                      <div className="text-lg font-bold text-green-600">
                        {getDiscountText(selectedCode)}
                      </div>
                    </div>
                    {selectedCode.maxDiscount && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Giảm tối đa</label>
                        <div className="text-lg font-semibold">
                          {formatCurrency(selectedCode.maxDiscount)}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Số tiền tối thiểu</label>
                      <div className="text-lg">{formatCurrency(selectedCode.minAmount || 0)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Số lần sử dụng</label>
                      <div className="text-lg">
                        {selectedCode.usedCount} / {selectedCode.usageLimit?.total || '∞'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Ngày bắt đầu</label>
                      <div className="text-lg">{formatDate(selectedCode.startDate)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Ngày hết hạn</label>
                      <div className="text-lg">{formatDate(selectedCode.expiryDate)}</div>
                    </div>
                  </div>

                  {selectedCode.usedBy && selectedCode.usedBy.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-2 block">
                        Lịch sử sử dụng ({selectedCode.usedBy.length})
                      </label>
                      <div className="max-h-60 overflow-y-auto border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Người dùng</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Booking</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Giảm giá</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ngày sử dụng</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {selectedCode.usedBy.map((usage, index) => (
                              <tr key={index}>
                                <td className="px-4 py-2 text-sm">
                                  {usage.user?.email || 'N/A'}
                                </td>
                                <td className="px-4 py-2 text-sm">
                                  {usage.booking?.reference || 'N/A'}
                                </td>
                                <td className="px-4 py-2 text-sm font-semibold text-green-600">
                                  {formatCurrency(usage.discountAmount)}
                                </td>
                                <td className="px-4 py-2 text-sm">
                                  {formatDate(usage.usedAt)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-6">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default PaymentCodeManagement;
