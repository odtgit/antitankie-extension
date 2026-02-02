// Cross-browser compatibility: Firefox uses browser.*, Chrome uses chrome.*
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// DOM elements
const enabledToggle = document.getElementById('enabled-toggle');
const replacementCount = document.getElementById('replacement-count');

// Helper to handle both promise and callback-based storage APIs
function storageGet(storageArea, keys) {
  return new Promise((resolve, reject) => {
    const storage = browserAPI.storage[storageArea];
    const result = storage.get(keys, (data) => {
      if (browserAPI.runtime.lastError) {
        reject(browserAPI.runtime.lastError);
      } else {
        resolve(data);
      }
    });
    // If it returns a promise (Firefox), use that instead
    if (result && typeof result.then === 'function') {
      result.then(resolve).catch(reject);
    }
  });
}

function storageSet(storageArea, data) {
  return new Promise((resolve, reject) => {
    const storage = browserAPI.storage[storageArea];
    const result = storage.set(data, () => {
      if (browserAPI.runtime.lastError) {
        reject(browserAPI.runtime.lastError);
      } else {
        resolve();
      }
    });
    // If it returns a promise (Firefox), use that instead
    if (result && typeof result.then === 'function') {
      result.then(resolve).catch(reject);
    }
  });
}

// Initialize popup with current state
async function initializePopup() {
  try {
    // Load enabled state from sync storage
    const syncData = await storageGet('sync', ['enabled']);
    const isEnabled = syncData.enabled !== false; // Default to true
    enabledToggle.checked = isEnabled;

    // Load replacement count from local storage
    const localData = await storageGet('local', ['replacementCount']);
    const count = localData.replacementCount || 0;
    updateReplacementCount(count);
  } catch (error) {
    console.error('Error initializing popup:', error);
    // Set defaults on error
    enabledToggle.checked = true;
    updateReplacementCount(0);
  }
}

// Update replacement count display
function updateReplacementCount(count) {
  replacementCount.textContent = count.toLocaleString();
}

// Handle toggle change
enabledToggle.addEventListener('change', async (event) => {
  const isEnabled = event.target.checked;

  try {
    // Save enabled state to sync storage
    await storageSet('sync', { enabled: isEnabled });

    // Send message to all tabs to update their state
    browserAPI.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        browserAPI.tabs.sendMessage(tab.id, {
          type: 'toggleState',
          enabled: isEnabled
        }).catch(() => {
          // Ignore errors for tabs that don't have content script
        });
      }
    });
  } catch (error) {
    console.error('Error toggling extension:', error);
    // Revert toggle on error
    enabledToggle.checked = !isEnabled;
  }
});

// Listen for storage changes to update count in real-time
browserAPI.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.replacementCount) {
    const newCount = changes.replacementCount.newValue || 0;
    updateReplacementCount(newCount);
  }

  if (areaName === 'sync' && changes.enabled) {
    const newEnabled = changes.enabled.newValue !== false;
    enabledToggle.checked = newEnabled;
  }
});

// Initialize on load
document.addEventListener('DOMContentLoaded', initializePopup);
