mod config;
mod icon;
mod plugin;
mod plugins;
mod rs_asset;
mod search;
mod theme;

const RS_SDK_JS: &str = include_str!("../src-ui/src/sdk/rs-sdk.js");
const IFRAME_PROTOCOL_VERSION: &str = "iframe-renderer/1";

use tauri::LogicalPosition;

fn center_window_top(window: &tauri::WebviewWindow) {
    if let Some(monitor) = window.primary_monitor().ok().flatten().or_else(|| {
        window
            .available_monitors()
            .ok()
            .and_then(|m| m.into_iter().next())
    }) {
        let screen_size = monitor.size();
        let scale = monitor.scale_factor();
        let win_size = window.inner_size().unwrap_or_default();
        let x = (screen_size.width as f64 / scale - win_size.width as f64 / scale) / 2.0;
        let y = screen_size.height as f64 / scale * 0.2;
        let _ = window.set_position(LogicalPosition::new(x, y));
    }
}

use serde::Serialize;
use std::sync::{Arc, Mutex};
use tauri::{Manager, State};
use tauri_plugin_global_shortcut::GlobalShortcutExt;

use plugin::{Plugin, PluginEngine, PluginRegistry, SearchResult};

pub struct AppState {
    engine: Arc<PluginEngine>,
    registry: Arc<PluginRegistry>,
    config: Mutex<config::AppConfig>,
}

#[derive(Serialize, Clone)]
pub struct SearchResultDTO {
    pub plugin_id: String,
    pub title: String,
    pub subtitle: String,
    pub relevance: f64,
    pub icon_path: String,
    pub action: String,
    pub template: String,
}

impl From<SearchResult> for SearchResultDTO {
    fn from(r: SearchResult) -> Self {
        Self {
            plugin_id: r.plugin_id,
            title: r.title,
            subtitle: r.subtitle,
            relevance: r.relevance,
            icon_path: r.icon_path,
            action: r.action,
            template: r.template,
        }
    }
}

#[derive(Serialize)]
pub struct ConfigDTO {
    pub hotkey_display: String,
    pub theme: String,
}

#[derive(Serialize, Clone)]
pub struct PluginIframeInit {
    pub plugin_id: String,
    pub sdk_js: String,
    pub base_dir: String,
    pub renderer_path: String,
    pub html_content: String,
    pub query: String,
    pub config: serde_json::Value,
    pub version: String,
}

#[derive(Serialize, Clone)]
pub struct PluginInfoDTO {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: String,
    pub author: String,
    pub has_renderer: bool,
    pub dir: String,
}

#[tauri::command]
fn search(query: String, state: State<'_, AppState>) -> Vec<SearchResultDTO> {
    state
        .engine
        .query(&query)
        .into_iter()
        .map(|r| r.into())
        .collect()
}

#[tauri::command]
fn execute_result(subtitle: String) {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;

    let wide_path: Vec<u16> = OsStr::new(&subtitle)
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();
    let wide_open: Vec<u16> = OsStr::new("open")
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();

    unsafe {
        windows_sys::Win32::UI::Shell::ShellExecuteW(
            std::ptr::null_mut(),
            wide_open.as_ptr(),
            wide_path.as_ptr(),
            std::ptr::null(),
            std::ptr::null(),
            windows_sys::Win32::UI::WindowsAndMessaging::SW_SHOW,
        );
    }
}

#[tauri::command]
fn get_config(state: State<'_, AppState>) -> ConfigDTO {
    let cfg = state.config.lock().unwrap();
    ConfigDTO {
        hotkey_display: cfg.hotkey_display(),
        theme: cfg.theme.clone(),
    }
}

#[tauri::command]
async fn open_settings_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("settings") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    } else {
        tauri::WebviewWindowBuilder::new(
            &app,
            "settings",
            tauri::WebviewUrl::App("index.html#/settings".into()),
        )
        .title("RS Launcher - 设置")
        .inner_size(420.0, 380.0)
        .resizable(true)
        .decorations(true)
        .build()
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn save_hotkey(shortcut_str: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    let app_handle_clone = app_handle.clone();
    register_shortcut_internal(&app_handle_clone, &shortcut_str)
        .map_err(|e| format!("Failed to register shortcut: {}", e))?;
    Ok(())
}

#[tauri::command]
fn plugin_invoke(
    plugin_id: String,
    command: String,
    args: String,
    state: State<'_, AppState>,
) -> String {
    match state.registry.find_dynamic(&plugin_id) {
        Some(dynamic) => match dynamic.invoke(&command, &args) {
            Ok(result) => result,
            Err(e) => format!(r#"{{"error":"{}"}}"#, e),
        },
        None => format!(r#"{{"error":"plugin not found: {}"}}"#, plugin_id),
    }
}

#[tauri::command]
fn get_plugin_iframe_init(
    plugin_id: String,
    query: String,
    state: State<'_, AppState>,
) -> Option<PluginIframeInit> {
    let plugin = state.registry.find_by_id(&plugin_id)?;
    let dynamic = plugin.as_dynamic()?;
    if !dynamic.has_renderer() {
        return None;
    }
    let html_path = dynamic.renderer_path()?;
    if !html_path.exists() {
        return None;
    }
    let html_content = std::fs::read_to_string(&html_path).unwrap_or_default();
    let base_dir = dynamic.plugin_dir().to_string_lossy().to_string();
    let config = serde_json::json!({ "hotkey": "Ctrl+Alt+Space" });
    Some(PluginIframeInit {
        plugin_id,
        sdk_js: RS_SDK_JS.to_string(),
        base_dir,
        renderer_path: html_path.to_string_lossy().to_string(),
        html_content,
        query,
        config,
        version: IFRAME_PROTOCOL_VERSION.to_string(),
    })
}

#[tauri::command]
fn get_plugins(state: State<'_, AppState>) -> Vec<PluginInfoDTO> {
    state
        .registry
        .plugins()
        .iter()
        .map(|p| {
            let dir = p
                .as_dynamic()
                .map(|d| d.plugin_dir().to_string_lossy().to_string())
                .unwrap_or_default();
            PluginInfoDTO {
                id: p.id().to_string(),
                name: p.name().to_string(),
                version: p.version().to_string(),
                description: p.description().to_string(),
                author: p.author().to_string(),
                has_renderer: p.has_renderer(),
                dir,
            }
        })
        .collect()
}

#[tauri::command]
fn open_in_explorer(path: String) {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;

    let wide_path: Vec<u16> = OsStr::new(&path)
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();
    let wide_verb: Vec<u16> = OsStr::new("explore")
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();

    unsafe {
        windows_sys::Win32::UI::Shell::ShellExecuteW(
            std::ptr::null_mut(),
            wide_verb.as_ptr(),
            wide_path.as_ptr(),
            std::ptr::null(),
            std::ptr::null(),
            windows_sys::Win32::UI::WindowsAndMessaging::SW_SHOW,
        );
    }
}

#[tauri::command]
fn open_file_location(path: String) {
    std::process::Command::new("explorer.exe")
        .arg("/select,")
        .arg(&path)
        .spawn()
        .ok();
}

#[tauri::command]
fn list_themes() -> Vec<theme::ThemeInfo> {
    theme::list_themes()
}

#[tauri::command]
fn get_theme(theme_id: String) -> Option<theme::ThemeDTO> {
    theme::get_theme(&theme_id)
}

#[tauri::command]
fn set_theme(theme_id: String, state: State<'_, AppState>) -> Result<theme::ThemeDTO, String> {
    let theme_data = theme::get_theme(&theme_id)
        .ok_or_else(|| format!("主题不存在: {}", theme_id))?;
    {
        let mut cfg = state.config.lock().unwrap();
        cfg.theme = theme_id;
        cfg.save()?;
    }
    Ok(theme_data)
}

fn register_shortcut_internal(
    app: &tauri::AppHandle,
    shortcut_str: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

    // Unregister all existing shortcuts
    let _ = app.global_shortcut().unregister_all();

    // Parse shortcut string
    let shortcut: tauri_plugin_global_shortcut::Shortcut = shortcut_str.parse()?;

    let app_handle = app.clone();
    app.global_shortcut()
        .on_shortcut(shortcut, move |_app, _shortcut, event| {
            if event.state == ShortcutState::Pressed {
                if let Some(window) = app_handle.get_webview_window("main") {
                    let is_visible = window.is_visible().unwrap_or(false);
                    if is_visible {
                        let _ = window.hide();
                    } else {
                        center_window_top(&window);
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
        })?;

    app.global_shortcut().register(shortcut)?;
    Ok(())
}

pub fn run() {
    let registry = Arc::new(plugins::create_registry());
    let engine = Arc::new(PluginEngine::new(registry.clone()));
    let config = config::AppConfig::load();

    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .register_asynchronous_uri_scheme_protocol("rs-asset", |_ctx, request, responder| {
            rs_asset::handle_request(request, responder);
        })
        .manage(AppState {
            engine,
            registry,
            config: Mutex::new(config),
        })
        .invoke_handler(tauri::generate_handler![
            search,
            execute_result,
            get_config,
            open_settings_window,
            save_hotkey,
            plugin_invoke,
            get_plugin_iframe_init,
            get_plugins,
            open_in_explorer,
            open_file_location,
            list_themes,
            get_theme,
            set_theme,
        ])
        .setup(|app| {
            // Register global shortcut
            let shortcut_str = {
                let state = app.state::<AppState>();
                let cfg = state.config.lock().unwrap();
                cfg.hotkey_display()
            };

            // Try to register the configured shortcut, fallback to Ctrl+Alt+Space
            let app_handle = app.handle().clone();
            if let Err(e) = register_shortcut_internal(&app_handle, &shortcut_str) {
                eprintln!(
                    "[LAUNCHER] Failed to register shortcut '{}': {}, trying fallback",
                    shortcut_str, e
                );
                let _ = register_shortcut_internal(&app_handle, "Ctrl+Alt+Space");
            }

            // Setup system tray
            use tauri::menu::{MenuBuilder, MenuItemBuilder};
            use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder};

            let quit_item = MenuItemBuilder::with_id("quit", "退出").build(app)?;
            let menu = MenuBuilder::new(app).item(&quit_item).build()?;

            let app_handle_tray = app.handle().clone();
            TrayIconBuilder::new()
                .menu(&menu)
                .tooltip("RS Launcher")
                .on_menu_event(move |_tray, event| {
                    if event.id() == "quit" {
                        let _ = app_handle_tray.global_shortcut().unregister_all();
                        app_handle_tray.cleanup_before_exit();
                        std::process::exit(0);
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        if let Some(window) = tray.app_handle().get_webview_window("main") {
                            center_window_top(&window);
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            // Show main window after setup
            if let Some(window) = app.get_webview_window("main") {
                #[cfg(target_os = "windows")]
                {
                    let _ = window_vibrancy::apply_acrylic(&window, Some((28, 28, 30, 128)));
                }

                // Position window: horizontally centered, vertically at ~20% of screen
                center_window_top(&window);

                let _ = window.show();
                let _ = window.set_focus();
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
