mod python_runner;
mod file_ops;


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Python runner
            python_runner::detect_python,
            python_runner::run_python_script,
            python_runner::stop_python_script,
            python_runner::is_python_running,
            // File operations
            file_ops::list_projects,
            file_ops::read_file,
            file_ops::write_file,
            file_ops::create_project_dir,
            file_ops::get_file_tree,
            file_ops::delete_file,
            file_ops::file_exists,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
