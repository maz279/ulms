# ULMS P0 Makefile — thin, delegates to the real tools
SHELL := /bin/bash
API   := apps/api
WEB   := apps/web
COMPOSE := deploy/compose

.PHONY: help up down logs seed test web-build e2e clean

help:
	@grep -E '^[a-zA-Z_-]+:.*?##' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-12s\033[0m %s\n",$$1,$$2}'

up: ## boot the full local stack (detached)
	cd $(COMPOSE) && docker compose up -d

down: ## stop the stack (keep volumes)
	cd $(COMPOSE) && docker compose down

logs: ## tail api logs
	cd $(COMPOSE) && docker compose logs -f api

seed: ## apply Keycloak realm + synthetic seed data (idempotent)
	cd $(COMPOSE) && docker compose up -d postgres keycloak
	@echo "Waiting for services..."; sleep 8
	docker compose -f $(COMPOSE)/docker-compose.yml exec -T postgres \
	  psql -U ulms -d ulms -f /docker-entrypoint-initdb.d/10-seed.sql || true
	@echo "Realm import is automatic on first Keycloak boot (deploy/seed/realm-ulms.json)."

test: ## backend tests (JDK 21 required)
	cd $(API) && ./gradlew --console=plain test

web-build: ## typecheck + production build of the staff app
	cd $(WEB) && npm ci && npm run build

e2e: ## Playwright walking-skeleton suite (stack must be up)
	cd e2e && npm ci && npx playwright test

clean: ## stop stack and remove volumes (destroys local data)
	cd $(COMPOSE) && docker compose down -v
