use crate::plugin::{PluginRegistry, SearchResult};

use std::sync::Arc;

/// 插件调度引擎
pub struct PluginEngine {
    registry: Arc<PluginRegistry>,
}

impl PluginEngine {
    pub fn new(registry: Arc<PluginRegistry>) -> Self {
        Self { registry }
    }

    /// 并行查询所有插件，合并结果按 relevance 降序排序
    pub fn query(&self, input: &str) -> Vec<SearchResult> {

        eprintln!("[ENGINE] 查询输入: \"{}\"", input);

        let results: Vec<SearchResult> = std::thread::scope(|s| {
            let handles: Vec<_> = self
                .registry
                .plugins()
                .iter()
                .map(|plugin| {
                    let plugin_id = plugin.id();
                    s.spawn(move || {
                        let results = plugin.query(input);
                        eprintln!("[PLUGIN] {} 返回 {} 条结果", plugin_id, results.len());
                        results
                    })
                })
                .collect();

            handles
                .into_iter()
                .flat_map(|h| h.join().unwrap_or_default())
                .collect()
        });

        eprintln!("[ENGINE] 合并结果: {} 条", results.len());

        let mut sorted = results;
        sorted.sort_by(|a, b| b.relevance.partial_cmp(&a.relevance).unwrap_or(std::cmp::Ordering::Equal));
        sorted
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::plugin::Plugin;

    struct MockPlugin {
        id: String,
    }

    impl MockPlugin {
        fn new(id: &str) -> Self {
            Self {
                id: id.to_string(),
            }
        }
    }

    impl Plugin for MockPlugin {
        fn id(&self) -> &str {
            &self.id
        }
        fn name(&self) -> &str {
            &self.id
        }
        fn query(&self, input: &str) -> Vec<SearchResult> {
            vec![
                SearchResult {
                    plugin_id: self.id.clone(),
                    title: format!("{}-{}", self.id, input),
                    subtitle: String::new(),
                    relevance: 0.5,
                    icon_path: String::new(),
                    action: "execute".to_string(),
                    template: "default".to_string(),
                },
                SearchResult {
                    plugin_id: self.id.clone(),
                    title: format!("{}-{}-low", self.id, input),
                    subtitle: String::new(),
                    relevance: 0.1,
                    icon_path: String::new(),
                    action: "execute".to_string(),
                    template: "default".to_string(),
                },
            ]
        }
    }

    #[test]
    fn query_merges_and_sorts() {
        let mut registry = PluginRegistry::new();
        registry.register(Box::new(MockPlugin::new("a")));
        registry.register(Box::new(MockPlugin::new("b")));

        let engine = PluginEngine::new(Arc::new(registry));
        let results = engine.query("test");

        // 2 plugins × 2 results = 4
        assert_eq!(results.len(), 4);
        // 按 relevance 降序
        for i in 1..results.len() {
            assert!(results[i - 1].relevance >= results[i].relevance);
        }
    }

    #[test]
    fn query_empty_input() {
        let mut registry = PluginRegistry::new();
        registry.register(Box::new(MockPlugin::new("a")));

        let engine = PluginEngine::new(Arc::new(registry));
        let results = engine.query("");
        assert!(!results.is_empty());
    }
}
