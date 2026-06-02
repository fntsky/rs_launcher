mod engine;
mod loader;
mod manifest;
mod registry;

pub use engine::PluginEngine;
pub use loader::DynamicPlugin;
pub use manifest::{CommandDef, PluginManifest, ScannedPlugin};
pub use registry::PluginRegistry;

use serde::{Deserialize, Serialize};

/// 搜索结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub plugin_id: String,
    pub title: String,
    pub subtitle: String,
    pub relevance: f64,
    #[serde(default)]
    pub icon_path: String,
}

/// 插件 trait
pub trait Plugin: Send + Sync {
    fn id(&self) -> &str;
    fn name(&self) -> &str;
    fn query(&self, input: &str) -> Vec<SearchResult>;
    fn execute(&self, result: &SearchResult);

    /// 向下转型为 DynamicPlugin（动态插件覆盖此方法）
    fn as_dynamic(&self) -> Option<&DynamicPlugin> {
        None
    }
}
