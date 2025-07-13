# MongoDB Unique Index Setup for Production

## Why This Is Needed
To enforce unique constraints (like unique email) in MongoDB, you must have a unique index on the relevant field. In development, Mongoose creates indexes automatically. In production, `autoIndex` is disabled for safety and performance, so you must create indexes manually or temporarily enable `autoIndex`.

## Step-by-Step: Enforcing Unique Email in Production

1. **Back up your database (optional but recommended):**
   ```sh
   mongodump --uri="YOUR_PROD_MONGODB_URI"
   ```

2. **Open a shell in your MongoDB Docker container:**
   ```sh
   docker exec -it scoutly-mongodb-1 mongosh -u scoutly_admin -p 'ScoutlySecure2024!' --authenticationDatabase admin
   ```

3. **Drop the user collections to remove all records and any conflicting indexes:**
   ```js
   use scoutly
   db.users.drop()
   db.usercredentials.drop()
   exit
   ```

4. **Edit your Mongoose model files:**
   - In `/src/models/User.ts` and `/src/models/UserCredential.ts`, set:
     ```typescript
     autoIndex: true
     ```

5. **Restart your app so Mongoose creates the indexes:**
   ```sh
   docker restart scoutly-app-1
   # or just
   docker compose restart
   ```

6. **Test registration:**
   - Try registering the same email twice. The second attempt should fail.

7. **Revert `autoIndex` to `false` in both model files for production safety:**
   - Set:
     ```typescript
     autoIndex: false
     ```
   - Restart your app again.

## Notes
- You only need to do this once, unless you change your schema's indexes in the future.
- After the unique index exists, MongoDB will always enforce uniqueness for all future writes.
- Never leave `autoIndex: true` in production for normal operation.

---

**If you encounter issues:**
- Make sure the collection is empty before creating a unique index.
- You can also create indexes manually in the Mongo shell:
  ```js
  db.usercredentials.createIndex({ email: 1 }, { unique: true })
  ```

---

_Last updated: July 13, 2025_
