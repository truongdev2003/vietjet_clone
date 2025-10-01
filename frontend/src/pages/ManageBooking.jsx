import axios from 'axios';
import { CheckCircle, CreditCard, Search, User, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const ManageContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
`;

const SearchSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const SearchTitle = styled.h2`
  color: #2d3436;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SearchForm = styled.form`
  display: flex;
  gap: 16px;
  align-items: end;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
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
  font-size: 16px;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #00b894;
  }
`;

const SearchButton = styled.button`
  background: linear-gradient(135deg, #00b894, #00a085);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 184, 148, 0.3);
  }
  
  &:disabled {
    background: #ddd;
    cursor: not-allowed;
    transform: none;
  }
`;

const BookingResult = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const BookingHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f3f4;
`;

const BookingReference = styled.h3`
  color: #00b894;
  font-size: 24px;
  margin: 0;
`;

const StatusBadge = styled.span`
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  
  &.confirmed {
    background: #d4edda;
    color: #155724;
  }
  
  &.cancelled {
    background: #f8d7da;
    color: #721c24;
  }
  
  &.checked_in {
    background: #d1ecf1;
    color: #0c5460;
  }
`;

const BookingDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const DetailSection = styled.div``;

const SectionTitle = styled.h4`
  color: #2d3436;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DetailItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f8f9fa;
  
  &:last-child {
    border-bottom: none;
  }
`;

const DetailLabel = styled.span`
  color: #636e72;
  font-size: 14px;
`;

const DetailValue = styled.span`
  color: #2d3436;
  font-weight: 500;
`;

const FlightInfo = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
`;

const FlightRoute = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #2d3436;
  margin-bottom: 8px;
`;

const FlightTime = styled.div`
  color: #636e72;
  font-size: 14px;
  margin-bottom: 4px;
`;

const PassengersList = styled.div`
  margin-top: 16px;
`;

const PassengerItem = styled.div`
  background: #f8f9fa;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 8px;
`;

const PassengerName = styled.div`
  font-weight: 600;
  color: #2d3436;
  margin-bottom: 4px;
`;

const PassengerDetails = styled.div`
  color: #636e72;
  font-size: 12px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid #f1f3f4;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ActionButton = styled.button`
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &.primary {
    background: linear-gradient(135deg, #00b894, #00a085);
    color: white;
    border: none;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 184, 148, 0.3);
    }
  }
  
  &.secondary {
    background: white;
    color: #636e72;
    border: 2px solid #ddd;
    
    &:hover {
      border-color: #00b894;
      color: #00b894;
    }
  }
  
  &.danger {
    background: white;
    color: #e17055;
    border: 2px solid #e17055;
    
    &:hover {
      background: #e17055;
      color: white;
    }
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }
`;

const ErrorMessage = styled.div`
  background: #f8d7da;
  color: #721c24;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
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

const ManageBooking = () => {
  const navigate = useNavigate();
  const [searchData, setSearchData] = useState({
    bookingReference: '',
    email: ''
  });
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (field, value) => {
    setSearchData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await axios.get(`http://localhost:5000/api/bookings/${searchData.bookingReference}`);
      
      // Verify email matches
      if (response.data.contactInfo.email.toLowerCase() !== searchData.email.toLowerCase()) {
        setError('Email không khớp với thông tin đặt vé');
        setBooking(null);
        return;
      }
      
      setBooking(response.data);
    } catch (error) {
      console.error('Search error:', error);
      if (error.response?.status === 404) {
        setError('Không tìm thấy mã đặt vé');
      } else {
        setError('Có lỗi xảy ra khi tìm kiếm');
      }
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setLoading(true);
      const response = await axios.put(`http://localhost:5000/api/bookings/${booking.bookingReference}/checkin`);
      
      setBooking(response.data.booking);
      setSuccessMessage('Check-in thành công!');
    } catch (error) {
      console.error('Check-in error:', error);
      setError('Có lỗi xảy ra khi check-in');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đặt vé này?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.put(`http://localhost:5000/api/bookings/${booking.bookingReference}/cancel`);
      
      setBooking(response.data.booking);
      setSuccessMessage('Hủy đặt vé thành công!');
    } catch (error) {
      console.error('Cancel error:', error);
      setError('Có lỗi xảy ra khi hủy đặt vé');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Đã xác nhận';
      case 'cancelled': return 'Đã hủy';
      case 'checked_in': return 'Đã check-in';
      default: return status;
    }
  };

  const canCheckIn = booking && booking.status === 'confirmed' && !booking.checkedIn;
  const canCancel = booking && booking.status === 'confirmed';

  return (
    <ManageContainer>
      <SearchSection>
        <SearchTitle>
          <Search size={24} />
          Quản lý đặt vé
        </SearchTitle>
        
        <SearchForm onSubmit={handleSearch}>
          <InputGroup>
            <Label>Mã đặt vé</Label>
            <Input
              type="text"
              value={searchData.bookingReference}
              onChange={(e) => handleInputChange('bookingReference', e.target.value.toUpperCase())}
              placeholder="VD: VJ123ABC"
              required
            />
          </InputGroup>
          
          <InputGroup>
            <Label>Email</Label>
            <Input
              type="email"
              value={searchData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="email@example.com"
              required
            />
          </InputGroup>
          
          <SearchButton type="submit" disabled={loading}>
            <Search size={16} />
            {loading ? 'Đang tìm...' : 'Tìm kiếm'}
          </SearchButton>
        </SearchForm>
      </SearchSection>

      {error && (
        <ErrorMessage>
          <XCircle size={20} />
          {error}
        </ErrorMessage>
      )}

      {successMessage && (
        <SuccessMessage>
          <CheckCircle size={20} />
          {successMessage}
        </SuccessMessage>
      )}

      {booking && (
        <BookingResult>
          <BookingHeader>
            <BookingReference>{booking.bookingReference}</BookingReference>
            <StatusBadge className={booking.status}>
              {getStatusText(booking.status)}
            </StatusBadge>
          </BookingHeader>

          <FlightInfo>
            <FlightRoute>
              {booking.flight.departure.airport.city} → {booking.flight.arrival.airport.city}
            </FlightRoute>
            <FlightTime>
              {booking.flight.flightNumber} • {formatDate(booking.flight.departure.time)} • 
              {formatTime(booking.flight.departure.time)} - {formatTime(booking.flight.arrival.time)}
            </FlightTime>
          </FlightInfo>

          <BookingDetails>
            <DetailSection>
              <SectionTitle>
                <User size={16} />
                Thông tin liên hệ
              </SectionTitle>
              <DetailItem>
                <DetailLabel>Email</DetailLabel>
                <DetailValue>{booking.contactInfo.email}</DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel>Điện thoại</DetailLabel>
                <DetailValue>{booking.contactInfo.phone}</DetailValue>
              </DetailItem>
            </DetailSection>

            <DetailSection>
              <SectionTitle>
                <CreditCard size={16} />
                Thanh toán
              </SectionTitle>
              <DetailItem>
                <DetailLabel>Tổng tiền</DetailLabel>
                <DetailValue>{formatPrice(booking.totalAmount)}</DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel>Trạng thái</DetailLabel>
                <DetailValue>
                  {booking.paymentStatus === 'paid' ? 'Đã thanh toán' : 
                   booking.paymentStatus === 'refunded' ? 'Đã hoàn tiền' : 'Chưa thanh toán'}
                </DetailValue>
              </DetailItem>
            </DetailSection>
          </BookingDetails>

          <SectionTitle>
            <User size={16} />
            Hành khách ({booking.passengers.length})
          </SectionTitle>
          <PassengersList>
            {booking.passengers.map((passenger, index) => (
              <PassengerItem key={index}>
                <PassengerName>
                  {passenger.title} {passenger.firstName} {passenger.lastName}
                </PassengerName>
                <PassengerDetails>
                  {passenger.seatNumber && `Ghế: ${passenger.seatNumber} • `}
                  Hạng: {passenger.seatClass === 'economy' ? 'Phổ thông' : 'Thương gia'}
                </PassengerDetails>
              </PassengerItem>
            ))}
          </PassengersList>

          <ActionButtons>
            {canCheckIn && (
              <ActionButton 
                className="primary" 
                onClick={handleCheckIn}
                disabled={loading}
              >
                Check-in trực tuyến
              </ActionButton>
            )}
            
            <ActionButton 
              className="secondary"
              onClick={() => window.print()}
            >
              In vé
            </ActionButton>
            
            {canCancel && (
              <ActionButton 
                className="danger"
                onClick={handleCancel}
                disabled={loading}
              >
                Hủy đặt vé
              </ActionButton>
            )}
          </ActionButtons>
        </BookingResult>
      )}
    </ManageContainer>
  );
};

export default ManageBooking;