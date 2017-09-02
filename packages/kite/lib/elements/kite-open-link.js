'use strict';

const {humanizeKeystroke} = require('underscore-plus');
const {DisposableEvent} = require('../utils');
const metrics = require('../metrics.js');

class KiteOpenLink extends HTMLElement {
  static initClass() {
    return document.registerElement('kite-open-link', {
      prototype: this.prototype,
    });
  }

  detachedCallback() {
    this.subscription && this.subscription.dispose();
  }

  attachedCallback() {
    this.url = this.getAttribute('data-url');

    const editor = atom.workspace.getActiveTextEditor();
    const editorElement = atom.views.getView(editor);
    const binding =  atom.keymaps.findKeyBindings({target: editorElement})
    .filter(k => k.command === 'kite:open-in-web')[0];

    const kbd = binding
      ? `<kbd>${humanizeKeystroke(binding.keystrokes)}</kbd>`
      : '';

    const content = this.innerHTML !== ''
      ? this.innerHTML
      : `<span><i>Open in Web</i>${kbd}</span>`;

    this.innerHTML = `<a href="#">${content}</a><kite-logo/>`;

    const link = this.querySelector('a');
    this.subscription = new DisposableEvent(link, 'click', () => {
      metrics.track('Expand UI Open in web clicked');
      metrics.featureRequested('open_in_web');
      atom.applicationDelegate.openExternal(this.url);
      metrics.featureFulfilled('open_in_web');
    });
  }

  open() {
    metrics.track('Expand UI Open In web invoked by command');
    atom.applicationDelegate.openExternal(this.url);
  }
}

module.exports = KiteOpenLink.initClass();
