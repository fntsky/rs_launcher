mod hotkey;
mod tray;

use fltk::{app, prelude::*, window::Window, input::Input, frame::Frame, group::Flex};

fn main() {
    let app = app::App::default();

    let (screen_w, screen_h) = app::screen_size();

    let mut win = Window::default()
        .with_size(600, 400)
        .with_pos(
            ((screen_w - 600.0) / 2.0) as i32,
            ((screen_h - 400.0) / 2.0) as i32,
        )
        .with_label("RS Launcher");
    win.make_resizable(false);
    win.set_border(false);
    win.set_color(fltk::enums::Color::from_hex(0x1e1e1e));

    let mut flex = Flex::default()
        .with_size(580, 360)
        .center_of(&win);
    flex.set_type(fltk::group::FlexType::Column);
    flex.set_pad(16);
    flex.set_margin(16);

    let mut input = Input::default();
    input.set_tooltip("Type to search...");

    let mut hint = Frame::default();
    hint.set_label("Ctrl+Alt+Space to toggle  |  Esc to close");
    hint.set_label_size(11);
    hint.set_label_color(fltk::enums::Color::from_hex(0x646464));

    flex.end();
    win.end();
    win.show();

    input.take_focus().ok();

    let mut hotkey_manager = hotkey::HotKeyManager::new().expect("failed to initialize hotkey");
    let tray_manager = tray::TrayManager::new().expect("failed to initialize tray");

    let mut visible = true;

    while app.wait() {
        if hotkey_manager.poll_toggle() {
            visible = !visible;
            if visible {
                input.set_value("");
                win.show();
                input.take_focus().ok();
            } else {
                win.hide();
            }
        }

        if tray_manager.poll_quit() {
            std::process::exit(0);
        }

        if app::event_key() == fltk::enums::Key::Escape {
            visible = false;
            win.hide();
        }
    }
}