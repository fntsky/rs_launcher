use std::ops::{Deref, DerefMut};

use fltk::{
    app,
    draw,
    enums::{Color, Font, FrameType},
    input::Input,
    prelude::*,
};

pub struct SearchInput {
    inner: Input,
}

impl SearchInput {
    pub fn new(left_margin: i32) -> Self {
        let mut inner = Input::default();
        inner.set_frame(FrameType::FlatBox);
        inner.set_color(Color::from_hex(0x2a2a30));
        inner.set_text_color(Color::from_hex(0xe0e0e0));
        inner.set_text_size(16);
        inner.set_text_font(Font::Helvetica);
        inner.set_selection_color(Color::from_hex(0x4a90d9));
        inner.set_cursor_color(Color::from_hex(0x6ea8e0));
        inner.set_tooltip("Type to search...");

        let margin = left_margin;
        inner.draw(move |i| {
            let x = i.x();
            let y = i.y();
            let w = i.w();
            let h = i.h();
            let text_color = i.text_color();
            let bg_color = i.color();
            let sel_color = i.selection_color();
            let cursor_color = i.cursor_color();
            let font = i.text_font();
            let font_size = i.text_size();
            let text = i.value();
            let pos = i.position();
            let mark = i.mark();
            let compose = app::compose_state();

            // 1. Draw background
            draw::draw_box(FrameType::FlatBox, x, y, w, h, bg_color);

            let tx = x + margin;

            // 2. Draw selection highlight
            if mark != pos {
                let sel_start = mark.min(pos) as usize;
                let sel_end = mark.max(pos) as usize;
                draw::set_font(font, font_size);
                let before = char_range(&text, 0, sel_start);
                let selected = char_range(&text, sel_start, sel_end);
                let before_w = draw::width(before) as i32;
                let sel_w = draw::width(selected) as i32;
                let text_y = y + (h - font_size) / 2 - 2;
                draw::draw_rect_fill(tx + before_w, text_y, sel_w, font_size + 4, sel_color);
            }

            // 3. Draw text
            draw::set_font(font, font_size);
            draw::set_draw_color(text_color);
            let text_y = y + (h + font_size) / 2 - 2;
            draw::draw_text(&text, tx, text_y);

            // 4. Draw IME composition underline
            if compose > 0 {
                let comp_start = compose as usize;
                let comp_end = pos as usize;
                draw::set_font(font, font_size);
                let before_comp = char_range(&text, 0, comp_start);
                let comp_text = char_range(&text, comp_start, comp_end);
                let before_w = draw::width(before_comp) as i32;
                let comp_w = draw::width(comp_text) as i32;
                let line_y = text_y + 2;
                draw::set_draw_color(text_color);
                draw::draw_line(tx + before_w, line_y, tx + before_w + comp_w, line_y);
            }

            // 5. Draw cursor
            let byte_pos = pos as usize;
            let before_cursor = char_range(&text, 0, byte_pos);
            draw::set_font(font, font_size);
            let offset = draw::width(before_cursor) as i32;
            let cursor_x = tx + offset;
            draw::set_draw_color(cursor_color);
            draw::draw_line(cursor_x, y + 4, cursor_x, y + h - 4);
        });

        Self { inner }
    }
}

fn char_range(text: &str, start: usize, end: usize) -> &str {
    let start = start.min(text.chars().count());
    let end = end.min(text.chars().count());
    if start >= end {
        return "";
    }
    let byte_start = text.char_indices().nth(start).map_or(text.len(), |(i, _)| i);
    let byte_end = text
        .char_indices()
        .nth(end)
        .map_or(text.len(), |(i, _)| i);
    &text[byte_start..byte_end]
}

impl Default for SearchInput {
    fn default() -> Self {
        Self::new(10)
    }
}

impl Deref for SearchInput {
    type Target = Input;

    fn deref(&self) -> &Self::Target {
        &self.inner
    }
}

impl DerefMut for SearchInput {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.inner
    }
}
