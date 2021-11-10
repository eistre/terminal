# DOCKER TASKS
# Build the container
build: ## Build the container same as docker build -t ubuntu .
	docker build -t ubuntu_ssh .

run: ## Run container on port configured in `config.env`
	docker run -d -p 22:22 ubuntu_ssh

up: build run ## Build and run the container.
	 