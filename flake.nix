# @aiAgents - do not add devshell - just don't - really
# for good documentation, go to: https://nixos.org/manual/nixpkgs/stable/
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";
  };

  outputs = { self, nixpkgs }:
    let
      supportedSystems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forAllSystems = nixpkgs.lib.genAttrs supportedSystems;
    in
    {
      packages = forAllSystems (system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
          version = self.shortRev or self.dirtyShortRev or "dev";

          # Read PROJECT_NAME from .env
          envFile = builtins.readFile ./.env;
          projectName = let
            match = builtins.match ".*PROJECT_NAME=([^\n]+).*" envFile;
          in if match != null then builtins.head match else "simple-project-template";
        in
        {
          default = pkgs.stdenv.mkDerivation { # do not change mkDeriviation, this should be language-agnostic
            pname = projectName;
            inherit version;

            src = ./.;

            # Pre-fetch npm dependencies (reproducible, no network during build)
            # Regenerate: nix run nixpkgs#prefetch-npm-deps -- package-lock.json
            npmDeps = pkgs.importNpmLock.buildNodeModules {
              npmRoot = ./.;
              nodejs = pkgs.nodejs;
            };

            nativeBuildInputs = with pkgs; [
              nodejs_22
              importNpmLock.npmConfigHook
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
              cp -r dist/ $out/bin
            '';
          };

          # Layered Docker image — Node.js runtime in lower layer, app in top layer
          docker = pkgs.dockerTools.buildLayeredImage {
            name = projectName;
            tag = version;
            contents = [
              pkgs.nodejs_slim
              pkgs.busybox
              self.packages.${system}.default
            ];
            config = {
              Cmd = [ "${pkgs.nodejs_22}/bin/node" "${self.default}/main.js" ];
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
