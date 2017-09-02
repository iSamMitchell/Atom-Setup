// 'use strict';

const {StateController, Logger} = require('kite-installer');
const {CompositeDisposable, TextEditor} = require('atom');
const {searchPath} = require('../urls');
const {promisifyReadResponse, addDelegatedEventListener, DisposableEvent, compact, flatten} = require('../utils');
require('./kite-expand');
const metrics = require('../metrics');

const SEARCH_METRIC_TIMEOUT = 1000;

class KiteActiveSearch extends HTMLElement {
  static initClass() {
    atom.commands.add('kite-active-search', {
      'core:move-up'() {
        this.selectPreviousItem();
      },
      'core:move-down'() {
        this.selectNextItem();
      },
      'core:cancel'() {
        this.textEditor.setText('');
        this.collapse();
      },
      // 'core:confirm'() {
      //   this.toggleSelectedItem();
      // },
    });

    return document.registerElement('kite-active-search', {
      prototype: this.prototype,
    });
  }

  createdCallback() {
    this.setAttribute('tabindex', -1);

    this.innerHTML = `
      <div class="select-list popover-list">
        <ol class="list-group"></ol>
      </div>
      <kite-expand style="display: none;"></kite-expand>
      <div class="expander icon-search"></div>
      <div class="collapser icon-chevron-right"></div>
    `;

    this.subscriptions = new CompositeDisposable();
    this.textEditor = new TextEditor({placeholderText: 'Search identifier…', mini: true});
    this.textEditorView = atom.views.getView(this.textEditor);
    this.expandView = this.querySelector('kite-expand');
    this.expander = this.querySelector('.expander');
    this.collapser = this.querySelector('.collapser');
    this.list = this.querySelector('ol');

    this.list.parentNode.insertBefore(this.textEditorView, this.list);
    this.expandView.removeAttribute('tabindex');

    this.subscriptions.add(atom.config.observe('kite.activeSearchPosition', (pos, oldPos) => {
      this.setAttribute('position', pos);
    }));
    this.subscriptions.add(addDelegatedEventListener(this.list, 'click', 'li', e => {
      const {target} = e;
      this.selectItem(target);
    }));

    this.subscriptions.add(new DisposableEvent(this, 'focus', () => {
      this.focused();
    }));

    this.subscriptions.add(new DisposableEvent(this.expander, 'click', () => {
      this.expand();
    }));

    this.subscriptions.add(new DisposableEvent(this.collapser, 'click', () => {
      this.collapse();
    }));

    this.stack = Promise.resolve();

    this.subscriptions.add(this.textEditor.onDidChange(() => {
      this.startRecordMetric();
      const text = this.textEditor.getText().trim();

      if (text !== '') {
        const path = searchPath(text);

        this.stack = this.stack.then(() => StateController.client.request({path}).then(resp => {
          Logger.logResponse(resp);
          if (resp.statusCode !== 200) {
            return promisifyReadResponse(resp).then(data => {
              throw new Error(`bad status ${resp.statusCode}: ${data}`);
            });
          }

          return promisifyReadResponse(resp);
        }))
        .then(data => JSON.parse(data))
        .then(data => this.renderList(data));
      } else {
        this.stack = this.stack.then(() => this.clear());
      }
    }));

    this.stack = this.stack.catch(() => {});

    this.hide();
  }

  focused() {
    this.textEditorView.focus();
  }

  focus() {
    this.textEditorView.focus();
  }

  startRecordMetric() {
    if (!this.recording) {
      this.recording = true;
      metrics.featureRequested('active_search');

      setTimeout(() => {
        if (this.expandView && this.expandView.querySelector('.scroll-wrapper *')) {
          metrics.featureFulfilled('active_search');
        }

        this.recording = false;
      }, SEARCH_METRIC_TIMEOUT);
    }
  }

  show() {
    const paneContainer = document.querySelector('atom-workspace-axis.vertical  atom-pane-container.panes');

    paneContainer.appendChild(this);
  }

  hide() {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }

    this.clear();
    this.collapse();
  }

  collapse() {
    this.classList.add('collapsed');
  }

  expand() {
    this.classList.remove('collapsed');
    this.textEditorView.focus();
  }

  setApp(app) {
    this.app = app;
  }

  clear() {
    this.expandView && (this.expandView.style.display = 'none');
    this.list && (this.list.innerHTML = '');
    delete this.selectedItem;
  }

  renderList(results) {
    if (results && results.python_results) {
      const localResults = (results.python_results.local_results || {results: []}).results || [];
      const globalResults = (results.python_results.global_results || {results: []}).results || [];
      const allResults = compact(flatten([
        localResults.map(r => {
          r.local = true;
          return r;
        }),
        globalResults.map(r => {
          r.local = false;
          return r;
        }),
      ]));

      this.list.innerHTML = allResults
      .filter(r => r.result.repr && r.result.repr.trim() !== '')
      .map(r =>
        `<li data-id="${r.result.id}">
          ${r.result.repr} ${r.local ? '<small>Local</small>' : ''}
        </li>`
      ).join('');
      this.selectNextItem();
    }
  }

  selectNextItem() {
    if (this.list.childNodes.length === 0) {
      this.clear();
      return;
    }

    if (this.selectedItem && this.selectedItem.nextSibling) {
      this.selectItem(this.selectedItem.nextSibling);
    } else {
      this.selectItem(this.list.firstChild);
    }
  }

  selectPreviousItem() {
    if (this.list.childNodes.length === 0) { return; }

    if (this.selectedItem && this.selectedItem.previousSibling) {
      this.selectItem(this.selectedItem.previousSibling);
    } else {
      this.selectItem(this.list.lastChild);
    }
  }

  selectItem(item) {
    this.selectedItem && this.selectedItem.classList.remove('selected');
    this.selectedItem = item;
    if (this.selectedItem) {
      this.selectedItem.classList.add('selected');
      this.loadItem(this.selectedItem.getAttribute('data-id'));
      this.scrollTo(this.selectedItem);
    }
  }

  loadItem(id) {
    this.expandView.style.display = '';
    this.expandView.showDataForId(atom.workspace.getActiveTextEditor(), id, true);
  }

  scrollTo(target) {
    const containerBounds = this.list.getBoundingClientRect();
    const scrollTop = this.list.scrollTop;
    const targetTop = target.offsetTop;
    const targetBottom = targetTop + target.offsetHeight;

    if (targetTop < scrollTop) {
      this.list.scrollTop = targetTop;
    } else if (targetBottom > scrollTop + containerBounds.height) {
      this.list.scrollTop = targetBottom - containerBounds.height;
    }
  }
}

module.exports = KiteActiveSearch.initClass();
