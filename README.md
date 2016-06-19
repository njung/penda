### Penda

Penda is an Open Data management system.

#### Requirements

- ``node`` version 5.11. Symlink the binary to ``~/bin/node``.
- ``sqlite3``
- ``mongodb`` verson >2.4

#### Deployment

- ``npm install``
- ``npm install -g bower gulp``
- ``bower install``
- ``NODE_ENV=dev npm run setenv``
- ``DB=dev ./script/init.sh``
- Prepare the dataset directory. See ``config.js``.
- ``npm run server``

#### Note

You need configure specefic host in each mode in config. There are ``beta``, ``dev``, ``prod``, ``staging``, ``test``.
