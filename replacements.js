/**
 * Replacement Engine for Wikipedia Birthplace Corrector
 *
 * This module uses the configuration from config.js to perform
 * SSR -> modern country name replacements.
 */

(function(global) {
  'use strict';

  // Wait for config to be loaded
  const config = global.BirthplaceCorrectorConfig;
  if (!config) {
    console.error('BirthplaceCorrectorConfig not loaded!');
    return;
  }

  /**
   * Build lookup tables from config for fast access
   */
  function buildLookupTables() {
    const ssrToModern = {};      // SSR name -> { modernName, wikiPath }
    const ssrUrlToModern = {};   // /wiki/SSR_Name -> /wiki/Modern_Name

    config.COUNTRY_MAPPINGS.forEach(mapping => {
      mapping.ssrNames.forEach(ssrName => {
        ssrToModern[ssrName] = {
          modernName: mapping.modernName,
          wikiPath: mapping.wikiPath
        };

        // Build URL mapping
        const ssrUrlPath = '/wiki/' + ssrName.replace(/ /g, '_');
        ssrUrlToModern[ssrUrlPath] = mapping.wikiPath;
      });
    });

    return { ssrToModern, ssrUrlToModern };
  }

  const { ssrToModern, ssrUrlToModern } = buildLookupTables();

  // Get all SSR names sorted by length (longest first) for proper replacement
  const ssrNamesSorted = Object.keys(ssrToModern).sort((a, b) => b.length - a.length);

  /**
   * Check if text contains any SSR references
   */
  function containsSSRReference(text) {
    if (!text || typeof text !== 'string') return false;

    // Check for SSR names
    const hasSSR = ssrNamesSorted.some(ssrName => text.includes(ssrName));

    // Check for Soviet Union terms
    const hasSoviet = config.TERMS_TO_REMOVE.some(term =>
      text.toLowerCase().includes(term.toLowerCase())
    );

    return hasSSR || hasSoviet;
  }

  /**
   * Check if a URL should be completely removed
   */
  function shouldRemoveUrl(url) {
    if (!url || typeof url !== 'string') return false;
    return config.URLS_TO_REMOVE.some(removeUrl => url.includes(removeUrl));
  }

  /**
   * Replace SSR URL with modern country URL
   */
  function replaceSSRUrl(url) {
    if (!url || typeof url !== 'string') return url;

    // Sort by length (longest first)
    const sortedUrls = Object.keys(ssrUrlToModern).sort((a, b) => b.length - a.length);

    for (const oldUrl of sortedUrls) {
      if (url.includes(oldUrl)) {
        return url.replace(oldUrl, ssrUrlToModern[oldUrl]);
      }
    }

    return url;
  }

  /**
   * Remove Soviet Union references from text
   */
  function removeSovietUnionReferences(text) {
    if (!text || typeof text !== 'string') return text;

    let result = text;

    // Remove each term with preceding comma
    config.TERMS_TO_REMOVE.forEach(term => {
      // With comma before
      const regexWithComma = new RegExp(',\\s*' + escapeRegex(term), 'gi');
      result = result.replace(regexWithComma, '');

      // Standalone
      const regexStandalone = new RegExp('\\b' + escapeRegex(term) + '\\b', 'gi');
      result = result.replace(regexStandalone, '');
    });

    // Clean up double commas and extra spaces
    result = result.replace(/,\s*,/g, ',');
    result = result.replace(/\s{2,}/g, ' ');
    result = result.trim();

    return result;
  }

  /**
   * Replace SSR names with modern country names in text
   */
  function replaceSSRNames(text) {
    if (!text || typeof text !== 'string') return text;

    let result = text;

    // Replace SSR names (longest first)
    ssrNamesSorted.forEach(ssrName => {
      const modernInfo = ssrToModern[ssrName];
      if (modernInfo) {
        result = result.split(ssrName).join(modernInfo.modernName);
      }
    });

    // Also remove Soviet Union references
    result = removeSovietUnionReferences(result);

    return result;
  }

  /**
   * Find SSR name in text and get its modern equivalent
   * Returns { ssrName, modernName, wikiPath } or null
   */
  function findSSRInText(text) {
    if (!text || typeof text !== 'string') return null;

    for (const ssrName of ssrNamesSorted) {
      if (text.includes(ssrName)) {
        return {
          ssrName: ssrName,
          modernName: ssrToModern[ssrName].modernName,
          wikiPath: ssrToModern[ssrName].wikiPath
        };
      }
    }

    return null;
  }

  /**
   * Escape special regex characters
   */
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Get the config for external access
   */
  function getConfig() {
    return config;
  }

  // Export to global scope
  global.AntiTankieReplacements = {
    containsSSRReference,
    shouldRemoveUrl,
    replaceSSRUrl,
    removeSovietUnionReferences,
    replaceSSRNames,
    findSSRInText,
    getConfig,
    // Expose lookup tables for direct access if needed
    SSR_MAPPINGS: ssrToModern,
    COUNTRY_MAPPINGS: config.COUNTRY_MAPPINGS
  };

})(typeof window !== 'undefined' ? window : this);
