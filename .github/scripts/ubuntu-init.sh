# update immediately because github agents aren't updated very often
sudo apt-get update
# Quiets the warnings after each apt-get
sudo apt autoremove
# Code climate reporter
sudo curl -L -o /usr/local/bin/cc-test-reporter https://codeclimate.com/downloads/test-reporter/test-reporter-latest-linux-amd64
sudo chmod +x /usr/local/bin/cc-test-reporter