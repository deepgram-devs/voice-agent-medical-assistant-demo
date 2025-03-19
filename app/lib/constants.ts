import { type AudioConfig, type StsConfig, type Voice } from "app/utils/deepgramUtils";
import { clinicalNotesPrompt } from './medicalPrompts';

const audioConfig: AudioConfig = {
  input: {
    encoding: "linear16",
    sample_rate: 16000,
  },
  output: {
    encoding: "linear16",
    sample_rate: 24000,
    container: "none",
  },
};

const baseConfig = {
  type: "SettingsConfiguration",
  audio: audioConfig,
  agent: {
    listen: { model: "46658e06-4884-4582-9bc2-e92ef7baa396" },
    speak: { model: "aura-2-speaker-45" },
    think: {
      provider: { type: "open_ai" },
      model: "gpt-4o",
    },
  },
};

export const stsConfig: StsConfig = {
  ...baseConfig,
  context: {
    messages: [
      {
        role: "assistant",
        content: "Hi I am Aura, your Medical Assistant! Which task would you like to start with?"
      },
    ],
    replay: true,
  },
  agent: {
    ...baseConfig.agent,
    think: {
      ...baseConfig.agent.think,
      provider: { type: "open_ai", fallback_to_groq: false },
      instructions: `${clinicalNotesPrompt}

Mode Switching Instructions:
When user says "Start Clinical Note" or switches to Clinical Notes mode:
- Clear previous context
- Follow clinicalNotesPrompt instructions
- Start by asking "What is the patient's name?"

When user says "Start Drug Dispatch" or switches to Drug Dispatch mode:
- Clear previous context
- Follow drugDispatchPrompt instructions
- Start by asking "What is the patient's name?"

When user says "Start Scheduling" or switches to Scheduling mode:
- Clear previous context
- Follow schedulingPrompt instructions
- Start by asking "What is the patient's name?"

IMPORTANT: When switching modes:
1. NEVER keep context from previous mode
2. ALWAYS start with asking for patient name
3. Follow mode-specific prompt exactly
4. Keep responses brief and direct
5. NO welcome messages or explanations when starting new mode`,
      functions: [
        // Demographics Functions
        {
          name: "set_patient_name",
          description: "Set the patient's name in the clinical note",
          parameters: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "The patient's full name"
              }
            },
            required: ["name"]
          }
        },
        {
          name: "set_date_of_birth",
          description: "Set the patient's date of birth in the clinical note",
          parameters: {
            type: "object",
            properties: {
              dateOfBirth: {
                type: "string",
                description: "Patient's date of birth in MM/DD/YYYY format"
              }
            },
            required: ["dateOfBirth"]
          }
        },
        {
          name: "set_gender",
          description: "Set the patient's gender in the clinical note",
          parameters: {
            type: "object",
            properties: {
              gender: {
                type: "string",
                description: "Patient's gender"
              }
            },
            required: ["gender"]
          }
        },
        {
          name: "set_mrn",
          description: "Set the patient's medical record number in the clinical note",
          parameters: {
            type: "object",
            properties: {
              mrn: {
                type: "string",
                description: "Patient's medical record number (MRN)"
              }
            },
            required: ["mrn"]
          }
        },
        // Visit Information Functions
        {
          name: "set_visit_date",
          description: "Set the date of visit in the clinical note",
          parameters: {
            type: "object",
            properties: {
              date: {
                type: "string",
                description: "Date of visit in MM/DD/YYYY format"
              }
            },
            required: ["date"]
          }
        },
        {
          name: "set_visit_time",
          description: "Set the time of visit in the clinical note",
          parameters: {
            type: "object",
            properties: {
              time: {
                type: "string",
                description: "Time of visit in HH:MM format"
              }
            },
            required: ["time"]
          }
        },
        {
          name: "set_visit_type",
          description: "Set the type of visit in the clinical note",
          parameters: {
            type: "object",
            properties: {
              visitType: {
                type: "string",
                description: "Type of visit (e.g., Initial, Follow-up, Emergency)"
              }
            },
            required: ["visitType"]
          }
        },
        {
          name: "set_provider_name",
          description: "Set the provider's name in the clinical note",
          parameters: {
            type: "object",
            properties: {
              provider: {
                type: "string",
                description: "Name of the healthcare provider"
              }
            },
            required: ["provider"]
          }
        },
        // Clinical Information Functions
        {
          name: "set_chief_complaint",
          description: "Set the chief complaint in the clinical note",
          parameters: {
            type: "object",
            properties: {
              complaint: {
                type: "string",
                description: "Patient's main complaint or reason for visit"
              }
            },
            required: ["complaint"]
          }
        },
        {
          name: "set_present_illness",
          description: "Set the present illness history in the clinical note",
          parameters: {
            type: "object",
            properties: {
              illness: {
                type: "string",
                description: "History of present illness"
              }
            },
            required: ["illness"]
          }
        },
        {
          name: "set_review_of_systems",
          description: "Set the review of systems in the clinical note",
          parameters: {
            type: "object",
            properties: {
              systems: {
                type: "string",
                description: "Review of systems findings"
              }
            },
            required: ["systems"]
          }
        },
        {
          name: "set_physical_exam",
          description: "Set the physical examination findings in the clinical note",
          parameters: {
            type: "object",
            properties: {
              exam: {
                type: "string",
                description: "Physical examination findings"
              }
            },
            required: ["exam"]
          }
        },
        {
          name: "set_assessment",
          description: "Set the assessment in the clinical note",
          parameters: {
            type: "object",
            properties: {
              assessment: {
                type: "string",
                description: "Clinical assessment or diagnosis"
              }
            },
            required: ["assessment"]
          }
        },
        {
          name: "set_plan",
          description: "Set the treatment plan in the clinical note",
          parameters: {
            type: "object",
            properties: {
              plan: {
                type: "string",
                description: "Treatment plan and recommendations"
              }
            },
            required: ["plan"]
          }
        },
        {
          name: "other_notes",
          description: "Add additional notes that don't fit into other categories",
          parameters: {
            type: "object",
            properties: {
              notes: {
                type: "string",
                description: "Additional notes or information"
              }
            },
            required: ["notes"]
          }
        },
        {
          name: "save_note",
          description: "Save the current clinical note",
          parameters: {
            type: "object",
            properties: {}
          }
        },
        {
          name: "clear_note",
          description: "Clear the current clinical note",
          parameters: {
            type: "object",
            properties: {}
          }
        },
        // Drug Dispatch Functions
        {
          name: "set_medication",
          description: "Set the medication name for the prescription",
          parameters: {
            type: "object",
            required: ["medication"],
            properties: {
              medication: {
                type: "string",
                description: "The name of the medication"
              }
            }
          }
        },
        {
          name: "set_dosage",
          description: "Set the dosage for the prescription",
          parameters: {
            type: "object",
            required: ["dosage"],
            properties: {
              dosage: {
                type: "string",
                description: "The dosage of the medication"
              }
            }
          }
        },
        {
          name: "set_frequency",
          description: "Set the frequency for the prescription",
          parameters: {
            type: "object",
            required: ["frequency"],
            properties: {
              frequency: {
                type: "string",
                description: "How often the medication should be taken"
              }
            }
          }
        },
        {
          name: "set_pharmacy",
          description: "Set the pharmacy for the prescription",
          parameters: {
            type: "object",
            required: ["pharmacy"],
            properties: {
              pharmacy: {
                type: "string",
                description: "The name or location of the pharmacy"
              }
            }
          }
        },
        {
          name: "dispatch_prescription",
          description: "Dispatch the current prescription",
          parameters: {
            type: "object",
            properties: {}
          }
        },
        {
          name: "clear_prescription",
          description: "Clear the current prescription form",
          parameters: {
            type: "object",
            properties: {}
          }
        },
        {
          name: "set_patient_name",
          description: "Set the patient name for the prescription",
          parameters: {
            type: "object",
            required: ["name"],
            properties: {
              name: {
                type: "string",
                description: "The patient's full name"
              }
            }
          }
        },
        {
          name: "set_mrn",
          description: "Set the patient medical record number for the prescription",
          parameters: {
            type: "object",
            required: ["mrn"],
            properties: {
              mrn: {
                type: "string",
                description: "The patient's medical record number (MRN)"
              }
            }
          }
        },
        // Scheduling Functions
        {
          name: "set_appointment_type",
          description: "Set the type of appointment",
          parameters: {
            type: "object",
            required: ["type"],
            properties: {
              type: {
                type: "string",
                description: "The type of appointment (e.g., Follow-up, Initial Consultation, etc.)"
              }
            }
          }
        },
        {
          name: "set_appointment_datetime",
          description: "Set the date and time for the appointment",
          parameters: {
            type: "object",
            required: ["datetime"],
            properties: {
              datetime: {
                type: "string",
                description: "The date and time of the appointment in ISO format"
              }
            }
          }
        },
        {
          name: "set_appointment_duration",
          description: "Set the duration of the appointment (minimum 30 minutes)",
          parameters: {
            type: "object",
            required: ["duration"],
            properties: {
              duration: {
                type: "integer",
                description: "The duration of the appointment in minutes (minimum 30)"
              }
            }
          }
        },
        {
          name: "set_appointment_notes",
          description: "Set any notes for the appointment",
          parameters: {
            type: "object",
            required: ["notes"],
            properties: {
              notes: {
                type: "string",
                description: "Any additional notes for the appointment"
              }
            }
          }
        },
        {
          name: "schedule_appointment",
          description: "Schedule the current appointment",
          parameters: {
            type: "object",
            properties: {}
          }
        },
        {
          name: "clear_appointment",
          description: "Clear the current appointment form",
          parameters: {
            type: "object",
            properties: {}
          }
        },
      ],
    },
  },
};

// Drive-thru constants
export const driveThruStsConfig = (id: string, menu: string): StsConfig => ({
  ...baseConfig,
  context: {
    messages: [
      {
        role: "assistant",
        content: "Welcome to the Krusty Krab drive-thru. What can I get for you today?",
      },
    ],
    replay: true,
  },
  agent: {
    ...baseConfig.agent,
    think: {
      ...baseConfig.agent.think,
      instructions:
        "You work taking orders at a drive-thru. Only respond in 2-3 sentences at most. Don't mention prices until the customer confirms that they're done ordering. The menu, including the names, descriptions, types, and prices for the items that you sell, is as follows:" +
        id + menu,
      functions: [
        {
          name: "add_item_to_order",
          description:
            "Adds an item to the customer's order. The item must be on the menu. The tool will add the requested menu item to the customer's order. It should only be used when the user explicitly asks for a particular item. Only add the exact item a customer asks for.",
          parameters: {
            type: "object",
            properties: {
              item: {
                type: "string",
                description:
                  "The name of the item that the user would like to order. The valid values come from the names of the items on the menu.",
              },
            },
            required: ["item"],
          },
        },
        {
          name: "get_order",
          description:
            "Gets the order, including all items and their prices. Use this function when cross-checking things like the total cost of the order, or items included in the order.",
          parameters: {},
        },
        {
          name: "remove_item_from_order",
          description:
            "Removes an item to the customer's order. The item must be on the menu and in the order. The tool will remove the requested menu item from the customer's order. It should only be used when the user explicitly asks to remove a particular item. Only remove the exact item a customer asks for.",
          parameters: {
            type: "object",
            properties: {
              item: {
                type: "string",
                description:
                  "The name of the item that the user would like to remove. The valid values come from the names of the items on the menu and in the order.",
              },
            },
            required: ["item"],
          },
        },
        {
          name: "get_menu",
          description:
            "Gets the menu, including all items and their price and description. Use this function at the beginning of the call and use it to reference what items are available and information about them",
          parameters: {},
        },
      ],
    },
  },
});

export const driveThruMenu = [
  {
    name: "Krabby Patty",
    description: "The signature burger of the Krusty Krab, made with a secret formula",
    price: 2.99,
    category: "meal",
  },
  {
    name: "Double Krabby Patty",
    description: "A Krabby Patty with two patties.",
    price: 3.99,
    category: "meal",
  },
  {
    name: "Krabby Patty with Cheese",
    description: "A Krabby Patty with a slice of cheese",
    price: 3.49,
    category: "meal",
  },
  {
    name: "Double Krabby Patty with Cheese",
    description: "A Krabby Patty with two patties and a slice of cheese",
    price: 4.49,
    category: "meal",
  },
  {
    name: "Salty Sea Dog",
    description: "A hot dog served with sea salt",
    price: 2.49,
    category: "meal",
  },
  {
    name: "Barnacle Fries",
    description: "Fries made from barnacles",
    price: 1.99,
    category: "side",
  },
  {
    name: "Krusty Combo",
    description: "Includes a Krabby Patty, Seaweed Salad, and a drink",
    price: 6.99,
    category: "combo",
  },
  {
    name: "Seaweed Salad",
    description: "A fresh salad made with seaweed",
    price: 2.49,
    category: "side",
  },
  {
    name: "Krabby Meal",
    description: "Includes a Krabby Patty, fries, and a drink",
    price: 5.99,
    category: "combo",
  },
  {
    name: "Kelp Shake",
    description: "A shake made with kelp juice",
    price: 2.49,
    category: "beverage",
  },
  {
    name: "Bubbly buddy",
    description: "A drink that is bubbly and refreshing",
    price: 1.49,
    category: "beverage",
  },
];

// Voice constants
const voiceAsteria: Voice = {
  name: "Asteria",
  canonical_name: "aura-2-speaker-45",
  metadata: {
    accent: "American",
    gender: "Female",
    image: "https://static.deepgram.com/examples/avatars/asteria.jpg",
    color: "#7800ED",
    sample: "https://static.deepgram.com/examples/voices/asteria.wav",
  },
};
const voiceOrion: Voice = {
  name: "Orion",
  canonical_name: "aura-2-speaker-31",
  metadata: {
    accent: "American",
    gender: "Male",
    image: "https://static.deepgram.com/examples/avatars/orion.jpg",
    color: "#83C4FB",
    sample: "https://static.deepgram.com/examples/voices/orion.mp3",
  },
};

const voiceLuna: Voice = {
  name: "Luna",
  canonical_name: "aura-2-speaker-180",
  metadata: {
    accent: "American",
    gender: "Female",
    image: "https://static.deepgram.com/examples/avatars/luna.jpg",
    color: "#949498",
    sample: "https://static.deepgram.com/examples/voices/luna.wav",
  },
};

const voiceArcas: Voice = {
  name: "Arcas",
  canonical_name: "aura-2-speaker-225",
  metadata: {
    accent: "American",
    gender: "Male",
    image: "https://static.deepgram.com/examples/avatars/arcas.jpg",
    color: "#DD0070",
    sample: "https://static.deepgram.com/examples/voices/arcas.mp3",
  },
};

type NonEmptyArray<T> = [T, ...T[]];
export const availableVoices: NonEmptyArray<Voice> = [
  voiceAsteria,
  voiceOrion,
  voiceLuna,
  voiceArcas,
];
export const defaultVoice: Voice = availableVoices[0];

export const sharedOpenGraphMetadata = {
  title: "Voice Agent | Deepgram",
  type: "website",
  url: "/",
  description: "Meet Deepgram's Voice Agent API",
};

// Jack-in-the-Box constants
export const jitbStsConfig = (id: string, menu: string): StsConfig => ({
  ...baseConfig,
  context: {
    messages: [
      {
        role: "assistant",
        content: "Welcome to Jack in the Box. What can I get for you today?",
      },
    ],
    replay: true,
  },
  agent: {
    ...baseConfig.agent,
    think: {
      ...baseConfig.agent.think,
      instructions:
        `You work taking orders at a Jack in the Box drive-thru. Follow these instructions stricly. Do not deviate:
      (1) Never speak in full sentences. Speak in short, yet polite responses.
      (2) Never repeat the customer's order back to them unless they ask for it.
      (3) If someone orders a breakfast item, ask if they would like an orange juice with that.
      (4) If someone orders a small or regular, ask if they would like to make that a large instead.
      (5) Don't mention prices until the customer confirms that they're done ordering.
      (6) Allow someone to mix and match sizes for combos.
      (7) At the end of the order, If someone has not ordered a dessert item, ask if they would like to add a dessert.
      (8) If someones changes their single item orders to a combo, remove the previous single item order.
      The menu, including the names, descriptions, types, and prices for the items that you sell, is as follows:` +
        id + menu,
      functions: [
        {
          name: "add_item",
          description:
            "Add an item to an order, with an optional quantity. Only use this function if the user has explicitly asked to order an item and that item is on the menu.",
          parameters: {
            type: "object",
            properties: {
              item: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description:
                      "The name of the item that the user would like to order. The valid values come from the names of the items on the menu.",
                  },
                  size: {
                    type: "string",
                    description:
                      "Provide a size IF AND ONLY IF the item has sizes listed in its `pricing` field in the menu. IF AN ITEM NEEDS A SIZE, DO NOT ASSUME THE SIZE. ASK THE CUSTOMER.",
                  },
                  make_it_a_combo: {
                    type: "object",
                    description:
                      "You can provide the `make_it_a_combo` field if the user wants a combo AND the item has the `combo_entree` role in the menu. NEVER ASSUME THE SIDE OR THE DRINK. ASK THE CUSTOMER. The size is for the drink and the fries, so the two sizes will always be the same within a combo, and that is just called the 'combo size'.",
                    properties: {
                      size: {
                        type: "string",
                        description:
                          "`small`, `medium`, or `large`. This affects the size of both the side and the drink.",
                      },
                      side_name: {
                        type: "string",
                        description:
                          "The name of the side. It must be a valid menu item and have the `combo_side` role.",
                      },
                      drink_name: {
                        type: "string",
                        description:
                          "The name of the drink. It must be a valid menu item and have the `combo_drink` role.",
                      },
                    },
                    required: ["size", "side_name", "drink_name"],
                  },
                  additional_requests: {
                    type: "string",
                    description:
                      "Optional. This is where you should include any extra customization requested by the customer for this item.",
                  },
                },
                required: ["name"],
              },
              quantity: {
                type: "integer",
                description:
                  "The quantity of this item that the user would like to add. Optional. Remember that this parameter is a sibling of item, not a child.",
              },
            },
            required: ["item"],
          },
        },
        {
          name: "remove_item",
          description: "Removes an item from an order.",
          parameters: {
            type: "object",
            properties: {
              key: {
                type: "integer",
                description:
                  "The integer key of the item you would like to remove. You will see these keys in the order summary that you get after each successful function call.",
              },
            },
            required: ["key"],
          },
        },
      ],
    },
  },
});
export const latencyMeasurementQueryParam = "latency-measurement";

// Drug Dispatch Functions
export const drugDispatchFunctions = [
  {
    name: 'set_patient_name',
    description: 'Set the patient name for the prescription',
    parameters: {
      type: 'object',
      required: ['name'],
      properties: {
        name: {
          type: 'string',
          description: 'The patient\'s full name'
        }
      }
    }
  },
  {
    name: 'set_mrn',
    description: 'Set the patient medical record number for the prescription',
    parameters: {
      type: 'object',
      required: ['mrn'],
      properties: {
        mrn: {
          type: 'string',
          description: 'The patient\'s medical record number (MRN)'
        }
      }
    }
  },
  {
    name: 'set_medication',
    description: 'Set the medication name for the prescription',
    parameters: {
      type: 'object',
      required: ['medication'],
      properties: {
        medication: {
          type: 'string',
          description: 'The name of the medication'
        }
      }
    }
  },
  {
    name: 'set_dosage',
    description: 'Set the dosage for the prescription',
    parameters: {
      type: 'object',
      required: ['dosage'],
      properties: {
        dosage: {
          type: 'string',
          description: 'The dosage of the medication'
        }
      }
    }
  },
  {
    name: 'set_frequency',
    description: 'Set the frequency for the prescription',
    parameters: {
      type: 'object',
      required: ['frequency'],
      properties: {
        frequency: {
          type: 'string',
          description: 'How often the medication should be taken'
        }
      }
    }
  },
  {
    name: 'set_pharmacy',
    description: 'Set the pharmacy for the prescription',
    parameters: {
      type: 'object',
      required: ['pharmacy'],
      properties: {
        pharmacy: {
          type: 'string',
          description: 'The name or location of the pharmacy'
        }
      }
    }
  },
  {
    name: 'dispatch_prescription',
    description: 'Dispatch the current prescription',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'clear_prescription',
    description: 'Clear the current prescription form',
    parameters: {
      type: 'object',
      properties: {}
    }
  }
];
