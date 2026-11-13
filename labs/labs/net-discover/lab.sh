TITLE="Which device doesn't belong?"
LEVEL="L2 · Networking & asset inventory"
LESSON="Device discovery on a network you're allowed to scan: a ping sweep, the neighbor (ARP) table with ip neigh, and checking what you find against an approved inventory to spot a rogue device."
HINTS=(
  "Open the lab network first: ./enter-lab   Then sweep it, one ping per address, all at once:  for i in \$(seq 1 254); do ping -c1 -W1 198.51.100.\$i >/dev/null & done; wait"
  "Who answered? ip neigh   Each line is an IP address and its hardware (MAC) address after 'lladdr'. Lines marked FAILED or INCOMPLETE are addresses where nothing answered."
  "Compare each MAC with the approved list: grep -i THE-MAC inventory.txt   The one that isn't listed is the rogue. Write its IP and MAC:  echo '198.51.100.X 02:..:..:..:..:..' > answer.txt   then type exit and run sq-lab check net-discover"
)
# The lab network is built only inside ./enter-lab: a throwaway private network (Linux network namespaces joined by a
# virtual switch) with no route to the internet, the home network or Windows. It disappears when you leave the shell.
# Addresses come from 198.51.100.0/24, a range reserved for documentation, so no real network uses them.
lab_setup() {
  local names=(printer nas door-camera thermostat front-desk-pc) mac used=" 5 " IPV rogue rogue_ip offline n
  hexb() { printf '%02x' $((RANDOM % 256)); }
  newmac() { printf '02:%s:%s:%s:%s:%s' "$(hexb)" "$(hexb)" "$(hexb)" "$(hexb)" "$(hexb)"; }
  newip() { local x; while :; do x=$((RANDOM % 240 + 10)); case "$used" in *" $x "*) ;; *) used="$used$x "; IPV=$x; return;; esac; done; }   # no subshell, so used stays up to date
  offline=$((RANDOM % 5)); rogue=$((RANDOM % 5)); while [ "$rogue" = "$offline" ]; do rogue=$((RANDOM % 5)); done
  {
    echo "# Approved devices on the office network (asset inventory). Matched by hardware (MAC) address."
    echo "# Anything on the network that is not on this list is not approved."
    echo "# MAC                 device"
  } > "$DIR/inventory.txt"
  : > "$DIR/.net"
  for n in 0 1 2 3 4; do
    mac=$(newmac)
    if [ "$n" = "$rogue" ]; then
      newip; rogue_ip="198.51.100.$IPV"
      echo "$rogue_ip $mac" >> "$DIR/.net"; echo "$rogue_ip $mac" > "$DIR/.answer"
      # the rogue looks like a normal device type, so the name gives nothing away
      continue
    fi
    printf '%s   %s\n' "$mac" "${names[$n]}" >> "$DIR/inventory.txt"
    # one approved device is switched off today: listed in the inventory, but nothing answers for it
    [ "$n" = "$offline" ] || { newip; echo "198.51.100.$IPV $mac" >> "$DIR/.net"; }
  done
  cat > "$DIR/enter-lab" <<'EOF'
#!/usr/bin/env bash
# Opens the SkillQuest lab network: a private, throwaway network that exists only while this shell is open.
#   ./enter-lab            an interactive shell on the lab network
#   ./enter-lab -c 'CMD'   run one command on the lab network (used by the lab tests)
# No sudo. Inside, the prompt says root, but it is a fake root that only counts inside this private network.
set -u
D="$(cd "$(dirname "$0")" && pwd)"
if [ -z "${SQ_NETLAB_INNER:-}" ]; then
  if ! unshare -Urn true 2>/dev/null; then
    echo "Can't create the private lab network here: this system blocks unprivileged user namespaces."; exit 1
  fi
  # a new user, network, mount and process namespace; --kill-child ends every fake device when you leave
  exec env SQ_NETLAB_INNER=1 unshare -Urn --pid --fork --mount-proc --kill-child bash "$0" "$@"
fi
fail() { echo "enter-lab: $*"; exit 1; }
ip link set lo up
ip link add br0 type bridge 2>/dev/null || fail "Linux couldn't create the lab's virtual switch (the bridge module isn't loaded). In Windows PowerShell run:  wsl -u root modprobe bridge   then try again."
ip link set br0 up && ip addr add 198.51.100.5/24 dev br0 || fail "couldn't set up the lab network"
i=0
while read -r addr mac _; do
  [ -n "$addr" ] || continue
  i=$((i + 1))
  unshare -n bash -c 'exec -a sq-netlab-host sleep infinity' &
  pid=$!
  for _ in $(seq 1 100); do [ "$(readlink /proc/$pid/ns/net 2>/dev/null)" != "$(readlink /proc/self/ns/net)" ] && [ -n "$(readlink /proc/$pid/ns/net 2>/dev/null)" ] && break; sleep 0.05; done
  ip link add "h$i" type veth peer name eth0 netns "$pid" || fail "couldn't connect device $i"
  ip link set "h$i" master br0 && ip link set "h$i" up
  nsenter -t "$pid" -n sh -c "ip link set lo up; ip link set eth0 address $mac; ip addr add $addr/24 dev eth0; ip link set eth0 up" || fail "couldn't start device $i"
done < "$D/.net"
# Safety: refuse to open the shell if this network has any way out (a default route or any other interface).
[ -z "$(ip route show default)" ] || fail "refusing: the lab network has a route out"
[ -z "$(ip -o link | grep -vE '^[0-9]+: (lo|br0|h[0-9]+)(@|:)')" ] || fail "refusing: the lab network has an unexpected interface"
cd "$D" || exit 1
if [ "${1:-}" = -c ]; then bash -c "${2:-true}"; exit $?; fi
cat > "$D/.labrc" <<'RC'
PS1='\[\e[36m\][lab network 198.51.100.0/24]\[\e[0m\] \W \$ '
echo
echo "You are on the lab network as 198.51.100.5. It has no way out to the internet or your home network."
echo "Scope: you may sweep 198.51.100.0/24 here, and only here. Type exit to leave; the network disappears."
echo "(The prompt says root: that's a fake root that only counts inside this private network.)"
echo
RC
exec bash --rcfile "$D/.labrc" -i
EOF
  chmod 755 "$DIR/enter-lab"
}
lab_mission() {
  echo "You've been asked to check the office network for devices that shouldn't be there."
  echo "inventory.txt lists every approved device by its hardware (MAC) address. One device on the"
  echo "network isn't on that list. Find it, and write its IP address and MAC address into answer.txt"
  echo "in this folder, like:  198.51.100.X 02:xx:xx:xx:xx:xx"
  echo
  echo "Rules of engagement (scope): only the lab network, 198.51.100.0/24, and only from inside ./enter-lab."
  echo "Never sweep a network you don't own or aren't allowed to scan: not your home Wi-Fi, school or work."
  echo "Open the lab network with: ./enter-lab   (no sudo; it disappears when you type exit)"
}
lab_check() {
  local want_ip want_mac got ips
  read -r want_ip want_mac < "$DIR/.answer"
  got=$(tr 'A-F' 'a-f' < "$DIR/answer.txt" 2>/dev/null | tr -d '\r')
  if [ -z "$(echo "$got" | tr -d ' \n')" ]; then bad "answer.txt is missing or empty"; return; fi
  ips=$(echo "$got" | grep -oE '198\.51\.100\.[0-9]+' | sort -u)
  if [ "$(echo "$ips" | grep -c .)" -gt 1 ]; then bad "answer.txt names more than one device; only the one that isn't approved belongs there"; return; fi
  if [ "$ips" = "$want_ip" ]; then ok "$want_ip is the device that isn't on the approved list"
  elif [ -n "$ips" ] && awk -v ip="$ips" '$1 == ip {f=1} END {exit !f}' "$DIR/.net"; then bad "${ips:-that address} is an approved device (its MAC is in inventory.txt)"
  else bad "${ips:-no 198.51.100.x address found}: that isn't the rogue device's IP address"; fi
  if echo "$got" | grep -qiF "$want_mac"; then ok "its MAC address is right ($want_mac)"
  else bad "the MAC address in answer.txt doesn't match the rogue device's (see ip neigh, after 'lladdr')"; fi
}
