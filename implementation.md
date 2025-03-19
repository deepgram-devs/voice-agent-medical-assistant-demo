# Implementation Plan for Medical Transcription App

## Recent Updates
- Removed latency measurement feature:
  - Removed Latency.tsx component
  - Removed latency display from conversation view
  - Simplified conversation component
- Removed URL parameter dependencies:
  - Removed useSearchParams hook usage across components
  - Switched to prop-based configuration for components
  - Simplified state management in UseStsQueryParams hook
  - Updated Header, Conversation, and Latency components to use props instead of URL parameters
- Added "use client" directive to components using IndexedDB to ensure proper client-side rendering:
  - ClinicalNotes.tsx
  - DrugDispatch.tsx
  - Scheduling.tsx
- Verified all browser API usage is properly contained within client components
- Removed drive-thru and JITB components and routes to streamline the application
  - Deleted components: `DriveThru.tsx`, `Jitb.tsx`
  - Removed route pages: `/drivethru/page.tsx`, `/jitb/page.tsx`
  - Deleted services: `driveThruService.js`, `jitbService.js`
  - Removed related configurations from `constants.ts` and `next.config.mjs`
- Switched from IndexedDB to in-memory storage for simpler data management:
  - Removed IndexedDB service and dependencies
  - Updated components to use React state for data persistence
  - Simplified data operations (create, update, delete)
  - Note: Data will be cleared on page refresh
  - Added UUID generation for unique record IDs

## 1. MVP Core Components

### A. Essential Storage Setup (MVP)
- Implement in-memory storage using React state for:
  - Clinical Notes
  - Drug Dispatch
  - Scheduling
- Basic CRUD operations using state management
- Data persistence during session only
- Unique ID generation for records

### B. MVP UI Components
1. Main Navigation
   - Tab-based interface showing all three functions
   - Basic professional styling
   - Visual feedback for voice commands

2. Clinical Notes Component (MVP)
   - Voice recording interface
   - Real-time transcription display
   - Basic notes list view
   - Free-form notes without patient identifiers
   - Simple edit capability

3. Drug Dispatch Component (MVP)
   - Voice input for basic prescription details
   - Simple form with essential fields:
     - Medication name (free-form)
     - Dosage (free-form)
     - Frequency (free-form)
     - Pharmacy location (free-form)
   - Basic dispatch status view

4. Scheduling Component (MVP)
   - Voice input for basic scheduling
   - List of upcoming appointments
   - 30-minute minimum duration
   - Basic appointment list

### C. Essential Voice Integration (MVP)
# Voice Integration

- Voice input/output using Web Speech API
- Mode changes using either direct command or "Start" command (e.g., "Clinical Note" or "Start Clinical Note")
- Ability to switch between modes with confirmation (e.g., "Actually let's do Drug Dispatch")
- Voice commands for controlling note taking
- Natural language processing for medication prescriptions
- Appointment scheduling through voice commands

## 2. MVP Data Models

### Clinical Notes (MVP)
```typescript
interface ClinicalNote {
  id: string;
  timestamp: Date;
  content: string;
  patientInfo?: string;
  lastModified: Date;
}
```

### Drug Dispatch (MVP)
```typescript
interface DrugDispatch {
  id: string;
  timestamp: Date;
  medication: string;
  dosage: string;
  frequency: string;
  pharmacy: string;
  status: 'pending' | 'dispatched';
}
```

### Scheduling (MVP)
```typescript
interface Appointment {
  id: string;
  timestamp: Date;
  type: string;
  duration: number;
  notes: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}
```

## 3. MVP Implementation Phases

### Phase 1: Essential Foundation
1. Basic IndexedDB setup with simple schemas
2. Tab-based UI implementation
3. Visual command feedback system
4. Function-specific system prompts

### Phase 2: Basic Voice Integration
1. "Start" commands for mode switching
2. Natural language processing for each function
3. Command confirmation system
4. Visual feedback implementation

### Phase 3: Core Data Management
1. Basic CRUD operations
2. Auto-save on task completion
3. Basic list views

### Phase 4: Essential UI
1. Tab-based navigation
2. Basic professional styling
3. Visual command feedback
4. Simple error messages

## 4. Future Enhancements (Post-MVP)

### A. Enhanced Database Features
- Version control for clinical notes
- Detailed medication tracking
- Advanced appointment scheduling
- Full edit history
- Tags and categorization
- Attachments support

### B. Advanced UI Features
- Rich text editing
- Advanced calendar features
- Comprehensive history views
- Interactive data visualizations
- Advanced search capabilities

### C. Extended Voice Features
- Advanced medical terminology
- Context-aware commands
- Multi-language support
- Voice customization

### D. Additional Data Fields
```typescript
// Future Clinical Notes Enhancements
interface ClinicalNoteEnhancements {
  metadata?: ClinicalNoteMetadata;
  version?: number;
  editHistory?: Array<{timestamp: Date, content: string}>;
}

// Future Drug Dispatch Enhancements
interface DrugDispatchEnhancements {
  medicationDetails?: MedicationDetails;
  pharmacyDetails?: PharmacyDetails;
  prescriptionHistory?: Array<{timestamp: Date, action: string}>;
}

// Future Scheduling Enhancements
interface AppointmentEnhancements {
  recurring?: {
    frequency: string;
    endDate: Date;
  };
  reminders?: {
    scheduled: Date[];
    sent: Date[];
  };
}
```

### E. Future Technical Considerations
- Data encryption
- Offline support
- Performance optimization
- Advanced error handling
- Data export/import
- External system integration
- Multi-language support

## 5. MVP Testing Strategy

### Essential Tests
1. Basic CRUD operations
2. Voice command recognition
3. Core UI functionality
4. Navigation flow
5. Data persistence

### Future Testing Scope
- Advanced voice recognition
- Performance testing
- Security testing
- Accessibility testing
- Integration testing with external systems
- Stress testing with large datasets

## 6. Implementation Notes

### MVP Focus
- Implement only essential features needed for basic functionality
- Keep UI simple but professional
- Focus on reliability over features
- Ensure core voice commands work consistently
- Maintain basic data integrity

### Current Implementation Status
1. Voice Interface Integration
   - Implemented voice command recognition
   - Added visual feedback with speech bubble and orb animations
   - Optimized animation sizes for better UX
   - Fixed infinite update loop issues in voice message handling
   - Improved loading states to prevent UI layout shifts
   - Ensured speech bubble visibility during all app states
   - Added Suspense boundaries for components using useSearchParams
   - Fixed recording state update to prevent infinite loops by simplifying state management
   - Removed circular dependencies in recording state updates
   - Optimized voice bot status handling across components

2. Code Quality Improvements
   - Removed unused variables and imports across components
   - Fixed TypeScript type errors in levenshteinDistance function
   - Optimized component rendering with proper useCallback usage
   - Improved error handling in socket message processing
   - Added proper type checking for message handling
   - Removed redundant state management in components
   - Fixed build warnings related to client-side navigation

3. Function Calling Implementation
   - Function types defined for:
     - Demographics (patient name, DOB, gender, MRN)
     - Visit Information (date, time, type, provider)
     - Clinical Information (chief complaint, present illness, review of systems, physical exam, assessment, plan)
     - Note Control (save note, clear note)
     - Additional Information (other notes)
     - Drug Dispatch Functions:
       - set_patient_name: Sets the patient's name for the prescription
       - set_mrn: Sets the patient's medical record number (MRN)
       - set_medication: Sets medication name
       - set_dosage: Sets dosage information
       - set_frequency: Sets frequency of medication
       - set_pharmacy: Sets pharmacy details
       - dispatch_prescription: Saves and dispatches the prescription
       - clear_prescription: Clears the current prescription form
     - Scheduling Functions:
       - set_patient_name: Sets the patient's name for the appointment
       - set_mrn: Sets the patient's medical record number (MRN)
       - set_appointment_type: Sets the type of appointment
       - set_appointment_datetime: Sets the date and time
       - set_appointment_duration: Sets the duration (minimum 30 minutes)
       - set_appointment_notes: Sets any additional notes
       - schedule_appointment: Saves the appointment
       - clear_appointment: Clears the appointment form

   - WebSocket Message Handling:
     - Incoming messages: Now handling `FunctionCallRequest` messages with format:
       ```typescript
       {
         type: "FunctionCallRequest",
         function_name: string,
         function_call_id: string,
         input: Record<string, any>
       }
       ```
     - Outgoing responses: Sending `FunctionCallResponse` messages with format:
       ```typescript
       {
         type: "FunctionCallResponse",
         function_call_id: string,
         output: "success" | "error",
         error?: string
       }
       ```
     - Error handling implemented for invalid function calls and processing errors

   - Drug Dispatch Component:
     - Implemented function-based prescription data collection
     - Dark theme styling consistent with clinical notes
     - Active dispatch state management
     - Clear visual feedback for recording state
     - Proper formatting of all prescription fields
     - Status management for dispatched/pending prescriptions
     - Manual input support alongside voice commands
     - Command "Start Drug Dispatch" to begin new prescription

   - Scheduling Component:
     - Implemented function-based appointment scheduling
     - Added patient information fields (name and MRN)
     - Dark theme styling matching Drug Dispatch component
     - State management for appointments
     - Voice command integration for scheduling operations
     - Appointment list view with status management
     - Database schema updated with patient information indexes
     - Fixed scheduling order to collect patient info first
     - Proper handling of schedule command to save appointments
     - Status management for scheduled/completed/cancelled appointments
     - Manual input support alongside voice commands
     - Command "Start Scheduling" to begin new appointment
     - Minimum duration enforcement (30 minutes)
     - Appointment list with status indicators
     - Proper date/time handling and display

   - Note Formatting:
     - Each field is properly prefixed in the note (e.g., "Patient Name: John Doe")
     - All note content comes from function calls, not raw speech transcript
     - Added support for additional information through other_notes function
     - Clear separation between different types of information
     - Consistent formatting across all note fields
     - Improved entity extraction to prevent duplicate information
     - Enhanced pattern matching for patient names and other fields
     - Added null-safe operations for more robust text processing
     - Implemented interactive prompting system for sequential data collection
     - Added guided workflow with specific prompts for each required field
     - Improved handling of out-of-order information with graceful redirection
     - Removed raw transcription handling to ensure data only comes from function calls
     - Enforced structured data collection through function-based approach

   - Next Steps
     - Implement UI state management for real-time updates
     - Add validation for function inputs
     - Implement error recovery mechanisms
     - Add unit tests for function call processing

3. UI Layout
   - Implemented responsive three-panel layout
   - Removed header for cleaner interface
   - Left panel: Voice interface and controls
   - Center panel: Medical transcription components
   - Right panel: Additional controls and feedback
   - Proper spacing and positioning of all components
   - Added delete functionality for saved notes

4. Component Integration
   - Successfully integrated ClinicalNotes component with:
     - Explicit note start/save workflow
     - Automatic entity extraction (patient name, date, age)
     - Formatted note structure
     - Dark theme styling improvements
     - Note deletion capability
   - Fixed state management in medical components
   - Improved voice message handling using messages array
   - Resolved duplicate VoiceSelector issue

5. Next Steps
   - Implement remaining medical transcription features
   - Add more robust error handling
   - Enhance voice command recognition
   - Add data persistence layer
   - Implement remaining MVP features
   - Add validation for prescription data
   - Implement prescription history tracking
   - Add support for recurring prescriptions
   - Enhance pharmacy integration options
   - Add medication interaction checks
   - Add appointment conflict detection
   - Implement recurring appointments
   - Add appointment reminders
   - Enhance patient record integration

### Success Criteria (MVP)
1. Doctor can record clinical notes via voice with automatic formatting
2. Basic prescription details can be captured
3. Simple appointment scheduling works
4. Data persists between sessions
5. Basic voice commands function reliably
6. UI is clean and usable

## Voice Command Improvements

- Removed all newlines and bullet points from prompts to make them more suitable for speech output
- Converted list formatting to use commas and periods for natural speech flow
- Maintained all functionality while improving spoken delivery
- Ensured consistent formatting across Clinical Notes, Drug Dispatch, and Scheduling prompts

Voice commands now support:
- Exact matches (e.g., "Start Drug Dispatch")
- Partial matches (commands embedded in longer phrases)
- Commands with varying capitalization
- Commands with extra whitespace
- Common transcription variations:
  - For Drug Dispatch: "drove dispatch", "drill dispatch", "rogue dispatch", etc.
  - All variations work with or without "Start" prefix
- Scheduling commands now recognize both "Scheduling" and "Start Scheduling" to begin appointment scheduling

## 7. Rendering Architecture

### Client-Side Components
- Main application components (`App.js`, `page.tsx`)
- Interactive components (`DriveThru.tsx`, `Jitb.tsx`, `ShareButtonsPanel.tsx`)
- Context providers (Deepgram, Microphone, VoiceBot)
- UI components that use browser APIs (`Header.tsx`, `MobileMenu.tsx`, `PopupButton.tsx`)
- Animation and vendor-related components (`AnimatedBackground.js`, `VendorScripts.js`)

### Server-Side Components
- Layout and static pages (`layout.tsx`, `drivethru/page.tsx`, `jitb/page.tsx`)
- Medical transcription components (`MedicalTranscription.tsx`, `ClinicalNotes.tsx`, `DrugDispatch.tsx`)
- Animation management (`AnimationManager.tsx`)

### Hybrid Rendering Strategy
- Server-side rendering for initial page loads and static content
- Client-side rendering for interactive features and browser API dependencies
- Context providers ensure consistent state management across components
- Medical components leverage server-side rendering with client-side interactivity
- Proper "use client" directives to optimize rendering performance

### Latest Updates (2024-03-19)
1. Added mode-specific initial instructions to default system prompt:
   - Modified stsConfig to include clear mode switching instructions
   - Added explicit instructions for each mode transition
   - Enforced consistent starting point (asking for patient name)
   - Added rules for context clearing and response formatting
   - Improved initial greeting to explain available modes and commands
   - Ensured proper instruction inheritance for each mode
   - Added safeguards against context bleeding between modes

2. Previous updates:
   - Fixed scheduling prompt to enforce correct field order
   - Modified schedulingPrompt to strictly enforce field collection order
   - Removed all introductory phrases and welcome messages
   - Ensured patient name is always requested first
   - Added explicit examples of the exact flow
   - Enforced sequential collection: name -> MRN -> type -> datetime -> duration -> notes
   - Simplified and clarified the prompt format
   - Added strict rules about never combining questions or skipping order
   - Improved clarity about minimum appointment duration requirement
   - Added `lastProcessedMessage` ref to track and prevent duplicate message processing
   - Modified voice command effect to immediately request patient name
   - Added sequential prompts for each field in the correct order
   - Removed separate socket message effect
   - Added proper field order: name -> MRN -> type -> datetime -> duration -> notes
   - Improved logging to track the flow of execution

3. Appointment Management Improvements
   - Added appointment deletion functionality:
     - Added delete button to appointment list items
     - Integrated with IndexedDB deletion operation
     - Added visual confirmation with hover state
     - Consistent styling with other delete buttons
     - Proper error handling for deletion operations
     - Immediate UI update on successful deletion

### Default Items Feature
- Added functionality to preload default items when all stores are empty
- Default items are only added when all three modes (Clinical Notes, Drug Dispatch, and Scheduling) have no existing records
- Default items include:
  1. Clinical Note for Joe Blogs with injection site swelling
  2. Drug Dispatch for Jane Bloggs with Ibuprofen prescription
  3. Scheduling appointment for Jim Bloggs for a checkup
- Implementation details:
  - Added `checkAndAddDefaultItems` utility function in `idb.ts`
  - Integrated check on `MedicalTranscription` component mount
  - Added TypeScript interfaces and proper error handling
  - Ensures data persistence across sessions while maintaining demo data

## Drug Dispatch Safety Features

### Medication Safety Protocol

The Drug Dispatch component implements a streamlined medication safety system that focuses on essential dosage information. The voice agent follows a concise safety protocol:

1. Medication Information:
   When a medication is mentioned, ONLY state:
   - Recommended dose range
   - Maximum single dose
   - Maximum daily dose
   - Standard frequency

2. Safety Monitoring:
   Only question prescriptions that exceed:
   - Maximum single dose limits
   - Maximum daily dose limits

3. Resolution Process:
   For prescriptions exceeding limits:
   - State the recommended limits
   - If doctor insists, recommend second opinion and proceed with confirmation

### Common Medication Guidelines

Concise reference guidelines for common medications:

Ibuprofen: 200-800mg per dose, max 3200mg/day, every 4-6 hours
Acetaminophen: 325-1000mg per dose, max 4000mg/day, every 4-6 hours
Amoxicillin: 250-875mg per dose, max 1750mg/day, every 8-12 hours
Prednisone: 5-60mg per dose, once daily

### Implementation Details

The system:
- Provides immediate dosage information for mentioned medications
- Calculates daily totals based on dose × frequency
- Questions only doses/frequencies exceeding safe limits
- Allows proceeding with confirmation for unusual prescriptions
- Maintains safety while respecting physician decisions

This comprehensive safety feature helps:
- Ensure informed prescribing decisions
- Prevent potential medication errors
- Maintain professional autonomy
- Document safety considerations
- Support evidence-based practice
- Encourage collaborative decision-making 