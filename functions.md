# Function Calling Implementation Plan

## Overview
This document outlines the implementation plan for function calling in the Medical Transcription App. The system will use WebSocket messages to handle function calls between the Voice Agent API and our application.

## Function Types

### 1. Demographics Functions
- `set_patient_name(name: string)`
- `set_date_of_birth(dateOfBirth: string)`
- `set_gender(gender: string)`
- `set_mrn(mrn: string)`

### 2. Visit Information Functions
- `set_visit_date(date: string)`
- `set_visit_time(time: string)`
- `set_visit_type(visitType: string)`
- `set_provider_name(provider: string)`

### 3. Clinical Information Functions
- `set_chief_complaint(complaint: string)`
- `set_present_illness(illness: string)`
- `set_review_of_systems(systems: string)`
- `set_physical_exam(exam: string)`
- `set_assessment(assessment: string)`
- `set_plan(plan: string)`

### 4. Note Control Functions
- `save_note()`
- `clear_note()`

## WebSocket Message Types

### 1. Incoming Messages (Voice Agent → App)
```typescript
interface FunctionCall {
  type: 'function';
  id: string;
  function: {
    name: string;
    arguments: string;
  };
}

interface FunctionCallMessage {
  type: 'FunctionCalling';
  role: 'assistant';
  tool_calls: FunctionCall[];
}
```

### 2. Outgoing Messages (App → Voice Agent)
```typescript
interface FunctionCallResponse {
  type: 'FunctionCallResponse';
  function_call_id: string;
  output: 'success' | 'error';
  error?: string;
}
```

## Implementation Steps

1. WebSocket Message Handler
   - Add message event listener for WebSocket
   - Parse incoming messages
   - Validate message type and structure
   - Extract function call details

2. Function Call Processor
   - Create function mapping object
   - Implement each function handler
   - Update UI state based on function results
   - Send response messages

3. UI Updates
   - Real-time updates for each field
   - Visual feedback for successful updates
   - Error handling and display

4. State Management
   - Track current note state
   - Maintain field values
   - Handle concurrent updates

## Error Handling

1. Invalid Function Calls
   - Unknown function names
   - Invalid arguments
   - Missing required fields

2. WebSocket Issues
   - Connection drops
   - Message parsing errors
   - Response timeouts

3. UI State Errors
   - Invalid state transitions
   - Concurrent update conflicts
   - Data validation errors

## Testing Plan

1. Function Call Tests
   - Test each function individually
   - Verify argument parsing
   - Check response messages

2. Integration Tests
   - End-to-end function call flow
   - WebSocket message handling
   - UI state updates

3. Error Handling Tests
   - Invalid message formats
   - Network issues
   - State conflicts

## Success Criteria

1. All functions can be called via WebSocket messages
2. Each function updates the UI correctly
3. Proper error handling and feedback
4. Smooth state management
5. Real-time updates visible to user 