### Penda

Penda is an Open Data management system.

#### Requirements

- ``node`` version 5.11. Symlink the binary to ``~/bin/node``. TODO : auto detect the node binary.
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

#### JWT specific configuration

There are Hawk and JWT auth in the backend. JWT auth used by default. Please use enforced strong secret key in `config.json`.

#### Note

You need configure specefic host in each mode in config. There are ``beta``, ``dev``, ``prod``, ``staging``, ``test``.
