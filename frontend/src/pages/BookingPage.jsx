import axios from 'axios';
import { AlertCircle, ArrowLeft, Check, CreditCard, Plane, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const BookingContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: #00b894;
  font-size: 16px;
  cursor: pointer;
  margin-bottom: 20px;
  padding: 8px 0;
  
  &:hover {
    text-decoration: underline;
  }
`;

const BookingLayout = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;
  
  @media (max-width: 968px) {
    grid-template-columns: 1fr;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Section = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  color: #2d3436;
  font-size: 20px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const FlightSummary = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 16px;
`;

const FlightInfo = styled.div`
  flex: 1;
`;

const FlightRoute = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #2d3436;
  margin-bottom: 4px;
`;

const FlightDetails = styled.div`
  color: #636e72;
  font-size: 14px;
`;

const FlightPrice = styled.div`
  text-align: right;
`;

const Price = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #00b894;
`;

const PriceNote = styled.div`
  color: #636e72;
  font-size: 12px;
`;

const PassengerForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const PassengerCard = styled.div`
  border: 2px solid #f1f3f4;
  border-radius: 8px;
  padding: 20px;
`;

const PassengerTitle = styled.h3`
  color: #2d3436;
  font-size: 16px;
  margin-bottom: 16px;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: auto 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-size: 14px;
  color: #636e72;
  margin-bottom: 6px;
  font-weight: 500;
`;

const Input = styled.input`
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #00b894;
  }
  
  &.error {
    border-color: #e17055;
  }
`;

const Select = styled.select`
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #00b894;
  }
`;

const ContactSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const PaymentMethods = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PaymentOption = styled.label`
  display: flex;
  align-items: center;
  padding: 16px;
  border: 2px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #00b894;
  }
  
  &.selected {
    border-color: #00b894;
    background: #f0fdf9;
  }
`;

const PaymentRadio = styled.input`
  margin-right: 12px;
  accent-color: #00b894;
`;

const PaymentText = styled.div`
  flex: 1;
`;

const PaymentTitle = styled.div`
  font-weight: 600;
  color: #2d3436;
  margin-bottom: 2px;
`;

const PaymentDescription = styled.div`
  font-size: 12px;
  color: #636e72;
`;

const OrderSummary = styled.div`
  border-top: 1px solid #f1f3f4;
  padding-top: 16px;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  
  &.total {
    font-weight: 600;
    font-size: 18px;
    color: #2d3436;
    padding-top: 8px;
    border-top: 1px solid #f1f3f4;
  }
`;

const SummaryLabel = styled.span`
  color: #636e72;
`;

const SummaryValue = styled.span`
  color: #2d3436;
`;

const BookButton = styled.button`
  width: 100%;
  background: linear-gradient(135deg, #00b894, #00a085);
  color: white;
  border: none;
  padding: 16px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 20px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 184, 148, 0.3);
  }
  
  &:disabled {
    background: #ddd;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ErrorMessage = styled.div`
  color: #e17055;
  font-size: 12px;
  margin-top: 4px;
`;

const SuccessMessage = styled.div`
  background: #d4edda;
  color: #155724;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const BookingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [flight, setFlight] = useState(null);
  const [searchParams, setSearchParams] = useState({});
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
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  useEffect(() => {
    if (location.state && location.state.flight) {
      setFlight(location.state.flight);
      setSearchParams(location.state.searchParams);
      
      // Initialize passengers array
      const passengerCount = parseInt(location.state.searchParams.passengers) || 1;
      const initialPassengers = Array.from({ length: passengerCount }, () => ({
        title: 'Mr',
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        nationality: 'Vietnam',
        passportNumber: '',
        passportExpiry: '',
        seatClass: 'economy'
      }));
      setPassengers(initialPassengers);
    } else {
      // Redirect back if no flight data
      navigate('/');
    }
  }, [location, navigate]);

  const updatePassenger = (index, field, value) => {
    const updatedPassengers = [...passengers];
    updatedPassengers[index] = {
      ...updatedPassengers[index],
      [field]: value
    };
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

    // Validate passengers
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
      if (!passenger.passportNumber) {
        newErrors[`passenger_${index}_passportNumber`] = 'Vui lòng nhập số hộ chiếu';
      }
      if (!passenger.passportExpiry) {
        newErrors[`passenger_${index}_passportExpiry`] = 'Vui lòng nhập ngày hết hạn hộ chiếu';
      }
    });

    // Validate contact info
    if (!contactInfo.email) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(contactInfo.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    if (!contactInfo.phone) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      const bookingData = {
        flightId: flight._id,
        passengers,
        contactInfo,
        paymentMethod
      };

      const response = await axios.post('http://localhost:5000/api/bookings', bookingData);
      
      setBookingSuccess(response.data.booking);
      
    } catch (error) {
      console.error('Booking error:', error);
      setErrors({ general: 'Có lỗi xảy ra khi đặt vé. Vui lòng thử lại.' });
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

  if (!flight) {
    return (
      <BookingContainer>
        <div>Loading...</div>
      </BookingContainer>
    );
  }

  if (bookingSuccess) {
    return (
      <BookingContainer>
        <SuccessMessage>
          <Check size={24} />
          <div>
            <strong>Đặt vé thành công!</strong>
            <div>Mã đặt vé: {bookingSuccess.bookingReference}</div>
          </div>
        </SuccessMessage>
        
        <Section>
          <h2>Chi tiết đặt vé</h2>
          <p>Email xác nhận đã được gửi đến: {contactInfo.email}</p>
          <p>Bạn có thể quản lý đặt vé bằng mã: <strong>{bookingSuccess.bookingReference}</strong></p>
          
          <BookButton onClick={() => navigate('/')}>
            Về trang chủ
          </BookButton>
        </Section>
      </BookingContainer>
    );
  }

  const totalPrice = flight.price.economy * passengers.length;

  return (
    <BookingContainer>
      <BackButton onClick={() => navigate(-1)}>
        <ArrowLeft size={20} />
        Quay lại kết quả tìm kiếm
      </BackButton>

      <BookingLayout>
        <MainContent>
          <Section>
            <SectionTitle>
              <Plane size={24} />
              Thông tin chuyến bay
            </SectionTitle>
            
            <FlightSummary>
              <FlightInfo>
                <FlightRoute>
                  {flight.departure.airport.city} → {flight.arrival.airport.city}
                </FlightRoute>
                <FlightDetails>
                  {flight.flightNumber} • {formatTime(flight.departure.time)} - {formatTime(flight.arrival.time)}
                </FlightDetails>
              </FlightInfo>
              <FlightPrice>
                <Price>{formatPrice(flight.price.economy)}</Price>
                <PriceNote>1 người</PriceNote>
              </FlightPrice>
            </FlightSummary>
          </Section>

          <Section>
            <SectionTitle>
              <User size={24} />
              Thông tin hành khách
            </SectionTitle>
            
            <PassengerForm>
              {passengers.map((passenger, index) => (
                <PassengerCard key={index}>
                  <PassengerTitle>Hành khách {index + 1}</PassengerTitle>
                  
                  <FormRow>
                    <FormGroup>
                      <Label>Danh xưng</Label>
                      <Select
                        value={passenger.title}
                        onChange={(e) => updatePassenger(index, 'title', e.target.value)}
                      >
                        <option value="Mr">Ông</option>
                        <option value="Ms">Cô</option>
                        <option value="Mrs">Bà</option>
                      </Select>
                    </FormGroup>
                    
                    <FormGroup>
                      <Label>Tên *</Label>
                      <Input
                        type="text"
                        value={passenger.firstName}
                        onChange={(e) => updatePassenger(index, 'firstName', e.target.value)}
                        className={errors[`passenger_${index}_firstName`] ? 'error' : ''}
                      />
                      {errors[`passenger_${index}_firstName`] && (
                        <ErrorMessage>{errors[`passenger_${index}_firstName`]}</ErrorMessage>
                      )}
                    </FormGroup>
                    
                    <FormGroup>
                      <Label>Họ *</Label>
                      <Input
                        type="text"
                        value={passenger.lastName}
                        onChange={(e) => updatePassenger(index, 'lastName', e.target.value)}
                        className={errors[`passenger_${index}_lastName`] ? 'error' : ''}
                      />
                      {errors[`passenger_${index}_lastName`] && (
                        <ErrorMessage>{errors[`passenger_${index}_lastName`]}</ErrorMessage>
                      )}
                    </FormGroup>
                  </FormRow>

                  <FormRow>
                    <FormGroup>
                      <Label>Ngày sinh *</Label>
                      <Input
                        type="date"
                        value={passenger.dateOfBirth}
                        onChange={(e) => updatePassenger(index, 'dateOfBirth', e.target.value)}
                        className={errors[`passenger_${index}_dateOfBirth`] ? 'error' : ''}
                      />
                      {errors[`passenger_${index}_dateOfBirth`] && (
                        <ErrorMessage>{errors[`passenger_${index}_dateOfBirth`]}</ErrorMessage>
                      )}
                    </FormGroup>
                    
                    <FormGroup>
                      <Label>Quốc tịch</Label>
                      <Select
                        value={passenger.nationality}
                        onChange={(e) => updatePassenger(index, 'nationality', e.target.value)}
                      >
                        <option value="Vietnam">Việt Nam</option>
                        <option value="USA">Hoa Kỳ</option>
                        <option value="Japan">Nhật Bản</option>
                        <option value="Korea">Hàn Quốc</option>
                        <option value="Thailand">Thái Lan</option>
                        <option value="Singapore">Singapore</option>
                      </Select>
                    </FormGroup>
                  </FormRow>

                  <FormRow>
                    <FormGroup>
                      <Label>Số hộ chiếu *</Label>
                      <Input
                        type="text"
                        value={passenger.passportNumber}
                        onChange={(e) => updatePassenger(index, 'passportNumber', e.target.value)}
                        className={errors[`passenger_${index}_passportNumber`] ? 'error' : ''}
                      />
                      {errors[`passenger_${index}_passportNumber`] && (
                        <ErrorMessage>{errors[`passenger_${index}_passportNumber`]}</ErrorMessage>
                      )}
                    </FormGroup>
                    
                    <FormGroup>
                      <Label>Ngày hết hạn hộ chiếu *</Label>
                      <Input
                        type="date"
                        value={passenger.passportExpiry}
                        onChange={(e) => updatePassenger(index, 'passportExpiry', e.target.value)}
                        className={errors[`passenger_${index}_passportExpiry`] ? 'error' : ''}
                      />
                      {errors[`passenger_${index}_passportExpiry`] && (
                        <ErrorMessage>{errors[`passenger_${index}_passportExpiry`]}</ErrorMessage>
                      )}
                    </FormGroup>
                  </FormRow>
                </PassengerCard>
              ))}
            </PassengerForm>
          </Section>

          <Section>
            <SectionTitle>Thông tin liên hệ</SectionTitle>
            
            <ContactSection>
              <FormGroup>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={contactInfo.email}
                  onChange={(e) => updateContactInfo('email', e.target.value)}
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
              </FormGroup>
              
              <FormGroup>
                <Label>Số điện thoại *</Label>
                <Input
                  type="tel"
                  value={contactInfo.phone}
                  onChange={(e) => updateContactInfo('phone', e.target.value)}
                  className={errors.phone ? 'error' : ''}
                />
                {errors.phone && <ErrorMessage>{errors.phone}</ErrorMessage>}
              </FormGroup>
            </ContactSection>
          </Section>

          <Section>
            <SectionTitle>
              <CreditCard size={24} />
              Phương thức thanh toán
            </SectionTitle>
            
            <PaymentMethods>
              <PaymentOption className={paymentMethod === 'credit_card' ? 'selected' : ''}>
                <PaymentRadio
                  type="radio"
                  name="paymentMethod"
                  value="credit_card"
                  checked={paymentMethod === 'credit_card'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <PaymentText>
                  <PaymentTitle>Thẻ tín dụng/ghi nợ</PaymentTitle>
                  <PaymentDescription>Visa, Mastercard, JCB</PaymentDescription>
                </PaymentText>
              </PaymentOption>
              
              <PaymentOption className={paymentMethod === 'bank_transfer' ? 'selected' : ''}>
                <PaymentRadio
                  type="radio"
                  name="paymentMethod"
                  value="bank_transfer"
                  checked={paymentMethod === 'bank_transfer'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <PaymentText>
                  <PaymentTitle>Chuyển khoản ngân hàng</PaymentTitle>
                  <PaymentDescription>Chuyển khoản trực tiếp</PaymentDescription>
                </PaymentText>
              </PaymentOption>
              
              <PaymentOption className={paymentMethod === 'e_wallet' ? 'selected' : ''}>
                <PaymentRadio
                  type="radio"
                  name="paymentMethod"
                  value="e_wallet"
                  checked={paymentMethod === 'e_wallet'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <PaymentText>
                  <PaymentTitle>Ví điện tử</PaymentTitle>
                  <PaymentDescription>MoMo, ZaloPay, VNPay</PaymentDescription>
                </PaymentText>
              </PaymentOption>
            </PaymentMethods>
          </Section>
        </MainContent>

        <Sidebar>
          <Section>
            <SectionTitle>Tóm tắt đơn hàng</SectionTitle>
            
            <OrderSummary>
              <SummaryRow>
                <SummaryLabel>Vé máy bay ({passengers.length} người)</SummaryLabel>
                <SummaryValue>{formatPrice(totalPrice)}</SummaryValue>
              </SummaryRow>
              
              <SummaryRow>
                <SummaryLabel>Phí dịch vụ</SummaryLabel>
                <SummaryValue>0₫</SummaryValue>
              </SummaryRow>
              
              <SummaryRow className="total">
                <SummaryLabel>Tổng cộng</SummaryLabel>
                <SummaryValue>{formatPrice(totalPrice)}</SummaryValue>
              </SummaryRow>
            </OrderSummary>

            {errors.general && (
              <ErrorMessage style={{ marginTop: '16px' }}>
                <AlertCircle size={16} style={{ marginRight: '8px' }} />
                {errors.general}
              </ErrorMessage>
            )}

            <BookButton 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đặt vé'}
            </BookButton>
          </Section>
        </Sidebar>
      </BookingLayout>
    </BookingContainer>
  );
};

export default BookingPage;