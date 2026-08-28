import {
  rateLimiterInstance,
  sanitizeString,
  sanitizeObject,
  validateFileUpload,
} from '../security/securityMiddleware.js';
import { TestResult } from './auth.test.js';

export async function runSecuritySuiteTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test 1: XSS & HTML Script Injection Sanitizer
  {
    const start = Date.now();
    try {
      const maliciousPayload = {
        symptoms: 'Headache <script>alert("XSS Attack")</script> and dizziness',
        notes: '<iframe src="javascript:alert(1)"></iframe> Normal clinical note',
        nested: {
          comment: '<img src=x onerror=alert("hacked")> valid text',
        },
      };

      const sanitized = sanitizeObject(maliciousPayload);

      const scriptGone = !sanitized.symptoms.includes('<script>') && !sanitized.symptoms.includes('alert("XSS Attack")');
      const iframeGone = !sanitized.notes.includes('<iframe');
      const onerrorGone = !sanitized.nested.comment.includes('onerror=');

      const passed = scriptGone && iframeGone && onerrorGone;

      results.push({
        suite: 'Application Security',
        name: 'XSS & Malicious Script Tag Stripping / Sanitization',
        passed,
        message: passed
          ? 'Dangerous script tags, iframes, and onerror event handlers successfully neutralized from nested payloads'
          : 'XSS payload escaped sanitizer',
        durationMs: Date.now() - start,
      });
    } catch (err: any) {
      results.push({
        suite: 'Application Security',
        name: 'XSS & Malicious Script Tag Stripping / Sanitization',
        passed: false,
        message: err.message,
        durationMs: Date.now() - start,
      });
    }
  }

  // Test 2: In-Memory Token Bucket / Sliding Window Rate Limiter
  {
    const start = Date.now();
    try {
      const testKey = `test_rate_key_${Date.now()}`;
      const limit = 5;
      const windowMs = 10000;

      // Send 5 requests (all should pass)
      let allInitialAllowed = true;
      for (let i = 0; i < limit; i++) {
        const check = rateLimiterInstance.check(testKey, limit, windowMs);
        if (!check.allowed) allInitialAllowed = false;
      }

      // 6th request should be blocked
      const blockedCheck = rateLimiterInstance.check(testKey, limit, windowMs);
      const isBlocked = blockedCheck.allowed === false && blockedCheck.remaining === 0;

      const passed = allInitialAllowed && isBlocked;

      results.push({
        suite: 'Application Security',
        name: 'Sliding Window Rate Limiter (Brute-Force & DDoS Defense)',
        passed,
        message: passed
          ? `Allowed initial ${limit} requests within threshold, strictly throttled burst requests with HTTP 429 semantics`
          : 'Rate limiter failed to throttle excess traffic',
        durationMs: Date.now() - start,
      });
    } catch (err: any) {
      results.push({
        suite: 'Application Security',
        name: 'Sliding Window Rate Limiter (Brute-Force & DDoS Defense)',
        passed: false,
        message: err.message,
        durationMs: Date.now() - start,
      });
    }
  }

  // Test 3: Secure Medical Document Upload Boundary
  {
    const start = Date.now();
    try {
      // 1. Valid PDF medical report
      const validPdf = validateFileUpload({
        name: 'blood_test_cbc_2026.pdf',
        type: 'application/pdf',
        size: 2.4 * 1024 * 1024,
      });

      // 2. Dangerous executable file
      const invalidExe = validateFileUpload({
        name: 'malware_trojan.exe',
        type: 'application/x-msdownload',
        size: 500 * 1024,
      });

      // 3. Oversized file (>15MB)
      const oversizedFile = validateFileUpload({
        name: 'huge_mri_scan.dcm',
        type: 'application/dicom',
        size: 25 * 1024 * 1024,
      });

      const passed = validPdf.valid === true && invalidExe.valid === false && oversizedFile.valid === false;

      results.push({
        suite: 'Application Security',
        name: 'File Upload MIME / Extension & Size Validation Guard',
        passed,
        message: passed
          ? 'Approved valid PDF/DICOM files while rejecting dangerous .exe binaries and oversized uploads (>15MB)'
          : 'File upload validation allowed prohibited file or rejected legitimate file',
        durationMs: Date.now() - start,
      });
    } catch (err: any) {
      results.push({
        suite: 'Application Security',
        name: 'File Upload MIME / Extension & Size Validation Guard',
        passed: false,
        message: err.message,
        durationMs: Date.now() - start,
      });
    }
  }

  return results;
}
