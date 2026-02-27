# Auth0 Setup Guide

> One-time setup. Takes ~10 minutes. Do this before running `pnpm dev`.

---

## Step 1 — Create an Auth0 Account

Go to https://auth0.com → Sign up (free tier is fine for development).

---

## Step 2 — Create an Application

1. In Auth0 dashboard → **Applications** → **Create Application**
2. Name: `T&S CRM`
3. Type: **Single Page Application** (for Admin Dashboard + Customer Portal)
4. Click **Create**

After creating, note down:
- **Domain** → e.g. `your-tenant.us.auth0.com`
- **Client ID** → long string

---

## Step 3 — Create an API

1. Auth0 dashboard → **Applications** → **APIs** → **Create API**
2. Name: `T&S CRM API`
3. Identifier (Audience): `https://api.tscrm.com` (use this exact string)
4. Signing Algorithm: **RS256** ← important
5. Click **Create**

---

## Step 4 — Create an Action (inject company_id + role into JWT)

This is how `company_id` and `role` get into the JWT token automatically.

1. Auth0 dashboard → **Actions** → **Flows** → **Login**
2. Click **+** → **Build Custom** → Name: `Inject Company and Role`
3. Paste this code:

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://tscrm.com';

  // These get set when you create a user via Management API
  // or manually in Auth0 user metadata
  const companyId = event.user.app_metadata?.company_id || '';
  const role = event.user.app_metadata?.role || 'customer';

  if (event.authorization) {
    api.idToken.setCustomClaim(`${namespace}/company_id`, companyId);
    api.idToken.setCustomClaim(`${namespace}/role`, role);
    api.accessToken.setCustomClaim('company_id', companyId);
    api.accessToken.setCustomClaim('role', role);
  }
};
```

4. Click **Deploy**
5. Drag the action into the **Login** flow → Save

---

## Step 5 — Create a Test User

1. Auth0 dashboard → **User Management** → **Users** → **Create User**
2. Fill in email + password
3. After creating → click the user → **App Metadata** tab → Add:

```json
{
  "company_id": "YOUR_COMPANY_UUID",
  "role": "company_admin"
}
```

(Use the company UUID from the CRM database after you run the seed script)

---

## Step 6 — Update your .env file

```bash
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_AUDIENCE=https://api.tscrm.com
```

---

## Available Roles

| Role | Value in metadata |
|------|-------------------|
| Super Admin | `super_admin` |
| Company Admin | `company_admin` |
| Office Manager | `office_manager` |
| Dispatcher | `dispatcher` |
| Technician | `technician` |
| Customer | `customer` |

---

## Testing Auth

Once running, get a token from Auth0:

```bash
curl -X POST https://YOUR_DOMAIN/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "audience": "https://api.tscrm.com",
    "grant_type": "client_credentials"
  }'
```

Use the `access_token` in Swagger UI at http://localhost:3001/docs → Authorize.
