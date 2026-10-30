// Product names change; outdated ones must not be taught as current. An old name may appear only right after a word like
// "formerly" ("Microsoft Entra ID (formerly Azure Active Directory)"). Names as of 2026.
const fs = require('fs');
const js = fs.readFileSync(__dirname + '/.tmp/script.js', 'utf8');
const RENAMED = [
  [/\bAzure Active Directory\b|\bAzure AD\b/g, 'Microsoft Entra ID'],
  [/\bAWS SSO\b|\bAWS Single Sign-On\b/g, 'AWS IAM Identity Center'],
  [/\bAzure Security Center\b|\bAzure Defender\b/g, 'Microsoft Defender for Cloud'],
  [/\bAzure Sentinel\b/g, 'Microsoft Sentinel'],
  [/\bMicrosoft Defender ATP\b|\bWindows Defender ATP\b/g, 'Microsoft Defender for Endpoint'],
  [/\bAzure Information Protection\b/g, 'Microsoft Purview Information Protection'],
  [/\b[Cc]ustomer master keys?\b|\bCMKs?\b/g, 'AWS KMS key']
];
let bad = 0;
for (const [re, now] of RENAMED) for (const m of js.matchAll(re)) {
  const before = js.slice(Math.max(0, m.index - 40), m.index);
  if (/formerly|previously|used to be( called)?|renamed( from)?|was called/i.test(before)) continue;
  bad++; console.log('FAIL outdated name "' + m[0] + '" (now ' + now + '):', js.slice(Math.max(0, m.index - 50), m.index + 40).replace(/\s+/g, ' '));
}
console.log('renamed products checked', RENAMED.length, '| problems', bad);
process.exitCode = bad ? 1 : 0;
