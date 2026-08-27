// Comprehensive Performance Benchmarking & Load Test Suite
// Measures Route Latency (p50, p95, p99), Concurrency Throughput, and Error Rates.

const BASE_URL = 'http://127.0.0.1:3000';

const ROUTES_TO_BENCHMARK = [
  { name: 'Root Landing Page', path: '/' },
  { name: 'Clinician Dashboard', path: '/dashboard' },
  { name: 'Patients Registry', path: '/patients' },
  { name: 'Patient Record (Arthur Pendleton)', path: '/patients/pat-001' },
  { name: 'Longitudinal Follow-ups Hub', path: '/follow-ups' },
  { name: 'Data Ingestion Overview', path: '/data-ingestion' },
  { name: 'Surgeon Outcomes Analytics', path: '/analytics' },
  { name: 'Admin Command Center', path: '/admin' },
  { name: 'Admin User Management', path: '/admin/users' },
  { name: 'Admin Caldicott Audit Trail', path: '/admin/audit-log' },
  { name: 'Admin NPCA Data Quality', path: '/admin/data-quality' },
  { name: 'Patient Recovery Portal', path: '/home' },
  { name: 'Patient IPSS Assessment', path: '/assessment/ipss' },
];

async function fetchTiming(path) {
  const start = performance.now();
  try {
    const res = await fetch(`${BASE_URL}${path}`);
    const text = await res.text();
    const duration = performance.now() - start;
    return {
      statusCode: res.status,
      durationMs: Math.round(duration),
      sizeBytes: Buffer.byteLength(text, 'utf8'),
    };
  } catch (err) {
    return {
      statusCode: 500,
      durationMs: 9999,
      sizeBytes: 0,
      error: err.message,
    };
  }
}

async function runRouteBenchmark() {
  console.log('='.repeat(80));
  console.log('📊 PRODUCTION PERFORMANCE BENCHMARK — UK RALP SURGICAL OUTCOMES DATABASE');
  console.log('='.repeat(80));
  console.log(`Target Host: ${BASE_URL}\n`);

  const results = [];

  for (const route of ROUTES_TO_BENCHMARK) {
    // Warmup request
    await fetchTiming(route.path);

    // Measure 3 consecutive runs
    const timings = [];
    let size = 0;
    let code = 200;

    for (let i = 0; i < 3; i++) {
      const res = await fetchTiming(route.path);
      timings.push(res.durationMs);
      size = res.sizeBytes;
      code = res.statusCode;
    }

    timings.sort((a, b) => a - b);
    const p50 = timings[Math.floor(timings.length * 0.5)];
    const p95 = timings[Math.floor(timings.length * 0.9)];
    const min = timings[0];
    const max = timings[timings.length - 1];

    results.push({
      Route: route.name,
      Path: route.path,
      Status: code,
      'Size (KB)': (size / 1024).toFixed(1),
      'Min (ms)': min,
      'p50 (ms)': p50,
      'p95 (ms)': p95,
      'Max (ms)': max,
    });
  }

  console.table(results);
  return results;
}

async function runConcurrencyStressTest() {
  console.log('\n' + '='.repeat(80));
  console.log('⚡ HIGH-CONCURRENCY LOAD TEST (Simulating Concurrent NHS Clinicians & Patients)');
  console.log('='.repeat(80));

  let autocannonModule;
  try {
    const mod = await import('autocannon');
    autocannonModule = mod.default || mod;
  } catch (e) {
    console.log('Autocannon not installed yet.');
  }

  if (autocannonModule) {
    return new Promise((resolve) => {
      const instance = autocannonModule(
        {
          url: `${BASE_URL}/dashboard`,
          connections: 10,
          pipelining: 1,
          duration: 3,
        },
        (err, result) => {
          if (err) {
            console.error('Stress test error:', err);
            resolve();
            return;
          }
          console.log('\n📈 Concurrency Benchmark Results:');
          console.log(`• Total Requests Sent: ${result.requests.total}`);
          console.log(`• Requests / Sec (Throughput): ${result.requests.average} req/s`);
          console.log(`• Latency p50: ${result.latency.p50} ms`);
          console.log(`• Latency p90: ${result.latency.p90} ms`);
          console.log(`• Latency p99: ${result.latency.p99} ms`);
          console.log(`• 2xx Status Responses: ${result['2xx']}`);
          console.log(`• Non-2xx / Errors: ${result.non2xx}`);
          console.log(`• Error Rate: ${((result.non2xx / (result.requests.total || 1)) * 100).toFixed(2)}%`);
          console.log('='.repeat(80));
          resolve();
        }
      );
    });
  }
}

async function main() {
  await runRouteBenchmark();
  await runConcurrencyStressTest();
}

main().catch(console.error);
