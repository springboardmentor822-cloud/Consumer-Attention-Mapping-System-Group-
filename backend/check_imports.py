import pathlib

for f in pathlib.Path("app").rglob("*.py"):
    t = f.read_text(encoding="utf-8", errors="ignore")
    main = "from app.core.db import" in t
    ts = "from app.core.timescale_db import" in t
    if main or ts:
        tag = ""
        if main:
            tag += " | main_db"
        if ts:
            tag += " | timescale_db"
        print(f"{f}{tag}")