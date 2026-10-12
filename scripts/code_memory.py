import os
import sys
import json
import math
import re
from pathlib import Path

# Force utf-8 stdout on Windows terminals
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

# Lightweight, zero-dependency TF-IDF BM25-like Vector & Symbol Memory for DairyERP
# Runs 100% locally on standard Python 3. No torch, no heavy C-dependencies.
# Perfect for AI vibe-coding token minimization.

INDEX_FILE = Path(".code_index.json")
SUPPORTED_EXTS = {".js", ".html", ".py", ".sql", ".md", ".json"}
IGNORE_DIRS = {".git", "node_modules", ".gemini", "dist", ".wrangler", "__pycache__"}

def tokenize(text):
    # Splits camelCase, snake_case, and words
    text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)
    tokens = re.findall(r'[a-zA-Z0-9_\u0400-\u04FF]+', text.lower())
    return [t for t in tokens if len(t) > 1]

def build_index():
    print("[Index] Scanning codebase and building local index...")

    root = Path(".")
    chunks = []
    
    for path in root.rglob("*"):
        if path.is_file() and path.suffix in SUPPORTED_EXTS:
            if any(ignored in path.parts for ignored in IGNORE_DIRS):
                continue
            try:
                content = path.read_text(encoding="utf-8", errors="ignore")
                lines = content.splitlines()
                # Chunk into meaningful 30-line blocks with overlap
                step = 25
                chunk_size = 40
                for i in range(0, max(1, len(lines)), step):
                    chunk_lines = lines[i:i + chunk_size]
                    if not chunk_lines:
                        continue
                    chunk_text = "\n".join(chunk_lines)
                    words = tokenize(chunk_text)
                    if not words:
                        continue
                    chunks.append({
                        "file": str(path.as_posix()),
                        "start_line": i + 1,
                        "end_line": min(len(lines), i + chunk_size),
                        "words": list(set(words)),
                        "preview": "\n".join(chunk_lines[:5])
                    })
            except Exception as e:
                pass

    INDEX_FILE.write_text(json.dumps(chunks, ensure_ascii=False), encoding="utf-8")
    print(f"✅ Indexed {len(chunks)} code chunks into {INDEX_FILE} (Ready for fast search).")

def search(query, top_k=5):
    if not INDEX_FILE.exists():
        build_index()
    
    chunks = json.loads(INDEX_FILE.read_text(encoding="utf-8"))
    query_tokens = set(tokenize(query))
    if not query_tokens:
        print("❌ Query is empty.")
        return

    scored = []
    for chunk in chunks:
        chunk_words = set(chunk["words"])
        match_count = len(query_tokens.intersection(chunk_words))
        if match_count > 0:
            # Score by token intersection ratio
            score = match_count / (math.sqrt(len(chunk_words)) + 1e-5)
            # Boost matches in file path
            for qt in query_tokens:
                if qt in chunk["file"].lower():
                    score += 0.5
            scored.append((score, chunk))

    scored.sort(key=lambda x: x[0], reverse=True)
    results = scored[:top_k]

    if not results:
        print(f"🔍 No relevant code found for: '{query}'")
        return

    print(f"\n🔍 Top {len(results)} relevant code locations for: '{query}'\n" + "="*60)
    for score, item in results:
        print(f"📍 {item['file']} (Lines {item['start_line']} - {item['end_line']}) [Score: {score:.3f}]")
        for line in item['preview'].splitlines()[:3]:
            print(f"   | {line.strip()[:100]}")
        print("-" * 60)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python scripts/code_memory.py index           (Rebuild local index)")
        print("  python scripts/code_memory.py search <query>  (Find exact code chunks)")
        sys.exit(0)

    cmd = sys.argv[1].lower()
    if cmd == "index":
        build_index()
    elif cmd == "search":
        q = " ".join(sys.argv[2:])
        search(q)
    else:
        # Default to search
        q = " ".join(sys.argv[1:])
        search(q)
