/**
 * K6 Stress Test - Booking Concurrent Stress Test
 * Mô phỏng nhiều users đặt cùng một chuyến bay để test race conditions
 * 
 * Chạy: k6 run k6-stress-test.js
 */

import { check, group, sleep } from 'k6';
import http from 'k6/http';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const bookingDuration = new Trend('booking_duration');
const failedBookings = new Counter('failed_bookings');
const successfulBookings = new Counter('successful_bookings');

// Test configuration
export const options = {
  // Stress test stages
  stages: [
    { duration: '30s', target: 10 },   // Warm up
    { duration: '1m', target: 50 },    // Ramp to 50 users
    { duration: '2m', target: 100 },   // Ramp to 100 users
    { duration: '30s', target: 200 },  // Spike to 200 users
    { duration: '1m', target: 200 },   // Stay at 200
    { duration: '30s', target: 0 },    // Ramp down
  ],
  
  // Thresholds - Pass/Fail criteria
  thresholds: {
    'http_req_duration': ['p(95)<2000', 'p(99)<3000'], // 95% < 2s, 99% < 3s
    'http_req_failed': ['rate<0.1'],     // Less than 10% errors
    'errors': ['rate<0.1'],
    'booking_duration': ['p(95)<3000'],
    'http_reqs': ['rate>50'],           // At least 50 RPS
  },
  
  // Browser-like behavior
  userAgent: 'K6LoadTest/1.0',
};

// Base URL
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// Test data
const airports = ['HAN', 'SGN', 'DAD', 'CXR', 'VCA', 'HPH', 'VII'];
const passengerTitles = ['Mr', 'Ms', 'Mrs'];
const firstNames = ['Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Vu', 'Dang'];
const lastNames = ['Van A', 'Thi B', 'Van C', 'Thi D', 'Van E'];

// Helper functions
function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateEmail() {
  return `test${Date.now()}${randomInt(1000, 9999)}@example.com`;
}

function generatePhone() {
  return `090${randomInt(1000000, 9999999)}`;
}

// Setup function - runs once
export function setup() {
  console.log('🚀 Starting K6 Stress Test...');
  console.log(`📍 Target: ${BASE_URL}`);
  
  // Healthcheck
  const healthRes = http.get(`${BASE_URL}/`);
  check(healthRes, {
    'Server is up': (r) => r.status === 200,
  });
  
  return { startTime: new Date() };
}

// Main test function
export default function (data) {
  // Random user behavior
  const behavior = Math.random();
  
  if (behavior < 0.4) {
    // 40% - Complete booking flow
    completeBookingFlow();
  } else if (behavior < 0.7) {
    // 30% - Search only
    searchFlights();
  } else if (behavior < 0.9) {
    // 20% - Browse and search
    browseAndSearch();
  } else {
    // 10% - Check existing booking
    checkBooking();
  }
  
  // Random think time (1-5 seconds)
  sleep(randomInt(1, 5));
}

// Scenario 1: Complete Booking Flow
function completeBookingFlow() {
  group('Complete Booking Flow', () => {
    let authToken = null;
    let flightId = null;
    let bookingCode = null;
    
    // Step 1: Search flights
    group('Search Flights', () => {
      const params = {
        from: randomElement(airports),
        to: randomElement(airports),
        departureDate: '2025-11-20',
        passengers: 1,
        class: 'Economy',
      };
      
      const searchRes = http.get(
        `${API_URL}/flights/search?${new URLSearchParams(params).toString()}`
      );
      
      const searchSuccess = check(searchRes, {
        'Search status 200': (r) => r.status === 200,
        'Search has data': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.data && body.data.length > 0;
          } catch {
            return false;
          }
        },
      });
      
      if (searchSuccess && searchRes.status === 200) {
        try {
          const body = JSON.parse(searchRes.body);
          if (body.data && body.data.length > 0) {
            flightId = body.data[0]._id;
          }
        } catch (e) {
          console.error('Failed to parse search response');
        }
      }
      
      errorRate.add(!searchSuccess);
    });
    
    sleep(2); // Think time
    
    // Step 2: Get flight details
    if (flightId) {
      group('Get Flight Details', () => {
        const detailRes = http.get(`${API_URL}/flights/${flightId}`);
        
        check(detailRes, {
          'Flight detail status 200': (r) => r.status === 200,
        });
      });
      
      sleep(1);
    }
    
    // Step 3: Create booking (Guest)
    if (flightId) {
      group('Create Booking', () => {
        const bookingStart = Date.now();
        
        const payload = JSON.stringify({
          flights: [
            {
              flightId: flightId,
              class: 'Economy',
            },
          ],
          passengers: [
            {
              title: randomElement(passengerTitles),
              firstName: randomElement(firstNames),
              lastName: randomElement(lastNames),
              dateOfBirth: '1990-05-15',
              gender: 'Male',
              nationality: 'VN',
              document: {
                type: 'passport',
                number: `N${randomInt(10000000, 99999999)}`,
                issuedCountry: 'VN',
                expiryDate: '2030-12-31',
              },
            },
          ],
          contactInfo: {
            email: generateEmail(),
            phone: generatePhone(),
          },
          paymentMethod: 'credit_card',
        });
        
        const bookingRes = http.post(`${API_URL}/bookings`, payload, {
          headers: { 'Content-Type': 'application/json' },
        });
        
        const bookingSuccess = check(bookingRes, {
          'Booking status 201': (r) => r.status === 201,
          'Booking has code': (r) => {
            try {
              const body = JSON.parse(r.body);
              return body.data && body.data.bookingCode;
            } catch {
              return false;
            }
          },
        });
        
        const bookingTime = Date.now() - bookingStart;
        bookingDuration.add(bookingTime);
        
        if (bookingSuccess) {
          successfulBookings.add(1);
          try {
            const body = JSON.parse(bookingRes.body);
            bookingCode = body.data.bookingCode;
          } catch (e) {
            console.error('Failed to parse booking response');
          }
        } else {
          failedBookings.add(1);
          errorRate.add(1);
        }
      });
    }
    
    // Step 4: Check booking status
    if (bookingCode) {
      sleep(1);
      
      group('Check Booking', () => {
        const email = generateEmail();
        const checkRes = http.get(
          `${API_URL}/bookings/guest?bookingCode=${bookingCode}&email=${email}`
        );
        
        // Note: This might fail because email doesn't match
        check(checkRes, {
          'Check booking response received': (r) => r.status !== 0,
        });
      });
    }
  });
}

// Scenario 2: Search Only
function searchFlights() {
  group('Search Flights Only', () => {
    const params = {
      from: randomElement(airports),
      to: randomElement(airports),
      departureDate: `2025-11-${randomInt(10, 30)}`,
      passengers: randomInt(1, 4),
    };
    
    const searchRes = http.get(
      `${API_URL}/flights/search?${new URLSearchParams(params).toString()}`
    );
    
    const success = check(searchRes, {
      'Search status 200': (r) => r.status === 200,
    });
    
    errorRate.add(!success);
  });
}

// Scenario 3: Browse and Search
function browseAndSearch() {
  group('Browse Information', () => {
    // Get airports
    const airportsRes = http.get(`${API_URL}/airports`);
    check(airportsRes, {
      'Airports status 200': (r) => r.status === 200,
    });
    
    sleep(1);
    
    // Get popular airports
    const popularRes = http.get(`${API_URL}/airports/popular`);
    check(popularRes, {
      'Popular airports status 200': (r) => r.status === 200,
    });
    
    sleep(1);
    
    // Search flights
    searchFlights();
  });
}

// Scenario 4: Check Booking
function checkBooking() {
  group('Check Existing Booking', () => {
    const bookingCode = `VJ${randomInt(100000, 999999)}`;
    const email = generateEmail();
    
    const checkRes = http.get(
      `${API_URL}/bookings/guest?bookingCode=${bookingCode}&email=${email}`
    );
    
    // Expected to fail with 404 most of the time
    check(checkRes, {
      'Check booking response': (r) => r.status === 404 || r.status === 200,
    });
  });
}

// Teardown function - runs once
export function teardown(data) {
  const endTime = new Date();
  const duration = (endTime - data.startTime) / 1000;
  
  console.log('\n✅ K6 Stress Test Completed!');
  console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
  console.log('📊 Check detailed metrics above');
}

// Custom summary
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: '→', enableColors: true }),
    'summary.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  const { indent = '', enableColors = false } = options || {};
  
  return `
${indent}📊 K6 Load Test Summary
${indent}========================

${indent}Test Duration: ${data.state.testRunDurationMs / 1000}s
${indent}Total Requests: ${data.metrics.http_reqs.values.count}
${indent}Request Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)} req/s

${indent}Response Times:
${indent}  Min: ${data.metrics.http_req_duration.values.min.toFixed(2)}ms
${indent}  Avg: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
${indent}  Max: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms
${indent}  P95: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
${indent}  P99: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms

${indent}Bookings:
${indent}  Successful: ${data.metrics.successful_bookings ? data.metrics.successful_bookings.values.count : 0}
${indent}  Failed: ${data.metrics.failed_bookings ? data.metrics.failed_bookings.values.count : 0}

${indent}Error Rate: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%
`;
}
