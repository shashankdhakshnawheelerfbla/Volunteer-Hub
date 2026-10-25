
# Imports the named module or symbols so this file can use their functionality.
# This makes the referenced tools available to the code below.
import argparse
# Imports the named module or symbols so this file can use their functionality.
# This makes the referenced tools available to the code below.
import os
# Imports the named module or symbols so this file can use their functionality.
# This makes the referenced tools available to the code below.
import subprocess
# Imports the named module or symbols so this file can use their functionality.
# This makes the referenced tools available to the code below.
import sys
# Imports the named module or symbols so this file can use their functionality.
# This makes the referenced tools available to the code below.
from pathlib import Path

# Assigns a value to `MESSAGE_FILE` for later use.
# Other statements can read this value to make decisions or perform work.
MESSAGE_FILE = (
    # Executes the statement or expression written on this line.
    # It contributes to the behavior of this file at this point in the workflow.
    Path(os.environ.get("TEMP", "."))
    # Executes the statement or expression written on this line.
    # It contributes to the behavior of this file at this point in the workflow.
    / "volunteer_hub_commit_message.txt"
# Executes the statement or expression written on this line.
# It contributes to the behavior of this file at this point in the workflow.
)

# Assigns a value to `SENSITIVE_TERMS` for later use.
# Other statements can read this value to make decisions or perform work.
SENSITIVE_TERMS = (
    # Executes the statement or expression written on this line.
    # It contributes to the behavior of this file at this point in the workflow.
    ".env",
    # Executes the statement or expression written on this line.
    # It contributes to the behavior of this file at this point in the workflow.
    "id_rsa",
    # Executes the statement or expression written on this line.
    # It contributes to the behavior of this file at this point in the workflow.
    "credentials",
    # Executes the statement or expression written on this line.
    # It contributes to the behavior of this file at this point in the workflow.
    "secrets",
    # Executes the statement or expression written on this line.
    # It contributes to the behavior of this file at this point in the workflow.
    ".pem",
    # Executes the statement or expression written on this line.
    # It contributes to the behavior of this file at this point in the workflow.
    ".pfx",
    # Executes the statement or expression written on this line.
    # It contributes to the behavior of this file at this point in the workflow.
    ".key",
    # Executes the statement or expression written on this line.
    # It contributes to the behavior of this file at this point in the workflow.
    "token",
# Executes the statement or expression written on this line.
# It contributes to the behavior of this file at this point in the workflow.
)


# Defines the function git.
# This groups related behavior under a name that other code can use.
def git(*args):
    """Run a Git command and return its output."""
    # Assigns a value to `result` for later use.
    # Other statements can read this value to make decisions or perform work.
    result = subprocess.run(
        # Defines or closes part of a structured data object or configuration block.
        # Its position and punctuation determine how the surrounding data is grouped.
        ["git", *args],
        # Assigns a value to `capture_output` for later use.
        # Other statements can read this value to make decisions or perform work.
        capture_output=True,
        # Assigns a value to `text` for later use.
        # Other statements can read this value to make decisions or perform work.
        text=True,
        # Assigns a value to `encoding` for later use.
        # Other statements can read this value to make decisions or perform work.
        encoding="utf-8",
        # Assigns a value to `errors` for later use.
        # Other statements can read this value to make decisions or perform work.
        errors="replace",
    # Executes the statement or expression written on this line.
    # It contributes to the behavior of this file at this point in the workflow.
    )

    # Checks a condition or selects a branch of the program.
    # The following block runs only when this branch's rule applies.
    if result.returncode != 0:
        # Ends this path by returning a value or raising an error.
        # The caller or surrounding error handler can then respond appropriately.
        raise RuntimeError(
            # Executes the statement or expression written on this line.
            # It contributes to the behavior of this file at this point in the workflow.
            result.stderr.strip() or "Git command failed."
        # Executes the statement or expression written on this line.
        # It contributes to the behavior of this file at this point in the workflow.
        )

    # Ends this path by returning a value or raising an error.
    # The caller or surrounding error handler can then respond appropriately.
    return result.stdout.strip()


# Defines the function confirm.
# This groups related behavior under a name that other code can use.
def confirm(prompt):
    """Require explicit confirmation."""
    # Assigns a value to `answer` for later use.
    # Other statements can read this value to make decisions or perform work.
    answer = input(f"{prompt} [y/N]: ")
    # Ends this path by returning a value or raising an error.
    # The caller or surrounding error handler can then respond appropriately.
    return answer.strip().lower() in ("y", "yes")


# Defines the function get_staged_paths.
# This groups related behavior under a name that other code can use.
def get_staged_paths():
    """Get staged filenames, including filenames with spaces."""
    # Assigns a value to `output` for later use.
    # Other statements can read this value to make decisions or perform work.
    output = git(
        # Executes the statement or expression written on this line.
        # It contributes to the behavior of this file at this point in the workflow.
        "diff", "--cached", "--name-only", "-z"
    # Executes the statement or expression written on this line.
    # It contributes to the behavior of this file at this point in the workflow.
    )
    # Ends this path by returning a value or raising an error.
    # The caller or surrounding error handler can then respond appropriately.
    return [p for p in output.split("\0") if p]


# Defines the function check_sensitive_files.
# This groups related behavior under a name that other code can use.
def check_sensitive_files(paths):
    """Warn and stop if staged filenames look sensitive."""
    # Assigns a value to `flagged` for later use.
    # Other statements can read this value to make decisions or perform work.
    flagged = [
        # Executes the statement or expression written on this line.
        # It contributes to the behavior of this file at this point in the workflow.
        path for path in paths
        # Checks a condition or selects a branch of the program.
        # The following block runs only when this branch's rule applies.
        if any(term in path.lower() for term in SENSITIVE_TERMS)
    # Defines or closes part of a structured data object or configuration block.
    # Its position and punctuation determine how the surrounding data is grouped.
    ]

    # Checks a condition or selects a branch of the program.
    # The following block runs only when this branch's rule applies.
    if flagged:
        # Executes the statement or expression written on this line.
        # It contributes to the behavior of this file at this point in the workflow.
        print(
            # Executes the statement or expression written on this line.
            # It contributes to the behavior of this file at this point in the workflow.
            "ERROR: Potentially sensitive files are staged:",
            # Assigns a value to `file` for later use.
            # Other statements can read this value to make decisions or perform work.
            file=sys.stderr,
        # Executes the statement or expression written on this line.
        # It contributes to the behavior of this file at this point in the workflow.
        )
        # Starts a loop over items or while a condition remains true.
        # The indented or braced block performs the repeated work.
        for path in flagged:
            # Sets or updates `print(f"  - {path}", file` using the expression on the right-hand side.
            # The assigned value is used by later logic or by the current configuration.
            print(f"  - {path}", file=sys.stderr)

        # Executes the statement or expression written on this line.
        # It contributes to the behavior of this file at this point in the workflow.
        print(
            # Executes the statement or expression written on this line.
            # It contributes to the behavior of this file at this point in the workflow.
            "Review and unstage these files before continuing.",
            # Assigns a value to `file` for later use.
            # Other statements can read this value to make decisions or perform work.
            file=sys.stderr,
        # Executes the statement or expression written on this line.
        # It contributes to the behavior of this file at this point in the workflow.
        )
        # Ends this path by returning a value or raising an error.
        # The caller or surrounding error handler can then respond appropriately.
        return False

    # Ends this path by returning a value or raising an error.
    # The caller or surrounding error handler can then respond appropriately.
    return True


# Defines the function generate_message.
# This groups related behavior under a name that other code can use.
def generate_message(paths):
    """Create an offline summary and description from Git metadata."""
    # Assigns a value to `added` for later use.
    # Other statements can read this value to make decisions or perform work.
    added = [
        # Executes the statement or expression written on this line.
        # It contributes to the behavior of this file at this point in the workflow.
        p for p in git(
            # Sets or updates `"diff", "--cached", "--diff-filter` using the expression on the right-hand side.
            # The assigned value is used by later logic or by the current configuration.
            "diff", "--cached", "--diff-filter=A",
            # Executes the statement or expression written on this line.
            # It contributes to the behavior of this file at this point in the workflow.
            "--name-only", "-z"
        # Executes the statement or expression written on this line.
        # It contributes to the behavior of this file at this point in the workflow.
        ).split("\0") if p
    # Defines or closes part of a structured data object or configuration block.
    # Its position and punctuation determine how the surrounding data is grouped.
    ]

    # Assigns a value to `deleted` for later use.
    # Other statements can read this value to make decisions or perform work.
    deleted = [
        # Executes the statement or expression written on this line.
        # It contributes to the behavior of this file at this point in the workflow.
        p for p in git(
            # Sets or updates `"diff", "--cached", "--diff-filter` using the expression on the right-hand side.
            # The assigned value is used by later logic or by the current configuration.
            "diff", "--cached", "--diff-filter=D",
            # Executes the statement or expression written on this line.
            # It contributes to the behavior of this file at this point in the workflow.
            "--name-only", "-z"
        # Executes the statement or expression written on this line.
        # It contributes to the behavior of this file at this point in the workflow.
        ).split("\0") if p
    # Defines or closes part of a structured data object or configuration block.
    # Its position and punctuation determine how the surrounding data is grouped.
    ]

    # Assigns a value to `modified` for later use.
    # Other statements can read this value to make decisions or perform work.
    modified = [
        # Executes the statement or expression written on this line.
        # It contributes to the behavior of this file at this point in the workflow.
        p for p in git(
            # Sets or updates `"diff", "--cached", "--diff-filter` using the expression on the right-hand side.
            # The assigned value is used by later logic or by the current configuration.
            "diff", "--cached", "--diff-filter=M",
            # Executes the statement or expression written on this line.
            # It contributes to the behavior of this file at this point in the workflow.
            "--name-only", "-z"
        # Executes the statement or expression written on this line.
        # It contributes to the behavior of this file at this point in the workflow.
        ).split("\0") if p
    # Defines or closes part of a structured data object or configuration block.
    # Its position and punctuation determine how the surrounding data is grouped.
    ]

    # Checks a condition or selects a branch of the program.
    # The following block runs only when this branch's rule applies.
    if len(added) == len(paths):
        # Assigns a value to `action` for later use.
        # Other statements can read this value to make decisions or perform work.
        action = "Add"
    # Checks a condition or selects a branch of the program.
    # The following block runs only when this branch's rule applies.
    elif len(deleted) == len(paths):
        # Assigns a value to `action` for later use.
        # Other statements can read this value to make decisions or perform work.
        action = "Remove"
    # Checks a condition or selects a branch of the program.
    # The following block runs only when this branch's rule applies.
    elif len(modified) == len(paths):
        # Assigns a value to `action` for later use.
        # Other statements can read this value to make decisions or perform work.
        action = "Update"
    # Checks a condition or selects a branch of the program.
    # The following block runs only when this branch's rule applies.
    elif added and not deleted and not modified:
        # Assigns a value to `action` for later use.
        # Other statements can read this value to make decisions or perform work.
        action = "Add"
    # Checks a condition or selects a branch of the program.
    # The following block runs only when this branch's rule applies.
    elif deleted and not added and not modified:
        # Assigns a value to `action` for later use.
        # Other statements can read this value to make decisions or perform work.
        action = "Remove"
    # Checks a condition or selects a branch of the program.
    # The following block runs only when this branch's rule applies.
    else:
        # Assigns a value to `action` for later use.
        # Other statements can read this value to make decisions or perform work.
        action = "Update"

    # Checks a condition or selects a branch of the program.
    # The following block runs only when this branch's rule applies.
    if len(paths) == 1:
        # Assigns a value to `filename` for later use.
        # Other statements can read this value to make decisions or perform work.
        filename = Path(paths[0]).name
        # Assigns a value to `summary` for later use.
        # Other statements can read this value to make decisions or perform work.
        summary = f"{action} {filename}"
    # Checks a condition or selects a branch of the program.
    # The following block runs only when this branch's rule applies.
    else:
        # Assigns a value to `summary` for later use.
        # Other statements can read this value to make decisions or perform work.
        summary = f"{action} project files ({len(paths)} files)"

    # Assigns a value to `shortstat` for later use.
    # Other statements can read this value to make decisions or perform work.
    shortstat = git("diff", "--cached", "--shortstat")
    # Assigns a value to `numstat` for later use.
    # Other statements can read this value to make decisions or perform work.
    numstat = git("diff", "--cached", "--numstat")

    # Assigns a value to `insertions` for later use.
    # Other statements can read this value to make decisions or perform work.
    insertions = 0
    # Assigns a value to `deletions_count` for later use.
    # Other statements can read this value to make decisions or perform work.
    deletions_count = 0

    # Starts a loop over items or while a condition remains true.
    # The indented or braced block performs the repeated work.
    for line in numstat.splitlines():
        # Assigns a value to `columns` for later use.
        # Other statements can read this value to make decisions or perform work.
        columns = line.split("\t", 2)
        # Checks a condition or selects a branch of the program.
        # The following block runs only when this branch's rule applies.
        if len(columns) >= 2:
            # Begins an error-handling section or its related handler.
            # This lets the program handle failures without silently ignoring them.
            try:
                # Sets or updates `insertions +` using the expression on the right-hand side.
                # The assigned value is used by later logic or by the current configuration.
                insertions += int(columns[0])
                # Sets or updates `deletions_count +` using the expression on the right-hand side.
                # The assigned value is used by later logic or by the current configuration.
                deletions_count += int(columns[1])
            # Begins an error-handling section or its related handler.
            # This lets the program handle failures without silently ignoring them.
            except ValueError:
                # Binary files have no ordinary line counts.
                # Executes the statement or expression written on this line.
                # It contributes to the behavior of this file at this point in the workflow.
                pass

    # Assigns a value to `description_lines` for later use.
    # Other statements can read this value to make decisions or perform work.
    description_lines = [
        # Executes the statement or expression written on this line.
        # It contributes to the behavior of this file at this point in the workflow.
        f"Updated {len(paths)} staged file(s).",
        # Executes the statement or expression written on this line.
        # It contributes to the behavior of this file at this point in the workflow.
        "",
        # Executes the statement or expression written on this line.
        # It contributes to the behavior of this file at this point in the workflow.
        "Files changed:",
    # Defines or closes part of a structured data object or configuration block.
    # Its position and punctuation determine how the surrounding data is grouped.
    ]

    # Starts a loop over items or while a condition remains true.
    # The indented or braced block performs the repeated work.
    for path in paths[:10]:
        # Executes the statement or expression written on this line.
        # It contributes to the behavior of this file at this point in the workflow.
        description_lines.append(f"- {path}")

    # Checks a condition or selects a branch of the program.
    # The following block runs only when this branch's rule applies.
    if len(paths) > 10:
        # Executes the statement or expression written on this line.
        # It contributes to the behavior of this file at this point in the workflow.
        description_lines.append(
            # Executes the statement or expression written on this line.
            # It contributes to the behavior of this file at this point in the workflow.
            f"- And {len(paths) - 10} more file(s)"
        # Executes the statement or expression written on this line.
        # It contributes to the behavior of this file at this point in the workflow.
        )

    # Executes the statement or expression written on this line.
    # It contributes to the behavior of this file at this point in the workflow.
    description_lines.extend([
        # Executes the statement or expression written on this line.
        # It contributes to the behavior of this file at this point in the workflow.
        "",
        # Executes the statement or expression written on this line.
        # It contributes to the behavior of this file at this point in the workflow.
        f"Line changes: +{insertions} / -{deletions_count}",
    # Defines or closes part of a structured data object or configuration block.
    # Its position and punctuation determine how the surrounding data is grouped.
    ])

    # Checks a condition or selects a branch of the program.
    # The following block runs only when this branch's rule applies.
    if shortstat:
        # Executes the statement or expression written on this line.
        # It contributes to the behavior of this file at this point in the workflow.
        description_lines.append(f"Git summary: {shortstat}")

    # Assigns a value to `description` for later use.
    # Other statements can read this value to make decisions or perform work.
    description = "\n".join(description_lines)
    # Ends this path by returning a value or raising an error.
    # The caller or surrounding error handler can then respond appropriately.
    return summary, description


# Defines the function main.
# This groups related behavior under a name that other code can use.
def main():
    # Assigns a value to `parser` for later use.
    # Other statements can read this value to make decisions or perform work.
    parser = argparse.ArgumentParser(
        # Assigns a value to `description` for later use.
        # Other statements can read this value to make decisions or perform work.
        description=(
            # Executes the statement or expression written on this line.
            # It contributes to the behavior of this file at this point in the workflow.
            "Generate a commit summary and description "
            # Executes the statement or expression written on this line.
            # It contributes to the behavior of this file at this point in the workflow.
            "for Volunteer Hub."
        # Executes the statement or expression written on this line.
        # It contributes to the behavior of this file at this point in the workflow.
        )
    # Executes the statement or expression written on this line.
    # It contributes to the behavior of this file at this point in the workflow.
    )

    # Executes the statement or expression written on this line.
    # It contributes to the behavior of this file at this point in the workflow.
    parser.add_argument(
        # Executes the statement or expression written on this line.
        # It contributes to the behavior of this file at this point in the workflow.
        "--commit",
        # Assigns a value to `action` for later use.
        # Other statements can read this value to make decisions or perform work.
        action="store_true",
        # Assigns a value to `help` for later use.
        # Other statements can read this value to make decisions or perform work.
        help="ask before committing staged changes",
    # Executes the statement or expression written on this line.
    # It contributes to the behavior of this file at this point in the workflow.
    )

    # Executes the statement or expression written on this line.
    # It contributes to the behavior of this file at this point in the workflow.
    parser.add_argument(
        # Executes the statement or expression written on this line.
        # It contributes to the behavior of this file at this point in the workflow.
        "--push",
        # Assigns a value to `action` for later use.
        # Other statements can read this value to make decisions or perform work.
        action="store_true",
        # Assigns a value to `help` for later use.
        # Other statements can read this value to make decisions or perform work.
        help="ask before pushing after a confirmed commit",
    # Executes the statement or expression written on this line.
    # It contributes to the behavior of this file at this point in the workflow.
    )

    # Assigns a value to `args` for later use.
    # Other statements can read this value to make decisions or perform work.
    args = parser.parse_args()

    # Checks a condition or selects a branch of the program.
    # The following block runs only when this branch's rule applies.
    if args.push and not args.commit:
        # Executes the statement or expression written on this line.
        # It contributes to the behavior of this file at this point in the workflow.
        parser.error("--push requires --commit")

    # Begins an error-handling section or its related handler.
    # This lets the program handle failures without silently ignoring them.
    try:
        # Executes the statement or expression written on this line.
        # It contributes to the behavior of this file at this point in the workflow.
        git("rev-parse", "--show-toplevel")

        # Assigns a value to `paths` for later use.
        # Other statements can read this value to make decisions or perform work.
        paths = get_staged_paths()

        # Checks a condition or selects a branch of the program.
        # The following block runs only when this branch's rule applies.
        if not paths:
            # Executes the statement or expression written on this line.
            # It contributes to the behavior of this file at this point in the workflow.
            print("No staged changes.")
            # Executes the statement or expression written on this line.
            # It contributes to the behavior of this file at this point in the workflow.
            print("Stage files first with: git add <file>")
            # Ends this path by returning a value or raising an error.
            # The caller or surrounding error handler can then respond appropriately.
            return 1

        # Checks a condition or selects a branch of the program.
        # The following block runs only when this branch's rule applies.
        if not check_sensitive_files(paths):
            # Ends this path by returning a value or raising an error.
            # The caller or surrounding error handler can then respond appropriately.
            return 1

        # Sets or updates `summary, description` using the expression on the right-hand side.
        # The assigned value is used by later logic or by the current configuration.
        summary, description = generate_message(paths)
        # Assigns a value to `message` for later use.
        # Other statements can read this value to make decisions or perform work.
        message = f"{summary}\n\n{description}\n"

        # Executes the statement or expression written on this line.
        # It contributes to the behavior of this file at this point in the workflow.
        MESSAGE_FILE.write_text(
            # Executes the statement or expression written on this line.
            # It contributes to the behavior of this file at this point in the workflow.
            message,
            # Assigns a value to `encoding` for later use.
            # Other statements can read this value to make decisions or perform work.
            encoding="utf-8",
        # Executes the statement or expression written on this line.
        # It contributes to the behavior of this file at this point in the workflow.
        )

        # Executes the statement or expression written on this line.
        # It contributes to the behavior of this file at this point in the workflow.
        print("\nCommit Summary")
        # Executes the statement or expression written on this line.
        # It contributes to the behavior of this file at this point in the workflow.
        print(summary)

        # Executes the statement or expression written on this line.
        # It contributes to the behavior of this file at this point in the workflow.
        print("\nCommit Description")
        # Executes the statement or expression written on this line.
        # It contributes to the behavior of this file at this point in the workflow.
        print(description)

        # Executes the statement or expression written on this line.
        # It contributes to the behavior of this file at this point in the workflow.
        print(f"\nSaved message to: {MESSAGE_FILE}")

        # Checks a condition or selects a branch of the program.
        # The following block runs only when this branch's rule applies.
        if not args.commit:
            # Executes the statement or expression written on this line.
            # It contributes to the behavior of this file at this point in the workflow.
            print("\nNo commit or push was performed.")
            # Executes the statement or expression written on this line.
            # It contributes to the behavior of this file at this point in the workflow.
            print("To optionally commit, run:")
            # Executes the statement or expression written on this line.
            # It contributes to the behavior of this file at this point in the workflow.
            print("  python ai_commit_message.py --commit")
            # Executes the statement or expression written on this line.
            # It contributes to the behavior of this file at this point in the workflow.
            print("To optionally commit and push, run:")
            # Executes the statement or expression written on this line.
            # It contributes to the behavior of this file at this point in the workflow.
            print("  python ai_commit_message.py --commit --push")
            # Ends this path by returning a value or raising an error.
            # The caller or surrounding error handler can then respond appropriately.
            return 0

        # Executes the statement or expression written on this line.
        # It contributes to the behavior of this file at this point in the workflow.
        print("\nStaged files:")
        # Starts a loop over items or while a condition remains true.
        # The indented or braced block performs the repeated work.
        for path in paths:
            # Executes the statement or expression written on this line.
            # It contributes to the behavior of this file at this point in the workflow.
            print(f"  - {path}")

        # Checks a condition or selects a branch of the program.
        # The following block runs only when this branch's rule applies.
        if not confirm("Commit these staged changes?"):
            # Executes the statement or expression written on this line.
            # It contributes to the behavior of this file at this point in the workflow.
            print("Commit cancelled.")
            # Ends this path by returning a value or raising an error.
            # The caller or surrounding error handler can then respond appropriately.
            return 0

        # Assigns a value to `result` for later use.
        # Other statements can read this value to make decisions or perform work.
        result = subprocess.run(
            # Defines or closes part of a structured data object or configuration block.
            # Its position and punctuation determine how the surrounding data is grouped.
            ["git", "commit", "-F", "-"],
            # Assigns a value to `input` for later use.
            # Other statements can read this value to make decisions or perform work.
            input=message,
            # Assigns a value to `capture_output` for later use.
            # Other statements can read this value to make decisions or perform work.
            capture_output=True,
            # Assigns a value to `text` for later use.
            # Other statements can read this value to make decisions or perform work.
            text=True,
            # Assigns a value to `encoding` for later use.
            # Other statements can read this value to make decisions or perform work.
            encoding="utf-8",
            # Assigns a value to `errors` for later use.
            # Other statements can read this value to make decisions or perform work.
            errors="replace",
        # Executes the statement or expression written on this line.
        # It contributes to the behavior of this file at this point in the workflow.
        )

        # Checks a condition or selects a branch of the program.
        # The following block runs only when this branch's rule applies.
        if result.returncode != 0:
            # Executes the statement or expression written on this line.
            # It contributes to the behavior of this file at this point in the workflow.
            print(
                # Executes the statement or expression written on this line.
                # It contributes to the behavior of this file at this point in the workflow.
                result.stderr.strip() or "Git commit failed.",
                # Assigns a value to `file` for later use.
                # Other statements can read this value to make decisions or perform work.
                file=sys.stderr,
            # Executes the statement or expression written on this line.
            # It contributes to the behavior of this file at this point in the workflow.
            )
            # Ends this path by returning a value or raising an error.
            # The caller or surrounding error handler can then respond appropriately.
            return result.returncode

        # Checks a condition or selects a branch of the program.
        # The following block runs only when this branch's rule applies.
        if result.stdout.strip():
            # Executes the statement or expression written on this line.
            # It contributes to the behavior of this file at this point in the workflow.
            print(result.stdout.strip())

        # Checks a condition or selects a branch of the program.
        # The following block runs only when this branch's rule applies.
        if result.stderr.strip():
            # Executes the statement or expression written on this line.
            # It contributes to the behavior of this file at this point in the workflow.
            print(result.stderr.strip())

        # Checks a condition or selects a branch of the program.
        # The following block runs only when this branch's rule applies.
        if args.push:
            # Checks a condition or selects a branch of the program.
            # The following block runs only when this branch's rule applies.
            if not confirm(
                # Executes the statement or expression written on this line.
                # It contributes to the behavior of this file at this point in the workflow.
                "Push this commit to the configured Git remote?"
            # Introduces a block or section that follows this line.
            # The next indented lines belong to this part of the program.
            ):
                # Executes the statement or expression written on this line.
                # It contributes to the behavior of this file at this point in the workflow.
                print("Push cancelled. The commit remains local.")
                # Ends this path by returning a value or raising an error.
                # The caller or surrounding error handler can then respond appropriately.
                return 0

            # Assigns a value to `push_result` for later use.
            # Other statements can read this value to make decisions or perform work.
            push_result = subprocess.run(
                # Defines or closes part of a structured data object or configuration block.
                # Its position and punctuation determine how the surrounding data is grouped.
                ["git", "push"],
                # Assigns a value to `capture_output` for later use.
                # Other statements can read this value to make decisions or perform work.
                capture_output=True,
                # Assigns a value to `text` for later use.
                # Other statements can read this value to make decisions or perform work.
                text=True,
                # Assigns a value to `encoding` for later use.
                # Other statements can read this value to make decisions or perform work.
                encoding="utf-8",
                # Assigns a value to `errors` for later use.
                # Other statements can read this value to make decisions or perform work.
                errors="replace",
            # Executes the statement or expression written on this line.
            # It contributes to the behavior of this file at this point in the workflow.
            )

            # Checks a condition or selects a branch of the program.
            # The following block runs only when this branch's rule applies.
            if push_result.returncode != 0:
                # Executes the statement or expression written on this line.
                # It contributes to the behavior of this file at this point in the workflow.
                print(
                    # Executes the statement or expression written on this line.
                    # It contributes to the behavior of this file at this point in the workflow.
                    push_result.stderr.strip() or "Git push failed.",
                    # Assigns a value to `file` for later use.
                    # Other statements can read this value to make decisions or perform work.
                    file=sys.stderr,
                # Executes the statement or expression written on this line.
                # It contributes to the behavior of this file at this point in the workflow.
                )
                # Ends this path by returning a value or raising an error.
                # The caller or surrounding error handler can then respond appropriately.
                return push_result.returncode

            # Checks a condition or selects a branch of the program.
            # The following block runs only when this branch's rule applies.
            if push_result.stdout.strip():
                # Executes the statement or expression written on this line.
                # It contributes to the behavior of this file at this point in the workflow.
                print(push_result.stdout.strip())

            # Checks a condition or selects a branch of the program.
            # The following block runs only when this branch's rule applies.
            if push_result.stderr.strip():
                # Executes the statement or expression written on this line.
                # It contributes to the behavior of this file at this point in the workflow.
                print(push_result.stderr.strip())

            # Executes the statement or expression written on this line.
            # It contributes to the behavior of this file at this point in the workflow.
            print("Push completed.")

        # Ends this path by returning a value or raising an error.
        # The caller or surrounding error handler can then respond appropriately.
        return 0

    # Begins an error-handling section or its related handler.
    # This lets the program handle failures without silently ignoring them.
    except (RuntimeError, OSError) as error:
        # Sets or updates `print(f"ERROR: {error}", file` using the expression on the right-hand side.
        # The assigned value is used by later logic or by the current configuration.
        print(f"ERROR: {error}", file=sys.stderr)
        # Ends this path by returning a value or raising an error.
        # The caller or surrounding error handler can then respond appropriately.
        return 1


# Checks a condition or selects a branch of the program.
# The following block runs only when this branch's rule applies.
if __name__ == "__main__":
    # Ends this path by returning a value or raising an error.
    # The caller or surrounding error handler can then respond appropriately.
    raise SystemExit(main())
