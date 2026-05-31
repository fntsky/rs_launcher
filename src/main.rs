mod app;
mod hotkey;
mod tray;

use app::Launcher;

fn main() -> Result<(), slint::PlatformError> {
    Launcher::run()
}
