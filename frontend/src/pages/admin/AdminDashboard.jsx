import {
  ArrowRight,
  BookOpen,
  DollarSign,
  Plane,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import adminService from '../../services/adminService';
 
const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBookings: 0,
    totalFlights: 0,
    totalRevenue: 0,
    newUsersToday: 0,
    newBookingsToday: 0,
    revenueGrowth: 0,
    bookingGrowth: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminService.getDashboard();
      console.log('Dashboard data:', response?.data?.overview);
      const overview = response?.data?.overview || {};
      
      // Map backend data structure to frontend stats
      setStats({
        totalUsers: overview.users?.total || 0,
        totalBookings: overview.bookings?.total || 0,
        totalFlights: overview.flights?.total || 0,
        totalRevenue: overview.revenue?.total || 0,
        newUsersToday: overview.users?.today || 0,
        newBookingsToday: overview.bookings?.today || 0,
        revenueGrowth: parseFloat(overview.revenue?.growth) || 0,
        bookingGrowth: parseFloat(overview.bookings?.growth) || 0,
        activeFlights: overview.flights?.active || 0,
      });
      setRecentBookings(response?.data?.recentBookings || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải dữ liệu dashboard');
      // Mock data for demo
      setStats({
        totalUsers: 1250,
        totalBookings: 3456,
        totalFlights: 125,
        totalRevenue: 12500000000,
        newUsersToday: 45,
        newBookingsToday: 89,
        revenueGrowth: 12.5,
        bookingGrowth: 8.3,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const statCards = [
    {
      title: 'Tổng Users',
      value: stats.totalUsers,
      change: `+${stats.newUsersToday} hôm nay`,
      icon: Users,
      color: 'bg-blue-500',
      link: '/admin/users',
    },
    {
      title: 'Tổng Bookings',
      value: stats.totalBookings,
      change: `+${stats.newBookingsToday} hôm nay`,
      growth: stats.bookingGrowth,
      icon: BookOpen,
      color: 'bg-green-500',
      link: '/admin/bookings',
    },
    {
      title: 'Tổng Flights',
      value: stats.totalFlights,
      change: 'Đang hoạt động',
      icon: Plane,
      color: 'bg-purple-500',
      link: '/admin/flights',
    },
    {
      title: 'Doanh thu',
      value: formatCurrency(stats.totalRevenue),
      change: `Tháng này`,
      growth: stats.revenueGrowth,
      icon: DollarSign,
      color: 'bg-red-500',
      link: '/admin/reports',
    },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <svg className="animate-spin h-12 w-12 text-red-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-1">Tổng quan hệ thống Vietjet</p>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            {error} (Hiển thị dữ liệu mẫu)
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.title}
                to={stat.link}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-gray-500 text-sm font-medium">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    <div className="flex items-center mt-2">
                      <p className="text-sm text-gray-600">{stat.change}</p>
                      {stat.growth && (
                        <span className={`ml-2 flex items-center text-sm ${stat.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stat.growth > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                          <span className="ml-1">{Math.abs(stat.growth)}%</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`${stat.color} w-12 h-12 rounded-full flex items-center justify-center`}>
                    <Icon className="text-white" size={24} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Charts and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Bookings */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Bookings gần đây</h3>
              <Link to="/admin/bookings" className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center">
                Xem tất cả <ArrowRight size={16} className="ml-1" />
              </Link>
            </div>
            <div className="space-y-3">
              {recentBookings.length > 0 ? (
                recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{booking.bookingCode}</p>
                      <p className="text-sm text-gray-600">{booking.route}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(booking.amount)}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen size={48} className="mx-auto mb-2 text-gray-300" />
                  <p>Chưa có booking nào</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>
            <div className="grid grid-cols-2 gap-4">
              <Link
                to="/admin/users"
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-600 hover:bg-red-50 transition-colors text-center"
              >
                <Users size={32} className="mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-medium text-gray-700">Quản lý Users</p>
              </Link>
              <Link
                to="/admin/flights"
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-600 hover:bg-red-50 transition-colors text-center"
              >
                <Plane size={32} className="mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-medium text-gray-700">Quản lý Flights</p>
              </Link>
              <Link
                to="/admin/bookings"
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-600 hover:bg-red-50 transition-colors text-center"
              >
                <BookOpen size={32} className="mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-medium text-gray-700">Quản lý Bookings</p>
              </Link>
              <Link
                to="/admin/reports"
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-600 hover:bg-red-50 transition-colors text-center"
              >
                <TrendingUp size={32} className="mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-medium text-gray-700">Xem báo cáo</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
