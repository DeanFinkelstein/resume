"""Render BRIEFING.md to BRIEFING.html (print-ready) and, if Chrome is present, BRIEFING.pdf.
Usage: python render.py [--no-pdf]
"""
import os, subprocess, sys, markdown

here = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(here, 'BRIEFING.md')
html_out = os.path.join(here, 'BRIEFING.html')
pdf_out = os.path.join(here, 'BRIEFING.pdf')

body = markdown.markdown(open(src, encoding='utf-8').read(), extensions=['tables'])

page = f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Adopting AI safely in a Salesforce shop</title>
<style>
:root{{--ink:#1f2328;--muted:#5b6670;--rule:#d9dee3;--accent:#e69138;--soft:#fff7ee}}
*{{box-sizing:border-box}}
html{{background:#f3f4f6}}
body{{margin:0 auto;max-width:860px;padding:28px 18px 40px;background:#fff;color:var(--ink);font-family:Calibri,Carlito,"Segoe UI",-apple-system,Roboto,Helvetica,Arial,sans-serif;font-size:15.5px;line-height:1.45}}
h1{{font-size:28px;line-height:1.15;margin:0 0 6px;padding-bottom:6px;border-bottom:2px solid var(--accent)}}
h2{{font-size:15px;letter-spacing:1px;text-transform:uppercase;margin:20px 0 6px;padding-bottom:3px;border-bottom:1px solid var(--accent)}}
h1 + p{{color:var(--muted);font-size:14px}}
p{{margin:0 0 8px}}
ul,ol{{margin:0 0 8px;padding-left:22px}}
li{{margin:0 0 5px}}
li::marker{{color:var(--accent)}}
table{{border-collapse:collapse;width:100%;margin:4px 0 10px;font-size:14px}}
th,td{{text-align:left;vertical-align:top;padding:6px 8px;border-bottom:1px solid var(--rule)}}
th{{font-size:12px;letter-spacing:.5px;text-transform:uppercase;color:var(--muted);background:#f7f8fa}}
a{{color:var(--ink);text-decoration:none;border-bottom:1px solid var(--accent);word-break:break-all}}
@media print{{
  @page{{size:Letter;margin:0.45in}}
  html,body{{background:#fff;max-width:none;padding:0;margin:0;font-size:8pt;line-height:1.17;color:#000}}
  h1{{font-size:16pt;margin:0 0 2pt;padding-bottom:2pt}}
  h1 + p{{font-size:7.8pt;margin:0 0 4pt}}
  h2{{font-size:8pt;margin:5pt 0 1.5pt;padding-bottom:1pt;break-after:avoid}}
  p{{margin:0 0 2pt}}
  ul,ol{{margin:0 0 3pt;padding-left:14pt}}
  li{{margin:0 0 1pt;break-inside:avoid}}
  table{{font-size:7.2pt;margin:1pt 0 3pt}}
  th,td{{padding:1.2pt 3pt;border-bottom:0.5pt solid #ccc}}
  th{{font-size:6.8pt;background:#fff}}
  tr{{break-inside:avoid}}
  a{{border:0;color:#000}}
  h2:last-of-type + ul{{columns:2;column-gap:14pt;font-size:6.6pt;line-height:1.12}}
  h2:last-of-type + ul li{{margin:0 0 1pt}}
}}
</style></head><body>
{body}
</body></html>
"""
open(html_out, 'w', encoding='utf-8', newline='\n').write(page)
print('wrote', html_out)

if '--no-pdf' in sys.argv:
    sys.exit(0)
chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
if not os.path.exists(chrome):
    print('Chrome not found; open BRIEFING.html and print to PDF by hand')
    sys.exit(0)
profile = os.path.join(os.environ.get('TEMP', here), 'briefing-chrome-profile')
url = 'file:///' + html_out.replace('\\', '/').replace(' ', '%20')
subprocess.run([chrome, '--headless=new', '--disable-gpu', '--no-first-run', f'--user-data-dir={profile}',
                '--no-pdf-header-footer', f'--print-to-pdf={pdf_out}', url], check=False,
               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
print('wrote', pdf_out if os.path.exists(pdf_out) else '(pdf not produced)')
