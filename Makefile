# DOCKER TASKS
# Build the container
build: ## Build the container
	docker build -t ubuntu .

run: ## Run container on port configured in `config.env`
	domcker run --rm -d  -p 22:22/tcp ubuntu

up: build ## Build and run the container.
	run
