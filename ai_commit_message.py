
import argparse
import os
import subprocess
import sys
from pathlib import Path

MESSAGE_FILE = (
    Path(os.environ.get("TEMP", "."))
    / "volunteer_hub_commit_message.txt"
)

SENSITIVE_TERMS = (
    ".env",
    "id_rsa",
    "credentials",
    "secrets",
    ".pem",
    ".pfx",
    ".key",
    "token",
)


def git(*args):
    """Run a Git command and return its output."""
    result = subprocess.run(
        ["git", *args],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )

    if result.returncode != 0:
        raise RuntimeError(
            result.stderr.strip() or "Git command failed."
        )

    return result.stdout.strip()


def confirm(prompt):
    """Require explicit confirmation."""
    answer = input(f"{prompt} [y/N]: ")
    return answer.strip().lower() in ("y", "yes")


def get_staged_paths():
    """Get staged filenames, including filenames with spaces."""
    output = git(
        "diff", "--cached", "--name-only", "-z"
    )
    return [p for p in output.split("\0") if p]


def check_sensitive_files(paths):
    """Warn and stop if staged filenames look sensitive."""
    flagged = [
        path for path in paths
        if any(term in path.lower() for term in SENSITIVE_TERMS)
    ]

    if flagged:
        print(
            "ERROR: Potentially sensitive files are staged:",
            file=sys.stderr,
        )
        for path in flagged:
            print(f"  - {path}", file=sys.stderr)

        print(
            "Review and unstage these files before continuing.",
            file=sys.stderr,
        )
        return False

    return True


def generate_message(paths):
    """Create an offline summary and description from Git metadata."""
    added = [
        p for p in git(
            "diff", "--cached", "--diff-filter=A",
            "--name-only", "-z"
        ).split("\0") if p
    ]

    deleted = [
        p for p in git(
            "diff", "--cached", "--diff-filter=D",
            "--name-only", "-z"
        ).split("\0") if p
    ]

    modified = [
        p for p in git(
            "diff", "--cached", "--diff-filter=M",
            "--name-only", "-z"
        ).split("\0") if p
    ]

    if len(added) == len(paths):
        action = "Add"
    elif len(deleted) == len(paths):
        action = "Remove"
    elif len(modified) == len(paths):
        action = "Update"
    elif added and not deleted and not modified:
        action = "Add"
    elif deleted and not added and not modified:
        action = "Remove"
    else:
        action = "Update"

    if len(paths) == 1:
        filename = Path(paths[0]).name
        summary = f"{action} {filename}"
    else:
        summary = f"{action} project files ({len(paths)} files)"

    shortstat = git("diff", "--cached", "--shortstat")
    numstat = git("diff", "--cached", "--numstat")

    insertions = 0
    deletions_count = 0

    for line in numstat.splitlines():
        columns = line.split("\t", 2)
        if len(columns) >= 2:
            try:
                insertions += int(columns[0])
                deletions_count += int(columns[1])
            except ValueError:
                # Binary files have no ordinary line counts.
                pass

    description_lines = [
        f"Updated {len(paths)} staged file(s).",
        "",
        "Files changed:",
    ]

    for path in paths[:10]:
        description_lines.append(f"- {path}")

    if len(paths) > 10:
        description_lines.append(
            f"- And {len(paths) - 10} more file(s)"
        )

    description_lines.extend([
        "",
        f"Line changes: +{insertions} / -{deletions_count}",
    ])

    if shortstat:
        description_lines.append(f"Git summary: {shortstat}")

    description = "\n".join(description_lines)
    return summary, description


def main():
    parser = argparse.ArgumentParser(
        description=(
            "Generate a commit summary and description "
            "for Volunteer Hub."
        )
    )

    parser.add_argument(
        "--commit",
        action="store_true",
        help="ask before committing staged changes",
    )

    parser.add_argument(
        "--push",
        action="store_true",
        help="ask before pushing after a confirmed commit",
    )

    args = parser.parse_args()

    if args.push and not args.commit:
        parser.error("--push requires --commit")

    try:
        git("rev-parse", "--show-toplevel")

        paths = get_staged_paths()

        if not paths:
            print("No staged changes.")
            print("Stage files first with: git add <file>")
            return 1

        if not check_sensitive_files(paths):
            return 1

        summary, description = generate_message(paths)
        message = f"{summary}\n\n{description}\n"

        MESSAGE_FILE.write_text(
            message,
            encoding="utf-8",
        )

        print("\nCommit Summary")
        print(summary)

        print("\nCommit Description")
        print(description)

        print(f"\nSaved message to: {MESSAGE_FILE}")

        if not args.commit:
            print("\nNo commit or push was performed.")
            print("To optionally commit, run:")
            print("  python ai_commit_message.py --commit")
            print("To optionally commit and push, run:")
            print("  python ai_commit_message.py --commit --push")
            return 0

        print("\nStaged files:")
        for path in paths:
            print(f"  - {path}")

        if not confirm("Commit these staged changes?"):
            print("Commit cancelled.")
            return 0

        result = subprocess.run(
            ["git", "commit", "-F", "-"],
            input=message,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )

        if result.returncode != 0:
            print(
                result.stderr.strip() or "Git commit failed.",
                file=sys.stderr,
            )
            return result.returncode

        if result.stdout.strip():
            print(result.stdout.strip())

        if result.stderr.strip():
            print(result.stderr.strip())

        if args.push:
            if not confirm(
                "Push this commit to the configured Git remote?"
            ):
                print("Push cancelled. The commit remains local.")
                return 0

            push_result = subprocess.run(
                ["git", "push"],
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
            )

            if push_result.returncode != 0:
                print(
                    push_result.stderr.strip() or "Git push failed.",
                    file=sys.stderr,
                )
                return push_result.returncode

            if push_result.stdout.strip():
                print(push_result.stdout.strip())

            if push_result.stderr.strip():
                print(push_result.stderr.strip())

            print("Push completed.")

        return 0

    except (RuntimeError, OSError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
