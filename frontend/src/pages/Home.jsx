import { Calendar, Clock, MapPin, Plane, Shield, Star } from "lucide-react";
import FlightSearchForm from "../components/FlightSearchForm";
import Footer from "../components/Footer";
import Header from "../components/Header";
import HeroCarousel from "../components/HeroCarousel";

const Home = () => {
  const destinations = [
    { city: "Hà Nội", image: "🏯", price: "499,000" },
    { city: "Đà Nẵng", image: "🏖️", price: "599,000" },
    { city: "Phú Quốc", image: "🏝️", price: "799,000" },
    { city: "Nha Trang", image: "🌊", price: "699,000" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 via-pink-50 to-white font-sans">
      <Header />

      {/* Hero Carousel with Search Form */}
      <HeroCarousel>
        <FlightSearchForm />
      </HeroCarousel>

      {/* Quick Actions */}
      <section className="bg-white py-6 shadow-sm relative z-20">
        <div className="max-w-7xl mx-auto px-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-red-50 transition-colors group">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center group-hover:bg-red-200 transition-colors">
                <Calendar className="text-red-600" size={24} />
              </div>
              <span className="text-sm font-medium text-gray-700">
                Quản lý booking
              </span>
            </button>

            <button className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-red-50 transition-colors group">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center group-hover:bg-red-200 transition-colors">
                <Plane className="text-red-600" size={24} />
              </div>
              <span className="text-sm font-medium text-gray-700">
                Check-in online
              </span>
            </button>

            <button className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-red-50 transition-colors group">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center group-hover:bg-red-200 transition-colors">
                <Clock className="text-red-600" size={24} />
              </div>
              <span className="text-sm font-medium text-gray-700">
                Tình trạng bay
              </span>
            </button>

            <button className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-red-50 transition-colors group">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center group-hover:bg-red-200 transition-colors">
                <Star className="text-red-600" size={24} />
              </div>
              <span className="text-sm font-medium text-gray-700">
                Khuyến mãi
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-5">
          {/* Popular Destinations */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">
              Điểm đến phổ biến
            </h2>
            <p className="text-gray-600 text-center mb-8">
              Khám phá các địa điểm du lịch hấp dẫn với giá vé tốt nhất
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {destinations.map((dest, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer group"
                >
                  <div className="h-48 bg-gradient-to-br from-red-400 to-orange-400 flex items-center justify-center text-7xl group-hover:scale-105 transition-transform duration-300">
                    {dest.image}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin size={18} className="text-red-600" />
                      <h3 className="text-xl font-semibold text-gray-800">
                        {dest.city}
                      </h3>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Chỉ từ</span>
                      <span className="text-xl font-bold text-red-600">
                        {dest.price}₫
                      </span>
                    </div>
                    <button className="w-full mt-3 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors font-medium">
                      Đặt vé ngay
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Why Choose Us */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">
              Tại sao chọn Vietjet Air?
            </h2>
            <p className="text-gray-600 text-center mb-8">
              Chúng tôi cam kết mang đến trải nghiệm bay tuyệt vời nhất
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-md text-center hover:shadow-xl transition-shadow duration-300">
                <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-5">
                  <Star className="text-white" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Giá vé tốt nhất
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Cam kết giá vé cạnh tranh nhất thị trường với nhiều ưu đãi hấp
                  dẫn quanh năm
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-md text-center hover:shadow-xl transition-shadow duration-300">
                <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-5">
                  <Shield className="text-white" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  An toàn tuyệt đối
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Đội bay hiện đại, đội ngũ phi công giàu kinh nghiệm đảm bảo an
                  toàn tối đa
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-md text-center hover:shadow-xl transition-shadow duration-300">
                <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-5">
                  <Clock className="text-white" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Đúng giờ
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Tỷ lệ bay đúng giờ cao, giúp bạn yên tâm với mọi kế hoạch của
                  mình
                </p>
              </div>
            </div>
          </section>

          {/* Promotion Banner */}
          <section className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 text-white p-12 rounded-2xl text-center shadow-xl">
            <h2 className="text-4xl font-bold mb-4">
              🎉 Ưu đãi đặc biệt cuối tuần!
            </h2>
            <p className="text-xl mb-6 opacity-95">
              Giảm ngay 30% cho tất cả các chuyến bay nội địa khi đặt vé trong
              tuần này
            </p>
            <button className="bg-white text-red-600 px-10 py-4 rounded-full text-lg font-bold hover:bg-gray-100 transition-all duration-300 hover:scale-105 shadow-lg">
              Khám phá ngay →
            </button>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
