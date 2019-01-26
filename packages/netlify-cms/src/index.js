import React from 'react';
import CMS, { init } from 'netlify-cms-core/src';
import createCustomRelationWidget from 'netlify-cms-custom-relation/src';
import './backends';
import './widgets';
import './editor-components';
import './media-libraries';

/**
 * Load Netlify CMS automatically if `window.CMS_MANUAL_INIT` is set.
 */
if (!window.CMS_MANUAL_INIT) {
  init();
} else {
  console.log('`window.CMS_MANUAL_INIT` flag set, skipping automatic initialization.');
}

/**
 * Add extension hooks to global scope.
 */
if (typeof window !== 'undefined') {
  window.CMS = CMS;
  window.initCMS = init;
  window.h = window.h || React.createElement;
  window.CMS.createCustomRelationWidget = createCustomRelationWidget;
}

export { CMS as default, init, createCustomRelationWidget };
