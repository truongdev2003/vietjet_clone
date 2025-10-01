import axios from 'axios';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const SearchResultsContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const SearchSummary = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const SummaryText = styled.h2`
  color: #2d3436;
  margin-bottom: 10px;
  font-size: 24px;
`;

const SearchDetails = styled.div`
  color: #636e72;
  font-size: 16px;
`;

const FilterSortContainer = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: white;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #00b894;
    color: #00b894;
  }
  
  &.active {
    background: #00b894;
    color: white;
    border-color: #00b894;
  }
`;

const SortSelect = styled.select`
  padding: 12px 16px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #00b894;
  }
`;

const FlightsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FlightCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }
`;

const FlightHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 20px;
`;

const AirlineName = styled.h3`
  color: #00b894;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
`;

const FlightNumber = styled.span`
  color: #636e72;
  font-size: 14px;
  background: #f8f9fa;
  padding: 4px 8px;
  border-radius: 4px;
`;

const FlightDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr auto;
  gap: 20px;
  align-items: center;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
    text-align: center;
  }
`;

const TimeLocation = styled.div`
  text-align: ${props => props.align || 'left'};
`;

const Time = styled.div`
  font-size: 24px;
  font-weight: 600;
  color: #2d3436;
  margin-bottom: 4px;
`;

const Location = styled.div`
  color: #636e72;
  font-size: 16px;
  margin-bottom: 2px;
`;

const LocationCode = styled.div`
  color: #636e72;
  font-size: 14px;
`;

const FlightPath = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 8px;
  
  @media (max-width: 768px) {
    flex-direction: row;
    justify-content: center;
  }
`;

const Duration = styled.div`
  color: #636e72;
  font-size: 14px;
  text-align: center;
`;

const PlaneIcon = styled.div`
  color: #00b894;
  display: flex;
  align-items: center;
`;

const PriceSection = styled.div`
  text-align: right;
  
  @media (max-width: 768px) {
    text-align: center;
  }
`;

const Price = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: #00b894;
  margin-bottom: 4px;
`;

const PriceNote = styled.div`
  color: #636e72;
  font-size: 12px;
`;

const SeatInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f1f3f4;
`;

const AvailableSeats = styled.div`
  color: #636e72;
  font-size: 14px;
`;

const SelectButton = styled.button`
  background: linear-gradient(135deg, #00b894, #00a085);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 184, 148, 0.3);
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #636e72;
  font-size: 18px;
`;

const NoResults = styled.div`
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const FlightSearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('departure');
  const [searchParams, setSearchParams] = useState({});

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const params = {
      from: urlParams.get('from'),
      to: urlParams.get('to'),
      departureDate: urlParams.get('departureDate'),
      returnDate: urlParams.get('returnDate'),
      passengers: urlParams.get('passengers') || '1',
      tripType: urlParams.get('tripType') || 'one-way'
    };
    
    setSearchParams(params);
    searchFlights(params);
  }, [location.search]);

  const searchFlights = async (params) => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/flights/search', {
        params: {
          from: params.from,
          to: params.to,
          departureDate: params.departureDate,
          returnDate: params.returnDate,
          passengers: params.passengers,
          tripType: params.tripType
        }
      });
      
      setFlights(response.data.outbound || []);
    } catch (error) {
      console.error('Error searching flights:', error);
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

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const sortFlights = (flights, sortBy) => {
    const sorted = [...flights];
    switch (sortBy) {
      case 'price':
        return sorted.sort((a, b) => a.price.economy - b.price.economy);
      case 'duration':
        return sorted.sort((a, b) => a.duration - b.duration);
      case 'departure':
      default:
        return sorted.sort((a, b) => new Date(a.departure.time) - new Date(b.departure.time));
    }
  };

  const handleSelectFlight = (flight) => {
    // Navigate to booking page with flight details
    navigate('/booking', { 
      state: { 
        flight,
        searchParams 
      } 
    });
  };

  const sortedFlights = sortFlights(flights, sortBy);

  if (loading) {
    return (
      <SearchResultsContainer>
        <LoadingMessage>Đang tìm kiếm chuyến bay...</LoadingMessage>
      </SearchResultsContainer>
    );
  }

  return (
    <SearchResultsContainer>
      <SearchSummary>
        <SummaryText>
          {searchParams.from} → {searchParams.to}
        </SummaryText>
        <SearchDetails>
          {searchParams.departureDate} • {searchParams.passengers} hành khách
          {searchParams.tripType === 'round-trip' && ` • Về ${searchParams.returnDate}`}
        </SearchDetails>
      </SearchSummary>

      {flights.length > 0 && (
        <FilterSortContainer>
          <SortSelect 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="departure">Sắp xếp theo giờ khởi hành</option>
            <option value="price">Sắp xếp theo giá</option>
            <option value="duration">Sắp xếp theo thời gian bay</option>
          </SortSelect>
        </FilterSortContainer>
      )}

      <FlightsList>
        {sortedFlights.length === 0 ? (
          <NoResults>
            <h3>Không tìm thấy chuyến bay</h3>
            <p>Vui lòng thử với các tiêu chí tìm kiếm khác.</p>
          </NoResults>
        ) : (
          sortedFlights.map((flight) => (
            <FlightCard key={flight._id}>
              <FlightHeader>
                <AirlineName>{flight.airline}</AirlineName>
                <FlightNumber>{flight.flightNumber}</FlightNumber>
              </FlightHeader>
              
              <FlightDetails>
                <TimeLocation>
                  <Time>{formatTime(flight.departure.time)}</Time>
                  <Location>{flight.departure.airport.city}</Location>
                  <LocationCode>{flight.departure.airport.code}</LocationCode>
                </TimeLocation>
                
                <FlightPath>
                  <Duration>{formatDuration(flight.duration)}</Duration>
                  <PlaneIcon>
                    <ArrowRight size={20} />
                  </PlaneIcon>
                </FlightPath>
                
                <TimeLocation align="right">
                  <Time>{formatTime(flight.arrival.time)}</Time>
                  <Location>{flight.arrival.airport.city}</Location>
                  <LocationCode>{flight.arrival.airport.code}</LocationCode>
                </TimeLocation>
                
                <PriceSection>
                  <Price>{formatPrice(flight.price.economy)}</Price>
                  <PriceNote>1 người lớn</PriceNote>
                </PriceSection>
              </FlightDetails>
              
              <SeatInfo>
                <AvailableSeats>
                  Còn {flight.seats.economy.available} ghế trống
                </AvailableSeats>
                <SelectButton onClick={() => handleSelectFlight(flight)}>
                  Chọn chuyến bay
                </SelectButton>
              </SeatInfo>
            </FlightCard>
          ))
        )}
      </FlightsList>
    </SearchResultsContainer>
  );
};

export default FlightSearchResults;