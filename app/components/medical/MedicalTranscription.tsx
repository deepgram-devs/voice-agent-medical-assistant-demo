import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Tab } from '@headlessui/react';
import ClinicalNotes from './ClinicalNotes';
import DrugDispatch from './DrugDispatch';
import Scheduling from './Scheduling';
import { useVoiceBot } from '../../context/VoiceBotContextProvider';
import { clinicalNotesPrompt, drugDispatchPrompt, schedulingPrompt } from '../../lib/medicalPrompts';
import { useDeepgram } from '../../context/DeepgramContextProvider';
import { sendSocketMessage } from '../../utils/deepgramUtils';
import { checkAndAddDefaultItems } from '../../utils/idb';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

// Format date and time for the prompts
function formatDateTime() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { 
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  return `Today's Date is: ${dateStr}\nCurrent Time is: ${timeStr}\n\n`;
}

// Move categories outside component to prevent recreation
const categories = {
  'Clinical Notes': {
    component: ClinicalNotes,
    getPrompt: () => formatDateTime() + clinicalNotesPrompt,
    startCommands: ['clinical note', 'start clinical note']
  },
  'Drug Dispatch': {
    component: DrugDispatch,
    getPrompt: () => formatDateTime() + drugDispatchPrompt,
    startCommands: [
      'drug dispatch',
      'start drug dispatch',
      'drove dispatch',
      'drill dispatch',
      'rogue dispatch',
      'drug dispatch',
      'drugs dispatch',
      'drug dispatched',
      'start drove dispatch',
      'start drill dispatch',
      'start rogue dispatch',
      'start drugs dispatch',
      'start drug dispatched'
    ]
  },
  'Scheduling': {
    component: Scheduling,
    getPrompt: () => formatDateTime() + schedulingPrompt,
    startCommands: ['scheduling', 'start scheduling']
  }
};

export default function MedicalTranscription() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { messages } = useVoiceBot();
  const { socket, socketState } = useDeepgram();
  const lastProcessedMessage = useRef('');
  const dateTimeUpdateInterval = useRef<NodeJS.Timeout>();

  // Check and add default items on mount
  useEffect(() => {
    const initializeDefaultItems = async () => {
      try {
        await checkAndAddDefaultItems();
      } catch (error) {
        console.error('Error initializing default items:', error);
      }
    };
    initializeDefaultItems();
  }, []);

  // Update date/time every minute
  useEffect(() => {
    const updateDateTime = () => {
      if (socket && socketState === 1) {
        const values = Object.values(categories);
        const category = values[selectedIndex];
        if (category) {
          sendSocketMessage(socket, {
            type: "UpdateInstructions",
            instructions: category.getPrompt()
          });
        }
      }
    };

    // Initial update
    updateDateTime();

    // Set up interval for updates
    dateTimeUpdateInterval.current = setInterval(updateDateTime, 60000); // Update every minute

    return () => {
      if (dateTimeUpdateInterval.current) {
        clearInterval(dateTimeUpdateInterval.current);
      }
    };
  }, [selectedIndex, socket, socketState]);

  const handleModeSwitch = useCallback((newIndex: number) => {
    // Don't switch if we're already in this mode
    if (newIndex === selectedIndex) {
      console.log('[DEBUG] Skipping mode switch - already in target mode:', newIndex);
      return;
    }

    console.log('[DEBUG] handleModeSwitch called:', {
      newIndex,
      currentIndex: selectedIndex,
      socketState,
      hasSocket: !!socket
    });
    
    // Force a state update to ensure the tab changes
    setSelectedIndex(newIndex);
    
    // Update instructions if socket is connected
    if (socket && socketState === 1) {
      const values = Object.values(categories);
      const category = values[newIndex];
      if (category) {
        console.log('[DEBUG] Sending UpdateInstructions from handleModeSwitch:', {
          category: Object.keys(categories)[newIndex],
          promptLength: category.getPrompt().length
        });
        sendSocketMessage(socket, {
          type: "UpdateInstructions",
          instructions: category.getPrompt()
        });
      }
    }
  }, [selectedIndex, socket, socketState]);

  // Handle voice messages for mode switching
  useEffect(() => {
    if (messages.length === 0) return;
    
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || !('user' in lastMessage)) return;
    
    const content = lastMessage.user.toLowerCase();
    
    // Skip if we've already processed this message
    if (content === lastProcessedMessage.current) return;
    lastProcessedMessage.current = content;
    
    if (content.includes('clinical note') || content.includes('start clinical note')) {
      handleModeSwitch(0);
    } else if (content.includes('drug dispatch') || content.includes('start drug dispatch')) {
      handleModeSwitch(1);
    } else if (content.includes('scheduling') || content.includes('start scheduling')) {
      handleModeSwitch(2);
    }
  }, [messages, handleModeSwitch]);

  // Force rerender of Tab.Group when selectedIndex changes
  useEffect(() => {
    console.log('Selected index changed to:', selectedIndex);
  }, [selectedIndex]);

  return (
    <div className="mt-14 w-full px-2 sm:px-0">
      <Tab.Group selectedIndex={selectedIndex} onChange={(index) => {
        console.log('Tab.Group onChange called with index:', index);
        handleModeSwitch(index);
      }}>
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-900 p-1 w-full border border-gray-800">
          {Object.keys(categories).map((category) => (
            <Tab
              key={category}
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-3 text-sm font-medium leading-5 transition-all duration-150',
                  'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none',
                  selected
                    ? 'bg-gray-800 text-gray-100 shadow-lg shadow-black/30'
                    : 'text-gray-400 hover:bg-gray-800/30 hover:text-gray-100'
                )
              }
            >
              {category}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-4">
          {Object.values(categories).map(({ component: Component }, idx) => (
            <Tab.Panel
              key={idx}
              className={classNames(
                'rounded-xl bg-gray-900/50 p-4 text-gray-200 border border-gray-800',
                'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none'
              )}
            >
              <Component />
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>

      {/* Voice Command Instructions - Floating Sidebar */}
      <div className="absolute -right-[420px] top-[288px] w-[400px]">
        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Voice Commands:</h3>
          <div className="space-y-4">
            {/* Mode Switching Commands */}
            <div>
              <ul className="text-sm text-gray-400">
                <li>• &quot;Start Clinical Note&quot; - Switch to Clinical Notes</li>
                <li>• &quot;Start Drug Dispatch&quot; - Switch to Drug Dispatch</li>
                <li>• &quot;Start Scheduling&quot; - Switch to Scheduling</li>
              </ul>
            </div>

            {/* Clinical Note Commands - Only show when Clinical Notes tab is active */}
            {selectedIndex === 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-1">Clinical Note Commands:</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Demographics:</li>
                  <li className="ml-4">- &quot;Patient name is [name]&quot;</li>
                  <li className="ml-4">- &quot;Date of birth is [date]&quot;</li>
                  <li className="ml-4">- &quot;Gender is [gender]&quot;</li>
                  <li className="ml-4">- &quot;MRN is [number]&quot;</li>
                  <li>• Visit Information:</li>
                  <li className="ml-4">- &quot;Visit date is [date]&quot;</li>
                  <li className="ml-4">- &quot;Visit time is [time]&quot;</li>
                  <li className="ml-4">- &quot;Visit type is [type]&quot;</li>
                  <li className="ml-4">- &quot;Provider is [name]&quot;</li>
                  <li>• Clinical Information:</li>
                  <li className="ml-4">- &quot;Chief complaint is [complaint]&quot;</li>
                  <li className="ml-4">- &quot;Present illness is [details]&quot;</li>
                  <li className="ml-4">- &quot;Review of systems shows [findings]&quot;</li>
                  <li className="ml-4">- &quot;Physical exam reveals [findings]&quot;</li>
                  <li className="ml-4">- &quot;Assessment is [diagnosis]&quot;</li>
                  <li className="ml-4">- &quot;Plan is [treatment]&quot;</li>
                  <li>• Note Controls:</li>
                  <li className="ml-4">- &quot;Save note&quot;, &quot;Finish note&quot;, &quot;End note&quot;</li>
                  <li className="ml-4">- &quot;Clear note&quot;, &quot;Delete note&quot;, &quot;Reset note&quot;</li>
                </ul>
              </div>
            )}

            {/* Drug Dispatch Commands - Only show when Drug Dispatch tab is active */}
            {selectedIndex === 1 && (
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-1">Drug Dispatch Commands:</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Patient Information:</li>
                  <li className="ml-4">- &quot;Patient name is [name]&quot;</li>
                  <li className="ml-4">- &quot;MRN is [number]&quot;</li>
                  <li>• Prescription Details:</li>
                  <li className="ml-4">- &quot;Medication is [name]&quot;</li>
                  <li className="ml-4">- &quot;Dosage is [amount]&quot;</li>
                  <li className="ml-4">- &quot;Frequency is [schedule]&quot;</li>
                  <li className="ml-4">- &quot;Pharmacy is [location]&quot;</li>
                  <li>• Dispatch Controls:</li>
                  <li className="ml-4">- &quot;Dispatch prescription&quot; - Save and dispatch</li>
                  <li className="ml-4">- &quot;Clear prescription&quot; - Clear all fields</li>
                </ul>
              </div>
            )}

            {/* Scheduling Commands - Only show when Scheduling tab is active */}
            {selectedIndex === 2 && (
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-1">Scheduling Commands:</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Appointment Details:</li>
                  <li className="ml-4">- &quot;Type is [appointment type]&quot;</li>
                  <li className="ml-4">- &quot;Date is [date]&quot;</li>
                  <li className="ml-4">- &quot;Duration is [minutes]&quot; (minimum 30)</li>
                  <li className="ml-4">- &quot;Notes are [details]&quot;</li>
                  <li>• Schedule Controls:</li>
                  <li className="ml-4">- &quot;Schedule appointment&quot; - Save appointment</li>
                  <li className="ml-4">- &quot;Clear appointment&quot; - Clear all fields</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 