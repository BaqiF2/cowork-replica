/**
 * IPC Bridge Module for Rust
 *
 * Provides the communication bridge between Node.js backend and SolidJS frontend.
 *
 * Core functionality:
 * - `handle_stdin()`: 监听 Node.js stdout 并解析
 * - `forward_to_frontend()`: 通过 Tauri emit 推送到前端
 * - `handle_frontend_invoke()`: 处理前端 invoke 调用并转发到 Node.js stdin
 *
 * Message Flow:
 * Node.js stdout -> Rust (parse_stdin_message) -> Tauri emit -> SolidJS
 * SolidJS invoke -> Rust (handle_frontend_invoke) -> Node.js stdin
 *
 * Enhanced features:
 * - Message queue for buffered sending
 * - Improved error handling with typed errors
 * - Request timeout management
 *
 * _Requirements: IPC 通信层实现_
 * _Scenarios: Node.js 到 Rust 的消息发送, Rust 到 SolidJS 的事件推送_
 * _TaskGroup: 5_
 */

use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::{HashMap, VecDeque};
use std::io::{BufRead, BufReader, Write};
use std::process::{ChildStdin, ChildStdout};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant};
use log::{info, error, warn, debug};

/// IPC Message types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum IPCMessageType {
    Event,
    Request,
    Response,
}

/// IPC Error types for better error handling
#[derive(Debug, Clone)]
pub enum IPCError {
    /// Failed to serialize/deserialize message
    SerializationError(String),
    /// Node.js stdin not available
    StdinNotAvailable,
    /// Failed to send message
    SendError(String),
    /// Request timed out
    Timeout(String),
    /// Message parsing error
    ParseError(String),
    /// Generic error
    Other(String),
}

impl std::fmt::Display for IPCError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            IPCError::SerializationError(msg) => write!(f, "Serialization error: {}", msg),
            IPCError::StdinNotAvailable => write!(f, "Node.js stdin not available"),
            IPCError::SendError(msg) => write!(f, "Send error: {}", msg),
            IPCError::Timeout(msg) => write!(f, "Request timeout: {}", msg),
            IPCError::ParseError(msg) => write!(f, "Parse error: {}", msg),
            IPCError::Other(msg) => write!(f, "IPC error: {}", msg),
        }
    }
}

impl std::error::Error for IPCError {}

/// Convert IPCError to String for backward compatibility
impl From<IPCError> for String {
    fn from(err: IPCError) -> String {
        err.to_string()
    }
}

/// IPC Message structure
///
/// This is the standard message format used for all IPC communication
/// between Node.js, Rust, and SolidJS.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IPCMessage {
    /// Optional message ID for request/response correlation
    pub id: Option<String>,
    /// Message type: event, request, or response
    #[serde(rename = "msg_type")]
    pub msg_type: IPCMessageType,
    /// Event name or command name
    pub event: String,
    /// Message payload (JSON value)
    pub payload: Value,
    /// Optional error message
    pub error: Option<String>,
}

impl IPCMessage {
    /// Create a new event message
    pub fn event(event: &str, payload: Value) -> Self {
        IPCMessage {
            id: None,
            msg_type: IPCMessageType::Event,
            event: event.to_string(),
            payload,
            error: None,
        }
    }

    /// Create a new request message
    pub fn request(id: &str, event: &str, payload: Value) -> Self {
        IPCMessage {
            id: Some(id.to_string()),
            msg_type: IPCMessageType::Request,
            event: event.to_string(),
            payload,
            error: None,
        }
    }

    /// Create a new response message
    pub fn response(id: &str, event: &str, payload: Value) -> Self {
        IPCMessage {
            id: Some(id.to_string()),
            msg_type: IPCMessageType::Response,
            event: event.to_string(),
            payload,
            error: None,
        }
    }

    /// Create an error response message
    pub fn error_response(id: &str, event: &str, error: &str) -> Self {
        IPCMessage {
            id: Some(id.to_string()),
            msg_type: IPCMessageType::Response,
            event: event.to_string(),
            payload: Value::Null,
            error: Some(error.to_string()),
        }
    }
}

/// Parse a message from stdin (received from Node.js stdout)
///
/// # Arguments
/// * `raw_message` - Raw JSON string from Node.js stdout
///
/// # Returns
/// * `Ok(IPCMessage)` - Parsed message
/// * `Err(String)` - Parse error description
pub fn parse_stdin_message(raw_message: &str) -> Result<IPCMessage, String> {
    let trimmed = raw_message.trim();
    if trimmed.is_empty() {
        return Err("Empty message".to_string());
    }

    serde_json::from_str(trimmed)
        .map_err(|e| format!("Failed to parse message: {} - Input: {}", e, trimmed))
}

/// Encode a message for sending to Node.js stdin
///
/// # Arguments
/// * `msg` - IPC message to encode
///
/// # Returns
/// * `Ok(String)` - JSON encoded message with newline delimiter
/// * `Err(String)` - Encoding error description
pub fn encode_message_for_stdin(msg: &IPCMessage) -> Result<String, String> {
    serde_json::to_string(msg)
        .map(|s| format!("{}\n", s))
        .map_err(|e| format!("Failed to encode message: {}", e))
}

/// Extract event name and payload for forwarding to frontend
///
/// This function prepares the data needed for Tauri's emit API
///
/// # Arguments
/// * `msg` - IPC message to forward
///
/// # Returns
/// * Tuple of (event_name, payload)
pub fn forward_to_frontend(msg: &IPCMessage) -> (String, Value) {
    let event_name = msg.event.clone();

    // Construct the payload to send to frontend
    let mut payload = msg.payload.clone();

    // If payload is an object, keep it as-is
    // If it's null or a primitive, wrap it or pass directly
    if !payload.is_object() {
        payload = payload;
    }

    (event_name, payload)
}

/// IPC Bridge manager for handling communication
pub struct IPCBridge {
    stdin: Arc<Mutex<Option<ChildStdin>>>,
    pending_requests: Arc<Mutex<HashMap<String, PendingRequest>>>,
    event_handlers: Arc<Mutex<HashMap<String, Vec<Box<dyn Fn(Value) + Send + 'static>>>>>,
    /// Message queue for buffered sending when stdin is not ready
    message_queue: Arc<Mutex<VecDeque<IPCMessage>>>,
    /// Default request timeout in seconds
    request_timeout_secs: u64,
}

/// Default timeout for requests (30 seconds)
const DEFAULT_REQUEST_TIMEOUT_SECS: u64 = 30;

struct PendingRequest {
    #[allow(dead_code)]
    event: String,
    callback: Box<dyn FnOnce(Result<Value, String>) + Send + 'static>,
    /// When the request was created
    created_at: Instant,
    /// Timeout duration for this request
    timeout: Duration,
}

impl IPCBridge {
    /// Create a new IPC bridge
    pub fn new() -> Self {
        info!("Creating new IPC Bridge");
        IPCBridge {
            stdin: Arc::new(Mutex::new(None)),
            pending_requests: Arc::new(Mutex::new(HashMap::new())),
            event_handlers: Arc::new(Mutex::new(HashMap::new())),
            message_queue: Arc::new(Mutex::new(VecDeque::new())),
            request_timeout_secs: DEFAULT_REQUEST_TIMEOUT_SECS,
        }
    }

    /// Create a new IPC bridge with custom timeout
    pub fn with_timeout(timeout_secs: u64) -> Self {
        info!("Creating new IPC Bridge with timeout: {}s", timeout_secs);
        IPCBridge {
            stdin: Arc::new(Mutex::new(None)),
            pending_requests: Arc::new(Mutex::new(HashMap::new())),
            event_handlers: Arc::new(Mutex::new(HashMap::new())),
            message_queue: Arc::new(Mutex::new(VecDeque::new())),
            request_timeout_secs: timeout_secs,
        }
    }

    /// Set the Node.js process stdin for sending messages
    pub fn set_stdin(&self, stdin: ChildStdin) {
        debug!("Setting Node.js stdin for IPC bridge");
        *self.stdin.lock().unwrap() = Some(stdin);

        // Flush any queued messages
        self.flush_message_queue();
    }

    /// Flush queued messages to stdin
    fn flush_message_queue(&self) {
        let mut queue = self.message_queue.lock().unwrap();
        let mut stdin_guard = self.stdin.lock().unwrap();

        if let Some(ref mut stdin) = *stdin_guard {
            while let Some(msg) = queue.pop_front() {
                if let Ok(encoded) = encode_message_for_stdin(&msg) {
                    if let Err(e) = stdin.write_all(encoded.as_bytes()) {
                        warn!("Failed to flush queued message: {}", e);
                        // Put the message back at the front of the queue
                        queue.push_front(msg);
                        break;
                    }
                }
            }
            let _ = stdin.flush();
        }
    }

    /// Start listening to Node.js stdout
    ///
    /// This spawns a thread that reads from stdout and processes messages
    pub fn start_stdout_listener<F>(&self, stdout: ChildStdout, on_message: F)
    where
        F: Fn(IPCMessage) + Send + 'static,
    {
        info!("Starting stdout listener for IPC bridge");
        let pending_requests = Arc::clone(&self.pending_requests);
        let event_handlers = Arc::clone(&self.event_handlers);

        thread::spawn(move || {
            let reader = BufReader::new(stdout);

            for line in reader.lines() {
                match line {
                    Ok(content) => {
                        if content.trim().is_empty() {
                            continue;
                        }

                        debug!("Received from Node.js: {}", content);

                        match parse_stdin_message(&content) {
                            Ok(msg) => {
                                // Handle response messages
                                if matches!(msg.msg_type, IPCMessageType::Response) {
                                    if let Some(id) = &msg.id {
                                        let mut requests = pending_requests.lock().unwrap();
                                        if let Some(pending) = requests.remove(id) {
                                            let result = if let Some(err) = &msg.error {
                                                Err(err.clone())
                                            } else {
                                                Ok(msg.payload.clone())
                                            };
                                            (pending.callback)(result);
                                            continue;
                                        }
                                    }
                                }

                                // Handle event messages
                                {
                                    let handlers = event_handlers.lock().unwrap();
                                    if let Some(handlers) = handlers.get(&msg.event) {
                                        for handler in handlers {
                                            handler(msg.payload.clone());
                                        }
                                    }
                                }

                                // Call the general message handler
                                on_message(msg);
                            }
                            Err(e) => {
                                warn!("Failed to parse message from Node.js: {}", e);
                            }
                        }
                    }
                    Err(e) => {
                        error!("Error reading from Node.js stdout: {}", e);
                        break;
                    }
                }
            }

            info!("stdout listener stopped");
        });
    }

    /// Send an event to Node.js (fire and forget)
    pub fn emit(&self, event: &str, payload: Value) -> Result<(), String> {
        let msg = IPCMessage::event(event, payload);
        self.send_to_node(&msg)
    }

    /// Send a request to Node.js and wait for response
    pub fn request<F>(&self, event: &str, payload: Value, callback: F) -> Result<String, String>
    where
        F: FnOnce(Result<Value, String>) + Send + 'static,
    {
        let id = generate_request_id();
        let msg = IPCMessage::request(&id, event, payload);

        // Store the pending request with timeout info
        {
            let mut requests = self.pending_requests.lock().unwrap();
            requests.insert(id.clone(), PendingRequest {
                event: event.to_string(),
                callback: Box::new(callback),
                created_at: Instant::now(),
                timeout: Duration::from_secs(self.request_timeout_secs),
            });
        }

        // Send the request
        self.send_to_node(&msg)?;

        Ok(id)
    }

    /// Send a request with custom timeout
    pub fn request_with_timeout<F>(
        &self,
        event: &str,
        payload: Value,
        timeout_secs: u64,
        callback: F,
    ) -> Result<String, String>
    where
        F: FnOnce(Result<Value, String>) + Send + 'static,
    {
        let id = generate_request_id();
        let msg = IPCMessage::request(&id, event, payload);

        // Store the pending request with custom timeout
        {
            let mut requests = self.pending_requests.lock().unwrap();
            requests.insert(id.clone(), PendingRequest {
                event: event.to_string(),
                callback: Box::new(callback),
                created_at: Instant::now(),
                timeout: Duration::from_secs(timeout_secs),
            });
        }

        // Send the request
        self.send_to_node(&msg)?;

        Ok(id)
    }

    /// Start a background thread to check for timed out requests
    pub fn start_timeout_checker(&self) {
        let pending_requests = Arc::clone(&self.pending_requests);

        thread::spawn(move || {
            loop {
                thread::sleep(Duration::from_secs(1));

                let mut requests = pending_requests.lock().unwrap();
                let mut timed_out_ids = Vec::new();

                // Find timed out requests
                for (id, request) in requests.iter() {
                    if request.created_at.elapsed() > request.timeout {
                        timed_out_ids.push(id.clone());
                    }
                }

                // Handle timed out requests
                for id in timed_out_ids {
                    if let Some(request) = requests.remove(&id) {
                        warn!("Request {} timed out after {:?}", id, request.timeout);
                        (request.callback)(Err(format!(
                            "Request timed out after {:?}",
                            request.timeout
                        )));
                    }
                }
            }
        });
    }

    /// Register an event handler
    pub fn on<F>(&self, event: &str, handler: F)
    where
        F: Fn(Value) + Send + 'static,
    {
        let mut handlers = self.event_handlers.lock().unwrap();
        handlers
            .entry(event.to_string())
            .or_insert_with(Vec::new)
            .push(Box::new(handler));

        debug!("Registered handler for event: {}", event);
    }

    /// Send a message to Node.js via stdin
    fn send_to_node(&self, msg: &IPCMessage) -> Result<(), String> {
        let encoded = encode_message_for_stdin(msg)?;

        let mut stdin_guard = self.stdin.lock().unwrap();
        if let Some(ref mut stdin) = *stdin_guard {
            stdin.write_all(encoded.as_bytes())
                .map_err(|e| format!("Failed to write to Node.js stdin: {}", e))?;
            stdin.flush()
                .map_err(|e| format!("Failed to flush Node.js stdin: {}", e))?;

            debug!("Sent to Node.js: {}", msg.event);
            Ok(())
        } else {
            // Queue the message if stdin is not available yet
            debug!("Stdin not available, queueing message: {}", msg.event);
            let mut queue = self.message_queue.lock().unwrap();
            queue.push_back(msg.clone());
            Ok(())
        }
    }

    /// Queue a message for later sending
    pub fn queue_message(&self, msg: IPCMessage) {
        let mut queue = self.message_queue.lock().unwrap();
        queue.push_back(msg);
        debug!("Message queued, queue size: {}", queue.len());
    }

    /// Get the current message queue size
    pub fn queue_size(&self) -> usize {
        let queue = self.message_queue.lock().unwrap();
        queue.len()
    }

    /// Cancel a pending request
    pub fn cancel_request(&self, id: &str) -> bool {
        let mut requests = self.pending_requests.lock().unwrap();
        requests.remove(id).is_some()
    }

    /// Get the number of pending requests
    pub fn pending_request_count(&self) -> usize {
        let requests = self.pending_requests.lock().unwrap();
        requests.len()
    }
}

impl Default for IPCBridge {
    fn default() -> Self {
        Self::new()
    }
}

/// Generate a unique request ID
fn generate_request_id() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    format!("req_{}", timestamp)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ipc_message_event_creation() {
        let msg = IPCMessage::event("test_event", serde_json::json!({"key": "value"}));
        assert_eq!(msg.event, "test_event");
        assert!(matches!(msg.msg_type, IPCMessageType::Event));
        assert!(msg.id.is_none());
    }

    #[test]
    fn test_ipc_message_request_creation() {
        let msg = IPCMessage::request("req-001", "get_data", serde_json::json!({}));
        assert_eq!(msg.id, Some("req-001".to_string()));
        assert!(matches!(msg.msg_type, IPCMessageType::Request));
    }

    #[test]
    fn test_ipc_message_response_creation() {
        let msg = IPCMessage::response("req-001", "get_data", serde_json::json!({"result": 42}));
        assert_eq!(msg.id, Some("req-001".to_string()));
        assert!(matches!(msg.msg_type, IPCMessageType::Response));
    }

    #[test]
    fn test_ipc_message_error_response() {
        let msg = IPCMessage::error_response("req-001", "get_data", "Something went wrong");
        assert_eq!(msg.error, Some("Something went wrong".to_string()));
    }

    #[test]
    fn test_parse_valid_message() {
        let json = r#"{"id":"msg-001","msg_type":"event","event":"test","payload":{},"error":null}"#;
        let result = parse_stdin_message(json);
        assert!(result.is_ok());
        let msg = result.unwrap();
        assert_eq!(msg.event, "test");
    }

    #[test]
    fn test_parse_invalid_message() {
        let result = parse_stdin_message("not json");
        assert!(result.is_err());
    }

    #[test]
    fn test_encode_message() {
        let msg = IPCMessage::event("test", serde_json::json!({}));
        let encoded = encode_message_for_stdin(&msg);
        assert!(encoded.is_ok());
        assert!(encoded.unwrap().ends_with('\n'));
    }

    #[test]
    fn test_forward_to_frontend() {
        let msg = IPCMessage::event("display_message", serde_json::json!({"text": "Hello"}));
        let (event_name, payload) = forward_to_frontend(&msg);
        assert_eq!(event_name, "display_message");
        assert_eq!(payload["text"], "Hello");
    }

    #[test]
    fn test_ipc_bridge_creation() {
        let bridge = IPCBridge::new();
        assert_eq!(bridge.pending_request_count(), 0);
        assert_eq!(bridge.queue_size(), 0);
    }

    #[test]
    fn test_ipc_bridge_with_timeout() {
        let bridge = IPCBridge::with_timeout(60);
        assert_eq!(bridge.request_timeout_secs, 60);
    }

    #[test]
    fn test_generate_request_id() {
        let id1 = generate_request_id();
        let id2 = generate_request_id();
        assert!(id1.starts_with("req_"));
        assert_ne!(id1, id2);
    }

    #[test]
    fn test_ipc_error_display() {
        let err = IPCError::StdinNotAvailable;
        assert_eq!(err.to_string(), "Node.js stdin not available");

        let err = IPCError::Timeout("30s".to_string());
        assert!(err.to_string().contains("timeout"));

        let err = IPCError::ParseError("invalid json".to_string());
        assert!(err.to_string().contains("Parse error"));
    }

    #[test]
    fn test_ipc_error_to_string() {
        let err: String = IPCError::SendError("connection refused".to_string()).into();
        assert!(err.contains("Send error"));
    }

    #[test]
    fn test_message_queue() {
        let bridge = IPCBridge::new();

        // Queue a message when stdin is not available
        let msg = IPCMessage::event("test", serde_json::json!({}));
        bridge.queue_message(msg);

        assert_eq!(bridge.queue_size(), 1);
    }

    #[test]
    fn test_cancel_request() {
        let bridge = IPCBridge::new();

        // Add a pending request manually (simulating request without stdin)
        {
            let mut requests = bridge.pending_requests.lock().unwrap();
            requests.insert("test-req-001".to_string(), PendingRequest {
                event: "test".to_string(),
                callback: Box::new(|_| {}),
                created_at: Instant::now(),
                timeout: Duration::from_secs(30),
            });
        }

        assert_eq!(bridge.pending_request_count(), 1);
        assert!(bridge.cancel_request("test-req-001"));
        assert_eq!(bridge.pending_request_count(), 0);
        assert!(!bridge.cancel_request("nonexistent"));
    }
}
