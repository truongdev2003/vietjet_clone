import { ArrowLeftRight, MapPin, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import airportService from '../services/airportService';

// Airport Autocomplete Component
const AirportAutocomplete = ({ label, value, onChange, placeholder, error }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [airports, setAirports] = useState([]);

  useEffect(() => {
    // Fetch airports from API using service layer
    const fetchAirports = async () => {
      try {
        const response = await airportService.getPublicAirports();
        // API returns { success, message, data: { airports: [...], pagination: {...} } }
        const airportsData = response?.data?.airports || [];
        setAirports(airportsData);
      } catch (error) {
        console.error('Error fetching airports:', error);
        setAirports([]); // Set empty array on error
      }
    };

    fetchAirports();
  }, []);

  useEffect(() => {
    if (query.length > 0) {
      const filtered = airports.filter(airport => {
        // Safely handle airport.code (can be string or object {iata, icao})
        const code = typeof airport.code === 'object' 
          ? (airport.code?.iata || airport.code?.icao || '') 
          : (airport.code || '');
        
        // Safely handle airport.name (can be string or object {vi, en})
        const name = typeof airport.name === 'object'
          ? (airport.name?.vi || airport.name?.en || '')
          : (airport.name || '');
        
        // Safely handle airport.city (can be string or object {vi, en})
        const city = typeof airport.city === 'object'
          ? (airport.city?.vi || airport.city?.en || '')
          : (airport.city || '');
        
        const searchQuery = query.toLowerCase();
        return (
          code.toLowerCase().includes(searchQuery) ||
          name.toLowerCase().includes(searchQuery) ||
          city.toLowerCase().includes(searchQuery)
        );
      });
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query, airports]);

  const handleInputChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
  };

  const handleSuggestionClick = (airport) => {
    // Safely extract airport data
    const code = typeof airport.code === 'object' 
      ? (airport.code?.iata || airport.code?.icao || '') 
      : (airport.code || '');
    
    const city = typeof airport.city === 'object'
      ? (airport.city?.vi || airport.city?.en || '')
      : (airport.city || '');
    
    setQuery(`${city} (${code})`);
    onChange(code);
    setShowSuggestions(false);
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for click events
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="flex flex-col relative">
      <label className="text-sm text-gray-600 mb-2 font-medium">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
          <MapPin size={18} />
        </div>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length > 0 && setShowSuggestions(true)}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className={`pl-12 pr-4 py-4 border-2 rounded-lg text-base transition-all duration-300 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 w-full ${
            error ? 'border-red-400' : 'border-gray-300'
          }`}
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute top-full left-0 right-0 bg-white border-2 border-gray-200 border-t-0 rounded-b-lg max-h-60 overflow-y-auto z-[1000] list-none p-0 m-0 shadow-lg">
            {suggestions.map((airport) => {
              // Safely extract airport data for display
              const code = typeof airport.code === 'object' 
                ? (airport.code?.iata || airport.code?.icao || '') 
                : (airport.code || '');
              
              const city = typeof airport.city === 'object'
                ? (airport.city?.vi || airport.city?.en || '')
                : (airport.city || '');
              
              const name = typeof airport.name === 'object'
                ? (airport.name?.vi || airport.name?.en || '')
                : (airport.name || '');
              
              return (
                <li
                  key={airport._id}
                  onClick={() => handleSuggestionClick(airport)}
                  className="p-3 cursor-pointer border-b border-gray-100 transition-colors duration-200 hover:bg-red-50 last:border-b-0"
                >
                  <div className="font-semibold text-gray-800">{city} ({code})</div>
                  <div className="text-xs text-gray-500 mt-1">{name}</div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
    </div>
  );
};

const FlightSearchForm = () => {
  const navigate = useNavigate();
  const [tripType, setTripType] = useState('round-trip');
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!fromCity) {
      newErrors.fromCity = 'Vui lòng chọn điểm đi';
    }
    if (!toCity) {
      newErrors.toCity = 'Vui lòng chọn điểm đến';
    }
    if (fromCity === toCity) {
      newErrors.toCity = 'Điểm đến phải khác điểm đi';
    }
    if (!departDate) {
      newErrors.departDate = 'Vui lòng chọn ngày đi';
    }
    if (tripType === 'round-trip' && !returnDate) {
      newErrors.returnDate = 'Vui lòng chọn ngày về';
    }
    if (departDate && returnDate && new Date(returnDate) <= new Date(departDate)) {
      newErrors.returnDate = 'Ngày về phải sau ngày đi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSwapCities = () => {
    const temp = fromCity;
    setFromCity(toCity);
    setToCity(temp);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Handle search logic here
      const searchParams = {
        from: fromCity,
        to: toCity,
        departureDate: departDate,
        returnDate: tripType === 'round-trip' ? returnDate : null,
        passengers,
        tripType
      };
      
      console.log('Searching flights...', searchParams);
      
      // Navigate to search results page
      const queryParams = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          queryParams.append(key, value);
        }
      });
      
      navigate(`/search?${queryParams.toString()}`);
    }
  };

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-2xl mx-auto max-w-6xl">
      <div className="flex gap-6 mb-6">
        <label className={`flex items-center gap-2 cursor-pointer font-medium transition-colors ${
          tripType === 'round-trip' ? 'text-red-600' : 'text-gray-500 hover:text-gray-700'
        }`}>
          <input
            type="radio"
            name="tripType"
            value="round-trip"
            checked={tripType === 'round-trip'}
            onChange={(e) => setTripType(e.target.value)}
            className="accent-red-600 w-4 h-4"
          />
          <span className="text-base">Khứ hồi</span>
        </label>
        <label className={`flex items-center gap-2 cursor-pointer font-medium transition-colors ${
          tripType === 'one-way' ? 'text-red-600' : 'text-gray-500 hover:text-gray-700'
        }`}>
          <input
            type="radio"
            name="tripType"
            value="one-way"
            checked={tripType === 'one-way'}
            onChange={(e) => setTripType(e.target.value)}
            className="accent-red-600 w-4 h-4"
          />
          <span className="text-base">Một chiều</span>
        </label>
      </div>

      <form 
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
          {/* From Airport */}
          <div className="relative">
            <AirportAutocomplete
              label="Điểm đi"
              value={fromCity}
              onChange={setFromCity}
              placeholder="Chọn sân bay đi"
              error={errors.fromCity}
            />
          </div>

          {/* Swap button - positioned between inputs */}
          <button 
            type="button" 
            onClick={handleSwapCities}
            style={{
              bottom: -18
            }}
            className="absolute left-1/2   transform -translate-x-1/2 -translate-y-1/2 bg-red-600 border-none rounded-full w-12 h-12 hidden md:flex items-center justify-center text-white cursor-pointer transition-all duration-300 hover:bg-red-700 hover:rotate-180 shadow-lg z-20"
          >
            <ArrowLeftRight size={20} />
          </button>

          {/* To Airport */}
          <div className="relative">
            <AirportAutocomplete
              label="Điểm đến"
              value={toCity}
              onChange={setToCity}
              placeholder="Chọn sân bay đến"
              error={errors.toCity}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Departure Date */}
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-2 font-medium">Ngày đi</label>
            <input
              type="date"
              value={departDate}
              onChange={(e) => setDepartDate(e.target.value)}
              min={today}
              className={`p-4 border-2 rounded-lg text-base transition-all duration-300 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 ${
                errors.departDate ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.departDate && <div className="text-red-500 text-xs mt-1">{errors.departDate}</div>}
          </div>

          {/* Return Date */}
          {tripType === 'round-trip' && (
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-2 font-medium">Ngày về</label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                min={departDate || today}
                className={`p-4 border-2 rounded-lg text-base transition-all duration-300 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 ${
                  errors.returnDate ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {errors.returnDate && <div className="text-red-500 text-xs mt-1">{errors.returnDate}</div>}
            </div>
          )}

          {/* Passengers */}
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-2 font-medium">Số hành khách</label>
            <select
              value={passengers}
              onChange={(e) => setPassengers(parseInt(e.target.value))}
              className="p-4 border-2 border-gray-300 rounded-lg text-base bg-white transition-all duration-300 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 cursor-pointer"
            >
              {[...Array(9)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} {i === 0 ? 'người' : 'người'}
                </option>
              ))}
            </select>
          </div>

          {/* Search Button */}
          <button 
            type="submit"
            className="bg-gradient-to-r from-red-600 to-red-500 text-white border-none px-8 py-4 rounded-lg text-base font-bold cursor-pointer flex items-center justify-center gap-2 transition-all duration-300 hover:from-red-700 hover:to-red-600 hover:shadow-xl hover:scale-105 md:col-span-1"
          >
            <Search size={20} />
            Tìm chuyến bay
          </button>
        </div>
      </form>
    </div>
  );
};

export default FlightSearchForm;