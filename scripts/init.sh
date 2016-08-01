HOST=${HOST:-localhost}
DB=${DB:-penda}
echo "Setting up initial data with $DB on $HOST"
mongoimport -h $HOST -d $DB -c users --upsert < scripts/users.json
mongoimport -h $HOST -d $DB -c profiles --upsert < scripts/profiles.json
mongoimport -h $HOST -d $DB -c categories --upsert < scripts/categories.json
