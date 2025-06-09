// packages/analysis/index.js
const { LighthouseService } = require('./lighthouse');
const { LLMAnalysisService } = require('./llm-analysis');
const { FormattingService } = require('./formatting');
const { HTMLReportService } = require('./html-report');

async function analysis(data) {
  const { urls, screenshots, organizationName, organizationPurpose } = data;
  const preset = {
      purpose: organizationPurpose
  };
  const lighthouseResult = await LighthouseService.runLighthouseAudits(urls);
  const llmAnalysisResult = await LLMAnalysisService.analyze(screenshots, lighthouseResult, preset);
  const formattedResult = await FormattingService.format(llmAnalysisResult, preset);
  const htmlReport = await HTMLReportService.generateReport({ ...formattedResult, organization: { name: organizationName } });
  return htmlReport;
}

module.exports = { analysis };