# GitFarm - Complete Setup Guide

## Prerequisites
- Bun installed
- PostgreSQL database
- GitHub OAuth App credentials
- (Optional) Stripe and/or Lemon Squeezy accounts

## Quick Start

### 1. Install Dependencies
```bash
cd gitfarm
bun install
```

### 2. Configure Environment
Create `.env` file from template:
```bash
cp .env.example .env
```

Fill in your credentials:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/gitfarm"
GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"
NEXTAUTH_SECRET="generate_with: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Set Up Database
```bash
# Generate Prisma client
bunx prisma generate

# Create database tables
bunx prisma db push

# (Optional) Seed default data
bunx prisma db seed
```

### 4. Create First Admin User
After running the app and logging in with GitHub for the first time, manually update your user role in the database:
```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'mirocairo15@gmail.com';
```

### 5. Run Development Server
```bash
bun dev
```

Visit `http://localhost:3000`

## GitHub OAuth Setup

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create new OAuth App:
   - Application name: GitFarm
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
3. Copy Client ID and Client Secret to `.env`

## Payment Provider Setup (Optional)

### Stripe
1. Get API keys from Stripe Dashboard
2. Set up webhook endpoint: `/api/webhooks/stripe`
3. Add keys to `.env`

### Lemon Squeezy
1. Get API key from Lemon Squeezy settings
2. Create store and products
3. Add credentials to `.env`

## Production Deployment

### Environment Variables
Ensure all production URLs and secrets are set:
- `NEXTAUTH_URL` = Your production domain
- `DATABASE_URL` = Production database
- All payment provider webhook secrets

### Database Migration
```bash
bunx prisma migrate deploy
```

### Build
```bash
bun run build
bun start
```

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Verify DATABASE_URL format
- Check firewall/network settings

### Authentication Issues
- Verify GitHub OAuth callback URL matches exactly
- Check NEXTAUTH_SECRET is set and >= 32 characters
- Clear browser cookies and try again

### TypeScript Errors
- Run `bunx prisma generate` to regenerate Prisma client
- Restart TypeScript server in your IDE

## Next Steps

1. **Set up default plans** in admin dashboard
2. **Configure payment provider** in admin settings
3. **Create features** and assign to plans
4. **Test commit generation** with a test repository

## Support

For issues or questions:
- Check documentation in README.md
- Review implementation_plan.md
- See walkthrough.md for architecture details
