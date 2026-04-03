# @aiAgents - do not add devshell - just don't - really
# for good documentation, go to: https://nixos.org/manual/nixpkgs/stable/
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";
    rust-overlay.url = "github:oxalica/rust-overlay";
    rust-overlay.inputs.nixpkgs.follows = "nixpkgs";
    crane.url = "github:ipetkov/crane";
  };

  outputs = { self, nixpkgs, rust-overlay, crane }:
    let
      supportedSystems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forAllSystems = nixpkgs.lib.genAttrs supportedSystems;
    in
    {
      packages = forAllSystems (system:
        let
          pkgs = import nixpkgs {
            inherit system;
            overlays = [ rust-overlay.overlays.default ];
          };
          version = self.shortRev or self.dirtyShortRev or "dev";

          # Rust toolchain with musl (static binaries) and WASM targets
          rustToolchain = pkgs.rust-bin.stable.latest.default.override {
            targets = [
              "x86_64-unknown-linux-musl"
              "aarch64-unknown-linux-musl"
              "wasm32-unknown-unknown"
            ];
          };

          craneLib = (crane.mkLib pkgs).overrideToolchain rustToolchain;

          # Read PROJECT_NAME from .env
          envFile = builtins.readFile ./.env;
          projectName = let
            match = builtins.match ".*PROJECT_NAME=([^\n]+).*" envFile;
          in if match != null then builtins.head match else "simple-project-template";
        in
        rec {
          # do not add more targets, use this to build everything
          default = pkgs.buildNpmPackage {
            pname = projectName;
            inherit version;

            src = ./.;

            npmDeps = pkgs.importNpmLock { npmRoot = ./.; };
            npmConfigHook = pkgs.importNpmLock.npmConfigHook;

            nativeBuildInputs = with pkgs; [
              git
            ];

            buildPhase = ''
              export HOME=$TMPDIR
              export EXPO_NO_TELEMETRY=1

              echo "${version}" > VERSION

              npm run build:node
            '';

            installPhase = ''
              mkdir -p $out/bin
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
        }
      );
    };
}
