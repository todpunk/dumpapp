dumpapp
==========

A simple file-dump with voting for people with accounts (username and a pin).  Not meant to be a serious wide-spread service, so it is in no way "scalable" since it was just an experiment to learn AngularJS

To start: python app.py default
This will blow away the database and create a fresh start (the only data you'd lose on a live db is votes)
Files go in ./static/dump/
The flask command is app.py, and you can change the host/port it uses
Logins are managed manually in the sqlite db, though that could be a feature add
Files must be deleted by the server admin, not from the web interface.  The app will remove files and votes from the database after physical deletion.
