mod engine;
mod loader;
mod manifest;
mod registry;

pub use engine::PluginEngine;
pub use loader::DynamicPlugin;
pub use manifest::{PluginManifest, ScannedPlugin};
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
    #[serde(default = "default_execute")]
    pub action: String,
    #[serde(default = "default_template")]
    pub template: String,
}

fn default_execute() -> String {
    "execute".to_string()
}

fn default_template() -> String {
    "default".to_string()
}

/// 插件 trait
pub trait Plugin: Send + Sync {
    fn id(&self) -> &str;
    fn name(&self) -> &str;
    fn query(&self, input: &str) -> Vec<SearchResult>;

    /// 向下转型为 DynamicPlugin（动态插件覆盖此方法）
    fn as_dynamic(&self) -> Option<&DynamicPlugin> {
        None
    }

    fn version(&self) -> &str {
        ""
    }

    fn description(&self) -> &str {
        ""
    }

    fn author(&self) -> &str {
        ""
    }

    fn has_renderer(&self) -> bool {
        false
    }
}
