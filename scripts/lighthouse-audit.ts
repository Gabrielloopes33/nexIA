#!/usr/bin/env node
/**
 * Lighthouse Audit Script for Dashboard
 * Sprint 5: Lighthouse audit (Performance >90, Acessibilidade >95)
 */

import lighthouse from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'
import * as fs from 'fs'
import * as path from 'path'

interface LighthouseScores {
  performance: number
  accessibility: number
  'best-practices': number
  seo: number
  pwa: number
}

interface AuditResult {
  url: string
  scores: LighthouseScores
  metrics: {
    'first-contentful-paint': number
    'largest-contentful-paint': number
    'total-blocking-time': number
    'cumulative-layout-shift': number
    'speed-index': number
  }
  passed: boolean
  timestamp: string
}

const THRESHOLDS = {
  performance: 90,
  accessibility: 95,
  'best-practices': 90,
  seo: 90
}

function log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warning: '\x1b[33m'  // Yellow
  }
  const reset = '\x1b[0m'
  console.log(`${colors[type]}${message}${reset}`)
}

async function runLighthouseAudit(url: string): Promise<AuditResult> {
  const chrome = await chromeLauncher.launch({ 
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'] 
  })
  
  const options = {
    logLevel: 'info' as const,
    output: 'json' as const,
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
    port: chrome.port
  }
  
  const runnerResult = await lighthouse(url, options)
  
  await chrome.kill()
  
  if (!runnerResult) {
    throw new Error('Lighthouse audit failed')
  }
  
  const lhr = runnerResult.lhr
  
  return {
    url,
    scores: {
      performance: Math.round(lhr.categories.performance.score * 100),
      accessibility: Math.round(lhr.categories.accessibility.score * 100),
      'best-practices': Math.round(lhr.categories['best-practices'].score * 100),
      seo: Math.round(lhr.categories.seo.score * 100),
      pwa: Math.round((lhr.categories.pwa?.score || 0) * 100)
    },
    metrics: {
      'first-contentful-paint': lhr.audits['first-contentful-paint'].numericValue || 0,
      'largest-contentful-paint': lhr.audits['largest-contentful-paint'].numericValue || 0,
      'total-blocking-time': lhr.audits['total-blocking-time'].numericValue || 0,
      'cumulative-layout-shift': lhr.audits['cumulative-layout-shift'].numericValue || 0,
      'speed-index': lhr.audits['speed-index'].numericValue || 0
    },
    passed: false, // Will be calculated
    timestamp: new Date().toISOString()
  }
}

function checkThresholds(result: AuditResult): boolean {
  const passed = 
    result.scores.performance >= THRESHOLDS.performance &&
    result.scores.accessibility >= THRESHOLDS.accessibility &&
    result.scores['best-practices'] >= THRESHOLDS['best-practices'] &&
    result.scores.seo >= THRESHOLDS.seo
  
  result.passed = passed
  return passed
}

function printResults(result: AuditResult) {
  console.log('\n')
  log('=' .repeat(60), 'info')
  log('LIGHTHOUSE AUDIT RESULTS', 'info')
  log('=' .repeat(60), 'info')
  console.log('\n')
  
  // Scores
  log('SCORES:', 'info')
  log('-'.repeat(40), 'info')
  
  const scores = [
    { name: 'Performance', score: result.scores.performance, threshold: THRESHOLDS.performance },
    { name: 'Accessibility', score: result.scores.accessibility, threshold: THRESHOLDS.accessibility },
    { name: 'Best Practices', score: result.scores['best-practices'], threshold: THRESHOLDS['best-practices'] },
    { name: 'SEO', score: result.scores.seo, threshold: THRESHOLDS.seo },
    { name: 'PWA', score: result.scores.pwa, threshold: 0 }
  ]
  
  for (const { name, score, threshold } of scores) {
    const passed = score >= threshold
    const icon = passed ? '✅' : '❌'
    const color = passed ? 'success' : 'error'
    const thresholdStr = threshold > 0 ? ` (threshold: ${threshold})` : ''
    log(`${icon} ${name}: ${score}${thresholdStr}`, color)
  }
  
  console.log('\n')
  log('CORE WEB VITALS:', 'info')
  log('-'.repeat(40), 'info')
  
  const fcp = result.metrics['first-contentful-paint'] / 1000
  const lcp = result.metrics['largest-contentful-paint'] / 1000
  const tbt = result.metrics['total-blocking-time']
  const cls = result.metrics['cumulative-layout-shift']
  const si = result.metrics['speed-index'] / 1000
  
  log(`First Contentful Paint: ${fcp.toFixed(2)}s`, fcp < 1.8 ? 'success' : fcp < 3 ? 'warning' : 'error')
  log(`Largest Contentful Paint: ${lcp.toFixed(2)}s`, lcp < 2.5 ? 'success' : lcp < 4 ? 'warning' : 'error')
  log(`Total Blocking Time: ${tbt.toFixed(0)}ms`, tbt < 200 ? 'success' : tbt < 500 ? 'warning' : 'error')
  log(`Cumulative Layout Shift: ${cls.toFixed(3)}`, cls < 0.1 ? 'success' : cls < 0.25 ? 'warning' : 'error')
  log(`Speed Index: ${si.toFixed(2)}s`, si < 3.4 ? 'success' : 'warning')
  
  console.log('\n')
  log('=' .repeat(60), 'info')
  
  if (result.passed) {
    log('✅ ALL THRESHOLDS PASSED!', 'success')
  } else {
    log('❌ SOME THRESHOLDS FAILED', 'error')
  }
  
  log('=' .repeat(60), 'info')
  console.log('\n')
}

function saveResults(result: AuditResult) {
  const reportsDir = path.join(process.cwd(), 'lighthouse-reports')
  
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true })
  }
  
  const filename = `audit-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  const filepath = path.join(reportsDir, filename)
  
  fs.writeFileSync(filepath, JSON.stringify(result, null, 2))
  log(`Report saved to: ${filepath}`, 'success')
  
  // Also save latest
  const latestPath = path.join(reportsDir, 'latest.json')
  fs.writeFileSync(latestPath, JSON.stringify(result, null, 2))
}

async function main() {
  const url = process.argv[2] || 'http://localhost:3000/dashboard'
  
  log(`Running Lighthouse audit for: ${url}`, 'info')
  log('This may take a minute...\n', 'info')
  
  try {
    const result = await runLighthouseAudit(url)
    checkThresholds(result)
    printResults(result)
    saveResults(result)
    
    process.exit(result.passed ? 0 : 1)
  } catch (error) {
    log(`Audit failed: ${error}`, 'error')
    process.exit(1)
  }
}

main()
