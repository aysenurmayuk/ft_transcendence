# Makefile

# This Makefile is used to build and run the ft_transcendence project using Docker.

.PHONY: all build up down logs

all: build up

build:
	docker-compose up --build -d

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f