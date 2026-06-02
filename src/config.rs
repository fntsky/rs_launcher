use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    #[serde(default = "default_mods")]
    pub hotkey_mods: u32,
    #[serde(default = "default_vk")]
    pub hotkey_vk: u32,
}

fn default_mods() -> u32 {
    use windows_sys::Win32::UI::Input::KeyboardAndMouse::*;
    MOD_ALT | MOD_CONTROL | MOD_NOREPEAT
}

fn default_vk() -> u32 {
    windows_sys::Win32::UI::Input::KeyboardAndMouse::VK_SPACE as u32
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            hotkey_mods: default_mods(),
            hotkey_vk: default_vk(),
        }
    }
}

impl AppConfig {
    pub fn load() -> Self {
        let path = Self::config_path();
        if path.exists() {
            if let Ok(data) = std::fs::read_to_string(&path) {
                if let Ok(config) = serde_json::from_str(&data) {
                    return config;
                }
            }
        }
        Self::default()
    }

    pub fn hotkey_display(&self) -> String {
        Self::hotkey_display_from(self.hotkey_mods, self.hotkey_vk)
    }

    pub fn hotkey_display_from(mods: u32, vk: u32) -> String {
        use windows_sys::Win32::UI::Input::KeyboardAndMouse::*;
        let mut parts = Vec::new();
        if mods & MOD_ALT != 0 {
            parts.push("Alt");
        }
        if mods & MOD_CONTROL != 0 {
            parts.push("Ctrl");
        }
        if mods & MOD_SHIFT != 0 {
            parts.push("Shift");
        }
        if mods & MOD_WIN != 0 {
            parts.push("Win");
        }
        let vk_name = vk_to_name(vk);
        parts.push(&vk_name);
        parts.join("+")
    }

    fn config_path() -> PathBuf {
        dirs::config_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("rs_launcher")
            .join("config.json")
    }
}

fn vk_to_name(vk: u32) -> String {
    use windows_sys::Win32::UI::Input::KeyboardAndMouse::*;
    match vk {
        vk if vk == VK_SPACE as u32 => "Space".into(),
        vk if vk == VK_RETURN as u32 => "Enter".into(),
        vk if vk == VK_TAB as u32 => "Tab".into(),
        vk if vk == VK_ESCAPE as u32 => "Esc".into(),
        vk if vk == VK_BACK as u32 => "Backspace".into(),
        vk if vk == VK_DELETE as u32 => "Delete".into(),
        vk if vk == VK_INSERT as u32 => "Insert".into(),
        vk if vk == VK_HOME as u32 => "Home".into(),
        vk if vk == VK_END as u32 => "End".into(),
        vk if vk == VK_PRIOR as u32 => "PageUp".into(),
        vk if vk == VK_NEXT as u32 => "PageDown".into(),
        vk if vk == VK_UP as u32 => "Up".into(),
        vk if vk == VK_DOWN as u32 => "Down".into(),
        vk if vk == VK_LEFT as u32 => "Left".into(),
        vk if vk == VK_RIGHT as u32 => "Right".into(),
        vk if vk == VK_F1 as u32 => "F1".into(),
        vk if vk == VK_F2 as u32 => "F2".into(),
        vk if vk == VK_F3 as u32 => "F3".into(),
        vk if vk == VK_F4 as u32 => "F4".into(),
        vk if vk == VK_F5 as u32 => "F5".into(),
        vk if vk == VK_F6 as u32 => "F6".into(),
        vk if vk == VK_F7 as u32 => "F7".into(),
        vk if vk == VK_F8 as u32 => "F8".into(),
        vk if vk == VK_F9 as u32 => "F9".into(),
        vk if vk == VK_F10 as u32 => "F10".into(),
        vk if vk == VK_F11 as u32 => "F11".into(),
        vk if vk == VK_F12 as u32 => "F12".into(),
        vk if (0x30..=0x39).contains(&vk) => {
            let c = vk as u8 as char;
            format!("{}", c)
        }
        vk if (0x41..=0x5A).contains(&vk) => {
            let c = vk as u8 as char;
            format!("{}", c)
        }
        _ => format!("0x{:02X}", vk),
    }
}
