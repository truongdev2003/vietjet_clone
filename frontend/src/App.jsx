import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import AdminRoute from "./components/AdminRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import useCSRF from "./hooks/useCSRF";
import AboutPage from "./pages/AboutPage";
import BoardingPass from "./pages/BoardingPass";
import BookingDetailPage from "./pages/BookingDetailPage";
import BookingLookupPage from "./pages/BookingLookupPage";
import BookingPage from "./pages/BookingPage";
import BookingSuccess from "./pages/BookingSuccess";
import CheckInPage from "./pages/CheckInPage";
import ContactPage from "./pages/ContactPage";
import EmailVerification from "./pages/EmailVerification";
import FAQPage from "./pages/FAQPage";
import FlightSearchResults from "./pages/FlightSearchResults";
import FlightStatusPage from "./pages/FlightStatusPage";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";
import Login from "./pages/Login";
import ManageBooking from "./pages/ManageBooking";
import MyBookingsPage from "./pages/MyBookingsPage";
import NotFoundPage from "./pages/NotFoundPage";
import PaymentConfirmation from "./pages/PaymentConfirmation";
import PaymentResultPage from "./pages/PaymentResultPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import SeatSelection from "./pages/SeatSelection";
import TermsOfService from "./pages/TermsOfService";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProfile from "./pages/admin/AdminProfile";
import AircraftManagement from "./pages/admin/AircraftManagement";
import AirportManagement from "./pages/admin/AirportManagement";
import BannerManagement from "./pages/admin/BannerManagement";
import BookingManagement from "./pages/admin/BookingManagement";
import CheckinManagement from "./pages/admin/CheckinManagement";
import FareManagement from "./pages/admin/FareManagement";
import FlightManagement from "./pages/admin/FlightManagement";
import PaymentCodeManagement from "./pages/admin/PaymentCodeManagement";
import PaymentManagement from "./pages/admin/PaymentManagement";
import Reports from "./pages/admin/Reports";
import RouteManagement from "./pages/admin/RouteManagement";
import SeatManagement from "./pages/admin/SeatManagement";
import UserManagement from "./pages/admin/UserManagement";

function AppContent() {
  // Initialize CSRF token
  useCSRF();

  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<FlightSearchResults />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-email" element={<EmailVerification />} />

        {/* New Pages */}
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/payment-confirmation" element={<PaymentConfirmation />} />
        <Route path="/payment/confirmation" element={<PaymentConfirmation />} />
        <Route path="/payment/:result" element={<PaymentResultPage />} />
        <Route
          path="/booking/success/:bookingId"
          element={<BookingSuccess />}
        />
        <Route path="/boarding-pass" element={<BoardingPass />} />
        <Route
          path="/seat-selection"
          element={
            <ProtectedRoute>
              <SeatSelection />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        {/* Booking page - allow both guest and authenticated users */}
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/booking/lookup" element={<BookingLookupPage />} />
        <Route path="/booking/:id" element={<BookingDetailPage />} />
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute>
              <MyBookingsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/checkin" element={<CheckInPage />} />
        <Route path="/flight-status" element={<FlightStatusPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route
          path="/manage"
          element={
            <ProtectedRoute>
              <ManageBooking />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <AdminRoute>
              <AdminProfile />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <UserManagement />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/bookings"
          element={
            <AdminRoute>
              <BookingManagement />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/flights"
          element={
            <AdminRoute>
              <FlightManagement />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/airports"
          element={
            <AdminRoute>
              <AirportManagement />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/routes"
          element={
            <AdminRoute>
              <RouteManagement />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/aircraft"
          element={
            <AdminRoute>
              <AircraftManagement />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/fares"
          element={
            <AdminRoute>
              <FareManagement />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <AdminRoute>
              <Reports />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/payments"
          element={
            <AdminRoute>
              <PaymentManagement />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/payment-codes"
          element={
            <AdminRoute>
              <PaymentCodeManagement />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/checkin"
          element={
            <AdminRoute>
              <CheckinManagement />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/seats"
          element={
            <AdminRoute>
              <SeatManagement />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/banners"
          element={
            <AdminRoute>
              <BannerManagement />
            </AdminRoute>
          }
        />

        {/* 404 - Not Found Route (must be last) */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
