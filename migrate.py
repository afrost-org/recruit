"""Migrate applications from KV to D1 with flattened answers. Run with: python3 migrate.py"""
import subprocess
import json
import sys

ACCOUNT_ID = "499d93e9e13f6cd0a447046d098ffc11"
KV_NS = "1c14adb59ccb4ee2bbd15a7822a54f0b"
D1_DB = "recruit"
ENV = {"CLOUDFLARE_ACCOUNT_ID": ACCOUNT_ID}

def run(cmd):
    result = subprocess.run(cmd, capture_output=True, text=True, env={**subprocess.os.environ, **ENV})
    if result.returncode != 0:
        print(f"ERROR: {result.stderr}", file=sys.stderr)
        sys.exit(1)
    return result.stdout

def esc(v):
    if v is None:
        return "NULL"
    return "'" + str(v).replace("'", "''") + "'"

# Get all KV keys
print("Listing KV keys...")
keys_json = run(["npx", "wrangler", "kv", "key", "list", "--namespace-id", KV_NS, "--remote"])
keys = json.loads(keys_json)
app_keys = [k for k in keys if k["name"].startswith("application:")]
print(f"Found {len(app_keys)} applications")

for i, key in enumerate(app_keys):
    print(f"  [{i+1}/{len(app_keys)}] {key['name']}")
    raw = run(["npx", "wrangler", "kv", "key", "get", "--namespace-id", KV_NS, "--remote", key["name"]])
    r = json.loads(raw)

    # Extract answers into a dict by questionId
    answers = {a.get("questionId", ""): a.get("answer", "") for a in r.get("answers", [])}

    sql = f"""INSERT OR IGNORE INTO applications (id, job_id, title, company, type, location, application_email, full_name, email, phone, years_experience, current_role, current_company, linkedin, notice_period, resume_file_name, resume_type, resume_url, job_url, submitted_at, status) VALUES ({esc(r.get('id'))}, {esc(r.get('jobId'))}, {esc(r.get('title'))}, {esc(r.get('company'))}, {esc(r.get('type'))}, {esc(r.get('location'))}, {esc(r.get('applicationEmail'))}, {esc(answers.get('full_name'))}, {esc(answers.get('email'))}, {esc(answers.get('phone'))}, {esc(answers.get('years_experience'))}, {esc(answers.get('current_role'))}, {esc(answers.get('current_company'))}, {esc(answers.get('linkedin'))}, {esc(answers.get('notice_period'))}, {esc(r.get('resumeFileName'))}, {esc(r.get('resumeType'))}, {esc(r.get('resumeUrl'))}, {esc(r.get('jobUrl'))}, {esc(r.get('submittedAt'))}, {esc(r.get('status'))});"""

    run(["npx", "wrangler", "d1", "execute", D1_DB, "--remote", "--command", sql])

# Migrate admin password
print("Migrating admin password...")
pw = run(["npx", "wrangler", "kv", "key", "get", "--namespace-id", KV_NS, "--remote", "config:admin_password"]).strip()
run(["npx", "wrangler", "d1", "execute", D1_DB, "--remote", "--command",
     f"INSERT OR REPLACE INTO config (key, value) VALUES ('admin_password', '{pw}');"])

print("Done! Verifying...")
out = run(["npx", "wrangler", "d1", "execute", D1_DB, "--remote", "--command",
           "SELECT COUNT(*) as count FROM applications;"])
print(out)
