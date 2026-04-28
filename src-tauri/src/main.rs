#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use std::process::Command;

fn backend_root(app: &tauri::AppHandle) -> std::path::PathBuf {
  if cfg!(debug_assertions) {
    return std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../backend");
  }

  app
    .path_resolver()
    .resolve_resource("backend")
    .unwrap_or_else(|| std::path::PathBuf::from("backend"))
}

fn python_candidates(app: &tauri::AppHandle, backend_root: &std::path::Path) -> Vec<std::path::PathBuf> {
  let resource_dir = app
    .path_resolver()
    .resource_dir()
    .unwrap_or_else(|| std::path::PathBuf::from("."));

  let cwd = std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from("."));
  let backend_root = backend_root.to_path_buf();
  let backend_parent = backend_root
    .parent()
    .map(std::path::Path::to_path_buf)
    .unwrap_or_else(|| std::path::PathBuf::from("."));
  let mut candidates = Vec::new();

  if let Ok(explicit) = std::env::var("TRAWL_PYTHON") {
    candidates.push(std::path::PathBuf::from(explicit));
  }

  candidates.push(backend_root.join(".venv/bin/python3"));
  candidates.push(backend_root.join(".venv/bin/python"));

  for base in [&backend_parent, &cwd, &resource_dir] {
    candidates.push(base.join("backend/.venv/bin/python3"));
    candidates.push(base.join("backend/.venv/bin/python"));
    candidates.push(base.join(".venv/bin/python3"));
    candidates.push(base.join(".venv/bin/python"));
    candidates.push(base.join("backend/venv/bin/python3"));
    candidates.push(base.join("backend/venv/bin/python"));
    candidates.push(base.join("venv/bin/python3"));
    candidates.push(base.join("venv/bin/python"));
  }

  candidates.push(std::path::PathBuf::from("python3"));
  candidates.push(std::path::PathBuf::from("python"));
  candidates
}

fn start_python_backend(app: &tauri::AppHandle) {
  let backend_root = backend_root(app);
  let script_path = backend_root.join("server.py");

  let mut started = false;
  for python in python_candidates(app, &backend_root) {
    let mut command = Command::new(&python);
    command.current_dir(&backend_root).arg(&script_path);

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
