{ lib
, cardano-graphql-src
, runtimeShell
, nodejs
, python
, pkgs ? import ./pkgs.nix
}:

let
  packageJSON = cardano-graphql-src + "/package.json";
  version = (__fromJSON (__readFile packageJSON)).version;
  mkYarnWorkspace = pkgs.yarn2nix-moretea.mkYarnWorkspace;

  src = lib.cleanSourceWith {
    filter = name: type: let
      baseName = baseNameOf (toString name);
      sansPrefix = lib.removePrefix (toString ../.) name;
      in_blacklist =
        lib.hasPrefix "/node_modules" sansPrefix ||
        lib.hasPrefix "/build" sansPrefix ||
        lib.hasPrefix "/.git" sansPrefix;
      in_whitelist =
        (type == "directory") ||
        (lib.hasSuffix ".yml" name) ||
        (lib.hasSuffix ".ts" name) ||
        (lib.hasSuffix ".json" name) ||
        (lib.hasSuffix ".graphql" name) ||
        baseName == "package.json" ||
        baseName == "yarn.lock" ||
        (lib.hasPrefix "/deploy" sansPrefix);
    in (
      (!in_blacklist) && in_whitelist
    );
    src = cardano-graphql-src;
  };
in mkYarnWorkspace {
  pname = "cardano-graphql";
  inherit packageJSON;
  yarnLock = cardano-graphql-src + "/yarn.lock";

  src = pkgs.runCommand "cardano-graphql-src-cleaner" { buildInputs = [
    pkgs.fd pkgs.jq pkgs.bash pkgs.coreutils
   ]; } ''
    cp -r ${src} src
    chmod u+w -R src
    fd tsconfig.json src/packages/ -x bash -c 'jq ".extends = \"${../tsconfig.json}\"" < {} > {//}/tstmp && mv {//}/tstmp {}'
    cp -r src $out
  '';

  packageOverrides = {
    "cardano-graphql-server" = {
      buildPhase = ''
        cp -r $src/src src
        yarn --offline run build
      '';
    };

    "cardano-graphql-api-cardano-db-hasura" = {
      buildPhase = ''
        cp -r $src/src src
        yarn --offline run build
      '';
    };

    "cardano-graphql-util" = {
      buildPhase = ''
        cp -r $src/src src
        yarn --offline run build
      '';
    };
  };
}
