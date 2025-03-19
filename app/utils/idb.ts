import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

interface ClinicalNote {
  id: string;
  timestamp: Date;
  content: string;
  lastModified: Date;
  demographics: {
    patientName?: string;
    dateOfBirth?: string;
    age?: string;
    gender?: string;
    medicalRecordNumber?: string;
  };
  visitInfo: {
    dateOfVisit?: string;
    timeOfVisit?: string;
    visitType?: string;
    providerName?: string;
  };
  clinicalInfo: {
    chiefComplaint?: string;
    presentIllness?: string;
    reviewOfSystems?: string;
    physicalExam?: string;
    assessment?: string;
    plan?: string;
  };
}

interface DrugDispatchRecord {
  id: string;
  timestamp: Date;
  patientName: string;
  mrn: string;
  medication: string;
  dosage: string;
  frequency: string;
  pharmacy: string;
  status: 'pending' | 'dispatched';
}

interface Appointment {
  id: string;
  timestamp: Date;
  type: string;
  duration: number;
  notes: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  patientName: string;
  mrn: string;
}

interface MedicalDB extends DBSchema {
  clinicalNotes: {
    key: string;
    value: ClinicalNote;
    indexes: { 'by-timestamp': Date };
  };
  drugDispatch: {
    key: string;
    value: DrugDispatchRecord;
    indexes: { 'by-timestamp': Date; 'by-status': string };
  };
  appointments: {
    key: string;
    value: Appointment;
    indexes: { 'by-timestamp': Date; 'by-status': string };
  };
}

let dbPromise: Promise<IDBPDatabase<MedicalDB>>;

export const initDB = async () => {
  if (!dbPromise) {
    dbPromise = openDB<MedicalDB>('medical-records', 1, {
      upgrade(db) {
        // Clinical Notes Store
        const notesStore = db.createObjectStore('clinicalNotes', { keyPath: 'id' });
        notesStore.createIndex('by-timestamp', 'timestamp');

        // Drug Dispatch Store
        const dispatchStore = db.createObjectStore('drugDispatch', { keyPath: 'id' });
        dispatchStore.createIndex('by-timestamp', 'timestamp');
        dispatchStore.createIndex('by-status', 'status');

        // Appointments Store
        const appointmentsStore = db.createObjectStore('appointments', { keyPath: 'id' });
        appointmentsStore.createIndex('by-timestamp', 'timestamp');
        appointmentsStore.createIndex('by-status', 'status');
      },
    });
  }
  return dbPromise;
};

// Clinical Notes Operations
export const addClinicalNote = async (note: ClinicalNote) => {
  const db = await initDB();
  return db.add('clinicalNotes', note);
};

export const updateClinicalNote = async (note: ClinicalNote) => {
  const db = await initDB();
  return db.put('clinicalNotes', note);
};

export const deleteClinicalNote = async (id: string) => {
  const db = await initDB();
  return db.delete('clinicalNotes', id);
};

export const getAllClinicalNotes = async () => {
  const db = await initDB();
  return db.getAllFromIndex('clinicalNotes', 'by-timestamp');
};

// Drug Dispatch Operations
export const addDrugDispatch = async (dispatch: DrugDispatchRecord) => {
  const db = await initDB();
  return db.add('drugDispatch', dispatch);
};

export const updateDrugDispatch = async (dispatch: DrugDispatchRecord) => {
  const db = await initDB();
  return db.put('drugDispatch', dispatch);
};

export const deleteDrugDispatch = async (id: string) => {
  const db = await initDB();
  return db.delete('drugDispatch', id);
};

export const getAllDrugDispatches = async () => {
  const db = await initDB();
  return db.getAllFromIndex('drugDispatch', 'by-timestamp');
};

// Appointment Operations
export const addAppointment = async (appointment: Appointment) => {
  const db = await initDB();
  return db.add('appointments', appointment);
};

export const updateAppointment = async (appointment: Appointment) => {
  const db = await initDB();
  return db.put('appointments', appointment);
};

export const deleteAppointment = async (id: string) => {
  const db = await initDB();
  return db.delete('appointments', id);
};

export const getAllAppointments = async () => {
  const db = await initDB();
  return db.getAllFromIndex('appointments', 'by-timestamp');
};

// Default items for empty database
const defaultClinicalNote: ClinicalNote = {
  id: 'default-note',
  timestamp: new Date('2025-02-21T13:20:00'),
  content: `Patient Name: Joe Blogs
Date of Birth: 09/05/1984
Gender: Male
Medical Record Number: B 652 947
Visit Date: 02/21/2025
Visit Time: 13:20
Visit Type: General checkup
Provider: Urgent Care
Chief Complaint: Injection site swelling
Present Illness: No prior history
Review of Systems: No findings
Physical Examination: Swelling and redness around the injection site
Plan: 200 milligrams of Ibuprofen to be taken every 4 hours, and rest.`,
  lastModified: new Date('2025-02-21T13:20:00'),
  demographics: {
    patientName: 'Joe Blogs',
    dateOfBirth: '09/05/1984',
    gender: 'Male',
    medicalRecordNumber: 'B 652 947'
  },
  visitInfo: {
    dateOfVisit: '02/21/2025',
    timeOfVisit: '13:20',
    visitType: 'General checkup',
    providerName: 'Urgent Care'
  },
  clinicalInfo: {
    chiefComplaint: 'Injection site swelling',
    presentIllness: 'No prior history',
    reviewOfSystems: 'No findings',
    physicalExam: 'Swelling and redness around the injection site',
    plan: '200 milligrams of Ibuprofen to be taken every 4 hours, and rest.'
  }
};

const defaultDrugDispatch: DrugDispatchRecord = {
  id: 'default-dispatch',
  timestamp: new Date('2025-02-21T13:13:06'),
  patientName: 'Jane Bloggs',
  mrn: 'A965247',
  medication: 'Ibuprofen',
  dosage: '200 milligrams',
  frequency: 'Every 4 hours',
  pharmacy: 'CVS Pharmacy Markets San Francisco',
  status: 'pending'
};

const defaultAppointment: Appointment = {
  id: 'default-appointment',
  timestamp: new Date('2025-02-21T17:40:00'),
  type: 'Checkup',
  duration: 30,
  notes: 'Patient thinks they have the Flu',
  status: 'scheduled',
  patientName: 'Jim Bloggs',
  mrn: 'C654821'
};

export async function checkAndAddDefaultItems() {
  try {
    // Check if any records exist in any store
    const clinicalNotes = await getAllClinicalNotes();
    const drugDispatches = await getAllDrugDispatches();
    const appointments = await getAllAppointments();

    // Only add default items if all stores are empty
    if (clinicalNotes.length === 0 && drugDispatches.length === 0 && appointments.length === 0) {
      // Add default clinical note
      await addClinicalNote(defaultClinicalNote);
      
      // Add default drug dispatch
      await addDrugDispatch(defaultDrugDispatch);
      
      // Add default appointment
      await addAppointment(defaultAppointment);
      
      console.log('Added default items to all stores');
    }
  } catch (error) {
    console.error('Error checking/adding default items:', error);
  }
}

// Export types for use in components
export type { ClinicalNote, DrugDispatchRecord, Appointment }; 