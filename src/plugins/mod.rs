mod app_search;

pub use app_search::AppSearchPlugin;

use crate::plugin::PluginRegistry;

pub fn create_registry() -> PluginRegistry {
    let mut registry = PluginRegistry::new();
    registry.register(Box::new(AppSearchPlugin::new()));
    registry
}
