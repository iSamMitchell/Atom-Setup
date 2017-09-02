'use strict';

const {CompositeDisposable, Emitter} = require('atom');
const LinkScheme = require('../link-scheme');
const metrics = require('../metrics');
let Kite;

const stripLeadingSlash = str => str.replace(/^\//, '');

const parseRangeInPath = (path) =>
  stripLeadingSlash(path).split('/').map(s => s.split(':').map(Number));

const parseDefinitionInPath = (path) =>
  stripLeadingSlash(path).split(':');

class KiteLinks extends HTMLElement {
  static initClass() {
    return document.registerElement('kite-links', {
      prototype: this.prototype,
    });
  }

  onDidClickMoreLink(listener) {
    return this.emitter.on('did-click-more-link', listener);
  }

  createdCallback() {
    this.emitter = new Emitter();
  }

  attachedCallback() {
    const metric = this.getAttribute('metric');
    this.subscriptions = new CompositeDisposable();
    this.scheme = new LinkScheme('kite-atom-internal', this);

    this.subscriptions.add(this.scheme);
    this.subscriptions.add(this.emitter);
    this.subscriptions.add(this.scheme.onDidClickLink(({url, target}) => {
      if (!Kite) { Kite = require('../kite'); }
      const editor = atom.workspace.getActiveTextEditor();
      const kiteEditor = Kite.kiteEditorForEditor(editor);

      if (!editor || !kiteEditor) { return; }

      switch (url.host) {
        case 'goto': {
          const [filename, line] = parseDefinitionInPath(url.path);
          metrics.track(`${metric} Go to definition clicked`);
          kiteEditor.openDefinition({filename, line}).catch(err => {
            atom.notifications.addWarning('Can\'t find the definition', {
              dismissable: true,
            });
          });
          break;
        }
        case 'goto-id': {
          const id = stripLeadingSlash(url.path);
          metrics.track(`${metric} Go to definition clicked`);
          kiteEditor.openDefinitionForId(id)
          .then(() => {
          })
          .catch(() => {
            atom.notifications.addWarning(`Can't find a definition for id \`${id}\``, {
              dismissable: true,
            });
          });
          break;
        }
        case 'goto-range': {
          const range = parseRangeInPath(url.path);
          metrics.track(`${metric} Go to definition clicked`);
          kiteEditor.openDefinitionAtRange(range)
          .catch(err => {
            atom.notifications.addWarning(`Can't find a definition at range \`${range}\``, {
              dismissable: true,
            });
          });
          break;
        }
        case 'open-range': {
          metrics.track(`${metric} Open in web clicked`);
          const range = parseRangeInPath(url.path);
          kiteEditor.openInWebAtRange(range);
          break;
        }
        case 'type':
        case 'expand': {
          this.emitter.emit('did-click-more-link');
          metrics.track(`${metric} See info clicked`);
          const id = stripLeadingSlash(url.path);
          kiteEditor.expandId(id);
          break;
        }
        case 'expand-range': {
          this.emitter.emit('did-click-more-link');
          metrics.track(`${metric} See info clicked`);
          const range = parseRangeInPath(url.path);
          kiteEditor.expandRange(range);
          break;
        }
      }
    }));
  }

  detachedCallback() {
    this.subscriptions && this.subscriptions.dispose();
  }
}

module.exports = KiteLinks.initClass();
