#!/usr/bin/env python3

from __future__ import annotations

import re
import sys
from pathlib import Path

SKILLS_DIR = Path(__file__).resolve().parents[2]
ALLOWED_FRONTMATTER = {
    "name",
    "description",
    "license",
    "compatibility",
    "metadata",
    "allowed-tools",
}
NAME_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
MARKDOWN_LINK_RE = re.compile(r"\[[^\]]*\]\(([^)]+)\)")


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def has_toc(text: str) -> bool:
    return "## Daftar Isi" in text or "## Table of Contents" in text


def parse_frontmatter(path: Path, text: str) -> tuple[dict[str, object], list[str]]:
    issues: list[str] = []
    lines = text.splitlines()
    if not lines or lines[0] != "---":
        return {}, [f"{path}: SKILL.md must start with YAML frontmatter on line 1"]

    try:
        end = lines.index("---", 1)
    except ValueError:
        return {}, [f"{path}: frontmatter closing delimiter is missing"]

    data: dict[str, object] = {}
    current_map: str | None = None
    for line_number, line in enumerate(lines[1:end], start=2):
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if line.startswith("  "):
            if current_map != "metadata" or ":" not in line:
                issues.append(
                    f"{path}:{line_number}: unsupported nested frontmatter value"
                )
                continue
            key, value = line.strip().split(":", 1)
            metadata = data.setdefault("metadata", {})
            assert isinstance(metadata, dict)
            metadata[key] = value.strip().strip("\"'")
            continue
        if ":" not in line:
            issues.append(f"{path}:{line_number}: invalid frontmatter line")
            continue
        key, value = line.split(":", 1)
        key = key.strip()
        if key in data:
            issues.append(f"{path}:{line_number}: duplicate frontmatter key {key}")
        value = value.strip()
        if value:
            data[key] = value.strip("\"'")
            current_map = None
        else:
            data[key] = {}
            current_map = key

    return data, issues


def check_local_links(path: Path, text: str) -> list[str]:
    issues: list[str] = []
    for raw_target in MARKDOWN_LINK_RE.findall(text):
        target = raw_target.split("#", 1)[0].strip()
        if not target or "://" in target or target.startswith("#"):
            continue
        resolved = (path.parent / target).resolve()
        if not resolved.exists():
            issues.append(f"{path}: broken local link {raw_target}")
    return issues


def check_skill_file(path: Path) -> list[str]:
    issues: list[str] = []
    text = read(path)
    lines = text.splitlines()

    frontmatter, frontmatter_issues = parse_frontmatter(path, text)
    issues.extend(frontmatter_issues)
    if frontmatter:
        unknown = sorted(set(frontmatter) - ALLOWED_FRONTMATTER)
        if unknown:
            issues.append(
                f"{path}: unsupported frontmatter fields: {', '.join(unknown)}"
            )

        name = frontmatter.get("name")
        description = frontmatter.get("description")
        if not isinstance(name, str) or not NAME_RE.fullmatch(name) or len(name) > 64:
            issues.append(f"{path}: invalid skill name {name!r}")
        elif name != path.parent.name:
            issues.append(
                f"{path}: name {name!r} does not match folder {path.parent.name!r}"
            )
        if (
            not isinstance(description, str)
            or not description
            or len(description) > 1024
        ):
            issues.append(f"{path}: description must contain 1-1024 characters")
        metadata = frontmatter.get("metadata")
        if metadata is not None and (
            not isinstance(metadata, dict)
            or any(
                not isinstance(key, str) or not isinstance(value, str)
                for key, value in metadata.items()
            )
        ):
            issues.append(f"{path}: metadata must be a string-to-string map")
        compatibility = frontmatter.get("compatibility")
        if compatibility is not None and (
            not isinstance(compatibility, str) or not 1 <= len(compatibility) <= 500
        ):
            issues.append(f"{path}: compatibility must contain 1-500 characters")

    if len(lines) > 500:
        issues.append(f"{path}: more than 500 lines ({len(lines)})")

    if "<SECURITY_REVIEW>" in text:
        issues.append(f"{path}: <SECURITY_REVIEW> placeholder was not replaced")

    # Check for actual unclosed markdown fences containing inner fences
    # If a ```markdown block is opened, ensure any nested ``` blocks use 4 backticks ```` or are properly closed
    if re.search(r"^```markdown\s*$", text, re.MULTILINE):
        # Scan if there's an inner unescaped fence before closing ```
        parts = text.split("```markdown")
        for part in parts[1:]:
            inside = part.split("\n```\n")[0] if "\n```\n" in part else part
            if re.search(
                r"^```(?:json|text|typescript|bash)\s*$", inside, re.MULTILINE
            ):
                issues.append(
                    f"{path}: possible broken nested fence inside ```markdown block; check and use 4 backticks for the outer template"
                )

    if (
        "[GATE — Fix mode: report-first]" in text
        or "[GATE — Mode: report-first]" in text
    ) and "Approval Resume Protocol" not in text:
        issues.append(f"{path}: report-first gate has no approval resume protocol")

    issues.extend(check_local_links(path, text))

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

    issues.extend(check_local_links(path, text))

    return issues


def main() -> int:
    issues: list[str] = []
    skill_files = sorted(SKILLS_DIR.glob("**/SKILL.md"))
    if not skill_files:
        print(f"Skill validator findings:\n- {SKILLS_DIR}: no SKILL.md files found")
        return 1

    for skill_md in skill_files:
        issues.extend(check_skill_file(skill_md))

    for ref in sorted(SKILLS_DIR.glob("**/references/*.md")):
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
