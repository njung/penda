### Penda

Penda is an Open Data management system.

#### Requirements

- ``node`` version 5.11. Symlink the binary to ``~/bin/node``. TODO : auto detect the node binary.
- ``sqlite3``
- ``mongodb`` verson >2.4

#### Deployment

You need configure specific host for each mode in config. There are ``beta``, ``dev``, ``prod``, and ``staging``.

- ``npm install``
- ``npm install -g bower gulp``
- ``bower install``
- ``NODE_ENV=dev npm run setenv``
- ``DB=dev ./script/init.sh``
- Prepare the dataset directory. See ``config.js``. For default configuration,``mkdir /tmp/data``
- ``npm run server``

#### JWT specific configuration

There are Hawk and JWT auth in the backend. JWT auth used by default. Please use enforced strong secret key in `config.json`.


#### PPID's user sync

Consider this configuration in `config.js` :

```
  ...
  "syncUser" : true,
  "ppidDb" : {
    "host" : "localhost",
    "database" : "ppid",
    "user" : "root",
    "password" : "root"
  }
}
```

Then,

```
node api/ppid-sync/syncUser
```

This command will destroy `users` and `profiles` in the database that used in `api/hapi-mongoose-db-connector.settings.json`. Make sure you take a backup. With syncUser enabled, you will not be able to modify users data on frontend and API.

#### Footer

The `FOOTER.md`, which is written on markdown syntax, will be compiled to HTML and used as footer.

