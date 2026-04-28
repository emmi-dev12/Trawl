#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use std::process::Command;

fn python_candidates(app: &tauri::AppHandle) -> Vec<std::path::PathBuf> {
  let resource_dir = app
    .path_resolver()
    .resource_dir()
    .unwrap_or_else(|| std::path::PathBuf::from("."));

  let cwd = std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from("."));
  let mut candidates = Vec::new();

  if let Ok(explicit) = std::env::var("TRAWL_PYTHON") {
    candidates.push(std::path::PathBuf::from(explicit));
  }

  for base in [&cwd, &resource_dir] {
    candidates.push(base.join("backend/.venv/bin/python3"));
    candidates.push(base.join(".venv/bin/python3"));
    candidates.push(base.join("backend/venv/bin/python3"));
    candidates.push(base.join("venv/bin/python3"));
  }

  candidates.push(std::path::PathBuf::from("python3"));
  candidates.push(std::path::PathBuf::from("python"));
  candidates
}

fn start_python_backend(app: &tauri::AppHandle) {
  let script_path = app
    .path_resolver()
    .resolve_resource("backend/server.py")
    .unwrap_or_else(|| std::path::PathBuf::from("backend/server.py"));

  let script_dir = script_path
    .parent()
    .map(std::path::Path::to_path_buf)
    .unwrap_or_else(|| std::path::PathBuf::from("backend"));

  let mut started = false;
  for python in python_candidates(app) {
    let mut command = Command::new(&python);
    command.current_dir(&script_dir).arg(&script_path);

    match command.spawn() {
      Ok(_) => {
        started = true;
        break;
      }
      Err(error) => {
        eprintln!("Failed to start backend with {:?}: {}", python, error);
      }
    }
  }

  if !started {
    eprintln!(
      "Failed to start Python backend. Set TRAWL_PYTHON or create backend/.venv with backend dependencies installed."
    );
  }
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
