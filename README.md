### Penda

Penda is an Open Data management system.

#### Requirements

- ``node`` version 5.11
- ``sqlite3``
- ``mongodb`` verson >2.4

#### Deployment

You need configure specific host for each mode in config. There are `dev` and `prod`.

- `npm install -g bower gulp`
- `npm install`
- `bower install`
- `NODE_ENV=dev npm run setenv`
- Initiate the database, `./script/init.sh`
- Prepare the dataset directory. See ``config.js``. For default configuration,`mkdir /tmp/data`
- Set the environment, `NODE_ENV=dev npm run setenv`
- Run, `npm run server` or if you need to run on production, `NODE_ENV=prod npm run server`.

#### Test

`npm run test`

There will be a `coverage` directory that holds the code coverage reports.

#### Footer

The `FOOTER.md`, which is written on markdown syntax, will be compiled to HTML and used as footer.

