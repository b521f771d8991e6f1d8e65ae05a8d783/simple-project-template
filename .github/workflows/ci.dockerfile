FROM debian:latest AS development

RUN apt update && apt upgrade -y && apt install -y curl nix nano wget gpg ssh zsh git gh sudo git-lfs pkg-config zip unzip tar \
    bacon cargo rustc rustfmt rust-doc \
    npm

RUN cargo install cargo-chef

RUN groupadd --gid 1000 vscode \
    && useradd --uid 1000 --gid 1000 -m -s /bin/bash vscode \
    && echo "vscode ALL=(root) NOPASSWD:ALL" > /etc/sudoers.d/vscode \
    && chmod 0440 /etc/sudoers.d/vscode \
    && mkdir -p /etc/nix \
    && echo 'extra-experimental-features = flakes nix-command' > /etc/nix/nix.conf \
    && git config --system --add safe.directory /workspaces

VOLUME /nix

FROM development AS planner
WORKDIR /build
COPY Cargo.toml Cargo.lock ./
COPY src-rust src-rust
RUN cargo chef prepare --recipe-path recipe.json

FROM development AS build

WORKDIR /build

# cache npm
COPY package.json package-lock.json ./
RUN npm install

# cache rust deps via cargo-chef
COPY --from=planner /build/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json

# copy the rest and build
COPY . .
RUN cargo build --release && npm run build:web
