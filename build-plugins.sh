#!/bin/bash
set -e

TARGET_DIR="${1:-target/debug}"

echo "[BUILD] Compiling workspace plugin crates..."
cargo build -p hello_plugin --release

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGINS_DIR="$PROJECT_DIR/plugins"
WORKSPACE_TARGET="$PROJECT_DIR/target/release"

# Copy each plugin's DLL back to its source directory
for manifest in "$PLUGINS_DIR"/*/plugin.json; do
    [ -f "$manifest" ] || continue
    plugin_dir="$(dirname "$manifest")"
    plugin_name="$(basename "$plugin_dir")"

    # Extract dll field from plugin.json
    dll_name=$(grep -o '"dll"[[:space:]]*:[[:space:]]*"[^"]*"' "$manifest" | sed 's/.*: *"//;s/"//')

    if [ -n "$dll_name" ]; then
        src_dll="$WORKSPACE_TARGET/$dll_name"
        if [ -f "$src_dll" ]; then
            cp "$src_dll" "$plugin_dir/$dll_name"
            echo "[BUILD] Copied: $dll_name"
        else
            echo "[BUILD] WARNING: DLL not found: $src_dll"
        fi
    fi
done

# Deploy plugins to target directory
output_plugins="$TARGET_DIR/plugins"
mkdir -p "$output_plugins"

for manifest in "$PLUGINS_DIR"/*/plugin.json; do
    [ -f "$manifest" ] || continue
    plugin_dir="$(dirname "$manifest")"
    plugin_name="$(basename "$plugin_dir")"
    dst_dir="$output_plugins/$plugin_name"
    mkdir -p "$dst_dir"

    # Extract dll field
    dll_name=$(grep -o '"dll"[[:space:]]*:[[:space:]]*"[^"]*"' "$manifest" | sed 's/.*: *"//;s/"//')

    # Copy DLL
    if [ -n "$dll_name" ] && [ -f "$plugin_dir/$dll_name" ]; then
        cp "$plugin_dir/$dll_name" "$dst_dir/"
    fi

    # Copy plugin.json
    cp "$manifest" "$dst_dir/"

    # Copy renderer directory
    if [ -d "$plugin_dir/renderer" ]; then
        cp -r "$plugin_dir/renderer" "$dst_dir/"
    fi

    echo "[BUILD] Deployed: $plugin_name"
done

echo "[BUILD] Done"
