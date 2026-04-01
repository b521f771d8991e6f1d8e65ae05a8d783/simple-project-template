# Project flake — Rust (native, WASM) + Expo web (Cloudflare Workers)
#
# Nix reference: https://nixos.org/manual/nixpkgs/stable/
{
  # ── Flake inputs (pinned dependency sources) ────────────────────────
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";
    flake-utils.url = "github:numtide/flake-utils"; # helpers for multi-system boilerplate
    rust-overlay.url = "github:oxalica/rust-overlay"; # provides specific Rust toolchains via overlay
    rust-overlay.inputs.nixpkgs.follows = "nixpkgs"; # ensure rust-overlay uses our pinned nixpkgs
    crane.url = "github:ipetkov/crane"; # incremental Rust builds (deps cached separately)
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
      rust-overlay,
      crane,
    }:
    let
      lib = nixpkgs.lib;
      supportedSystems = with flake-utils.lib.system; [
        x86_64-linux
        aarch64-linux
        x86_64-darwin
        aarch64-darwin
      ];

      # ── Rust binary discovery ─────────────────────────────────────
      # Automatically discovers all Rust binary targets so we don't
      # have to maintain a manual list. Mirrors Cargo's own discovery:
      #   1. Explicit [[bin]] entries in Cargo.toml
      #   2. src-rust/main.rs  (uses the package name)
      #   3. src-rust/bin/*.rs  and  src-rust/bin/*/main.rs
      cargoToml = builtins.fromTOML (builtins.readFile ./Cargo.toml);
      rustBinNames =
        let
          explicit = if cargoToml ? bin then map (b: b.name) cargoToml.bin else [ ];
          main = if builtins.pathExists ./src-rust/main.rs then [ cargoToml.package.name ] else [ ];
          binDir = ./src-rust/bin;
          auto =
            if builtins.pathExists binDir then
              let
                entries = builtins.readDir binDir;
                names = builtins.attrNames entries;
              in
              (map (n: lib.removeSuffix ".rs" n) (
                builtins.filter (n: entries.${n} == "regular" && lib.hasSuffix ".rs" n) names
              ))
              ++ (builtins.filter (
                n: entries.${n} == "directory" && builtins.pathExists (binDir + "/${n}/main.rs")
              ) names)
            else
              [ ];
        in
        lib.unique (explicit ++ main ++ auto);

      # ── Helper functions ────────────────────────────────────────

      # Instantiate nixpkgs for a given system with the Rust overlay applied.
      mkPkgs =
        system:
        import nixpkgs {
          inherit system;
          overlays = [ rust-overlay.overlays.default ];
          config.allowUnfree = false;
        };

      # Stable Rust toolchain with WASM targets.
      mkRustToolchain =
        pkgs:
        pkgs.rust-bin.stable.latest.default.override {
          targets = [
            "wasm32-unknown-unknown" # browser WASM via wasm-bindgen
            "wasm32-wasip1" # WASI preview 1
          ];
        };
    in
    # ── Per-system outputs ──────────────────────────────────────────
    flake-utils.lib.eachSystem supportedSystems (
      system:
      let
        pkgs = mkPkgs system;
        rustToolchain = mkRustToolchain pkgs;

        # Shared crane library — all Rust builds use this so the toolchain
        # is instantiated once and dependencies are cached across derivations.
        craneLib = (crane.mkLib pkgs).overrideToolchain rustToolchain;

        # Clean source: only git-tracked files (excludes target/, node_modules/, result, etc.)
        src = lib.fileset.toSource {
          root = ./.;
          fileset = lib.fileset.gitTracked ./.;
        };

        # ── Development tools ──────────────────────────────────────
        devTools =
          with pkgs;
          [
            git
            pkg-config
            zsh
            rustToolchain
            bacon
            wasm-pack
            wasm-bindgen-cli
            nodejs
          ];

        # ── Rust build helpers ─────────────────────────────────────

        # Args shared by all native (host) Rust derivations.
        nativeArgs = {
          inherit src;
          strictDeps = true;
        };

        # Build dependencies once; every native bin derivation reuses these
        # artifacts so that a single source change only recompiles app code.
        nativeDepsArtifacts = craneLib.buildDepsOnly nativeArgs;

        # ── Package derivations ───────────────────────────────────

        # Native Rust binaries (one per discovered bin target, prefixed "rust-")
        rustBins = builtins.listToAttrs (
          map (binName: {
            name = "rust-${binName}";
            value = craneLib.buildPackage (nativeArgs // {
              cargoArtifacts = nativeDepsArtifacts;
              cargoExtraArgs = "--bin ${binName}";
              meta.mainProgram = binName;
            });
          }) rustBinNames
        );

        # Vendored cargo deps — enables offline cargo builds inside buildNpmPackage.
        cargoVendorDir = craneLib.vendorCargoDeps { cargoLock = ./Cargo.lock; };

        # Expo web application — integrated Rust (WASM) + TypeScript build.
        # Uses npm scripts build:node and build:cloudflare-worker-worker which
        # invoke cargo internally (with vendored deps for nix sandbox).
        # Outputs:
        #   $out/bin/main.js    — Node.js server (for Docker)
        #   $out/worker/worker.js — esbuild CF Worker bundle
        #   $out/worker/assets/ — Expo static web export
        expoApp = pkgs.buildNpmPackage {
          pname = "expo-app";
          version = "0.0.0";
          inherit src;
          npmDeps = pkgs.importNpmLock { npmRoot = ./.; };
          npmConfigHook = pkgs.importNpmLock.npmConfigHook;
          nativeBuildInputs = with pkgs; [
            removeReferencesTo
            rustToolchain
            wasm-bindgen-cli
          ];
          env.NODE_ENV = "production";
          preBuild = ''
            export HOME=$TMPDIR
            # Use crane's vendored deps config (no network in nix sandbox)
            mkdir -p .cargo
            cp ${cargoVendorDir}/config.toml .cargo/config.toml
          '';
          buildPhase = ''
            runHook preBuild
            npm run build:node
            runHook postBuild
          '';
          installPhase = ''
            runHook preInstall
            mkdir -p $out/bin $out/assets
            cp dist/main.js $out/bin/main.js
            # Expo static export assets (everything except the server bundle)
            cp -r dist/. $out/assets/
            rm $out/assets/main.js
            runHook postInstall
          '';
          passthru.runtimeDeps = with pkgs; [
            nodejs-slim
            litestream
          ];
          meta.mainProgram = "main.js";
        };

        # Cloudflare deployment artifact: matches wrangler.jsonc layout
        #   result/worker.js      ← main
        #   result/assets/        ← assets.directory
        cloudflare-worker = pkgs.buildNpmPackage {
          pname = "cloudflare-worker";
          version = "0.0.0";
          inherit src;
          npmDeps = pkgs.importNpmLock { npmRoot = ./.; };
          npmConfigHook = pkgs.importNpmLock.npmConfigHook;
          nativeBuildInputs = with pkgs; [
            rustToolchain
            wasm-bindgen-cli
          ];
          env.NODE_ENV = "production";
          preBuild = ''
            export HOME=$TMPDIR
            # Use crane's vendored deps config (no network in nix sandbox)
            mkdir -p .cargo
            cp ${cargoVendorDir}/config.toml .cargo/config.toml
          '';
          buildPhase = ''
            runHook preBuild
            npm run build:cloudflare-worker-worker
            runHook postBuild
          '';
          installPhase = ''
            runHook preInstall
            mkdir -p $out
            cp dist/worker.js $out/worker.js
            cp -r dist/. $out/assets/
            rm $out/assets/worker.js
            runHook postInstall
          '';
        };

        # Docker image — s6 supervised Node.js server + optional Litestream
        port = "8081";

        # s6 service directories
        s6Services = pkgs.runCommand "s6-services" { } ''
          # Node.js server — always supervised
          mkdir -p $out/etc/s6/node-server
          cat > $out/etc/s6/node-server/run <<EOF
          #!/bin/sh
          exec ${pkgs.nodejs-slim}/bin/node ${expoApp}/bin/${expoApp.meta.mainProgram}
          EOF
          chmod +x $out/etc/s6/node-server/run

          # Litestream — only starts if LITESTREAM_URL is set
          mkdir -p $out/etc/s6/litestream
          cat > $out/etc/s6/litestream/run <<EOF
          #!/bin/sh
          if [ -z "\$LITESTREAM_URL" ]; then exec sleep infinity; fi
          while [ ! -f /app/data.db ]; do sleep 1; done
          exec ${pkgs.litestream}/bin/litestream replicate -config /etc/litestream.yml
          EOF
          chmod +x $out/etc/s6/litestream/run
        '';

        litestreamConfig = pkgs.writeTextDir "etc/litestream.yml" ''
          dbs:
            - path: /app/data.db
              replicas:
                - url: $LITESTREAM_URL
        '';

        # Entrypoint: s6-svscan supervises all services
        entrypoint = pkgs.writeScript "entrypoint.sh" ''
          #!/bin/sh
          exec ${pkgs.s6}/bin/s6-svscan /etc/s6
        '';

        dockerImage = lib.optionalAttrs pkgs.stdenv.isLinux (
          pkgs.dockerTools.buildLayeredImage {
            name = "web-app";
            contents = expoApp.runtimeDeps ++ [
              pkgs.busybox
              pkgs.s6
              s6Services
              litestreamConfig
            ];
            config = {
              Cmd = [ "${entrypoint}" ];
              WorkingDir = "/app";
              Env = [
                "BACKEND_LISTEN_PORT=${port}"
                "BACKEND_LISTEN_HOSTNAME=0.0.0.0"
              ];
              ExposedPorts.${port} = { };
              Volumes."/app" = { };
            };
          }
        );

      in
      let
        allPackages =
          {
            inherit cloudflare-worker;
            "expo-app" = expoApp;
            default = expoApp;
          }
          // rustBins # native Rust binaries  (rust-<name>)
          // lib.optionalAttrs pkgs.stdenv.isLinux { "docker-image" = dockerImage; };
      in
      {
        # ── Exported packages ──────────────────────────────────────
        # Build with: nix build .#<name>   (e.g. nix build .#wasm-pkg)
        packages = allPackages;

        # `nix flake check` builds every package except "default" (alias).
        checks = builtins.removeAttrs allPackages [ "default" ];

        # ── Development shell ──────────────────────────────────────
        # Enter with: nix develop
        devShells.default = pkgs.mkShell {
          packages = devTools;
        };

        formatter = pkgs.nixfmt-tree; # `nix fmt` uses nixfmt-tree
      }
    );
}
