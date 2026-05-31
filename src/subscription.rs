use std::sync::mpsc;
use std::time::Duration;

use iced::Subscription;
use iced::futures::stream;

use crate::hotkey::HotKeyManager;
use crate::message::Message;
use crate::tray::TrayManager;

pub fn events() -> Subscription<Message> {
    Subscription::run(|| {
        let (tx, rx) = mpsc::channel();

        std::thread::spawn(move || {
            let mut hotkey = match HotKeyManager::new() {
                Ok(h) => h,
                Err(e) => {
                    eprintln!("[SUBSCRIPTION] Failed to init hotkey: {}", e);
                    return;
                }
            };
            let tray = match TrayManager::new() {
                Ok(t) => t,
                Err(e) => {
                    eprintln!("[SUBSCRIPTION] Failed to init tray: {}", e);
                    return;
                }
            };

            loop {
                std::thread::sleep(Duration::from_millis(50));
                if hotkey.poll_toggle() {
                    if tx.send(Message::HotkeyPressed).is_err() {
                        break;
                    }
                }
                if tray.poll_quit() {
                    if tx.send(Message::TrayQuit).is_err() {
                        break;
                    }
                }
            }
        });

        stream::unfold(rx, |rx| async move {
            loop {
                match rx.try_recv() {
                    Ok(msg) => return Some((msg, rx)),
                    Err(mpsc::TryRecvError::Empty) => {
                        smol::Timer::after(Duration::from_millis(10)).await;
                    }
                    Err(_) => return None,
                }
            }
        })
    })
}
