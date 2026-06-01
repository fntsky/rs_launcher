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
        if input.is_empty() {
            return Vec::new();
        }

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

    /// 根据 plugin_id 找到对应插件执行动作
    pub fn execute(&self, result: &SearchResult) {
        if let Some(plugin) = self.registry.find_by_id(&result.plugin_id) {
            eprintln!("[ENGINE] 执行: {} -> {} ({})", plugin.name(), result.title, result.subtitle);
            plugin.execute(result);
        } else {
            eprintln!("[ENGINE] 未找到插件: {}", result.plugin_id);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::plugin::Plugin;
    use std::sync::atomic::{AtomicUsize, Ordering};

    struct MockPlugin {
        id: String,
        execute_count: AtomicUsize,
    }

    impl MockPlugin {
        fn new(id: &str) -> Self {
            Self {
                id: id.to_string(),
                execute_count: AtomicUsize::new(0),
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
                },
                SearchResult {
                    plugin_id: self.id.clone(),
                    title: format!("{}-{}-low", self.id, input),
                    subtitle: String::new(),
                    relevance: 0.1,
                    icon_path: String::new(),
                },
            ]
        }
        fn execute(&self, _result: &SearchResult) {
            self.execute_count.fetch_add(1, Ordering::Relaxed);
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
        assert!(results.is_empty());
    }

    #[test]
    fn execute_dispatches_to_plugin() {
        let mut registry = PluginRegistry::new();
        registry.register(Box::new(MockPlugin::new("a")));

        let engine = PluginEngine::new(Arc::new(registry));
        let result = SearchResult {
            plugin_id: "a".to_string(),
            title: "test".to_string(),
            subtitle: String::new(),
            relevance: 0.5,
            icon_path: String::new(),
        };
        engine.execute(&result);
    }
}
