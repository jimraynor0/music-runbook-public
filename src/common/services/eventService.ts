import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Notice } from '../types/events';

interface EventFormData {
  name: string;
  date: string;
  notices: Notice[];
}

export const createEvent = async (eventData: EventFormData) => {
  try {
    const eventsCollection = collection(db, 'events');

    const newEvent = {
      name: eventData.name,
      date: Timestamp.fromDate(new Date(eventData.date)),
      notices: eventData.notices
    };

    const docRef = await addDoc(eventsCollection, newEvent);
    console.log('Event created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

export const updateEvent = async (eventId: string, eventData: EventFormData) => {
  try {
    const eventDoc = doc(db, 'events', eventId);

    const updatedEvent = {
      name: eventData.name,
      date: Timestamp.fromDate(new Date(eventData.date)),
      notices: eventData.notices
    };

    await updateDoc(eventDoc, updatedEvent);
    console.log('Event updated:', eventId);
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

export const updateEventNotices = async (eventId: string, notices: Notice[]) => {
  try {
    const eventDoc = doc(db, 'events', eventId);
    await updateDoc(eventDoc, { notices });
    console.log('Event notices updated:', eventId);
  } catch (error) {
    console.error('Error updating event notices:', error);
    throw error;
  }
};

export const deleteEvent = async (eventId: string) => {
  try {
    const eventDoc = doc(db, 'events', eventId);
    await deleteDoc(eventDoc);
    console.log('Event deleted:', eventId);
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};