{
  description = "Playwright dev environment with Chromium dependencies";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
  }:
    flake-utils.lib.eachDefaultSystem (
      system: let
        pkgs = nixpkgs.legacyPackages.${system};
      in {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_20
            nodePackages.pnpm

            alsa-lib
            at-spi2-atk
            cups
            curl
            dbus
            expat
            fontconfig
            freetype
            libgbm
            glibc
            libdrm
            libxkbcommon
            mesa
            nspr
            nss
            pipewire
            stdenv.cc.cc
            systemd
            xorg.libX11
            xorg.libXcomposite
            xorg.libXdamage
            xorg.libXext
            xorg.libXfixes
            xorg.libXrandr
            xorg.libxcb
            xorg.libxshmfence
          ];

          shellHook = ''
            export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true
            export PLAYWRIGHT_BROWSERS_PATH="$PWD/playwright"

            echo "Environment is ready. All dependencies loaded."

            mkdir -p "$PLAYWRIGHT_BROWSERS_PATH"

            echo "Ensuring Playwright browsers are installed..."
            npx playwright install chromium
            echo "Environment is ready."
          '';
        };
      }
    );
}
