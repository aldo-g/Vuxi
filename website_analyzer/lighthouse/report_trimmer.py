"""
Lighthouse report trimming functionality for condensing reports for API analysis.
"""
import json
import os
from typing import Dict, Any, List


def trim_lighthouse_report(report_path: str) -> Dict[str, Any]:
    """
    Trim a Lighthouse JSON report to only the essential information for API analysis.
    
    Args:
        report_path (str): Path to the Lighthouse JSON report
        
    Returns:
        Dict[str, Any]: Trimmed report data
    """
    try:
        with open(report_path, 'r') as f:
            full_report = json.load(f)
        
        # Extract essential data
        trimmed_report = {
            "url": full_report.get("requestedUrl", "Unknown URL"),
            "fetch_time": full_report.get("fetchTime", "Unknown"),
            "scores": {},
            "audits": {},
            "metrics": {}
        }
        
        # Extract category scores
        categories = full_report.get("categories", {})
        for category_id, category_data in categories.items():
            trimmed_report["scores"][category_id] = {
                "score": category_data.get("score", 0) * 100,
                "title": category_data.get("title", category_id)
            }
        
        # Extract key audits (pass/fail) - only the most important ones
        key_audits = [
            "first-contentful-paint",
            "largest-contentful-paint",
            "cumulative-layout-shift",
            "total-blocking-time",
            "speed-index",
            "interactive",
            "viewport",
            "https-only",
            "redirects",
            "image-aspect-ratio",
            "document-title",
            "html-has-lang",
            "color-contrast",
            "meta-description",
            "font-size",
            "tap-targets",
            "button-name",
            "link-name",
            "label",
            "form-field-multiple-labels"
        ]
        
        audits = full_report.get("audits", {})
        for audit_id in key_audits:
            if audit_id in audits:
                audit_data = audits[audit_id]
                trimmed_report["audits"][audit_id] = {
                    "title": audit_data.get("title", audit_id),
                    "score": audit_data.get("score", 0),
                    "displayValue": audit_data.get("displayValue", ""),
                    "description": audit_data.get("description", "")[:200]  # Truncate long descriptions
                }
        
        # Extract key metrics
        metrics_audit = audits.get("metrics", {})
        if metrics_audit and "details" in metrics_audit:
            metrics_items = metrics_audit["details"].get("items", [{}])[0]
            trimmed_report["metrics"] = {
                "firstContentfulPaint": metrics_items.get("firstContentfulPaint", 0),
                "largestContentfulPaint": metrics_items.get("largestContentfulPaint", 0),
                "cumulativeLayoutShift": metrics_items.get("cumulativeLayoutShift", 0),
                "totalBlockingTime": metrics_items.get("totalBlockingTime", 0),
                "speedIndex": metrics_items.get("speedIndex", 0),
                "interactive": metrics_items.get("interactive", 0)
            }
        
        return trimmed_report
        
    except Exception as e:
        print(f"Error trimming Lighthouse report {report_path}: {e}")
        return {
            "error": str(e),
            "url": os.path.basename(report_path)
        }


def format_trimmed_report_for_analysis(trimmed_report: Dict[str, Any]) -> str:
    """
    Format a trimmed Lighthouse report into a text format suitable for API analysis.
    
    Args:
        trimmed_report (Dict[str, Any]): Trimmed report data
        
    Returns:
        str: Formatted report text
    """
    if "error" in trimmed_report:
        return f"Error processing report: {trimmed_report['error']}"
    
    lines = []
    
    # Page information
    lines.append(f"Page: {trimmed_report['url']}")
    lines.append(f"Tested: {trimmed_report['fetch_time']}")
    lines.append("")
    
    # Scores
    lines.append("LIGHTHOUSE SCORES:")
    for category, data in trimmed_report['scores'].items():
        lines.append(f"- {data['title']}: {data['score']:.1f}/100")
    lines.append("")
    
    # Key metrics
    lines.append("PERFORMANCE METRICS:")
    metrics = trimmed_report['metrics']
    if metrics:
        lines.append(f"- First Contentful Paint: {metrics.get('firstContentfulPaint', 0)/1000:.1f}s")
        lines.append(f"- Largest Contentful Paint: {metrics.get('largestContentfulPaint', 0)/1000:.1f}s")
        lines.append(f"- Cumulative Layout Shift: {metrics.get('cumulativeLayoutShift', 0):.3f}")
        lines.append(f"- Total Blocking Time: {metrics.get('totalBlockingTime', 0):.0f}ms")
        lines.append(f"- Speed Index: {metrics.get('speedIndex', 0)/1000:.1f}s")
        lines.append(f"- Time to Interactive: {metrics.get('interactive', 0)/1000:.1f}s")
    lines.append("")
    
    # Key issues (failed audits)
    lines.append("KEY ISSUES:")
    failed_audits = []
    for audit_id, audit_data in trimmed_report['audits'].items():
        if audit_data['score'] is not None and audit_data['score'] < 1:
            fail_text = f"- {audit_data['title']}"
            if audit_data['displayValue']:
                fail_text += f" ({audit_data['displayValue']})"
            failed_audits.append(fail_text)
    
    if failed_audits:
        lines.extend(failed_audits)
    else:
        lines.append("- No major issues found")
    
    return "\n".join(lines)


def trim_all_lighthouse_reports(reports_dir: str) -> List[Dict[str, Any]]:
    """
    Trim all Lighthouse JSON reports in a directory.
    
    Args:
        reports_dir (str): Directory containing Lighthouse JSON reports
        
    Returns:
        List[Dict[str, Any]]: List of trimmed reports
    """
    trimmed_reports = []
    
    if not os.path.exists(reports_dir):
        print(f"Reports directory not found: {reports_dir}")
        return trimmed_reports
    
    for filename in os.listdir(reports_dir):
        if filename.endswith(".json"):
            report_path = os.path.join(reports_dir, filename)
            trimmed_report = trim_lighthouse_report(report_path)
            trimmed_reports.append(trimmed_report)
    
    return trimmed_reports