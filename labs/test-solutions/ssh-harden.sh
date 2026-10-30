#!/usr/bin/env bash
# test-labs fixture, run inside the lab folder:
#   right | wrong (edits only the main file) | broken (turns keys off too) | alt (earlier drop-in, = and tab syntax, AllowUsers) | crash (config deleted)
if [ "$1" = crash ]; then rm -f etc/ssh/sshd_config; exit 0; fi
chmod 700 home/deploy/.ssh; chmod 600 home/deploy/.ssh/authorized_keys
case "$1" in
  right)  sed -i 's/^PermitRootLogin yes/PermitRootLogin no/' etc/ssh/sshd_config
          sed -i 's/^PasswordAuthentication yes/PasswordAuthentication no/' etc/ssh/sshd_config.d/50-cloud-init.conf;;
  wrong)  sed -i 's/^PermitRootLogin yes/PermitRootLogin no/' etc/ssh/sshd_config
          sed -i 's/^PasswordAuthentication .*/PasswordAuthentication no/' etc/ssh/sshd_config;;
  broken) sed -i 's/^PermitRootLogin yes/PermitRootLogin no/' etc/ssh/sshd_config
          printf 'PasswordAuthentication no\nPubkeyAuthentication no\n' > etc/ssh/sshd_config.d/50-cloud-init.conf;;
  alt)    printf 'PasswordAuthentication\tno\nPermitRootLogin=no\nAllowUsers deploy\nClientAliveInterval 300\nMaxAuthTries 3\n' > etc/ssh/sshd_config.d/00-hardening.conf;;
esac
