TITLE="Lock down SSH (without locking out deploy)"
LEVEL="L2 · Linux security"
LESSON="SSH hardening: keys only and no root login, sshd keeps the FIRST value it reads (drop-ins in sshd_config.d come first), and sshd ignores key files that group or others can write (700/600 is the safe standard)."
HINTS=(
  "Files in sshd_config.d are read first, in name order, and the first value wins. Find every place a setting is made:  grep -ri 'passwordauthentication\\|permitrootlogin' etc/ssh/"
  "sshd ignores key files that group or others can write, which is why deploy's key broke. Look with:  ls -la home/deploy/.ssh   The team standard is  chmod 700 home/deploy/.ssh; chmod 600 home/deploy/.ssh/authorized_keys"
  "Set PasswordAuthentication no in the drop-in that sets it (50-cloud-init.conf), or in an earlier-named drop-in, and set PermitRootLogin no. Leave PubkeyAuthentication alone so keys keep working."
)
lab_setup() {
  mkdir -p "$DIR/etc/ssh/sshd_config.d" "$DIR/home/deploy/.ssh"
  cat > "$DIR/etc/ssh/sshd_config" <<'CONF'
# This is the sshd server system-wide configuration file (lab copy).
# sshd keeps the FIRST value it obtains for each setting.

Include /etc/ssh/sshd_config.d/*.conf

#Port 22
PermitRootLogin yes
#PubkeyAuthentication yes
PasswordAuthentication no
KbdInteractiveAuthentication no
UsePAM yes
X11Forwarding yes
PrintMotd no
Subsystem sftp /usr/lib/openssh/sftp-server
CONF
  printf 'PasswordAuthentication yes\n' > "$DIR/etc/ssh/sshd_config.d/50-cloud-init.conf"
  printf 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExampleLabKeyOnlyNotARealKey00000000000 deploy@build\n' > "$DIR/home/deploy/.ssh/authorized_keys"
  chmod 755 "$DIR/home/deploy"; chmod 755 "$DIR/home/deploy/.ssh"; chmod 666 "$DIR/home/deploy/.ssh/authorized_keys"
}
lab_mission() {
  echo "Security review of a new Ubuntu server's SSH settings (a copy lives in etc/ssh and home/deploy):"
  echo "  - passwords must not be accepted (no password path at all), and nobody may sign in directly as root;"
  echo "  - the deploy account must still be able to sign in with its key;"
  echo "  - team standard: home/deploy/.ssh is 700 and authorized_keys is 600."
  echo "Background: deploy's key stopped working last week, so someone switched passwords back on."
  echo "Fix the real cause and harden the config. (There's no real sshd here; the checker reads the files the way sshd does."
  echo "Paths like /etc/ssh/... in Include lines mean this lab's etc/ssh folder.)"
}
lab_check() {
  local out
  out=$(python3 -I - "$DIR" <<'PY'
import glob, os, re, stat, sys
d = sys.argv[1]
# every sshd_config keyword in current OpenSSH (man sshd_config), lowercased; sshd refuses to start on anything else
KNOWN = set('''acceptenv addressfamily allowagentforwarding allowgroups allowstreamlocalforwarding allowtcpforwarding allowusers
authenticationmethods authorizedkeyscommand authorizedkeyscommanduser authorizedkeysfile authorizedprincipalscommand
authorizedprincipalscommanduser authorizedprincipalsfile banner casignaturealgorithms channeltimeout chrootdirectory ciphers
clientalivecountmax clientaliveinterval compression denygroups denyusers disableforwarding exposeauthinfo fingerprinthash
forcecommand gatewayports gssapiauthentication gssapicleanupcredentials gssapikeyexchange gssapistrictacceptorcheck
gssapistorecredentialsonrekey hostbasedacceptedalgorithms hostbasedauthentication hostbasedusesnamefrompacketonly
hostcertificate hostkey hostkeyagent hostkeyalgorithms ignorerhosts ignoreuserknownhosts include ipqos kbdinteractiveauthentication
kerberosauthentication kerberosgetafstoken kerberosorlocalpasswd kerberosticketcleanup kexalgorithms listenaddress
logingracetime loglevel logverbose macs match maxauthtries maxsessions maxstartups moduli passwordauthentication
permitemptypasswords permitlisten permitopen permitrootlogin permittty permittunnel permituserenvironment permituserrc
persourcemaxstartups persourcenetblocksize persourcepenalties persourcepenaltyexemptlist pidfile port printlastlog printmotd
pubkeyacceptedalgorithms pubkeyauthentication pubkeyauthoptions rdomain rekeylimit refuseconnection requiredrsasize revokedkeys
securitykeyprovider setenv streamlocalbindmask streamlocalbindunlink strictmodes subsystem syslogfacility tcpkeepalive
trustedusercakeys unusedconnectiontimeout usedns usepam versionaddendum x11displayoffset x11forwarding x11uselocalhost
xauthlocation challengeresponseauthentication dsaauthentication'''.split())
ALIAS = {'challengeresponseauthentication': 'kbdinteractiveauthentication'}
seen, problems = {}, []
def read(path, depth=0):
    if depth > 5: problems.append('Include nests too deeply (a file including itself?)'); return
    for raw in open(path, encoding='utf-8', errors='replace'):
        line = raw.split('#', 1)[0].strip()
        if not line: continue
        parts = re.split(r'\s*=\s*|\s+', line, maxsplit=1)
        key, val = parts[0], (parts[1] if len(parts) > 1 else '').strip()
        k = ALIAS.get(key.lower(), key.lower())
        if k == 'match': return            # everything after Match is conditional; not used in this lab
        if k not in KNOWN: problems.append('unknown setting "%s": sshd would refuse to start' % key)
        if k == 'include':
            for pat in val.split():
                pat = os.path.join(d, pat.lstrip('/'))            # /etc/ssh/... means this lab's etc/ssh
                for f in sorted(glob.glob(pat)):
                    if os.path.realpath(f).startswith(os.path.realpath(d) + os.sep): read(f, depth + 1)
        elif k not in seen: seen[k] = val
read(os.path.join(d, 'etc/ssh/sshd_config'))
eff = lambda k, default: seen.get(k, default).lower()
for p in problems: print('BAD ' + p)
print(('OK' if eff('passwordauthentication', 'yes') == 'no' else 'BAD') + ' secure: passwords are refused (effective PasswordAuthentication = %s)' % eff('passwordauthentication', 'yes'))
print(('OK' if eff('kbdinteractiveauthentication', 'yes') == 'no' else 'BAD') + ' secure: keyboard-interactive (another password path) is off')
print(('OK' if eff('permitrootlogin', 'prohibit-password') == 'no' else 'BAD') + ' secure: no direct root sign-in (effective PermitRootLogin = %s)' % eff('permitrootlogin', 'prohibit-password'))
print(('OK' if eff('permitemptypasswords', 'no') == 'no' else 'BAD') + ' secure: empty passwords are not allowed')
print(('OK' if eff('strictmodes', 'yes') == 'yes' else 'BAD') + ' secure: StrictModes stays on (sshd keeps checking key file permissions)')
print(('OK' if eff('pubkeyauthentication', 'yes') == 'yes' else 'BAD') + ' still works: key sign-in is enabled')
akf = seen.get('authorizedkeysfile')
print(('OK' if akf is None or '.ssh/authorized_keys' in akf.split() else 'BAD') + ' still works: sshd still reads ~/.ssh/authorized_keys')
allow, deny = seen.get('allowusers'), seen.get('denyusers')
print(('OK' if allow is None or 'deploy' in allow.split() else 'BAD') + ' still works: deploy is allowed to sign in' + ('' if allow is None else ' (AllowUsers %s)' % allow))
if deny and 'deploy' in deny.split(): print('BAD still works: DenyUsers blocks deploy')
if 'allowgroups' in seen: print("BAD still works: AllowGroups would block deploy unless it's in that group; use AllowUsers here")
am = seen.get('authenticationmethods')
if am and am.lower() != 'any' and not any(set(lst.split(',')) == {'publickey'} for lst in am.split()):
    print('BAD AuthenticationMethods must let deploy in with a key alone (publickey)')
home, ssh, ak = (os.path.join(d, p) for p in ('home/deploy', 'home/deploy/.ssh', 'home/deploy/.ssh/authorized_keys'))
if not os.path.isfile(ak) or 'ssh-ed25519' not in open(ak).read(): print("BAD still works: deploy's authorized_keys is missing or its key is gone")
else:
    m0, m1, m2 = (stat.S_IMODE(os.stat(p).st_mode) for p in (home, ssh, ak))
    print(('OK' if not (m0 | m1 | m2) & 0o022 else 'BAD') + ' still works: sshd will trust the key files (home %o, .ssh %o, authorized_keys %o: group and others may not write them)' % (m0, m1, m2))
    print(('OK' if m1 == 0o700 and m2 == 0o600 else 'BAD') + ' team standard: .ssh is 700 and authorized_keys is 600 (now %o and %o)' % (m1, m2))
PY
) || bad "couldn't read your files (see the error above)"
  while IFS= read -r l; do case "$l" in OK*) ok "${l#OK }";; BAD*) bad "${l#BAD }";; esac; done <<<"$out"
}
