import { type AudioConfig, type StsConfig, type Voice } from "../utils/deepgramUtils";
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

// Update function definitions to include required properties
const functionDefinitions = [
  {
    name: "set_patient_name",
    description: "Set the patient's name for the appointment",
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
    name: "set_mrn",
    description: "Set the patient's Medical Record Number (MRN)",
    parameters: {
      type: "object",
      properties: {
        mrn: {
          type: "string",
          description: "The patient's Medical Record Number"
        }
      },
      required: ["mrn"]
    }
  },
  {
    name: "set_date",
    description: "Set the date for the appointment",
    parameters: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "The date of the appointment in YYYY-MM-DD format"
        }
      },
      required: ["date"]
    }
  },
  {
    name: "set_time",
    description: "Set the time for the appointment",
    parameters: {
      type: "object",
      properties: {
        time: {
          type: "string",
          description: "The time of the appointment in HH:MM format"
        }
      },
      required: ["time"]
    }
  },
  {
    name: "set_provider",
    description: "Set the healthcare provider for the appointment",
    parameters: {
      type: "object",
      properties: {
        provider: {
          type: "string",
          description: "The name of the healthcare provider"
        }
      },
      required: ["provider"]
    }
  },
  {
    name: "set_reason",
    description: "Set the reason for the appointment",
    parameters: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          description: "The reason for the appointment"
        }
      },
      required: ["reason"]
    }
  },
  {
    name: "schedule_appointment",
    description: "Schedule the current appointment",
    parameters: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "clear_appointment",
    description: "Clear the current appointment form",
    parameters: {
      type: "object",
      properties: {},
      required: []
    }
  }
];

const baseConfig = {
  type: "Settings",
  experimental: false,
  mip_opt_out: false,
  audio: {
    input: {
      encoding: "linear16",
      sample_rate: 16000
    },
    output: {
      encoding: "linear16",
      sample_rate: 24000,
      container: "none"
    }
  },
  agent: {
    language: "en",
    listen: {
      provider: {
        type: "deepgram",
        model: "nova-3-medical"
      }
    },
    think: {
      provider: {
        type: "open_ai",
        model: "gpt-4",
        temperature: 0.7
      },
      prompt: "You are a helpful medical assistant focused on patient care. You can help with clinical notes, drug dispatch, and scheduling appointments.",
      functions: functionDefinitions
    },
    speak: {
      provider: {
        type: "deepgram",
        model: "aura-2-thalia-en"
      }
    },
    greeting: "Hello! I'm your medical assistant. I can help you with clinical notes, drug dispatch, and scheduling appointments. How can I assist you today?"
  }
};

// Update the stsConfig to use the function definitions
export const stsConfig: StsConfig = {
  type: "Settings",
  experimental: false,
  mip_opt_out: false,
  audio: {
    input: {
      encoding: "linear16",
      sample_rate: 16000
    },
    output: {
      encoding: "linear16",
      sample_rate: 24000,
      container: "none"
    }
  },
  agent: {
    language: "en",
    listen: {
      provider: {
        type: "deepgram",
        model: "nova-3-medical"
      }
    },
    think: {
      provider: {
        type: "open_ai",
        model: "gpt-4o-mini",
        temperature: 0.7
      },
      prompt: `You are a helpful medical assistant focused on patient care.

${clinicalNotesPrompt}

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
      functions: functionDefinitions
    },
    speak: {
      provider: {
        type: "deepgram",
        model: "aura-2-thalia-en"
      }
    },
    greeting: "Hello! I'm your medical assistant. I can help you with clinical notes, drug dispatch, and scheduling appointments. How can I assist you today?"
  }
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
          parameters: {
            type: "object",
            properties: {},
            required: [],
          },
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
          parameters: {
            type: "object",
            properties: {},
            required: [],
          },
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
  provider: {
    type: "deepgram",
    model: "aura-2-speaker-45"
  },
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
  provider: {
    type: "deepgram",
    model: "aura-2-speaker-31"
  },
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
  provider: {
    type: "deepgram",
    model: "aura-2-speaker-180"
  },
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
  provider: {
    type: "deepgram",
    model: "aura-2-speaker-225"
  },
  metadata: {
    accent: "American",
    gender: "Male",
    image: "https://static.deepgram.com/examples/avatars/arcas.jpg",
    color: "#DD0070",
    sample: "https://static.deepgram.com/examples/voices/arcas.mp3",
  },
};

type NonEmptyArray<T> = [T, ...T[]];
export const availableVoices: Voice[] = [
  {
    name: "Thalia",
    canonical_name: "aura-2-thalia-en",
    provider: {
      type: "deepgram",
      model: "aura-2-thalia-en"
    },
    metadata: {
      accent: "American",
      gender: "female",
      image: "/voices/thalia.png",
      color: "#FF6B6B",
      sample: "/samples/thalia.mp3"
    }
  },
  {
    name: "Nova",
    canonical_name: "nova-3-medical",
    provider: {
      type: "deepgram",
      model: "nova-3-medical"
    },
    metadata: {
      accent: "American",
      gender: "female",
      image: "/voices/nova.png",
      color: "#4ECDC4",
      sample: "/samples/nova.mp3"
    }
  },
  {
    name: "Eleven",
    canonical_name: "eleven-english-v1",
    provider: {
      type: "elevenlabs",
      model: "eleven-english-v1"
    },
    metadata: {
      accent: "American",
      gender: "female",
      image: "/voices/eleven.png",
      color: "#45B7D1",
      sample: "/samples/eleven.mp3"
    }
  }
];
export const defaultVoice: Voice = availableVoices[0]!;

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
      properties: {
        name: {
          type: 'string',
          description: 'The patient\'s full name'
        }
      },
      required: ['name']
    }
  },
  {
    name: 'set_mrn',
    description: 'Set the patient medical record number for the prescription',
    parameters: {
      type: 'object',
      properties: {
        mrn: {
          type: 'string',
          description: 'The patient\'s medical record number (MRN)'
        }
      },
      required: ['mrn']
    }
  },
  {
    name: 'set_medication',
    description: 'Set the medication name for the prescription',
    parameters: {
      type: 'object',
      properties: {
        medication: {
          type: 'string',
          description: 'The name of the medication'
        }
      },
      required: ['medication']
    }
  },
  {
    name: 'set_dosage',
    description: 'Set the dosage for the prescription',
    parameters: {
      type: 'object',
      properties: {
        dosage: {
          type: 'string',
          description: 'The dosage of the medication'
        }
      },
      required: ['dosage']
    }
  },
  {
    name: 'set_frequency',
    description: 'Set the frequency for the prescription',
    parameters: {
      type: 'object',
      properties: {
        frequency: {
          type: 'string',
          description: 'How often the medication should be taken'
        }
      },
      required: ['frequency']
    }
  },
  {
    name: 'set_pharmacy',
    description: 'Set the pharmacy for the prescription',
    parameters: {
      type: 'object',
      properties: {
        pharmacy: {
          type: 'string',
          description: 'The name or location of the pharmacy'
        }
      },
      required: ['pharmacy']
    }
  },
  {
    name: 'dispatch_prescription',
    description: 'Dispatch the current prescription',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'clear_prescription',
    description: 'Clear the current prescription form',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  }
];
