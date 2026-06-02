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
        self.plugins
            .iter()
            .find(|p| p.id() == id)
            .and_then(|p| p.as_ref().as_dynamic())
    }
}
