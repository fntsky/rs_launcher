use serde::Deserialize;
use std::path::{Path, PathBuf};

/// plugin.json 清单
#[derive(Debug, Clone, Deserialize)]
pub struct PluginManifest {
    pub id: String,
    pub name: String,
    pub version: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub author: String,
    pub dll: String,
    #[serde(default)]
    pub renderer: Option<String>,
    #[serde(default)]
    pub commands: Vec<CommandDef>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CommandDef {
    pub name: String,
    #[serde(default)]
    pub params: Vec<String>,
    #[serde(default)]
    pub description: String,
}

/// 插件扫描结果
pub struct ScannedPlugin {
    pub manifest: PluginManifest,
    pub plugin_dir: PathBuf,
    pub dll_path: PathBuf,
    pub renderer_path: Option<PathBuf>,
}

impl PluginManifest {
    pub fn from_file(path: &Path) -> Result<Self, String> {
        let content = std::fs::read_to_string(path)
            .map_err(|e| format!("读取 plugin.json 失败: {}", e))?;
        let manifest: PluginManifest = serde_json::from_str(&content)
            .map_err(|e| format!("解析 plugin.json 失败: {}", e))?;

        if manifest.id.is_empty() {
            return Err("plugin.json 缺少 id 字段".to_string());
        }
        if manifest.name.is_empty() {
            return Err("plugin.json 缺少 name 字段".to_string());
        }
        if manifest.version.is_empty() {
            return Err("plugin.json 缺少 version 字段".to_string());
        }
        if manifest.dll.is_empty() {
            return Err("plugin.json 缺少 dll 字段".to_string());
        }

        Ok(manifest)
    }
}

impl ScannedPlugin {
    pub fn from_dir(dir: &Path) -> Result<Self, String> {
        let manifest_path = dir.join("plugin.json");
        let manifest = PluginManifest::from_file(&manifest_path)?;

        let dll_path = dir.join(&manifest.dll);
        if !dll_path.exists() {
            return Err(format!(
                "DLL 文件不存在: {}",
                dll_path.display()
            ));
        }

        let renderer_path = manifest.renderer.as_ref().map(|r| dir.join(r));

        Ok(Self {
            manifest,
            plugin_dir: dir.to_path_buf(),
            dll_path,
            renderer_path,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_valid_manifest() {
        let json = r#"{
            "id": "test_plugin",
            "name": "测试插件",
            "version": "1.0.0",
            "description": "描述",
            "author": "作者",
            "dll": "test_plugin.dll",
            "renderer": "renderer/index.html",
            "commands": [{"name": "greet", "params": ["name"], "description": "打招呼"}]
        }"#;

        let m: PluginManifest = serde_json::from_str(json).unwrap();
        assert_eq!(m.id, "test_plugin");
        assert_eq!(m.name, "测试插件");
        assert_eq!(m.version, "1.0.0");
        assert_eq!(m.dll, "test_plugin.dll");
        assert!(m.renderer.is_some());
        assert_eq!(m.commands.len(), 1);
        assert_eq!(m.commands[0].name, "greet");
    }

    #[test]
    fn parse_minimal_manifest() {
        let json = r#"{
            "id": "minimal",
            "name": "最小插件",
            "version": "0.1.0",
            "dll": "minimal.dll"
        }"#;

        let m: PluginManifest = serde_json::from_str(json).unwrap();
        assert_eq!(m.id, "minimal");
        assert!(m.renderer.is_none());
        assert!(m.commands.is_empty());
        assert!(m.description.is_empty());
        assert!(m.author.is_empty());
    }

    #[test]
    fn reject_missing_id() {
        let json = r#"{"name": "x", "version": "1.0.0", "dll": "x.dll"}"#;
        let m: Result<PluginManifest, _> = serde_json::from_str(json);
        assert!(m.is_err());
    }

    #[test]
    fn from_file_validates_required_fields() {
        let dir = std::env::temp_dir().join("rs_launcher_test_manifest");
        let _ = std::fs::create_dir(&dir);
        let path = dir.join("plugin.json");

        // Missing dll field
        std::fs::write(&path, r#"{"id":"x","name":"x","version":"1.0.0"}"#).unwrap();
        let result = PluginManifest::from_file(&path);
        assert!(result.is_err());

        // Clean up
        let _ = std::fs::remove_dir_all(&dir);
    }
}
