"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useVoiceBot } from '../../context/VoiceBotContextProvider';
import { useDeepgram } from '../../context/DeepgramContextProvider';
import { sendSocketMessage } from '../../utils/deepgramUtils';
import { v4 as uuidv4 } from 'uuid';
import { type Appointment, addAppointment, updateAppointment, getAllAppointments, deleteAppointment } from '../../utils/idb';

export default function Scheduling() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentAppointment, setCurrentAppointment] = useState({
    type: '',
    timestamp: '',
    duration: 30,
    notes: '',
    patientName: '',
    mrn: '',
  });
  const [isRecording, setIsRecording] = useState(false);
  const [isActiveAppointment, setIsActiveAppointment] = useState(false);
  const { status, messages } = useVoiceBot();
  const { socket } = useDeepgram();
  const hasStartedScheduling = useRef(false);
  const lastProcessedMessage = useRef('');

  // Load appointments from IndexedDB on component mount
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const savedAppointments = await getAllAppointments();
        setAppointments(savedAppointments.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
      } catch (error) {
        console.error('Error loading appointments:', error);
      }
    };
    loadAppointments();
  }, []);

  // Update recording state based on voice bot status
  useEffect(() => {
    console.log('Recording state effect triggered:', {
      currentStatus: status,
      currentIsRecording: isRecording,
      newIsRecording: status === 'listening'
    });
    setIsRecording(status === 'listening');
  }, [status]);

  const handleSchedule = useCallback(async () => {
    if (!currentAppointment.type || !currentAppointment.timestamp || !currentAppointment.patientName || !currentAppointment.mrn) {
      console.log('Missing required appointment information');
      return;
    }

    try {
      const newAppointment: Appointment = {
        id: uuidv4(),
        timestamp: new Date(currentAppointment.timestamp),
        type: currentAppointment.type,
        duration: currentAppointment.duration,
        notes: currentAppointment.notes,
        patientName: currentAppointment.patientName,
        mrn: currentAppointment.mrn,
        status: 'scheduled',
      };

      // Save to IndexedDB
      await addAppointment(newAppointment);

      // Update local state
      setAppointments(prevAppointments => [...prevAppointments, newAppointment].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));

      setCurrentAppointment({
        type: '',
        timestamp: '',
        duration: 30,
        notes: '',
        patientName: '',
        mrn: '',
      });
      setIsActiveAppointment(false);
    } catch (error) {
      console.error('Error scheduling appointment:', error);
    }
  }, [currentAppointment]);

  // Handle voice commands
  useEffect(() => {
    if (messages.length === 0) return;
    
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || !('user' in lastMessage)) return;
    
    const content = lastMessage.user.toLowerCase();
    
    // Skip if we've already processed this message
    if (content === lastProcessedMessage.current) return;
    lastProcessedMessage.current = content;
    
    if ((content.includes('scheduling') || content.includes('start scheduling'))) {
      console.log('Starting scheduling process - resetting form');
      setCurrentAppointment({
        type: '',
        timestamp: '',
        duration: 30,
        notes: '',
        patientName: '',
        mrn: '',
      });
      hasStartedScheduling.current = true;
    } else if ((content.includes('schedule') || content.includes('schedule appointment')) && isActiveAppointment) {
      console.log('Handling schedule command');
      handleSchedule();
    } else if (content.includes('type') && content.includes('checkup')) {
      console.log('Setting appointment type to checkup');
      setCurrentAppointment(prev => ({
        ...prev,
        type: 'checkup'
      }));
    }
  }, [messages, isActiveAppointment, handleSchedule]);

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

        switch (function_name) {
          case 'set_patient_name':
            console.log('Setting patient name:', input.name);
            setIsActiveAppointment(true);
            setCurrentAppointment(prev => ({
              ...prev,
              patientName: input.name
            }));
            break;
          case 'set_mrn':
            console.log('Setting MRN:', input.mrn);
            setCurrentAppointment(prev => ({
              ...prev,
              mrn: input.mrn
            }));
            break;
          case 'set_appointment_type':
            console.log('Setting appointment type:', input.type);
            setCurrentAppointment(prev => ({
              ...prev,
              type: input.type
            }));
            break;
          case 'set_appointment_datetime':
            console.log('Setting appointment datetime:', input.datetime);
            setCurrentAppointment(prev => ({
              ...prev,
              timestamp: input.datetime
            }));
            break;
          case 'set_appointment_duration':
            if (input.duration >= 30) {
              console.log('Setting appointment duration:', input.duration);
              setCurrentAppointment(prev => ({
                ...prev,
                duration: input.duration
              }));
            }
            break;
          case 'set_appointment_notes':
            console.log('Setting appointment notes:', input.notes);
            setCurrentAppointment(prev => ({
              ...prev,
              notes: input.notes
            }));
            break;
          case 'schedule_appointment':
            handleSchedule();
            break;
          case 'clear_appointment':
            setCurrentAppointment({
              type: '',
              timestamp: '',
              duration: 30,
              notes: '',
              patientName: '',
              mrn: '',
            });
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
      } catch (error) {
        console.error('Error handling message:', error);
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket, handleSchedule]);

  const handleStatusChange = async (id: string, status: 'scheduled' | 'completed' | 'cancelled') => {
    try {
      const updatedAppointments = appointments.map(appointment => 
        appointment.id === id ? { ...appointment, status } : appointment
      );
      
      // Update in IndexedDB
      const appointmentToUpdate = updatedAppointments.find(a => a.id === id);
      if (appointmentToUpdate) {
        await updateAppointment(appointmentToUpdate);
      }

      // Update local state
      setAppointments(updatedAppointments);
    } catch (error) {
      console.error('Error updating appointment status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Delete from IndexedDB
      await deleteAppointment(id);
      
      // Update local state
      setAppointments(prevAppointments => prevAppointments.filter(appointment => appointment.id !== id));
    } catch (error) {
      console.error('Error deleting appointment:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Scheduling</h2>
        <div className="flex items-center space-x-2">
          <div
            className={`h-3 w-3 rounded-full ${
              isRecording && isActiveAppointment ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
            }`}
          />
          <span className="text-sm text-gray-400">
            {isActiveAppointment ? (isRecording ? "Recording appointment..." : "Appointment started") : "Ready to start new appointment"}
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
                value={currentAppointment.patientName}
                onChange={(e) => setCurrentAppointment(prev => ({ ...prev, patientName: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter patient name"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Medical Record Number (MRN)</label>
              <input
                type="text"
                value={currentAppointment.mrn}
                onChange={(e) => setCurrentAppointment(prev => ({ ...prev, mrn: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter MRN"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Type</label>
              <input
                type="text"
                value={currentAppointment.type}
                onChange={(e) => setCurrentAppointment(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter appointment type"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Date & Time</label>
              <input
                type="datetime-local"
                value={currentAppointment.timestamp}
                onChange={(e) => setCurrentAppointment(prev => ({ ...prev, timestamp: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Duration (minutes)</label>
              <input
                type="number"
                value={currentAppointment.duration}
                onChange={(e) => setCurrentAppointment(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 bg-gray-800 rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Notes</label>
              <input
                type="text"
                value={currentAppointment.notes}
                onChange={(e) => setCurrentAppointment(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter any notes"
              />
            </div>
          </div>
          <div className="flex justify-between mt-4">
            <div className="text-sm text-gray-400">
              {isActiveAppointment ? (isRecording ? "Recording appointment..." : "Appointment started") : "Say 'Start Scheduling' to begin"}
            </div>
            <div className="space-x-2">
              <button
                onClick={() => setCurrentAppointment({
                    type: '',
                    timestamp: '',
                    duration: 30,
                    notes: '',
                  patientName: '',
                  mrn: '',
                })}
                className="px-4 py-2 text-gray-400 hover:text-gray-200"
              >
                Clear
              </button>
              <button
                onClick={handleSchedule}
                className="px-4 py-2 bg-gray-800 text-gray-200 rounded hover:bg-gray-700"
                disabled={!isActiveAppointment}
              >
                Schedule
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="rounded-lg border border-gray-800 p-4 bg-gray-900/50">
              <div className="flex justify-between items-start">
                <div>
                  <div className="mb-2">
                    <h3 className="font-medium text-gray-200">{appointment.patientName}</h3>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">MRN: {appointment.mrn}</p>
                    <p className="text-sm text-gray-400">Type: {appointment.type}</p>
                    <p className="text-sm text-gray-400">
                    Date: {new Date(appointment.timestamp).toLocaleString()}
                  </p>
                    <p className="text-sm text-gray-400">Duration: {appointment.duration} minutes</p>
                  {appointment.notes && (
                      <p className="text-sm text-gray-400">Notes: {appointment.notes}</p>
                  )}
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      appointment.status === 'completed'
                          ? 'bg-green-900/50 text-green-200'
                        : appointment.status === 'cancelled'
                          ? 'bg-red-900/50 text-red-200'
                          : 'bg-yellow-900/50 text-yellow-200'
                    }`}
                  >
                    {appointment.status}
                  </span>
                  <select
                    value={appointment.status}
                    onChange={(e) =>
                      handleStatusChange(
                        appointment.id,
                        e.target.value as 'scheduled' | 'completed' | 'cancelled'
                      )
                    }
                      className="text-sm bg-gray-800 border-gray-700 rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button
                    onClick={() => handleDelete(appointment.id)}
                    className="text-gray-500 hover:text-red-500 transition-colors"
                    title="Delete appointment"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 