export type TemplateMeta = {
  id: string;
  name: string;
  category: "recon" | "report" | "analysis" | "methodology";
  desc: string;
  defaultTitle: string;
  content: string;
};

export const NOTE_TEMPLATES: TemplateMeta[] = [
  {
    id: "bug-report",
    name: "Bug Report Draft",
    category: "report",
    desc: "CVSS scoring, reproduction steps, PoC, impact analysis",
    defaultTitle: "Bug Report Draft",
    content: `<h2>Vulnerability Summary</h2><p>Brief one-line description of the issue.</p><h2>Severity</h2><p><strong>CVSS Score:</strong> </p><p><strong>CVSS Vector:</strong> </p><p><strong>CWE:</strong> </p><h2>Target</h2><p><strong>Program:</strong> </p><p><strong>URL / Endpoint:</strong> </p><p><strong>Parameter:</strong> </p><h2>Steps to Reproduce</h2><ol><li><p>Navigate to…</p></li><li><p>Intercept the request with…</p></li><li><p>Modify the parameter…</p></li><li><p>Observe…</p></li></ol><h2>Proof of Concept</h2><pre><code>// Request / PoC payload</code></pre><h2>Impact</h2><p>Describe the business impact and data at risk.</p><h2>Remediation</h2><p>Suggested fix and references:</p><ul><li><p>Sanitize input at…</p></li><li><p>Reference: </p></li></ul>`,
  },
  {
    id: "recon",
    name: "Recon Checklist",
    category: "recon",
    desc: "Subdomain enum, port scanning, tech fingerprinting",
    defaultTitle: "Recon — Target Name",
    content: `<h2>Target Overview</h2><p><strong>Domain:</strong> </p><p><strong>Program:</strong> </p><p><strong>Scope:</strong> </p><h2>Passive Recon</h2><ul><li><p>WHOIS + IP ranges</p></li><li><p>Certificate transparency (crt.sh, censys)</p></li><li><p>Google dorks</p></li><li><p>GitHub / code leaks</p></li><li><p>Wayback Machine — archived endpoints</p></li><li><p>Shodan / Fofa for exposed services</p></li></ul><h2>Subdomain Enumeration</h2><pre><code>amass enum -d target.com -passive
subfinder -d target.com
dnsx -l subdomains.txt -resp</code></pre><p><strong>Found subdomains:</strong></p><ul><li><p></p></li></ul><h2>Port &amp; Service Scan</h2><pre><code>nmap -sV -sC -T4 -oN nmap_out.txt target.com</code></pre><h2>Web Tech Fingerprint</h2><ul><li><p>Wappalyzer results: </p></li><li><p>Server headers: </p></li><li><p>CMS / framework: </p></li><li><p>CDN / WAF detected: </p></li></ul><h2>Interesting Findings</h2><ul><li><p></p></li></ul>`,
  },
  {
    id: "cve-analysis",
    name: "CVE Analysis",
    category: "analysis",
    desc: "CVE details, affected systems, PoC, patch status",
    defaultTitle: "CVE-XXXX-XXXXX Analysis",
    content: `<h2>CVE Details</h2><p><strong>CVE ID:</strong> </p><p><strong>CVSS Score:</strong> </p><p><strong>Published:</strong> </p><p><strong>CWE:</strong> </p><h2>Affected Software</h2><ul><li><p><strong>Vendor:</strong> </p></li><li><p><strong>Product:</strong> </p></li><li><p><strong>Versions:</strong> </p></li></ul><h2>Vulnerability Description</h2><p>Technical description of the root cause.</p><h2>Proof of Concept</h2><pre><code># PoC command or script</code></pre><h2>Exploitation Conditions</h2><ul><li><p>Authentication required: </p></li><li><p>Network access: </p></li><li><p>User interaction: </p></li></ul><h2>Patch Status</h2><p><strong>Fixed in version:</strong> </p><p><strong>Patch commit:</strong> </p><p><strong>Advisory URL:</strong> </p><h2>Impact Assessment</h2><p>Describe confidentiality / integrity / availability impact.</p><h2>Detection</h2><p>Indicators of exploitation, log entries to watch for.</p>`,
  },
  {
    id: "methodology",
    name: "Testing Methodology",
    category: "methodology",
    desc: "OWASP/PTES phased testing flow with MITRE mapping",
    defaultTitle: "Testing Methodology",
    content: `<h2>Phase 1 — Pre-Engagement</h2><ul><li><p>Scope confirmation</p></li><li><p>Rules of engagement reviewed</p></li><li><p>Legal authorisation obtained</p></li><li><p>Communication channels set</p></li></ul><h2>Phase 2 — Information Gathering</h2><ul><li><p>OSINT — people, infrastructure, code</p></li><li><p>Subdomain enumeration</p></li><li><p>Technology profiling</p></li><li><p>Attack surface mapping</p></li></ul><h2>Phase 3 — Vulnerability Analysis</h2><ul><li><p>Automated scanning (nuclei, nikto)</p></li><li><p>Manual testing — OWASP Top 10</p></li><li><p>Business logic review</p></li><li><p>Authentication / authorisation flows</p></li></ul><h2>Phase 4 — Exploitation</h2><ul><li><p>Confirm vulnerability (minimal-impact PoC)</p></li><li><p>Document step-by-step reproduction</p></li><li><p>Capture screenshots / request logs</p></li><li><p>CVSS scoring</p></li></ul><h2>Phase 5 — Post-Exploitation</h2><ul><li><p>Impact chain — what can be accessed?</p></li><li><p>Data sensitivity assessment</p></li><li><p>Privilege escalation paths</p></li></ul><h2>Phase 6 — Reporting</h2><ul><li><p>Executive summary written</p></li><li><p>Technical findings documented</p></li><li><p>Remediation guidance drafted</p></li><li><p>Submitted to program</p></li></ul>`,
  },
  {
    id: "program-review",
    name: "Program Review",
    category: "report",
    desc: "Scope, rules of engagement, payout history, notes",
    defaultTitle: "Program Review — Company Name",
    content: `<h2>Program Info</h2><p><strong>Platform:</strong> </p><p><strong>Company:</strong> </p><p><strong>URL:</strong> </p><p><strong>Started:</strong> </p><h2>Scope</h2><p><strong>In scope:</strong></p><ul><li><p></p></li></ul><p><strong>Out of scope:</strong></p><ul><li><p></p></li></ul><h2>Rules of Engagement</h2><ul><li><p>Rate limiting rules: </p></li><li><p>Automated scanning allowed: </p></li><li><p>Social engineering allowed: </p></li><li><p>DoS testing: </p></li></ul><h2>Payout Structure</h2><p>Critical: $&nbsp;&nbsp;&nbsp; High: $&nbsp;&nbsp;&nbsp; Medium: $&nbsp;&nbsp;&nbsp; Low: $</p><h2>My Findings</h2><ul><li><p></p></li></ul><h2>Notes &amp; Strategy</h2><p>Personal notes about interesting areas, previous researcher writeups, and attack angles to explore.</p>`,
  },
  {
    id: "threat-model",
    name: "Threat Model",
    category: "analysis",
    desc: "Asset inventory, attack surface, STRIDE risk matrix",
    defaultTitle: "Threat Model — System Name",
    content: `<h2>System Overview</h2><p>Brief description of the system being modelled.</p><h2>Assets</h2><ul><li><p><strong>Data assets:</strong> </p></li><li><p><strong>Services:</strong> </p></li><li><p><strong>Infrastructure:</strong> </p></li></ul><h2>Trust Boundaries</h2><ul><li><p>External → DMZ: </p></li><li><p>DMZ → Internal: </p></li><li><p>Service → Database: </p></li></ul><h2>STRIDE Analysis</h2><p><strong>Spoofing:</strong> Identity spoofing risks</p><p><strong>Tampering:</strong> Data modification risks</p><p><strong>Repudiation:</strong> Non-repudiation gaps</p><p><strong>Information Disclosure:</strong> Data leakage paths</p><p><strong>Denial of Service:</strong> Availability risks</p><p><strong>Elevation of Privilege:</strong> Privilege escalation paths</p><h2>Risk Matrix</h2><p>Likelihood × Impact ratings for each threat:</p><ul><li><p></p></li></ul><h2>Controls &amp; Mitigations</h2><ul><li><p></p></li></ul>`,
  },
];
