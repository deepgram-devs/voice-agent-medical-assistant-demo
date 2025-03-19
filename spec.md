# Medical Transcription App

## Overview
We are building a medical transcription app that will transcribe doctor's voice and convert it into text.

The user interface is a web app that will be used by the doctor with 3 options:
- Clinacal Notes
- Drug Dispatch
- Scheduling

When things are saved they should be stored in the in client side indexedDB database and have a UI to view and edit them. store the in memory database to a json file.

Use local function calls to handle all the interactions with the client side local storage db using indexedDB.

There should be not api requests to any external services other than the Deepgram Voice Agent API which is already hooked up.

We need to update the system prompt in the app to be more specific and to the point for this new use case in constants.ts.


## Core Functionalities

- Clinacal Notes
- Drug Dispatch
- Scheduling

Each of these funcitons can be switched between in the UI.

The system prompt can be updated with UpdateInstructions and all the function calls should be present when opening the connection for all 3 core fuinctionalities.

The UI for each of these core functionalities should be switched between when the user clicks on the button for each of the core functionalities.

Display the sotred objects as they are populated and make the ui look clean and professional and match the existing styles of the app.

The UI should have a button to clear the in local storage database.



## Clinical Notes
    - The notes are stored using an in memory database and does not require any API calls
    - Transcribing

## Doctor speaks the recomendation on prescriptions and application fills out the form for submission
    - The recomendation on prescriptions are stored using an in memory database and does not require any API calls
    - Example:
        - 75mg of Acetomeniphen per day
        - Pharmacy location to pick up

## Followup appointment and scheduling
    - The meeting scheduling is done using an in memory database and does not require any API calls
    - Example:
        - Doctor: "Please schedule a followup appointment for 2 weeks from now"

## Drug Dispatch
    - Example:
        - Doctor: "Please dispatch the drug to the pharmacy"