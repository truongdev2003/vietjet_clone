import axios from 'axios';
import { ArrowLeftRight, MapPin, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const SearchContainer = styled.div`
  background: white;
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  margin: -50px auto 0;
  max-width: 1000px;
  position: relative;
  z-index: 10;
`;

const SearchForm = styled.form`
  display: grid;
  grid-template-columns: 1fr auto 1fr auto auto auto;
  gap: 20px;
  align-items: end;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 15px;
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
`;

const Label = styled.label`
  font-size: 14px;
  color: #636e72;
  margin-bottom: 8px;
  font-weight: 500;
`;

const Input = styled.input`
  padding: 15px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #00b894;
  }
`;

const AutocompleteContainer = styled.div`
  position: relative;
`;

const AutocompleteInput = styled(Input)`
  padding-left: 45px;
`;

const InputIcon = styled.div`
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #636e72;
  z-index: 1;
`;

const SuggestionsList = styled.ul`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #ddd;
  border-top: none;
  border-radius: 0 0 8px 8px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  list-style: none;
  padding: 0;
  margin: 0;
`;

const SuggestionItem = styled.li`
  padding: 12px 15px;
  cursor: pointer;
  border-bottom: 1px solid #f1f3f4;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #f8f9fa;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const SuggestionText = styled.div`
  font-weight: 500;
  color: #2d3436;
`;

const SuggestionSubtext = styled.div`
  font-size: 12px;
  color: #636e72;
`;

const ErrorMessage = styled.div`
  color: #e17055;
  font-size: 12px;
  margin-top: 4px;
`;

const Select = styled.select`
  padding: 15px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  background: white;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #00b894;
  }
`;

const SwapButton = styled.button`
  background: #00b894;
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 10px;
  
  &:hover {
    background: #00a085;
    transform: rotate(180deg);
  }
  
  @media (max-width: 768px) {
    margin: 0 auto;
  }
`;

const SearchButton = styled.button`
  background: linear-gradient(135deg, #00b894, #00a085);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 184, 148, 0.3);
  }
`;

const TripTypeSelector = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
`;

const TripTypeOption = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 500;
  color: ${props => props.selected ? '#00b894' : '#636e72'};
`;

const RadioInput = styled.input`
  accent-color: #00b894;
`;

// Airport Autocomplete Component
const AirportAutocomplete = ({ label, value, onChange, placeholder, error }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [airports, setAirports] = useState([]);

  useEffect(() => {
    // Fetch airports from API
    const fetchAirports = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/airports');
        setAirports(response.data);
      } catch (error) {
        console.error('Error fetching airports:', error);
      }
    };

    fetchAirports();
  }, []);

  useEffect(() => {
    if (query.length > 0) {
      const filtered = airports.filter(airport =>
        airport.code.toLowerCase().includes(query.toLowerCase()) ||
        airport.name.toLowerCase().includes(query.toLowerCase()) ||
        airport.city.toLowerCase().includes(query.toLowerCase())
      );
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
    setQuery(`${airport.city} (${airport.code})`);
    onChange(airport.code);
    setShowSuggestions(false);
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for click events
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <InputGroup>
      <Label>{label}</Label>
      <AutocompleteContainer>
        <InputIcon>
          <MapPin size={18} />
        </InputIcon>
        <AutocompleteInput
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length > 0 && setShowSuggestions(true)}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          style={{ borderColor: error ? '#e17055' : undefined }}
        />
        {showSuggestions && suggestions.length > 0 && (
          <SuggestionsList>
            {suggestions.map((airport) => (
              <SuggestionItem
                key={airport._id}
                onClick={() => handleSuggestionClick(airport)}
              >
                <SuggestionText>{airport.city} ({airport.code})</SuggestionText>
                <SuggestionSubtext>{airport.name}</SuggestionSubtext>
              </SuggestionItem>
            ))}
          </SuggestionsList>
        )}
      </AutocompleteContainer>
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </InputGroup>
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
    <SearchContainer>
      <TripTypeSelector>
        <TripTypeOption selected={tripType === 'round-trip'}>
          <RadioInput
            type="radio"
            name="tripType"
            value="round-trip"
            checked={tripType === 'round-trip'}
            onChange={(e) => setTripType(e.target.value)}
          />
          Khứ hồi
        </TripTypeOption>
        <TripTypeOption selected={tripType === 'one-way'}>
          <RadioInput
            type="radio"
            name="tripType"
            value="one-way"
            checked={tripType === 'one-way'}
            onChange={(e) => setTripType(e.target.value)}
          />
          Một chiều
        </TripTypeOption>
      </TripTypeSelector>

      <SearchForm onSubmit={handleSubmit}>
        <AirportAutocomplete
          label="Từ"
          value={fromCity}
          onChange={setFromCity}
          placeholder="Chọn điểm đi"
          error={errors.fromCity}
        />

        <SwapButton type="button" onClick={handleSwapCities}>
          <ArrowLeftRight size={20} />
        </SwapButton>

        <AirportAutocomplete
          label="Đến"
          value={toCity}
          onChange={setToCity}
          placeholder="Chọn điểm đến"
          error={errors.toCity}
        />

        <InputGroup>
          <Label>Ngày đi</Label>
          <Input
            type="date"
            value={departDate}
            onChange={(e) => setDepartDate(e.target.value)}
            min={today}
            style={{ borderColor: errors.departDate ? '#e17055' : undefined }}
          />
          {errors.departDate && <ErrorMessage>{errors.departDate}</ErrorMessage>}
        </InputGroup>

        {tripType === 'round-trip' && (
          <InputGroup>
            <Label>Ngày về</Label>
            <Input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              min={departDate || today}
              style={{ borderColor: errors.returnDate ? '#e17055' : undefined }}
            />
            {errors.returnDate && <ErrorMessage>{errors.returnDate}</ErrorMessage>}
          </InputGroup>
        )}

        <InputGroup>
          <Label>Hành khách</Label>
          <Select
            value={passengers}
            onChange={(e) => setPassengers(parseInt(e.target.value))}
          >
            {[...Array(9)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1} người
              </option>
            ))}
          </Select>
        </InputGroup>

        <SearchButton type="submit">
          <Search size={20} />
          Tìm chuyến bay
        </SearchButton>
      </SearchForm>
    </SearchContainer>
  );
};

export default FlightSearchForm;