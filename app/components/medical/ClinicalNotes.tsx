"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useVoiceBot } from '../../context/VoiceBotContextProvider';
import { useDeepgram } from '../../context/DeepgramContextProvider';
import { sendSocketMessage } from '../../utils/deepgramUtils';
import { v4 as uuidv4 } from 'uuid';
import { type ClinicalNote, addClinicalNote, getAllClinicalNotes, deleteClinicalNote } from '../../utils/idb';

export default function ClinicalNotes() {
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [currentNote, setCurrentNote] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isActiveNote, setIsActiveNote] = useState(false);
  const [currentFields, setCurrentFields] = useState<Omit<ClinicalNote, 'id' | 'timestamp' | 'lastModified' | 'content'>>({
    demographics: {},
    visitInfo: {},
    clinicalInfo: {},
  });
  const { status, messages } = useVoiceBot();
  const { socket } = useDeepgram();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load notes from IndexedDB on component mount
  useEffect(() => {
    const loadNotes = async () => {
      try {
        const savedNotes = await getAllClinicalNotes();
        setNotes(savedNotes.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
      } catch (error) {
        console.error('Error loading clinical notes:', error);
      }
    };
    loadNotes();
  }, []);

  const handleSaveNote = useCallback(async () => {
    if (!currentNote.trim()) return;

    try {
      const newNote: ClinicalNote = {
        id: uuidv4(),
        timestamp: new Date(),
        content: currentNote,
        lastModified: new Date(),
        ...currentFields
      };

      // Save to IndexedDB
      await addClinicalNote(newNote);

      // Update local state
      setNotes(prevNotes => [...prevNotes, newNote].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
      setCurrentNote('');
      setCurrentFields({
        demographics: {},
        visitInfo: {},
        clinicalInfo: {},
      });
      setIsActiveNote(false);
    } catch (error) {
      console.error('Error saving clinical note:', error);
    }
  }, [currentNote, currentFields]);

  const handleDeleteNote = async (id: string) => {
    try {
      // Delete from IndexedDB
      await deleteClinicalNote(id);

      // Update local state
      setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const levenshteinDistance = (str1: string, str2: string): number => {
    const track = Array(str2.length + 1).fill(null).map(() =>
      Array(str1.length + 1).fill(0)
    ) as number[][];

    for (let i = 0; i <= str1.length; i++) {
      track[0]![i] = i;
    }
    for (let j = 0; j <= str2.length; j++) {
      track[j]![0] = j;
    }

    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        track[j]![i] = Math.min(
          track[j]![i - 1]!,
          track[j - 1]![i]!,
          track[j - 1]![i - 1]!
        ) + indicator;
      }
    }
    return track[str2.length]![str1.length]!;
  };

  const findBestMatch = useCallback((input: string, commands: string[]): string | null => {
    const threshold = Math.min(5, Math.floor(input.length * 0.3));
    let bestMatch = null;
    let bestDistance = Infinity;

    for (const command of commands) {
      const distance = levenshteinDistance(input.toLowerCase(), command.toLowerCase());
      if (distance < bestDistance && distance <= threshold) {
        bestDistance = distance;
        bestMatch = command;
      }
    }

    return bestMatch;
  }, []);

  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, []);

  // Update recording state based on voice bot status
  useEffect(() => {
    const newIsRecording = status === 'listening';
    if (isRecording !== newIsRecording) {
      setIsRecording(newIsRecording);
    }
  }, [status, isRecording]);

  // Handle voice commands
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || !('user' in lastMessage)) return;

    const content = lastMessage.user;
    const contentLower = content.toLowerCase().trim();

    const startCommands = [
      'clinical note',
      'start clinical note',
      'start note',
      'start a clinical note',
      'start a note',
      'begin clinical note',
      'begin a clinical note',
      'create clinical note',
      'create a clinical note',
      'new clinical note',
      'new note'
    ];

    const saveCommands = [
      'save note',
      'save the note',
      'save clinical note',
      'save this note',
      'finish note',
      'end note'
    ];

    const clearCommands = [
      'clear note',
      'clear the note',
      'delete note',
      'delete the note',
      'reset note'
    ];

    const matchedStartCommand = findBestMatch(contentLower, startCommands);
    const matchedSaveCommand = findBestMatch(contentLower, saveCommands);
    const matchedClearCommand = findBestMatch(contentLower, clearCommands);
    
    if (matchedStartCommand && !isActiveNote) {
      setIsActiveNote(true);
      setCurrentNote('');
      setCurrentFields({
        demographics: {},
        visitInfo: {},
        clinicalInfo: {},
      });
    } else if (matchedSaveCommand && isActiveNote) {
      handleSaveNote();
    } else if (matchedClearCommand) {
      setCurrentNote('');
      setCurrentFields({
        demographics: {},
        visitInfo: {},
        clinicalInfo: {},
      });
    }
  }, [messages, findBestMatch, handleSaveNote, isActiveNote]);

  // Handle function calls from Voice Agent API
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data !== 'string') return;

      try {
        const message = JSON.parse(event.data);
        if (message.type !== 'FunctionCallRequest') return;

        const { function_name, function_call_id, input } = message;
        let success = true;
        let formattedValue = '';
        const newFields = { ...currentFields };

        switch (function_name) {
          case 'set_patient_name':
            newFields.demographics.patientName = input.name;
            formattedValue = `Patient Name: ${input.name}\n`;
            break;
          case 'set_date_of_birth':
            newFields.demographics.dateOfBirth = input.dateOfBirth;
            formattedValue = `Date of Birth: ${input.dateOfBirth}\n`;
            break;
          case 'set_gender':
            newFields.demographics.gender = input.gender;
            formattedValue = `Gender: ${input.gender}\n`;
            break;
          case 'set_mrn':
            newFields.demographics.medicalRecordNumber = input.mrn;
            formattedValue = `Medical Record Number: ${input.mrn}\n`;
            break;
          case 'set_visit_date':
            newFields.visitInfo.dateOfVisit = input.date;
            formattedValue = `Visit Date: ${input.date}\n`;
            break;
          case 'set_visit_time':
            newFields.visitInfo.timeOfVisit = input.time;
            formattedValue = `Visit Time: ${input.time}\n`;
            break;
          case 'set_visit_type':
            newFields.visitInfo.visitType = input.visitType;
            formattedValue = `Visit Type: ${input.visitType}\n`;
            break;
          case 'set_provider_name':
            newFields.visitInfo.providerName = input.provider;
            formattedValue = `Provider: ${input.provider}\n`;
            break;
          case 'set_chief_complaint':
            newFields.clinicalInfo.chiefComplaint = input.complaint;
            formattedValue = `Chief Complaint: ${input.complaint}\n`;
            break;
          case 'set_present_illness':
            newFields.clinicalInfo.presentIllness = input.illness;
            formattedValue = `Present Illness: ${input.illness}\n`;
            break;
          case 'set_review_of_systems':
            newFields.clinicalInfo.reviewOfSystems = input.systems;
            formattedValue = `Review of Systems: ${input.systems}\n`;
            break;
          case 'set_physical_exam':
            newFields.clinicalInfo.physicalExam = input.exam;
            formattedValue = `Physical Examination: ${input.exam}\n`;
            break;
          case 'set_assessment':
            newFields.clinicalInfo.assessment = input.assessment;
            formattedValue = `Assessment: ${input.assessment}\n`;
            break;
          case 'set_plan':
            newFields.clinicalInfo.plan = input.plan;
            formattedValue = `Plan: ${input.plan}\n`;
            break;
          case 'other_notes':
            formattedValue = `Other Notes: ${input.notes}\n`;
            break;
          case 'save_note':
            handleSaveNote();
            break;
          case 'clear_note':
            setCurrentFields({
              demographics: {},
              visitInfo: {},
              clinicalInfo: {},
            });
            setCurrentNote('');
            break;
          default:
            success = false;
            break;
        }

        if (formattedValue) {
          setCurrentNote(prev => prev + formattedValue);
          setCurrentFields(newFields);
        }

        sendSocketMessage(socket, {
          type: "FunctionCallResponse",
          function_call_id,
          output: success ? "success" : "error"
        });
      } catch (error) {
        console.error('Error handling message:', error);
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket, currentFields, handleSaveNote]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Clinical Notes</h2>
        <div className="flex items-center space-x-2">
          <div
            className={"h-3 w-3 rounded-full " + 
              (isRecording && isActiveNote ? "bg-green-500 animate-pulse" : "bg-gray-300")
            }
          />
          <span className="text-sm text-gray-400">
            {isActiveNote ? (isRecording ? "Recording note..." : "Note started") : "Ready to start new note"}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-gray-800 p-4">
          <textarea
            ref={textareaRef}
            value={currentNote}
            onChange={(e) => {
              setCurrentNote(e.target.value);
              adjustTextareaHeight();
            }}
            className="w-full min-h-[200px] max-h-[600px] overflow-y-auto resize-none border-0 focus:ring-0 bg-gray-900 text-gray-200 placeholder-gray-500"
            placeholder={isActiveNote ? "Recording note... Start with patient name and visit date" : "Say 'Start note' to begin a new note..."}
          />
          <div className="flex justify-between mt-2">
            <div className="text-sm text-gray-500">
              {isActiveNote ? "Note in progress..." : "No active note"}
            </div>
            <div className="space-x-2">
              <button
                onClick={() => {
                  setCurrentNote("");
                  setCurrentFields({
                    demographics: {},
                    visitInfo: {},
                    clinicalInfo: {},
                  });
                }}
                className="px-4 py-2 text-gray-400 hover:text-gray-200"
              >
                Clear
              </button>
              <button
                onClick={handleSaveNote}
                className="px-4 py-2 bg-gray-800 text-gray-200 rounded hover:bg-gray-700"
                disabled={!isActiveNote}
              >
                Save Note
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {notes.map((note) => (
            <div key={note.id} className="rounded-lg border border-gray-800 p-4 bg-gray-900/50">
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>{new Date(note.timestamp).toLocaleString()}</span>
                <div className="flex items-center space-x-4">
                  <span>Last modified: {new Date(note.lastModified).toLocaleString()}</span>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="text-gray-500 hover:text-red-500 transition-colors"
                    title="Delete note"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-gray-200">{note.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 