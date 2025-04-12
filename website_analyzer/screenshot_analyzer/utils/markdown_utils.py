"""
Markdown utility functions for screenshot analysis.
"""
import re


def markdown_to_html(markdown_text: str) -> str:
    """
    Convert markdown text to HTML.
    
    Args:
        markdown_text (str): Markdown text
        
    Returns:
        str: HTML text
    """
    try:
        # Handle headers (e.g., # Header 1)
        for i in range(6, 0, -1):  # Start with h6 down to h1
            pattern = r'^{} (.+)$'.format('#' * i)
            markdown_text = re.sub(pattern, r'<h{0}>\1</h{0}>'.format(i), markdown_text, flags=re.MULTILINE)
        
        # Handle bold text (e.g., **bold**)
        markdown_text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', markdown_text)
        
        # Handle italic text (e.g., *italic*)
        markdown_text = re.sub(r'\*(.+?)\*', r'<em>\1</em>', markdown_text)
        
        # Handle unordered lists
        # First, find all list blocks
        list_blocks = re.findall(r'(?:^- .+$\n?)+', markdown_text, re.MULTILINE)
        for block in list_blocks:
            # Convert the block into HTML
            items = re.findall(r'^- (.+)$', block, re.MULTILINE)
            html_items = ''.join([f'<li>{item}</li>' for item in items])
            html_block = f'<ul>{html_items}</ul>'
            # Replace the block in the original text
            markdown_text = markdown_text.replace(block, html_block)
        
        # Handle ordered lists
        list_blocks = re.findall(r'(?:^\d+\. .+$\n?)+', markdown_text, re.MULTILINE)
        for block in list_blocks:
            # Convert the block into HTML
            items = re.findall(r'^\d+\. (.+)$', block, re.MULTILINE)
            html_items = ''.join([f'<li>{item}</li>' for item in items])
            html_block = f'<ol>{html_items}</ol>'
            # Replace the block in the original text
            markdown_text = markdown_text.replace(block, html_block)
        
        # Handle paragraphs (any line that's not a header or list)
        lines = markdown_text.split('\n')
        for i, line in enumerate(lines):
            if line.strip() and not (
                line.strip().startswith('<h') or 
                line.strip().startswith('<ul') or 
                line.strip().startswith('<ol') or 
                line.strip().startswith('<li') or
                line.strip().startswith('<p')
            ):
                lines[i] = f'<p>{line}</p>'
        
        # Join lines back together
        html_text = '\n'.join(lines)
        
        # Remove empty paragraphs
        html_text = re.sub(r'<p>\s*</p>', '', html_text)
        
        return html_text
    except Exception as e:
        print(f"Error converting markdown to HTML: {e}")
        # Fall back to simple line break conversion
        return markdown_text.replace('\n', '<br>')