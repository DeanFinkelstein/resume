"""QA scan for anything that ships: dashes, avoid-list phrases, and client names.

Usage: python qa.py file [file...]

Reads PDFs (through pdftotext, which comes with Git for Windows), Word files
(their XML), and any UTF-8 text file. HTML entities are decoded first, so
&mdash; counts as an em-dash.

Client and client-contact names live in clients.local.txt beside this script,
one per line. That file is git-ignored and never published. Without it the
scan exits 2 instead of passing.

Exit codes: 0 clean, 1 at least one hit, 2 a file could not be read or the
name list is missing.
"""
import os, re, shutil, subprocess, sys, zipfile
from html import unescape

HERE = os.path.dirname(os.path.abspath(__file__))
NAMES_FILE = os.path.join(HERE, 'clients.local.txt')
GIT_PDFTOTEXT = r'C:\Program Files\Git\mingw64\bin\pdftotext.exe'

AVOID = ["I hope this finds you well", "I wanted to reach out", "Please don't hesitate",
         "Thank you for your time and consideration", "Looking forward to hearing from you",
         "I wanted to take a moment", "Additionally", "Furthermore", "Moreover", "That said",
         "That being said", "It's worth noting", "comprehensive", "leverage", "facilitate",
         "ensure", "utilize", "No worries", "see you then"]
DASHES = {'em-dash': '\u2014', 'en-dash': '\u2013'}


def load_names():
    if not os.path.exists(NAMES_FILE):
        return None
    with open(NAMES_FILE, encoding='utf-8') as f:
        return [l.strip() for l in f if l.strip() and not l.lstrip().startswith('#')]


def pdf_text(path):
    exe = shutil.which('pdftotext') or (GIT_PDFTOTEXT if os.path.exists(GIT_PDFTOTEXT) else None)
    if not exe:
        raise RuntimeError('pdftotext not found (it comes with Git for Windows or poppler)')
    out = subprocess.run([exe, '-enc', 'UTF-8', path, '-'], capture_output=True, check=True)
    return out.stdout.decode('utf-8')


def docx_text(path):
    with zipfile.ZipFile(path) as z:
        parts = [n for n in z.namelist() if n.startswith('word/') and n.endswith('.xml')]
        xml = '\n'.join(z.read(n).decode('utf-8') for n in parts)
    # Join the runs inside each paragraph, so a name split across runs still matches.
    paras = re.findall(r'<w:p[ >].*?</w:p>', xml, flags=re.S)
    return '\n'.join(''.join(re.findall(r'<w:t(?: [^>]*)?>([^<]*)</w:t>', p)) for p in paras)


def read_text(path):
    ext = os.path.splitext(path)[1].lower()
    if ext == '.pdf':
        t = pdf_text(path)
    elif ext == '.docx':
        t = docx_text(path)
    else:
        with open(path, encoding='utf-8') as f:
            t = f.read()
    t = unescape(t).replace('\u2019', "'")
    return re.sub(r'\s+', ' ', t)


def scan(text, names):
    hits = [f'{label} x{text.count(ch)}' for label, ch in DASHES.items() if ch in text]
    hits += [f'avoid-list "{w}"' for w in AVOID if re.search(re.escape(w), text, flags=re.I)]
    for w in names:
        n = len(re.findall(r'\b' + re.escape(w) + r'\b', text))
        if n:
            hits.append(f'client name "{w}" x{n}')
    return hits


def main(paths):
    if not paths:
        print('Usage: python qa.py file [file...]')
        return 2
    status = 0
    names = load_names()
    if names is None:
        print(f'!! {os.path.basename(NAMES_FILE)} not found beside qa.py: client names NOT checked')
        status = 2
    for p in paths:
        label = os.path.basename(p)
        try:
            text = read_text(p)
        except (OSError, UnicodeDecodeError, zipfile.BadZipFile, subprocess.CalledProcessError, RuntimeError) as e:
            print(f'!! {label}: could not read ({e.__class__.__name__}: {e})')
            status = 2
            continue
        hits = scan(text, names or [])
        print(f'== {label}: ' + ('; '.join(hits) if hits else 'clean'))
        if hits and status == 0:
            status = 1
    return status


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
