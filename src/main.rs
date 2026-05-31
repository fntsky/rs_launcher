mod app;
mod hotkey;
mod message;
mod subscription;
mod tray;

use app::Launcher;

fn main() -> iced::Result {
    iced::daemon(Launcher::new, Launcher::update, Launcher::view)
        .subscription(Launcher::subscription)
        .theme(Launcher::theme)
        .run()
}
