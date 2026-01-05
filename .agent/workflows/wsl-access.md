---
description: How to access and run commands in the WSL environment
---

To run commands in the WSL environment effectively, follow these steps:

1. **Locate Node.js**: If `npm` or `node` is not in the default path, check typical NVM locations:
   - `/home/idrum/.nvm/versions/node/v22.14.0/bin/node`
   - Use `wsl -d Ubuntu-24.04 bash -c "ls /home/idrum/.nvm/versions/node/*/bin/node"` to find available versions.

2. **Run Commands with NVM Path**: Use the explicit path to `node` and `npm` when running commands if they aren't available in the standard shell environment:
   ```bash
   wsl -d Ubuntu-24.04 bash -c "export PATH=/home/idrum/.nvm/versions/node/v22.14.0/bin:\$PATH && cd /path/to/project && npm test"
   ```

3. **Alternative: Run via full node path**:
   ```bash
   wsl -d Ubuntu-24.04 bash -c "/home/idrum/.nvm/versions/node/v22.14.0/bin/node node_modules/jest/bin/jest.js <test_file>"
   ```

4. **Debugging Paths**: If a command fails with "command not found", always use `which <command>` or `ls` on potential bin directories within the WSL environment to confirm the binary's location.
