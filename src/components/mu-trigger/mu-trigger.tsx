import { Component, Element, Event, Host, Prop, h, type EventEmitter } from '@stencil/core';
import { dispatchMuTriggerEvent, type MuTriggerEvent } from './event';

/**
 * Listens for events specified by `eventNameUsedToOpen` and `eventNameUsedToClose` and then emits a `'muTrigger'` event with the opened state.
 * If `useClickTrigger` is set to `true`, clicking the element will also open and close it.
 */
@Component({
  tag: 'mu-trigger',
  shadow: true,
})
export class MuTrigger {
  componentDidLoad() {
    const { eventNameUsedToClose, eventNameUsedToOpen, useClickTrigger } = this;

    if (useClickTrigger) {
      this.host.addEventListener('click', () => {
        this.dispatch('toggle');
      });
    }

    if (eventNameUsedToClose) {
      this.host.addEventListener(eventNameUsedToClose, () => {
        this.dispatch('close');
      });
    }

    if (eventNameUsedToOpen) {
      this.host.addEventListener(eventNameUsedToOpen, () => {
        this.dispatch('open');
      });
    }
  }

  @Element() host: HTMLMuTriggerElement;

  /**
   * A CSS selector for the closest element to dispatch the `'muTrigger'` event to.
   *
   * If not provided it will be dispatched to this element
   *
   * @default undefined
   */
  @Prop({ reflect: true }) for?: string;

  /**
   * Event name used to open the trigger
   *
   * @default undefined
   */
  @Prop({ reflect: true }) eventNameUsedToOpen?: string;

  /**
   * Event name used to close the trigger
   *
   * @default undefined
   */
  @Prop({ reflect: true }) eventNameUsedToClose?: string;

  /**
   * A boolean that indicates whether to use the click event to open/close the trigger
   *
   * @default true
   */
  @Prop({ reflect: true }) useClickTrigger = true;

  dispatch(type: MuTriggerEvent['detail']['type']) {
    if (this.for) {
      const el = this.host.closest(this.for);
      if (!el) console.warn(`the for attribute ${this.for} does not match any closest element to ${this.host}`);
      dispatchMuTriggerEvent(el, type);
    } else this.muTrigger.emit({ type });
  }

  @Event() muTrigger: EventEmitter<MuTriggerEvent['detail']>;

  render() {
    return (
      <Host>
        <slot></slot>
      </Host>
    );
  }
}
