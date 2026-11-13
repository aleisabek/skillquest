#!/usr/bin/env bash
# Fixture fixes for the net-discover lab, run inside its folder. The right fix really sweeps the lab network through
# ./enter-lab and compares what answered with inventory.txt, so the test proves the lab network works end to end.
#   right  sweep, ip neigh, MAC not in the inventory -> answer.txt
#   alt    the same answer written MAC first, in capitals
#   wrong  an approved device that is online
#   broken the rogue's IP with an approved device's MAC
#   crash  answer.txt unreadable
set -u
found() {
  ./enter-lab -c 'for i in $(seq 1 254); do ping -c1 -W1 198.51.100.$i >/dev/null 2>&1 & done; wait; ip neigh show dev br0' |
    awk '/lladdr/ {print $1, $3}'
}
rogue() { found | while read -r ip mac; do grep -qi "$mac" inventory.txt || echo "$ip $mac"; done; }
case "${1:-right}" in
  right)  rogue > answer.txt;;
  alt)    rogue | awk '{print toupper($2), $1}' > answer.txt;;
  wrong)  found | while read -r ip mac; do grep -qi "$mac" inventory.txt && { echo "$ip $mac"; break; }; done > answer.txt;;
  broken) r=$(rogue | cut -d' ' -f1); m=$(grep -oiE '([0-9a-f]{2}:){5}[0-9a-f]{2}' inventory.txt | head -1); echo "$r $m" > answer.txt;;
  crash)  echo x > answer.txt; chmod 000 answer.txt;;
esac
