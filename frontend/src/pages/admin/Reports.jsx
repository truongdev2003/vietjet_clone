import { Calendar, DollarSign, Download, FileText, Plane, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import adminService from '../../services/adminService';

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('revenue');
  const [period, setPeriod] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReport();
  }, [reportType, period]);

  const loadReport = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        type: reportType,
        period,
        startDate,
        endDate,
      };
      const response = await adminService.getReports(params);
      setReportData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải báo cáo');
      // Mock data for demo
      generateMockData(reportType);
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = (type) => {
    const now = new Date();
    const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    
    switch (type) {
      case 'revenue':
        setReportData(
          months.map((month, i) => ({
            _id: { year: now.getFullYear(), month: i + 1 },
            totalRevenue: Math.floor(Math.random() * 50000000000) + 10000000000,
            totalTransactions: Math.floor(Math.random() * 5000) + 1000,
            avgTransactionValue: Math.floor(Math.random() * 5000000) + 2000000,
            label: month,
          }))
        );
        break;
      case 'bookings':
        setReportData(
          months.map((month, i) => ({
            _id: { year: now.getFullYear(), month: i + 1 },
            totalBookings: Math.floor(Math.random() * 3000) + 500,
            confirmedBookings: Math.floor(Math.random() * 2500) + 400,
            cancelledBookings: Math.floor(Math.random() * 500) + 50,
            totalRevenue: Math.floor(Math.random() * 40000000000) + 10000000000,
            label: month,
          }))
        );
        break;
      case 'users':
        setReportData(
          months.map((month, i) => ({
            _id: { year: now.getFullYear(), month: i + 1 },
            newUsers: Math.floor(Math.random() * 500) + 100,
            activeUsers: Math.floor(Math.random() * 400) + 80,
            label: month,
          }))
        );
        break;
      case 'flights':
        setReportData(
          months.map((month, i) => ({
            _id: { year: now.getFullYear(), month: i + 1 },
            totalFlights: Math.floor(Math.random() * 300) + 100,
            onTimeFlights: Math.floor(Math.random() * 250) + 80,
            delayedFlights: Math.floor(Math.random() * 50) + 10,
            cancelledFlights: Math.floor(Math.random() * 20) + 5,
            label: month,
          }))
        );
        break;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      notation: 'compact',
      compactDisplay: 'short',
    }).format(amount);
  };

  const calculateGrowth = (data, key) => {
    if (!data || data.length < 2) return 0;
    const current = data[data.length - 1][key] || 0;
    const previous = data[data.length - 2][key] || 1;
    return (((current - previous) / previous) * 100).toFixed(1);
  };

  const downloadReport = () => {
    if (!reportData) return;
    
    const csvContent = convertToCSV(reportData, reportType);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const convertToCSV = (data, type) => {
    if (!data || !Array.isArray(data)) return '';
    
    let headers = ['Thời gian'];
    let rows = [];

    switch (type) {
      case 'revenue':
        headers = ['Thời gian', 'Tổng doanh thu', 'Số giao dịch', 'Giá trị TB'];
        rows = data.map(item => [
          `${item.label || item._id.month}/${item._id.year}`,
          item.totalRevenue,
          item.totalTransactions,
          item.avgTransactionValue,
        ]);
        break;
      case 'bookings':
        headers = ['Thời gian', 'Tổng booking', 'Đã xác nhận', 'Đã hủy', 'Doanh thu'];
        rows = data.map(item => [
          `${item.label || item._id.month}/${item._id.year}`,
          item.totalBookings,
          item.confirmedBookings,
          item.cancelledBookings,
          item.totalRevenue,
        ]);
        break;
      case 'users':
        headers = ['Thời gian', 'User mới', 'User hoạt động'];
        rows = data.map(item => [
          `${item.label || item._id.month}/${item._id.year}`,
          item.newUsers,
          item.activeUsers,
        ]);
        break;
      case 'flights':
        headers = ['Thời gian', 'Tổng chuyến', 'Đúng giờ', 'Trễ', 'Hủy'];
        rows = data.map(item => [
          `${item.label || item._id.month}/${item._id.year}`,
          item.totalFlights,
          item.onTimeFlights,
          item.delayedFlights,
          item.cancelledFlights,
        ]);
        break;
    }

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  };

  const renderRevenueReport = () => {
    if (!reportData) return null;

    const total = reportData.reduce((sum, item) => sum + (item.totalRevenue || 0), 0);
    const growth = calculateGrowth(reportData, 'totalRevenue');

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tổng doanh thu</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(total)}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="text-green-600" size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {parseFloat(growth) >= 0 ? (
                <TrendingUp className="text-green-600 mr-1" size={16} />
              ) : (
                <TrendingDown className="text-red-600 mr-1" size={16} />
              )}
              <span className={`text-sm ${parseFloat(growth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {growth}% so với kỳ trước
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Số giao dịch</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {reportData.reduce((sum, item) => sum + (item.totalTransactions || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FileText className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Giá trị trung bình</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(
                    reportData.reduce((sum, item) => sum + (item.avgTransactionValue || 0), 0) / reportData.length
                  )}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <TrendingUp className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Doanh thu</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Giao dịch</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Giá trị TB</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.label || `${item._id.month}/${item._id.year}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                    {formatCurrency(item.totalRevenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {item.totalTransactions?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {formatCurrency(item.avgTransactionValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderBookingsReport = () => {
    if (!reportData) return null;

    const totalBookings = reportData.reduce((sum, item) => sum + (item.totalBookings || 0), 0);
    const growth = calculateGrowth(reportData, 'totalBookings');

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tổng booking</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalBookings.toLocaleString()}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Calendar className="text-blue-600" size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {parseFloat(growth) >= 0 ? (
                <TrendingUp className="text-green-600 mr-1" size={16} />
              ) : (
                <TrendingDown className="text-red-600 mr-1" size={16} />
              )}
              <span className={`text-sm ${parseFloat(growth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {growth}%
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Đã xác nhận</p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {reportData.reduce((sum, item) => sum + (item.confirmedBookings || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Đã hủy</p>
                <p className="text-2xl font-bold text-red-900 mt-1">
                  {reportData.reduce((sum, item) => sum + (item.cancelledBookings || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <TrendingDown className="text-red-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Doanh thu</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(reportData.reduce((sum, item) => sum + (item.totalRevenue || 0), 0))}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <DollarSign className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tổng</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Xác nhận</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hủy</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Doanh thu</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.label || `${item._id.month}/${item._id.year}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                    {item.totalBookings?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                    {item.confirmedBookings?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                    {item.cancelledBookings?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {formatCurrency(item.totalRevenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderUsersReport = () => {
    if (!reportData) return null;

    const totalNew = reportData.reduce((sum, item) => sum + (item.newUsers || 0), 0);
    const growth = calculateGrowth(reportData, 'newUsers');

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">User mới</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalNew.toLocaleString()}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {parseFloat(growth) >= 0 ? (
                <TrendingUp className="text-green-600 mr-1" size={16} />
              ) : (
                <TrendingDown className="text-red-600 mr-1" size={16} />
              )}
              <span className={`text-sm ${parseFloat(growth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {growth}%
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">User hoạt động</p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {reportData.reduce((sum, item) => sum + (item.activeUsers || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Users className="text-green-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">User mới</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">User hoạt động</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tỷ lệ hoạt động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.label || `${item._id.month}/${item._id.year}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                    {item.newUsers?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                    {item.activeUsers?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {((item.activeUsers / item.newUsers) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderFlightsReport = () => {
    if (!reportData) return null;

    const totalFlights = reportData.reduce((sum, item) => sum + (item.totalFlights || 0), 0);
    const onTimeFlights = reportData.reduce((sum, item) => sum + (item.onTimeFlights || 0), 0);
    const onTimeRate = ((onTimeFlights / totalFlights) * 100).toFixed(1);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tổng chuyến</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalFlights.toLocaleString()}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Plane className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Đúng giờ</p>
                <p className="text-2xl font-bold text-green-900 mt-1">{onTimeFlights.toLocaleString()}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="text-green-600" size={24} />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Tỷ lệ: {onTimeRate}%</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Trễ giờ</p>
                <p className="text-2xl font-bold text-orange-900 mt-1">
                  {reportData.reduce((sum, item) => sum + (item.delayedFlights || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Clock className="text-orange-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Đã hủy</p>
                <p className="text-2xl font-bold text-red-900 mt-1">
                  {reportData.reduce((sum, item) => sum + (item.cancelledFlights || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <TrendingDown className="text-red-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tổng</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Đúng giờ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Trễ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hủy</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tỷ lệ đúng giờ</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.label || `${item._id.month}/${item._id.year}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                    {item.totalFlights?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                    {item.onTimeFlights?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600">
                    {item.delayedFlights?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                    {item.cancelledFlights?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {((item.onTimeFlights / item.totalFlights) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Báo cáo & Thống kê</h2>
            <p className="text-gray-600 mt-1">Phân tích dữ liệu kinh doanh</p>
          </div>
          <button
            onClick={downloadReport}
            disabled={!reportData}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={20} />
            Tải xuống CSV
          </button>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            {error} (Hiển thị dữ liệu mẫu)
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại báo cáo</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="revenue">Doanh thu</option>
                <option value="bookings">Bookings</option>
                <option value="users">Người dùng</option>
                <option value="flights">Chuyến bay</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kỳ báo cáo</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                <option value="daily">Theo ngày</option>
                <option value="weekly">Theo tuần</option>
                <option value="monthly">Theo tháng</option>
                <option value="yearly">Theo năm</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
              <input
                type="date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
              <input
                type="date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={loadReport}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Tạo báo cáo
            </button>
          </div>
        </div>

        {/* Report Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <svg className="animate-spin h-12 w-12 text-red-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-4 text-gray-600">Đang tải...</p>
            </div>
          </div>
        ) : (
          <>
            {reportType === 'revenue' && renderRevenueReport()}
            {reportType === 'bookings' && renderBookingsReport()}
            {reportType === 'users' && renderUsersReport()}
            {reportType === 'flights' && renderFlightsReport()}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default Reports;
