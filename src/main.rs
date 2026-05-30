mod hotkey;
mod tray;

use fltk::{app, prelude::*, window::Window, input::Input, frame::Frame, group::Flex, image::RgbImage, enums::ColorDepth};

fn main() {
    let app = app::App::default();

    app::set_scheme(app::Scheme::Gleam);
    app::background(35, 35, 38);
    app::background2(28, 28, 32);
    app::foreground(220, 220, 220);
    app::set_selection_color(74, 144, 217);
    app::set_visible_focus(false);
    app::set_frame_border_radius_max(10);
    app::set_font_size(15);

    let (screen_w, screen_h) = app::screen_size();

    let win_w = 640;
    let win_h = 420;

    let mut win = Window::default()
        .with_size(win_w, win_h)
        .with_pos(
            ((screen_w - win_w as f64) / 2.0) as i32,
            ((screen_h - win_h as f64) / 2.0) as i32,
        )
        .with_label("RS Launcher");
    win.make_resizable(false);
    win.set_border(false);
    win.set_color(fltk::enums::Color::from_hex(0x1e1e22));

    let radius = 12;
    let shape = create_rounded_rect_shape(win_w, win_h, radius);
    win.set_shape(Some(shape));

    let mut outer = Flex::default()
        .with_size(win_w - 32, win_h - 32)
        .center_of(&win);
    outer.set_type(fltk::group::FlexType::Column);
    outer.set_pad(12);

    let mut title = Frame::default();
    title.set_label("RS Launcher");
    title.set_label_size(20);
    title.set_label_color(fltk::enums::Color::from_hex(0x88a4cc));
    title.set_label_font(fltk::enums::Font::HelveticaBold);

    let mut input = Input::default().with_size(0, 36);
    input.set_frame(fltk::enums::FrameType::RFlatBox);
    input.set_color(fltk::enums::Color::from_hex(0x2a2a30));
    input.set_text_color(fltk::enums::Color::from_hex(0xe0e0e0));
    input.set_text_size(18);
    input.set_text_font(fltk::enums::Font::Helvetica);
    input.set_selection_color(fltk::enums::Color::from_hex(0x4a90d9));
    input.set_cursor_color(fltk::enums::Color::from_hex(0x6ea8e0));
    input.set_tooltip("Type to search...");

    let mut divider = Frame::default().with_size(0, 1);
    divider.set_color(fltk::enums::Color::from_hex(0x3a3a42));

    let mut result_area = Frame::default();
    result_area.set_frame(fltk::enums::FrameType::RFlatBox);
    result_area.set_color(fltk::enums::Color::from_hex(0x24242a));
    result_area.set_label("No results");
    result_area.set_label_size(13);
    result_area.set_label_color(fltk::enums::Color::from_hex(0x6a6a72));

    let mut hint = Frame::default();
    hint.set_label("Ctrl+Alt+Space to toggle  |  Esc to close");
    hint.set_label_size(11);
    hint.set_label_color(fltk::enums::Color::from_hex(0x585860));

    outer.end();
    win.end();
    win.show();

    input.take_focus().ok();

    let mut hotkey_manager = hotkey::HotKeyManager::new().expect("failed to initialize hotkey");
    let tray_manager = tray::TrayManager::new().expect("failed to initialize tray");

    let mut visible = true;

    loop {
        if !app.wait() {
            if !visible {
                std::thread::sleep(std::time::Duration::from_millis(50));
                if hotkey_manager.poll_toggle() {
                    visible = true;
                    input.set_value("");
                    win.show();
                    input.take_focus().ok();
                }
                if tray_manager.poll_quit() {
                    std::process::exit(0);
                }
                continue;
            }
            break;
        }

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

        if visible && app::event_key() == fltk::enums::Key::Escape {
            visible = false;
            win.hide();
        }
    }
}

fn create_rounded_rect_shape(w: i32, h: i32, r: i32) -> RgbImage {
    let r = r.min(w / 2).min(h / 2);
    let mut data = Vec::with_capacity((w * h * 4) as usize);
    for y in 0..h {
        for x in 0..w {
            let inside = if x < r && y < r {
                let dx = (r - x - 1) as f64;
                let dy = (r - y - 1) as f64;
                dx * dx + dy * dy <= (r as f64) * (r as f64)
            } else if x >= w - r && y < r {
                let dx = (x - w + r) as f64;
                let dy = (r - y - 1) as f64;
                dx * dx + dy * dy <= (r as f64) * (r as f64)
            } else if x < r && y >= h - r {
                let dx = (r - x - 1) as f64;
                let dy = (y - h + r) as f64;
                dx * dx + dy * dy <= (r as f64) * (r as f64)
            } else if x >= w - r && y >= h - r {
                let dx = (x - w + r) as f64;
                let dy = (y - h + r) as f64;
                dx * dx + dy * dy <= (r as f64) * (r as f64)
            } else {
                true
            };
            let alpha = if inside { 255u8 } else { 0u8 };
            data.extend_from_slice(&[255, 255, 255, alpha]);
        }
    }
    RgbImage::new(&data, w, h, ColorDepth::Rgba8).unwrap()
}
