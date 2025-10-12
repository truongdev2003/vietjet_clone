import {
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  CheckCircle,
  ChevronDown,
  CreditCard,
  DollarSign,
  Grid,
  Image,
  LayoutDashboard,
  LogOut,
  Menu,
  Plane,
  PlaneTakeoff,
  Route,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navigation = [
    {
      name: 'Dashboard',
      path: '/admin',
      icon: LayoutDashboard,
    },
    {
      name: 'Quản lý Users',
      path: '/admin/users',
      icon: Users,
    },
    {
      name: 'Quản lý Flights',
      path: '/admin/flights',
      icon: Plane,
    },
    {
      name: 'Quản lý Airports',
      path: '/admin/airports',
      icon: Building2,
    },
    {
      name: 'Quản lý Tuyến Bay',
      path: '/admin/routes',
      icon: Route,
    },
    {
      name: 'Quản lý Aircraft',
      path: '/admin/aircraft',
      icon: PlaneTakeoff,
    },
    {
      name: 'Quản lý Fares',
      path: '/admin/fares',
      icon: DollarSign,
    },
    {
      name: 'Quản lý Bookings',
      path: '/admin/bookings',
      icon: BookOpen,
    },
    {
      name: 'Quản lý Thanh toán',
      path: '/admin/payments',
      icon: CreditCard,
    },
   
    {
      name: 'Quản lý Check-in',
      path: '/admin/checkin',
      icon: CheckCircle,
    },
    {
      name: 'Quản lý Ghế ngồi',
      path: '/admin/seats',
      icon: Grid,
    },
    {
      name: 'Quản lý Banner',
      path: '/admin/banners',
      icon: Image,
    },
    {
      name: 'Báo cáo & Thống kê',
      path: '/admin/reports',
      icon: BarChart3,
    },
  ];

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 bg-gray-800 flex-shrink-0">
          <Link to="/admin" className="flex items-center">
            <span className="text-red-600 font-bold text-xl">Vietjet</span>
            <span className="text-yellow-500 font-bold text-xl ml-1">Admin</span>
          </Link>
          <button
            className="lg:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto mt-6 px-3 pb-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 mb-2 rounded-lg transition-colors ${
                  active
                    ? 'bg-red-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} />
                <span className="ml-3 font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button - Fixed at bottom */}
        <div className="flex-shrink-0 p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-gray-400 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="ml-3 font-medium">Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top navbar */}
        <div className="bg-white shadow-sm h-16 flex items-center justify-between px-6">
          <button
            className="lg:hidden text-gray-600 hover:text-gray-900"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>

          <div className="flex-1 lg:ml-0 ml-4">
            <h1 className="text-xl font-semibold text-gray-900">
              {navigation.find((item) => isActive(item.path))?.name || 'Admin Panel'}
            </h1>
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-3 text-gray-700 hover:text-gray-900"
            >
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.personalInfo?.firstName?.charAt(0)}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">
                  {user?.personalInfo?.firstName} {user?.personalInfo?.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <ChevronDown size={16} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setUserMenuOpen(false)}
                >
                  Tài khoản của tôi
                </Link>
                <Link
                  to="/"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setUserMenuOpen(false)}
                >
                  Về trang chủ
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
