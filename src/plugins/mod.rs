mod app_search;

pub use app_search::AppSearchPlugin;

use crate::plugin::{DynamicPlugin, PluginRegistry, ScannedPlugin};
use std::path::PathBuf;

pub fn create_registry() -> PluginRegistry {
    let mut registry = PluginRegistry::new();

    // Register built-in plugins
    registry.register(Box::new(AppSearchPlugin::new()));

    // Scan and load dynamic plugins
    let plugins_dir = get_plugins_dir();
    scan_dynamic_plugins(&plugins_dir, &mut registry);

    registry
}

/// Get the plugins directory path (next to the executable)
fn get_plugins_dir() -> PathBuf {
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            return exe_dir.join("plugins");
        }
    }
    PathBuf::from("plugins")
}

/// Scan plugins/ directory for dynamic plugin folders
fn scan_dynamic_plugins(dir: &std::path::Path, registry: &mut PluginRegistry) {
    if !dir.exists() {
        eprintln!("[PLUGIN] 插件目录不存在: {}", dir.display());
        return;
    }

    let entries = match std::fs::read_dir(dir) {
        Ok(e) => e,
        Err(e) => {
            eprintln!("[PLUGIN] 无法读取插件目录: {}", e);
            return;
        }
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        let plugin_name = path.file_name().unwrap_or_default().to_string_lossy();

        match ScannedPlugin::from_dir(&path) {
            Ok(scanned) => {
                eprintln!(
                    "[PLUGIN] 发现动态插件: {} ({})",
                    scanned.manifest.name,
                    scanned.manifest.id
                );

                match DynamicPlugin::load(&scanned) {
                    Ok(dynamic) => {
                        registry.register(Box::new(dynamic));
                    }
                    Err(e) => {
                        eprintln!(
                            "[PLUGIN] 加载动态插件 {} 失败: {}",
                            plugin_name, e
                        );
                    }
                }
            }
            Err(e) => {
                eprintln!(
                    "[PLUGIN] 跳过插件目录 {}: {}",
                    plugin_name, e
                );
            }
        }
    }
}
