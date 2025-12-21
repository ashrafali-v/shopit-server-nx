## ShopIt - Copilot instructions (concise)

This file gives AI coding agents the minimal, actionable context needed to be productive in this repository.

1) Big picture
- Multi-repo Nx monorepo containing NestJS microservices (gateway, product-service, order-service, user-service, notification-service) and a shared library at `libs/shared`.
- Infrastructure used in development: RabbitMQ (AMQP) and Redis. Docker compose for local infra: `docker-compose-dev.yml`.

2) Primary workflows & commands (copy-paste)
- Install deps: `pnpm install` (pnpm recommended; npm will also work).
- Start infra locally: `docker compose -f docker-compose-dev.yml up -d`.
- Start all services: `npx nx run-many --target=serve --projects=gateway,product-service,order-service,user-service --parallel=4`.
- Start a single service: `npx nx serve <service-name>` (e.g., `npx nx serve gateway`).
- Run tests: `npx nx test <project>`.
- Build: `npx nx build <project>`.

3) Key files to reference when understanding code
- Root README: `README.md` (contains dev & docker steps).
- Nx config: `nx.json` (task defaults and plugins).
- Shared Prisma schema: `libs/shared/prisma/schema.prisma` — migrations and Prisma client live in `libs/shared`.
- Gateway entry: `apps/gateway/src/main.ts` shows global pipes, CORS, and security-related middleware patterns.
- Project configs: check `project.json` inside each app for targets (serve/build/test).

4) Project-specific patterns and conventions (do not invent alternatives)
- Services are NestJS apps using the Nest microservices module + RabbitMQ. Look for `@nestjs/microservices`, `amqplib`, `amqp-connection-manager` in `package.json`.
- Shared DTOs, types and prisma client live under `libs/shared` — change here for cross-cutting types.
- Prisma migrations: run from `libs/shared` (e.g., `cd libs/shared && npx prisma migrate dev --name ...`), then `npx prisma generate`.
- Caching uses Redis and `cache-manager-redis-yet` — expect Redis to be required for product-service caching.

5) Integration & infra notes
- RabbitMQ management UI: http://localhost:15672 (dev username/password from README: admin/admin). AMQP port 5672.
- Redis: port 6379.
- Mailpit web UI (dev): http://localhost:8025; SMTP port exposed for tests.
- Docker compose used during development: `docker-compose-dev.yml` (preferred over the production compose file).

6) Useful patterns for code generation and editing
- Use Nx generators for new apps/libs: `npx nx g @nx/nest:app <name>` or `npx nx g @nx/node:lib <name>`.
- Keep cross-service types in `libs/shared` to avoid duplication. When modifying Prisma models, follow the multi-phase migrations guidance in the README.

7) What an AI agent should avoid changing without human review
- Do not change `project.json` targets, `nx.json` namedInputs, or plugin settings lightly — these control CI and task caching.
- Avoid removing or renaming files under `libs/shared/prisma` without coordinating migrations.

8) Quick troubleshooting tips for agents
- If services fail to start, check infra first: `docker compose -f docker-compose-dev.yml ps` and RabbitMQ logs.
- Common dev startup: start docker infra, then run `npx nx serve gateway` and other services. Use `ps aux | grep "nx serve"` to find running instances.

If anything here is missing or unclear, tell me which area to expand (e.g., specific service internals, message formats, DTO locations, or CI steps).
