use iced::window::Id;

#[derive(Debug, Clone)]
#[allow(dead_code)]
pub enum Message {
    SearchChanged(String),
    SearchSubmitted,
    EscapePressed,
    HotkeyPressed,
    TrayQuit,
    WindowOpened(Id),
    WindowCloseRequested(Id),
}
