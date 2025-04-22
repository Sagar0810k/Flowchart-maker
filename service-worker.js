const CACHE_NAME = 'flowmaster-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/graph.js',
  '/js/render.js',
  '/js/drag.js',
  '/js/resize.js',
  '/js/connect.js',
  '/js/simulate.js',
  '/js/storage.js',
  '/js/utils.js',
  '/js/history.js',
  '/js/minimap.js',
  '/js/grid.js',
  '/js/export.js',
  '/js/theme.js',
  '/js/toast.js',
  '/js/shapes.js',
  '/js/properties.js',
  '/js/context-menu.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/favicon.ico'
];

// Install event - cache assets
self.addEventListener('install', event => {
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app assets');
        return cache.addAll(ASSETS);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          console.log('Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return the response
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          // Open cache and store response
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
            
          return response;
        });
      })
  );
});

// Background sync for saving flowcharts when offline
self.addEventListener('sync', event => {
  if (event.tag === 'sync-flowcharts') {
    event.waitUntil(syncFlowcharts());
  }
});

// Function to sync flowcharts when back online
async function syncFlowcharts() {
  try {
    const db = await openDatabase();
    const pendingSyncs = await db.getAll('pendingSyncs');
    
    for (const sync of pendingSyncs) {
      try {
        // Attempt to sync with server
        const response = await fetch('/api/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(sync.data)
        });
        
        if (response.ok) {
          // If successful, remove from pending syncs
          await db.delete('pendingSyncs', sync.id);
        }
      } catch (error) {
        console.error('Sync failed for item:', sync.id, error);
      }
    }
  } catch (error) {
    console.error('Error during sync process:', error);
  }
}

// Helper function to open IndexedDB
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('flowmaster-db', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('pendingSyncs')) {
        db.createObjectStore('pendingSyncs', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}
