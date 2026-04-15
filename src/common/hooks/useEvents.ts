import { useState, useEffect } from 'react';
import { collection, onSnapshot, orderBy, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config.ts';
import { Event, Notice } from '../types/events.ts';

// Firebase-specific type with Timestamp date
interface FirebaseEvent {
  id: string;
  name: string;
  date: Timestamp;
  notices: Notice[];
}

export const useEvents = (showHistorical: boolean = false) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const eventsCollection = collection(db, 'events');

    const now = new Date();

    // Create Firebase query with optional date filtering
    const eventsQuery = showHistorical
      ? query(eventsCollection, orderBy('date', 'desc'))
      : query(
          eventsCollection,
          where('date', '>=', Timestamp.fromDate(now)),
          orderBy('date', 'asc')
        );

    const unsubscribe = onSnapshot(
      eventsQuery,
      (snapshot) => {
        try {
          const firebaseEvents = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as FirebaseEvent[];

          // Map FirebaseEvent to Event objects
          const events = firebaseEvents.map(firebaseEvent => ({
            id: firebaseEvent.id,
            name: firebaseEvent.name,
            date: firebaseEvent.date.toDate().toISOString(),
            notices: firebaseEvent.notices
          })) as Event[];

          setEvents(events);
          setError(null);
        } catch (err) {
          setError('Failed to fetch events');
          console.error('Error fetching events:', err);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError('Failed to connect to database');
        setLoading(false);
        console.error('Error in events subscription:', err);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [showHistorical]);

  return { events, loading, error };
};