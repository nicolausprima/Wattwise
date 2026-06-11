import os
import re

# Dictionary of replacements
replacements = {
    '#1D9E75': 'var(--green)',
    '#EAF3DE': 'var(--green-light)',
    '#0F6E56': 'var(--green-dark)',
    '#27500A': 'var(--green-text)',
    '#3B6D11': 'var(--green-text)',

    '#378ADD': 'var(--blue)',
    '#E6F1FB': 'var(--blue-light)',
    '#185FA5': 'var(--blue-dark)',
    '#0C447C': 'var(--blue-text)',

    '#E24B4A': 'var(--red)',
    '#FCEBEB': 'var(--red-light)',
    '#A32D2D': 'var(--red-dark)',
    '#791F1F': 'var(--red-text)',

    '#EF9F27': 'var(--amber)',
    '#FAEEDA': 'var(--amber-light)',
    '#854F0B': 'var(--amber-text)',

    'rgba(29,158,117,0.7)': 'var(--green)',
    'rgba(55,138,221,0.7)': 'var(--blue)',
    'rgba(226,75,74,0.7)': 'var(--red)',
    
    'rgba(29,158,117,0.12)': 'var(--green-light)',
    'rgba(55,138,221,0.12)': 'var(--blue-light)',
    'rgba(226,75,74,0.12)': 'var(--red-light)',
    
    '#1A1917': 'var(--text-primary)',
    '#6B6A65': 'var(--text-secondary)',
    '#9A9994': 'var(--text-muted)',
    '#F5F4F0': 'var(--bg)',
    '#FFFFFF': 'var(--surface)',
    '#F0EEE9': 'var(--surface2)',
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    for old, new in replacements.items():
        # Case insensitive replace
        content = re.sub(re.escape(old), new, content, flags=re.IGNORECASE)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# Process index.html and main.js
basedir = r"c:\Coding SDT\VS Code\Python\Semester 4\Proyek Akhir Rekomendasi Sistem"
process_file(os.path.join(basedir, "frontend", "index.html"))
process_file(os.path.join(basedir, "frontend", "assets", "js", "main.js"))

print("Replacements done.")
