use std::sync::{Arc, Mutex};

use raw_window_handle::{HasWindowHandle, RawWindowHandle};
use slint::{ComponentHandle, Model};

use crate::hotkey::HotKeyManager;
use crate::plugin::{PluginEngine, SearchResult};
use crate::plugins;
use crate::tray::TrayManager;

slint::include_modules!();

pub struct Launcher;

impl Launcher {
    pub fn run() -> Result<(), slint::PlatformError> {
        let registry = Arc::new(plugins::create_registry());
        let engine = Arc::new(PluginEngine::new(registry));

        let component = LauncherWindow::new()?;
        let visible = Arc::new(Mutex::new(true));

        // Escape pressed callback
        let weak = component.as_weak();
        let vis = visible.clone();
        component.on_key_escape(move || {
            if let Some(comp) = weak.upgrade() {
                *vis.lock().unwrap() = false;
                comp.set_search_query("".into());
                win_hide(&comp.window());
            }
        });

        // Search changed callback — query plugins and update results
        let weak = component.as_weak();
        let engine_query = engine.clone();
        component.on_search_changed(move |text| {
            let input = text.to_string();
            if input.is_empty() {
                if let Some(comp) = weak.upgrade() {
                    comp.set_search_results(std::rc::Rc::new(slint::VecModel::default()).into());
                    comp.set_selected_index(-1);
                }
                return;
            }
            let weak = weak.clone();
            let engine = engine_query.clone();
            std::thread::spawn(move || {
                let results = engine.query(&input);
                let items: Vec<SearchResultItem> = results
                    .iter()
                    .map(|r| SearchResultItem {
                        plugin_id: r.plugin_id.clone().into(),
                        title: r.title.clone().into(),
                        subtitle: r.subtitle.clone().into(),
                        relevance: r.relevance as f32,
                    })
                    .collect();
                let is_empty = items.is_empty();
                let _ = slint::invoke_from_event_loop(move || {
                    if let Some(comp) = weak.upgrade() {
                        comp.set_search_results(std::rc::Rc::new(slint::VecModel::from(items)).into());
                        comp.set_selected_index(if is_empty { -1 } else { 0 });
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
                    };
                    engine_exec.execute(&result);

                    // Hide window after execution
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

        // Show window
        component.show()?;

        // Defer centering and taskbar hiding to next event loop iteration
        let weak_init = component.as_weak();
        slint::Timer::single_shot(std::time::Duration::from_millis(50), move || {
            if let Some(comp) = weak_init.upgrade() {
                center_window(&comp.window());
                hide_from_taskbar(&comp.window());
            }
        });

        // Background thread for hotkey/tray polling
        let weak_bg = component.as_weak();
        let vis_bg = visible.clone();

        std::thread::spawn(move || {
            let mut hotkey = match HotKeyManager::new() {
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
            windows_sys::Win32::UI::WindowsAndMessaging::ShowWindow(hwnd, 0); // SW_HIDE
        }
    }
}

fn win_show(window: &slint::Window) {
    if let Some(hwnd) = get_hwnd(window) {
        unsafe {
            windows_sys::Win32::UI::WindowsAndMessaging::ShowWindow(hwnd, 5); // SW_SHOW
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
                0,
                0,
                0,
                0,
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
    let size = window.size();
    let screen_width = unsafe {
        windows_sys::Win32::UI::WindowsAndMessaging::GetSystemMetrics(
            windows_sys::Win32::UI::WindowsAndMessaging::SM_CXSCREEN,
        )
    };
    let screen_height = unsafe {
        windows_sys::Win32::UI::WindowsAndMessaging::GetSystemMetrics(
            windows_sys::Win32::UI::WindowsAndMessaging::SM_CYSCREEN,
        )
    };

    let x = (screen_width as i32 - size.width as i32) / 2;
    let y = (screen_height as i32 - size.height as i32) / 2;

    window.set_position(slint::PhysicalPosition::new(x, y));
}
