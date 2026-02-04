# GitFarm - Web Application

A modern, full-stack SaaS platform for managing GitHub contributions with automated commit generation, visual contribution editing, and subscription management.

## 🚀 Features

- **GitHub OAuth Authentication** - Secure login with GitHub
- **Visual Contribution Editor** - Paint your contribution graph
- **Automated Tasks** - Schedule recurring commits
- **Admin Dashboard** - Manage users, plans, and features
- **Dual Payment Providers** - Support for Stripe and Lemon Squeezy
- **OWASP Security** - Rate limiting, CSP headers, input validation

## 📦 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Package Manager**: Bun
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js v5
- **UI**: Tailwind CSS + shadcn/ui + MagicUI
- **Payments**: Stripe + Lemon Squeezy
- **Rate Limiting**: Upstash Redis

## 🛠️ Setup

1. **Clone and install:**
   ```bash
   git clone https://github.com/reblox01/GitFarm.git
   cd gitfarm
   bun install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Fill in your:
   - Database URL
   - GitHub OAuth credentials
   - Upstash Redis credentials (optional, for rate limiting)
   - Stripe/Lemon Squeezy API keys (optional)

3. **Set up database:**
   ```bash
   bunx prisma generate
   bunx prisma db push
   ```

4. **Run development server:**
   ```bash
   bun dev
   ```

## 📝 Development Status

This project is currently in active development. Core features implemented:
- ✅ GitHub OAuth authentication
- ✅ Database schema with Prisma
- ✅ Dashboard UI with navigation
- ✅ Payment provider abstraction
- ✅ Security headers and rate limiting
- 🚧 Contribution editor (in progress)
- 🚧 Commit generation engine (in progress)
- 🚧 Admin dashboard (in progress)

## 🔒 Security

This application follows OWASP security guidelines:
- Input validation with Zod
- Rate limiting on all API routes
- CSP and security headers
- Secure cookie handling
- No hardcoded secrets

## 📄 License

MIT License - see LICENSE file for details

## 👤 Author

Built by [@reblox01](https://github.com/reblox01)
