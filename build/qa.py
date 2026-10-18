"""QA scans: em-dash, avoid-list words, and client names. Usage: python qa.py file [file...]"""
import re, sys

AVOID = ["I hope this finds you well", "I wanted to reach out", "Please don't hesitate",
         "Thank you for your time and consideration", "Looking forward to hearing from you",
         "I wanted to take a moment", "Additionally", "Furthermore", "Moreover", "That said",
         "That being said", "It's worth noting", "comprehensive", "leverage", "facilitate",
         "ensure", "utilize", "No worries", "see you then"]
CLIENTS = []  # the name list is kept in a local file that is not published

for p in sys.argv[1:]:
    t = open(p, encoding='utf-8').read()
    name = p.replace('\\', '/').split('/')[-1]
    print(f"== {name}")
    print("  em-dash:", t.count('—'))
    hits = [w for w in AVOID if re.search(re.escape(w), t, flags=re.I)]
    print("  avoid-list:", hits or "none")
    chits = {}
    for w in CLIENTS:
        n = len(re.findall(r'\b' + re.escape(w) + r'\b', t))
        if n:
            chits[w] = n
    print("  client names:", chits or "none")
