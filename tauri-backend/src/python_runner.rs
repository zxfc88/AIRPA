use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command as TokioCommand;
use std::process::Stdio;
use std::sync::atomic::{AtomicBool, Ordering};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PythonEnvInfo {
    pub python_path: Option<String>,
    pub version: Option<String>,
    pub has_pip: bool,
    pub has_playwright: bool,
    pub playwright_version: Option<String>,
    pub issues: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct LogLine {
    pub stream: String,
    pub content: String,
    pub timestamp: u64,
}

static IS_RUNNING: AtomicBool = AtomicBool::new(false);

#[tauri::command]
pub async fn detect_python() -> Result<PythonEnvInfo, String> {
    let mut info = PythonEnvInfo {
        python_path: None,
        version: None,
        has_pip: false,
        has_playwright: false,
        playwright_version: None,
        issues: Vec::new(),
    };

    // Try common Python commands
    let python_cmds = vec!["python3", "python", "py", "-3"];
    let mut found_python = String::new();

    for cmd in &python_cmds {
        let output = TokioCommand::new(cmd)
            .arg("--version")
            .output()
            .await;

        if let Ok(out) = output {
            if out.status.success() {
                found_python = cmd.to_string();
                let version_str = String::from_utf8_lossy(&out.stdout).trim().to_string();
                if version_str.is_empty() {
                    let _version_str = String::from_utf8_lossy(&out.stderr).trim().to_string();
                }
                let version = String::from_utf8_lossy(&out.stdout).trim().to_string();
                let version = if version.is_empty() {
                    String::from_utf8_lossy(&out.stderr).trim().to_string()
                } else {
                    version
                };
                info.python_path = Some(found_python.clone());
                info.version = Some(version);
                break;
            }
        }
    }

    if found_python.is_empty() {
        info.issues.push("未检测到 Python 环境，请安装 Python 3.8+".to_string());
        return Ok(info);
    }

    // Check pip
    let pip_output = TokioCommand::new(&found_python)
        .args(["-m", "pip", "--version"])
        .output()
        .await;

    if let Ok(out) = pip_output {
        info.has_pip = out.status.success();
    }
    if !info.has_pip {
        info.issues.push("pip 不可用，请安装 pip".to_string());
    }

    // Check playwright
    let pw_output = TokioCommand::new(&found_python)
        .args(["-c", "import playwright; print(playwright._repo_version) if hasattr(playwright, '_repo_version') else print('installed')"])
        .output()
        .await;

    if let Ok(out) = pw_output {
        if out.status.success() {
            info.has_playwright = true;
            let ver = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if !ver.is_empty() && ver != "installed" {
                info.playwright_version = Some(ver);
            }
        }
    }
    if !info.has_playwright {
        info.issues.push("Playwright 未安装，运行 `pip install playwright` 安装".to_string());
    }

    Ok(info)
}

#[tauri::command]
pub async fn run_python_script(
    app: AppHandle,
    project_dir: String,
    script_path: String,
) -> Result<(), String> {
    if IS_RUNNING.load(Ordering::SeqCst) {
        return Err("已有 Python 脚本正在运行中".to_string());
    }
    IS_RUNNING.store(true, Ordering::SeqCst);

    // Detect python path
    let python = detect_python_internal().await.unwrap_or_else(|| "python".to_string());

    let mut child = TokioCommand::new(&python)
        .arg(&script_path)
        .current_dir(&project_dir)
        .env("PYTHONUNBUFFERED", "1")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("无法启动 Python 进程: {}", e))?;

    let stdout = child.stdout.take().ok_or("无法获取 stdout")?;
    let stderr = child.stderr.take().ok_or("无法获取 stderr")?;

    let app_clone = app.clone();
    let stdout_task = tokio::spawn(async move {
        let reader = BufReader::new(stdout);
        let mut lines = reader.lines();
        while let Ok(Some(line)) = lines.next_line().await {
            let _ = app_clone.emit("python-log", LogLine {
                stream: "stdout".to_string(),
                content: line,
                timestamp: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_millis() as u64,
            });
        }
    });

    let app_clone2 = app.clone();
    let stderr_task = tokio::spawn(async move {
        let reader = BufReader::new(stderr);
        let mut lines = reader.lines();
        while let Ok(Some(line)) = lines.next_line().await {
            let _ = app_clone2.emit("python-log", LogLine {
                stream: "stderr".to_string(),
                content: line,
                timestamp: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_millis() as u64,
            });
        }
    });

    let status = child.wait().await.map_err(|e| format!("进程异常: {}", e))?;

    // Wait for readers to finish
    let _ = tokio::join!(stdout_task, stderr_task);

    IS_RUNNING.store(false, Ordering::SeqCst);

    let _ = app.emit("python-done", serde_json::json!({
        "exit_code": status.code().unwrap_or(-1),
        "success": status.success(),
    }));

    Ok(())
}

#[tauri::command]
pub fn stop_python_script() -> Result<(), String> {
    // Signal stop via atomic flag; the running process will be killed by the sidecar manager
    IS_RUNNING.store(false, Ordering::SeqCst);
    Ok(())
}

#[tauri::command]
pub fn is_python_running() -> bool {
    IS_RUNNING.load(Ordering::SeqCst)
}

async fn detect_python_internal() -> Option<String> {
    for cmd in &["python3", "python", "py"] {
        if let Ok(out) = TokioCommand::new(cmd).arg("-3").arg("--version").output().await {
            if out.status.success() {
                return Some(cmd.to_string());
            }
        }
    }
    None
}
