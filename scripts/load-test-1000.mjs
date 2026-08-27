// 1,000 Concurrent Users High-Scale Load & Stress Test Suite
// Simulates concurrent NHS clinicians, surgeons, administrative audit queries, and patients.

import autocannon from 'autocannon';

const BASE_URL = 'http://127.0.0.1:3000';

async function runScenario(name, connections, durationSec, path) {
  console.log(`\n▶ [${name}] Starting test with ${connections} concurrent users hitting ${path} for ${durationSec}s...`);

  return new Promise((resolve) => {
    const instance = autocannon(
      {
        url: `${BASE_URL}${path}`,
        connections: connections,
        pipelining: 1,
        duration: durationSec,
        timeout: 10,
      },
      (err, result) => {
        if (err) {
          console.error(`Error in scenario ${name}:`, err);
          resolve(null);
          return;
        }

        console.log(`\n📊 Results for ${name} (${connections} Concurrent Users):`);
        console.log(`  • Total Requests Completed: ${result.requests.total.toLocaleString()}`);
        console.log(`  • Throughput (Requests/sec): ${result.requests.average.toFixed(1)} req/s`);
        console.log(`  • Data Transferred: ${(result.throughput.total / 1024 / 1024).toFixed(2)} MB`);
        console.log(`  • Latency Distribution:`);
        console.log(`      - p50 (Median):   ${result.latency.p50} ms`);
        console.log(`      - p90:            ${result.latency.p90} ms`);
        console.log(`      - p97.5:          ${result.latency.p97_5} ms`);
        console.log(`      - p99 (Worst 1%): ${result.latency.p99} ms`);
        console.log(`      - Max Latency:    ${result.latency.max} ms`);
        console.log(`  • HTTP Status Codes:`);
        console.log(`      - 2xx (Success):  ${result['2xx']}`);
        console.log(`      - Non-2xx/Errors: ${result.non2xx}`);
        console.log(`      - Timeouts:       ${result.timeouts}`);
        const errorRate = (( (result.non2xx + result.timeouts) / (result.requests.total || 1) ) * 100).toFixed(2);
        console.log(`  • Error Rate: ${errorRate}%`);
        console.log('-'.repeat(70));

        resolve({
          name,
          connections,
          total: result.requests.total,
          reqSec: result.requests.average,
          p50: result.latency.p50,
          p90: result.latency.p90,
          p99: result.latency.p99,
          max: result.latency.max,
          success: result['2xx'],
          errors: result.non2xx + result.timeouts,
          errorRate: `${errorRate}%`,
        });
      }
    );
  });
}

async function main() {
  console.log('='.repeat(80));
  console.log('🔥 1,000 CONCURRENT USERS STRESS & CAPACITY BENCHMARK');
  console.log('Target Server: ' + BASE_URL);
  console.log('Architecture: Next.js App Router + Turbopack + In-Memory Micro-Cache Layer');
  console.log('='.repeat(80));

  const summary = [];

  // Stage 1: Warmup & baseline (100 concurrent users)
  const res100 = await runScenario('Stage 1: Moderate Load (Clinician Dashboard)', 100, 5, '/dashboard');
  if (res100) summary.push(res100);

  // Stage 2: Heavy Load (500 concurrent users across Patient Registry)
  const res500 = await runScenario('Stage 2: Heavy Load (Patients Registry)', 500, 5, '/patients');
  if (res500) summary.push(res500);

  // Stage 3: Peak Load (1,000 concurrent users on Dashboard)
  const res1000Dashboard = await runScenario('Stage 3: PEAK 1,000 CONCURRENT USERS (Clinician Dashboard)', 1000, 8, '/dashboard');
  if (res1000Dashboard) summary.push(res1000Dashboard);

  // Stage 4: Peak Load (1,000 concurrent users on Patient Mobile Portal)
  const res1000Patient = await runScenario('Stage 4: PEAK 1,000 CONCURRENT USERS (Patient PROM Portal)', 1000, 8, '/home');
  if (res1000Patient) summary.push(res1000Patient);

  // Stage 5: Peak Load (1,000 concurrent users on Admin Command Center)
  const res1000Admin = await runScenario('Stage 5: PEAK 1,000 CONCURRENT USERS (Admin Audit & Command Center)', 1000, 8, '/admin');
  if (res1000Admin) summary.push(res1000Admin);

  console.log('\n' + '='.repeat(80));
  console.log('📋 FINAL 1,000 CONCURRENT USERS STRESS TEST SUMMARY SCOREBOARD');
  console.log('='.repeat(80));
  console.table(
    summary.map((s) => ({
      Scenario: s.name,
      'Concurrent Users': s.connections,
      'Total Requests': s.total,
      'Throughput (req/s)': s.reqSec.toFixed(1),
      'p50 (ms)': s.p50,
      'p90 (ms)': s.p90,
      'p99 (ms)': s.p99,
      'Max (ms)': s.max,
      'Success (2xx)': s.success,
      'Errors/Timeouts': s.errors,
      'Error Rate': s.errorRate,
    }))
  );
  console.log('='.repeat(80));
}

main().catch(console.error);
