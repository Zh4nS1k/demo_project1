# ─────────────────────────────────────────────────────────────
# Coffee Drinker — root Makefile
# Wraps the npm scripts in ./package.json and adds test/docker/tooling targets.
# Run `make help` to list everything.
# ─────────────────────────────────────────────────────────────

SHELL := /bin/bash
.DEFAULT_GOAL := help

# ───────────── Development ─────────────

.PHONY: help
help: ## Show this help
	@echo "☕ Coffee Drinker — available targets:"
	@echo
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'
	@echo
	@echo "  Git hooks:      run 'make hooks' once after cloning (installs .githooks)"
	@echo "  Docker:         make docker-up  → app on http://localhost:3001"

.PHONY: install
install: ## Install dependencies (root + server + client)
	npm install
	npm --prefix server install
	npm --prefix client install

.PHONY: server
server: ## Run the Express API in dev mode (nodemon, port 3000)
	npm run dev:server

.PHONY: client
client: ## Run the Next.js client in dev mode (port 3001)
	npm run dev:client

.PHONY: dev
dev: ## Run server + client together with logs prefixed
	npm run dev

.PHONY: seed
seed: ## Seed the database with demo data
	npm run seed

.PHONY: seed-clean
seed-clean: ## Wipe the database, then seed demo data
	npm run seed:clean

# ───────────── Verification ─────────────

.PHONY: test
test: test-server test-client ## Run all tests (server jest + client offline harness)

.PHONY: test-server
test-server: ## Run the server test suite (jest, in-memory MongoDB)
	npm run test

.PHONY: test-client
test-client: ## Run the client offline-resilience harness
	npm --prefix client run test:offline

.PHONY: build
build: ## Production build of the client (Next.js)
	npm run build

.PHONY: verify
verify: test build ## Full CI-style check: tests + build

# ───────────── Git hooks ─────────────

.PHONY: hooks
hooks: ## Install git hooks from .githooks/ (run once after cloning)
	git config core.hooksPath .githooks
	@echo "🪝 Git hooks installed (pre-commit, pre-push, post-merge)"

.PHONY: hooks-uninstall
hooks-uninstall: ## Uninstall git hooks (restore default .git/hooks)
	git config --unset core.hooksPath
	@echo "🪝 Git hooks uninstalled"

# ───────────── Docker ─────────────

.PHONY: docker-build
docker-build: ## Build all Docker images (mongo pulls on first up)
	docker compose build

.PHONY: docker-up
docker-up: ## Start the full stack with Docker (client → http://localhost:3001)
	docker compose up --build

.PHONY: docker-down
docker-down: ## Stop the Docker stack (add V=1 to also drop the DB volume)
	docker compose down

.PHONY: docker-clean
docker-clean: ## Stop the stack and delete the database volume
	docker compose down -v

# ───────────── Maintenance ─────────────

.PHONY: clean
clean: ## Remove build output and coverage
	rm -rf client/.next server/coverage
	@echo "🧹 Cleaned build artifacts"

.PHONY: promote-admin
promote-admin: ## Promote a user to admin (USER=username make promote-admin)
	npm run promote-admin
