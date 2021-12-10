# Export environment variables
include ../.env
# DOCKER TASKS
# Build the container
build: ## Build the container same as docker build -t ubuntu .		port 22 on TCP portokolli järgi SSH port.
	docker build -t ubuntu_ssh --build-arg USER=${USERNAME} --build-arg PASS=${PASS} --build-arg PORT=22 .

run: ## Run container on port configured in `config.env` 127.0.0.1:80:8080/tcp vs ${PORT}:${PORT}
	docker run -d -p ${HOST}:${PORT}:22 ubuntu_ssh

up: build run ## Build and run the container.
	 