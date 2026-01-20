/**
 * Rust IPC Bridge Tests
 *
 * Tests for IPC communication between Node.js and Rust/SolidJS:
 * - Scenario: Node.js 到 Rust 的消息发送
 * - Scenario: Rust 到 SolidJS 的事件推送
 *
 * _Requirements: IPC 通信层实现_
 * _TaskGroup: 5_
 */

use serde_json;

// Import ipc module from the main crate
use app_lib::ipc::{IPCMessage, IPCMessageType, forward_to_frontend, parse_stdin_message, encode_message_for_stdin};

/// Test IPCMessage serialization and deserialization
#[test]
fn test_ipc_message_serialization() {
    // Test event message
    let event_msg = IPCMessage {
        id: Some("msg-001".to_string()),
        msg_type: IPCMessageType::Event,
        event: "test_event".to_string(),
        payload: serde_json::json!({"key": "value"}),
        error: None,
    };

    let serialized = serde_json::to_string(&event_msg).expect("Failed to serialize");
    let deserialized: IPCMessage = serde_json::from_str(&serialized).expect("Failed to deserialize");

    assert_eq!(deserialized.id, Some("msg-001".to_string()));
    assert_eq!(deserialized.event, "test_event");
    assert!(matches!(deserialized.msg_type, IPCMessageType::Event));
}

/// Test IPCMessage for request type
#[test]
fn test_ipc_message_request_type() {
    let request_msg = IPCMessage {
        id: Some("req-001".to_string()),
        msg_type: IPCMessageType::Request,
        event: "get_data".to_string(),
        payload: serde_json::json!({"query": "test"}),
        error: None,
    };

    let serialized = serde_json::to_string(&request_msg).expect("Failed to serialize");
    let deserialized: IPCMessage = serde_json::from_str(&serialized).expect("Failed to deserialize");

    assert_eq!(deserialized.id, Some("req-001".to_string()));
    assert!(matches!(deserialized.msg_type, IPCMessageType::Request));
}

/// Test IPCMessage for response type
#[test]
fn test_ipc_message_response_type() {
    let response_msg = IPCMessage {
        id: Some("req-001".to_string()),
        msg_type: IPCMessageType::Response,
        event: "get_data".to_string(),
        payload: serde_json::json!({"result": [1, 2, 3]}),
        error: None,
    };

    let serialized = serde_json::to_string(&response_msg).expect("Failed to serialize");
    let deserialized: IPCMessage = serde_json::from_str(&serialized).expect("Failed to deserialize");

    assert!(matches!(deserialized.msg_type, IPCMessageType::Response));
    assert_eq!(deserialized.payload["result"], serde_json::json!([1, 2, 3]));
}

/// Test IPCMessage with error
#[test]
fn test_ipc_message_with_error() {
    let error_msg = IPCMessage {
        id: Some("req-002".to_string()),
        msg_type: IPCMessageType::Response,
        event: "get_data".to_string(),
        payload: serde_json::Value::Null,
        error: Some("Something went wrong".to_string()),
    };

    let serialized = serde_json::to_string(&error_msg).expect("Failed to serialize");
    let deserialized: IPCMessage = serde_json::from_str(&serialized).expect("Failed to deserialize");

    assert_eq!(deserialized.error, Some("Something went wrong".to_string()));
}

/// Test parsing stdin message (from Node.js stdout)
#[test]
fn test_parse_stdin_message() {
    let raw_message = r#"{"id":"msg-001","msg_type":"event","event":"node_event","payload":{"data":"hello"},"error":null}"#;

    let result = parse_stdin_message(raw_message);
    assert!(result.is_ok());

    let msg = result.unwrap();
    assert_eq!(msg.event, "node_event");
    assert_eq!(msg.payload["data"], "hello");
}

/// Test parsing invalid stdin message
#[test]
fn test_parse_invalid_stdin_message() {
    let invalid_message = "not valid json";
    let result = parse_stdin_message(invalid_message);
    assert!(result.is_err());
}

/// Test encoding message for stdin (to Node.js stdin)
#[test]
fn test_encode_message_for_stdin() {
    let msg = IPCMessage {
        id: Some("cmd-001".to_string()),
        msg_type: IPCMessageType::Request,
        event: "execute_command".to_string(),
        payload: serde_json::json!({"command": "ls"}),
        error: None,
    };

    let encoded = encode_message_for_stdin(&msg);
    assert!(encoded.is_ok());

    let encoded_str = encoded.unwrap();
    assert!(encoded_str.ends_with('\n')); // Should end with newline for stdin
    assert!(encoded_str.contains("execute_command"));
}

/// Test forward_to_frontend creates correct emit payload
#[test]
fn test_forward_to_frontend_payload() {
    let msg = IPCMessage {
        id: Some("msg-001".to_string()),
        msg_type: IPCMessageType::Event,
        event: "display_message".to_string(),
        payload: serde_json::json!({"text": "Hello from Node.js", "role": "assistant"}),
        error: None,
    };

    // Test that forward_to_frontend returns the correct event name and payload
    let (event_name, payload) = forward_to_frontend(&msg);

    assert_eq!(event_name, "display_message");
    assert_eq!(payload["text"], "Hello from Node.js");
    assert_eq!(payload["role"], "assistant");
}

/// Test complex payload serialization (Date, nested objects)
#[test]
fn test_complex_payload_serialization() {
    let complex_payload = serde_json::json!({
        "timestamp": "2024-01-15T10:30:00.000Z",
        "nested": {
            "array": [1, 2, 3],
            "object": {"key": "value"}
        },
        "nullValue": null,
        "boolValue": true
    });

    let msg = IPCMessage {
        id: Some("msg-complex".to_string()),
        msg_type: IPCMessageType::Event,
        event: "complex_event".to_string(),
        payload: complex_payload.clone(),
        error: None,
    };

    let serialized = serde_json::to_string(&msg).expect("Failed to serialize");
    let deserialized: IPCMessage = serde_json::from_str(&serialized).expect("Failed to deserialize");

    assert_eq!(deserialized.payload["timestamp"], "2024-01-15T10:30:00.000Z");
    assert_eq!(deserialized.payload["nested"]["array"][1], 2);
    assert_eq!(deserialized.payload["nested"]["object"]["key"], "value");
}

/// Test message type enum variants
#[test]
fn test_message_type_variants() {
    let types = vec![
        (IPCMessageType::Event, "event"),
        (IPCMessageType::Request, "request"),
        (IPCMessageType::Response, "response"),
    ];

    for (msg_type, expected_str) in types {
        let msg = IPCMessage {
            id: None,
            msg_type: msg_type.clone(),
            event: "test".to_string(),
            payload: serde_json::Value::Null,
            error: None,
        };

        let serialized = serde_json::to_string(&msg).expect("Failed to serialize");
        assert!(serialized.contains(expected_str));
    }
}
