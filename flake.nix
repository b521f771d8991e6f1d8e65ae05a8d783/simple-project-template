# Project flake — Expo web (Cloudflare Workers / Node.js / Docker)
#
# Nix reference: https://nixos.org/manual/nixpkgs/stable/
{
  # ── Flake inputs (pinned dependency sources) ────────────────────────
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    let
      lib = nixpkgs.lib;
      supportedSystems = with flake-utils.lib.system; [
        x86_64-linux
        aarch64-linux
        x86_64-darwin
        aarch64-darwin
      ];

      # Parse .env for the canonical project name (single source of truth).
      envFile = builtins.readFile ./.env;
      envVars = builtins.listToAttrs (
        builtins.concatMap (line:
          let m = builtins.match "([A-Za-z_][A-Za-z0-9_]*)=(.*)" line;
          in if m == null then [ ] else [ { name = builtins.elemAt m 0; value = builtins.elemAt m 1; } ]
        ) (lib.splitString "\n" envFile)
      );
      projectName = envVars.PROJECT_NAME;

      # Version: read from VERSION file (written by CI before nix build).
      # Falls back to flake rev, short rev, or "dev" for local builds.
      projectVersion =
        if builtins.pathExists ./VERSION then
          lib.trim (builtins.readFile ./VERSION)
        else if self ? rev then
          self.shortRev
        else
          "dev";

      mkPkgs =
        system:
        import nixpkgs {
          inherit system;
          config.allowUnfree = false;
        };
    in
    # ── Per-system outputs ──────────────────────────────────────────
    flake-utils.lib.eachSystem supportedSystems (
      system:
      let
        pkgs = mkPkgs system;

        # Clean source: only git-tracked files (excludes node_modules/, result, etc.)
        src = lib.fileset.toSource {
          root = ./.;
          fileset = lib.fileset.gitTracked ./.;
        };

        # ── Development tools ──────────────────────────────────────
        devTools =
          with pkgs;
          [
            git
            zsh
            nodejs
          ];

        # ── Package derivations ───────────────────────────────────

        # Expo web application — TypeScript build.
        expoApp = pkgs.buildNpmPackage {
          pname = projectName;
          version = projectVersion;
          inherit src;
          npmDeps = pkgs.importNpmLock { npmRoot = ./.; };
          npmConfigHook = pkgs.importNpmLock.npmConfigHook;
          nativeBuildInputs = with pkgs; [
            removeReferencesTo
          ];
          env.NODE_ENV = "production";
          env.APP_VERSION = projectVersion;
          preBuild = ''
            export HOME=$TMPDIR
            echo "${projectVersion}" > VERSION
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

        # Cloudflare deployment artifact
        cloudflare-worker = pkgs.buildNpmPackage {
          pname = "${projectName}-cloudflare-worker";
          version = projectVersion;
          inherit src;
          npmDeps = pkgs.importNpmLock { npmRoot = ./.; };
          npmConfigHook = pkgs.importNpmLock.npmConfigHook;
          env.NODE_ENV = "production";
          env.APP_VERSION = projectVersion;
          preBuild = ''
            export HOME=$TMPDIR
            echo "${projectVersion}" > VERSION
          '';
          buildPhase = ''
            runHook preBuild
            npm run build:cloudflare-worker
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

        s6Services = pkgs.runCommand "s6-services" { } ''
          mkdir -p $out/etc/s6/node-server
          cat > $out/etc/s6/node-server/run <<EOF
          #!/bin/sh
          exec ${pkgs.nodejs-slim}/bin/node ${expoApp}/bin/${expoApp.meta.mainProgram}
          EOF
          chmod +x $out/etc/s6/node-server/run

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

        entrypoint = pkgs.writeScript "entrypoint.sh" ''
          #!/bin/sh
          exec ${pkgs.s6}/bin/s6-svscan /etc/s6
        '';

        dockerImage = lib.optionalAttrs pkgs.stdenv.isLinux (
          pkgs.dockerTools.buildLayeredImage {
            name = projectName;
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
            default = expoApp;
          }
          // lib.optionalAttrs pkgs.stdenv.isLinux { "docker-image" = dockerImage; };
      in
      {
        packages = allPackages;
        checks = builtins.removeAttrs allPackages [ "default" ];

        devShells.default = pkgs.mkShell {
          packages = devTools;
        };

        formatter = pkgs.nixfmt-tree;
      }
    );
}
