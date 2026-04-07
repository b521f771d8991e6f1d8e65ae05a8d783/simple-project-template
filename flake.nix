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

            outputs = [ "out" "dream" ];

            installPhase = ''
              mkdir -p $out/bin
              cp -r dist/* $out/bin/

              # Copy installed node_modules for docker-dream
              mkdir -p $dream
              cp -r node_modules $dream/node_modules
            '';

            meta.mainProgram = "main.js";
          };

          # Production Docker image
          docker = pkgs.dockerTools.buildLayeredImage {
            name = projectName;
            tag = version;
            contents = [ pkgs.busybox ];
            config = {
              Cmd = [ "${default}/bin/${default.meta.mainProgram}" ];
              ExposedPorts = { "8081/tcp" = {}; };
              Volumes = { "/data" = {}; };
              Healthcheck = {
                Test = [ "CMD" "wget" "-qO-" "http://localhost:8081/api/healthcheck" ];
                Interval = 30 * 1000000000;
                Timeout = 5 * 1000000000;
                StartPeriod = 10 * 1000000000;
                Retries = 3;
              };
            };
          };

          # Dream Mode Docker image — full source + node_modules for live development
          docker-dream = pkgs.dockerTools.buildLayeredImage {
            name = "${projectName}-dream";
            tag = version;
            
            contents = [
              pkgs.busybox
              pkgs.nix
              pkgs.gh
            ] ++ default.nativeBuildInputs;

            extraCommands = ''
              mkdir -p app
              cp -r ${./.}/* app/
              cp -r ${default.dream}/node_modules app/node_modules
            '';
            
            config = {
              Cmd = [ "${pkgs.nodejs}/bin/npm" "run" "dev" ];
              Env = [ "APP_MODE=develop" ];
              WorkingDir = "/app";
              ExposedPorts = { "8081/tcp" = {}; };
              Volumes = { "/data" = {}; };
            };
          };
        }
      );
    };
}
