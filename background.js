/**
 * Background Service Worker for Wikipedia Birthplace Corrector Extension
 * Handles state management, message routing, and badge updates
 */

// Initialize extension state on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get('enabled', (result) => {
    if (result.enabled === undefined) {
      chrome.storage.sync.set({ enabled: true });
    }
  });

  chrome.storage.local.get('replacementCount', (result) => {
    if (result.replacementCount === undefined) {
      chrome.storage.local.set({ replacementCount: 0 });
    }
  });
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'incrementCount') {
    chrome.storage.local.get('replacementCount', (result) => {
      const newCount = (result.replacementCount || 0) + 1;
      chrome.storage.local.set({ replacementCount: newCount });
      updateBadge(newCount);
    });
  } else if (request.action === 'getState') {
    chrome.storage.sync.get('enabled', (result) => {
      sendResponse({ enabled: result.enabled !== false });
    });
  }
});

/**
 * Format a number for badge display
 * @param {number} count - The count to format
 * @returns {string} Formatted count (e.g., "1.2k" for 1234)
 */
function formatBadgeText(count) {
  if (count === 0) {
    return '';
  }
  if (count < 1000) {
    return count.toString();
  }
  if (count < 1000000) {
    const thousands = Math.floor(count / 100) / 10;
    return thousands.toFixed(thousands % 1 === 0 ? 0 : 1) + 'k';
  }
  const millions = Math.floor(count / 100000) / 10;
  return millions.toFixed(millions % 1 === 0 ? 0 : 1) + 'm';
}

/**
 * Update the extension badge with replacement count
 * @param {number} count - The replacement count to display
 */
function updateBadge(count) {
  const badgeText = formatBadgeText(count);
  chrome.action.setBadgeText({ text: badgeText });

  // Set badge color
  chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
}

// Listen for storage changes to update badge
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.replacementCount) {
    updateBadge(changes.replacementCount.newValue || 0);
  }
});
