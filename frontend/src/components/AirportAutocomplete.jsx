import { MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import airportService from '../services/airportService';

const AirportAutocomplete = ({ label, value, onChange, placeholder, error, className = '' }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [airports, setAirports] = useState([]);

  useEffect(() => {
    // Fetch airports from API using airportService
    const fetchAirports = async () => {
      try {
        const response = await airportService.getPublicAirports();
        // API returns { success, message, data: { airports: [...], pagination: {...} } }
        const airportsData = response.data?.airports || response.airports || [];
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
    // Also update parent with the raw input
    onChange(newQuery);
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
    <div className={`flex flex-col relative ${className}`}>
      {label && (
        <label className="text-sm text-gray-600 mb-2 font-medium flex items-center gap-2">
          <MapPin size={18} />
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length > 0 && setShowSuggestions(true)}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className={`w-full px-4 py-3 border-2 rounded-lg text-base transition-all duration-300 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 ${
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

export default AirportAutocomplete;
