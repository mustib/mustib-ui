import { Component, Host, Listen, h, Prop, State, Element, type EventEmitter, Event, Watch } from '@stencil/core';
import { getElementBoundaries } from '@mustib/utils/dist/browser';
import { disablePageScroll, enablePageScroll } from '../../utils/scrollbar';
import { dispatchMuTriggerEvent, type MuTriggerEvent } from '../mu-trigger/event';

import type { MuSelectItemsValueChangeEvent } from '../mu-select-items/mu-select-items';

@Component({
  tag: 'mu-select',
  styleUrl: 'mu-select.scss',
  shadow: true,
})
export class MuSelect {
  @Element() host: HTMLMuSelectElement;
  itemsSlot: HTMLSlotElement;
  labelSlot: HTMLSlotElement;
  @State() selectedValues: string[] = [];

  get itemsElement() {
    return this.itemsSlot.assignedElements()[0] as HTMLMuSelectItemsElement | undefined;
  }
  get value() {
    return this.selectedValues.join(', ');
  }

  /**
   * A `boolean` indicates if the select should be closed when an item is selected.
   *
   * if undefined, the value will be false if mu-select-items is not multiple and true otherwise
   *
   * @default undefined
   */
  @Prop({ attribute: 'close-on-select', reflect: true }) _closeOnSelect?: boolean;

  get closeOnSelect() {
    return this._closeOnSelect !== undefined ? this._closeOnSelect : !this.itemsElement?.multiple;
  }

  /**
   * Controls the behavior of the items container when it is opened.
   *
   * - `'static'`: The items container position will be calculated when opened or closed.
   * - `'no-scroll'`: like static but with page scroll disabled.
   * - `'dynamic'`: like static but items container position will be recalculated when scroll
   */
  @Prop({ reflect: true }) openBehavior: 'static' | 'no-scroll' | 'dynamic' = 'static';

  @Event() muSelectOpenChange: EventEmitter<{ isOpened: boolean }>;

  @State() opened = false;
  @Watch('opened') onOpenedChange() {
    if (this.opened) {
      document.addEventListener('click', this.focusAndBlurHandler);
      document.addEventListener('focusin', this.focusAndBlurHandler);
    } else {
      document.removeEventListener('click', this.focusAndBlurHandler);
      document.removeEventListener('focusin', this.focusAndBlurHandler);
    }

    switch (this.openBehavior) {
      case 'static':
        this.calculateSizes();
        break;
      case 'no-scroll':
        this.opened ? disablePageScroll() : enablePageScroll();
        this.calculateSizes();
        break;
      case 'dynamic':
        this.calculateSizes();
        this.opened ? window.addEventListener('scroll', this.calculateSizes) : window.removeEventListener('scroll', this.calculateSizes);
        break;
      default:
        break;
    }

    dispatchMuTriggerEvent(this.itemsElement, this.opened ? 'open' : 'close');
    this.muSelectOpenChange.emit({ isOpened: this.opened });
  }

  @Listen('muTrigger') onMuTrigger(e: MuTriggerEvent) {
    e.preventDefault();

    this.host.blur();

    switch (e.detail.type) {
      case 'open':
        this.opened = true;
        break;
      case 'close':
        this.opened = false;
        break;
      case 'toggle':
        this.opened = !this.opened;
        break;
      default:
        break;
    }
  }

  /**
   * If `true`, the items container will use `fixed` position which is `absolute` by default.
   *
   * it can be useful if select is inside an element with `overflow: hidden`
   *
   * @default false
   */
  @Prop() fixedPosition = false;

  calculateSizes = () => {
    const boundaries = getElementBoundaries(this.host);
    const yAxisPosition = boundaries.elementTop >= boundaries.elementBottom ? 'top' : 'bottom';
    this.host.setAttribute('items-y-axis', yAxisPosition);
    this.host.style.setProperty('--items-max-height', Math.max(boundaries.elementTop, boundaries.elementBottom) + 'px');

    if (this.fixedPosition) {
      this.host.style.setProperty('--items-position', 'fixed');
      if (yAxisPosition === 'top') {
        this.host.style.setProperty('--items-bottom', boundaries.elementBottom + boundaries.height + 'px');
        this.host.style.setProperty('--items-top', 'unset');
      } else {
        this.host.style.setProperty('--items-top', boundaries.elementTop + boundaries.height + 'px');
        this.host.style.setProperty('--items-bottom', 'unset');
      }
      this.host.style.setProperty('--items-left', boundaries.elementLeft + 'px');
      this.host.style.setProperty('--items-right', boundaries.elementRight + 'px');
    } else {
      this.host.style.setProperty('--items-position', 'absolute');
      if (yAxisPosition === 'top') {
        this.host.style.setProperty('--items-bottom', '100%');
        this.host.style.setProperty('--items-top', 'unset');
      } else {
        this.host.style.setProperty('--items-top', '100%');
        this.host.style.setProperty('--items-bottom', 'unset');
      }
      this.host.style.setProperty('--items-left', '0');
      this.host.style.setProperty('--items-right', '0');
    }
  };

  @Listen('muSelectItemsValueChange') onValueChange(e: MuSelectItemsValueChangeEvent) {
    const { values } = e.detail;
    this.selectedValues = values;
    const labelElement = this.labelSlot.assignedElements()[0] as HTMLMuSelectLabelElement | undefined;
    if (labelElement) labelElement.value = this.value;
    if (this.closeOnSelect) this.opened = false;
  }

  @Listen('keydown', { target: 'document' }) onKeydown(e: KeyboardEvent) {
    if (!this.opened && this.host.ownerDocument.activeElement === this.host) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.opened = true;
      } else if (e.key === this.itemsElement?.nextItemSwitchKey) {
        e.preventDefault();
        this.itemsElement?.selectNextItemOnly();
      } else if (e.key === this.itemsElement?.prevItemSwitchKey) {
        e.preventDefault();
        this.itemsElement?.selectPrevItemOnly();
      }
      return;
    }
    if (this.opened && e.key === 'Escape') {
      e.preventDefault();
      this.opened = false;
      return;
    }
  }

  focusAndBlurHandler = (e: Event) => {
    if (!this.host.contains(e.target as Node)) {
      this.opened = false;
    }
  };

  render() {
    return (
      <Host tabindex="0" opened={this.opened} empty={this.selectedValues.length === 0}>
        <slot name="label" ref={el => (this.labelSlot = el as HTMLSlotElement)}>
          <mu-select-label value={this.value} opened={this.opened} />
        </slot>

        <div part="mu-select-items" id="items-container">
          <slot name="items" ref={el => (this.itemsSlot = el as HTMLSlotElement)}></slot>
        </div>

        <slot
          onSlotchange={e => {
            (e.currentTarget as HTMLSlotElement).assignedElements().forEach(el => {
              switch (el.tagName) {
                case 'MU-SELECT-ITEMS':
                  el.slot = 'items';
                  break;
                case 'MU-SELECT-LABEL':
                  el.slot = 'label';
                  break;
                default:
                  break;
              }
            });
          }}
        ></slot>
      </Host>
    );
  }
}
