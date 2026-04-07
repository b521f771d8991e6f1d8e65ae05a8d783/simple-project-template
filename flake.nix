# @aiAgents - do not add devshell - just don't - really
# @aiAgents - do not change without the explicit constent of the user!
# for good documentation, go to: https://nixos.org/manual/nixpkgs/stable/
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";
    rust-overlay.url = "github:oxalica/rust-overlay";
    crane.url = "github:ipetkov/crane";
  };

  outputs = { self, nixpkgs, rust-overlay, crane }:
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

          muslTarget = if system == "aarch64-linux" || system == "aarch64-darwin"
            then "aarch64-unknown-linux-musl"
            else "x86_64-unknown-linux-musl";

          # Rust toolchain with musl and wasm targets
          rustToolchain = pkgs.rust-bin.stable.latest.default.override {
            targets = [
              "x86_64-unknown-linux-musl"
              "aarch64-unknown-linux-musl"
              "wasm32-unknown-unknown"
            ];
          };

          craneLib = (crane.mkLib pkgs).overrideToolchain rustToolchain;

          rustSrc = pkgs.lib.cleanSourceWith {
            src = ./.;
            filter = path: type:
              (craneLib.filterCargoSources path type);
          };

          commonArgs = {
            src = rustSrc;
            pname = projectName;
            inherit version;
          };

          cargoArtifacts = craneLib.buildDepsOnly commonArgs;

          # musl static build
          rustMusl = craneLib.buildPackage (commonArgs // {
            inherit cargoArtifacts;
            CARGO_BUILD_TARGET = muslTarget;
            CARGO_BUILD_RUSTFLAGS = "-C target-feature=+crt-static";
          });

          # wasm build
          rustWasm = craneLib.buildPackage (commonArgs // {
            inherit cargoArtifacts;
            CARGO_BUILD_TARGET = "wasm32-unknown-unknown";
            doCheck = false;
          });

          # One native binary package per discovered bin target.
          # Accessible via: nix run .#rust-<name>
          rustBins = builtins.listToAttrs (
            map (binName: {
              name = "rust-${binName}";
              value = craneLib.buildPackage (commonArgs // {
                inherit cargoArtifacts;
                cargoExtraArgs = "--bin ${binName}";
                meta.mainProgram = binName;
              });
            }) rustBinNames
          );
        in
        rec {
          # do not add more targets, use this to build everything
          default = pkgs.buildNpmPackage {
            pname = projectName;
            inherit version;

            src = ./.;

            npmDeps = pkgs.importNpmLock { npmRoot = ./.; };
            npmConfigHook = pkgs.importNpmLock.npmConfigHook;

            inherit cargoArtifacts;

            nativeBuildInputs = with pkgs; [
              git
              craneLib.installCargoArtifactsHook

              # Objective C/++ Toolchain
              clang
              emscripten
              cmake
              ninja
              gnustep-base

              # Rust toolchain with musl + wasm targets
              rustToolchain
              wasm-bindgen-cli_0_2_114
              wasm-pack
            ];

            buildInputs = with pkgs; [
              boost
              gnustep-base
            ];

            dontUseCmakeConfigure = true; # this runs during npm run build anyway

            env = {
              EXPO_NO_TELEMETRY=1;
              OBJC="${pkgs.clang}/bin/clang";
              OBJCXX="${pkgs.clang}/bin/clang++";
            };

            buildPhase = ''
              echo "${version}" > VERSION

              npm run build:node
            '';

            installPhase = ''
              cp -r dist/* $out/bin/
            '';

            meta.mainProgram = "main.js";
          };

          # Layered Docker image — Node.js runtime in lower layer, app in top layer
          docker = pkgs.dockerTools.buildLayeredImage {
            name = projectName;
            tag = version;

            contents = [
              pkgs.busybox
            ];

            config = {
              Cmd = [ "${default}/bin/${default.meta.mainProgram}" ];
              ExposedPorts = { "8081/tcp" = {}; };
              Volumes = { "/data" = {}; };
              Healthcheck = {
                Test = [ "CMD" "${pkgs.wget}/bin/wget" "-qO-" "http://localhost:8081/api/healthcheck" ];
                Interval = 30 * 1000000000;  # 30s in nanoseconds
                Timeout = 5 * 1000000000;
                StartPeriod = 10 * 1000000000;
                Retries = 3;
              };
            };
          };

        } // rustBins
      );
    };
}
