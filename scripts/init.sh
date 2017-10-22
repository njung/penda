HOST=${HOST:-localhost}
PORT=${PORT:-27017}
DB=${DB:-penda}
set +e
echo "Setting up initial data with $DB on $HOST"
mongo $DB --eval 'db.dropDatabase();'
mongoimport -h $HOST --port $PORT -d $DB -c users --upsert < scripts/users.json
mongoimport -h $HOST --port $PORT -d $DB -c profiles --upsert < scripts/profiles.json
mongoimport -h $HOST --port $PORT -d $DB -c categories --upsert < scripts/categories.json
set -e
