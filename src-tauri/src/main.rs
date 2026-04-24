#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use std::process::Command;

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      start_backend,
      check_version
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
fn start_backend() {
  let child = Command::new("python3")
    .args(&["backend/server.py"])
    .spawn();

  if let Ok(_child) = child {
    println!("Backend process started");
  } else {
    eprintln!("Failed to start backend");
  }
}

#[tauri::command]
fn check_version() -> String {
  env!("CARGO_PKG_VERSION").to_string()
}
