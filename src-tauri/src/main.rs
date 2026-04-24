#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use std::process::Command;
use tauri::Manager;

fn start_python_backend(app: &tauri::AppHandle) {
  let script_path = app
    .path_resolver()
    .resolve_resource("backend/server.py")
    .unwrap_or_else(|| std::path::PathBuf::from("backend/server.py"));

  let _ = Command::new("python3")
    .arg(script_path)
    .spawn();
}

fn main() {
  tauri::Builder::default()
    .setup(|app| {
      start_python_backend(&app.handle());
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![check_version])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
fn check_version() -> String {
  env!("CARGO_PKG_VERSION").to_string()
}
