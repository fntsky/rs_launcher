use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc;
use windows_sys::Win32::UI::Input::KeyboardAndMouse::*;
use windows_sys::Win32::UI::WindowsAndMessaging::*;

static HOTKEY_PRESSED: AtomicBool = AtomicBool::new(false);

/// Global channel for sending hotkey reconfiguration from UI thread to background thread.
static HOTKEY_SENDER: std::sync::OnceLock<mpsc::Sender<(u32, u32)>> = std::sync::OnceLock::new();

/// Initialize the global hotkey channel. Must be called before any sender usage.
/// Called early in app startup, before the background thread or UI callbacks.
pub fn init_channel() -> mpsc::Receiver<(u32, u32)> {
    let (tx, rx) = mpsc::channel();
    let _ = HOTKEY_SENDER.set(tx);
    rx
}

/// Get the sender for the UI thread to send hotkey updates.
pub fn new_hotkey_sender() -> mpsc::Sender<(u32, u32)> {
    HOTKEY_SENDER.get().expect("hotkey channel not initialized").clone()
}

pub struct HotKeyManager {
    hwnd: windows_sys::Win32::Foundation::HWND,
    mods: u32,
    vk: u32,
}

impl Drop for HotKeyManager {
    fn drop(&mut self) {
        unsafe {
            UnregisterHotKey(self.hwnd, 1);
            DestroyWindow(self.hwnd);
        }
    }
}

unsafe extern "system" fn hotkey_wnd_proc(
    hwnd: windows_sys::Win32::Foundation::HWND,
    msg: u32,
    wparam: windows_sys::Win32::Foundation::WPARAM,
    lparam: windows_sys::Win32::Foundation::LPARAM,
) -> windows_sys::Win32::Foundation::LRESULT {
    if msg == WM_HOTKEY {
        HOTKEY_PRESSED.store(true, Ordering::Relaxed);
        0
    } else {
        DefWindowProcW(hwnd, msg, wparam, lparam)
    }
}

impl HotKeyManager {
    pub fn new(mods: u32, vk: u32) -> Result<Self, String> {
        unsafe {
            let class_name: Vec<u16> = "RS Launcher Hotkey\0".encode_utf16().collect();
            let hinstance = windows_sys::Win32::System::LibraryLoader::GetModuleHandleW(std::ptr::null());

            let wnd_class = WNDCLASSW {
                lpfnWndProc: Some(hotkey_wnd_proc),
                lpszClassName: class_name.as_ptr(),
                hInstance: hinstance,
                ..std::mem::zeroed()
            };

            RegisterClassW(&wnd_class);

            let hwnd = CreateWindowExW(
                0,
                class_name.as_ptr(),
                std::ptr::null(),
                0,
                0, 0, 0, 0,
                HWND_MESSAGE,
                std::ptr::null_mut(),
                hinstance,
                std::ptr::null_mut(),
            );

            if hwnd.is_null() {
                return Err("Failed to create message-only window".into());
            }

            let result = RegisterHotKey(hwnd, 1, mods, vk);

            if result == 0 {
                let err = std::io::Error::last_os_error();
                DestroyWindow(hwnd);
                return Err(format!("RegisterHotKey failed: {}", err));
            }

            eprintln!("[HOTKEY] Hotkey registered on HWND_MESSAGE window");

            Ok(Self { hwnd, mods, vk })
        }
    }

    /// Re-register with a new hotkey. Returns Ok(()) on success.
    pub fn reregister(&mut self, mods: u32, vk: u32) -> Result<(), String> {
        if self.mods == mods && self.vk == vk {
            return Ok(());
        }
        unsafe {
            UnregisterHotKey(self.hwnd, 1);
            let result = RegisterHotKey(self.hwnd, 1, mods, vk);
            if result == 0 {
                let err = std::io::Error::last_os_error();
                // Try to restore the old hotkey
                let restore = RegisterHotKey(self.hwnd, 1, self.mods, self.vk);
                if restore == 0 {
                    eprintln!("[HOTKEY] Failed to restore old hotkey after reregister failure");
                }
                return Err(format!("RegisterHotKey failed: {}", err));
            }
        }
        self.mods = mods;
        self.vk = vk;
        eprintln!("[HOTKEY] Hotkey reregistered successfully");
        Ok(())
    }

    pub fn poll_toggle(&mut self) -> bool {
        self.pump_message_queue();
        HOTKEY_PRESSED.swap(false, Ordering::Relaxed)
    }

    fn pump_message_queue(&self) {
        unsafe {
            let mut msg = std::mem::zeroed();
            while PeekMessageW(&mut msg, self.hwnd, 0, 0, PM_REMOVE) != 0 {
                TranslateMessage(&msg);
                DispatchMessageW(&msg);
            }
        }
    }
}