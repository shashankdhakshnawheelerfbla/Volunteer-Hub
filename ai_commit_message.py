
import subprocess
import sys
import os
from pathlib import Path


MESSAGE_FILE = (
    Path(os.environ.get("TEMP", ".")) /
    "volunteer_hub_commit_message.txt"
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


def main():
    # Read the filenames included in the staged changes.
    paths = git(
        "diff", "--cached", "--name-only"
    ).splitlines()

    if not paths:
        print("No staged changes.")
        return 1

    # Refuse files with common secret-related names.
    sensitive = (
        ".env", "id_rsa", "credentials",
        "secrets", ".pem", ".pfx"
    )

    if any(
        any(term in path.lower() for term in sensitive)
        for path in paths
    ):
        print(
            "ERROR: A potentially sensitive file is staged. "
            "Review it before continuing.",
            file=sys.stderr,
        )
        return 1

    # Get staged additions and deletions.
    added = git(
        "diff", "--cached", "--diff-filter=A",
        "--name-only"
    ).splitlines()

    deleted = git(
        "diff", "--cached", "--diff-filter=D",
        "--name-only"
    ).splitlines()

    if len(added) == len(paths):
        action = "Add"
    elif len(deleted) == len(paths):
        action = "Remove"
    else:
        action = "Update"

    # Build a title from the changed filenames.
    if len(paths) == 1:
        filename = Path(paths[0]).name
        title = f"{action} {filename}"
    else:
        title = f"{action} project files ({len(paths)} files)"

    # Summarize the staged changes without an API call.
    summary = git("diff", "--cached", "--shortstat")

    description_lines = [
        f"Changed {len(paths)} file(s):"
    ]

    for path in paths[:10]:
        description_lines.append(f"- {path}")

    if len(paths) > 10:
        description_lines.append(
            f"- And {len(paths) - 10} more file(s)"
        )

    if summary:
        description_lines.append("")
        description_lines.append(
            f"Change summary: {summary}"
        )

    description = "\n".join(description_lines)

    # Save the message for the existing sync script.
    MESSAGE_FILE.write_text(
        title + "\n\n" + description + "\n",
        encoding="utf-8",
    )

    print("\nGenerated commit title:")
    print(title)
    print("\nGenerated description:")
    print(description)
    print("\nCommit message saved successfully.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
