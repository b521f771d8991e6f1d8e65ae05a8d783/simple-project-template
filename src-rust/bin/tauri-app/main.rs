#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri_plugin_shell::ShellExt;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            app.shell()
                .sidecar("server")
                .expect("failed to create server sidecar command")
                .spawn()
                .expect("failed to spawn server sidecar");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
