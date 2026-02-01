/**
 * Configuration for Wikipedia Birthplace Corrector
 *
 * This file contains all mappings for replacing Soviet-era designations
 * with modern country names. Community contributions welcome!
 *
 * HOW TO ADD NEW MAPPINGS:
 * 1. Add SSR variations to the COUNTRY_MAPPINGS array
 * 2. Each entry needs: ssrNames (array of variations), modernName, wikiPath
 * 3. The wikiPath is the Wikipedia article path (e.g., "/wiki/Estonia")
 */

window.BirthplaceCorrectorConfig = {

  /**
   * Country mappings: SSR names -> Modern country names
   *
   * Each entry contains:
   * - ssrNames: Array of SSR name variations to match
   * - modernName: The modern country name to display
   * - wikiPath: Wikipedia article path for the country
   */
  COUNTRY_MAPPINGS: [
    // ============================================
    // BALTIC STATES (1940-1941, 1944-1991)
    // ============================================
    {
      ssrNames: [
        'Estonian SSR',
        'Estonian Soviet Socialist Republic'
      ],
      modernName: 'Estonia',
      wikiPath: '/wiki/Estonia'
    },
    {
      ssrNames: [
        'Latvian SSR',
        'Latvian Soviet Socialist Republic'
      ],
      modernName: 'Latvia',
      wikiPath: '/wiki/Latvia'
    },
    {
      ssrNames: [
        'Lithuanian SSR',
        'Lithuanian Soviet Socialist Republic'
      ],
      modernName: 'Lithuania',
      wikiPath: '/wiki/Lithuania'
    },

    // ============================================
    // EASTERN EUROPEAN REPUBLICS
    // ============================================
    {
      ssrNames: [
        'Ukrainian SSR',
        'Ukrainian Soviet Socialist Republic'
      ],
      modernName: 'Ukraine',
      wikiPath: '/wiki/Ukraine'
    },
    {
      ssrNames: [
        'Byelorussian SSR',
        'Belarusian SSR',
        'Belorussian SSR',
        'Byelorussian Soviet Socialist Republic',
        'Belarusian Soviet Socialist Republic',
        'Belorussian Soviet Socialist Republic'
      ],
      modernName: 'Belarus',
      wikiPath: '/wiki/Belarus'
    },
    {
      ssrNames: [
        'Moldavian SSR',
        'Moldovan SSR',
        'Moldavian Soviet Socialist Republic',
        'Moldovan Soviet Socialist Republic'
      ],
      modernName: 'Moldova',
      wikiPath: '/wiki/Moldova'
    },

    // ============================================
    // CAUCASUS REGION
    // ============================================
    {
      ssrNames: [
        'Georgian SSR',
        'Georgian Soviet Socialist Republic'
      ],
      modernName: 'Georgia',
      wikiPath: '/wiki/Georgia_(country)'
    },
    {
      ssrNames: [
        'Armenian SSR',
        'Armenian Soviet Socialist Republic'
      ],
      modernName: 'Armenia',
      wikiPath: '/wiki/Armenia'
    },
    {
      ssrNames: [
        'Azerbaijan SSR',
        'Azerbaijani SSR',
        'Azerbaijan Soviet Socialist Republic',
        'Azerbaijani Soviet Socialist Republic'
      ],
      modernName: 'Azerbaijan',
      wikiPath: '/wiki/Azerbaijan'
    },

    // ============================================
    // CENTRAL ASIAN REPUBLICS
    // ============================================
    {
      ssrNames: [
        'Kazakh SSR',
        'Kazakh Soviet Socialist Republic'
      ],
      modernName: 'Kazakhstan',
      wikiPath: '/wiki/Kazakhstan'
    },
    {
      ssrNames: [
        'Uzbek SSR',
        'Uzbek Soviet Socialist Republic'
      ],
      modernName: 'Uzbekistan',
      wikiPath: '/wiki/Uzbekistan'
    },
    {
      ssrNames: [
        'Turkmen SSR',
        'Turkmen Soviet Socialist Republic'
      ],
      modernName: 'Turkmenistan',
      wikiPath: '/wiki/Turkmenistan'
    },
    {
      ssrNames: [
        'Kirghiz SSR',
        'Kyrgyz SSR',
        'Kirghiz Soviet Socialist Republic',
        'Kyrgyz Soviet Socialist Republic'
      ],
      modernName: 'Kyrgyzstan',
      wikiPath: '/wiki/Kyrgyzstan'
    },
    {
      ssrNames: [
        'Tajik SSR',
        'Tajik Soviet Socialist Republic'
      ],
      modernName: 'Tajikistan',
      wikiPath: '/wiki/Tajikistan'
    },

    // ============================================
    // RUSSIAN SFSR
    // ============================================
    {
      ssrNames: [
        'Russian SFSR',
        'Russian Soviet Federative Socialist Republic',
        'RSFSR'
      ],
      modernName: 'Russia',
      wikiPath: '/wiki/Russia'
    }
  ],

  /**
   * Terms to remove entirely (Soviet Union references)
   * These will be removed along with any preceding comma
   */
  TERMS_TO_REMOVE: [
    'Soviet Union',
    'USSR',
    'Union of Soviet Socialist Republics'
  ],

  /**
   * Wikipedia URLs that should cause the entire link to be removed
   */
  URLS_TO_REMOVE: [
    '/wiki/Soviet_Union',
    '/wiki/USSR',
    '/wiki/Union_of_Soviet_Socialist_Republics'
  ]

};
