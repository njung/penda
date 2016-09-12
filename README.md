### Penda

Penda is an Open Data management system.

#### Requirements

- ``node`` version 5.11. Symlink the binary to ``~/bin/node``. TODO : auto detect the node binary.
- ``sqlite3``
- ``mongodb`` verson >2.4

#### Deployment

You need configure specific host for each mode in config. There are `dev` and `prod`.

- ``npm install``
- ``npm install -g bower gulp``
- ``bower install``
- ``NODE_ENV=dev npm run setenv``
- ./script/init.sh``
- Prepare the dataset directory. See ``config.js``. For default configuration,``mkdir /tmp/data``
- ``npm run server``

#### Footer

The `FOOTER.md`, which is written on markdown syntax, will be compiled to HTML and used as footer.

