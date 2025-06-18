# Permission Fix for .next Directory

## Issue

The `.next` directory has root ownership, causing permission errors during linting and development.

## Quick Fix

Run this command to fix ownership:

```bash
sudo chown -R $USER:$USER .next/
```

## Alternative Approach

If you prefer not to use sudo, you can delete and recreate the directory:

```bash
sudo rm -rf .next/
npm run build  # This will recreate the directory with correct permissions
```

## Prevention

To prevent this in the future when using Docker:

1. Ensure Docker containers run with appropriate user permissions
2. Consider using `.dockerignore` to exclude `.next` from being copied
3. Add `.next` to `.gitignore` if not already present
