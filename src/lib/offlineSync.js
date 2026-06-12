import localforage from 'localforage';

localforage.config({
  name: 'PardisCountingPWA',
  storeName: 'offline_counts',
  description: 'Stores counting records when device is offline'
});

/**
 * Save a count to offline storage
 */
export async function saveCountOffline(payload) {
  try {
    const existing = await localforage.getItem('pending_counts') || [];
    const record = { ...payload, is_offline: true, timestamp: new Date().toISOString() };
    existing.push(record);
    await localforage.setItem('pending_counts', existing);
    return true;
  } catch (error) {
    console.error('Offline storage error:', error);
    return false;
  }
}

/**
 * Get all pending offline counts
 */
export async function getPendingCounts() {
  try {
    return await localforage.getItem('pending_counts') || [];
  } catch (error) {
    return [];
  }
}

/**
 * Attempt to sync offline counts to the server
 */
export async function syncOfflineCounts() {
  if (!navigator.onLine) return false;

  try {
    const pending = await getPendingCounts();
    if (pending.length === 0) return true;

    const token = localStorage.getItem('token');
    const successful = [];
    
    for (const record of pending) {
      try {
        const res = await fetch('/api/counting', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(record)
        });
        
        if (res.ok) {
          successful.push(record.timestamp);
        }
      } catch (e) {
        // failed to sync this record, keep it
      }
    }

    // Remove successful records from local storage
    const remaining = pending.filter(p => !successful.includes(p.timestamp));
    await localforage.setItem('pending_counts', remaining);

    return remaining.length === 0;

  } catch (error) {
    console.error('Sync error:', error);
    return false;
  }
}
