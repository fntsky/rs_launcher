mod app;
mod hotkey;
mod icon;
mod plugin;
mod plugins;
mod search;
mod tray;

use app::Launcher;

fn main() -> Result<(), slint::PlatformError> {
    Launcher::run()
}
