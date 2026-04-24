#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use std::process::{Command, Child};
use std::sync::Mutex;
use tauri::{SystemTray, SystemTrayMenu, SystemTrayMenuItem, SystemTrayEvent, CustomMenuItem, Manager};

struct AppState {
  backend_process: Mutex<Option<Child>>,
}

fn main() {
  let system_tray_menu = SystemTrayMenu::new()
    .add_item(CustomMenuItem::new("show", "Show"))
    .add_native_item(SystemTrayMenuItem::Separator)
    .add_item(CustomMenuItem::new("check-update", "Check for Updates"))
    .add_native_item(SystemTrayMenuItem::Separator)
    .add_item(CustomMenuItem::new("quit", "Quit"));

  let system_tray = SystemTray::new()
    .with_menu(system_tray_menu);

  tauri::Builder::default()
    .system_tray(system_tray)
    .on_system_tray_event(|app, event| match event {
      SystemTrayEvent::LeftClick { .. } => {
        let window = app.get_window("main");
        if let Some(window) = window {
          let _ = window.show();
          let _ = window.set_focus();
        }
      }
      SystemTrayEvent::MenuItemClick { id, .. } => {
        match id.as_str() {
          "show" => {
            let window = app.get_window("main");
            if let Some(window) = window {
              let _ = window.show();
              let _ = window.set_focus();
            }
          }
          "check-update" => {
            let window = app.get_window("main");
            if let Some(window) = window {
              let _ = window.emit("check-update", ());
            }
          }
          "quit" => {
            std::process::exit(0);
          }
          _ => {}
        }
      }
      _ => {}
    })
    .manage(AppState {
      backend_process: Mutex::new(None),
    })
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

  if let Ok(child) = child {
    // Backend started successfully
    println!("Backend process started");
  } else {
    eprintln!("Failed to start backend");
  }
}

#[tauri::command]
fn check_version() -> String {
  env!("CARGO_PKG_VERSION").to_string()
}
