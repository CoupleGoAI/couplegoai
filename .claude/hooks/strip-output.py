#!/usr/bin/env python3
"""
PostToolUse hook: strip ANSI codes, collapse long stack traces.
Receives tool result JSON on stdin; prints cleaned JSON to stdout.
"""
import sys
import json
import re

MAX_OUTPUT = 20_000  # chars kept per tool call after cleaning

ANSI = re.compile(r"\x1b\[[0-9;]*[mGKHF]|\x1b\].*?\x07|\x1b\[.*?[A-Za-z]")

STACK_FRAME = re.compile(
    r"^(\s+at .+|.*\.(js|ts|tsx):\d+:\d+.*|.*Error:.*|File \".*\", line \d+.*)$"
)
MAX_STACK_FRAMES = 12


def strip_ansi(text: str) -> str:
    return ANSI.sub("", text)


def collapse_stack_trace(text: str) -> str:
    lines = text.splitlines()
    out = []
    stack_count = 0
    for line in lines:
        if STACK_FRAME.match(line):
            stack_count += 1
            if stack_count <= MAX_STACK_FRAMES:
                out.append(line)
            elif stack_count == MAX_STACK_FRAMES + 1:
                out.append(f"  ... (stack trace truncated by hook)")
        else:
            stack_count = 0
            out.append(line)
    return "\n".join(out)


def truncate(text: str, limit: int) -> str:
    if len(text) <= limit:
        return text
    keep = limit // 2
    return (
        text[:keep]
        + f"\n\n[... {len(text) - limit} chars removed by hook ...]\n\n"
        + text[-keep:]
    )


def process(text: str) -> str:
    text = strip_ansi(text)
    text = collapse_stack_trace(text)
    text = truncate(text, MAX_OUTPUT)
    return text


def main() -> None:
    raw = sys.stdin.read()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        # Not JSON — pass through unchanged
        sys.stdout.write(raw)
        return

    # Claude Code PostToolUse: data has a "output" key for Bash results
    if isinstance(data, dict) and "output" in data:
        data["output"] = process(str(data["output"]))
        sys.stdout.write(json.dumps(data))
    else:
        sys.stdout.write(raw)


if __name__ == "__main__":
    main()
