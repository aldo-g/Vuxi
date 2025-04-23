"""
Command-line interface for the website analyzer.
Main entry point for the CLI when run with -m.
"""

__all__ = ['main']

def main():
    """Entry point for the CLI."""
    from .commands import main as commands_main
    return commands_main()

# This allows the module to be run with python -m website_analyzer.cli
if __name__ == "__main__":
    main()