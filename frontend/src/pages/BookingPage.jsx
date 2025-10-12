import { AlertCircle, ArrowLeft, Check, CreditCard, Plane, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import Header from '../components/Header';
import PaymentCodeInput from '../components/PaymentCodeInput';
import PromoCodeInput from '../components/PromoCodeInput';
import axiosInstance from '../config/axios';
import { useAuth } from '../context/AuthContext';

const BookingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [flight, setFlight] = useState(null);
  const [outboundFlight, setOutboundFlight] = useState(null);
  const [returnFlight, setReturnFlight] = useState(null);
  const [searchParams, setSearchParams] = useState({});
  const [selectedSeats, setSelectedSeats] = useState([]); // Ghế đã chọn từ SeatSelection
  const [passengers, setPassengers] = useState([]);
  const [contactInfo, setContactInfo] = useState({
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      country: 'Vietnam',
      zipCode: ''
    }
  });
  const [paymentMethod, setPaymentMethod] = useState('momo');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [appliedPromoCode, setAppliedPromoCode] = useState(null);
  const [paymentCodeDiscount, setPaymentCodeDiscount] = useState(0);
  const [appliedPaymentCode, setAppliedPaymentCode] = useState(null);

  useEffect(() => {
    if (location.state) {
      // Handle round-trip booking
      if (location.state.outboundFlight && location.state.returnFlight) {
        setOutboundFlight(location.state.outboundFlight);
        setReturnFlight(location.state.returnFlight);
        setSearchParams(location.state.searchParams);
        
        // Get selected seats if available
        if (location.state.selectedSeats) {
          setSelectedSeats(location.state.selectedSeats);
        }
      } 
      // Handle one-way booking
      else if (location.state.flight) {
        setFlight(location.state.flight);
        setSearchParams(location.state.searchParams);
        
        // Get selected seats if available
        if (location.state.selectedSeats) {
          setSelectedSeats(location.state.selectedSeats);
        }
      } else {
        navigate('/');
        return;
      }
      
      const passengerCount = parseInt(location.state.searchParams?.passengers) || 1;
      
      // Initialize passengers array
      const initialPassengers = Array.from({ length: passengerCount }, (_, index) => {
        // Auto-fill first passenger with user data if authenticated
        if (index === 0 && isAuthenticated && user) {
          const userDoc = user.documents?.[0];
          return {
            title: user.personalInfo?.title || 'Mr',
            firstName: user.personalInfo?.firstName || '',
            lastName: user.personalInfo?.lastName || '',
            dateOfBirth: user.personalInfo?.dateOfBirth ? new Date(user.personalInfo.dateOfBirth).toISOString().split('T')[0] : '',
            gender: user.personalInfo?.gender || 'male',
            nationality: 'Việt Nam',
            document: {
              type: userDoc?.type || 'national_id',
              number: userDoc?.number || '',
              expiryDate: userDoc?.expiryDate ? new Date(userDoc.expiryDate).toISOString().split('T')[0] : '',
              issuedCountry: 'Vietnam'
            },
            luggageWeight: '7', // 7kg hành lý xách tay miễn phí
            seatClass: 'economy'
          };
        }
        
        // Default empty passenger
        return {
          title: 'Mr',
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          gender: 'male',
          nationality: 'Việt Nam',
          document: {
            type: 'national_id',
            number: '',
            expiryDate: '',
            issuedCountry: 'Vietnam'
          },
          luggageWeight: '7',
          seatClass: 'economy'
        };
      });
      
      setPassengers(initialPassengers);
      
      // Auto-fill contact info if authenticated
      if (isAuthenticated && user) {
        setContactInfo({
          email: user.contactInfo?.email || '',
          phone: user.contactInfo?.phone || '',
          address: {
            street: user.contactInfo?.address?.street || '',
            city: user.contactInfo?.address?.city || '',
            country: user.contactInfo?.address?.country || 'Vietnam',
            zipCode: user.contactInfo?.address?.zipCode || ''
          }
        });
      }
    } else {
      navigate('/');
    }
  }, [location, navigate, isAuthenticated, user]);

  const updatePassenger = (index, field, value) => {
    const updatedPassengers = [...passengers];
    
    // Handle nested document fields
    if (field.startsWith('document.')) {
      const documentField = field.split('.')[1];
      updatedPassengers[index] = {
        ...updatedPassengers[index],
        document: {
          ...updatedPassengers[index].document,
          [documentField]: value
        }
      };
    } else {
      updatedPassengers[index] = {
        ...updatedPassengers[index],
        [field]: value
      };
    }
    
    setPassengers(updatedPassengers);
  };

  const updateContactInfo = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setContactInfo(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setContactInfo(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    passengers.forEach((passenger, index) => {
      if (!passenger.firstName) {
        newErrors[`passenger_${index}_firstName`] = 'Vui lòng nhập tên';
      }
      if (!passenger.lastName) {
        newErrors[`passenger_${index}_lastName`] = 'Vui lòng nhập họ';
      }
      if (!passenger.dateOfBirth) {
        newErrors[`passenger_${index}_dateOfBirth`] = 'Vui lòng nhập ngày sinh';
      }
      if (!passenger.gender) {
        newErrors[`passenger_${index}_gender`] = 'Vui lòng chọn giới tính';
      }
      
      // Validate document
      if (!passenger.document?.type) {
        newErrors[`passenger_${index}_documentType`] = 'Vui lòng chọn loại giấy tờ';
      }
      if (!passenger.document?.number) {
        newErrors[`passenger_${index}_documentNumber`] = 'Vui lòng nhập số giấy tờ';
      } else if (passenger.document.number.length < 6 || passenger.document.number.length > 20) {
        newErrors[`passenger_${index}_documentNumber`] = 'Số giấy tờ phải có từ 6-20 ký tự';
      }
      if (!passenger.document?.expiryDate) {
        newErrors[`passenger_${index}_documentExpiry`] = 'Vui lòng nhập ngày hết hạn';
      } else {
        const expiryDate = new Date(passenger.document.expiryDate);
        const today = new Date();
        if (expiryDate <= today) {
          newErrors[`passenger_${index}_documentExpiry`] = 'Giấy tờ đã hết hạn';
        }
      }
      if (!passenger.document?.issuedCountry) {
        newErrors[`passenger_${index}_documentCountry`] = 'Vui lòng nhập quốc gia cấp giấy tờ';
      }
    });

    if (!contactInfo.email) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(contactInfo.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    if (!contactInfo.phone) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(contactInfo.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      // Prepare flights array according to backend schema
      const flights = [];
      if (isRoundTrip) {
        flights.push({
          flightId: outboundFlight._id,
          seatClass: passengers[0]?.seatClass || 'economy'
        });
        flights.push({
          flightId: returnFlight._id,
          seatClass: passengers[0]?.seatClass || 'economy'
        });
      } else {
        flights.push({
          flightId: flight._id,
          seatClass: passengers[0]?.seatClass || 'economy'
        });
      }

      const bookingData = {
        flights,
        passengers: passengers.map(p => ({
          title: p.title,
          firstName: p.firstName,
          lastName: p.lastName,
          dateOfBirth: p.dateOfBirth,
          gender: p.gender,
          nationality: p.nationality,
          document: {
            type: p.document.type,
            number: p.document.number,
            expiryDate: p.document.expiryDate,
            issuedCountry: p.document.issuedCountry
          }
        })),
        contactInfo: {
          email: contactInfo.email,
          phone: contactInfo.phone
        },
        paymentMethod,
        // Thêm payment code nếu có
        paymentCode: appliedPaymentCode ? appliedPaymentCode.code : undefined,
        // Thêm promo code nếu có
        promoCode: appliedPromoCode ? appliedPromoCode.code : undefined
      };

      console.log('Sending booking data:', bookingData);

      const response = await axiosInstance.post('/bookings', bookingData);
      
      // Kiểm tra có payment URL không (MoMo/VNPay/ZaloPay)
      if (response.data.data?.paymentInfo?.paymentUrl) {
        // Lưu booking ID vào sessionStorage để dùng sau khi payment callback
        sessionStorage.setItem('pendingBookingId', response.data.data.booking._id);
        sessionStorage.setItem('pendingBookingRef', response.data.data.booking.bookingReference);
        
        // Redirect tới trang thanh toán
        window.location.href = response.data.data.paymentInfo.paymentUrl;
        return;
      }
      
      // Nếu không có payment URL (thanh toán sau), chuyển thẳng đến confirmation
      navigate('/payment-confirmation', {
        state: {
          booking: response.data.data.booking,
          status: 'success'
        }
      });
      
    } catch (error) {
      console.error('Booking error:', error);
      const errorMsg = error.response?.data?.error || 'Có lỗi xảy ra khi đặt vé. Vui lòng thử lại.';
      setErrors({ general: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };
  
  // Calculate luggage cost
  const calculateLuggageCost = () => {
    const luggagePrices = {
      '7': 0,
      '15': 200000,
      '20': 350000,
      '25': 500000,
      '30': 650000
    };
    
    return passengers.reduce((total, passenger) => {
      return total + (luggagePrices[passenger.luggageWeight] || 0);
    }, 0);
  };

  const handlePromoApplied = (promoData) => {
    setPromoDiscount(promoData.discount || 0);
    setAppliedPromoCode(promoData);
  };

  const handlePromoRemoved = () => {
    setPromoDiscount(0);
    setAppliedPromoCode(null);
  };

  const handlePaymentCodeApplied = (discountAmount, codeInfo) => {
    setPaymentCodeDiscount(discountAmount);
    setAppliedPaymentCode(codeInfo);
  };

  if (!flight && !outboundFlight) {
    return (
      <div className="max-w-7xl mx-auto px-5 py-5">
        <div>Loading...</div>
      </div>
    );
  }
  
  const isRoundTrip = !!(outboundFlight && returnFlight);
  const flightPrice = isRoundTrip 
    ? ((outboundFlight.fare?.totalPrice || 0) + (returnFlight.fare?.totalPrice || 0)) * passengers.length
    : (flight?.fare?.totalPrice || 0) * passengers.length;
  const luggageCost = calculateLuggageCost();
  
  // Tính breakdown chi tiết
  const baseFare = Math.floor(flightPrice * 0.826); // 82.6% là giá vé cơ bản
  const taxes = Math.floor(flightPrice * 0.055);    // 5.5% là thuế
  const fees = flightPrice - baseFare - taxes;      // Phần còn lại là phí dịch vụ
  const seatSelectionCost = passengers.reduce((total, p) => {
    return total + (p.seatNumber && p.seatNumber !== 'N/A' ? 35000 : 0); // 35k cho mỗi ghế đã chọn
  }, 0);
  
  const subtotal = flightPrice + luggageCost + seatSelectionCost;
  const totalPrice = subtotal - promoDiscount - paymentCodeDiscount;

  if (bookingSuccess) {
    return (
      <div className="max-w-7xl mx-auto px-5 py-5">
        <div className="bg-green-100 text-green-800 px-4 py-4 rounded-lg mb-5 flex items-center gap-2">
          <Check size={24} />
          <div>
            <strong>Đặt vé thành công!</strong>
            <div>Mã đặt vé: {bookingSuccess.bookingReference}</div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Chi tiết đặt vé</h2>
          <p className="mb-2">Email xác nhận đã được gửi đến: {contactInfo.email}</p>
          <p className="mb-4">Bạn có thể quản lý đặt vé bằng mã: <strong>{bookingSuccess.bookingReference}</strong></p>
          
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-gradient-to-br from-[#EE0033] to-[#CC0000] text-white border-none px-4 py-4 rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg mt-5"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-5 py-5">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 bg-transparent border-none text-primary-500 text-base cursor-pointer mb-5 px-0 py-2 hover:underline"
        >
          <ArrowLeft size={20} />
          Quay lại kết quả tìm kiếm
        </button>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        {/* Main Content */}
        <div className="flex flex-col gap-6">
          {/* Flight Info Section */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-gray-800 text-xl mb-5 flex items-center gap-2">
              <Plane size={24} />
              Thông tin chuyến bay
            </h2>
            
            {/* Outbound Flight or Single Flight */}
            {isRoundTrip ? (
              <>
                {/* Outbound Flight */}
                <div className="flex justify-between items-center px-4 py-4 bg-blue-50 rounded-lg mb-4">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-primary-500 mb-2">CHUYẾN ĐI</div>
                    <div className="text-lg font-semibold text-gray-800 mb-1">
                      {outboundFlight.route?.departure?.airport?.location?.city?.vi || outboundFlight.route?.departure?.airport?.name?.vi} 
                      {' → '}
                      {outboundFlight.route?.arrival?.airport?.location?.city?.vi || outboundFlight.route?.arrival?.airport?.name?.vi}
                    </div>
                    <div className="text-gray-500 text-sm flex items-center gap-2">
                      <span>{outboundFlight.flightNumber}</span>
                      <span>•</span>
                      <span>{formatTime(outboundFlight.route?.departure?.time)} - {formatTime(outboundFlight.route?.arrival?.time)}</span>
                    </div>
                    {selectedSeats && selectedSeats.length > 0 && (
                      <div className="text-sm text-green-600 mt-2 font-medium">
                        ✓ Đã chọn ghế: {selectedSeats.join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-500">
                      {formatPrice(outboundFlight.fare?.totalPrice || 0)}
                    </div>
                    <div className="text-gray-500 text-xs">1 người</div>
                  </div>
                </div>
                
                {/* Return Flight */}
                <div className="flex justify-between items-center px-4 py-4 bg-green-50 rounded-lg mb-4">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-green-600 mb-2">CHUYẾN VỀ</div>
                    <div className="text-lg font-semibold text-gray-800 mb-1">
                      {returnFlight.route?.departure?.airport?.location?.city?.vi || returnFlight.route?.departure?.airport?.name?.vi} 
                      {' → '}
                      {returnFlight.route?.arrival?.airport?.location?.city?.vi || returnFlight.route?.arrival?.airport?.name?.vi}
                    </div>
                    <div className="text-gray-500 text-sm flex items-center gap-2">
                      <span>{returnFlight.flightNumber}</span>
                      <span>•</span>
                      <span>{formatTime(returnFlight.route?.departure?.time)} - {formatTime(returnFlight.route?.arrival?.time)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {formatPrice(returnFlight.fare?.totalPrice || 0)}
                    </div>
                    <div className="text-gray-500 text-xs">1 người</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex justify-between items-center px-4 py-4 bg-gray-50 rounded-lg mb-4">
                <div className="flex-1">
                  <div className="text-lg font-semibold text-gray-800 mb-1">
                    {flight.route?.departure?.airport?.location?.city?.vi || flight.route?.departure?.airport?.name?.vi} 
                    {' → '}
                    {flight.route?.arrival?.airport?.location?.city?.vi || flight.route?.arrival?.airport?.name?.vi}
                  </div>
                  <div className="text-gray-500 text-sm">
                    {flight.flightNumber} • {formatTime(flight.route?.departure?.time)} - {formatTime(flight.route?.arrival?.time)}
                  </div>
                  {selectedSeats && selectedSeats.length > 0 && (
                    <div className="text-sm text-green-600 mt-2 font-medium">
                      ✓ Đã chọn ghế: {selectedSeats.join(', ')}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-500">
                    {formatPrice(flight.fare?.totalPrice || 0)}
                  </div>
                  <div className="text-gray-500 text-xs">1 người</div>
                </div>
              </div>
            )}
          </div>

          {/* Passenger Info Section */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-gray-800 text-xl mb-5 flex items-center gap-2">
              <User size={24} />
              Thông tin hành khách
            </h2>
            
            <div className="flex flex-col gap-4">
              {passengers.map((passenger, index) => (
                <div key={index} className="border-2 border-gray-100 rounded-lg p-5">
                  <h3 className="text-gray-800 text-base mb-4 font-semibold">
                    Hành khách {index + 1}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_1fr] gap-4 mb-4">
                    <div className="flex flex-col">
                      <label className="text-sm text-gray-500 mb-1.5 font-medium">Danh xưng</label>
                      <select
                        value={passenger.title}
                        onChange={(e) => updatePassenger(index, 'title', e.target.value)}
                        className="px-3 py-3 border-2 border-gray-300 rounded-md text-sm bg-white transition-colors focus:outline-none focus:border-primary-500"
                      >
                        <option value="Mr">Ông</option>
                        <option value="Ms">Cô</option>
                        <option value="Mrs">Bà</option>
                      </select>
                    </div>
                    
                    <div className="flex flex-col">
                      <label className="text-sm text-gray-500 mb-1.5 font-medium">Tên *</label>
                      <input
                        type="text"
                        value={passenger.firstName}
                        onChange={(e) => updatePassenger(index, 'firstName', e.target.value)}
                        className={`px-3 py-3 border-2 rounded-md text-sm transition-colors focus:outline-none focus:border-primary-500 ${
                          errors[`passenger_${index}_firstName`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors[`passenger_${index}_firstName`] && (
                        <div className="text-red-500 text-xs mt-1">{errors[`passenger_${index}_firstName`]}</div>
                      )}
                    </div>
                    
                    <div className="flex flex-col">
                      <label className="text-sm text-gray-500 mb-1.5 font-medium">Họ *</label>
                      <input
                        type="text"
                        value={passenger.lastName}
                        onChange={(e) => updatePassenger(index, 'lastName', e.target.value)}
                        className={`px-3 py-3 border-2 rounded-md text-sm transition-colors focus:outline-none focus:border-primary-500 ${
                          errors[`passenger_${index}_lastName`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors[`passenger_${index}_lastName`] && (
                        <div className="text-red-500 text-xs mt-1">{errors[`passenger_${index}_lastName`]}</div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex flex-col">
                      <label className="text-sm text-gray-500 mb-1.5 font-medium">Ngày sinh *</label>
                      <input
                        type="date"
                        value={passenger.dateOfBirth}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e) => updatePassenger(index, 'dateOfBirth', e.target.value)}
                        className={`px-3 py-3 border-2 rounded-md text-sm transition-colors focus:outline-none focus:border-red-500 ${
                          errors[`passenger_${index}_dateOfBirth`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors[`passenger_${index}_dateOfBirth`] && (
                        <div className="text-red-500 text-xs mt-1">{errors[`passenger_${index}_dateOfBirth`]}</div>
                      )}
                    </div>
                    
                    <div className="flex flex-col">
                      <label className="text-sm text-gray-500 mb-1.5 font-medium">Giới tính *</label>
                      <select
                        value={passenger.gender}
                        onChange={(e) => updatePassenger(index, 'gender', e.target.value)}
                        className={`px-3 py-3 border-2 rounded-md text-sm bg-white transition-colors focus:outline-none focus:border-red-500 ${
                          errors[`passenger_${index}_gender`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                      </select>
                      {errors[`passenger_${index}_gender`] && (
                        <div className="text-red-500 text-xs mt-1">{errors[`passenger_${index}_gender`]}</div>
                      )}
                    </div>
                  </div>

                  {/* Document Information */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Thông tin giấy tờ tùy thân *</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex flex-col">
                        <label className="text-sm text-gray-500 mb-1.5 font-medium">Loại giấy tờ *</label>
                        <select
                          value={passenger.document?.type || 'national_id'}
                          onChange={(e) => updatePassenger(index, 'document.type', e.target.value)}
                          className={`px-3 py-3 border-2 rounded-md text-sm bg-white transition-colors focus:outline-none focus:border-primary-500 ${
                            errors[`passenger_${index}_documentType`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="national_id">CCCD/CMND</option>
                          <option value="passport">Hộ chiếu</option>
                        </select>
                        {errors[`passenger_${index}_documentType`] && (
                          <div className="text-red-500 text-xs mt-1">{errors[`passenger_${index}_documentType`]}</div>
                        )}
                      </div>
                      
                      <div className="flex flex-col">
                        <label className="text-sm text-gray-500 mb-1.5 font-medium">Số giấy tờ *</label>
                        <input
                          type="text"
                          placeholder={passenger.document?.type === 'passport' ? 'Nhập số hộ chiếu' : 'Nhập 9 hoặc 12 số'}
                          value={passenger.document?.number || ''}
                          onChange={(e) => updatePassenger(index, 'document.number', e.target.value)}
                          className={`px-3 py-3 border-2 rounded-md text-sm transition-colors focus:outline-none focus:border-primary-500 ${
                            errors[`passenger_${index}_documentNumber`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors[`passenger_${index}_documentNumber`] && (
                          <div className="text-red-500 text-xs mt-1">{errors[`passenger_${index}_documentNumber`]}</div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <label className="text-sm text-gray-500 mb-1.5 font-medium">Ngày hết hạn *</label>
                        <input
                          type="date"
                          value={passenger.document?.expiryDate || ''}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => updatePassenger(index, 'document.expiryDate', e.target.value)}
                          className={`px-3 py-3 border-2 rounded-md text-sm transition-colors focus:outline-none focus:border-primary-500 ${
                            errors[`passenger_${index}_documentExpiry`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors[`passenger_${index}_documentExpiry`] && (
                          <div className="text-red-500 text-xs mt-1">{errors[`passenger_${index}_documentExpiry`]}</div>
                        )}
                      </div>
                      
                      <div className="flex flex-col">
                        <label className="text-sm text-gray-500 mb-1.5 font-medium">Quốc gia cấp *</label>
                        <input
                          type="text"
                          placeholder="Ví dụ: Vietnam"
                          value={passenger.document?.issuedCountry || ''}
                          onChange={(e) => updatePassenger(index, 'document.issuedCountry', e.target.value)}
                          className={`px-3 py-3 border-2 rounded-md text-sm transition-colors focus:outline-none focus:border-primary-500 ${
                            errors[`passenger_${index}_documentCountry`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors[`passenger_${index}_documentCountry`] && (
                          <div className="text-red-500 text-xs mt-1">{errors[`passenger_${index}_documentCountry`]}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex flex-col">
                      <label className="text-sm text-gray-500 mb-1.5 font-medium">Hành lý ký gửi</label>
                      <select
                        value={passenger.luggageWeight}
                        onChange={(e) => updatePassenger(index, 'luggageWeight', e.target.value)}
                        className="px-3 py-3 border-2 border-gray-300 rounded-md text-sm bg-white transition-colors focus:outline-none focus:border-red-500"
                      >
                        <option value="7">Không (7kg xách tay miễn phí)</option>
                        <option value="15">15kg (+200,000đ)</option>
                        <option value="20">20kg (+350,000đ)</option>
                        <option value="25">25kg (+500,000đ)</option>
                        <option value="30">30kg (+650,000đ)</option>
                      </select>
                      <div className="text-xs text-gray-500 mt-1">Hành lý xách tay 7kg luôn được miễn phí</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Info Section */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-gray-800 text-xl mb-5">Thông tin liên hệ</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-sm text-gray-500 mb-1.5 font-medium">Email *</label>
                <input
                  type="email"
                  value={contactInfo.email}
                  onChange={(e) => updateContactInfo('email', e.target.value)}
                  className={`px-3 py-3 border-2 rounded-md text-sm transition-colors focus:outline-none focus:border-primary-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.email && <div className="text-red-500 text-xs mt-1">{errors.email}</div>}
              </div>
              
              <div className="flex flex-col">
                <label className="text-sm text-gray-500 mb-1.5 font-medium">Số điện thoại *</label>
                <input
                  type="tel"
                  value={contactInfo.phone}
                  onChange={(e) => updateContactInfo('phone', e.target.value)}
                  className={`px-3 py-3 border-2 rounded-md text-sm transition-colors focus:outline-none focus:border-primary-500 ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.phone && <div className="text-red-500 text-xs mt-1">{errors.phone}</div>}
              </div>
            </div>
          </div>

          {/* Payment Method Section */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-gray-800 text-xl mb-5 flex items-center gap-2">
              <CreditCard size={24} />
              Phương thức thanh toán
            </h2>
            
            <div className="flex flex-col gap-3">
              {/* MoMo Payment - Only Option */}
              <label className="flex items-center px-4 py-4 border-2 border-[#a50064] bg-pink-50 rounded-lg">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="momo"
                  checked={true}
                  readOnly
                  className="mr-3 accent-[#a50064]"
                />
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 bg-[#a50064] rounded-lg flex items-center justify-center text-white font-bold text-xl">
                    M
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800 mb-0.5 flex items-center gap-2">
                      Ví MoMo
                      <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded">Khuyến nghị</span>
                    </div>
                    <div className="text-xs text-gray-500">Thanh toán nhanh chóng, an toàn với MoMo</div>
                  </div>
                </div>
              </label>
              
              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-2">
                <div className="flex gap-3">
                  <div className="text-blue-600">ℹ️</div>
                  <div className="flex-1">
                    <div className="font-semibold text-blue-800 text-sm mb-1">Hướng dẫn thanh toán MoMo:</div>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Quét mã QR hoặc nhập số điện thoại MoMo</li>
                      <li>• Xác nhận thanh toán trên ứng dụng MoMo</li>
                      <li>• Nhận vé điện tử qua email ngay sau khi thanh toán thành công</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-5">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-gray-800 text-xl mb-5">Tóm tắt đơn hàng</h2>
            
            <div className="border-t border-gray-100 pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500">Giá vé cơ bản</span>
                <span className="text-gray-800">{formatPrice(baseFare)}</span>
              </div>
              
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500">Thuế</span>
                <span className="text-gray-800">{formatPrice(taxes)}</span>
              </div>
              
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500">Phí dịch vụ</span>
                <span className="text-gray-800">{formatPrice(fees)}</span>
              </div>
              
              {luggageCost > 0 && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-500">Hành lý ký gửi</span>
                  <span className="text-gray-800">{formatPrice(luggageCost)}</span>
                </div>
              )}
              
              {seatSelectionCost > 0 && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-500">Chọn ghế</span>
                  <span className="text-gray-800">{formatPrice(seatSelectionCost)}</span>
                </div>
              )}
              
              {promoDiscount > 0 && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-green-600">Giảm giá ({appliedPromoCode?.code})</span>
                  <span className="text-green-600">-{formatPrice(promoDiscount)}</span>
                </div>
              )}
              
              {paymentCodeDiscount > 0 && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-green-600">Mã thanh toán ({appliedPaymentCode?.code})</span>
                  <span className="text-green-600">-{formatPrice(paymentCodeDiscount)}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center font-semibold text-lg text-gray-800 pt-2 border-t border-gray-100">
                <span>Tổng cộng</span>
                <span className="text-[#EE0033] text-2xl">{formatPrice(totalPrice)}</span>
              </div>
            </div>

            {/* Promo Code Input */}
            <div className="mt-4">
              <PromoCodeInput
                totalAmount={subtotal}
                onPromoApplied={handlePromoApplied}
                onPromoRemoved={handlePromoRemoved}
                routeId={isRoundTrip ? outboundFlight?.route?._id : flight?.route?._id}
                airlineId={isRoundTrip ? outboundFlight?.airline?._id : flight?.airline?._id}
              />
            </div>

            {/* Payment Code Input */}
            <div className="mt-4">
              <PaymentCodeInput
                totalAmount={subtotal - promoDiscount}
                onApplyCode={handlePaymentCodeApplied}
              />
            </div>

            {isAuthenticated && user && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm text-green-700 flex items-center gap-2">
                  <Check size={16} />
                  <span>Thông tin đã được tự động điền từ tài khoản của bạn</span>
                </div>
              </div>
            )}

            {errors.general && (
              <div className="text-red-500 text-xs mt-4 flex items-center gap-2">
                <AlertCircle size={16} />
                {errors.general}
              </div>
            )}

            {/* Terms and Conditions */}
            <div className="mt-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-[#EE0033]"
                />
                <span className="text-sm text-gray-600">
                  Tôi đã đọc và đồng ý với{' '}
                  <a href="/terms" target="_blank" className="text-[#EE0033] hover:underline">
                    Điều khoản sử dụng
                  </a>
                  {' '}và{' '}
                  <a href="/privacy" target="_blank" className="text-[#EE0033] hover:underline">
                    Chính sách bảo mật
                  </a>
                </span>
              </label>
              {!agreedToTerms && errors.terms && (
                <div className="text-red-500 text-xs mt-1 ml-7">
                  {errors.terms}
                </div>
              )}
            </div>

            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || !agreedToTerms}
              className="w-full bg-gradient-to-br from-[#EE0033] to-[#CC0000] text-white border-none px-4 py-4 rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg mt-5 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Thanh toán qua MoMo'}
            </button>
            
            {!agreedToTerms && (
              <p className="text-xs text-gray-500 text-center mt-2">
                Vui lòng đồng ý với điều khoản để tiếp tục
              </p>
            )}
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </>
  );
};

export default BookingPage;
