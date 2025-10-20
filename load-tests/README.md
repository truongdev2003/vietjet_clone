# Load Testing Scripts - Quick Start Guide

## 📦 Cài Đặt Tools

### Cài đặt Artillery
```bash
npm install -g artillery
npm install -g artillery-plugin-expect
```

### Cài đặt K6
```bash
# Windows (Chocolatey)
choco install k6

# Or download từ: https://k6.io/docs/getting-started/installation/
```

### Cài đặt Autocannon
```bash
npm install -g autocannon

# Or local install
cd load-tests
npm install autocannon
```

## 🚀 Chạy Tests

### 1. Quick Test với Autocannon (Recommended để bắt đầu)

```bash
# Basic test
autocannon -c 10 -d 30 http://localhost:5000/api/flights/search?from=HAN&to=SGN

# Run test script đầy đủ
cd load-tests
node autocannon-simple-test.js

# Custom configuration
DURATION=120 CONNECTIONS=100 node autocannon-simple-test.js
```

**Parameters:**
- `-c`: Number of concurrent connections (default: 10)
- `-d`: Duration in seconds (default: 30)
- `-p`: Pipelining (default: 1)

### 2. Complete Flow Test với Artillery

```bash
cd load-tests

# Run full booking flow test
artillery run artillery-booking-flow.yml

# Run with custom target
artillery run --target http://your-server:5000 artillery-booking-flow.yml

# Generate HTML report
artillery run artillery-booking-flow.yml --output report.json
artillery report report.json
```

### 3. Stress Test với K6

```bash
cd load-tests

# Run stress test
k6 run k6-stress-test.js

# Run with custom duration
k6 run --duration 5m k6-stress-test.js

# Run with environment variables
k6 run -e BASE_URL=http://production-server:5000 k6-stress-test.js

# Output to JSON
k6 run --out json=results.json k6-stress-test.js

# Use cloud (requires k6 cloud account)
k6 cloud k6-stress-test.js
```

## 📊 Diễn Giải Kết Quả

### Artillery Output
```
Summary report @ 15:30:25(+0700)
  Scenarios launched:  1000
  Scenarios completed: 998
  Requests completed:  4990
  Mean response/sec:   83.17
  Response time (msec):
    min: 45
    max: 2345
    median: 198
    p95: 456
    p99: 789
  Scenario counts:
    Authenticated User Booking: 600 (60%)
    Guest User Booking: 400 (40%)
  Codes:
    200: 4500
    201: 490
    400: 5
    500: 2
```

**Giải thích:**
- ✅ **Mean response/sec: 83.17** - Hệ thống xử lý 83 requests/giây
- ✅ **p95: 456ms** - 95% requests hoàn thành trong 456ms
- ✅ **p99: 789ms** - 99% requests hoàn thành trong 789ms
- ⚠️ **Codes 400/500** - Có 7 requests lỗi (0.14% error rate)

### K6 Output
```
     ✓ Search status 200
     ✓ Booking status 201

     checks.........................: 95.5%  ✓ 9550      ✗ 450
     data_received..................: 25 MB  417 kB/s
     data_sent......................: 12 MB  200 kB/s
     http_req_duration..............: avg=234ms min=45ms med=198ms max=2.3s p(90)=389ms p(95)=567ms
     http_req_failed................: 2.5%   ✓ 125       ✗ 4875
     http_reqs......................: 5000   83.33/s
     iteration_duration.............: avg=5.2s min=2.1s med=4.8s max=12.3s p(90)=7.2s p(95)=8.9s
     iterations.....................: 1000   16.67/s
     vus............................: 100    min=10      max=200
     vus_max........................: 200    min=200     max=200
```

**Giải thích:**
- ✅ **checks: 95.5%** - 95.5% checks passed
- ✅ **http_req_duration avg: 234ms** - Trung bình response time
- ⚠️ **http_req_failed: 2.5%** - 2.5% requests bị fail
- ✅ **http_reqs: 83.33/s** - Throughput

### Autocannon Output
```
Running 30s test @ http://localhost:5000/api/flights/search
10 connections

┌─────────┬────────┬────────┬────────┬────────┬───────────┬──────────┐
│ Stat    │ 2.5%   │ 50%    │ 97.5%  │ 99%    │ Avg       │ Stdev    │
├─────────┼────────┼────────┼────────┼────────┼───────────┼──────────┤
│ Latency │ 145 ms │ 198 ms │ 456 ms │ 678 ms │ 223.45 ms │ 89.23 ms │
└─────────┴────────┴────────┴────────┴────────┴───────────┴──────────┘
┌───────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│ Stat      │ 1%      │ 2.5%    │ 50%     │ 97.5%   │ Avg     │ Stdev   │
├───────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ Req/Sec   │ 35      │ 35      │ 45      │ 52      │ 44.2    │ 4.87    │
├───────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ Bytes/Sec │ 123 kB  │ 123 kB  │ 158 kB  │ 183 kB  │ 155 kB  │ 17.1 kB │
└───────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘

Req/Bytes counts sampled once per second.

1k requests in 30.05s, 4.65 MB read
```

**Giải thích:**
- ✅ **Latency 50%: 198ms** - Median response time
- ✅ **Latency 99%: 678ms** - P99 latency
- ✅ **Req/Sec Avg: 44.2** - Throughput với 10 connections

## 🎯 Test Scenarios

### Scenario 1: Baseline Test
**Mục đích:** Đo baseline performance

```bash
# Artillery
artillery quick --count 10 --num 100 http://localhost:5000/api/flights/search?from=HAN&to=SGN

# Autocannon
autocannon -c 10 -d 60 http://localhost:5000/api/flights/search?from=HAN&to=SGN
```

### Scenario 2: Load Test
**Mục đích:** Test với tải normal

```bash
# Artillery
artillery run artillery-booking-flow.yml

# K6
k6 run k6-stress-test.js
```

### Scenario 3: Stress Test
**Mục đích:** Tìm breaking point

```bash
# Autocannon - tăng dần connections
autocannon -c 50 -d 60 http://localhost:5000/api/bookings
autocannon -c 100 -d 60 http://localhost:5000/api/bookings
autocannon -c 200 -d 60 http://localhost:5000/api/bookings
```

### Scenario 4: Spike Test
**Mục đích:** Test sudden traffic spike

```bash
# K6 với spike configuration
k6 run --stage "0s:0,10s:1000,20s:0" k6-stress-test.js
```

## 📈 Performance Benchmarks

### Excellent Performance ✅
```
Response Time:
  - P50: < 100ms
  - P95: < 300ms
  - P99: < 500ms

Throughput:
  - > 100 RPS (10 connections)
  - > 500 RPS (50 connections)

Error Rate:
  - < 0.1%

CPU: < 60%
Memory: Stable
```

### Good Performance 🟡
```
Response Time:
  - P50: < 200ms
  - P95: < 500ms
  - P99: < 1000ms

Throughput:
  - > 50 RPS (10 connections)
  - > 200 RPS (50 connections)

Error Rate:
  - < 1%

CPU: < 80%
Memory: Stable
```

### Poor Performance ❌
```
Response Time:
  - P50: > 500ms
  - P95: > 2000ms
  - P99: > 5000ms

Throughput:
  - < 20 RPS

Error Rate:
  - > 5%

CPU: > 90%
Memory: Growing
```

## 🔧 Troubleshooting

### Issue 1: High Latency
**Triệu chứng:** Response time > 1000ms

**Giải pháp:**
1. Check database indexes
2. Enable query caching
3. Optimize database queries (use .lean())
4. Add Redis caching
5. Enable response compression

### Issue 2: High Error Rate
**Triệu chứng:** Error rate > 1%

**Giải pháp:**
1. Check application logs
2. Verify database connection pool
3. Check rate limiting configuration
4. Monitor memory usage
5. Check for race conditions

### Issue 3: Low Throughput
**Triệu chứng:** RPS < expected

**Giải pháp:**
1. Enable cluster mode
2. Increase connection pool size
3. Optimize middleware stack
4. Remove unnecessary logging
5. Use stream processing

### Issue 4: Memory Leak
**Triệu chứng:** Memory continuously growing

**Giải pháp:**
1. Use clinic.js for profiling
2. Check for unclosed connections
3. Review event listeners
4. Use WeakMap for caching
5. Implement proper cleanup

## 📝 Best Practices

1. **Always warm-up** trước khi test chính
2. **Test incrementally** - tăng dần load
3. **Monitor system metrics** - CPU, Memory, Network
4. **Run multiple times** - lấy average
5. **Test trong môi trường giống production**
6. **Document kết quả** và so sánh theo thời gian
7. **Cleanup data** sau mỗi test run
8. **Test cả success và error paths**

## 🎓 Learning Resources

- [Artillery Documentation](https://www.artillery.io/docs)
- [K6 Documentation](https://k6.io/docs/)
- [Autocannon GitHub](https://github.com/mcollina/autocannon)
- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/simple-profiling/)
