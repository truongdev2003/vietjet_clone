import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import BookingPage from './pages/BookingPage';
import FlightSearchResults from './pages/FlightSearchResults';
import Home from './pages/Home';
import ManageBooking from './pages/ManageBooking';

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #2d3436;
    background-color: #f8f9fa;
  }

  button {
    font-family: inherit;
  }

  input, select {
    font-family: inherit;
  }
`;

const AppContainer = styled.div`
  min-height: 100vh;
`;

function App() {
  return (
    <Router>
      <GlobalStyle />
      <AppContainer>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<FlightSearchResults />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/checkin" element={<div>Check-in Page - Coming Soon</div>} />
          <Route path="/manage" element={<ManageBooking />} />
          <Route path="/promotions" element={<div>Promotions Page - Coming Soon</div>} />
        </Routes>
      </AppContainer>
    </Router>
  );
}

export default App;
