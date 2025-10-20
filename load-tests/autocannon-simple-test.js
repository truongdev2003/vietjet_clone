/**
 * Autocannon Simple Load Test
 * Test nhanh để kiểm tra khả năng chịu tải cơ bản
 * 
 * Chạy: node autocannon-simple-test.js
 */

const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const DURATION = parseInt(process.env.DURATION) || 60; // seconds
const CONNECTIONS = parseInt(process.env.CONNECTIONS) || 50;
const PIPELINING = parseInt(process.env.PIPELINING) || 1;

// Test scenarios
const scenarios = {
  // Test 1: Search Flights
  searchFlights: {
    name: 'Search Flights',
    url: `${BASE_URL}/api/flights/search?from=HAN&to=SGN&departureDate=2025-11-20&passengers=1`,
    method: 'GET',
  },
  
  // Test 2: Get Airports
  getAirports: {
    name: 'Get Airports',
    url: `${BASE_URL}/api/airports`,
    method: 'GET',
  },
  
  // Test 3: Get Popular Routes
  getPopularAirports: {
    name: 'Get Popular Airports',
    url: `${BASE_URL}/api/airports/popular`,
    method: 'GET',
  },
  
  // Test 4: Get Fares
  getFares: {
    name: 'Get Fares',
    url: `${BASE_URL}/api/fares`,
    method: 'GET',
  },
};

// Run all tests sequentially
async function runAllTests() {
  console.log('🚀 Starting Autocannon Load Tests');
  console.log('==================================\n');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Duration: ${DURATION}s`);
  console.log(`Connections: ${CONNECTIONS}`);
  console.log(`Pipelining: ${PIPELINING}\n`);
  
  const results = [];
  
  for (const [key, scenario] of Object.entries(scenarios)) {
    console.log(`\n📊 Running Test: ${scenario.name}`);
    console.log('─'.repeat(50));
    
    const result = await runTest(scenario);
    results.push({
      scenario: scenario.name,
      ...result,
    });
    
    // Wait between tests
    await sleep(5000);
  }
  
  // Save results
  saveResults(results);
  
  // Print summary
  printSummary(results);
}

// Run single test
function runTest(scenario) {
  return new Promise((resolve, reject) => {
    const instance = autocannon({
      url: scenario.url,
      method: scenario.method,
      connections: CONNECTIONS,
      pipelining: PIPELINING,
      duration: DURATION,
      headers: {
        'Content-Type': 'application/json',
      },
    }, (err, result) => {
      if (err) {
        console.error('❌ Test failed:', err);
        reject(err);
      } else {
        resolve(parseResult(result));
      }
    });
    
    // Track progress
    autocannon.track(instance, {
      renderProgressBar: true,
      renderResultsTable: true,
    });
  });
}

// Parse result
function parseResult(result) {
  return {
    requests: {
      total: result.requests.total,
      average: result.requests.average,
      mean: result.requests.mean,
      p50: result.requests.p50,
      p75: result.requests.p75,
      p90: result.requests.p90,
      p99: result.requests.p99,
      p999: result.requests.p999,
    },
    latency: {
      mean: result.latency.mean,
      p50: result.latency.p50,
      p75: result.latency.p75,
      p90: result.latency.p90,
      p99: result.latency.p99,
      p999: result.latency.p999,
    },
    throughput: {
      average: result.throughput.average,
      mean: result.throughput.mean,
      p50: result.throughput.p50,
      p99: result.throughput.p99,
    },
    errors: result.errors,
    timeouts: result.timeouts,
    duration: result.duration,
    start: result.start,
    finish: result.finish,
  };
}

// Save results to file
function saveResults(results) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `load-test-results-${timestamp}.json`;
  const filepath = path.join(__dirname, 'results', filename);
  
  // Create results directory if not exists
  const resultsDir = path.join(__dirname, 'results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${filepath}`);
}

// Print summary
function printSummary(results) {
  console.log('\n\n');
  console.log('═'.repeat(80));
  console.log('📊 LOAD TEST SUMMARY');
  console.log('═'.repeat(80));
  
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.scenario}`);
    console.log('─'.repeat(80));
    console.log(`   Total Requests:     ${result.requests.total.toLocaleString()}`);
    console.log(`   Requests/Second:    ${result.requests.mean.toFixed(2)}`);
    console.log(`   Average Latency:    ${result.latency.mean.toFixed(2)}ms`);
    console.log(`   P50 Latency:        ${result.latency.p50.toFixed(2)}ms`);
    console.log(`   P95 Latency:        ${result.latency.p90.toFixed(2)}ms`);
    console.log(`   P99 Latency:        ${result.latency.p99.toFixed(2)}ms`);
    console.log(`   Throughput:         ${(result.throughput.mean / 1024 / 1024).toFixed(2)} MB/s`);
    console.log(`   Errors:             ${result.errors}`);
    console.log(`   Timeouts:           ${result.timeouts}`);
    console.log(`   Duration:           ${result.duration}s`);
    
    // Performance rating
    const rating = getPerformanceRating(result);
    console.log(`   Performance:        ${rating.emoji} ${rating.text}`);
  });
  
  console.log('\n' + '═'.repeat(80));
  
  // Overall assessment
  const avgLatency = results.reduce((sum, r) => sum + r.latency.mean, 0) / results.length;
  const totalRequests = results.reduce((sum, r) => sum + r.requests.total, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);
  const errorRate = (totalErrors / totalRequests) * 100;
  
  console.log('\n📈 OVERALL ASSESSMENT');
  console.log('─'.repeat(80));
  console.log(`   Average Latency:    ${avgLatency.toFixed(2)}ms`);
  console.log(`   Total Requests:     ${totalRequests.toLocaleString()}`);
  console.log(`   Total Errors:       ${totalErrors} (${errorRate.toFixed(2)}%)`);
  console.log(`   Status:             ${getOverallStatus(avgLatency, errorRate)}`);
  console.log('═'.repeat(80) + '\n');
}

// Get performance rating
function getPerformanceRating(result) {
  const p99 = result.latency.p99;
  
  if (p99 < 200) {
    return { emoji: '🟢', text: 'Excellent' };
  } else if (p99 < 500) {
    return { emoji: '🟡', text: 'Good' };
  } else if (p99 < 1000) {
    return { emoji: '🟠', text: 'Fair' };
  } else {
    return { emoji: '🔴', text: 'Poor' };
  }
}

// Get overall status
function getOverallStatus(avgLatency, errorRate) {
  if (avgLatency < 200 && errorRate < 0.1) {
    return '✅ Excellent - Production Ready';
  } else if (avgLatency < 500 && errorRate < 1) {
    return '✅ Good - Acceptable Performance';
  } else if (avgLatency < 1000 && errorRate < 5) {
    return '⚠️  Fair - Needs Optimization';
  } else {
    return '❌ Poor - Requires Immediate Action';
  }
}

// Sleep helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run tests
runAllTests().catch(console.error);

// Export for use as module
module.exports = {
  runTest,
  runAllTests,
};
