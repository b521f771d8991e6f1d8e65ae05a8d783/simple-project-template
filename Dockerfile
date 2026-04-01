FROM docker.io/alpine:latest AS development

RUN apk update && apk add nix curl wget alpine-sdk cmake ninja-build cargo rust npm

WORKDIR /workspaces