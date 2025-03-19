"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useVoiceBot } from '../../context/VoiceBotContextProvider';
import { useDeepgram } from '../../context/DeepgramContextProvider';
import { sendSocketMessage } from '../../utils/deepgramUtils';
import { v4 as uuidv4 } from 'uuid';
import { type DrugDispatchRecord, addDrugDispatch, updateDrugDispatch, getAllDrugDispatches, deleteDrugDispatch } from '../../utils/idb';

export default function DrugDispatch() {
  const [dispatches, setDispatches] = useState<DrugDispatchRecord[]>([]);
  const [currentDispatch, setCurrentDispatch] = useState<Partial<DrugDispatchRecord>>({
    patientName: '',
    mrn: '',
    medication: '',
    dosage: '',
    frequency: '',
    pharmacy: '',
    status: 'pending'
  });
  const [isRecording, setIsRecording] = useState(false);
  const [isActiveDispatch, setIsActiveDispatch] = useState(false);
  const { status, messages } = useVoiceBot();
  const { socket } = useDeepgram();

  // Load dispatches from IndexedDB on component mount
  useEffect(() => {
    const loadDispatches = async () => {
      try {
        const savedDispatches = await getAllDrugDispatches();
        setDispatches(savedDispatches.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
      } catch (error) {
        console.error('Error loading drug dispatches:', error);
      }
    };
    loadDispatches();
  }, []);

  // Update recording state based on voice bot status
  useEffect(() => {
    setIsRecording(status === 'listening');
  }, [status]);

  const handleDispatch = useCallback(async () => {
    // Check for required fields including patient information
    if (!currentDispatch.patientName || !currentDispatch.mrn) {
      console.log('Missing patient information');
      return;
    }
    if (!currentDispatch.medication || !currentDispatch.dosage || !currentDispatch.pharmacy) {
      console.log('Missing prescription information');
      return;
    }

    try {
      const newDispatch: DrugDispatchRecord = {
        id: uuidv4(),
        timestamp: new Date(),
        patientName: currentDispatch.patientName!,
        mrn: currentDispatch.mrn!,
        medication: currentDispatch.medication!,
        dosage: currentDispatch.dosage!,
        frequency: currentDispatch.frequency || '',
        pharmacy: currentDispatch.pharmacy!,
        status: 'pending'
      };

      // Save to IndexedDB
      await addDrugDispatch(newDispatch);

      // Update local state
      setDispatches(prevDispatches => [...prevDispatches, newDispatch].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));

      setCurrentDispatch({
        patientName: '',
        mrn: '',
        medication: '',
        dosage: '',
        frequency: '',
        pharmacy: '',
        status: 'pending'
      });
      setIsActiveDispatch(false);
    } catch (error) {
      console.error('Error creating drug dispatch:', error);
    }
  }, [currentDispatch]);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data === 'string') {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'FunctionCallRequest') {
            const { function_name, function_call_id, input } = message;
            
            let success = true;

            switch (function_name) {
              case 'set_medication':
                setCurrentDispatch(prev => ({
                  ...prev,
                  medication: input.medication
                }));
                break;
              case 'set_dosage':
                setCurrentDispatch(prev => ({
                  ...prev,
                  dosage: input.dosage
                }));
                break;
              case 'set_frequency':
                setCurrentDispatch(prev => ({
                  ...prev,
                  frequency: input.frequency
                }));
                break;
              case 'set_pharmacy':
                setCurrentDispatch(prev => ({
                  ...prev,
                  pharmacy: input.pharmacy
                }));
                break;
              case 'dispatch_prescription':
                handleDispatch();
                break;
              case 'clear_prescription':
                setCurrentDispatch({
                  medication: '',
                  dosage: '',
                  frequency: '',
                  pharmacy: '',
                });
                break;
              case 'set_patient_name':
                setCurrentDispatch(prev => ({ ...prev, patientName: input.name }));
                break;
              case 'set_mrn':
                setCurrentDispatch(prev => ({ ...prev, mrn: input.mrn }));
                break;
              default:
                success = false;
                break;
            }

            // Send response back
            sendSocketMessage(socket, {
              type: "FunctionCallResponse",
              function_call_id,
              output: success ? "success" : "error"
            });
          }
        } catch (error) {
          console.error('Error handling message:', error);
        }
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket, currentDispatch, handleDispatch]);

  // Handle voice commands
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && 'user' in lastMessage) {
        const content = lastMessage.user.toLowerCase();
        
        if (content.includes('start drug dispatch')) {
          setIsActiveDispatch(true);
        } else if (content.includes('cancel drug dispatch')) {
          setIsActiveDispatch(false);
          setCurrentDispatch({
            patientName: '',
            mrn: '',
            medication: '',
            dosage: '',
            frequency: '',
            pharmacy: '',
            status: 'pending'
          });
        }
      }
    }
  }, [messages]);

  const handleStatusChange = async (id: string, status: 'pending' | 'dispatched') => {
    try {
      const updatedDispatches = dispatches.map(dispatch => 
        dispatch.id === id ? { ...dispatch, status } : dispatch
      );

      // Update in IndexedDB
      const dispatchToUpdate = updatedDispatches.find(d => d.id === id);
      if (dispatchToUpdate) {
        await updateDrugDispatch(dispatchToUpdate);
      }

      // Update local state
      setDispatches(updatedDispatches);
    } catch (error) {
      console.error('Error updating dispatch status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Delete from IndexedDB
      await deleteDrugDispatch(id);

      // Update local state
      setDispatches(prevDispatches => prevDispatches.filter(dispatch => dispatch.id !== id));
    } catch (error) {
      console.error('Error deleting dispatch:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Drug Dispatch</h2>
        <div className="flex items-center space-x-2">
          <div
            className={`h-3 w-3 rounded-full ${
              isRecording && isActiveDispatch ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
            }`}
          />
          <span className="text-sm text-gray-400">
            {isActiveDispatch ? (isRecording ? "Recording prescription..." : "Prescription started") : "Ready to start new prescription"}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-gray-800 p-4 bg-gray-900/50">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Patient Name</label>
              <input
                type="text"
                value={currentDispatch.patientName}
                onChange={(e) => setCurrentDispatch(prev => ({ ...prev, patientName: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter patient name"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Medical Record Number (MRN)</label>
              <input
                type="text"
                value={currentDispatch.mrn}
                onChange={(e) => setCurrentDispatch(prev => ({ ...prev, mrn: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter MRN"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Medication</label>
              <input
                type="text"
                value={currentDispatch.medication}
                onChange={(e) => setCurrentDispatch(prev => ({ ...prev, medication: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter medication name"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Dosage</label>
              <input
                type="text"
                value={currentDispatch.dosage}
                onChange={(e) => setCurrentDispatch(prev => ({ ...prev, dosage: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter dosage"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Frequency</label>
              <input
                type="text"
                value={currentDispatch.frequency}
                onChange={(e) => setCurrentDispatch(prev => ({ ...prev, frequency: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter frequency"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Pharmacy</label>
              <input
                type="text"
                value={currentDispatch.pharmacy}
                onChange={(e) => setCurrentDispatch(prev => ({ ...prev, pharmacy: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter pharmacy"
              />
            </div>
          </div>
          <div className="flex justify-between mt-4">
            <div className="text-sm text-gray-400">
              {isActiveDispatch ? (isRecording ? "Recording prescription..." : "Prescription started") : "Say 'Start Drug Dispatch' to begin"}
            </div>
            <div className="space-x-2">
              <button
                onClick={() => setCurrentDispatch({
                  patientName: '',
                  mrn: '',
                  medication: '',
                  dosage: '',
                  frequency: '',
                  pharmacy: '',
                })}
                className="px-4 py-2 text-gray-400 hover:text-gray-200"
              >
                Clear
              </button>
              <button
                onClick={handleDispatch}
                className="px-4 py-2 bg-gray-800 text-gray-200 rounded hover:bg-gray-700"
                disabled={!isActiveDispatch}
              >
                Dispatch
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {dispatches.map((dispatch) => (
            <div key={dispatch.id} className="rounded-lg border border-gray-800 p-4 bg-gray-900/50">
              <div className="flex justify-between items-start">
                <div>
                  <div className="mb-2">
                    <h3 className="font-medium text-gray-200">{dispatch.patientName}</h3>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">MRN: {dispatch.mrn}</p>
                    <p className="text-sm text-gray-400">
                      Medication: {dispatch.medication}
                    </p>
                    <p className="text-sm text-gray-400">
                      {dispatch.dosage} - {dispatch.frequency}
                    </p>
                    <p className="text-sm text-gray-400">Pharmacy: {dispatch.pharmacy}</p>
                    <p className="text-sm text-gray-400">
                      Created: {new Date(dispatch.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        dispatch.status === 'dispatched'
                          ? 'bg-green-900/50 text-green-200'
                          : 'bg-yellow-900/50 text-yellow-200'
                      }`}
                    >
                      {dispatch.status}
                    </span>
                    <button
                      onClick={() =>
                        handleStatusChange(
                          dispatch.id,
                          dispatch.status === 'pending' ? 'dispatched' : 'pending'
                        )
                      }
                      className="text-gray-400 hover:text-gray-200"
                    >
                      {dispatch.status === 'pending' ? 'Mark Dispatched' : 'Mark Pending'}
                    </button>
                  </div>
                  <button
                    onClick={() => handleDelete(dispatch.id)}
                    className="text-gray-500 hover:text-red-500 transition-colors"
                    title="Delete dispatch"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 