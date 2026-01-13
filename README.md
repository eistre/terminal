# Linux Terminal Exercise Environment

### Master's Thesis Project

This project is a continuation of two Bachelor's thesis projects:

1. **Initial Proof of Concept (POC)** by Joonas Halapuu
   ([Bachelor's thesis project](https://gitlab.com/JoonasHalapuu/ubuntuterminal)) - The foundational POC that
   demonstrated the feasibility of the concept.

2. **Working Application Development** - Building upon the POC, the second Bachelor's thesis transformed it into a fully
   functional application that has been successfully deployed and used in university courses.

## About

This project creates isolated Ubuntu sandboxes that allow users to practice Linux command line tasks in a safe
environment. Admin users have the ability to modify, create, and delete tasks. The application features automatic
task completion detection, multi-language support (English/Estonian), and integrates with Microsoft OAuth for
university authentication.

## Tech Stack

- **Frontend**: Nuxt 4, Vue 3, Nuxt UI, Tailwind CSS, xterm.js
- **Backend**: Nuxt server, Better Auth, Drizzle ORM
- **Database**: MySQL/MariaDB
- **Infrastructure**: Kubernetes, Docker
- **Monorepo**: pnpm workspaces, Turborepo

## Project Structure

### Apps

| App | Description |
|-----|-------------|
| `web` | Main Nuxt web application with UI, authentication, and WebSocket terminal |
| `database-cleanup` | CronJob for cleaning up expired users and verifications |
| `provisioner-cleanup` | CronJob for cleaning up expired container pods |

### Packages

| Package | Description |
|---------|-------------|
| `@terminal/database` | Database layer with Drizzle ORM (schema, migrations, queries) |
| `@terminal/env` | Environment variable validation using Zod |
| `@terminal/evaluator` | Task completion evaluator using regex pattern matching |
| `@terminal/logger` | Logging utility using Pino |
| `@terminal/mailer` | Email service abstraction (Azure Communication Services) |
| `@terminal/provisioner` | Kubernetes container provisioner for Ubuntu sandbox pods |
| `@terminal/session` | SSH session management for container connections |
| `@terminal/eslint` | Shared ESLint configuration |
| `@terminal/typescript` | Shared TypeScript configuration |

## Getting Started

### Prerequisites

- Node.js 24.x
- pnpm 10.x
- Docker
- Kubernetes cluster (for container provisioning)

### Development

**Option 1: Local development**

1. Start the database:
   ```bash
   docker-compose up -d
   ```

2. Copy environment variables and configure:
   ```bash
   cp apps/web/.env.example apps/web/.env
   ```

3. Install dependencies and build packages:
   ```bash
   pnpm install
   pnpm build --filter "@terminal/*"
   ```

4. Start the development server:
   ```bash
   pnpm dev
   ```

> **Note:** Database migrations run automatically when the server starts. If the database is empty, it will be seeded with default topics and email domains. An admin user is created using the `AUTH_ADMIN_EMAIL` and `AUTH_ADMIN_PASSWORD` environment variables.

**Option 2: Full Kubernetes environment**

Deploy the full environment using the Helm chart:
```bash
helm install terminal ./deploy/kubernetes -n <namespace>
```

For local development, copy and customize the local values file:
```bash
cp ./deploy/kubernetes/values-local.example.yaml ./deploy/kubernetes/values-local.yaml
helm install terminal ./deploy/kubernetes -f ./deploy/kubernetes/values-local.yaml
```

See `deploy/kubernetes/values.yaml` for configuration options.

> **Note:** For production deployments, `apps/database-cleanup/` and `apps/provisioner-cleanup/` have their own `.env.example` files.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build all packages and apps |
| `pnpm lint` | Run ESLint across the monorepo |
| `pnpm lint:fix` | Run ESLint and auto-fix issues |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm clean` | Clean build artifacts and caches |
| `pnpm db:generate` | Generate database migrations |
| `pnpm db:studio` | Open Drizzle Studio for database inspection |
