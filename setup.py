from setuptools import setup, find_packages

setup(
    name="website_analyzer",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "playwright>=1.32.0",
    ],
    entry_points={
        'console_scripts': [
            'website-analyzer=website_analyzer.cli:main',
        ],
    },
    author="",
    author_email="",
    description="A tool for website UX/UI analysis with screenshots and Lighthouse audits",
    keywords="web, analysis, screenshots, lighthouse",
    python_requires=">=3.7",
)