use crate::plugin::{Plugin, SearchResult};
use crate::search::fuzzy::fuzzy_match;
use crate::icon;

use std::ffi::OsStr;
use std::os::windows::ffi::OsStrExt;
use std::path::{Path, PathBuf};

/// 应用搜索插件 — 扫描 Windows 开始菜单快捷方式
pub struct AppSearchPlugin {
    apps: Vec<AppEntry>,
}

struct AppEntry {
    name: String,
    target_path: String,
    lnk_path: String,
    icon_path: String,
}

impl AppSearchPlugin {
    pub fn new() -> Self {
        let mut apps = Vec::new();

        let user_start = std::env::var("APPDATA")
            .map(|p| PathBuf::from(p).join("Microsoft\\Windows\\Start Menu\\Programs"))
            .ok();

        let common_start = std::env::var("PROGRAMDATA")
            .map(|p| PathBuf::from(p).join("Microsoft\\Windows\\Start Menu\\Programs"))
            .ok();

        if let Some(dir) = &user_start {
            eprintln!("[APP_SEARCH] 扫描用户开始菜单: {}", dir.display());
            scan_lnks(dir, &mut apps);
        }
        if let Some(dir) = &common_start {
            eprintln!("[APP_SEARCH] 扫描公共开始菜单: {}", dir.display());
            scan_lnks(dir, &mut apps);
        }

        // Deduplicate by name (case-insensitive)
        apps.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
        apps.dedup_by(|a, b| a.name.eq_ignore_ascii_case(&b.name));

        eprintln!("[APP_SEARCH] 加载应用总数: {}", apps.len());

        Self { apps }
    }
}

fn scan_lnks(dir: &Path, apps: &mut Vec<AppEntry>) {
    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                scan_lnks(&path, apps);
            } else if path.extension().and_then(|e| e.to_str()) == Some("lnk") {
                if let Some(name) = path.file_stem().and_then(|s| s.to_str()) {
                    let target = resolve_lnk_target(&path);
                    eprintln!("[APP_SEARCH]   发现: {} -> {}", name, if target.is_empty() { "(未知目标)" } else { &target });
                    let icon_path = icon::extract_icon_to_png(&target);
                    apps.push(AppEntry {
                        name: name.to_string(),
                        target_path: target,
                        lnk_path: path.to_string_lossy().to_string(),
                        icon_path,
                    });
                }
            }
        }
    }
}

/// 使用 COM IShellLinkW 解析 .lnk 目标路径
fn resolve_lnk_target(lnk_path: &Path) -> String {
    unsafe {
        // Initialize COM (S_OK=0, S_FALSE=1 means already initialized)
        let hr = windows_sys::Win32::System::Com::CoInitializeEx(
            std::ptr::null(),
            windows_sys::Win32::System::Com::COINIT_APARTMENTTHREADED as u32,
        );

        let result = resolve_lnk_target_inner(lnk_path);

        // Only uninitialize if we successfully initialized (S_OK)
        if hr == 0 {
            windows_sys::Win32::System::Com::CoUninitialize();
        }

        result
    }
}

unsafe fn resolve_lnk_target_inner(lnk_path: &Path) -> String {
    use windows_sys::Win32::System::Com::{CoCreateInstance, CLSCTX_INPROC_SERVER};

    // CLSID_ShellLink: 00021401-0000-0000-C000-000000000046
    let clsid_shell_link = windows_sys::core::GUID::from_u128(0x00021401_0000_0000_C000_000000000046);
    // IID_IShellLinkW: 000214F9-0000-0000-C000-000000000046
    let iid_ishell_link = windows_sys::core::GUID::from_u128(0x000214F9_0000_0000_C000_000000000046);
    // IID_IPersistFile: 0000010B-0000-0000-C000-000000000046
    let iid_ipersist_file = windows_sys::core::GUID::from_u128(0x0000010B_0000_0000_C000_000000000046);

    let mut psl: *mut std::ffi::c_void = std::ptr::null_mut();
    let hr = CoCreateInstance(
        &clsid_shell_link,
        std::ptr::null_mut(),
        CLSCTX_INPROC_SERVER,
        &iid_ishell_link,
        &mut psl,
    );

    if hr != 0 || psl.is_null() {
        return String::new();
    }

    // Query IPersistFile
    let mut ppf: *mut std::ffi::c_void = std::ptr::null_mut();
    let vtbl = &*(*(psl as *mut *mut IShellLinkWVTable));
    let hr = (vtbl.query_interface)(psl, &iid_ipersist_file, &mut ppf);

    if hr != 0 || ppf.is_null() {
        (vtbl.release)(psl);
        return String::new();
    }

    // Load .lnk file
    let wide_path: Vec<u16> = OsStr::new(lnk_path)
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();

    let ppf_vtbl = &*(*(ppf as *mut *mut IPersistFileVTable));
    let hr = (ppf_vtbl.load)(ppf, wide_path.as_ptr(), 0);

    if hr != 0 {
        (ppf_vtbl.release)(ppf);
        (vtbl.release)(psl);
        return String::new();
    }

    // Resolve the link (get target path)
    let mut target_buf = [0u16; 260];
    let hr = (vtbl.get_path)(
        psl,
        target_buf.as_mut_ptr(),
        target_buf.len() as i32,
        std::ptr::null_mut(),
        0, // SLGP_RAWPATH
    );

    // Cleanup
    (ppf_vtbl.release)(ppf);
    (vtbl.release)(psl);

    if hr != 0 {
        return String::new();
    }

    let end = target_buf.iter().position(|&c| c == 0).unwrap_or(260);
    String::from_utf16_lossy(&target_buf[..end])
}

// COM vtable definitions for IShellLinkW and IPersistFile

#[repr(C)]
struct IShellLinkWVTable {
    query_interface: unsafe extern "system" fn(*mut std::ffi::c_void, *const windows_sys::core::GUID, *mut *mut std::ffi::c_void) -> i32,
    add_ref: unsafe extern "system" fn(*mut std::ffi::c_void) -> u32,
    release: unsafe extern "system" fn(*mut std::ffi::c_void) -> u32,
    get_path: unsafe extern "system" fn(*mut std::ffi::c_void, *mut u16, i32, *mut std::ffi::c_void, u32) -> i32,
    get_id_list: unsafe extern "system" fn(*mut std::ffi::c_void, *mut *mut std::ffi::c_void) -> i32,
    set_id_list: unsafe extern "system" fn(*mut std::ffi::c_void, *const std::ffi::c_void) -> i32,
    get_description: unsafe extern "system" fn(*mut std::ffi::c_void, *mut u16, i32) -> i32,
    set_description: unsafe extern "system" fn(*mut std::ffi::c_void, *const u16) -> i32,
    get_working_directory: unsafe extern "system" fn(*mut std::ffi::c_void, *mut u16, i32) -> i32,
    set_working_directory: unsafe extern "system" fn(*mut std::ffi::c_void, *const u16) -> i32,
    get_arguments: unsafe extern "system" fn(*mut std::ffi::c_void, *mut u16, i32) -> i32,
    set_arguments: unsafe extern "system" fn(*mut std::ffi::c_void, *const u16) -> i32,
    get_hotkey: unsafe extern "system" fn(*mut std::ffi::c_void, *mut u16) -> i32,
    set_hotkey: unsafe extern "system" fn(*mut std::ffi::c_void, u16) -> i32,
    get_show_cmd: unsafe extern "system" fn(*mut std::ffi::c_void, *mut i32) -> i32,
    set_show_cmd: unsafe extern "system" fn(*mut std::ffi::c_void, i32) -> i32,
    get_icon_location: unsafe extern "system" fn(*mut std::ffi::c_void, *mut u16, i32, *mut i32) -> i32,
    set_icon_location: unsafe extern "system" fn(*mut std::ffi::c_void, *const u16, i32) -> i32,
    set_relative_path: unsafe extern "system" fn(*mut std::ffi::c_void, *const u16, u32) -> i32,
    resolve: unsafe extern "system" fn(*mut std::ffi::c_void, windows_sys::Win32::Foundation::HWND, u32) -> i32,
    set_path: unsafe extern "system" fn(*mut std::ffi::c_void, *const u16) -> i32,
}

#[repr(C)]
struct IPersistFileVTable {
    query_interface: unsafe extern "system" fn(*mut std::ffi::c_void, *const windows_sys::core::GUID, *mut *mut std::ffi::c_void) -> i32,
    add_ref: unsafe extern "system" fn(*mut std::ffi::c_void) -> u32,
    release: unsafe extern "system" fn(*mut std::ffi::c_void) -> u32,
    get_class_id: unsafe extern "system" fn(*mut std::ffi::c_void, *mut windows_sys::core::GUID) -> i32,
    is_dirty: unsafe extern "system" fn(*mut std::ffi::c_void) -> i32,
    load: unsafe extern "system" fn(*mut std::ffi::c_void, *const u16, u32) -> i32,
    save: unsafe extern "system" fn(*mut std::ffi::c_void, *const u16, i32) -> i32,
    save_completed: unsafe extern "system" fn(*mut std::ffi::c_void, *const u16) -> i32,
    get_cur_file: unsafe extern "system" fn(*mut std::ffi::c_void, *mut *mut u16) -> i32,
}

impl Plugin for AppSearchPlugin {
    fn id(&self) -> &str {
        "app_search"
    }

    fn name(&self) -> &str {
        "应用程序"
    }

    fn query(&self, input: &str) -> Vec<SearchResult> {
        if input.is_empty() {
            return Vec::new();
        }

        let input_lower = input.to_lowercase();
        let mut results: Vec<SearchResult> = self
            .apps
            .iter()
            .filter_map(|app| {
                let relevance = fuzzy_match(&input_lower, &app.name);
                if relevance <= 0.0 {
                    return None;
                }

                eprintln!("[APP_SEARCH] 匹配: {} (相关度: {:.2})", app.name, relevance);
                Some(SearchResult {
                    plugin_id: self.id().to_string(),
                    title: app.name.clone(),
                    subtitle: if app.target_path.is_empty() {
                        app.lnk_path.clone()
                    } else {
                        app.target_path.clone()
                    },
                    relevance,
                    icon_path: app.icon_path.clone(),
                    action: "execute".to_string(),
                    template: "default".to_string(),
                })
            })
            .collect();

        results.sort_by(|a, b| b.relevance.partial_cmp(&a.relevance).unwrap_or(std::cmp::Ordering::Equal));
        results
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn relevance_scoring() {
        let plugin = AppSearchPlugin { apps: vec![
            AppEntry { name: "Chrome".to_string(), target_path: "C:\\chrome.exe".to_string(), lnk_path: String::new(), icon_path: String::new() },
            AppEntry { name: "Chrome Canary".to_string(), target_path: "C:\\canary.exe".to_string(), lnk_path: String::new(), icon_path: String::new() },
            AppEntry { name: "Visual Studio Code".to_string(), target_path: "C:\\code.exe".to_string(), lnk_path: String::new(), icon_path: String::new() },
        ]};

        // Exact match
        let results = plugin.query("chrome");
        assert_eq!(results.len(), 2);
        assert_eq!(results[0].title, "Chrome");
        assert!((results[0].relevance - 1.0).abs() < 0.01);

        // Prefix match (fuzzy_match returns 0.85 + ratio)
        let results = plugin.query("chr");
        assert_eq!(results.len(), 2);
        assert!(results[0].relevance >= 0.85);
        assert!(results[0].relevance < 1.0);

        // Contains match (fuzzy_match returns 0.6 + ratio)
        let results = plugin.query("studio");
        assert_eq!(results.len(), 1);
        assert!(results[0].relevance >= 0.6);
        assert!(results[0].relevance < 0.85);

        // No match
        let results = plugin.query("firefox");
        assert!(results.is_empty());
    }
}
