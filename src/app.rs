use iced::widget;
use iced::{window, Task};

use crate::message::Message;
use crate::subscription;

const SEARCH_INPUT_ID: &str = "search_input";

fn show_window(id: window::Id, show: bool) -> Task<Message> {
    use raw_window_handle::RawWindowHandle;

    window::run(id, move |win| {
        let handle = match win.window_handle() {
            Ok(h) => h,
            Err(_) => return,
        };
        if let RawWindowHandle::Win32(win32) = handle.as_raw() {
            let hwnd = win32.hwnd.get() as windows_sys::Win32::Foundation::HWND;
            unsafe {
                windows_sys::Win32::UI::WindowsAndMessaging::ShowWindow(
                    hwnd,
                    if show { 5 } else { 0 },
                );
            }
        }
    })
    .map(|_| Message::SearchChanged(String::new()))
}

fn hide_from_taskbar(id: window::Id) -> Task<Message> {
    use raw_window_handle::RawWindowHandle;

    window::run(id, move |win| {
        let handle = match win.window_handle() {
            Ok(h) => h,
            Err(_) => return,
        };
        if let RawWindowHandle::Win32(win32) = handle.as_raw() {
            let hwnd = win32.hwnd.get() as windows_sys::Win32::Foundation::HWND;
            unsafe {
                let ex_style = windows_sys::Win32::UI::WindowsAndMessaging::GetWindowLongW(
                    hwnd,
                    windows_sys::Win32::UI::WindowsAndMessaging::GWL_EXSTYLE,
                );
                // Remove WS_EX_APPWINDOW, add WS_EX_TOOLWINDOW
                let new_style = (ex_style & !(windows_sys::Win32::UI::WindowsAndMessaging::WS_EX_APPWINDOW as i32))
                    | windows_sys::Win32::UI::WindowsAndMessaging::WS_EX_TOOLWINDOW as i32;
                windows_sys::Win32::UI::WindowsAndMessaging::SetWindowLongW(
                    hwnd,
                    windows_sys::Win32::UI::WindowsAndMessaging::GWL_EXSTYLE,
                    new_style,
                );
                // Force the change to take effect
                windows_sys::Win32::UI::WindowsAndMessaging::SetWindowPos(
                    hwnd,
                    windows_sys::Win32::Foundation::HWND::default(),
                    0, 0, 0, 0,
                    windows_sys::Win32::UI::WindowsAndMessaging::SWP_FRAMECHANGED
                        | windows_sys::Win32::UI::WindowsAndMessaging::SWP_NOMOVE
                        | windows_sys::Win32::UI::WindowsAndMessaging::SWP_NOSIZE
                        | windows_sys::Win32::UI::WindowsAndMessaging::SWP_NOZORDER
                        | windows_sys::Win32::UI::WindowsAndMessaging::SWP_NOACTIVATE,
                );
            }
        }
    })
    .map(|_| Message::SearchChanged(String::new()))
}

pub struct Launcher {
    window_id: Option<window::Id>,
    search_query: String,
    visible: bool,
}

impl Launcher {
    pub fn new() -> (Self, Task<Message>) {
        let (id, task) = window::open(window::Settings {
            size: iced::Size::new(640.0, 420.0),
            position: window::Position::Centered,
            decorations: false,
            transparent: true,
            resizable: false,
            exit_on_close_request: false,
            ..Default::default()
        });

        (
            Self {
                window_id: Some(id),
                search_query: String::new(),
                visible: true,
            },
            task.map(Message::WindowOpened),
        )
    }

    pub fn update(&mut self, message: Message) -> Task<Message> {
        match message {
            Message::WindowOpened(id) => {
                self.window_id = Some(id);
                Task::batch([
                    hide_from_taskbar(id),
                    widget::operation::focus(widget::Id::new(SEARCH_INPUT_ID)),
                ])
            }

            Message::SearchChanged(text) => {
                self.search_query = text;
                Task::none()
            }

            Message::EscapePressed | Message::WindowCloseRequested(_) => {
                if let Some(id) = self.window_id {
                    self.visible = false;
                    self.search_query.clear();
                    return show_window(id, false);
                }
                Task::none()
            }

            Message::HotkeyPressed => {
                if let Some(id) = self.window_id {
                    self.visible = !self.visible;
                    if self.visible {
                        self.search_query.clear();
                        return Task::batch([
                            show_window(id, true),
                            window::gain_focus(id),
                            widget::operation::focus(widget::Id::new(SEARCH_INPUT_ID)),
                        ]);
                    } else {
                        return show_window(id, false);
                    }
                }
                Task::none()
            }

            Message::TrayQuit => iced::exit(),

            Message::SearchSubmitted => Task::none(),
        }
    }

    pub fn view(&self, _id: window::Id) -> iced::Element<'_, Message> {
        use iced::widget::{column, container, text, text_input, Space};
        use iced::{Alignment, Border, Color, Length};

        let bg = Color::from_rgb8(0x1e, 0x1e, 0x22);
        let title_color = Color::from_rgb8(0x88, 0xa4, 0xcc);
        let input_bg = Color::from_rgb8(0x2a, 0x2a, 0x30);
        let input_text = Color::from_rgb8(0xe0, 0xe0, 0xe0);
        let divider_color = Color::from_rgb8(0x3a, 0x3a, 0x42);
        let result_bg = Color::from_rgb8(0x24, 0x24, 0x2a);
        let result_text = Color::from_rgb8(0x6a, 0x6a, 0x72);
        let hint_color = Color::from_rgb8(0x58, 0x58, 0x60);
        let selection = Color::from_rgb8(0x4a, 0x90, 0xd9);

        let title = text("RS Launcher").size(20).color(title_color);

        let search = text_input("Type to search...", &self.search_query)
            .id(widget::Id::new(SEARCH_INPUT_ID))
            .on_input(Message::SearchChanged)
            .on_submit(Message::SearchSubmitted)
            .padding([8, 16])
            .size(16)
            .style(move |_theme, _status| text_input::Style {
                background: input_bg.into(),
                border: Border::default().rounded(6.0),
                icon: input_text,
                placeholder: result_text,
                value: input_text,
                selection: selection.into(),
            });

        let divider = container(Space::new().height(Length::Fixed(1.0))).style(move |_| {
            container::Style {
                background: Some(divider_color.into()),
                ..Default::default()
            }
        });

        let result_area = container(text("No results").size(13).color(result_text))
            .padding(16)
            .style(move |_| container::Style {
                background: Some(result_bg.into()),
                border: Border::default().rounded(6.0),
                ..Default::default()
            })
            .width(Length::Fill)
            .height(Length::Fill);

        let hint = text("Ctrl+Alt+Space to toggle  |  Esc to close")
            .size(11)
            .color(hint_color);

        let content = column![
            title,
            Space::new().height(Length::Fixed(12.0)),
            search,
            Space::new().height(Length::Fixed(8.0)),
            divider,
            Space::new().height(Length::Fixed(8.0)),
            result_area,
            Space::new().height(Length::Fixed(8.0)),
            hint,
        ]
        .align_x(Alignment::Center)
        .padding(16);

        container(content)
            .style(move |_| container::Style {
                background: Some(bg.into()),
                border: Border::default().rounded(12.0),
                ..Default::default()
            })
            .width(Length::Fill)
            .height(Length::Fill)
            .into()
    }

    pub fn subscription(&self) -> iced::Subscription<Message> {
        use iced::event;
        use iced::keyboard::{self, key};

        iced::Subscription::batch([
            subscription::events(),
            event::listen_with(|event, _status, _id| match event {
                iced::Event::Keyboard(keyboard::Event::KeyPressed {
                    key: keyboard::Key::Named(key::Named::Escape),
                    ..
                }) => Some(Message::EscapePressed),
                _ => None,
            }),
            window::close_requests().map(Message::WindowCloseRequested),
        ])
    }

    pub fn theme(&self, _id: window::Id) -> iced::Theme {
        iced::Theme::Dark
    }
}
