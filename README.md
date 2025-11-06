```
## PostgreSQL connection string (used by backend/db.js)
# Replace the placeholders with your actual DB credentials.
# Format examples:
#   - Full URL: postgresql://user:password@localhost:5432/dbname
#   - Heroku-style: postgres://user:password@ec2-xx-xx-xx-xx.compute-1.amazonaws.com:5432/dbname

```
```
# Use the connection string below (uncomment and edit):
DATABASE_URL=postgresql://postgres:niko@localhost:5432/lostandfound_db
```
```
# Optional alternative individual env vars (some libraries use these):
# PGHOST=localhost
# PGUSER=your_db_user
# PGPASSWORD=your_db_password
# PGDATABASE=your_db_name
# PGPORT=5432

# Notes:
# - Keep this file private. Do NOT commit it to git.
# - If deploying to a platform like Heroku, the platform will provide DATABASE_URL.
# - If your DB requires SSL (e.g., cloud providers), you may need to add SSL options in your Pool configuration.

JWT_SECRET=9f3b2c1a8d4e7f0b6c5a3e8f2d1b4a7c9e0f1d2c3b4a5f6e7d8c9b0a1f2e3d4

# Google OAuth 2.0 Client ID (replace with your real client id from Google Cloud Console)
GOOGLE_CLIENT_ID=978012839825-aoe51rqcup00ggr597lp89uq4v86drii.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```
# lost-and-found
## Project setup
```
npm install
```

### Navigate 
```
 cd yolo_api_local
```
### Create venv 
```
python -m venv venv
```
### then activate 
```
venv\Scripts\activate
```

### installing dependencies
```
pip install -r requirements.txt
```

### Compiles and hot-reloads for development
```
npm run dev
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
