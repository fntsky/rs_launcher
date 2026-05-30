use std::sync::atomic::{AtomicBool, Ordering};
use windows_sys::Win32::UI::Input::KeyboardAndMouse::*;
use windows_sys::Win32::UI::WindowsAndMessaging::*;

static HOTKEY_PRESSED: AtomicBool = AtomicBool::new(false);

pub struct HotKeyManager {
    hwnd: windows_sys::Win32::Foundation::HWND,
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
    pub fn new() -> Result<Self, String> {
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

            // MOD_ALT=1, MOD_CONTROL=2, MOD_NOREPEAT=0x4000
            let mods = MOD_ALT | MOD_CONTROL | MOD_NOREPEAT;
            let vk = VK_SPACE as u32;
            let result = RegisterHotKey(hwnd, 1, mods, vk);

            if result == 0 {
                let err = std::io::Error::last_os_error();
                DestroyWindow(hwnd);
                return Err(format!("RegisterHotKey failed: {}", err));
            }

            eprintln!("[HOTKEY] Ctrl+Alt+Space registered on HWND_MESSAGE window");

            Ok(Self { hwnd })
        }
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