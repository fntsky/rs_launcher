mod engine;
mod registry;

pub use engine::PluginEngine;
pub use registry::PluginRegistry;

/// 搜索结果
#[derive(Clone, Debug)]
pub struct SearchResult {
    /// 来源插件 ID
    pub plugin_id: String,
    /// 结果标题
    pub title: String,
    /// 副标题/路径
    pub subtitle: String,
    /// 相关度分数 0.0~1.0
    pub relevance: f64,
    /// 图标文件路径 (PNG)
    pub icon_path: String,
}

/// 插件 trait
///
/// 所有插件必须实现此 trait，支持线程并行查询。
/// 方法签名使用 FFI 安全类型，为后续动态加载预留。
pub trait Plugin: Send + Sync {
    /// 插件唯一标识，如 "app_search"
    fn id(&self) -> &str;

    /// 插件显示名称，如 "应用程序"
    fn name(&self) -> &str;

    /// 执行查询，返回匹配结果（按 relevance 降序排列）
    fn query(&self, input: &str) -> Vec<SearchResult>;

    /// 执行选中动作（打开文件、运行命令等）
    fn execute(&self, result: &SearchResult);
}
