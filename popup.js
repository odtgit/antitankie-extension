// DOM elements
const enabledToggle = document.getElementById('enabled-toggle');
const replacementCount = document.getElementById('replacement-count');

// Initialize popup with current state
async function initializePopup() {
  try {
    // Load enabled state from sync storage
    const syncData = await chrome.storage.sync.get(['enabled']);
    const isEnabled = syncData.enabled !== false; // Default to true
    enabledToggle.checked = isEnabled;

    // Load replacement count from local storage
    const localData = await chrome.storage.local.get(['replacementCount']);
    const count = localData.replacementCount || 0;
    updateReplacementCount(count);
  } catch (error) {
    console.error('Error initializing popup:', error);
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
    await chrome.storage.sync.set({ enabled: isEnabled });

    // Send message to all tabs to update their state
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'toggleExtension',
          enabled: isEnabled
        });
      } catch (error) {
        // Ignore errors for tabs that don't have content script
        // (e.g., chrome:// pages, extension pages)
      }
    }

    console.log(`Extension ${isEnabled ? 'enabled' : 'disabled'}`);
  } catch (error) {
    console.error('Error toggling extension:', error);
    // Revert toggle on error
    enabledToggle.checked = !isEnabled;
  }
});

// Listen for storage changes to update count in real-time
chrome.storage.onChanged.addListener((changes, areaName) => {
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
