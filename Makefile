.PHONY: all
default: all;

all: docker_build docker_run

docker_build:
	docker build \
	--platform=linux/arm/v7 \
	-t wb-rules-armhf \
	.

docker_run:
	docker run \
	--platform=linux/arm/v7 \
	--env WB_RULES_MODULES=/etc/wb-rules-modules \
	--rm \
	-it \
	wb-rules-armhf
