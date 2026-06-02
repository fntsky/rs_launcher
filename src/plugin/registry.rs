use crate::plugin::Plugin;

/// 插件注册表（静态+动态插件统一管理）
pub struct PluginRegistry {
    plugins: Vec<Box<dyn Plugin>>,
}

impl PluginRegistry {
    pub fn new() -> Self {
        Self {
            plugins: Vec::new(),
        }
    }

    pub fn register(&mut self, plugin: Box<dyn Plugin>) {
        eprintln!("[PLUGIN] 注册插件: {} ({})", plugin.name(), plugin.id());
        self.plugins.push(plugin);
    }

    pub fn plugins(&self) -> &[Box<dyn Plugin>] {
        &self.plugins
    }

    pub fn find_by_id(&self, id: &str) -> Option<&Box<dyn Plugin>> {
        self.plugins.iter().find(|p| p.id() == id)
    }

    /// 动态查找：获取动态插件的 invoke 句柄
    /// 返回 None 如果插件不存在或不是动态插件
    pub fn find_dynamic(&self, id: &str) -> Option<&crate::plugin::loader::DynamicPlugin> {
        self.plugins.iter().find(|p| p.id() == id).and_then(|p| {
            p.as_ref().as_dynamic()
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::plugin::SearchResult;

    struct MockPlugin {
        id: String,
        name: String,
    }

    impl MockPlugin {
        fn new(id: &str, name: &str) -> Self {
            Self {
                id: id.to_string(),
                name: name.to_string(),
            }
        }
    }

    impl Plugin for MockPlugin {
        fn id(&self) -> &str {
            &self.id
        }
        fn name(&self) -> &str {
            &self.name
        }
        fn query(&self, input: &str) -> Vec<SearchResult> {
            vec![SearchResult {
                plugin_id: self.id.clone(),
                title: input.to_string(),
                subtitle: String::new(),
                relevance: 0.5,
                icon_path: String::new(),
                action: "execute".to_string(),
                item_html: String::new(),
            }]
        }
        fn execute(&self, _result: &SearchResult) {}
    }

    #[test]
    fn register_and_iterate() {
        let mut registry = PluginRegistry::new();
        registry.register(Box::new(MockPlugin::new("a", "Plugin A")));
        registry.register(Box::new(MockPlugin::new("b", "Plugin B")));

        assert_eq!(registry.plugins().len(), 2);
        assert_eq!(registry.plugins()[0].id(), "a");
        assert_eq!(registry.plugins()[1].id(), "b");
    }

    #[test]
    fn find_by_id() {
        let mut registry = PluginRegistry::new();
        registry.register(Box::new(MockPlugin::new("a", "Plugin A")));

        assert!(registry.find_by_id("a").is_some());
        assert!(registry.find_by_id("b").is_none());
    }
}