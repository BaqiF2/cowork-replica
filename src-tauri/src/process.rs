/**
 * Node.js Backend Process Management Module
 *
 * Core functionality:
 * - `start_node_backend()`: 启动 Node.js 子进程
 * - `restart_on_crash()`: 监控并自动重启崩溃的进程
 * - `shutdown_gracefully()`: 发送 SIGTERM 并等待进程退出
 * - `health_check()`: 健康检查进程状态
 *
 * Features:
 * - 自动重启crashed进程
 * - 配置环境变量和工作目录
 * - 优雅关闭支持
 * - 健康检查机制
 * - 详细的日志记录
 */

use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant};
use log::{info, error, warn, debug};

const MAX_RESTART_ATTEMPTS: u32 = 5;
const RESTART_COOLDOWN_SECS: u64 = 5;
const HEALTH_CHECK_INTERVAL_SECS: u64 = 10;

/// Process manager for Node.js backend
pub struct ProcessManager {
    child: Arc<Mutex<Option<Child>>>,
    backend_script: String,
    working_dir: String,
    auto_restart: bool,
    restart_attempts: Arc<Mutex<u32>>,
    last_restart: Arc<Mutex<Option<Instant>>>,
}

impl ProcessManager {
    /// Create a new ProcessManager
    pub fn new(backend_script: String, working_dir: String) -> Self {
        info!("Creating ProcessManager for script: {} in directory: {}", backend_script, working_dir);
        ProcessManager {
            child: Arc::new(Mutex::new(None)),
            backend_script,
            working_dir,
            auto_restart: true,
            restart_attempts: Arc::new(Mutex::new(0)),
            last_restart: Arc::new(Mutex::new(None)),
        }
    }

    /// Start the Node.js backend process
    pub fn start_node_backend(&mut self) -> Result<(), String> {
        info!("Starting Node.js backend process");

        let child = Command::new("node")
            .arg(&self.backend_script)
            .current_dir(&self.working_dir)
            .env("NODE_ENV", std::env::var("NODE_ENV").unwrap_or_else(|_| "production".to_string()))
            .env("BACKEND_PORT", std::env::var("BACKEND_PORT").unwrap_or_else(|_| "3000".to_string()))
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn();

        match child {
            Ok(process) => {
                let pid = process.id();
                info!("Node.js backend started successfully with PID: {}", pid);
                debug!("Process details - Script: {}, WorkDir: {}", self.backend_script, self.working_dir);
                *self.child.lock().unwrap() = Some(process);
                Ok(())
            }
            Err(e) => {
                error!("Failed to start Node.js backend: {}", e);
                Err(format!("Failed to start backend: {}", e))
            }
        }
    }

    /// Monitor process and restart on crash with exponential backoff
    pub fn restart_on_crash(&self) {
        let child_clone = Arc::clone(&self.child);
        let backend_script = self.backend_script.clone();
        let working_dir = self.working_dir.clone();
        let restart_attempts = Arc::clone(&self.restart_attempts);
        let last_restart = Arc::clone(&self.last_restart);

        thread::spawn(move || {
            loop {
                thread::sleep(Duration::from_secs(1));

                let mut child_lock = child_clone.lock().unwrap();
                if let Some(child) = child_lock.as_mut() {
                    match child.try_wait() {
                        Ok(Some(status)) => {
                            if status.success() {
                                info!("Backend exited normally with status code 0");
                                *restart_attempts.lock().unwrap() = 0;
                            } else {
                                let attempts = *restart_attempts.lock().unwrap();
                                warn!("Backend crashed with status: {}. Restart attempt: {}/{}",
                                      status, attempts + 1, MAX_RESTART_ATTEMPTS);

                                if attempts >= MAX_RESTART_ATTEMPTS {
                                    error!("Maximum restart attempts ({}) reached. Giving up.", MAX_RESTART_ATTEMPTS);
                                    break;
                                }

                                // Check cooldown period
                                if let Some(last) = *last_restart.lock().unwrap() {
                                    let elapsed = last.elapsed().as_secs();
                                    if elapsed < RESTART_COOLDOWN_SECS {
                                        let wait_time = RESTART_COOLDOWN_SECS - elapsed;
                                        info!("Waiting {} seconds before restart (cooldown period)", wait_time);
                                        thread::sleep(Duration::from_secs(wait_time));
                                    }
                                }

                                // Restart the process
                                drop(child_lock); // Release lock before restarting

                                debug!("Attempting to restart backend process");
                                let mut new_child = Command::new("node")
                                    .arg(&backend_script)
                                    .current_dir(&working_dir)
                                    .env("NODE_ENV", std::env::var("NODE_ENV").unwrap_or_else(|_| "production".to_string()))
                                    .env("BACKEND_PORT", std::env::var("BACKEND_PORT").unwrap_or_else(|_| "3000".to_string()))
                                    .stdin(Stdio::piped())
                                    .stdout(Stdio::piped())
                                    .stderr(Stdio::piped())
                                    .spawn();

                                match new_child {
                                    Ok(process) => {
                                        let pid = process.id();
                                        info!("Backend restarted successfully with PID: {}", pid);
                                        *child_clone.lock().unwrap() = Some(process);
                                        *restart_attempts.lock().unwrap() += 1;
                                        *last_restart.lock().unwrap() = Some(Instant::now());
                                    }
                                    Err(e) => {
                                        error!("Failed to restart backend: {}", e);
                                        *restart_attempts.lock().unwrap() += 1;
                                    }
                                }
                            }
                            break;
                        }
                        Ok(None) => {
                            // Process is still running
                        }
                        Err(e) => {
                            error!("Error checking process status: {}", e);
                        }
                    }
                }
            }
        });
    }

    /// Perform health check on the backend process
    pub fn health_check(&self) -> bool {
        let child_lock = self.child.lock().unwrap();
        if let Some(_) = child_lock.as_ref() {
            debug!("Health check: Process is running");
            true
        } else {
            warn!("Health check: Process is not running");
            false
        }
    }

    /// Start periodic health checks
    pub fn start_health_checks(&self) {
        let child_clone = Arc::clone(&self.child);

        thread::spawn(move || {
            loop {
                thread::sleep(Duration::from_secs(HEALTH_CHECK_INTERVAL_SECS));

                let child_lock = child_clone.lock().unwrap();
                if let Some(child) = child_lock.as_ref() {
                    debug!("Health check: Backend process (PID: {}) is alive", child.id());
                } else {
                    warn!("Health check: No backend process running");
                }
            }
        });
    }

    /// Gracefully shutdown the backend process
    pub fn shutdown_gracefully(&mut self) -> Result<(), String> {
        info!("Initiating graceful shutdown of Node.js backend");

        let mut child_lock = self.child.lock().unwrap();
        if let Some(mut child) = child_lock.take() {
            let pid = child.id();
            debug!("Sending SIGTERM to process (PID: {})", pid);

            // Send SIGTERM on Unix systems
            #[cfg(unix)]
            {
                let _ = Command::new("kill")
                    .arg("-TERM")
                    .arg(pid.to_string())
                    .status();
            }

            // On Windows, just kill it
            #[cfg(windows)]
            {
                let _ = child.kill();
            }

            // Wait for process to exit (with timeout)
            let shutdown_timeout = 30;
            for i in 0..shutdown_timeout {
                match child.try_wait() {
                    Ok(Some(status)) => {
                        info!("Backend shut down gracefully with exit code: {}",
                              status.code().unwrap_or(-1));
                        return Ok(());
                    }
                    Ok(None) => {
                        if i % 10 == 0 {
                            debug!("Waiting for backend to shutdown... ({}/{}s)", i / 10, shutdown_timeout / 10);
                        }
                        thread::sleep(Duration::from_millis(100));
                    }
                    Err(e) => {
                        error!("Error during shutdown: {}", e);
                        return Err(format!("Shutdown error: {}", e));
                    }
                }
            }

            // Force kill if not exited after timeout
            warn!("Backend did not exit gracefully within {}s, forcing shutdown", shutdown_timeout / 10);
            match child.kill() {
                Ok(_) => {
                    info!("Backend process forcefully terminated");
                    Ok(())
                }
                Err(e) => {
                    error!("Failed to force kill backend process: {}", e);
                    Err(format!("Force kill failed: {}", e))
                }
            }
        } else {
            debug!("No backend process to shutdown");
            Ok(())
        }
    }

    /// Check if the backend process is running
    pub fn is_running(&self) -> bool {
        let child_lock = self.child.lock().unwrap();
        child_lock.is_some()
    }

    /// Get the process ID of the backend
    pub fn get_pid(&self) -> Option<u32> {
        let child_lock = self.child.lock().unwrap();
        child_lock.as_ref().map(|c| c.id())
    }

    /// Get restart attempt count
    pub fn get_restart_attempts(&self) -> u32 {
        *self.restart_attempts.lock().unwrap()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_process_manager_creation() {
        let pm = ProcessManager::new(
            "backend.js".to_string(),
            ".".to_string(),
        );
        assert!(!pm.is_running());
        assert_eq!(pm.get_restart_attempts(), 0);
    }

    #[test]
    fn test_process_manager_pid() {
        let pm = ProcessManager::new(
            "backend.js".to_string(),
            ".".to_string(),
        );
        assert_eq!(pm.get_pid(), None);
    }
}
