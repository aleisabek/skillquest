// Checks that common, correct alternative answers are accepted by the Terminal tasks (not only the model answer),
// so a right answer typed a different way is never marked wrong.
const fs = require('fs');
const js = fs.readFileSync(__dirname + '/.tmp/script.js', 'utf8');
const line = n => { const i = js.indexOf('function ' + n + '('); return js.slice(i, js.indexOf('\n', i)); };
eval(js.split('/* ===================== STATE')[0] + ';' + line('norm') + ';' + line('shuffle') + ';global.A = {TGEN, norm};');
let bad = 0, checked = 0; const fail = (...a) => { bad++; if (bad < 25) console.log('FAIL', ...a); };

// [task text pattern, function from the regex match to an alternative answer]
const ALTS = [
  [/^Delete the folder (\S+) and/, m => 'rm -rf ' + m[1]],
  [/^Delete the file (\S+)\.$/, m => 'rm -f ' + m[1]],
  [/^Print the file named (-file\d+)/, m => 'cat -- ' + m[1]],
  [/^Print the file named "(.+)" \(the name/, m => 'cat ' + m[1].replace(/ /g, '\\ ')],
  [/^Print the file named "(.+)" \(the name/, m => "cat '" + m[1] + "'"],
  [/^List everything in (\S+), including hidden/, m => 'ls -al ' + m[1]],
  [/^Find every \.(\w+) file under the folder (\S+)\./, m => 'find ' + m[2] + "/ -type f -name '*." + m[1] + "'"],
  [/^Show the full path of the (\S+) program/, m => 'command -v ' + m[1]],
  [/^Find files under (\S+) that are exactly (\d+) bytes/, m => 'find ' + m[1] + ' -type f -size ' + m[2] + 'c'],
  [/owned by user (\S+) and group (\S+),/, m => 'find / -group ' + m[2] + ' -user ' + m[1] + ' 2> /dev/null'],
  [/^Print only line (\d+) of (\S+)\.$/, m => 'head -n ' + m[1] + ' ' + m[2] + ' | tail -n 1'],
  [/^Show the lines in (\S+) that do NOT contain (\S+)\./, m => 'cat ' + m[1] + ' | grep -v ' + m[2]],
  [/^Count how many lines in (\S+) contain (\S+)\./, m => 'grep ' + m[2] + ' ' + m[1] + ' | wc -l'],
  [/^Search every file under (\S+) for (\S+), showing/, m => 'grep -nr ' + m[2] + ' ' + m[1] + '/'],
  [/^Show the only line in (\S+) that appears/, m => 'cat ' + m[1] + ' | sort | uniq -u'],
  [/^Count how many times each line appears in (\S+),/, m => 'sort ' + m[1] + ' | uniq -c | sort -rn'],
  [/^Show only column (\d) of the comma/, m => "awk -F, '{print $" + m[1] + "}' users.csv"],
  [/^Decode the base64 text in (\S+)\./, m => 'base64 --decode ' + m[1]],
  [/^Decode the base64 text in (\S+)\./, m => 'cat ' + m[1] + ' | base64 -d'],
  [/^(\S+) is ROT13-encoded/, m => "tr 'A-Za-z' 'N-ZA-Mn-za-m' < " + m[1]],
  [/^Turn the hex dump (\S+) back into the original binary file (\S+)\./, m => 'xxd -r ' + m[1] + ' ' + m[2]],
  [/^Extract (\S+)\.tar\.gz into/, m => 'tar xzf ' + m[1] + '.tar.gz'],
  [/^Extract (\S+)\.tar\.gz into/, m => 'tar -xvzf ' + m[1] + '.tar.gz'],
  [/^Decompress (\S+)\.gz\.$/, m => 'gzip -d ' + m[1] + '.gz'],
  [/^Decompress (\S+)\.bz2\.$/, m => 'bunzip2 ' + m[1] + '.bz2'],
  [/^Read the compressed log (\S+) without/, m => 'gunzip -c ' + m[1]],
  [/^Run \.\/(\S+)\.sh and save both normal output and errors to/, m => './' + m[1] + '.sh &> ' + m[1] + '.log'],
  [/^Send the contents of pass\.txt to port (\d+)/, m => 'cat pass.txt | nc 127.0.0.1 ' + m[1]],
  [/^Log in to (bandit\d+) on bandit\.labs/, m => 'ssh -p 2220 ' + m[1] + '@bandit.labs.overthewire.org'],
  [/^Look up the IP address \(A record\) of (\S+)\./, m => 'nslookup ' + m[1]],
  [/^Show which TCP and UDP ports are listening/, () => 'ss -ltun'],
  [/^Show which TCP and UDP ports are listening/, () => 'netstat -tulpn'],
  [/^Connect to port (\d+) on localhost and type/, m => 'ncat 127.0.0.1 ' + m[1]],
  [/^Open an SSL\/TLS connection to port (\d+)/, m => 'openssl s_client -ign_eof -connect localhost:' + m[1]],
  [/^Scan localhost for open ports from (\d+) to (\d+)\./, m => 'nmap localhost -p ' + m[1] + '-' + m[2]],
  [/^Find the running process\(es\) for (\S+)\./, m => 'pgrep -a ' + m[1]],
  [/^Find the running process\(es\) for (\S+)\./, m => 'ps -ef | grep ' + m[1]],
  [/^Process (\d+) ignores a normal kill/, m => 'kill -KILL ' + m[1]],
  [/^Switch to the user (\S+) \(/, m => 'su - ' + m[1]],
  [/^Show which process is using port (\d+)\./, m => 'sudo ss -ltnp | grep :' + m[1]],
  [/^Switch to the existing branch (\S+)\.$/, m => 'git checkout ' + m[1]],
  [/^List all branches, including/, () => 'git branch --all'],
  [/^Print the value of the (\S+) environment/, m => 'echo ${' + m[1] + '}'],
  [/^Print the value of the (\S+) environment/, m => 'printenv ' + m[1]],
  [/^Reload your shell settings from/, () => '. ~/.bashrc'],
  [/^Use a for loop to print the numbers 1 to (\d+)\./, m => 'for n in $(seq 1 ' + m[1] + '); do echo $n; done'],
  [/^Show free disk space on every mounted drive/, () => 'df -hT'],
  [/^Install the (\S+) package on Ubuntu\./, m => 'sudo apt-get install -y ' + m[1]],
  [/^Allow incoming traffic on port (\d+)/, m => 'sudo ufw allow ' + m[1] + '/tcp'],
  [/^Make (\S+) executable\./, m => 'chmod u+x ' + m[1]],
  [/^Show the systemd log for the (\S+) service/, m => 'sudo journalctl -u ' + m[1] + '.service'],
];
const tasks = []; for (const g of A.TGEN) for (let k = 0; k < 300; k++) tasks.push(g.f());
for (const [re, alt] of ALTS) {
  const hits = tasks.filter(t => re.test(t[0]));
  if (!hits.length) { fail('no task matches', re); continue; }
  for (const t of hits.slice(0, 40)) { checked++; const a = alt(t[0].match(re)); if (!t[1].some(r => r.test(A.norm(a)))) fail('rejected:', JSON.stringify(a), 'for', JSON.stringify(t[0])); }
}
console.log('   alternative answers checked ' + checked + ' | problems ' + bad);
process.exit(bad ? 1 : 0);
