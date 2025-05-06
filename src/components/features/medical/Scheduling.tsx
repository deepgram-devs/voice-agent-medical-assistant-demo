import { useState, useEffect, useRef, useCallback } from 'react';
import { useVoiceBot } from "../../../context/VoiceBotContextProvider";
import { useDeepgram } from '../../../context/DeepgramContextProvider';
import { sendSocketMessage } from '../../../utils/deepgramUtils';
import { v4 as uuidv4 } from 'uuid';
import { type Appointment, addAppointment, updateAppointment, getAllAppointments, deleteAppointment } from '../../../utils/idb';

export default function Scheduling() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentAppointment, setCurrentAppointment] = useState<Omit<Appointment, 'id' | 'timestamp'>>({
    patientName: '',
    mrn: '',
    date: '',
    time: '',
    provider: '',
    reason: '',
    status: 'pending'
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
    if (!currentAppointment.patientName || !currentAppointment.mrn || !currentAppointment.date || !currentAppointment.time || !currentAppointment.provider || !currentAppointment.reason) {
      console.log('Missing required appointment information');
      return;
    }

    try {
      const newAppointment: Appointment = {
        id: uuidv4(),
        timestamp: new Date(`${currentAppointment.date}T${currentAppointment.time}`),
        patientName: currentAppointment.patientName,
        mrn: currentAppointment.mrn,
        date: currentAppointment.date,
        time: currentAppointment.time,
        provider: currentAppointment.provider,
        reason: currentAppointment.reason,
        status: 'scheduled'
      };

      // Save to IndexedDB
      await addAppointment(newAppointment);

      // Update local state
      setAppointments(prevAppointments => [...prevAppointments, newAppointment].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));

      setCurrentAppointment({
        patientName: '',
        mrn: '',
        date: '',
        time: '',
        provider: '',
        reason: '',
        status: 'pending'
      });

      setIsActiveAppointment(false);
    } catch (error) {
      console.error('Error scheduling appointment:', error);
    }
  }, [currentAppointment]);

  // Handle function calls from Voice Agent API
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        // If it's an ArrayBuffer, try to decode as JSON
        if (event.data instanceof ArrayBuffer) {
          const text = new TextDecoder().decode(event.data);
          try {
            const message = JSON.parse(text);
            if (message.type === 'FunctionCallRequest') {
              const { functions } = message;

              // Handle each function call
              const handleFunctionCalls = async () => {
                try {
                  for (const func of functions) {
                    const { id, name, arguments: argsStr } = func;
                    const args = JSON.parse(argsStr);

                    switch (name) {
                      case 'set_patient_name':
                        setCurrentAppointment(prev => ({
                          ...prev,
                          patientName: args.name
                        }));
                        break;
                      case 'set_mrn':
                        setCurrentAppointment(prev => ({
                          ...prev,
                          mrn: args.mrn
                        }));
                        break;
                      case 'set_date':
                        setCurrentAppointment(prev => ({
                          ...prev,
                          date: args.date
                        }));
                        break;
                      case 'set_time':
                        setCurrentAppointment(prev => ({
                          ...prev,
                          time: args.time
                        }));
                        break;
                      case 'set_provider':
                        setCurrentAppointment(prev => ({
                          ...prev,
                          provider: args.provider
                        }));
                        break;
                      case 'set_reason':
                        setCurrentAppointment(prev => ({
                          ...prev,
                          reason: args.reason
                        }));
                        break;
                      case 'schedule_appointment':
                        await handleSchedule();
                        break;
                      case 'clear_appointment':
                        setCurrentAppointment({
                          patientName: '',
                          mrn: '',
                          date: '',
                          time: '',
                          provider: '',
                          reason: '',
                          status: 'pending'
                        });
                        break;
                      default:
                        throw new Error(`Unknown function: ${name}`);
                    }

                    // Send success response
                    sendSocketMessage(socket, {
                      type: 'FunctionCallResponse',
                      id,
                      name,
                      content: 'Success'
                    });
                  }
                } catch (error) {
                  console.error('Error handling function calls:', error);
                  // Send error response for each failed function
                  for (const func of functions) {
                    sendSocketMessage(socket, {
                      type: 'FunctionCallResponse',
                      id: func.id,
                      name: func.name,
                      content: error instanceof Error ? error.message : 'Unknown error'
                    });
                  }
                }
              };

              handleFunctionCalls();
            }
          } catch {
            // Not JSON, likely audio data: handle or ignore as needed
          }
        } else if (typeof event.data === 'string') {
          // (Optional: if you ever send string JSON)
          const message = JSON.parse(event.data);
          // handle JSON message
        } else {
          // Handle other types (e.g., Blob) if needed
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket, handleSchedule]);

  // Handle voice commands
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || !('user' in lastMessage)) return;

    const content = lastMessage.user.toLowerCase();

    // Skip if we've already processed this message
    if (content === lastProcessedMessage.current) return;
    lastProcessedMessage.current = content;

    if (content.includes('scheduling') || content.includes('start scheduling')) {
      setIsActiveAppointment(true);
      setCurrentAppointment({
        patientName: '',
        mrn: '',
        date: '',
        time: '',
        provider: '',
        reason: '',
        status: 'pending'
      });
    } else if (content.includes('cancel scheduling')) {
      setIsActiveAppointment(false);
      setCurrentAppointment({
        patientName: '',
        mrn: '',
        date: '',
        time: '',
        provider: '',
        reason: '',
        status: 'pending'
      });
    }
  }, [messages]);

  const handleStatusChange = async (id: string, status: 'scheduled' | 'cancelled') => {
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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-200">Appointment Scheduling</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`px-4 py-2 rounded-md ${isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-200 mb-4">New Appointment</h3>
            <div className="space-y-4">
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
                <label className="block text-sm font-medium text-gray-300">Date</label>
                <input
                  type="date"
                  value={currentAppointment.date}
                  onChange={(e) => setCurrentAppointment(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Time</label>
                <input
                  type="time"
                  value={currentAppointment.time}
                  onChange={(e) => setCurrentAppointment(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Provider</label>
                <input
                  type="text"
                  value={currentAppointment.provider}
                  onChange={(e) => setCurrentAppointment(prev => ({ ...prev, provider: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter provider name"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Reason</label>
                <input
                  type="text"
                  value={currentAppointment.reason}
                  onChange={(e) => setCurrentAppointment(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter appointment reason"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setCurrentAppointment({
                    patientName: '',
                    mrn: '',
                    date: '',
                    time: '',
                    provider: '',
                    reason: '',
                    status: 'pending'
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
                    <p className="text-sm text-gray-400">Date: {appointment.date}</p>
                    <p className="text-sm text-gray-400">Time: {appointment.time}</p>
                    <p className="text-sm text-gray-400">Provider: {appointment.provider}</p>
                    <p className="text-sm text-gray-400">Reason: {appointment.reason}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 text-xs rounded ${appointment.status === 'scheduled'
                        ? 'bg-green-900/50 text-green-200'
                        : appointment.status === 'cancelled'
                          ? 'bg-red-900/50 text-red-200'
                          : 'bg-yellow-900/50 text-yellow-200'
                        }`}
                    >
                      {appointment.status}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      Cancel
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