import type { TimeUnits } from '@mustib/utils';
import { Component, Element, Host, Prop, State, h } from '@stencil/core';
import { timeout } from '../../utils/timeout';
import { dispatchMuTriggerEvent, type MuTriggerEvent } from '../mu-trigger/event';

/**
 * This component handles delayed opening and closing by listening to `'muTrigger'` events dispatched from its parent.
 * It is particularly useful for implementing animations.
 */
@Component({
  tag: 'mu-trigger-delay',
  shadow: true,
})
export class MuTriggerDelay {
  // this id is used to prevent old listeners that still have timeouts from being continued when a new listener is added
  lastListenerId = -1;

  componentDidLoad() {
    this.host.addEventListener('muTrigger', this.onMuTrigger.bind(this));
    this.watchParent && this.host.parentNode?.addEventListener('muTrigger', this.onMuTrigger.bind(this));
  }

  onMuTrigger(e: MuTriggerEvent) {
    const listenerId = ++this.lastListenerId;
    if (e.detail.type === 'open' || (e.detail.type === 'toggle' && (this.openStatus === 'closed' || this.openStatus === 'closing'))) {
      this.openStatus = 'opening';
      timeout(this.awaitOpeningTimeout, () => {
        if (listenerId === this.lastListenerId) {
          dispatchMuTriggerEvent(this.childElement, 'open');
          this.openStatus = 'opened';
        }
      });
    } else {
      this.openStatus = 'closing';
      timeout(this.awaitClosingTimeout, () => {
        if (listenerId === this.lastListenerId) {
          dispatchMuTriggerEvent(this.childElement, 'close');
          this.openStatus = 'closed';
        }
      });
    }
  }

  @Element() host: HTMLMuTriggerDelayElement;

  @State() openStatus: 'opening' | 'opened' | 'closing' | 'closed' = 'closed';

  /**
   * `@default` 0ms
   *
   * The duration to wait before the component is fully opened.
   *
   * This property follows the {@link https://github.com/mustib/mustib-utils/blob/main/src/common/millisecondsFromString.ts#L5 TimeUnits} type from {@link https://github.com/mustib/mustib-utils @mustib/utils}.
   */
  @Prop({ reflect: true }) awaitOpeningTimeout: TimeUnits = '0ms';

  /**
   * `@default` 0ms
   *
   * The duration to wait before the component is fully closed.
   *
   * This property follows the {@link TimeUnits} type from {@link https://github.com/mustib/mustib-utils/blob/main/src/common/millisecondsFromString.ts#L5 @mustib/utils}.
   */
  @Prop({ reflect: true }) awaitClosingTimeout: TimeUnits = '0ms';

  /**
   * if `'true'`, the component will listen to `'muTrigger'` events from its parent.
   *
   * @default false
   */
  @Prop({ reflect: true }) watchParent = false;

  /**
   * The selector of the child that will receive the `'muTrigger'` event once opened or closed.
   *
   * @default undefined
   *
   * @see {@link MuTriggerDelay.childElement}
   */
  @Prop({ reflect: true }) childSelector?: string;

  /**
   * Returns the child element that will receive the `'muTrigger'` event once opened or closed.
   *
   * If `childSelector` is provided, it will be used to query the child element.
   * Otherwise, the first child element of `this.host` will be used.
   */
  get childElement() {
    const { childSelector } = this;
    return childSelector ? this.host.querySelector(childSelector) : this.host.firstElementChild;
  }

  render() {
    return (
      <Host open-status={this.openStatus}>
        <slot></slot>
      </Host>
    );
  }
}
