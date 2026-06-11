use crate::plugin::{Plugin, SearchResult};
use crate::search::fuzzy::fuzzy_match;
use crate::icon;

use std::path::{Path, PathBuf};
use std::sync::{Arc, RwLock, atomic::{AtomicBool, Ordering}};

/// 应用搜索插件 — 扫描 Windows 开始菜单快捷方式
pub struct AppSearchPlugin {
    apps: Arc<RwLock<Vec<AppEntry>>>,
    loaded: Arc<AtomicBool>,
}

struct AppEntry {
    name: String,
    lnk_path: String,
    icon_path: String,
}

impl AppSearchPlugin {
    pub fn new() -> Self {
        let apps = Arc::new(RwLock::new(Vec::new()));
        let loaded = Arc::new(AtomicBool::new(false));

        let apps_clone = apps.clone();
        let loaded_clone = loaded.clone();
        std::thread::spawn(move || {
            let mut app_list = Vec::new();
            scan_start_menu(&mut app_list);
            *apps_clone.write().unwrap() = app_list;
            loaded_clone.store(true, Ordering::Release);
        });

        Self { apps, loaded }
    }
}

fn scan_start_menu(apps: &mut Vec<AppEntry>) {
    let user_start = std::env::var("APPDATA")
        .map(|p| PathBuf::from(p).join("Microsoft\\Windows\\Start Menu\\Programs"))
        .ok();

    let common_start = std::env::var("PROGRAMDATA")
        .map(|p| PathBuf::from(p).join("Microsoft\\Windows\\Start Menu\\Programs"))
        .ok();

    if let Some(dir) = &user_start {
        eprintln!("[APP_SEARCH] 扫描用户开始菜单: {}", dir.display());
        scan_lnks(dir, apps);
    }
    if let Some(dir) = &common_start {
        eprintln!("[APP_SEARCH] 扫描公共开始菜单: {}", dir.display());
        scan_lnks(dir, apps);
    }

    // Deduplicate by name (case-insensitive)
    apps.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    apps.dedup_by(|a, b| a.name.eq_ignore_ascii_case(&b.name));

    eprintln!("[APP_SEARCH] 加载应用总数: {}", apps.len());
}

fn scan_lnks(dir: &Path, apps: &mut Vec<AppEntry>) {
    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                scan_lnks(&path, apps);
            } else if path.extension().and_then(|e| e.to_str()) == Some("lnk") {
                if let Some(name) = path.file_stem().and_then(|s| s.to_str()) {
                    let lnk_path = path.to_string_lossy().to_string();
                    eprintln!("[APP_SEARCH]   发现: {} -> {}", name, &lnk_path);
                    let icon_path = icon::extract_icon_to_png(&lnk_path);
                    apps.push(AppEntry {
                        name: name.to_string(),
                        lnk_path,
                        icon_path,
                    });
                }
            }
        }
    }
}


impl Plugin for AppSearchPlugin {
    fn id(&self) -> &str {
        "app_search"
    }

    fn name(&self) -> &str {
        "应用程序"
    }

    fn query(&self, input: &str) -> Vec<SearchResult> {
        if input.is_empty() {
            return Vec::new();
        }

        let apps = self.apps.read().unwrap();
        let input_lower = input.to_lowercase();
        let mut results: Vec<SearchResult> = apps
            .iter()
            .filter_map(|app| {
                let relevance = fuzzy_match(&input_lower, &app.name);
                if relevance <= 0.0 {
                    return None;
                }

                eprintln!("[APP_SEARCH] 匹配: {} (相关度: {:.2})", app.name, relevance);
                Some(SearchResult {
                    plugin_id: self.id().to_string(),
                    title: app.name.clone(),
                    subtitle: app.lnk_path.clone(),
                    relevance,
                    icon_path: app.icon_path.clone(),
                    action: "execute".to_string(),
                    template: "default".to_string(),
                })
            })
            .collect();

        results.sort_by(|a, b| b.relevance.partial_cmp(&a.relevance).unwrap_or(std::cmp::Ordering::Equal));
        results
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use std::sync::Arc;

    #[test]
    fn relevance_scoring() {
        use std::sync::RwLock;
        use std::sync::atomic::AtomicBool;

        let apps = vec![
            AppEntry { name: "Chrome".to_string(), lnk_path: "C:\\Chrome.lnk".to_string(), icon_path: String::new() },
            AppEntry { name: "Chrome Canary".to_string(), lnk_path: "C:\\Chrome Canary.lnk".to_string(), icon_path: String::new() },
            AppEntry { name: "Visual Studio Code".to_string(), lnk_path: "C:\\Visual Studio Code.lnk".to_string(), icon_path: String::new() },
        ];
        let plugin = AppSearchPlugin {
            apps: Arc::new(RwLock::new(apps)),
            loaded: Arc::new(AtomicBool::new(true)),
        };

        // Exact match
        let results = plugin.query("chrome");
        assert_eq!(results.len(), 2);
        assert_eq!(results[0].title, "Chrome");
        assert!((results[0].relevance - 1.0).abs() < 0.01);

        // Prefix match (fuzzy_match returns 0.85 + ratio)
        let results = plugin.query("chr");
        assert_eq!(results.len(), 2);
        assert!(results[0].relevance >= 0.85);
        assert!(results[0].relevance < 1.0);

        // Contains match (fuzzy_match returns 0.6 + ratio)
        let results = plugin.query("studio");
        assert_eq!(results.len(), 1);
        assert!(results[0].relevance >= 0.6);
        assert!(results[0].relevance < 0.85);

        // No match
        let results = plugin.query("firefox");
        assert!(results.is_empty());
    }
}
