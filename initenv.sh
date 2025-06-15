#!/usr/bin/env bash

set -euo pipefail

check_env() {
    for cmd in node uv pnpm; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            echo "$cmd not installed"
            exit 1
        else
            echo "$cmd installed"
        fi
    done
}

front_end(){
    mkdir -p ./front_end

    pushd ./front_end >/dev/null

        # Use project-local pnpm store to avoid root/global permission issues
        pnpm config set store-dir .pnpm-store

        # Initialize project
        pnpm create vite . --template react-ts

        # Clean install with local store
        rm -rf node_modules
        pnpm install

        # Install Tailwind + Vite plugin
        pnpm install -D tailwindcss postcss autoprefixer @tailwindcss/vite

        # Patch vite.config.ts
        sed -i "2i import tailwindcss from '@tailwindcss/vite'" vite.config.ts
        sed -i "s/plugins: \[\(.*react()\)\]/plugins: [\1, tailwindcss()]/" vite.config.ts
        sed -i '/export default defineConfig({/,/^})/ {
          /^})/ i\
          server: {\
            host: true, // or "0.0.0.0",\
            port: 5173\
          },
        }' vite.config.ts

    popd >/dev/null 
}

back_end(){
    mkdir -p ./back_end

    pushd ./back_end >/dev/null
        uv init --python 312
        uv venv .venv
    popd >/dev/null
}

check_env
front_end
back_end

echo ".DS_Store" > .gitignore
echo ".pnpm-store" >> .gitignore
