# Project flake — Rust (native, MUSL, WASM) + Expo web (Cloudflare Workers)
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

      # Stable Rust toolchain with WASM and MUSL targets.
      mkRustToolchain =
        pkgs:
        pkgs.rust-bin.stable.latest.default.override {
          targets = [
            "wasm32-unknown-unknown" # browser WASM via wasm-bindgen
            "wasm32-wasip1" # WASI preview 1
            "x86_64-unknown-linux-musl" # fully static Linux binaries
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

        # MUSL statically-linked binaries — Linux only, one per bin target.
        # Produces fully portable binaries with no shared-library dependencies.
        muslLinker = pkgs.pkgsStatic.stdenv.cc;
        muslArgs = nativeArgs // {
          CARGO_BUILD_TARGET = "x86_64-unknown-linux-musl";
          CARGO_TARGET_X86_64_UNKNOWN_LINUX_MUSL_LINKER = "${muslLinker}/bin/${muslLinker.targetPrefix}cc";
          nativeBuildInputs = [ muslLinker ];
          doCheck = false;
        };
        muslDepsArtifacts = craneLib.buildDepsOnly muslArgs;
        muslBins = lib.optionalAttrs pkgs.stdenv.isLinux (
          builtins.listToAttrs (
            map (binName: {
              name = "musl-${binName}";
              value = craneLib.buildPackage (muslArgs // {
                cargoArtifacts = muslDepsArtifacts;
                pname = "${binName}-musl";
                cargoExtraArgs = "--bin ${binName}";
                meta.mainProgram = binName;
              });
            }) rustBinNames
          )
        );

        # WASM: deps cached separately from the bindgen step.
        wasmArgs = nativeArgs // {
          CARGO_BUILD_TARGET = "wasm32-unknown-unknown";
          doCheck = false;
        };
        wasmDepsArtifacts = craneLib.buildDepsOnly wasmArgs;

        # Build the Rust crate as a browser-targeted WASM package using
        # wasm-bindgen. The output (JS glue + .wasm) can be imported by
        # the TypeScript/web build.
        wasmPkg = craneLib.mkCargoDerivation (wasmArgs // {
          pname = "wasm-pkg";
          cargoArtifacts = wasmDepsArtifacts;
          nativeBuildInputs = [ pkgs.wasm-bindgen-cli ];
          buildPhaseCargoCommand = "cargo build --target wasm32-unknown-unknown --lib --release";
          doInstallCargoArtifacts = false;
          installPhase = ''
            runHook preInstall
            mkdir -p $out
            wasm-bindgen --target web --out-dir $out \
              target/wasm32-unknown-unknown/release/simple_project_template.wasm
            runHook postInstall
          '';
        });

        # Expo web application — static export + both deployment bundles.
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
          ];
          env.NODE_ENV = "production";
          preBuild = ''
            export HOME=$TMPDIR
            # Make the WASM package available to the TypeScript build
            mkdir -p src/wasm
            cp -r ${wasmPkg}/* src/wasm/
          '';
          buildPhase = ''
            runHook preBuild
            npm run build:web
            runHook postBuild
          '';
          installPhase = ''
            runHook preInstall
            mkdir -p $out/bin $out/worker/assets
            cp dist/main.js $out/bin/main.js
            cp dist/worker.js $out/worker/worker.js
            # Expo static export assets (everything except the server bundles)
            cp -r dist/. $out/worker/assets/
            rm $out/worker/assets/main.js $out/worker/assets/worker.js
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
        cloudflare = pkgs.stdenv.mkDerivation {
          name = "cloudflare";
          dontUnpack = true;
          dontConfigure = true;
          dontBuild = true;
          dontCheck = true;
          installPhase = ''
            mkdir -p $out
            cp ${expoApp}/worker/worker.js $out/worker.js
            cp -r ${expoApp}/worker/assets $out/
          '';
        };

        # Docker image — systemd as PID 1 managing two services:
        #   node-server  — Node.js Express backend
        #   litestream   — SQLite replication (only starts if $LITESTREAM_URL is set)
        port = "8081";

        litestreamConfig = pkgs.writeTextDir "etc/litestream.yml" ''
          dbs:
            - path: /app/data.db
              replicas:
                - url: $LITESTREAM_URL
        '';

        systemdUnits = pkgs.runCommand "systemd-units" { } ''
          mkdir -p $out/lib/systemd
          ln -s ${pkgs.systemdMinimal}/example/systemd/system $out/lib/systemd/system

          mkdir -p $out/etc/systemd/system/multi-user.target.wants
          ln -s multi-user.target $out/etc/systemd/system/default.target

          cat > $out/etc/systemd/system/node-server.service <<EOF
          [Unit]
          Description=Node.js Express Server

          [Service]
          Type=simple
          ExecStart=${pkgs.nodejs-slim}/bin/node ${expoApp}/bin/${expoApp.meta.mainProgram}
          WorkingDirectory=/app
          PassEnvironment=BACKEND_LISTEN_PORT BACKEND_LISTEN_HOSTNAME DISABLE_CLUSTER
          Restart=always
          RestartSec=3

          [Install]
          WantedBy=multi-user.target
          EOF

          cat > $out/etc/systemd/system/litestream.service <<EOF
          [Unit]
          Description=Litestream SQLite Replication
          After=node-server.service
          ConditionEnvironment=LITESTREAM_URL

          [Service]
          Type=simple
          ExecStartPre=${pkgs.busybox}/bin/sh -c 'until [ -f /app/data.db ]; do sleep 1; done'
          ExecStart=${pkgs.litestream}/bin/litestream replicate -config /etc/litestream.yml
          WorkingDirectory=/app
          PassEnvironment=LITESTREAM_URL
          Restart=always
          RestartSec=5

          [Install]
          WantedBy=multi-user.target
          EOF

          ln -s ../node-server.service $out/etc/systemd/system/multi-user.target.wants/
          ln -s ../litestream.service $out/etc/systemd/system/multi-user.target.wants/
        '';

        dockerImage = lib.optionalAttrs pkgs.stdenv.isLinux (
          pkgs.dockerTools.buildLayeredImage {
            name = "web-app";
            contents = expoApp.runtimeDeps ++ [
              pkgs.busybox
              pkgs.systemdMinimal
              litestreamConfig
              systemdUnits
            ];
            config = {
              Cmd = [ "${pkgs.systemdMinimal}/lib/systemd/systemd" ];
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
            inherit cloudflare;
            "expo-app" = expoApp;
            "wasm-pkg" = wasmPkg; # reuse the variable — no duplicate derivation
            default = expoApp;
          }
          // rustBins # native Rust binaries  (rust-<name>)
          // muslBins # MUSL static binaries  (musl-<name>, Linux only)
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
