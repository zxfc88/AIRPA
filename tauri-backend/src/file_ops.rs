use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectEntry {
    pub name: String,
    pub path: String,
    pub r#type: String,  // "ai" or "market"
    pub files: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileNode {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub children: Option<Vec<FileNode>>,
}

#[tauri::command]
pub fn list_projects(workspace_dir: String) -> Result<Vec<ProjectEntry>, String> {
    let dir = PathBuf::from(&workspace_dir);
    if !dir.exists() {
        return Err(format!("目录不存在: {}", workspace_dir));
    }

    let mut projects = Vec::new();
    let entries = fs::read_dir(&dir).map_err(|e| e.to_string())?;

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.is_dir() {
            let has_main = path.join("Main.py").exists();
            if has_main {
                let mut files = Vec::new();
                if let Ok(dir_entries) = fs::read_dir(&path) {
                    for f in dir_entries.flatten() {
                        if let Some(name) = f.file_name().to_str() {
                            files.push(name.to_string());
                        }
                    }
                }
                projects.push(ProjectEntry {
                    name: entry.file_name().to_string_lossy().to_string(),
                    path: path.to_string_lossy().to_string(),
                    r#type: "ai".to_string(),
                    files,
                });
            }
        }
    }
    Ok(projects)
}

#[tauri::command]
pub fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("读取文件失败: {}", e))
}

#[tauri::command]
pub fn write_file(path: String, content: String) -> Result<(), String> {
    if let Some(parent) = PathBuf::from(&path).parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(&path, &content).map_err(|e| format!("写入文件失败: {}", e))
}

#[tauri::command]
pub fn create_project_dir(base_dir: String, project_name: String) -> Result<String, String> {
    let project_path = PathBuf::from(&base_dir).join(&project_name);
    fs::create_dir_all(&project_path).map_err(|e| e.to_string())?;

    let main_py = project_path.join("Main.py");
    let main_content = r#"#!/usr/bin/env python3
"""RPA Automation Script"""

def main():
    print("Starting automation...")
    # TODO: Add your automation logic here
    print("Automation completed.")

if __name__ == "__main__":
    main()
"#;
    fs::write(&main_py, main_content).map_err(|e| e.to_string())?;

    let req_path = project_path.join("requirements.txt");
    fs::write(&req_path, "playwright>=1.40.0\n").map_err(|e| e.to_string())?;

    Ok(project_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn get_file_tree(dir_path: String, depth: i32) -> Result<Vec<FileNode>, String> {
    build_tree(PathBuf::from(&dir_path), depth).map_err(|e| e.to_string())
}

fn build_tree(path: PathBuf, max_depth: i32) -> Result<Vec<FileNode>, std::io::Error> {
    if max_depth <= 0 || !path.is_dir() {
        return Ok(Vec::new());
    }

    let mut nodes = Vec::new();
    let entries = fs::read_dir(&path)?;

    for entry in entries {
        let entry = entry?;
        let name = entry.file_name().to_string_lossy().to_string();
        if name.starts_with('.') || name == "__pycache__" || name == "node_modules" {
            continue;
        }
        let is_dir = entry.file_type()?.is_dir();
        let children = if is_dir {
            Some(build_tree(entry.path(), max_depth - 1)?)
        } else {
            None
        };
        nodes.push(FileNode {
            name,
            path: entry.path().to_string_lossy().to_string(),
            is_dir,
            children,
        });
    }
    nodes.sort_by(|a, b| {
        if a.is_dir != b.is_dir {
            b.is_dir.cmp(&a.is_dir)
        } else {
            a.name.cmp(&b.name)
        }
    });
    Ok(nodes)
}

#[tauri::command]
pub fn delete_file(path: String) -> Result<(), String> {
    let p = PathBuf::from(&path);
    if p.is_dir() {
        fs::remove_dir_all(&p).map_err(|e| format!("删除目录失败: {}", e))
    } else {
        fs::remove_file(&p).map_err(|e| format!("删除文件失败: {}", e))
    }
}

#[tauri::command]
pub fn file_exists(path: String) -> bool {
    PathBuf::from(&path).exists()
}
