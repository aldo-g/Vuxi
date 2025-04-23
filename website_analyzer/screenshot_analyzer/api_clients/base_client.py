"""
Base API client for screenshot analysis.
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any


class BaseAPIClient(ABC):
    """
    Abstract base class for API clients used in screenshot analysis.
    """
    
    @abstractmethod
    def analyze(self, screenshots: List[str], prompt: str) -> Dict[str, Any]:
        """
        Analyze screenshots using the API.
        
        Args:
            screenshots (List[str]): List of screenshot paths
            prompt (str): Analysis prompt
            
        Returns:
            Dict[str, Any]: Analysis results
        """
