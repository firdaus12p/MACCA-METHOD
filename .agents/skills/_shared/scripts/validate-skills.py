#!/usr/bin/env python3

from __future__ import annotations

import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[4]
SKILLS_DIR = ROOT / ".agents" / "skills"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def has_toc(text: str) -> bool:
    return "## Daftar Isi" in text or "## Table of Contents" in text


def check_skill_file(path: Path) -> list[str]:
    issues: list[str] = []
    text = read(path)
    lines = text.splitlines()

    if len(lines) > 500:
        issues.append(f"{path}: more than 500 lines ({len(lines)})")

    if "<SECURITY_REVIEW>" in text:
        issues.append(f"{path}: <SECURITY_REVIEW> placeholder was not replaced")

    if re.search(r"^```markdown\s*$", text, re.MULTILINE) and re.search(
        r"^```(?:json|text|typescript|bash)\s*$", text, re.MULTILINE
    ):
        issues.append(
            f"{path}: possible broken nested fence; check and use 4 backticks for the outer template"
        )

    return issues


def check_reference_file(path: Path) -> list[str]:
    issues: list[str] = []
    text = read(path)
    lines = text.splitlines()

    if len(lines) > 100 and not has_toc(text):
        issues.append(f"{path}: reference file >100 lines without a table of contents")

    if (
        "Baca `../references/runtime-config.md`" in text
        or "Read `../references/runtime-config.md`" in text
    ):
        issues.append(
            f"{path}: chained reference to runtime-config; caller skill should read shared refs directly"
        )

    return issues


def main() -> int:
    issues: list[str] = []

    for skill_md in SKILLS_DIR.glob("**/SKILL.md"):
        issues.extend(check_skill_file(skill_md))

    for ref in SKILLS_DIR.glob("**/references/*.md"):
        issues.extend(check_reference_file(ref))

    if not issues:
        print("OK: no skill authoring issues detected")
        return 0

    print("Skill validator findings:")
    for issue in issues:
        print(f"- {issue}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
