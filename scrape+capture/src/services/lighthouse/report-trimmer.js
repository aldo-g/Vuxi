/**
 * Aggressively trims Lighthouse reports to include only essential data
 * Reduces file size by removing unnecessary details
 */

function trimReport(fullReport) {
  const trimmed = {
    finalUrl: fullReport.finalUrl,
    requestedUrl: fullReport.requestedUrl,
    lighthouseVersion: fullReport.lighthouseVersion,
    fetchTime: fullReport.fetchTime,
    
    // Overall scores only
    scores: {},
    
    // Core metrics only
    metrics: {},
    
    // Core Web Vitals only
    coreWebVitals: {},
    
    // Critical issues summary (no details)
    issues: {
      performance: [],
      accessibility: [],
      seo: [],
      bestPractices: []
    }
  };
  
  // Extract category scores (just the numbers)
  if (fullReport.categories) {
    Object.keys(fullReport.categories).forEach(key => {
      trimmed.scores[key] = {
        score: fullReport.categories[key].score,
        title: fullReport.categories[key].title
      };
    });
  }
  
  // Extract ONLY core metrics (no descriptions, no details)
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
    
    // Core Web Vitals (essential values only)
    trimmed.coreWebVitals = {
      lcp: {
        value: metricsData.largestContentfulPaint,
        score: fullReport.audits['largest-contentful-paint']?.score
      },
      fid: {
        value: metricsData.totalBlockingTime, // TBT as proxy for FID
        score: fullReport.audits['total-blocking-time']?.score
      },
      cls: {
        value: metricsData.cumulativeLayoutShift,
        score: fullReport.audits['cumulative-layout-shift']?.score
      }
    };
  }
  
  // Extract only CRITICAL issues (titles only, no details)
  const criticalAudits = [
    'meta-description',
    'color-contrast', 
    'image-alt',
    'errors-in-console'
  ];
  
  criticalAudits.forEach(auditId => {
    if (fullReport.audits && fullReport.audits[auditId] && fullReport.audits[auditId].score < 1) {
      const audit = fullReport.audits[auditId];
      
      // Determine category
      let category = 'bestPractices';
      if (auditId === 'meta-description') category = 'seo';
      if (auditId === 'color-contrast' || auditId === 'image-alt') category = 'accessibility';
      if (auditId === 'errors-in-console') category = 'bestPractices';
      
      // Add minimal issue info
      trimmed.issues[category].push({
        id: auditId,
        title: audit.title,
        score: audit.score
      });
    }
  });
  
  return trimmed;
}

module.exports = { trimReport };