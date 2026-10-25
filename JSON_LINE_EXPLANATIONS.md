# Configuration and preservation notes

JSON does not support comments, so the original JSON files are kept unchanged. Their lines are explained here instead.
## `.vscode/settings.json`

**Line 1:** `{`
- Explanation 1: This line opens or closes part of the JSON structure.
- Explanation 2: Its punctuation groups the configuration values that belong together.

**Line 2:** `"files.exclude": {`
- Explanation 1: This line sets the `files.exclude` configuration key or begins its value.
- Explanation 2: The value and surrounding punctuation determine how the tool interprets this setting.

**Line 3:** `"**/.vscode": true,`
- Explanation 1: This line sets the `**/.vscode` configuration key or begins its value.
- Explanation 2: The value and surrounding punctuation determine how the tool interprets this setting.

**Line 4:** `"**/sync_volunteer_hub.bat": true,`
- Explanation 1: This line sets the `**/sync_volunteer_hub.bat` configuration key or begins its value.
- Explanation 2: The value and surrounding punctuation determine how the tool interprets this setting.

**Line 5:** `"**/.gitignore": true,`
- Explanation 1: This line sets the `**/.gitignore` configuration key or begins its value.
- Explanation 2: The value and surrounding punctuation determine how the tool interprets this setting.

**Line 6:** `"**/README.md": true,`
- Explanation 1: This line sets the `**/README.md` configuration key or begins its value.
- Explanation 2: The value and surrounding punctuation determine how the tool interprets this setting.

**Line 7:** `"**/style.css": false,`
- Explanation 1: This line sets the `**/style.css` configuration key or begins its value.
- Explanation 2: The value and surrounding punctuation determine how the tool interprets this setting.

**Line 8:** `"**/git": true,`
- Explanation 1: This line sets the `**/git` configuration key or begins its value.
- Explanation 2: The value and surrounding punctuation determine how the tool interprets this setting.

**Line 9:** `"**/start_auto_sync.bat": true,`
- Explanation 1: This line sets the `**/start_auto_sync.bat` configuration key or begins its value.
- Explanation 2: The value and surrounding punctuation determine how the tool interprets this setting.

**Line 10:** `"**/watch_volunteer_hub.ps1": true,`
- Explanation 1: This line sets the `**/watch_volunteer_hub.ps1` configuration key or begins its value.
- Explanation 2: The value and surrounding punctuation determine how the tool interprets this setting.

**Line 11:** `"**/README.txt": true`
- Explanation 1: This line sets the `**/README.txt` configuration key or begins its value.
- Explanation 2: The value and surrounding punctuation determine how the tool interprets this setting.

**Line 12:** `"**/.venv": true,`
- Explanation 1: This line sets the `**/.venv` configuration key or begins its value.
- Explanation 2: The value and surrounding punctuation determine how the tool interprets this setting.

**Line 13:** `"**/.venv-1": true`
- Explanation 1: This line sets the `**/.venv-1` configuration key or begins its value.
- Explanation 2: The value and surrounding punctuation determine how the tool interprets this setting.

**Line 14:** `"**/ai_commit_message.py" false`
- Explanation 1: This line opens or closes part of the JSON structure.
- Explanation 2: Its punctuation groups the configuration values that belong together.

**Line 15:** `}`
- Explanation 1: This line opens or closes part of the JSON structure.
- Explanation 2: Its punctuation groups the configuration values that belong together.

**Line 16:** `}`
- Explanation 1: This line opens or closes part of the JSON structure.
- Explanation 2: Its punctuation groups the configuration values that belong together.

## `wrangler.json`

**Line 1:** `{`
- Explanation 1: This line opens or closes part of the JSON structure.
- Explanation 2: Its punctuation groups the configuration values that belong together.

**Line 2:** `"name": "volunteer-hub",`
- Explanation 1: This line sets the `name` configuration key or begins its value.
- Explanation 2: The value and surrounding punctuation determine how the tool interprets this setting.

**Line 3:** `"pages_build_output_dir": "website",`
- Explanation 1: This line sets the `pages_build_output_dir` configuration key or begins its value.
- Explanation 2: The value and surrounding punctuation determine how the tool interprets this setting.

**Line 4:** `"compatibility_date": "2026-10-22",`
- Explanation 1: This line sets the `compatibility_date` configuration key or begins its value.
- Explanation 2: The value and surrounding punctuation determine how the tool interprets this setting.

**Line 5:** `"d1_databases": [`
- Explanation 1: This line sets the `d1_databases` configuration key or begins its value.
- Explanation 2: The value and surrounding punctuation determine how the tool interprets this setting.

**Line 6:** `{`
- Explanation 1: This line opens or closes part of the JSON structure.
- Explanation 2: Its punctuation groups the configuration values that belong together.

**Line 7:** `"binding": "DB",`
- Explanation 1: This line sets the `binding` configuration key or begins its value.
- Explanation 2: The value and surrounding punctuation determine how the tool interprets this setting.

**Line 8:** `"database_name": "volunteer-db",`
- Explanation 1: This line sets the `database_name` configuration key or begins its value.
- Explanation 2: The value and surrounding punctuation determine how the tool interprets this setting.

**Line 9:** `"database_id": "d27189d3-9b42-45ea-a7c4-986f0e63d9a4"`
- Explanation 1: This line sets the `database_id` configuration key or begins its value.
- Explanation 2: The value and surrounding punctuation determine how the tool interprets this setting.

**Line 10:** `}`
- Explanation 1: This line opens or closes part of the JSON structure.
- Explanation 2: Its punctuation groups the configuration values that belong together.

**Line 11:** `]`
- Explanation 1: This line opens or closes part of the JSON structure.
- Explanation 2: Its punctuation groups the configuration values that belong together.

**Line 12:** `}`
- Explanation 1: This line opens or closes part of the JSON structure.
- Explanation 2: Its punctuation groups the configuration values that belong together.

## Important notes

- `.vscode/settings.json` was already invalid JSON in the supplied ZIP (it has missing commas and a malformed setting near the end). It is preserved unchanged; the source was not silently repaired.
- `google0b08dede38c9b155.html` is preserved unchanged because search-engine verification files may require exact contents.
- `sitemap.xml` was preserved unchanged because the supplied file is empty.
- `.git`, `.venv`, `.venv-1`, `.wrangler`, and Python cache folders were excluded because they contain version-control internals, local environments, generated cache data, or machine-specific state.
- Binary assets such as `Volunteer Hub.pptx` are preserved without inserting comments because doing so would corrupt the file.
- Lines inside multiline strings/templates and multiline HTML tags are left unchanged where inserting comments would alter the program or markup. See the source files for the comments that can be safely inserted.

### Lines requiring special handling in `functions/auth/login.js`
- 18–19, 24–28

### Lines requiring special handling in `functions/auth/_auth.js`
- 96–102, 126

- `sage.py` contains terminal/control-character output rather than ordinary source text, so it was preserved unchanged to avoid damaging it.