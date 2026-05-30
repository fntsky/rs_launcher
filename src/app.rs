use crate::hotkey::HotKeyManager;
use crate::tray::TrayManager;
use eframe::egui;

pub struct LauncherApp {
    visible: bool,
    hotkey_manager: HotKeyManager,
    tray_manager: TrayManager,
    search_text: String,
}

impl LauncherApp {
    pub fn new(
        cc: &eframe::CreationContext<'_>,
        hotkey_manager: HotKeyManager,
        tray_manager: TrayManager,
    ) -> Self {
        cc.egui_ctx.set_visuals(egui::Visuals {
            panel_fill: egui::Color32::TRANSPARENT,
            window_fill: egui::Color32::TRANSPARENT,
            ..egui::Visuals::dark()
        });

        Self {
            visible: false,
            hotkey_manager,
            tray_manager,
            search_text: String::new(),
        }
    }
}

impl eframe::App for LauncherApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        if self.hotkey_manager.poll_toggle() {
            self.visible = !self.visible;
            if self.visible {
                self.search_text.clear();
            }
        }

        if self.tray_manager.poll_quit() {
            std::process::exit(0);
        }

        if self.visible {
            ctx.send_viewport_cmd(egui::ViewportCommand::Visible(true));
            ctx.send_viewport_cmd(egui::ViewportCommand::Focus);
            ctx.request_repaint();
        } else {
            ctx.send_viewport_cmd(egui::ViewportCommand::Visible(false));
            ctx.request_repaint_after(std::time::Duration::from_millis(100));
        }

        if ctx.input(|i| i.viewport().close_requested()) {
            self.visible = false;
            ctx.send_viewport_cmd(egui::ViewportCommand::CancelClose);
            ctx.send_viewport_cmd(egui::ViewportCommand::Visible(false));
        }

        if ctx.input(|i| i.key_pressed(egui::Key::Escape)) {
            self.visible = false;
            ctx.send_viewport_cmd(egui::ViewportCommand::Visible(false));
        }
    }

    fn ui(&mut self, ui: &mut egui::Ui, _frame: &mut eframe::Frame) {
        egui::CentralPanel::default()
            .frame(egui::Frame::NONE)
            .show_inside(ui, |ui| {
                egui::Frame::NONE
                    .fill(egui::Color32::from_rgba_unmultiplied(30, 30, 30, 230))
                    .corner_radius(12.0)
                    .outer_margin(egui::Margin::same(8))
                    .show(ui, |ui| {
                        ui.set_min_size(ui.available_size());

                        ui.vertical_centered(|ui| {
                            ui.add_space(16.0);

                            let response = ui.add(
                                egui::TextEdit::singleline(&mut self.search_text)
                                    .hint_text(
                                        egui::RichText::new("Type to search...")
                                            .color(egui::Color32::from_rgb(120, 120, 120)),
                                    )
                                    .desired_width(540.0)
                                    .font(egui::TextStyle::Monospace)
                                    .text_color(egui::Color32::BLACK),
                            );

                            response.request_focus();

                            ui.add_space(16.0);

                            ui.label(
                                egui::RichText::new("Ctrl+Alt+Space to toggle  |  Esc to close")
                                    .size(11.0)
                                    .color(egui::Color32::from_rgb(100, 100, 100)),
                            );
                        });
                });
            });
    }

    fn clear_color(&self, _visuals: &egui::Visuals) -> [f32; 4] {
        [0.0; 4]
    }
}
