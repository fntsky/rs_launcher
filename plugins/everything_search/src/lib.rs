use std::ffi::{CStr, CString};
use std::os::raw::c_char;

pub struct EverythingPlugin;

fn search_everything(query: &str) -> String {
    if query.is_empty() {
        return r#"{"results":[],"error":null}"#.to_string();
    }

    use everything_ipc::wm::{EverythingClient, RequestFlags, Sort};

    let everything = match EverythingClient::new() {
        Ok(e) => e,
        Err(_) => return r#"{"results":[],"error":"Everything 服务未运行，请先启动 Everything"}"#.to_string(),
    };

    let list = everything
        .query_wait(query)
        .request_flags(RequestFlags::FileName | RequestFlags::Path | RequestFlags::Size | RequestFlags::Attributes)
        .sort(Sort::NameAscending)
        .max_results(100)
        .call();

    match list {
        Err(e) => {
            let msg = format!("搜索失败: {}", e);
            return format!(r#"{{"results":[],"error":"{}"}}"#, msg.replace('"', "\\\""));
        }
        Ok(list) => {
            let mut results = Vec::new();

            for item in list.iter() {
                let filename = item.get_string(RequestFlags::FileName).unwrap_or_default();
                let path = item.get_string(RequestFlags::Path).unwrap_or_default();
                let full_path = if path.is_empty() {
                    filename.clone()
                } else {
                    format!("{}\\{}", path, filename)
                };

                let size_val = item.get_size(RequestFlags::Size).unwrap_or(0);

                // Check if folder via attributes
                let attrs = item.get_string(RequestFlags::Attributes).unwrap_or_default();
                let is_folder = attrs.contains("D");

                let ext = std::path::Path::new(&filename)
                    .extension()
                    .and_then(|e| e.to_str())
                    .unwrap_or("")
                    .to_lowercase();

                let icon = if is_folder {
                    "📁"
                } else {
                    match ext.as_str() {
                        "exe" | "msi" => "⚙",
                        "doc" | "docx" => "📝",
                        "xls" | "xlsx" => "📊",
                        "pdf" => "📕",
                        "jpg" | "jpeg" | "png" | "gif" | "bmp" | "svg" | "webp" => "🖼",
                        "mp3" | "wav" | "flac" | "aac" | "ogg" => "🎵",
                        "mp4" | "mkv" | "avi" | "mov" | "wmv" => "🎬",
                        "zip" | "rar" | "7z" | "tar" | "gz" => "📦",
                        "txt" | "md" | "log" | "cfg" | "ini" | "toml" | "yaml" | "yml" | "json" => "📄",
                        "rs" | "py" | "js" | "ts" | "go" | "java" | "c" | "cpp" | "h" => "💻",
                        _ => "📄",
                    }
                };

                let size_str = if is_folder {
                    String::new()
                } else {
                    format_size(size_val)
                };

                results.push(serde_json::json!({
                    "title": filename,
                    "subtitle": full_path,
                    "is_folder": is_folder,
                    "size": size_str,
                    "icon": icon,
                }));
            }

            serde_json::json!({
                "results": results,
                "error": null,
            })
            .to_string()
        }
    }
}

fn format_size(bytes: u64) -> String {
    if bytes >= 1073741824 {
        format!("{:.1} GB", bytes as f64 / 1073741824.0)
    } else if bytes >= 1048576 {
        format!("{:.1} MB", bytes as f64 / 1048576.0)
    } else if bytes >= 1024 {
        format!("{:.1} KB", bytes as f64 / 1024.0)
    } else {
        format!("{} B", bytes)
    }
}

// ============================================================
// C ABI Exports
// ============================================================

#[no_mangle]
pub extern "C" fn plugin_create() -> *mut EverythingPlugin {
    Box::into_raw(Box::new(EverythingPlugin))
}

#[no_mangle]
pub extern "C" fn plugin_destroy(p: *mut EverythingPlugin) {
    if !p.is_null() {
        unsafe {
            drop(Box::from_raw(p));
        }
    }
}

#[no_mangle]
pub extern "C" fn plugin_id(_p: *mut EverythingPlugin) -> *const c_char {
    b"everything_search\0".as_ptr() as *const c_char
}

#[no_mangle]
pub extern "C" fn plugin_name(_p: *mut EverythingPlugin) -> *const c_char {
    "Everything 文件搜索\0".as_ptr() as *const c_char
}

#[no_mangle]
pub extern "C" fn plugin_query(_p: *mut EverythingPlugin, q: *const c_char) -> *const c_char {
    let query = unsafe { CStr::from_ptr(q).to_str().unwrap_or("") };

    let results = if query.is_empty() {
        // Return entry point result for empty query
        r#"[{"plugin_id":"everything_search","title":"Everything 文件搜索","subtitle":"搜索文件和文件夹","relevance":0.3,"icon_path":"🔍","action":"open_renderer","template":"default"}]"#
    } else {
        let q_lower = query.to_lowercase();
        if q_lower.contains("ev") || q_lower.contains("文件") || q_lower.contains("搜索") || q_lower.contains("file") || q_lower.contains("search") {
            r#"[{"plugin_id":"everything_search","title":"Everything 文件搜索","subtitle":"搜索文件和文件夹","relevance":0.5,"icon_path":"🔍","action":"open_renderer","template":"default"}]"#
        } else {
            "[]"
        }
    };

    CString::new(results).unwrap().into_raw() as *const c_char
}

#[no_mangle]
pub extern "C" fn plugin_free_results(s: *const c_char) {
    if !s.is_null() {
        unsafe {
            let _ = CString::from_raw(s as *mut _);
        }
    }
}

#[no_mangle]
pub extern "C" fn plugin_invoke(
    _p: *mut EverythingPlugin,
    command: *const c_char,
    args: *const c_char,
) -> *const c_char {
    let cmd = unsafe { CStr::from_ptr(command).to_str().unwrap_or("") };
    let args_str = unsafe { CStr::from_ptr(args).to_str().unwrap_or("{}") };

    let result = match cmd {
        "search" => {
            let query = serde_json::from_str::<serde_json::Value>(args_str)
                .ok()
                .and_then(|v| v["query"].as_str().map(|s| s.to_string()))
                .unwrap_or_default();
            search_everything(&query)
        }
        _ => r#"{"error":"unknown command"}"#.to_string(),
    };

    CString::new(result).unwrap().into_raw() as *const c_char
}