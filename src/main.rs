mod app;
mod hotkey;
mod tray;

use eframe::egui;

fn main() -> eframe::Result<()> {
    let options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_decorations(false)
            .with_transparent(true)
            .with_inner_size([600.0, 400.0])
            .with_resizable(false)
            .with_title("RS Launcher"),
        centered: true,
        ..Default::default()
    };

    eframe::run_native(
        "RS Launcher",
        options,
        Box::new(|cc| {
            let hotkey_manager = hotkey::HotKeyManager::new().expect("failed to initialize hotkey");
            let tray_manager = tray::TrayManager::new().expect("failed to initialize tray");
            Ok(Box::new(app::LauncherApp::new(cc, hotkey_manager, tray_manager)))
        }),
    )
}