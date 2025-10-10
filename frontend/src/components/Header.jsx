import { ChevronDown, Globe, LogOut, Mail, Menu, Phone, User, UserCircle } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  return (
    <>
      {/* Top bar */}
      <div className="bg-gray-100 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-5 py-2 flex justify-between items-center text-sm">
          <div className="flex gap-6 items-center">
            <div className="flex items-center gap-2 text-gray-700">
              <Phone size={14} />
              <span>1900 1886</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Mail size={14} />
              <span>support@vietjetair.com</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="bg-transparent border-none text-gray-700 flex items-center gap-1 cursor-pointer hover:text-red-600 transition-colors">
              <Globe size={14} />
              <span className="font-medium">Tiếng Việt</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <nav className="flex justify-between items-center max-w-7xl mx-auto px-5 h-[80px]">
          <Link 
            to="/" 
            className="flex items-center font-bold text-3xl no-underline hover:opacity-80 transition-opacity duration-300"
          >
            <span className="text-red-600">Vietjet</span>
            <span className="text-yellow-500">Air</span>
          </Link>
          
          <div className="hidden lg:flex gap-1 items-center">
            <Link 
              to="/booking" 
              className="text-gray-700 no-underline font-medium px-6 py-2.5 rounded-md transition-all duration-300 hover:bg-red-50 hover:text-red-600"
            >
              Đặt vé
            </Link>
            <Link 
              to="/checkin" 
              className="text-gray-700 no-underline font-medium px-6 py-2.5 rounded-md transition-all duration-300 hover:bg-red-50 hover:text-red-600"
            >
              Check-in
            </Link>
            <Link 
              to="/manage" 
              className="text-gray-700 no-underline font-medium px-6 py-2.5 rounded-md transition-all duration-300 hover:bg-red-50 hover:text-red-600"
            >
              Quản lý đặt chỗ
            </Link>
            <Link 
              to="/flight-status" 
              className="text-gray-700 no-underline font-medium px-6 py-2.5 rounded-md transition-all duration-300 hover:bg-red-50 hover:text-red-600"
            >
              Tình trạng bay
            </Link>
            <Link 
              to="/about" 
              className="text-gray-700 no-underline font-medium px-6 py-2.5 rounded-md transition-all duration-300 hover:bg-red-50 hover:text-red-600"
            >
              Về chúng tôi
            </Link>
            <Link 
              to="/contact" 
              className="text-gray-700 no-underline font-medium px-6 py-2.5 rounded-md transition-all duration-300 hover:bg-red-50 hover:text-red-600"
            >
              Liên hệ
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="bg-gradient-to-r from-red-600 to-red-500 border-none text-white px-4 py-2.5 rounded-full flex items-center gap-2 cursor-pointer font-medium transition-all duration-300 hover:from-red-700 hover:to-red-600 hover:shadow-lg"
                >
                  <UserCircle size={20} />
                  <span className="hidden sm:inline">
                    {user?.personalInfo?.firstName || 'User'}
                  </span>
                  <ChevronDown size={16} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.personalInfo?.firstName} {user?.personalInfo?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.contactInfo?.email}
                      </p>
                      {(user?.role === 'admin' || user?.role === 'superadmin') && (
                        <p className="text-xs text-red-600 font-semibold mt-1">
                          {user?.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                        </p>
                      )}
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 no-underline"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <UserCircle size={16} />
                      Tài khoản của tôi
                    </Link>
                    <Link
                      to="/my-bookings"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 no-underline"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Mail size={16} />
                      Booking của tôi
                    </Link>
                    {(user?.role === 'admin' || user?.role === 'superadmin') && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 no-underline border-t border-gray-200 mt-1 pt-2"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <UserCircle size={16} />
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-none bg-transparent cursor-pointer text-left"
                    >
                      <LogOut size={16} />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="bg-gradient-to-r from-red-600 to-red-500 border-none text-white px-6 py-2.5 rounded-full flex items-center gap-2 cursor-pointer font-medium transition-all duration-300 hover:from-red-700 hover:to-red-600 hover:shadow-lg no-underline"
                >
                  <User size={18} />
                  <span className="hidden sm:inline">Đăng nhập</span>
                </Link>
                <Link
                  to="/register"
                  className="hidden md:block bg-white border border-red-600 text-red-600 px-6 py-2.5 rounded-full font-medium transition-all duration-300 hover:bg-red-50 no-underline"
                >
                  Đăng ký
                </Link>
              </div>
            )}
            
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden bg-transparent border-none text-gray-700 cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-all duration-300"
            >
              <Menu size={24} />
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="flex flex-col p-4">
              <Link 
                to="/booking" 
                className="text-gray-700 no-underline font-medium px-4 py-3 rounded-md hover:bg-red-50 hover:text-red-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Đặt vé
              </Link>
              <Link 
                to="/checkin" 
                className="text-gray-700 no-underline font-medium px-4 py-3 rounded-md hover:bg-red-50 hover:text-red-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Check-in
              </Link>
              <Link 
                to="/manage" 
                className="text-gray-700 no-underline font-medium px-4 py-3 rounded-md hover:bg-red-50 hover:text-red-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Quản lý đặt chỗ
              </Link>
              <Link 
                to="/flight-status" 
                className="text-gray-700 no-underline font-medium px-4 py-3 rounded-md hover:bg-red-50 hover:text-red-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Tình trạng bay
              </Link>
              <Link 
                to="/about" 
                className="text-gray-700 no-underline font-medium px-4 py-3 rounded-md hover:bg-red-50 hover:text-red-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Về chúng tôi
              </Link>
              <Link 
                to="/contact" 
                className="text-gray-700 no-underline font-medium px-4 py-3 rounded-md hover:bg-red-50 hover:text-red-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Liên hệ
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;