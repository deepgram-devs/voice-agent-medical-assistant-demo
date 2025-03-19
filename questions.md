Voice Command Structure
Do you want to use specific trigger phrases for each function? (e.g., "Start clinical note", "New prescription", "Schedule appointment")
- both UI and phrases to change mode all mode changes should begin with "Start"
Should we allow natural language input or have a more structured command system?
- natural language input

Data Persistence
How frequently should we auto-save the data to IndexedDB?
- each time a task in completed
Should we implement a simple export to JSON feature in the MVP, or leave it for future enhancement?
- leave it for future

UI Navigation
Do you prefer a tab-based interface or a different navigation pattern for switching between the three main functions?
- tab-based interface
Should we show all three options simultaneously or focus on one function at a time?
- show all three options simultaneously

Clinical Notes
Should we include a basic patient identifier in the MVP, or just free-form notes?
- just free-form notes
Do we need a simple search function in the MVP for finding past notes?
- no

Drug Dispatch
Should we include a basic validation for medication names/dosages in the MVP?
- no
Do we need to store common pharmacy locations, or should it be free-form input?
- free form input

Scheduling
What's the minimum appointment duration we should support?
- 30 minutes
Should we include basic conflict detection in the MVP?
- no
Do we need a simple day/week view, or just a list of upcoming appointments?
- just a list of upcoming appointments

Error Handling
How should we handle voice recognition errors in the MVP?
- no
Should we provide visual feedback for voice commands?
- yes

System Prompt
Should we create different prompts for each function, or use a single medical-focused prompt?
- different prompts for each function 
Do we need to include any specific medical terminology in the basic prompt?
- yes

Data Models
Are the current MVP data models sufficient, or should we add/remove any fields?
- yes
Should we implement basic data validation in the MVP?
- no

Voice Integration Priority
Which voice commands should we implement first?
- voice commands for each function
Should we support command correction/confirmation in the MVP?
- yes