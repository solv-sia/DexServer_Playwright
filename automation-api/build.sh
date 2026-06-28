#!/bin/bash
set -e

if [ -f .env.acr ]; then
  source .env.acr
fi

version=$1

if [ -z "$version" ]; then
  echo "Usage: ./build.sh <version>"
  exit 1
fi

if [ -z "$TOKEN_ACR" ]; then
  echo "Error: TOKEN_ACR not set"
  exit 1
fi

docker login -u dex-iplusd-token -p "$TOKEN_ACR" dexreg.azurecr.io

docker build --build-arg APP_VERSION="${version}" -t dexreg.azurecr.io/automation-api:${version} .

docker push dexreg.azurecr.io/automation-api:${version}
