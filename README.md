# Mutesync for Linux
Interfaces with a mutesync button on linux.

Requires the [MuteSync Chrome plugin](https://chrome.google.com/webstore/detail/mutesync/bgkanlpcmdofcgadmpkeifiobdlkaceg)
to be installed.

## Setup
### User Group Permissions:
User must be a member of group `dialout` for this to work:
```sh
sudo usermod -a -G dialout $USER
```
Then log out and log in again.

### Building
Build the code:
```sh
npm install
npm run build
```

### Setting up the service
Update `mutesync-linux.service` and change the `ExecStart` value to point at run.js

Set up the service:
```sh
# Copy service file to the user systemd directory
cp mutesync-linux.service /etc/systemd/user

# Install the new service
systemctl --user daemon-reload

# Start the service
systemctl --user start mutesync-linux.service

# Set the service to start at login
systemctl --user enable mutesync-linux.service

# Service should now be running
systemctl --user status mutesync-linux.service
```