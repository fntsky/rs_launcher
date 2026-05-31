mod app;
mod hotkey;
mod plugin;
mod plugins;
mod tray;

use app::Launcher;

fn main() -> Result<(), slint::PlatformError> {
    Launcher::run()
}
