# @aiAgents - do not add devshell - just don't - really
# @aiAgents - do not change without the explicit constent of the user!
# for good documentation, go to: https://nixos.org/manual/nixpkgs/stable/
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";
    rust-overlay.url = "github:oxalica/rust-overlay";
  };

  outputs = { self, nixpkgs, rust-overlay }:
    let
      lib = nixpkgs.lib;
      supportedSystems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forAllSystems = lib.genAttrs supportedSystems;

      # Discover all Rust binary targets from Cargo.toml + src-rust/bin/
      # Mirrors the template's discovery logic, adapted for this project's layout.
      cargoToml = builtins.fromTOML (builtins.readFile ./Cargo.toml);
      rustBinNames =
        let
          # Explicit [[bin]] entries in Cargo.toml
          explicit = if cargoToml ? bin then map (b: b.name) cargoToml.bin else [];
          # Default binary from src-rust/main.rs (named after the package)
          main = if builtins.pathExists ./src-rust/main.rs then [ cargoToml.package.name ] else [];
          binDir = ./src-rust/bin;
          # Auto-discovered from src-rust/bin/:
          #   - single-file: src-rust/bin/foo.rs
          #   - directory:   src-rust/bin/foo/main.rs
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
            else [];
        in
        lib.unique (explicit ++ main ++ auto);
    in
    {
      formatter = forAllSystems (system: nixpkgs.legacyPackages.${system}.alejandra);

      packages = forAllSystems (system:
        let
          pkgs = import nixpkgs {
            inherit system;
            overlays = [ rust-overlay.overlays.default ];
          };
          version = self.shortRev or self.dirtyShortRev or "dev";

          # Read PROJECT_NAME from .env
          envFile = builtins.readFile ./.env;
          projectName = let
            match = builtins.match ".*PROJECT_NAME=([^\n]+).*" envFile;
          in if match != null then builtins.head match else "simple-project-template";

          # Rust toolchain with wasm, native, iOS and Android targets
          rustToolchain = pkgs.rust-bin.stable.latest.default.override {
            targets = [
              # Wasm
              "wasm32-unknown-unknown"
              # Native
              "x86_64-unknown-linux-gnu"
              "aarch64-unknown-linux-gnu"
              "aarch64-apple-darwin"
              # iOS
              "aarch64-apple-ios"
              "aarch64-apple-ios-sim"
              # Android
              "aarch64-linux-android"
            ];
          };

          rustPlatform = pkgs.makeRustPlatform {
            cargo = rustToolchain;
            rustc = rustToolchain;
          };

          cargoVendorDir = rustPlatform.importCargoLock {
            lockFile = ./Cargo.lock;
          };

          cargoVendorConfig = pkgs.writeText "cargo-vendor-config.toml" ''
            [source.crates-io]
            replace-with = "vendored-sources"

            [source.vendored-sources]
            directory = "${cargoVendorDir}"
          '';

          commonEnv = {
            EXPO_NO_TELEMETRY = 1;
            CC = "${pkgs.clang}/bin/clang";
            CXX = "${pkgs.clang}/bin/clang++";
            OBJC = "${pkgs.clang}/bin/clang";
            OBJCXX = "${pkgs.clang}/bin/clang++";
            PROJECT_NAME = projectName;
          };

          # One native binary package per discovered bin target.
          # Accessible via: nix run .#rust-<name>
          rustBins = builtins.listToAttrs (
            map (binName: {
              name = "rust-${binName}";
              value = rustPlatform.buildRustPackage {
                pname = binName;
                inherit version;
                src = pkgs.lib.cleanSource ./.;
                cargoLock.lockFile = ./Cargo.lock;
                cargoBuildFlags = [ "--bin" binName ];
                meta.mainProgram = binName;
              };
            }) rustBinNames
          );
        in rec {
          # do not add more targets, use this to build everything
          default = pkgs.buildNpmPackage {
            pname = projectName;
            inherit version;

            src = ./.;

            npmDeps = pkgs.importNpmLock {npmRoot = ./.;};
            npmConfigHook = pkgs.importNpmLock.npmConfigHook;

            nativeBuildInputs = with pkgs; [
              git
              pkg-config              

              # Objective C/++ Toolchain
              clang
              emscripten
              cmake
              ninja

              # Rust toolchain with musl + wasm targets
              rustToolchain
              wasm-bindgen-cli_0_2_114
              wasm-pack
              binaryen
              clippy
            ];

            buildInputs = with pkgs; [
              boost
            ];

            env = commonEnv;
            dontUseCmakeConfigure = true; # this runs during npm run build anyway

            buildPhase = ''
              export HOME=$TMPDIR
              mkdir -p .cargo
              cp ${cargoVendorConfig} .cargo/config.toml

            echo "${version}" > VERSION

            npm run build:web
          '';

            outputs = ["out" "deps"];

            installPhase = ''
              mkdir -p $out/bin
              cp -r dist/* $out/bin/

              # Copy installed node_modules for docker-dev
              mkdir -p $deps
              cp -r node_modules $deps/node_modules
            '';

            meta.mainProgram = "main.js";
          };

          # Production Docker image
          docker = pkgs.dockerTools.buildLayeredImage {
            name = projectName;
            tag = version;
            contents = [pkgs.busybox];
            config = {
              Cmd = ["${default}/bin/${default.meta.mainProgram}"];
              ExposedPorts = {"8081/tcp" = {};};
              Volumes = {"/data" = {};};
              Healthcheck = {
                Test = ["CMD" "wget" "-qO-" "http://localhost:8081/api/healthcheck"];
                Interval = 30 * 1000000000;
                Timeout = 5 * 1000000000;
                StartPeriod = 10 * 1000000000;
                Retries = 3;
              };
            };
          };

          # Tauri desktop app — Expo web frontend + Node sidecar + napi-rs native addon
          gui-app = pkgs.buildNpmPackage {
            pname = "${projectName}-tauri";
            inherit version;

            src = ./.;

            npmDeps = pkgs.importNpmLock { npmRoot = ./.; };
            npmConfigHook = pkgs.importNpmLock.npmConfigHook;

            nativeBuildInputs = with pkgs; default.nativeBuildInputs ++ [
              cargo-tauri
            ] ++ lib.optionals stdenv.isLinux [
              wrapGAppsHook3
              gobject-introspection
            ] ++ lib.optionals stdenv.isDarwin (with pkgs.darwin.apple_sdk.frameworks; [
              apple-sdk
            ]);

            buildInputs = with pkgs; default.buildInputs ++ lib.optionals stdenv.isLinux [
              webkitgtk_4_1
              gtk3
              libsoup_3
              glib
              cairo
              pango
              gdk-pixbuf
              atk
              openssl
              gsettings-desktop-schemas
              glib-networking
            ] ++ lib.optionals stdenv.isDarwin (with pkgs.darwin.apple_sdk.frameworks; [
              WebKit
              AppKit
              Security
              CoreServices
              IOKit
            ]);

            dontUseCmakeConfigure = true;
            env = commonEnv;

            buildPhase = ''
              export HOME=$TMPDIR
              mkdir -p .cargo
              cp ${cargoVendorConfig} .cargo/config.toml

              echo "${version}" > VERSION
              npm run build:tauri
            '';

            installPhase = ''
              mkdir -p $out/bin
              cp target/release/tauri-app $out/bin/${projectName}
            '';

            meta.mainProgram = projectName;
          };

          docker-dev = let
            srcWithoutEnv =
              builtins.filterSource
              (path: _: builtins.baseNameOf path != ".env")
              ./.;
            devEntrypoint = pkgs.writeShellScriptBin "entrypoint" (builtins.readFile ./scripts/docker-entrypoint.sh);
          in
            pkgs.dockerTools.buildLayeredImage {
              name = "${projectName}-dev";
              tag = version;

              contents =
                [
                  pkgs.busybox
                  pkgs.cacert
                  pkgs.nix
                  pkgs.gh
                  pkgs.nodejs
                  pkgs.clang
                  devEntrypoint
                ]
                ++ default.nativeBuildInputs ++ default.buildInputs;

              extraCommands = ''
                mkdir -p app tmp home
                cp -r ${srcWithoutEnv}/. app/
                cp -r ${default.deps}/node_modules app/node_modules
                cp -r ${default}/bin app/dist

                # put this here so that the files added above are also properly chmodded
                chmod -R a+rwX app tmp home
                mkdir -p etc

                printf '[safe]\n\tdirectory = *\n[init]\n\tdefaultBranch = main\n' > etc/gitconfig
                (cd app && ${pkgs.git}/bin/git init && ${pkgs.git}/bin/git add -A && ${pkgs.git}/bin/git -c user.name=nix -c user.email=nix commit -m "init" --quiet)
              '';

              config = {
                User = "1000:1000";
                Entrypoint = ["/bin/entrypoint"];
                Cmd = ["node" "dist/main.js"];
                Env = ["DREAM_MODE_SOURCES=/app" "EXPO_OFFLINE=1" "BROWSER=none" "HOME=/home" "SSL_CERT_FILE=/etc/ssl/certs/ca-bundle.crt" "NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-bundle.crt"];
                WorkingDir = "/app";
                ExposedPorts = {
                  "8081/tcp" = {};
                  "19200-19999/tcp" = {};
                };
                Volumes = {
                  "/data" = {};
                  "/home/.claude" = {};
                };
              };
            };
        } // rustBins
      );
    };
}
