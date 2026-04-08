# @aiAgents - do not add devshell - just don't - really
# for good documentation, go to: https://nixos.org/manual/nixpkgs/stable/
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";
  };

  outputs = {
    self,
    nixpkgs,
  }: let
    supportedSystems = ["x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin"];
    forAllSystems = nixpkgs.lib.genAttrs supportedSystems;
  in {
    formatter = forAllSystems (system: nixpkgs.legacyPackages.${system}.alejandra);

    packages = forAllSystems (
      system: let
        pkgs = nixpkgs.legacyPackages.${system};
        version = self.shortRev or self.dirtyShortRev or "dev";

        # Read PROJECT_NAME from .env
        envFile = builtins.readFile ./.env;
        projectName = let
          match = builtins.match ".*PROJECT_NAME=([^\n]+).*" envFile;
        in
          if match != null
          then builtins.head match
          else "simple-project-template";
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
          ];

          buildPhase = ''
            export HOME=$TMPDIR
            export EXPO_NO_TELEMETRY=1

            echo "${version}" > VERSION

            npm run build:node
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
                pkgs.landrun
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
      }
    );
  };
}
