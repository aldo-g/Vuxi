/**
 * Trims Lighthouse reports to include only essential data
 * Reduces file size by removing unnecessary details
 */

function trimReport(fullReport) {
    const trimmed = {
      finalUrl: fullReport.finalUrl,
      requestedUrl: fullReport.requestedUrl,
      lighthouseVersion: fullReport.lighthouseVersion,
      fetchTime: fullReport.fetchTime,
      
      // Overall scores
      scores: {},
      
      // Key metrics
      metrics: {},
      
      // Important audits only
      audits: {},
      
      // Core Web Vitals
      coreWebVitals: {}
    };
    
    // Extract category scores
    if (fullReport.categories) {
      Object.keys(fullReport.categories).forEach(key => {
        trimmed.scores[key] = {
          score: fullReport.categories[key].score,
          title: fullReport.categories[key].title
        };
      });
    }
    
    // Extract key metrics
    if (fullReport.audits && fullReport.audits.metrics) {
      const metricsData = fullReport.audits.metrics.details.items[0];
      
      trimmed.metrics = {
        firstContentfulPaint: metricsData.firstContentfulPaint,
        largestContentfulPaint: metricsData.largestContentfulPaint,
        interactive: metricsData.interactive,
        speedIndex: metricsData.speedIndex,
        totalBlockingTime: metricsData.totalBlockingTime,
        cumulativeLayoutShift: metricsData.cumulativeLayoutShift,
      };
      
      // Core Web Vitals
      trimmed.coreWebVitals = {
        lcp: {
          value: metricsData.largestContentfulPaint,
          displayValue: fullReport.audits['largest-contentful-paint']?.displayValue,
          score: fullReport.audits['largest-contentful-paint']?.score
        },
        fid: {
          value: metricsData.totalBlockingTime, // TBT as proxy for FID
          displayValue: fullReport.audits['total-blocking-time']?.displayValue,
          score: fullReport.audits['total-blocking-time']?.score
        },
        cls: {
          value: metricsData.cumulativeLayoutShift,
          displayValue: fullReport.audits['cumulative-layout-shift']?.displayValue,
          score: fullReport.audits['cumulative-layout-shift']?.score
        }
      };
    }
    
    // Extract important audits with trimmed data
    const importantAudits = [
      'first-contentful-paint',
      'largest-contentful-paint',
      'interactive',
      'speed-index',
      'total-blocking-time',
      'cumulative-layout-shift',
      'meta-description',
      'meta-viewport',
      'document-title',
      'color-contrast',
      'image-alt',
      'html-has-lang',
      'errors-in-console',
      'is-on-https',
      'uses-responsive-images'
    ];
    
    importantAudits.forEach(auditId => {
      if (fullReport.audits && fullReport.audits[auditId]) {
        const audit = fullReport.audits[auditId];
        trimmed.audits[auditId] = {
          id: audit.id,
          title: audit.title,
          description: audit.description,
          score: audit.score,
          displayValue: audit.displayValue,
          numericValue: audit.numericValue,
          warnings: audit.warnings
        };
        
        // Include details only for failed audits
        if (audit.score !== null && audit.score < 1 && audit.details) {
          if (audit.details.type === 'table' && audit.details.items) {
            // Limit table items to first 5
            trimmed.audits[auditId].details = {
              type: audit.details.type,
              headings: audit.details.headings,
              items: audit.details.items.slice(0, 5)
            };
          } else if (audit.details.type === 'list' && audit.details.items) {
            // Limit list items to first 10
            trimmed.audits[auditId].details = {
              type: audit.details.type,
              items: audit.details.items.slice(0, 10)
            };
          }
        }
      }
    });
    
    // Performance optimization opportunities (trimmed)
    trimmed.opportunities = [];
    if (fullReport.categories && fullReport.categories.performance && fullReport.categories.performance.auditRefs) {
      fullReport.categories.performance.auditRefs.forEach(auditRef => {
        if (auditRef.group === 'load-opportunities') {
          const audit = fullReport.audits[auditRef.id];
          if (audit && audit.score !== null && audit.score < 1 && audit.details && audit.details.overallSavingsMs > 100) {
            trimmed.opportunities.push({
              id: audit.id,
              title: audit.title,
              description: audit.description,
              displayValue: audit.displayValue,
              overallSavingsMs: audit.details.overallSavingsMs
            });
          }
        }
      });
    }
    
    // Accessibility issues (summary only)
    trimmed.accessibility = {
      score: trimmed.scores.accessibility?.score || 0,
      issues: []
    };
    
    if (fullReport.categories && fullReport.categories.accessibility && fullReport.categories.accessibility.auditRefs) {
      fullReport.categories.accessibility.auditRefs.forEach(auditRef => {
        const audit = fullReport.audits[auditRef.id];
        if (audit && audit.score !== null && audit.score < 1) {
          trimmed.accessibility.issues.push({
            id: audit.id,
            title: audit.title,
            impact: auditRef.weight > 5 ? 'high' : 'medium'
          });
        }
      });
    }
    
    return trimmed;
  }
  
  module.exports = { trimReport };