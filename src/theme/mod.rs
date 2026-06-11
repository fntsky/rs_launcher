use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

/// theme.json manifest
#[derive(Debug, Clone, Deserialize)]
pub struct ThemeManifest {
    pub name: String,
    pub mode: String,
    pub vars: HashMap<String, String>,
}

/// 扫描结果 — 轻量信息用于列表展示
#[derive(Debug, Clone, Serialize)]
pub struct ThemeInfo {
    pub id: String,
    pub name: String,
    pub mode: String,
}

/// 完整主题数据 — 包含所有 CSS 变量，前端用于 apply
#[derive(Debug, Clone, Serialize)]
pub struct ThemeDTO {
    pub id: String,
    pub name: String,
    pub mode: String,
    pub vars: HashMap<String, String>,
}

fn dark_theme() -> ThemeDTO {
    ThemeDTO {
        id: "dark".into(),
        name: "暗色主题".into(),
        mode: "dark".into(),
        vars: HashMap::from([
            ("--bg-primary".into(), "#1c1c1e".into()),
            ("--bg-secondary".into(), "#2c2c2e".into()),
            ("--bg-hover".into(), "#3a3a3c".into()),
            ("--bg-selected".into(), "#38383a".into()),
            ("--text-primary".into(), "#ffffff".into()),
            ("--text-secondary".into(), "#8e8e93".into()),
            ("--text-hint".into(), "#636366".into()),
            ("--accent".into(), "#0a84ff".into()),
            ("--divider".into(), "#38383a".into()),
            ("--app-opacity".into(), "0.75".into()),
            ("--app-blur".into(), "20px".into()),
        ]),
    }
}

fn light_theme() -> ThemeDTO {
    ThemeDTO {
        id: "light".into(),
        name: "亮色主题".into(),
        mode: "light".into(),
        vars: HashMap::from([
            ("--bg-primary".into(), "#f0f0f5".into()),
            ("--bg-secondary".into(), "#e8e8ee".into()),
            ("--bg-hover".into(), "#d8d8e2".into()),
            ("--bg-selected".into(), "#c8d8f0".into()),
            ("--text-primary".into(), "#1e1e22".into()),
            ("--text-secondary".into(), "#6a6a72".into()),
            ("--text-hint".into(), "#909098".into()),
            ("--accent".into(), "#3a80c9".into()),
            ("--divider".into(), "#d0d0d8".into()),
        ]),
    }
}

fn builtin_theme(id: &str) -> Option<ThemeDTO> {
    match id {
        "dark" => Some(dark_theme()),
        "light" => Some(light_theme()),
        _ => None,
    }
}

fn get_themes_dir() -> PathBuf {
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            return exe_dir.join("themes");
        }
    }
    PathBuf::from("themes")
}

/// 扫描 <exe_dir>/themes/ 下的所有 theme.json
fn scan_user_themes(dir: &std::path::Path) -> Vec<ThemeDTO> {
    let mut themes = Vec::new();

    if !dir.exists() {
        return themes;
    }

    let entries = match std::fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return themes,
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }
        let theme_dir_name = path.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();
        let manifest_path = path.join("theme.json");
        if !manifest_path.exists() {
            continue;
        }
        match std::fs::read_to_string(&manifest_path) {
            Ok(content) => match serde_json::from_str::<ThemeManifest>(&content) {
                Ok(manifest) => {
                    themes.push(ThemeDTO {
                        id: theme_dir_name,
                        name: manifest.name,
                        mode: manifest.mode,
                        vars: manifest.vars,
                    });
                }
                Err(e) => {
                    eprintln!("[THEME] 解析 theme.json 失败 {}: {}", manifest_path.display(), e);
                }
            },
            Err(e) => {
                eprintln!("[THEME] 读取 theme.json 失败 {}: {}", manifest_path.display(), e);
            }
        }
    }

    themes
}

/// 列出所有可用主题（内置 + 用户自定义）
pub fn list_themes() -> Vec<ThemeInfo> {
    let mut infos = vec![
        ThemeInfo { id: "dark".into(), name: "暗色主题".into(), mode: "dark".into() },
        ThemeInfo { id: "light".into(), name: "亮色主题".into(), mode: "light".into() },
    ];

    let user_themes = scan_user_themes(&get_themes_dir());
    for t in &user_themes {
        // 用户主题覆盖同名内置主题
        if let Some(existing) = infos.iter_mut().find(|i| i.id == t.id) {
            existing.name = t.name.clone();
            existing.mode = t.mode.clone();
        } else {
            infos.push(ThemeInfo {
                id: t.id.clone(),
                name: t.name.clone(),
                mode: t.mode.clone(),
            });
        }
    }

    infos
}

/// 根据 id 获取完整主题数据。优先用户主题，回退内置。
pub fn get_theme(id: &str) -> Option<ThemeDTO> {
    let user_themes = scan_user_themes(&get_themes_dir());
    if let Some(t) = user_themes.iter().find(|t| t.id == id) {
        return Some(t.clone());
    }
    builtin_theme(id)
}
