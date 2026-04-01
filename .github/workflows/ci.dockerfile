# syntax=docker/dockerfile:1
FROM docker.io/nixos/nix AS development

RUN echo 'extra-experimental-features = flakes nix-command' >> /etc/nix/nix.conf

# Cache the devshell closure (Rust toolchain, Node.js, esbuild, wasm-bindgen, etc.)
# This layer only rebuilds when flake.nix or flake.lock change.
WORKDIR /workspaces
COPY flake.nix flake.lock Cargo.toml ./
RUN git init && mkdir -p src-rust/bin/hello-world \
    && echo "" > src-rust/lib.rs && echo "fn main(){}" > src-rust/bin/hello-world/main.rs \
    && git add . \
    && nix develop --command true

# All subsequent RUN commands execute inside the devshell
SHELL ["nix", "develop", "--command", "zsh", "-c"]

FROM development AS cache

# Cache Rust dependencies
COPY Cargo.toml Cargo.lock ./
RUN git add . && mkdir -p src-rust && echo "" > src-rust/lib.rs && cargo fetch

# Cache npm dependencies
COPY package.json package-lock.json ./
RUN git add . && npm ci

FROM cache AS build

COPY . .
RUN git add .

# Build WASM package
RUN cargo build --target wasm32-unknown-unknown --lib --release \
    && mkdir -p src/wasm \
    && wasm-bindgen --target web --out-dir src/wasm \
       target/wasm32-unknown-unknown/release/simple_project_template.wasm

# Build Expo web app + server + worker
RUN npm run build:web

# Assemble Cloudflare artifact
RUN mkdir -p /out/assets \
    && cp dist/worker.js /out/worker.js \
    && cp -r dist/. /out/assets/ \
    && rm /out/assets/main.js /out/assets/worker.js

FROM scratch AS artifact
COPY --from=build /out /
