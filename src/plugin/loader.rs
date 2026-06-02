use crate::plugin::{Plugin, PluginManifest, SearchResult, ScannedPlugin};
use libloading::os::windows::Library;
use std::ffi::{CStr, CString};
use std::os::raw::c_char;
use std::path::PathBuf;

type FnCreate = unsafe extern "C" fn() -> *mut std::ffi::c_void;
type FnDestroy = unsafe extern "C" fn(*mut std::ffi::c_void);
type FnGetStr = unsafe extern "C" fn(*mut std::ffi::c_void) -> *const c_char;
type FnQuery = unsafe extern "C" fn(*mut std::ffi::c_void, *const c_char) -> *const c_char;
type FnExecute = unsafe extern "C" fn(*mut std::ffi::c_void, *const c_char);
type FnFree = unsafe extern "C" fn(*const c_char);
type FnInvoke = unsafe extern "C" fn(*mut std::ffi::c_void, *const c_char, *const c_char) -> *const c_char;

/// 动态插件 — 将 C ABI DLL 适配为 Plugin trait
pub struct DynamicPlugin {
    manifest: PluginManifest,
    plugin_dir: PathBuf,
    _library: Library,
    plugin_ptr: *mut std::ffi::c_void,
    fn_destroy: FnDestroy,
    fn_query: FnQuery,
    fn_execute: FnExecute,
    fn_free: FnFree,
    fn_invoke: Option<FnInvoke>,
    cached_id: String,
    cached_name: String,
}

unsafe impl Send for DynamicPlugin {}
unsafe impl Sync for DynamicPlugin {}

impl DynamicPlugin {
    pub fn load(scanned: &ScannedPlugin) -> Result<Self, String> {
        unsafe {
            let library = Library::load_with_flags(&scanned.dll_path, 0)
                .map_err(|e| format!("加载 DLL 失败 '{}': {}", scanned.dll_path.display(), e))?;

            let fn_create: FnCreate = *library
                .get(b"plugin_create")
                .map_err(|e| format!("DLL 缺少 plugin_create 导出: {}", e))?;

            let fn_destroy: FnDestroy = *library
                .get(b"plugin_destroy")
                .map_err(|e| format!("DLL 缺少 plugin_destroy 导出: {}", e))?;

            let fn_get_id: FnGetStr = *library
                .get(b"plugin_id")
                .map_err(|e| format!("DLL 缺少 plugin_id 导出: {}", e))?;

            let fn_get_name: FnGetStr = *library
                .get(b"plugin_name")
                .map_err(|e| format!("DLL 缺少 plugin_name 导出: {}", e))?;

            let fn_query: FnQuery = *library
                .get(b"plugin_query")
                .map_err(|e| format!("DLL 缺少 plugin_query 导出: {}", e))?;

            let fn_execute: FnExecute = *library
                .get(b"plugin_execute")
                .map_err(|e| format!("DLL 缺少 plugin_execute 导出: {}", e))?;

            let fn_free: FnFree = *library
                .get(b"plugin_free_results")
                .map_err(|e| format!("DLL 缺少 plugin_free_results 导出: {}", e))?;

            let fn_invoke: Option<FnInvoke> = library.get(b"plugin_invoke").ok().map(|s| *s);

            let plugin_ptr = fn_create();
            if plugin_ptr.is_null() {
                return Err("plugin_create() 返回 null".to_string());
            }

            let id_ptr = fn_get_id(plugin_ptr);
            let cached_id = CStr::from_ptr(id_ptr).to_str().unwrap_or("").to_string();

            let name_ptr = fn_get_name(plugin_ptr);
            let cached_name = CStr::from_ptr(name_ptr).to_str().unwrap_or("").to_string();

            Ok(Self {
                manifest: scanned.manifest.clone(),
                plugin_dir: scanned.plugin_dir.clone(),
                _library: library,
                plugin_ptr,
                fn_destroy,
                fn_query,
                fn_execute,
                fn_free,
                fn_invoke,
                cached_id,
                cached_name,
            })
        }
    }

    pub fn invoke(&self, command: &str, args: &str) -> Result<String, String> {
        let fn_invoke = self.fn_invoke
            .ok_or_else(|| format!("插件 {} 不支持 plugin_invoke", self.cached_id))?;

        unsafe {
            let c_cmd = CString::new(command).map_err(|e| format!("命令编码失败: {}", e))?;
            let c_args = CString::new(args).map_err(|e| format!("参数编码失败: {}", e))?;

            let result_ptr = fn_invoke(self.plugin_ptr, c_cmd.as_ptr(), c_args.as_ptr());

            if result_ptr.is_null() {
                return Err("plugin_invoke 返回 null".to_string());
            }

            let result = CStr::from_ptr(result_ptr).to_str().unwrap_or("").to_string();
            (self.fn_free)(result_ptr);
            Ok(result)
        }
    }

    pub fn has_renderer(&self) -> bool {
        self.manifest.renderer.is_some()
    }

    pub fn renderer_path(&self) -> Option<PathBuf> {
        self.manifest.renderer.as_ref().map(|r| self.plugin_dir.join(r))
    }

    pub fn plugin_dir(&self) -> &PathBuf {
        &self.plugin_dir
    }
}

impl Plugin for DynamicPlugin {
    fn id(&self) -> &str {
        &self.cached_id
    }

    fn name(&self) -> &str {
        &self.cached_name
    }

    fn query(&self, input: &str) -> Vec<SearchResult> {
        unsafe {
            let c_input = match CString::new(input) {
                Ok(s) => s,
                Err(_) => return Vec::new(),
            };

            let result_ptr = (self.fn_query)(self.plugin_ptr, c_input.as_ptr());

            if result_ptr.is_null() {
                return Vec::new();
            }

            let json_str = CStr::from_ptr(result_ptr).to_str().unwrap_or("[]");
            let results = parse_search_results(json_str);
            (self.fn_free)(result_ptr);
            results
        }
    }

    fn execute(&self, result: &SearchResult) {
        unsafe {
            let json = format!(
                r#"{{"plugin_id":"{}","title":"{}","subtitle":"{}","relevance":{},"icon_path":"{}"}}"#,
                result.plugin_id,
                escape_json(&result.title),
                escape_json(&result.subtitle),
                result.relevance,
                escape_json(&result.icon_path),
            );
            if let Ok(c_arg) = CString::new(json) {
                (self.fn_execute)(self.plugin_ptr, c_arg.as_ptr());
            }
        }
    }

    fn as_dynamic(&self) -> Option<&DynamicPlugin> {
        Some(self)
    }
}

impl Drop for DynamicPlugin {
    fn drop(&mut self) {
        unsafe {
            if !self.plugin_ptr.is_null() {
                (self.fn_destroy)(self.plugin_ptr);
            }
        }
    }
}

fn escape_json(s: &str) -> String {
    s.replace('\\', "\\\\").replace('"', "\\\"")
}

fn parse_search_results(json: &str) -> Vec<SearchResult> {
    #[derive(serde::Deserialize)]
    struct Raw {
        plugin_id: String,
        title: String,
        subtitle: String,
        relevance: f64,
        #[serde(default)]
        icon_path: String,
        #[serde(default = "default_execute")]
        action: String,
        #[serde(default = "default_template")]
        template: String,
    }

    fn default_execute() -> String {
        "execute".to_string()
    }

    fn default_template() -> String {
        "default".to_string()
    }

    match serde_json::from_str::<Vec<Raw>>(json) {
        Ok(raw) => raw.into_iter().map(|r| SearchResult {
            plugin_id: r.plugin_id,
            title: r.title,
            subtitle: r.subtitle,
            relevance: r.relevance,
            icon_path: r.icon_path,
            action: r.action,
            template: r.template,
        }).collect(),
        Err(e) => {
            eprintln!("[LOADER] 解析 DLL 查询结果 JSON 失败: {}", e);
            Vec::new()
        }
    }
}