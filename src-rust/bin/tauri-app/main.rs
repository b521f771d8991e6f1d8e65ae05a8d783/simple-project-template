#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rust_embed::Embed;

#[derive(Embed)]
#[folder = "dist/binaries/"]
struct ServerBinary;

fn extract_server() -> std::path::PathBuf {
    let data = ServerBinary::get("server")
        .expect("server binary not embedded");
    let path = std::env::temp_dir()
        .join(format!("{}-server", env!("CARGO_PKG_NAME")));
    std::fs::write(&path, data.data.as_ref())
        .expect("failed to extract server binary");
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o755))
            .expect("failed to set server permissions");
    }
    path
}

fn main() {
    let server_path = extract_server();
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(move |_app| {
            std::process::Command::new(&server_path)
                .spawn()
                .expect("failed to spawn server");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
