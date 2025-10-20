/**
 * Server Cluster Entry Point
 * Sử dụng file này thay cho server.js để chạy cluster mode
 * 
 * Chạy: node server-cluster.js
 */

const { setupCluster } = require('./utils/performanceOptimization');

// Setup cluster mode
setupCluster('./server.js');
