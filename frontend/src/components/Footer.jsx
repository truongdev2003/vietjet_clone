import { Facebook, Instagram, Mail, MapPin, Phone, Twitter, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer */}
      <div className="bg-gray-800 px-5 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div>
              <h3 className="text-red-500 mb-4 text-xl font-bold">VietjetAir</h3>
              <p className="text-gray-300 mb-4 text-sm leading-relaxed">
                Hãng hàng không giá rẻ hàng đầu Việt Nam, kết nối bạn đến mọi miền đất nước và thế giới.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <Phone size={16} className="text-red-500" />
                  <span>1900 1886</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Mail size={16} className="text-red-500" />
                  <span>support@vietjetair.com</span>
                </div>
                <div className="flex items-start gap-2 text-gray-300">
                  <MapPin size={16} className="text-red-500 mt-1" />
                  <span>Tầng 28-29, Toà nhà Phú Mỹ Hưng, Quận 7, TP.HCM</span>
                </div>
              </div>
            </div>
            
            {/* Services */}
            <div>
              <h3 className="text-red-500 mb-4 text-lg font-semibold">Dịch vụ</h3>
              <ul className="list-none p-0 m-0 space-y-2">
                <li>
                  <Link to="/booking" className="text-gray-300 no-underline text-sm transition-colors duration-300 hover:text-red-500 hover:pl-1">
                    Đặt vé máy bay
                  </Link>
                </li>
                <li>
                  <Link to="/checkin" className="text-gray-300 no-underline text-sm transition-colors duration-300 hover:text-red-500 hover:pl-1">
                    Check-in online
                  </Link>
                </li>
                <li>
                  <Link to="/manage" className="text-gray-300 no-underline text-sm transition-colors duration-300 hover:text-red-500 hover:pl-1">
                    Quản lý đặt chỗ
                  </Link>
                </li>
                <li>
                  <Link to="/flight-status" className="text-gray-300 no-underline text-sm transition-colors duration-300 hover:text-red-500 hover:pl-1">
                    Tình trạng chuyến bay
                  </Link>
                </li>
                <li>
                  <Link to="/baggage" className="text-gray-300 no-underline text-sm transition-colors duration-300 hover:text-red-500 hover:pl-1">
                    Hành lý
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Information */}
            <div>
              <h3 className="text-red-500 mb-4 text-lg font-semibold">Thông tin</h3>
              <ul className="list-none p-0 m-0 space-y-2">
                <li>
                  <Link to="/about" className="text-gray-300 no-underline text-sm transition-colors duration-300 hover:text-red-500 hover:pl-1">
                    Về chúng tôi
                  </Link>
                </li>
                <li>
                  <Link to="/news" className="text-gray-300 no-underline text-sm transition-colors duration-300 hover:text-red-500 hover:pl-1">
                    Tin tức & Sự kiện
                  </Link>
                </li>
                <li>
                  <Link to="/careers" className="text-gray-300 no-underline text-sm transition-colors duration-300 hover:text-red-500 hover:pl-1">
                    Tuyển dụng
                  </Link>
                </li>
                <li>
                  <Link to="/investor" className="text-gray-300 no-underline text-sm transition-colors duration-300 hover:text-red-500 hover:pl-1">
                    Quan hệ nhà đầu tư
                  </Link>
                </li>
                <li>
                  <Link to="/destinations" className="text-gray-300 no-underline text-sm transition-colors duration-300 hover:text-red-500 hover:pl-1">
                    Điểm đến
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Support & Social */}
            <div>
              <h3 className="text-red-500 mb-4 text-lg font-semibold">Hỗ trợ</h3>
              <ul className="list-none p-0 m-0 space-y-2 mb-6">
                <li>
                  <Link to="/contact" className="text-gray-300 no-underline text-sm transition-colors duration-300 hover:text-red-500 hover:pl-1">
                    Liên hệ
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="text-gray-300 no-underline text-sm transition-colors duration-300 hover:text-red-500 hover:pl-1">
                    Câu hỏi thường gặp
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-gray-300 no-underline text-sm transition-colors duration-300 hover:text-red-500 hover:pl-1">
                    Điều khoản sử dụng
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-gray-300 no-underline text-sm transition-colors duration-300 hover:text-red-500 hover:pl-1">
                    Chính sách bảo mật
                  </Link>
                </li>
              </ul>
              
              <div>
                <h4 className="text-white mb-3 text-sm font-semibold">Kết nối với chúng tôi</h4>
                <div className="flex gap-3">
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-gray-300 transition-all duration-300 hover:bg-red-600 hover:text-white">
                    <Facebook size={20} />
                  </a>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-gray-300 transition-all duration-300 hover:bg-red-600 hover:text-white">
                    <Instagram size={20} />
                  </a>
                  <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-gray-300 transition-all duration-300 hover:bg-red-600 hover:text-white">
                    <Youtube size={20} />
                  </a>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-gray-300 transition-all duration-300 hover:bg-red-600 hover:text-white">
                    <Twitter size={20} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Footer */}
      <div className="bg-gray-900 px-5 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-gray-400 text-sm">
            <p className="text-center md:text-left">
              &copy; 2025 <span className="text-red-500 font-semibold">VietJet Air Clone</span>. Đây là website học tập, không phải website chính thức.
            </p>
            <div className="flex gap-6">
              <Link to="/sitemap" className="hover:text-red-500 transition-colors">
                Sơ đồ trang
              </Link>
              <Link to="/accessibility" className="hover:text-red-500 transition-colors">
                Trợ năng
              </Link>
              <Link to="/cookies" className="hover:text-red-500 transition-colors">
                Cookie
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;