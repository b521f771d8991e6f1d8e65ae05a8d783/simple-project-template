fn main() {
    #[cfg(feature = "tauri-app")]
    {
    napi_build::setup();
    tauri_build::build();
    }
}
