import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import Header from '../components/Header';
import flightService from '../services/flightService';

const FlightSearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [flights, setFlights] = useState([]);
  const [returnFlights, setReturnFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('departure');
  const [searchParams, setSearchParams] = useState({});
  const [selectedFlightId, setSelectedFlightId] = useState(null);
  const [selectedOutboundFlight, setSelectedOutboundFlight] = useState(null);
  const [bookingStep, setBookingStep] = useState('outbound'); // 'outbound' or 'return'
  const [showSeatSelectionModal, setShowSeatSelectionModal] = useState(false);
  const [tempSelectedFlight, setTempSelectedFlight] = useState(null);

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
      
      // Use flightService instead of direct axios call
      const response = await flightService.searchFlights({
        from: params.from,
        to: params.to,
        departureDate: params.departureDate,
        returnDate: params.returnDate,
        passengers: params.passengers,
        tripType: params.tripType
      });
      
      console.log('Flight search response:', response);
      
      // Handle response structure from ApiResponse.success
      if (response.success && response.data) {
        setFlights(response.data.outboundFlights || []);
        
        // For round-trip, also set return flights
        if (params.tripType === 'round-trip' && response.data.returnFlights) {
          setReturnFlights(response.data.returnFlights || []);
        }
      } else {
        setFlights([]);
        setReturnFlights([]);
      }
    } catch (error) {
      console.error('Error searching flights:', error);
      setFlights([]);
      setReturnFlights([]);
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
        return sorted.sort((a, b) => (a.fare?.totalPrice || 0) - (b.fare?.totalPrice || 0));
      case 'duration':
        return sorted.sort((a, b) => (a.route?.duration?.scheduled || 0) - (b.route?.duration?.scheduled || 0));
      case 'departure':
      default:
        return sorted.sort((a, b) => 
          new Date(a.route?.departure?.time) - new Date(b.route?.departure?.time)
        );
    }
  };

  const handleSelectFlight = (flight) => {
    console.log('Selected flight:', flight);
    console.log('Search params:', searchParams);
    
    setSelectedFlightId(flight._id);
    setTempSelectedFlight(flight);
    
    // For round-trip, handle outbound and return flight selection
    if (searchParams.tripType === 'round-trip') {
      if (bookingStep === 'outbound') {
        // Selected outbound flight, now show return flights
        setSelectedOutboundFlight(flight);
        setBookingStep('return');
        setSelectedFlightId(null);
        setTempSelectedFlight(null);
        // Scroll to top to show return flight selection
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Selected return flight, show modal to choose seat or skip
        setShowSeatSelectionModal(true);
      }
    } else {
      // One-way trip, show modal to choose seat or skip
      setShowSeatSelectionModal(true);
    }
  };
  
  const handleProceedWithSeats = () => {
    const isRoundTrip = searchParams.tripType === 'round-trip';
    
    if (isRoundTrip && bookingStep === 'return') {
      // Round trip - go to seat selection with both flights
      navigate('/seat-selection', { 
        state: { 
          outboundFlight: selectedOutboundFlight,
          returnFlight: tempSelectedFlight,
          searchParams 
        } 
      });
    } else {
      // One-way - go to seat selection with single flight
      navigate('/seat-selection', { 
        state: { 
          flight: tempSelectedFlight,
          searchParams 
        } 
      });
    }
    setShowSeatSelectionModal(false);
  };
  
  const handleSkipSeats = () => {
    const isRoundTrip = searchParams.tripType === 'round-trip';
    
    if (isRoundTrip && bookingStep === 'return') {
      // Round trip - go to booking with both flights
      navigate('/booking', { 
        state: { 
          outboundFlight: selectedOutboundFlight,
          returnFlight: tempSelectedFlight,
          searchParams 
        } 
      });
    } else {
      // One-way - go to booking with single flight
      navigate('/booking', { 
        state: { 
          flight: tempSelectedFlight,
          searchParams 
        } 
      });
    }
    setShowSeatSelectionModal(false);
  };
  
  const handleBackToOutbound = () => {
    setBookingStep('outbound');
    setSelectedOutboundFlight(null);
    setSelectedFlightId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sortedFlights = sortFlights(
    bookingStep === 'outbound' ? flights : returnFlights, 
    sortBy
  );
  
  const isRoundTrip = searchParams.tripType === 'round-trip';
  const showingReturnFlights = isRoundTrip && bookingStep === 'return';

  if (loading) {
    return (
      <>
        <Header />
        <div className="max-w-7xl mx-auto px-5 py-5">
          <div className="text-center py-10 text-gray-500 text-lg">
            Đang tìm kiếm chuyến bay...
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-5 py-5">
      
      {/* Flight Selection Step Indicator for Round Trip */}
      {isRoundTrip && (
        <div className="bg-white rounded-xl p-5 mb-5 shadow-lg">
          <div className="flex items-center justify-center gap-4">
            <div className={`flex items-center gap-2 ${bookingStep === 'outbound' ? 'text-[#EE0033] font-semibold' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bookingStep === 'outbound' ? 'bg-[#EE0033] text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span>Chọn chuyến đi</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center gap-2 ${bookingStep === 'return' ? 'text-[#EE0033] font-semibold' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bookingStep === 'return' ? 'bg-[#EE0033] text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span>Chọn chuyến về</span>
            </div>
          </div>
        </div>
      )}

      {/* Selected Outbound Flight Display */}
      {showingReturnFlights && selectedOutboundFlight && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5 mb-5">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">✓ Chuyến đi đã chọn</h3>
              <div className="text-gray-600">
                {selectedOutboundFlight.flightNumber} • {formatTime(selectedOutboundFlight.route?.departure?.time)} - {formatTime(selectedOutboundFlight.route?.arrival?.time)} • {formatPrice(selectedOutboundFlight.fare?.totalPrice || 0)}
              </div>
            </div>
            <button
              onClick={handleBackToOutbound}
              className="px-4 py-2 bg-white border-2 border-[#EE0033] text-[#EE0033] rounded-lg hover:bg-red-50 transition-colors font-semibold"
            >
              Đổi chuyến đi
            </button>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-xl p-5 mb-5 shadow-lg">
        <h2 className="text-gray-800 mb-2 text-2xl font-semibold">
          {showingReturnFlights ? (
            `${searchParams.to} → ${searchParams.from}`
          ) : (
            `${searchParams.from} → ${searchParams.to}`
          )}
        </h2>
        <div className="text-gray-500 text-base">
          {showingReturnFlights ? searchParams.returnDate : searchParams.departureDate} • {searchParams.passengers} hành khách
        </div>
      </div>

      {(flights.length > 0 || returnFlights.length > 0) && (
        <div className="flex gap-5 mb-5 flex-col md:flex-row">
          <select
            className="px-4 py-3 border-2 border-gray-300 rounded-lg text-sm bg-white cursor-pointer focus:outline-none focus:border-primary-500"
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="departure">Sắp xếp theo giờ khởi hành</option>
            <option value="price">Sắp xếp theo giá</option>
            <option value="duration">Sắp xếp theo thời gian bay</option>
          </select>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {sortedFlights.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-2">Không tìm thấy chuyến bay</h3>
            <p className="text-gray-500">Vui lòng thử với các tiêu chí tìm kiếm khác.</p>
          </div>
        ) : (
          sortedFlights.map((flight) => (
            <div 
              key={flight._id}
              className="bg-white rounded-xl p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-[#EE0033] text-lg font-semibold m-0">
                  {flight.airline?.name || 'VietJet Air'}
                </h3>
                <span className="text-gray-500 text-sm bg-gray-100 px-2 py-1 rounded">
                  {flight.flightNumber}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto] gap-5 items-center mb-5">
                <div className="text-center md:text-left">
                  <div className="text-2xl font-semibold text-gray-800 mb-1">
                    {formatTime(flight.route?.departure?.time)}
                  </div>
                  <div className="text-gray-500 text-base mb-0.5">
                    {flight.route?.departure?.airport?.location?.city?.vi || 
                     flight.route?.departure?.airport?.name?.vi}
                  </div>
                  <div className="text-gray-500 text-sm">
                    {flight.route?.departure?.airport?.code?.iata}
                  </div>
                </div>
                
                <div className="flex items-center flex-col gap-2">
                  <div className="text-gray-500 text-sm text-center">
                    {formatDuration(flight.route?.duration?.scheduled || 0)}
                  </div>
                  <div className="text-[#EE0033] flex items-center">
                    <ArrowRight size={20} />
                  </div>
                </div>
                
                <div className="text-center md:text-right">
                  <div className="text-2xl font-semibold text-gray-800 mb-1">
                    {formatTime(flight.route?.arrival?.time)}
                  </div>
                  <div className="text-gray-500 text-base mb-0.5">
                    {flight.route?.arrival?.airport?.location?.city?.vi || 
                     flight.route?.arrival?.airport?.name?.vi}
                  </div>
                  <div className="text-gray-500 text-sm">
                    {flight.route?.arrival?.airport?.code?.iata}
                  </div>
                </div>
                
                <div className="text-center md:text-right">
                  <div className="text-3xl font-bold text-[#EE0033] mb-1">
                    {formatPrice(flight.fare?.totalPrice || 0)}
                  </div>
                  <div className="text-gray-500 text-xs">
                    1 người lớn
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <div className="text-gray-500 text-sm">
                  Còn {flight.availableSeats || 0} ghế trống
                </div>
                <button 
                  onClick={() => handleSelectFlight(flight)}
                  disabled={selectedFlightId === flight._id}
                  className="bg-gradient-to-br from-[#EE0033] to-[#CC0000] text-white border-none px-6 py-3 rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {selectedFlightId === flight._id ? 'Đang chuyển...' : (showingReturnFlights ? 'Chọn chuyến về' : 'Chọn chuyến bay')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      </div>
      
      {/* Seat Selection Modal */}
      {showSeatSelectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-fade-in">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Chọn ghế ngồi</h3>
            <p className="text-gray-600 mb-6">
              Bạn có muốn chọn ghế ngồi trước khi tiếp tục đặt vé không?
            </p>
            
            <div className="space-y-3">
              <button
                onClick={handleProceedWithSeats}
                className="w-full bg-gradient-to-br from-[#EE0033] to-[#CC0000] text-white px-6 py-4 rounded-lg text-base font-semibold hover:shadow-lg transition-all duration-300"
              >
                Chọn ghế ngồi
              </button>
              
              <button
                onClick={handleSkipSeats}
                className="w-full bg-white border-2 border-gray-300 text-gray-700 px-6 py-4 rounded-lg text-base font-semibold hover:bg-gray-50 transition-all duration-300"
              >
                Bỏ qua (Chọn sau)
              </button>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </>
  );
};

export default FlightSearchResults;
