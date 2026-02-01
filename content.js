// Wikipedia Birthplace Corrector - Content Script
// Replaces Soviet-era birthplace designations with modern country names

(function() {
  'use strict';

  let isEnabled = true;
  let isProcessing = false;  // Flag to prevent re-entry during processing
  const PROCESSED_ATTR = 'data-antitankie-processed';

  // Initialize: Check if extension is enabled
  // Use try-catch because sendMessage can fail if background isn't ready
  try {
    chrome.runtime.sendMessage({ type: 'getState' }, (response) => {
      // Handle potential errors (extension context invalidated, etc.)
      if (chrome.runtime.lastError) {
        console.log('Birthplace Corrector: Background not ready, using defaults');
        isEnabled = true;
        processPage();
        return;
      }

      if (response && typeof response.enabled !== 'undefined') {
        isEnabled = response.enabled;
      } else {
        // Default to enabled if no response
        isEnabled = true;
      }

      if (isEnabled) {
        processPage();
      }
    });
  } catch (e) {
    // If messaging fails, just run with defaults
    console.log('Birthplace Corrector: Init error, using defaults');
    isEnabled = true;
    processPage();
  }

  // Also run on DOMContentLoaded as a fallback
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (isEnabled && !document.querySelector('[' + PROCESSED_ATTR + ']')) {
        processPage();
      }
    });
  }

  // Listen for state changes from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'toggleState') {
      isEnabled = message.enabled;
      if (isEnabled) {
        processPage();
      }
      sendResponse({ success: true });
    }
  });

  /**
   * Main processing function - finds and replaces SSR references
   */
  function processPage() {
    if (!isEnabled) {
      console.log('Birthplace Corrector: Disabled, skipping');
      return;
    }
    if (isProcessing) {
      console.log('Birthplace Corrector: Already processing, skipping');
      return;
    }

    isProcessing = true;  // Prevent re-entry
    console.log('Birthplace Corrector: Processing page...');

    try {
      let replacementCount = 0;

      // Find all elements that might contain birthplace information
      const targetElements = findTargetElements();
      console.log('Birthplace Corrector: Found', targetElements.length, 'target elements');

      targetElements.forEach(element => {
        // Skip if already processed (using data attribute for persistence)
        if (element.hasAttribute(PROCESSED_ATTR)) {
          console.log('Birthplace Corrector: Element already processed, skipping');
          return;
        }

        // Skip if any ancestor is already processed (avoid double-processing nested elements)
        if (element.closest('[' + PROCESSED_ATTR + ']')) {
          console.log('Birthplace Corrector: Ancestor already processed, skipping');
          return;
        }

        console.log('Birthplace Corrector: Processing element, HTML before:', element.innerHTML.substring(0, 200));
        const result = processElement(element);
        console.log('Birthplace Corrector: Processed element, changed:', result.changed, 'count:', result.count);
        console.log('Birthplace Corrector: HTML after:', element.innerHTML.substring(0, 200));

        if (result.changed) {
          replacementCount += result.count;
          element.setAttribute(PROCESSED_ATTR, 'true');
          addVisualIndicator(element);
        }
      });

      console.log('Birthplace Corrector: Total replacements:', replacementCount);

      // Send replacement count to background
      if (replacementCount > 0) {
        try {
          chrome.runtime.sendMessage({
            type: 'incrementCount',
            count: replacementCount
          });
        } catch (e) {
          console.log('Birthplace Corrector: Failed to send count to background');
        }
      }
    } finally {
      isProcessing = false;  // Always reset the flag
    }
  }

  /**
   * Find all elements that should be processed
   */
  function findTargetElements() {
    const elements = [];

    // 1. Find infobox birthplace elements
    const infoboxes = document.querySelectorAll('.infobox');
    console.log('Birthplace Corrector: Found', infoboxes.length, 'infoboxes');

    infoboxes.forEach(infobox => {
      // Find "Born" row - check for both exact match and contains
      const headers = infobox.querySelectorAll('th');
      headers.forEach(th => {
        const thText = th.textContent.trim();
        if (thText === 'Born' || thText.startsWith('Born')) {
          const td = th.nextElementSibling;
          if (td && td.tagName === 'TD') {
            console.log('Birthplace Corrector: Found Born row with content:', td.textContent.substring(0, 100));
            elements.push(td);
          }
        }
      });

      // Find elements with birthplace class
      const birthplaceElements = infobox.querySelectorAll('[class*="birthplace"]');
      birthplaceElements.forEach(el => elements.push(el));

      // Find any infobox cells containing SSR references
      const cells = infobox.querySelectorAll('td, th');
      cells.forEach(cell => {
        if (window.AntiTankieReplacements &&
            window.AntiTankieReplacements.containsSSRReference(cell.textContent)) {
          elements.push(cell);
        }
      });
    });

    return elements;
  }

  /**
   * Process a single element - replace text and links
   */
  function processElement(element) {
    let changed = false;
    let count = 0;

    if (!window.AntiTankieReplacements) {
      console.warn('AntiTankieReplacements not loaded');
      return { changed: false, count: 0 };
    }

    // Check if element contains SSR references
    if (!window.AntiTankieReplacements.containsSSRReference(element.textContent)) {
      return { changed: false, count: 0 };
    }

    // Process text nodes - handle both linked and plain text SSR references
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const textNodesToProcess = [];
    let node;
    while (node = walker.nextNode()) {
      if (window.AntiTankieReplacements.containsSSRReference(node.textContent)) {
        textNodesToProcess.push(node);
      }
    }

    textNodesToProcess.forEach(textNode => {
      const originalText = textNode.textContent;
      console.log('Birthplace Corrector: Processing text node:', originalText);

      // Check if this text contains SSR country names that should become links
      const ssrMatch = window.AntiTankieReplacements.findSSRInText(originalText);

      // Check if parent is a link (if so, we just replace text, don't create new link)
      const parent = textNode.parentNode;
      const isInsideLink = parent && parent.tagName === 'A';

      if (ssrMatch && !isInsideLink) {
        console.log('Birthplace Corrector: Creating link for', ssrMatch.ssrName, '->', ssrMatch.modernName);

        // Split the text and create a link
        const parts = originalText.split(ssrMatch.ssrName);
        const beforeText = parts[0];
        const afterText = parts.slice(1).join(ssrMatch.ssrName);

        // Clean up Soviet Union from the after text
        let cleanAfterText = window.AntiTankieReplacements.removeSovietUnionReferences(afterText);

        // Create the link element
        const link = document.createElement('a');
        link.href = ssrMatch.wikiPath;
        link.title = ssrMatch.modernName;
        link.textContent = ssrMatch.modernName;

        // Replace the text node with: beforeText + link + cleanAfterText
        const beforeNode = document.createTextNode(beforeText);
        const afterNode = document.createTextNode(cleanAfterText);

        parent.insertBefore(beforeNode, textNode);
        parent.insertBefore(link, textNode);
        parent.insertBefore(afterNode, textNode);
        parent.removeChild(textNode);

        console.log('Birthplace Corrector: Created link, before:"' + beforeText + '" after:"' + cleanAfterText + '"');
        changed = true;
        count++;
      } else {
        // Just do text replacement (for text inside links)
        const newText = window.AntiTankieReplacements.replaceSSRNames(originalText);

        if (originalText !== newText) {
          console.log('Birthplace Corrector: Text replacement:', originalText, '->', newText);
          textNode.textContent = newText;
          changed = true;
          count++;
        }
      }
    });

    // Process links - collect links to process/remove
    const links = Array.from(element.querySelectorAll('a[href*="/wiki/"]'));
    const linksToRemove = [];

    console.log('Birthplace Corrector: Found', links.length, 'wiki links in element');

    links.forEach(link => {
      const originalHref = link.getAttribute('href');
      console.log('Birthplace Corrector: Processing link:', originalHref, 'text:', link.textContent);

      // Check if this is a Soviet Union link that should be removed entirely
      const shouldRemove = window.AntiTankieReplacements.shouldRemoveUrl(originalHref);
      console.log('Birthplace Corrector: Should remove?', shouldRemove);

      if (shouldRemove) {
        linksToRemove.push(link);
        changed = true;
        count++;
        return;
      }

      // Replace SSR URLs with modern country URLs
      const newHref = window.AntiTankieReplacements.replaceSSRUrl(originalHref);
      console.log('Birthplace Corrector: URL replacement:', originalHref, '->', newHref);

      if (originalHref !== newHref) {
        link.setAttribute('href', newHref);
        changed = true;
        count++;
      }

      // Also update link text if it contains SSR references
      if (window.AntiTankieReplacements.containsSSRReference(link.textContent)) {
        const originalLinkText = link.textContent;
        const newLinkText = window.AntiTankieReplacements.replaceSSRNames(originalLinkText);

        if (originalLinkText !== newLinkText) {
          link.textContent = newLinkText;
          changed = true;
          count++;
        }
      }
    });

    console.log('Birthplace Corrector: Links to remove:', linksToRemove.length);

    // Remove Soviet Union links and clean up surrounding text
    linksToRemove.forEach(link => {
      console.log('Birthplace Corrector: Removing Soviet Union link:', link.href);

      // Check for preceding comma in text node before the link
      const prevSibling = link.previousSibling;
      if (prevSibling && prevSibling.nodeType === Node.TEXT_NODE) {
        // Only remove the comma that's directly before Soviet Union, not all trailing content
        const prevText = prevSibling.textContent;
        // Remove ", " or "," at the end only
        if (prevText.endsWith(', ')) {
          prevSibling.textContent = prevText.slice(0, -2);
        } else if (prevText.endsWith(',')) {
          prevSibling.textContent = prevText.slice(0, -1);
        }
        console.log('Birthplace Corrector: Prev sibling text after cleanup:', prevSibling.textContent);
      }

      // Remove the link itself
      link.remove();
    });

    // Final formatting pass: ensure proper comma between city and country
    ensureProperFormatting(element);

    return { changed, count };
  }

  /**
   * Ensure proper formatting with commas between location parts
   */
  function ensureProperFormatting(element) {
    // Find the birthplace span or similar container
    const birthplaceSpan = element.querySelector('.birthplace') || element;

    // Get all location links (excluding date links)
    const links = Array.from(birthplaceSpan.querySelectorAll('a[href*="/wiki/"]')).filter(link => {
      const href = link.getAttribute('href') || '';
      // Exclude year and month links
      return !/\/wiki\/\d{4}$/.test(href) &&
             !/\/wiki\/(January|February|March|April|May|June|July|August|September|October|November|December)/.test(href);
    });

    // Check each pair of consecutive links
    for (let i = 0; i < links.length - 1; i++) {
      const currentLink = links[i];
      const nextLink = links[i + 1];

      // Check what's between them
      let node = currentLink.nextSibling;
      let hasComma = false;
      let textNode = null;

      while (node && node !== nextLink) {
        if (node.nodeType === Node.TEXT_NODE) {
          if (node.textContent.includes(',')) {
            hasComma = true;
          }
          textNode = node;
        }
        node = node.nextSibling;
      }

      // If no comma between city and country, add one
      if (!hasComma && textNode) {
        const text = textNode.textContent.trim();
        if (text === '' || text === ' ') {
          textNode.textContent = ', ';
        }
      } else if (!hasComma && !textNode) {
        // No text node between links, insert one
        const comma = document.createTextNode(', ');
        currentLink.parentNode.insertBefore(comma, nextLink);
      }
    }
  }

  /**
   * Clean up orphaned punctuation after removing elements
   * Preserves comma between city and country
   */
  function cleanupOrphanedPunctuation(element) {
    // Only clean up double commas and empty parentheses
    // Do NOT touch single ", " separators - they are needed between city and country

    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }

    textNodes.forEach(textNode => {
      let text = textNode.textContent;
      const originalText = text;

      // Only clean up truly orphaned punctuation - be very conservative!

      // Remove double/triple commas (keep one)
      text = text.replace(/,\s*,/g, ',');

      // Clean up empty parentheses
      text = text.replace(/\(\s*\)/g, '');

      // Normalize multiple spaces to single space
      text = text.replace(/\s{3,}/g, ' ');

      // Only update if we actually changed something
      if (text !== originalText) {
        textNode.textContent = text;
      }
    });
  }

  /**
   * Add visual indicator to corrected elements
   */
  function addVisualIndicator(element) {
    // Add a subtle left border to indicate correction
    element.style.borderLeft = '3px solid #4CAF50';
    element.style.paddingLeft = '8px';
    element.setAttribute('title', 'Birthplace corrected by Wikipedia Birthplace Corrector');

    // Only add checkmark if not already present
    if (element.querySelector('.antitankie-checkmark')) {
      return;
    }

    // Create the checkmark icon
    const icon = document.createElement('span');
    icon.className = 'antitankie-checkmark';
    icon.textContent = ' ✓';
    icon.style.cssText = `
      color: #4CAF50;
      font-size: 0.85em;
      opacity: 0.8;
      cursor: help;
      white-space: nowrap;
    `;
    icon.setAttribute('title', 'Soviet-era location name corrected to modern country');

    // Find the best place to insert the checkmark (inline after birthplace)
    // Priority: 1) after .birthplace span, 2) after last country link, 3) end of element
    const birthplaceSpan = element.querySelector('.birthplace');
    if (birthplaceSpan) {
      // Insert right after the birthplace span content
      birthplaceSpan.appendChild(icon);
      return;
    }

    // Look for the last link in the element that's a country link (not a date/year link)
    const links = element.querySelectorAll('a[href*="/wiki/"]');
    let lastLocationLink = null;
    links.forEach(link => {
      const href = link.getAttribute('href') || '';
      // Skip date/year links
      if (!/\/wiki\/\d{4}/.test(href) && !/\/wiki\/(January|February|March|April|May|June|July|August|September|October|November|December)/.test(href)) {
        lastLocationLink = link;
      }
    });

    if (lastLocationLink) {
      // Insert after the last location link
      lastLocationLink.insertAdjacentElement('afterend', icon);
      return;
    }

    // Fallback: find the line containing birthplace info and append there
    // Look for a <br> that separates date from place
    const brs = element.querySelectorAll('br');
    if (brs.length > 0) {
      // The birthplace is usually after the first <br>
      // Find the text node or element after the first <br>
      const br = brs[0];
      let sibling = br.nextSibling;
      while (sibling) {
        if (sibling.nodeType === Node.ELEMENT_NODE) {
          sibling.appendChild(icon);
          return;
        } else if (sibling.nodeType === Node.TEXT_NODE && sibling.textContent.trim()) {
          // Insert after this text node
          sibling.parentNode.insertBefore(icon, sibling.nextSibling);
          return;
        }
        sibling = sibling.nextSibling;
      }
    }

    // Final fallback: just append to element
    element.appendChild(icon);
  }

  /**
   * Set up MutationObserver to watch for dynamic content changes
   */
  function setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      // Skip if disabled or currently processing (to avoid feedback loops)
      if (!isEnabled || isProcessing) return;

      let shouldReprocess = false;

      mutations.forEach(mutation => {
        // Skip mutations on elements we've already processed
        const target = mutation.target;
        if (target.nodeType === Node.ELEMENT_NODE && target.hasAttribute(PROCESSED_ATTR)) {
          return;
        }
        if (target.parentElement && target.parentElement.hasAttribute(PROCESSED_ATTR)) {
          return;
        }

        // Check if new nodes were added
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(node => {
            // Check if it's an element node
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Skip our own checkmark additions
              if (node.classList && node.classList.contains('antitankie-checkmark')) {
                return;
              }
              // Check if it's an infobox or contains infobox that hasn't been processed
              if (node.classList && (node.classList.contains('infobox') ||
                  node.querySelector('.infobox:not([' + PROCESSED_ATTR + '])'))) {
                shouldReprocess = true;
              }
            }
          });
        }
      });

      if (shouldReprocess) {
        // Debounce reprocessing to avoid excessive calls
        clearTimeout(observer.reprocessTimeout);
        observer.reprocessTimeout = setTimeout(() => {
          processPage();
        }, 500);
      }
    });

    // Observe the entire document for changes - but only childList, not characterData
    // This reduces triggering on our own text changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: false  // Don't watch text changes to avoid loops
    });

    return observer;
  }

  // Start observing after initial page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupMutationObserver();
    });
  } else {
    setupMutationObserver();
  }

})();
