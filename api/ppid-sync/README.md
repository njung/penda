#### PPID's user sync

Consider this configuration in `config.js` :

Set the database configuration in `config.json` then,

```
node api/ppid-sync/syncUser
```

This command will destroy `users` and `profiles` in the database that used in `api/hapi-mongoose-db-connector.settings.json`. Make sure you make a backup. With syncUser enabled, you will not be able to modify users data on frontend and API.

