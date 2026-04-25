{
  description = "labmtl Assets Processing Environment";

  inputs = {
    labmtl-env.url = "github:labmtl/env";
    nixpkgs.follows = "labmtl-env/nixpkgs";
    flake-utils.follows = "labmtl-env/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, labmtl-env }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; config.allowUnfree = true; };
        envLib = labmtl-env.lib.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = envLib.pkgsGroup.core 
            ++ envLib.pkgsGroup.runtime
            ++ envLib.pkgsGroup.cicd
            ++ [
              pkgs.ffmpeg
              pkgs.imagemagick
              pkgs.exiftool
              pkgs.python311Packages.requests
            ];

          shellHook = envLib.shellUtils + envLib.sopsHook + ''
            # Load SOPS encrypted .env if it exists
            if [ -f .env ]; then
              log_interactive "\033[1;34mLoading SOPS encrypted .env...\033[0m"
              export $(sops -d .env | grep -v '^#' | xargs)
            fi
            log_interactive "\033[1;32mAssets Environment Loaded\033[0m"
          '';
        };
      }
    );
}
