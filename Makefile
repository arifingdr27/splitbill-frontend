.PHONY: help install dev build lint preview clean docker-build docker-up docker-down docker-logs

PORT ?= 8082
VITE_API_URL ?= https://splitbill.inviteweeding.my.id/api/v2

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	npm ci

dev: ## Start Vite dev server
	npm run dev

build: ## Build production bundle
	npm run build

lint: ## Run ESLint
	npm run lint

preview: ## Preview production build
	npm run preview

clean: ## Remove build artifacts and node_modules
	rm -rf dist node_modules

docker-build: ## Build Docker image
	docker compose build --build-arg VITE_API_URL=$(VITE_API_URL)

docker-up: ## Run app via Docker Compose
	PORT=$(PORT) VITE_API_URL=$(VITE_API_URL) docker compose up -d --build

docker-down: ## Stop Docker Compose services
	docker compose down

docker-logs: ## Tail Docker Compose logs
	docker compose logs -f
