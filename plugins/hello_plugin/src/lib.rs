use std::ffi::{CStr, CString};
use std::os::raw::c_char;

struct HelloPlugin;

impl HelloPlugin {
    fn new() -> Self {
        Self
    }

    fn query(&self, input: &str) -> String {
        let lower = input.to_lowercase();
        if lower.is_empty() || lower.contains("hello") || lower.contains("你好") {
            let relevance = if lower.is_empty() { 0.1 } else { 0.9 };
            let title = if lower.is_empty() {
                "Hello Plugin".to_string()
            } else {
                format!("Hello, {}!", input)
            };
            let item_html = r#"<div style="display:flex;align-items:center;gap:10px;width:100%"><span style="font-size:24px">👋</span><div><div style="font-weight:500">"#.to_string()
                + &title
                + r#"</div><div style="font-size:12px;color:#999">Open the Hello plugin</div></div></div>"#;
            format!(
                r#"[{{"plugin_id":"hello_plugin","title":"{}","subtitle":"来自 Hello 插件的问候","relevance":{},"icon_path":"","action":"open_renderer","item_html":"{}"}}]"#,
                title.replace('"', "\\\""),
                relevance,
                item_html.replace('\\', "\\\\").replace('"', "\\\""),
            )
        } else {
            "[]".to_string()
        }
    }

    fn execute(&self, _argument: &str) {
        // No-op for hello plugin
    }

    fn invoke(&self, command: &str, args: &str) -> String {
        match command {
            "greet" => {
                let name = match serde_json::from_str::<serde_json::Value>(args) {
                    Ok(v) => v["name"].as_str().unwrap_or("World").to_string(),
                    Err(_) => "World".to_string(),
                };
                format!(r#"{{"message":"Hello, {}! Welcome from Hello Plugin!"}}"#, name)
            }
            _ => r#"{"error":"unknown command"}"#.to_string(),
        }
    }
}

#[no_mangle]
pub extern "C" fn plugin_create() -> *mut HelloPlugin {
    Box::into_raw(Box::new(HelloPlugin::new()))
}

#[no_mangle]
pub extern "C" fn plugin_destroy(plugin: *mut HelloPlugin) {
    if !plugin.is_null() {
        unsafe {
            drop(Box::from_raw(plugin));
        }
    }
}

#[no_mangle]
pub extern "C" fn plugin_id(_plugin: *mut HelloPlugin) -> *const c_char {
    static ID: &[u8] = b"hello_plugin\0";
    ID.as_ptr() as *const c_char
}

#[no_mangle]
pub extern "C" fn plugin_name(_plugin: *mut HelloPlugin) -> *const c_char {
    static NAME: &[u8] = b"Hello \xe6\x8f\x92\xe4\xbb\xb6\0"; // "Hello 插件" in UTF-8
    NAME.as_ptr() as *const c_char
}

#[no_mangle]
pub extern "C" fn plugin_query(plugin: *mut HelloPlugin, query: *const c_char) -> *const c_char {
    let query_str = unsafe { CStr::from_ptr(query).to_str().unwrap_or("") };
    let results = unsafe { (*plugin).query(query_str) };
    CString::new(results).unwrap().into_raw()
}

#[no_mangle]
pub extern "C" fn plugin_execute(plugin: *mut HelloPlugin, argument: *const c_char) {
    let arg = unsafe { CStr::from_ptr(argument).to_str().unwrap_or("") };
    unsafe {
        (*plugin).execute(arg);
    }
}

#[no_mangle]
pub extern "C" fn plugin_free_results(s: *const c_char) {
    if !s.is_null() {
        unsafe {
            let _ = CString::from_raw(s as *mut c_char);
        }
    }
}

#[no_mangle]
pub extern "C" fn plugin_invoke(
    plugin: *mut HelloPlugin,
    command: *const c_char,
    args: *const c_char,
) -> *const c_char {
    let cmd = unsafe { CStr::from_ptr(command).to_str().unwrap_or("") };
    let args_str = unsafe { CStr::from_ptr(args).to_str().unwrap_or("") };
    let result = unsafe { (*plugin).invoke(cmd, args_str) };
    CString::new(result).unwrap().into_raw()
}
