'use strict';

const {openDocumentationInWebURL} = require('../urls');
const {renderValueHeader, renderExtend, renderUsages, renderParameters, renderParameter, renderExamples, renderDefinition, renderInvocations, valueDescription, debugData, renderLinks, highlightCode, proFeatures, pluralize} = require('./html-utils');
const {callSignature, idIsEmpty} = require('../kite-data-utils');
const StickyTitle = require('./sticky-title');
const Plan = require('../plan');

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
        ${this.renderPatterns(value)}
        ${this.renderKwargs(value)}

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

  renderPatterns(data) {
    let patterns = '';
    const name = data.repr;
    if (data.detail && data.detail.signatures && data.detail.signatures.length) {
      patterns = Plan.can('common_invocations_editor')
        ? `
          <section class="patterns">
          <h4>Popular Patterns</h4>
          <div class="section-content">${
            highlightCode(
              data.detail.signatures
              .map(s => callSignature(s))
              .map(s => `${name}(${s})`)
              .join('\n'))
            }</div>
          </section>`
        : `<section class="patterns">
            <h4>Popular Patterns</h4>
            <div class="section-content">
            ${proFeatures(
              `To see ${data.detail.signatures.length} ${
                pluralize(data.detail.signatures.length, 'pattern', 'patterns')
              }`
            )}</div>
          </section>`;
    }
    return patterns;
  }

  renderKwargs(data) {
    let kwargs = '';
    const {detail} = data;
    if (detail && detail.kwarg_parameters && detail.kwarg_parameters.length) {
      kwargs = `<section class="kwargs">
        <h4>**${detail.kwarg.name}</h4>
        <div class="section-content"><dl>
          ${
            detail.kwarg_parameters
            .map(p => renderParameter(p))
            .map(p => `<dt>${p}</dt>`)
            .join('')
          }
        </dl></div>
      </section>`;
    }
    return kwargs;
  }

  attachedCallback() {
    this.subscriptions = new StickyTitle(this.querySelectorAll('h4'), this.querySelector('.sections-wrapper'));
  }

  detachedCallback() {
    this.subscriptions && this.subscriptions.dispose();
  }
}

module.exports = KiteExpandFunction.initClass();
