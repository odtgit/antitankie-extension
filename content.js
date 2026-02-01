// Wikipedia Birthplace Corrector - Content Script
// Replaces Soviet-era birthplace designations with modern country names

(function() {
  'use strict';

  let isEnabled = true;
  let isProcessing = false;
  const PROCESSED_ATTR = 'data-antitankie-processed';

  // Initialize: Check if extension is enabled
  try {
    chrome.runtime.sendMessage({ type: 'getState' }, (response) => {
      if (chrome.runtime.lastError) {
        isEnabled = true;
        processPage();
        return;
      }

      if (response && typeof response.enabled !== 'undefined') {
        isEnabled = response.enabled;
      } else {
        isEnabled = true;
      }

      if (isEnabled) {
        processPage();
      }
    });
  } catch (e) {
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
    if (!isEnabled || isProcessing) {
      return;
    }

    isProcessing = true;

    try {
      let replacementCount = 0;
      const targetElements = findTargetElements();

      targetElements.forEach(element => {
        if (element.hasAttribute(PROCESSED_ATTR)) {
          return;
        }

        if (element.closest('[' + PROCESSED_ATTR + ']')) {
          return;
        }

        const result = processElement(element);

        if (result.changed) {
          replacementCount += result.count;
          element.setAttribute(PROCESSED_ATTR, 'true');
          addVisualIndicator(element);
        }
      });

      if (replacementCount > 0) {
        try {
          chrome.runtime.sendMessage({
            type: 'incrementCount',
            count: replacementCount
          });
        } catch (e) {
          // Silently fail if background not available
        }
      }
    } finally {
      isProcessing = false;
    }
  }

  /**
   * Find all elements that should be processed
   */
  function findTargetElements() {
    const elements = [];
    const infoboxes = document.querySelectorAll('.infobox');

    infoboxes.forEach(infobox => {
      const headers = infobox.querySelectorAll('th');
      headers.forEach(th => {
        const thText = th.textContent.trim();
        if (thText === 'Born' || thText.startsWith('Born')) {
          const td = th.nextElementSibling;
          if (td && td.tagName === 'TD') {
            elements.push(td);
          }
        }
      });

      const birthplaceElements = infobox.querySelectorAll('[class*="birthplace"]');
      birthplaceElements.forEach(el => elements.push(el));

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
      const ssrMatch = window.AntiTankieReplacements.findSSRInText(originalText);
      const parent = textNode.parentNode;
      const isInsideLink = parent && parent.tagName === 'A';

      if (ssrMatch && !isInsideLink) {
        // Split the text and create a link
        const parts = originalText.split(ssrMatch.ssrName);
        const beforeText = parts[0];
        const afterText = parts.slice(1).join(ssrMatch.ssrName);

        let cleanAfterText = window.AntiTankieReplacements.removeSovietUnionReferences(afterText);

        const link = document.createElement('a');
        link.href = ssrMatch.wikiPath;
        link.title = ssrMatch.modernName;
        link.textContent = ssrMatch.modernName;

        const beforeNode = document.createTextNode(beforeText);
        const afterNode = document.createTextNode(cleanAfterText);

        parent.insertBefore(beforeNode, textNode);
        parent.insertBefore(link, textNode);
        parent.insertBefore(afterNode, textNode);
        parent.removeChild(textNode);

        changed = true;
        count++;
      } else {
        const newText = window.AntiTankieReplacements.replaceSSRNames(originalText);

        if (originalText !== newText) {
          textNode.textContent = newText;
          changed = true;
          count++;
        }
      }
    });

    // Process links - collect links to process/remove
    const links = Array.from(element.querySelectorAll('a[href*="/wiki/"]'));
    const linksToRemove = [];

    links.forEach(link => {
      const originalHref = link.getAttribute('href');
      const shouldRemove = window.AntiTankieReplacements.shouldRemoveUrl(originalHref);

      if (shouldRemove) {
        linksToRemove.push(link);
        changed = true;
        count++;
        return;
      }

      const newHref = window.AntiTankieReplacements.replaceSSRUrl(originalHref);

      if (originalHref !== newHref) {
        link.setAttribute('href', newHref);
        changed = true;
        count++;
      }

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

    // Remove Soviet Union links and clean up surrounding text
    linksToRemove.forEach(link => {
      const prevSibling = link.previousSibling;
      if (prevSibling && prevSibling.nodeType === Node.TEXT_NODE) {
        const prevText = prevSibling.textContent;
        if (prevText.endsWith(', ')) {
          prevSibling.textContent = prevText.slice(0, -2);
        } else if (prevText.endsWith(',')) {
          prevSibling.textContent = prevText.slice(0, -1);
        }
      }

      link.remove();
    });

    ensureProperFormatting(element);

    return { changed, count };
  }

  /**
   * Ensure proper formatting with commas between location parts
   */
  function ensureProperFormatting(element) {
    const birthplaceSpan = element.querySelector('.birthplace') || element;

    const links = Array.from(birthplaceSpan.querySelectorAll('a[href*="/wiki/"]')).filter(link => {
      const href = link.getAttribute('href') || '';
      return !/\/wiki\/\d{4}$/.test(href) &&
             !/\/wiki\/(January|February|March|April|May|June|July|August|September|October|November|December)/.test(href);
    });

    for (let i = 0; i < links.length - 1; i++) {
      const currentLink = links[i];
      const nextLink = links[i + 1];

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

      if (!hasComma && textNode) {
        const text = textNode.textContent.trim();
        if (text === '' || text === ' ') {
          textNode.textContent = ', ';
        }
      } else if (!hasComma && !textNode) {
        const comma = document.createTextNode(', ');
        currentLink.parentNode.insertBefore(comma, nextLink);
      }
    }
  }

  /**
   * Add visual indicator to corrected elements
   */
  function addVisualIndicator(element) {
    element.style.borderLeft = '3px solid #4CAF50';
    element.style.paddingLeft = '8px';
    element.setAttribute('title', 'Birthplace corrected by Wikipedia Birthplace Corrector');

    if (element.querySelector('.antitankie-checkmark')) {
      return;
    }

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

    const birthplaceSpan = element.querySelector('.birthplace');
    if (birthplaceSpan) {
      birthplaceSpan.appendChild(icon);
      return;
    }

    const links = element.querySelectorAll('a[href*="/wiki/"]');
    let lastLocationLink = null;
    links.forEach(link => {
      const href = link.getAttribute('href') || '';
      if (!/\/wiki\/\d{4}/.test(href) && !/\/wiki\/(January|February|March|April|May|June|July|August|September|October|November|December)/.test(href)) {
        lastLocationLink = link;
      }
    });

    if (lastLocationLink) {
      lastLocationLink.insertAdjacentElement('afterend', icon);
      return;
    }

    const brs = element.querySelectorAll('br');
    if (brs.length > 0) {
      const br = brs[0];
      let sibling = br.nextSibling;
      while (sibling) {
        if (sibling.nodeType === Node.ELEMENT_NODE) {
          sibling.appendChild(icon);
          return;
        } else if (sibling.nodeType === Node.TEXT_NODE && sibling.textContent.trim()) {
          sibling.parentNode.insertBefore(icon, sibling.nextSibling);
          return;
        }
        sibling = sibling.nextSibling;
      }
    }

    element.appendChild(icon);
  }

  /**
   * Set up MutationObserver to watch for dynamic content changes
   */
  function setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      if (!isEnabled || isProcessing) return;

      let shouldReprocess = false;

      mutations.forEach(mutation => {
        const target = mutation.target;
        if (target.nodeType === Node.ELEMENT_NODE && target.hasAttribute(PROCESSED_ATTR)) {
          return;
        }
        if (target.parentElement && target.parentElement.hasAttribute(PROCESSED_ATTR)) {
          return;
        }

        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.classList && node.classList.contains('antitankie-checkmark')) {
                return;
              }
              if (node.classList && (node.classList.contains('infobox') ||
                  node.querySelector('.infobox:not([' + PROCESSED_ATTR + '])'))) {
                shouldReprocess = true;
              }
            }
          });
        }
      });

      if (shouldReprocess) {
        clearTimeout(observer.reprocessTimeout);
        observer.reprocessTimeout = setTimeout(() => {
          processPage();
        }, 500);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: false
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
