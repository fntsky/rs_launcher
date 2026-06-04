#!/bin/bash
set -e

PROFILE="${1:-debug}"
if [ "$PROFILE" = "release" ]; then
    CARGO_ARGS="--release"
    CARGO_PROFILE="release"
else
    CARGO_ARGS=""
    CARGO_PROFILE="debug"
fi

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGINS_DIR="$PROJECT_DIR/plugins"
WORKSPACE_TARGET="$PROJECT_DIR/target/$CARGO_PROFILE"

echo "[BUILD] Compiling workspace plugins ($CARGO_PROFILE)..."
build_ok=1
for plugin_dir in "$PLUGINS_DIR"/*/; do
    if [ -f "$plugin_dir/plugin.json" ]; then
        plugin_name="$(basename "$plugin_dir")"
        echo "[BUILD] Building plugin: $plugin_name"
        if ! cargo build -p "$plugin_name" $CARGO_ARGS; then
            echo "[BUILD] ERROR: Plugin $plugin_name compilation failed"
            build_ok=0
        fi
    fi
done
if [ "$build_ok" != "1" ]; then exit 1; fi

output_plugins="$WORKSPACE_TARGET/plugins"
mkdir -p "$output_plugins"

for plugin_dir in "$PLUGINS_DIR"/*/; do
    if [ ! -f "$plugin_dir/plugin.json" ]; then continue; fi
    plugin_name="$(basename "$plugin_dir")"
    dst_dir="$output_plugins/$plugin_name"
    mkdir -p "$dst_dir"

    dll_name=$(grep -o '"dll"[[:space:]]*:[[:space:]]*"[^"]*"' "$plugin_dir/plugin.json" | sed 's/.*: *"//;s/"//')

    if [ -n "$dll_name" ] && [ -f "$WORKSPACE_TARGET/$dll_name" ]; then
        cp "$WORKSPACE_TARGET/$dll_name" "$dst_dir/"
    elif [ -n "$dll_name" ]; then
        echo "[BUILD] WARNING: DLL not found: $WORKSPACE_TARGET/$dll_name"
    fi

    cp "$plugin_dir/plugin.json" "$dst_dir/"

    if [ -d "$plugin_dir/renderer" ]; then
        cp -r "$plugin_dir/renderer" "$dst_dir/"
    fi

    if [ -f "$plugin_dir/renderer/package.json" ]; then
        echo "[BUILD] Building renderer for: $plugin_name"
        pushd "$plugin_dir/renderer" >/dev/null
        if [ ! -d "node_modules" ]; then
            npm install --ignore-scripts
        fi
        npm run build
        popd >/dev/null

        if [ -d "$plugin_dir/renderer/dist" ]; then
            cp -r "$plugin_dir/renderer/dist" "$dst_dir/renderer/"
        fi
    fi

    echo "[BUILD] Deployed: $plugin_name"
done

echo "[BUILD] Done"
