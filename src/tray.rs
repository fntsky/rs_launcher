use tray_icon::{TrayIconBuilder, Icon, menu::{Menu, MenuItem, MenuEvent}};

pub struct TrayManager {
    _tray: tray_icon::TrayIcon,
    quit_id: tray_icon::menu::MenuId,
}

impl TrayManager {
    pub fn new() -> Result<Self, tray_icon::Error> {
        let icon = create_placeholder_icon();

        let quit_item = MenuItem::new("退出", true, None);
        let quit_id = quit_item.id().clone();

        let menu = Menu::new();
        menu.append(&quit_item).expect("failed to append menu item");

        let tray = TrayIconBuilder::new()
            .with_menu(Box::new(menu))
            .with_tooltip("RS Launcher")
            .with_icon(icon)
            .build()?;

        Ok(Self {
            _tray: tray,
            quit_id,
        })
    }

    pub fn poll_quit(&self) -> bool {
        if let Ok(event) = MenuEvent::receiver().try_recv() {
            return event.id == self.quit_id;
        }
        false
    }
}

fn create_placeholder_icon() -> Icon {
    let size: u32 = 32;
    let mut rgba = Vec::with_capacity((size * size * 4) as usize);
    for y in 0..size {
        for x in 0..size {
            let dx = (x as i32 - 16).abs();
            let dy = (y as i32 - 16).abs();
            let in_circle = (dx * dx + dy * dy) <= 14 * 14;
            if in_circle {
                rgba.extend_from_slice(&[80, 160, 255, 255]);
            } else {
                rgba.extend_from_slice(&[0, 0, 0, 0]);
            }
        }
    }
    Icon::from_rgba(rgba, size, size).expect("failed to create icon")
}