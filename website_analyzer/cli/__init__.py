"""
Command-line interface for the website analyzer.
"""

__all__ = ['main']

def main():
    """Entry point for the CLI."""
    from .commands import main as commands_main
    return commands_main()