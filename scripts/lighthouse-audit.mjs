#!/usr/bin/env node
/**
 * Lighthouse Audit Script for Dashboard
 * Sprint 5: Lighthouse audit (Performance >90, Acessibilidade >95)
 * 
 * Usage: node scripts/lighthouse-audit.mjs [url]
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const require = createRequire(import.meta.url);
const lighthouse = require('lighthouse').default;
const chromeLauncher = require('chrome-launcher');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const THRESHOLDS = {
  performance: 90,
  accessibility: 95,
  'best-practices': 90,
  seo: 90
};

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warning: '\x1b[33m'  // Yellow
  };
  const reset = '\x1b[0m';
  console.log(`${colors[type]}${message}${reset}`);
}

async function runLighthouseAudit(url) {
  const chrome = await chromeLauncher.launch({ 
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'] 
  });
  
  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port
  };
  
  const runnerResult = await lighthouse(url, options);
  
  await chrome.kill();
  
  if (!runnerResult) {
    throw new Error('Lighthouse audit failed');
  }
  
  const lhr = runnerResult.lhr;
  
  return {
    url,
    scores: {
      performance: Math.round((lhr.categories.performance.score || 0) * 100),
      accessibility: Math.round((lhr.categories.accessibility.score || 0) * 100),
      'best-practices': Math.round((lhr.categories['best-practices'].score || 0) * 100),
      seo: Math.round((lhr.categories.seo.score || 0) * 100)
    },
    metrics: {
      'first-contentful-paint': lhr.audits['first-contentful-paint']?.numericValue || 0,
      'largest-contentful-paint': lhr.audits['largest-contentful-paint']?.numericValue || 0,
      'total-blocking-time': lhr.audits['total-blocking-time']?.numericValue || 0,
      'cumulative-layout-shift': lhr.audits['cumulative-layout-shift']?.numericValue || 0,
      'speed-index': lhr.audits['speed-index']?.numericValue || 0
    },
    passed: false,
    timestamp: new Date().toISOString()
  };
}

function checkThresholds(result) {
  const passed = 
    result.scores.performance >= THRESHOLDS.performance &&
    result.scores.accessibility >= THRESHOLDS.accessibility &&
    result.scores['best-practices'] >= THRESHOLDS['best-practices'] &&
    result.scores.seo >= THRESHOLDS.seo;
  
  result.passed = passed;
  return passed;
}

function printResults(result) {
  console.log('\n');
  log('='.repeat(60), 'info');
  log('LIGHTHOUSE AUDIT RESULTS', 'info');
  log('='.repeat(60), 'info');
  console.log('\n');
  
  log('SCORES:', 'info');
  log('-'.repeat(40), 'info');
  
  const scores = [
    { name: 'Performance', score: result.scores.performance, threshold: THRESHOLDS.performance },
    { name: 'Accessibility', score: result.scores.accessibility, threshold: THRESHOLDS.accessibility },
    { name: 'Best Practices', score: result.scores['best-practices'], threshold: THRESHOLDS['best-practices'] },
    { name: 'SEO', score: result.scores.seo, threshold: THRESHOLDS.seo }
  ];
  
  for (const { name, score, threshold } of scores) {
    const passed = score >= threshold;
    const icon = passed ? '✅' : '❌';
    const color = passed ? 'success' : 'error';
    const thresholdStr = threshold > 0 ? ` (threshold: ${threshold})` : '';
    log(`${icon} ${name}: ${score}${thresholdStr}`, color);
  }
  
  console.log('\n');
  log('CORE WEB VITALS:', 'info');
  log('-'.repeat(40), 'info');
  
  const fcp = (result.metrics['first-contentful-paint'] || 0) / 1000;
  const lcp = (result.metrics['largest-contentful-paint'] || 0) / 1000;
  const tbt = result.metrics['total-blocking-time'] || 0;
  const cls = result.metrics['cumulative-layout-shift'] || 0;
  const si = (result.metrics['speed-index'] || 0) / 1000;
  
  log(`First Contentful Paint: ${fcp.toFixed(2)}s`, fcp < 1.8 ? 'success' : fcp < 3 ? 'warning' : 'error');
  log(`Largest Contentful Paint: ${lcp.toFixed(2)}s`, lcp < 2.5 ? 'success' : lcp < 4 ? 'warning' : 'error');
  log(`Total Blocking Time: ${tbt.toFixed(0)}ms`, tbt < 200 ? 'success' : tbt < 500 ? 'warning' : 'error');
  log(`Cumulative Layout Shift: ${cls.toFixed(3)}`, cls < 0.1 ? 'success' : cls < 0.25 ? 'warning' : 'error');
  log(`Speed Index: ${si.toFixed(2)}s`, si < 3.4 ? 'success' : 'warning');
  
  console.log('\n');
  log('='.repeat(60), 'info');
  
  if (result.passed) {
    log('✅ ALL THRESHOLDS PASSED!', 'success');
  } else {
    log('❌ SOME THRESHOLDS FAILED', 'error');
  }
  
  log('='.repeat(60), 'info');
  console.log('\n');
}

function saveResults(result) {
  const reportsDir = join(process.cwd(), 'lighthouse-reports');
  
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  const filename = `audit-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const filepath = join(reportsDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(result, null, 2));
  log(`Report saved to: ${filepath}`, 'success');
  
  const latestPath = join(reportsDir, 'latest.json');
  fs.writeFileSync(latestPath, JSON.stringify(result, null, 2));
}

async function main() {
  const url = process.argv[2] || 'http://localhost:3000/dashboard';
  
  log(`Running Lighthouse audit for: ${url}`, 'info');
  log('This may take a minute...\n', 'info');
  
  try {
    const result = await runLighthouseAudit(url);
    checkThresholds(result);
    printResults(result);
    saveResults(result);
    
    process.exit(result.passed ? 0 : 1);
  } catch (error) {
    log(`Audit failed: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

main();
