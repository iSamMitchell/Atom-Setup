'use strict';

const {openDocumentationInWebURL} = require('../urls');
const {renderValueHeader, renderExtend, renderExamples, renderUsages, renderDefinition, renderMembers, valueDescription, debugData, renderLinks, renderParameters} = require('./html-utils');
const StickyTitle = require('./sticky-title');
const {idIsEmpty} = require('../kite-data-utils');
const {renderPatterns, renderLanguageSpecificArguments} = require('./function-utils');

class KiteExpandModule extends HTMLElement {
  static initClass() {
    return document.registerElement('kite-expand-module', {prototype: this.prototype});
  }

  setData(data) {
    const {value} = data;

    this.innerHTML = `
    ${renderValueHeader(value)}
    ${renderExtend(value)}

    <div class="scroll-wrapper">
      <div class="sections-wrapper">
        ${
          value.kind === 'type'
            ? `${renderParameters(value)}
               ${renderPatterns(value)}
               ${renderLanguageSpecificArguments(value)}`
            : ''
        }
        <section class="summary">
          <h4>Summary</h4>
          ${valueDescription(data)}
        </section>

        ${renderMembers(value)}
        ${renderUsages(data)}
        ${renderExamples(data)}
        ${renderLinks(data)}
        ${renderDefinition(data)}
        ${debugData(data)}
      </div>
    </div>

    <footer>
      <div></div>
      ${!idIsEmpty(value.id)
        ? `<kite-open-link data-url="${openDocumentationInWebURL(value.id)}"></kite-open-link>`
      : ''}
    </footer>
    `;
  }

  attachedCallback() {
    this.subscriptions = new StickyTitle(this.querySelectorAll('h4'), this.querySelector('.sections-wrapper'));
  }

  detachedCallback() {
    this.subscriptions && this.subscriptions.dispose();
  }
}

module.exports = KiteExpandModule.initClass();
