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

    pub fn save(&self) -> std::io::Result<()> {
        let path = Self::config_path();
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        let data = serde_json::to_string_pretty(self)?;
        std::fs::write(path, data)
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

/// Convert a Slint key event text to Win32 modifier flags + vk code.
/// Returns None if the key combo is invalid (no modifier, or only modifiers).
pub fn parse_hotkey_from_event(mods: u32, vk: u32) -> Option<(u32, u32)> {
    use windows_sys::Win32::UI::Input::KeyboardAndMouse::*;
    // Must have at least one modifier
    let real_mods = mods & (MOD_ALT | MOD_CONTROL | MOD_SHIFT | MOD_WIN);
    if real_mods == 0 {
        return None;
    }
    // VK must not be a modifier itself
    if vk == VK_SHIFT as u32
        || vk == VK_CONTROL as u32
        || vk == VK_MENU as u32
        || vk == VK_LWIN as u32
        || vk == VK_RWIN as u32
    {
        return None;
    }
    Some((real_mods | MOD_NOREPEAT, vk))
}

/// Convert a Slint key event text string to a Win32 virtual key code.
pub fn slint_key_to_vk(text: &str) -> u32 {
    use windows_sys::Win32::UI::Input::KeyboardAndMouse::*;

    match text {
        " " => VK_SPACE as u32,
        "\n" | "\r" => VK_RETURN as u32,
        "\t" => VK_TAB as u32,
        // Arrow keys (Slint uses F700-F703)
        "\u{F700}" => VK_UP as u32,
        "\u{F701}" => VK_DOWN as u32,
        "\u{F702}" => VK_LEFT as u32,
        "\u{F703}" => VK_RIGHT as u32,
        // Function keys
        "\u{F704}" => VK_F1 as u32,
        "\u{F705}" => VK_F2 as u32,
        "\u{F706}" => VK_F3 as u32,
        "\u{F707}" => VK_F4 as u32,
        "\u{F708}" => VK_F5 as u32,
        "\u{F709}" => VK_F6 as u32,
        "\u{F70A}" => VK_F7 as u32,
        "\u{F70B}" => VK_F8 as u32,
        "\u{F70C}" => VK_F9 as u32,
        "\u{F70D}" => VK_F10 as u32,
        "\u{F70E}" => VK_F11 as u32,
        "\u{F70F}" => VK_F12 as u32,
        // Delete/Insert/Home/End/Page
        "\u{F728}" => VK_DELETE as u32,
        "\u{F729}" => VK_HOME as u32,
        "\u{F72B}" => VK_END as u32,
        "\u{F72C}" => VK_PRIOR as u32,
        "\u{F72D}" => VK_NEXT as u32,
        // Single character — map A-Z and 0-9 to VK codes
        s if s.len() == 1 => {
            let c = s.chars().next().unwrap();
            if c.is_ascii_alphabetic() {
                c.to_ascii_uppercase() as u32
            } else if c.is_ascii_digit() {
                c as u32
            } else {
                // For other printable chars, try VkKeyScanW
                unsafe {
                    let result = windows_sys::Win32::UI::Input::KeyboardAndMouse::VkKeyScanW(c as u16);
                    let vk = (result & 0xFF) as u32;
                    if vk != 0xFF { vk } else { 0 }
                }
            }
        }
        _ => 0,
    }
}
