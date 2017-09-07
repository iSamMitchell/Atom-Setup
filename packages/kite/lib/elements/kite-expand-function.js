'use strict';

const {openDocumentationInWebURL} = require('../urls');
const {renderValueHeader, renderExtend, renderUsages, renderParameters, renderExamples, renderDefinition, renderInvocations, valueDescription, debugData, renderLinks} = require('./html-utils');
const {idIsEmpty} = require('../kite-data-utils');
const {renderPatterns, renderLanguageSpecificArguments} = require('./function-utils');
const StickyTitle = require('./sticky-title');

class KiteExpandFunction extends HTMLElement {
  static initClass() {
    return document.registerElement('kite-expand-function', {prototype: this.prototype});
  }

  setData(data) {
    const {value} = data;
    this.innerHTML = `
    ${renderValueHeader(value)}
    ${renderExtend(value)}

    <div class="scroll-wrapper">
      <div class="sections-wrapper">
        ${renderParameters(value)}
        ${renderPatterns(value)}
        ${renderLanguageSpecificArguments(value)}

        <section class="summary">
          <h4>Summary</h4>
          ${valueDescription(data)}
        </section>

        ${renderUsages(data)}
        ${renderExamples(data)}
        ${renderDefinition(data)}
        ${renderLinks(data)}
        ${renderInvocations(value)}
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

module.exports = KiteExpandFunction.initClass();
