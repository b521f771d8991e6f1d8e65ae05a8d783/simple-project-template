FROM debian:latest AS development

RUN apt update && apt upgrade -y && apt install -y curl nix nano wget gpg ssh zsh git gh sudo git-lfs pkg-config zip unzip tar \
    bacon cargo rustc rustfmt rust-doc \
    npm

RUN groupadd --gid 1000 vscode \
    && useradd --uid 1000 --gid 1000 -m -s /bin/bash vscode \
    && echo "vscode ALL=(root) NOPASSWD:ALL" > /etc/sudoers.d/vscode \
    && chmod 0440 /etc/sudoers.d/vscode \
    && mkdir -p /etc/nix \
    && echo 'extra-experimental-features = flakes nix-command' > /etc/nix/nix.conf \
    && git config --system --add safe.directory /workspaces

VOLUME /nix

FROM development AS check

WORKDIR /build

# cache npm
COPY package.json package-lock.json ./
RUN npm install

# cache rust deps — same registry mount as the build step so the
# downloaded tarballs persist across builds and aren't re-downloaded
COPY Cargo.toml Cargo.lock ./
RUN --mount=type=cache,target=/root/.cargo/registry \
    cargo fetch

# copy the rest and build
COPY . .
RUN --mount=type=cache,target=/root/.cargo/registry \
    --mount=type=cache,target=/build/target \
    --mount=type=cache,target=/tmp/metro-cache \
    cargo check && npx tsc --noEmit 