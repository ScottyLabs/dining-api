echo "running db migrations..."
pnpm db:migrate && pnpm run start
# we stack them like this so if the migration fails, the server never starts