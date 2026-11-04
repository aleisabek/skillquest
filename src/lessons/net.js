/* Mini-lessons: Networking */
Object.assign(LESSONS, {
'quiz:net:Ports & services': {
  why: `Firewall rules, "the app can't connect" tickets and port scans all come down to which service listens on which port. You'll be expected to know the common ones cold.`,
  idea: `<p>A <b>port</b> is a numbered door on a device. The IP address finds the computer; the port finds the program on it. Ports 0–1023 are "well-known" and reserved for standard services.</p>
  <ul class="clean"><li>22 SSH (secure remote shell) · 21 FTP · 25 SMTP (sending mail)</li><li>53 DNS · 67/68 DHCP · 123 NTP (time)</li><li>80 HTTP · 443 HTTPS · 3389 RDP (Remote Desktop)</li><li>110 POP3 · 143 IMAP (reading mail) · 161 SNMP (monitoring)</li><li>389 LDAP (directory) · 445 SMB (Windows file sharing) · 3306 MySQL</li></ul>`,
  example: `<p>Ticket: "I can reach the server but Remote Desktop times out."</p><p>RDP uses <b>3389</b>. Test it from your PC with <code>Test-NetConnection server01 -Port 3389</code> (PowerShell). If ping works but 3389 fails, a firewall is blocking the port, or the RDP service isn't running.</p>`,
  mistakes: [`Mixing up 25 (SMTP, sending) with 110/143 (POP3/IMAP, reading).`, `Thinking "ping works" means every service works; ping only proves the host answers ICMP.`, `Forgetting that HTTPS (443) and HTTP (80) are different ports, so a firewall can allow one and block the other.`],
  say: `Ping tells me the host is up; then I check the specific port, like 3389 for RDP or 443 for HTTPS, to see whether a firewall or the service itself is the problem.`
},
'quiz:net:IP addressing': {
  why: `Reading an IP address tells you a lot fast: whether a laptop got a real address, whether it's on the right network, and whether DHCP is working.`,
  idea: `<p>An IPv4 address is four numbers from 0 to 255. Some ranges have special meanings:</p>
  <ul class="clean"><li><b>Private</b> (used inside companies and homes): 10.x.x.x, 172.16.x.x to 172.31.x.x, 192.168.x.x. They aren't routed on the public internet: to reach it, traffic is translated to a public address (NAT). Private networks can still reach each other through routing, VPNs or tunnels, with no NAT.</li><li><b>169.254.x.x</b>: link-local (Windows calls it APIPA). A device set to get its address automatically gives itself one when no DHCP server answers, and can then reach only devices on the same local link. It's a strong clue that DHCP didn't work on that connection, not proof of which part failed. One exception: 169.254.169.254 in the cloud is the instance metadata service, not a DHCP problem.</li><li><b>127.0.0.1</b>: loopback, the device talking to itself.</li><li>Everything else (mostly): <b>public</b> internet addresses.</li></ul>`,
  example: `<p>A user's laptop shows <code>169.254.33.7</code> and "no internet." That's a self-assigned link-local address, so the laptop got no DHCP lease on this connection. That much is established; why is not yet known.</p><p>Check the cable or Wi-Fi first, then run <code>ipconfig /release</code> and <code>ipconfig /renew</code>. If it still fails, check whether other devices on the same network get addresses (if they don't, look at the DHCP server or relay), and whether the server is up or its address pool is full.</p>`,
  mistakes: [`Calling 172.32.x.x private. Only 172.16 to 172.31 is private.`, `Treating a 169.254 address as a DNS problem. The device got no DHCP lease, so DNS isn't the first thing to check.`, `Calling a 169.254 address proof that the DHCP server is down. It only shows this device got no lease: the cable, the Wi-Fi or a relay can cause it too.`, `Thinking private addresses always need NAT. NAT is how they reach the public internet; VPNs and private routing connect private networks without it.`],
  say: `If I see a 169.254 address, I know the device got no DHCP lease on that connection, so I check the link and whether DHCP answers other devices before blaming the DHCP server itself.`
},
'quiz:net:Subnetting': {
  why: `Subnetting is the classic networking interview question, and in real work it tells you whether two devices can talk directly or need a router.`,
  idea: `<p>The <b>/number</b> (prefix) says how many bits are the network part. The rest are hosts.</p>
  <ul class="clean"><li>Addresses in the subnet = 2^(32 − prefix). Usable hosts = that minus 2 (the network address and the broadcast address). Two exceptions: a /31, used for a link between two routers, has 2 usable addresses and no broadcast, and a /32 is one single host.</li><li>For /24 and longer, the block size in the last number is 256 − the mask's last number: /25 = 128, /26 = 64, /27 = 32, /28 = 16, /29 = 8, /30 = 4.</li><li>Subnets start at multiples of the block size. The first address is the <b>network</b>; the last is the <b>broadcast</b>.</li></ul>`,
  example: `<p>Find the network and broadcast for <code>192.168.1.77/27</code>.</p><p>/27 → block size 32 → blocks start at 0, 32, 64, 96… 77 falls in the block that starts at 64. Network = <b>192.168.1.64</b>, broadcast = 64 + 32 − 1 = <b>192.168.1.95</b>, usable hosts .65 to .94 (30 hosts).</p>`,
  mistakes: [`Forgetting to subtract 2 for usable hosts.`, `Starting blocks at the wrong number. They always start at a multiple of the block size.`, `Mixing up the mask: /26 is 255.255.255.192, not .224.`],
  say: `For a /27 the block size is 32, so I find the multiple of 32 just below the address; that's the network, and the next block minus one is the broadcast.`
},
'quiz:net:DNS records': {
  why: `"Email stopped arriving" and "the website moved" tickets are usually DNS. Knowing the record types tells you where to look.`,
  idea: `<p>DNS records map names to information:</p>
  <ul class="clean"><li><b>A</b>: name → IPv4 address · <b>AAAA</b>: name → IPv6 address</li><li><b>CNAME</b>: one name is an alias for another</li><li><b>MX</b>: which server receives the domain's email</li><li><b>TXT</b>: text, used for SPF, DKIM and domain verification</li><li><b>PTR</b>: reverse lookup, IP → name · <b>NS</b>: the domain's name servers</li></ul>`,
  example: `<p>After moving to Microsoft 365, outside email still goes to the old server.</p><p>Run <code>nslookup -type=mx company.com</code>. If the MX record still points to the old server, update it to the Microsoft 365 value. Changes can take time to spread because of the record's TTL (cache time).</p>`,
  mistakes: [`Pointing a CNAME at an IP address. CNAMEs point to names; A records point to IPs.`, `Forgetting TTL. DNS changes aren't instant because answers are cached.`, `Checking A records when the email problem is an MX record.`],
  say: `For mail flow I check the MX record first, and for email trust I check the TXT records for SPF and DMARC.`
}
});
