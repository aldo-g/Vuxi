"""
Lighthouse audit module for the website analyzer.
"""
from .auditor import LighthouseAuditor
from .report_trimmer import (
    trim_lighthouse_report,
    format_trimmed_report_for_analysis,
    trim_all_lighthouse_reports
)

__all__ = [
    'LighthouseAuditor',
    'parse_lighthouse_report',
    'trim_lighthouse_report',
    'format_trimmed_report_for_analysis',
    'trim_all_lighthouse_reports'
]