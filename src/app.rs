use std::sync::{Arc, Mutex};

use raw_window_handle::{HasWindowHandle, RawWindowHandle};
use slint::{ComponentHandle, Model};

use crate::config::AppConfig;
use crate::hotkey::HotKeyManager;
use crate::plugin::{PluginEngine, SearchResult};
use crate::plugins;
use crate::tray::TrayManager;

slint::include_modules!();

pub struct Launcher;

impl Launcher {
    pub fn run() -> Result<(), slint::PlatformError> {
        let config = Arc::new(Mutex::new(AppConfig::load()));
        let registry = Arc::new(plugins::create_registry());
        let engine = Arc::new(PluginEngine::new(registry));

        let component = LauncherWindow::new()?;
        let visible = Arc::new(Mutex::new(true));
        let settings_open = Arc::new(Mutex::new(false));

        // Initialize hotkey channel first — must happen before any callback that uses new_hotkey_sender()
        let hotkey_receiver = crate::hotkey::init_channel();

        // Initialize hotkey display from config
        {
            let cfg = config.lock().unwrap();
            component.set_hotkey_display(cfg.hotkey_display().into());
        }

        // Escape pressed callback
        let weak = component.as_weak();
        let vis = visible.clone();
        let _settings_open_esc = settings_open.clone();
        component.on_key_escape(move || {
            if let Some(comp) = weak.upgrade() {
                *vis.lock().unwrap() = false;
                comp.set_search_query("".into());
                win_hide(&comp.window());
            }
        });

        // Track previous has_input state to avoid unnecessary resizes
        let prev_has_input = Arc::new(Mutex::new(false));

        // Search changed callback — query plugins and update results
        let weak = component.as_weak();
        let engine_query = engine.clone();
        let prev_has_input_clone = prev_has_input.clone();
        component.on_search_changed(move |text| {
            let input = text.to_string();
            let has_input = !input.is_empty();
            let changed = {
                let mut prev = prev_has_input_clone.lock().unwrap();
                let changed = *prev != has_input;
                if changed {
                    *prev = has_input;
                }
                changed
            };
            if let Some(comp) = weak.upgrade() {
                comp.set_selected_index(-1);
                comp.set_has_input(has_input);
                if changed {
                    resize_window(&comp.window(), has_input);
                }
            }
            if input.is_empty() {
                if let Some(comp) = weak.upgrade() {
                    comp.set_search_results(std::rc::Rc::new(slint::VecModel::default()).into());
                }
                return;
            }
            let weak = weak.clone();
            let engine = engine_query.clone();
            std::thread::spawn(move || {
                let results = engine.query(&input);
                let icon_paths: Vec<String> = results.iter().map(|r| r.icon_path.clone()).collect();
                let is_empty = results.is_empty();
                let _ = slint::invoke_from_event_loop(move || {
                    if let Some(comp) = weak.upgrade() {
                        let items: Vec<SearchResultItem> = results
                            .iter()
                            .enumerate()
                            .map(|(i, r)| {
                                let icon = if !icon_paths[i].is_empty() {
                                    slint::Image::load_from_path(std::path::Path::new(&icon_paths[i]))
                                        .unwrap_or_default()
                                } else {
                                    slint::Image::default()
                                };
                                SearchResultItem {
                                    plugin_id: r.plugin_id.clone().into(),
                                    title: r.title.clone().into(),
                                    subtitle: r.subtitle.clone().into(),
                                    relevance: r.relevance as f32,
                                    icon,
                                    has_icon: !icon_paths[i].is_empty(),
                                }
                            })
                            .collect();
                        comp.set_search_results(std::rc::Rc::new(slint::VecModel::from(items)).into());
                        comp.set_selected_index(if is_empty { -1 } else { 0 });
                        comp.set_result_viewport_y(0f32);
                    }
                });
            });
        });

        // Search submitted callback
        let weak = component.as_weak();
        component.on_search_submitted(move || {
            if let Some(comp) = weak.upgrade() {
                let _query = comp.get_search_query();
            }
        });

        // Result selected callback
        let weak = component.as_weak();
        let engine_exec = engine.clone();
        let vis = visible.clone();
        component.on_result_selected(move |index| {
            let weak = weak.clone();
            let vis = vis.clone();
            if let Some(comp) = weak.upgrade() {
                let results = comp.get_search_results();
                if let Some(item) = results.row_data(index as usize) {
                    let result = SearchResult {
                        plugin_id: item.plugin_id.to_string(),
                        title: item.title.to_string(),
                        subtitle: item.subtitle.to_string(),
                        relevance: item.relevance as f64,
                        icon_path: String::new(),
                    };
                    engine_exec.execute(&result);

                    *vis.lock().unwrap() = false;
                    comp.set_search_query("".into());
                    comp.set_search_results(std::rc::Rc::new(slint::VecModel::default()).into());
                    comp.set_selected_index(-1);
                    win_hide(&comp.window());
                }
            }
        });

        // Window close requested - hide instead of close
        let weak = component.as_weak();
        let vis = visible.clone();
        component.window().on_close_requested(move || {
            if let Some(comp) = weak.upgrade() {
                *vis.lock().unwrap() = false;
                comp.set_search_query("".into());
                win_hide(&comp.window());
            }
            slint::CloseRequestResponse::KeepWindowShown
        });

        // Open settings callback — create a new settings window
        let config_settings = config.clone();
        let hotkey_sender = crate::hotkey::new_hotkey_sender();
        let main_weak = component.as_weak();
        component.on_open_settings(move || {
            if *settings_open.lock().unwrap() {
                return;
            }
            *settings_open.lock().unwrap() = true;

            let settings_win = match SettingsWindow::new() {
                Ok(w) => w,
                Err(e) => {
                    eprintln!("[SETTINGS] Failed to create window: {}", e);
                    *settings_open.lock().unwrap() = false;
                    return;
                }
            };

            let cfg = config_settings.lock().unwrap();
            settings_win.set_hotkey_display(cfg.hotkey_display().into());
            drop(cfg);

            // Close callback
            let so = settings_open.clone();
            let sw_weak = settings_win.as_weak();
            settings_win.on_close(move || {
                if let Some(sw) = sw_weak.upgrade() {
                    sw.set_hotkey_capturing(false);
                    let _ = sw.window().hide();
                }
                *so.lock().unwrap() = false;
            });

            // Hotkey captured callback
            let cfg = config_settings.clone();
            let sender = hotkey_sender.clone();
            let mw = main_weak.clone();
            let sw_weak2 = settings_win.as_weak();
            settings_win.on_hotkey_captured(move |shift, ctrl, alt, meta, key_text| {
                use windows_sys::Win32::UI::Input::KeyboardAndMouse::*;

                let mut win_mods: u32 = 0;
                if ctrl { win_mods |= MOD_CONTROL; }
                if alt { win_mods |= MOD_ALT; }
                if shift { win_mods |= MOD_SHIFT; }
                if meta { win_mods |= MOD_WIN; }

                let vk = crate::config::slint_key_to_vk(&key_text);
                if let Some((new_mods, new_vk)) = crate::config::parse_hotkey_from_event(win_mods, vk) {
                    {
                        let mut c = cfg.lock().unwrap();
                        c.hotkey_mods = new_mods;
                        c.hotkey_vk = new_vk;
                        let _ = c.save();
                    }

                    let display = crate::config::AppConfig::hotkey_display_from(new_mods, new_vk);

                    if let Some(sw) = sw_weak2.upgrade() {
                        sw.set_hotkey_display(display.clone().into());
                        sw.set_hotkey_capturing(false);
                    }

                    // Update main window display
                    if let Some(mw) = mw.upgrade() {
                        mw.set_hotkey_display(display.into());
                    }

                    let _ = sender.send((new_mods, new_vk));
                }
            });

            // Settings window close requested
            let so2 = settings_open.clone();
            settings_win.window().on_close_requested(move || {
                *so2.lock().unwrap() = false;
                slint::CloseRequestResponse::HideWindow
            });

            if let Err(e) = settings_win.show() {
                eprintln!("[SETTINGS] Failed to show window: {}", e);
                *settings_open.lock().unwrap() = false;
            }
        });

        // Show window
        component.show()?;

        // Defer centering, taskbar hiding, and rounded corner setup
        let weak_init = component.as_weak();
        slint::Timer::single_shot(std::time::Duration::from_millis(50), move || {
            if let Some(comp) = weak_init.upgrade() {
                center_window(&comp.window());
                hide_from_taskbar(&comp.window());
                set_rounded_corners(&comp.window());
            }
        });

        // Background thread for hotkey/tray polling
        let weak_bg = component.as_weak();
        let vis_bg = visible.clone();

        let (initial_mods, initial_vk) = {
            let cfg = config.lock().unwrap();
            (cfg.hotkey_mods, cfg.hotkey_vk)
        };

        std::thread::spawn(move || {
            let mut hotkey = match HotKeyManager::new(initial_mods, initial_vk) {
                Ok(h) => Some(h),
                Err(e) => {
                    eprintln!("[LAUNCHER] Failed to init hotkey: {}", e);
                    None
                }
            };

            let tray = match TrayManager::new() {
                Ok(t) => Some(t),
                Err(e) => {
                    eprintln!("[LAUNCHER] Failed to init tray: {}", e);
                    None
                }
            };

            loop {
                std::thread::sleep(std::time::Duration::from_millis(50));

                // Check for hotkey reconfiguration
                if let Ok((new_mods, new_vk)) = hotkey_receiver.try_recv() {
                    if let Some(ref mut h) = hotkey {
                        if let Err(e) = h.reregister(new_mods, new_vk) {
                            eprintln!("[LAUNCHER] Failed to reregister hotkey: {}", e);
                        }
                    }
                }

                // Poll hotkey
                if let Some(ref mut h) = hotkey {
                    if h.poll_toggle() {
                        let weak = weak_bg.clone();
                        let vis = vis_bg.clone();
                        let _ = slint::invoke_from_event_loop(move || {
                            if let Some(comp) = weak.upgrade() {
                                let is_visible = *vis.lock().unwrap();
                                if is_visible {
                                    *vis.lock().unwrap() = false;
                                    comp.set_search_query("".into());
                                    comp.set_search_results(std::rc::Rc::new(slint::VecModel::default()).into());
                                    comp.set_selected_index(-1);
                                    win_hide(&comp.window());
                                } else {
                                    *vis.lock().unwrap() = true;
                                    comp.set_search_query("".into());
                                    comp.set_search_results(std::rc::Rc::new(slint::VecModel::default()).into());
                                    comp.set_selected_index(-1);
                                    win_show(&comp.window());
                                    let weak = comp.as_weak();
                                    slint::Timer::single_shot(
                                        std::time::Duration::from_millis(50),
                                        move || {
                                            if let Some(comp) = weak.upgrade() {
                                                center_window(&comp.window());
                                                hide_from_taskbar(&comp.window());
                                            }
                                        },
                                    );
                                }
                            }
                        });
                    }
                }

                // Poll tray quit
                if let Some(ref t) = tray {
                    if t.poll_quit() {
                        let _ = slint::invoke_from_event_loop(|| {
                            let _ = slint::quit_event_loop();
                        });
                        break;
                    }
                }
            }
        });

        component.run()
    }
}

fn get_hwnd(window: &slint::Window) -> Option<windows_sys::Win32::Foundation::HWND> {
    let wh = window.window_handle();
    let handle = wh.window_handle().ok()?;
    if let RawWindowHandle::Win32(win32) = handle.as_raw() {
        Some(win32.hwnd.get() as windows_sys::Win32::Foundation::HWND)
    } else {
        None
    }
}

fn win_hide(window: &slint::Window) {
    if let Some(hwnd) = get_hwnd(window) {
        unsafe {
            windows_sys::Win32::UI::WindowsAndMessaging::ShowWindow(hwnd, 0);
        }
    }
}

fn win_show(window: &slint::Window) {
    if let Some(hwnd) = get_hwnd(window) {
        unsafe {
            windows_sys::Win32::UI::WindowsAndMessaging::ShowWindow(hwnd, 5);
        }
    }
}

fn hide_from_taskbar(window: &slint::Window) {
    if let Some(hwnd) = get_hwnd(window) {
        unsafe {
            let ex_style = windows_sys::Win32::UI::WindowsAndMessaging::GetWindowLongW(
                hwnd,
                windows_sys::Win32::UI::WindowsAndMessaging::GWL_EXSTYLE,
            );
            let new_style = (ex_style
                & !(windows_sys::Win32::UI::WindowsAndMessaging::WS_EX_APPWINDOW as i32))
                | windows_sys::Win32::UI::WindowsAndMessaging::WS_EX_TOOLWINDOW as i32;
            windows_sys::Win32::UI::WindowsAndMessaging::SetWindowLongW(
                hwnd,
                windows_sys::Win32::UI::WindowsAndMessaging::GWL_EXSTYLE,
                new_style,
            );
            windows_sys::Win32::UI::WindowsAndMessaging::SetWindowPos(
                hwnd,
                windows_sys::Win32::Foundation::HWND::default(),
                0, 0, 0, 0,
                windows_sys::Win32::UI::WindowsAndMessaging::SWP_FRAMECHANGED
                    | windows_sys::Win32::UI::WindowsAndMessaging::SWP_NOMOVE
                    | windows_sys::Win32::UI::WindowsAndMessaging::SWP_NOSIZE
                    | windows_sys::Win32::UI::WindowsAndMessaging::SWP_NOZORDER
                    | windows_sys::Win32::UI::WindowsAndMessaging::SWP_NOACTIVATE,
            );
        }
    }
}

fn center_window(window: &slint::Window) {
    if let Some(hwnd) = get_hwnd(window) {
        unsafe {
            if let Some(screen) = get_screen_rect(hwnd) {
                let dpi = windows_sys::Win32::UI::HiDpi::GetDpiForWindow(hwnd);
                let scale = dpi as f64 / 96.0;
                let physical_width = (640.0 * scale) as i32;
                let physical_height = (80.0 * scale) as i32;

                let screen_width = screen.right - screen.left;
                let screen_height = screen.bottom - screen.top;
                let x = screen.left + (screen_width - physical_width) / 2;
                let y = screen.top + screen_height / 4 - 40;

                windows_sys::Win32::UI::WindowsAndMessaging::SetWindowPos(
                    hwnd,
                    std::ptr::null_mut(),
                    x, y,
                    physical_width,
                    physical_height,
                    windows_sys::Win32::UI::WindowsAndMessaging::SWP_NOZORDER
                        | windows_sys::Win32::UI::WindowsAndMessaging::SWP_NOACTIVATE,
                );
            }
        }
    }
    window.set_size(slint::LogicalSize::new(640.0, 80.0));
}

fn get_screen_rect(hwnd: windows_sys::Win32::Foundation::HWND) -> Option<windows_sys::Win32::Foundation::RECT> {
    unsafe {
        use windows_sys::Win32::Graphics::Gdi::{MonitorFromWindow, MONITOR_DEFAULTTOPRIMARY, GetMonitorInfoW, MONITORINFO};
        let hmonitor = MonitorFromWindow(hwnd, MONITOR_DEFAULTTOPRIMARY);
        let mut monitor_info = std::mem::zeroed::<MONITORINFO>();
        monitor_info.cbSize = std::mem::size_of::<MONITORINFO>() as u32;
        if GetMonitorInfoW(hmonitor, &mut monitor_info) != 0 {
            Some(monitor_info.rcWork)
        } else {
            None
        }
    }
}

fn resize_window(window: &slint::Window, has_input: bool) {
    let target_height = if has_input { 420.0 } else { 80.0 };

    if let Some(hwnd) = get_hwnd(window) {
        unsafe {
            if let Some(screen) = get_screen_rect(hwnd) {
                let dpi = windows_sys::Win32::UI::HiDpi::GetDpiForWindow(hwnd);
                let scale = dpi as f64 / 96.0;
                let physical_width = (640.0 * scale) as i32;
                let physical_height = (target_height * scale) as i32;

                let screen_width = screen.right - screen.left;
                let screen_height = screen.bottom - screen.top;
                let x = screen.left + (screen_width - physical_width) / 2;
                let y = screen.top + screen_height / 4 - 40;

                windows_sys::Win32::UI::WindowsAndMessaging::SetWindowPos(
                    hwnd,
                    std::ptr::null_mut(),
                    x, y,
                    physical_width,
                    physical_height,
                    windows_sys::Win32::UI::WindowsAndMessaging::SWP_NOZORDER
                        | windows_sys::Win32::UI::WindowsAndMessaging::SWP_NOACTIVATE,
                );
            }
        }
    }
    window.set_size(slint::LogicalSize::new(640.0, target_height as f32));
}

fn set_rounded_corners(window: &slint::Window) {
    if let Some(hwnd) = get_hwnd(window) {
        unsafe {
            use windows_sys::Win32::Foundation::RECT;
            use windows_sys::Win32::Graphics::Dwm::DwmSetWindowAttribute;
            use windows_sys::Win32::UI::WindowsAndMessaging::GetWindowRect;

            const DWMWA_WINDOW_CORNER_PREFERENCE: u32 = 33;
            const DWMWCP_ROUND: u32 = 2;

            let preference = DWMWCP_ROUND;
            DwmSetWindowAttribute(
                hwnd,
                DWMWA_WINDOW_CORNER_PREFERENCE,
                &preference as *const _ as *const _,
                std::mem::size_of::<u32>() as u32,
            );

            let mut rect: RECT = std::mem::zeroed();
            GetWindowRect(hwnd, &mut rect);
            let width = rect.right - rect.left;
            let height = rect.bottom - rect.top;
            let hrgn = windows_sys::Win32::Graphics::Gdi::CreateRoundRectRgn(
                0, 0, width, height, 12, 12,
            );
            if !hrgn.is_null() {
                windows_sys::Win32::UI::WindowsAndMessaging::SetWindowPos(
                    hwnd,
                    std::ptr::null_mut(),
                    0, 0, 0, 0,
                    windows_sys::Win32::UI::WindowsAndMessaging::SWP_FRAMECHANGED
                        | windows_sys::Win32::UI::WindowsAndMessaging::SWP_NOMOVE
                        | windows_sys::Win32::UI::WindowsAndMessaging::SWP_NOSIZE
                        | windows_sys::Win32::UI::WindowsAndMessaging::SWP_NOZORDER
                        | windows_sys::Win32::UI::WindowsAndMessaging::SWP_NOACTIVATE,
                );
            }
        }
    }
}
