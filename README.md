# Linux Terminal Exercise Environment

## Master's Thesis Project

This repository contains the implementation and thesis sources for the Master's thesis
**"Modernization and Cost Reduction of a Web-Based Linux Command-Line Learning Environment"**.

The thesis continues two earlier Bachelor's thesis projects:

1. **Initial Proof of Concept (POC)** by Joonas Halapuu
   ([thesis](https://thesis.cs.ut.ee/57e3d58f-2bef-4fb4-bbe5-8577f75ced68),
   [source](https://gitlab.com/JoonasHalapuu/ubuntuterminal)) - The foundational POC that demonstrated the feasibility
   of the concept.

2. **Cloud-hosted Learning Platform**
   ([thesis](https://thesis.cs.ut.ee/481d5a25-276c-4a6e-87f5-80b2626446a3)) - The follow-up project that transformed the
   POC into a deployed application used in university courses.

The thesis focuses on modernizing the earlier platform through clearer module boundaries, provider-agnostic Linux
environment provisioning, improved authentication and multilingual content management, scheduled maintenance jobs, and
reproducible deployments on UT HPC, Microsoft Azure, and Amazon Web Services.

## About

This project creates isolated Linux environments that allow users to practice command-line tasks through a browser-based
terminal.
Admin users can modify, create, and delete topics and tasks.
The application features automatic task completion detection based on shell output and file system events,
multi-language support (English/Estonian), and authentication through email-based login and SSO/OAuth providers.
Email domain allowlists provide control over user registration.

## Tech Stack

- **Frontend**: Nuxt 4, Vue 3, Nuxt UI, Tailwind CSS, xterm.js
- **Backend**: Nuxt server, Better Auth, Drizzle ORM
- **Database**: MySQL/MariaDB
- **Infrastructure**: Docker, Kubernetes/Helm, Terraform, Azure Container Apps/Instances, AWS Lightsail/ECS/Fargate
- **Email**: Azure Communication Services, AWS SES, SMTP
- **Secret Storage**: Kubernetes Secrets, Azure Key Vault, AWS Secrets Manager
- **Monorepo**: pnpm workspaces, Turborepo

## Project Structure

### Apps

| App                   | Description                                                               |
|-----------------------|---------------------------------------------------------------------------|
| `web`                 | Main Nuxt web application with UI, authentication, and WebSocket terminal |
| `database-cleanup`    | Scheduled job for cleaning up expired users and verifications             |
| `provisioner-cleanup` | Scheduled job for cleaning up expired Linux session containers            |

### Packages

| Package                 | Description                                                                                                   |
|-------------------------|---------------------------------------------------------------------------------------------------------------|
| `@terminal/database`    | Database layer with Drizzle ORM (schema, migrations, queries)                                                 |
| `@terminal/env`         | Environment variable validation using Zod                                                                     |
| `@terminal/evaluator`   | Task completion evaluator using regex pattern matching                                                        |
| `@terminal/logger`      | Logging utility using Pino                                                                                    |
| `@terminal/mailer`      | Email service abstraction (Azure Communication Services, AWS SES, SMTP)                                       |
| `@terminal/provisioner` | Container provisioner for Linux session environments (Kubernetes, Azure Container Instances, AWS ECS/Fargate) |
| `@terminal/session`     | SSH session management for container connections                                                              |
| `@terminal/eslint`      | Shared ESLint configuration                                                                                   |
| `@terminal/typescript`  | Shared TypeScript configuration                                                                               |

### Other Directories

| Directory           | Description                                                       |
|---------------------|-------------------------------------------------------------------|
| `deploy/kubernetes` | Helm chart for Kubernetes and UT HPC deployments                  |
| `deploy/azure`      | Terraform configuration for the Azure deployment                  |
| `deploy/aws`        | Terraform configuration for the AWS deployment                    |
| `resources`         | Source material used by seeded exercise content                   |
| `thesis`            | LaTeX thesis source, figures, references, and build configuration |

## Getting Started

### Prerequisites

- Node.js 24
- pnpm
- Docker
- Container platform: Kubernetes cluster, Azure subscription, or AWS account

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

> **Note:** Database migrations run automatically when the server starts.
> If the database is empty, it will be seeded with default topics and email domains.
> An admin user is created using the `AUTH_ADMIN_EMAIL` and `AUTH_ADMIN_PASSWORD` environment variables.

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

**Option 3: University of Tartu HPC Kubernetes**

For deploying to UT HPC, see `deploy/kubernetes/values-hpc.example.yaml` for configuration example and instructions.

> **Note:** For production deployments, `apps/database-cleanup/` and `apps/provisioner-cleanup/` have their own
> `.env.example` files.

## Scripts

| Command              | Description                                                             |
|----------------------|-------------------------------------------------------------------------|
| `pnpm build`         | Build all packages and apps                                             |
| `pnpm clean`         | Clean build artifacts and caches                                        |
| `pnpm clean:all`     | Clean build artifacts, caches, and workspace `node_modules` directories |
| `pnpm db:generate`   | Generate database migrations                                            |
| `pnpm db:studio`     | Open Drizzle Studio for database inspection                             |
| `pnpm dev`           | Start development server                                                |
| `pnpm lint`          | Run ESLint across the monorepo                                          |
| `pnpm lint:fix`      | Run ESLint and auto-fix issues                                          |
| `pnpm lint:root`     | Run ESLint for root-level files                                         |
| `pnpm lint:root:fix` | Run ESLint for root-level files and auto-fix issues                     |
| `pnpm prepare`       | Install Husky Git hooks                                                 |
| `pnpm thesis`        | Build the thesis PDF                                                    |
| `pnpm typecheck`     | Run TypeScript type checking                                            |

## Thesis

This repository also contains the thesis material under `thesis/`.
Thesis dependencies are kept separate from the main application bootstrap.

For local thesis setup on macOS:

```bash
brew bundle --file thesis/Brewfile
pnpm thesis
```

The generated PDF is written to `thesis/.output/main.pdf`.

For thesis-specific structure and build notes, see `thesis/README.md`.
