import { runAuthTests, TestResult } from './auth.test.js';
import { runDataIsolationTests } from './dataIsolation.test.js';
import { runClinicalSafetyTests } from './clinicalSafety.test.js';
import { runRagCitationTests } from './ragCitation.test.js';
import { runSecuritySuiteTests } from './securitySuite.test.js';

export interface ComprehensiveTestReport {
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  allPassed: boolean;
  totalDurationMs: number;
  suites: {
    name: string;
    total: number;
    passed: number;
    failed: number;
    results: TestResult[];
  }[];
}

export async function runAllTests(): Promise<ComprehensiveTestReport> {
  const startTime = Date.now();

  const [authResults, isoResults, safetyResults, ragResults, secResults] = await Promise.all([
    runAuthTests(),
    runDataIsolationTests(),
    runClinicalSafetyTests(),
    runRagCitationTests(),
    runSecuritySuiteTests(),
  ]);

  const allResults = [...authResults, ...isoResults, ...safetyResults, ...ragResults, ...secResults];
  const passedCount = allResults.filter((r) => r.passed).length;
  const failedCount = allResults.length - passedCount;

  const suiteNames = Array.from(new Set(allResults.map((r) => r.suite)));
  const suites = suiteNames.map((name) => {
    const results = allResults.filter((r) => r.suite === name);
    const passed = results.filter((r) => r.passed).length;
    return {
      name,
      total: results.length,
      passed,
      failed: results.length - passed,
      results,
    };
  });

  return {
    timestamp: new Date().toISOString(),
    totalTests: allResults.length,
    passedTests: passedCount,
    failedTests: failedCount,
    allPassed: failedCount === 0,
    totalDurationMs: Date.now() - startTime,
    suites,
  };
}

// Standalone CLI execution
if (process.argv[1]?.endsWith('runAllTests.ts') || process.argv[1]?.endsWith('runAllTests.js')) {
  console.log('🏥 Starting OmniDoctor AI Phase 10 Comprehensive Verification Suite...\n');
  runAllTests().then((report) => {
    console.log(`================================================================`);
    console.log(`OmniDoctor AI Test Report: ${report.passedTests}/${report.totalTests} PASSED (${report.totalDurationMs}ms)`);
    console.log(`================================================================\n`);
    for (const suite of report.suites) {
      console.log(`▶ [${suite.name}] (${suite.passed}/${suite.total})`);
      for (const res of suite.results) {
        const icon = res.passed ? '✅' : '❌';
        console.log(`  ${icon} ${res.name} (${res.durationMs}ms)`);
        console.log(`     ↳ ${res.message}`);
      }
      console.log('');
    }
    if (!report.allPassed) {
      process.exit(1);
    }
  });
}
