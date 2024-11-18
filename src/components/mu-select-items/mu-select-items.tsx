import { Component, Element, Method, Event, type EventEmitter, Host, Listen, Prop, State, h, Watch } from '@stencil/core';

import type { MuTriggerEvent } from '../mu-trigger/event';

export type MuSelectItemsValueChangeEvent = CustomEvent<{
  /**
   * The selected items values
   */
  values: string[];
}>;

type AddActiveStateOptions = Partial<{
  /**
   * A `boolean` indicates if the item should be focused.
   */
  focus: boolean;

  /**
   * A `boolean` indicates if the item should be scrolled into view.
   */
  scroll: boolean;
}>;

type SwitchActiveItemOptions = Partial<{
  /**
   * A `boolean` indicates if the selection should wrap around to the start/end
   */
  switchBack: boolean;

  addActiveStateOptions: AddActiveStateOptions;
}>;

type Item = { element: HTMLMuSelectItemElement; index: number };

@Component({
  tag: 'mu-select-items',
  styleUrl: 'mu-select-items.scss',
  shadow: true,
})
export class MuSelectItems {
  disconnectedCallback() {
    this.removeListeners();
  }

  items: Item[] = [];
  itemsElementsMap = new Map<Item['element'], Item>();
  selectedItems: Item[] = [];
  activeItem?: Item;

  @Method() async getSelectedValues() {
    return this.selectedItems.map(item => item.element.value);
  }

  @Event() muSelectItemsValueChange: EventEmitter<MuSelectItemsValueChangeEvent['detail']>;

  @Element() host: HTMLMuSelectItemsElement;

  /**
   * A `boolean` indicates if multiple items can be selected.
   * @default false;
   */
  @Prop({ reflect: true }) multiple = false;

  /**
   * One of the following values: `'before'`, `'after'`, `''` or `undefined`.
   *
   * `'before' | ''` places the checkbox before the item.
   * `'after'` places the checkbox after the item.
   * `undefined` places the checkbox only when `multiple` is `true`.
   *
   * @default multiple ? 'before' : undefined
   */
  @Prop({ reflect: true }) checkbox: HTMLMuSelectItemElement['checkbox'] = this.multiple ? 'before' : undefined;

  /**
   * A `string` indicates the key to switch to the next item.
   * @default 'ArrowDown'
   */
  @Prop({ reflect: true }) nextItemSwitchKey = 'ArrowDown';

  /**
   * A `string` indicates the key to switch to the previous item.
   * @default 'ArrowUp'
   */
  @Prop({ reflect: true }) prevItemSwitchKey = 'ArrowUp';

  /**
   * A `boolean` indicates if the select items should be disabled.
   * @default false
   */
  @Prop({ reflect: true }) disabled = false;

  @State() opened = false;
  @Watch('opened') onOpenedChange() {
    if (this.opened) {
      this.addListeners();
    } else {
      this.removeCurrentActiveItem();
      this.removeListeners();
    }
  }

  addListeners() {
    document.addEventListener('keydown', this.onKeydown);
    this.host.addEventListener('click', this.onClick);
    this.host.addEventListener('mouseover', this.onMouseOver);
  }
  removeListeners() {
    document.removeEventListener('keydown', this.onKeydown);
    this.host.removeEventListener('click', this.onClick);
    this.host.removeEventListener('mouseover', this.onMouseOver);
  }

  /**
   * Modifies the selection state of a specified item.
   * @param type Specifies the operation to perform:
   *
   * `'add'` - Adds the item to the selection.
   *
   * `'add-only'` - Clears previous selections and adds the item.
   *
   * `'remove'` - Removes the item from the selection.
   *
   * `'toggle'` - Toggles the item's selection state.
   *
   * @param item The item to be modified in the selection process.
   *
   * Upon completion, a 'muSelectItemsValueChange' event is dispatched.
   */
  changeSelectState(type: 'add' | 'add-only' | 'remove' | 'toggle', item: Item) {
    let operation = type;
    if (operation === 'toggle') {
      operation = this.selectedItems.includes(item) ? 'remove' : 'add';
    }
    switch (operation) {
      case 'add':
      case 'add-only':
        if (!this.multiple || operation === 'add-only') {
          for (const selectedItem of this.selectedItems) {
            selectedItem.element.selected = false;
          }
          this.selectedItems = [];
        }
        this.selectedItems.push(item);
        item.element.selected = true;
        break;
      case 'remove':
        this.selectedItems = this.selectedItems.filter(selectedItem => selectedItem !== item);
        item.element.selected = false;
        break;
      default:
        operation satisfies never;
        break;
    }

    this.getSelectedValues().then(selectedValues => {
      this.muSelectItemsValueChange.emit({ values: selectedValues });
    });
  }

  onClick = (e: MouseEvent) => {
    if (this.disabled) return;
    const item = this.getMuSelectItemFromEvent(e);
    if (item) this.changeSelectState('toggle', item);
  };

  onMouseOver = (e: MouseEvent) => {
    if (this.disabled) return;
    const element = this.getMuSelectItemFromEvent(e);
    this.addActiveItemState(element);
  };

  @Listen('muTrigger') onMuTrigger(e: MuTriggerEvent) {
    switch (e.detail.type) {
      case 'open':
        this.opened = true;
        break;
      case 'close':
        this.opened = false;
        break;
      case 'toggle':
        this.opened = !this.opened;
      default:
        break;
    }
  }

  /**
   * Selects the next item of the last selected item, if available.
   * If no item is selected, selects the first item in the list.
   */
  @Method() async selectNextItemOnly() {
    const lastSelectedItem = this.selectedItems[this.selectedItems.length - 1];
    if (!lastSelectedItem) return this.changeSelectState('add-only', this.items[0]);

    const isLastItem = lastSelectedItem.index === this.items.length - 1;
    if (isLastItem) return;

    const nextItem = this.items[lastSelectedItem.index + 1];
    this.changeSelectState('add-only', nextItem);
  }

  /**
   * Selects the previous item of the last selected item, if available.
   * If no item is selected, selects the last item in the list.
   */
  @Method() async selectPrevItemOnly() {
    const lastSelectedItem = this.selectedItems[this.selectedItems.length - 1];
    if (!lastSelectedItem) return this.changeSelectState('add-only', this.items[this.items.length - 1]);

    const isFirstItem = lastSelectedItem.index === 0;
    if (isFirstItem) return;

    const prevItem = this.items[lastSelectedItem.index - 1];
    this.changeSelectState('add-only', prevItem);
  }

  /**
   * Switches to the next or previous item.
   * @returns `true` if the active item has changed.
   */
  switchActiveItem(direction: 'next' | 'prev', options?: SwitchActiveItemOptions) {
    const { switchBack = true, addActiveStateOptions } = options ?? {};
    const activeIndex = this.activeItem?.index;
    let newActiveItem;

    if (activeIndex !== undefined) {
      newActiveItem = direction === 'next' ? this.items[activeIndex + 1] : this.items[activeIndex - 1];
    } else if (switchBack) {
      newActiveItem = direction === 'next' ? this.items[0] : this.items[this.items.length - 1];
    }

    return this.addActiveItemState(newActiveItem, addActiveStateOptions);
  }

  onKeydown = (e: KeyboardEvent) => {
    if (this.disabled) return;
    switch (e.key) {
      case 'Tab':
        this.switchActiveItem(e.shiftKey ? 'prev' : 'next', { switchBack: false, addActiveStateOptions: { focus: true } }) && e.preventDefault();
        break;
      case this.nextItemSwitchKey:
        this.switchActiveItem('next') && e.preventDefault();
        break;

      case this.prevItemSwitchKey:
        this.switchActiveItem('prev') && e.preventDefault();
        break;

      case 'Enter':
      case ' ':
        if (this.activeItem) {
          e.preventDefault();
          this.changeSelectState('toggle', this.activeItem);
        }
        break;
      default:
        break;
    }
  };

  /**
   * Sets the given element as the active item and optionally focuses or scrolls to it.
   *
   * If there is an existing active element, it will be blurred and deactivated.
   *
   * @param element The element to be set as active. If null or undefined, the function returns immediately.
   * @param options Optional settings to specify focus and scroll behavior.
   *                - `focus` (default: false): If true, the active element will receive focus without scrolling.
   *                - `scroll` (default: true): If true, the active element will be scrolled into view smoothly.
   *
   * @returns `true` if the active element has changed, otherwise `undefined`.
   */
  addActiveItemState(item: Item | null | undefined, options?: AddActiveStateOptions) {
    if (!item || item === this.activeItem) return;

    (this.host.ownerDocument.activeElement as HTMLElement | null)?.blur();

    const { focus = false, scroll = true } = options ?? {};

    this.removeCurrentActiveItem();
    item.element.active = true;
    this.activeItem = item;

    scroll && item.element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    focus && item.element.focus({ preventScroll: true });

    return true;
  }

  removeCurrentActiveItem() {
    if (this.activeItem) {
      this.activeItem.element.blur();
      this.activeItem.element.active = false;
      this.activeItem = undefined;
    }
  }

  getMuSelectItemFromEvent(e: Event) {
    const item = e.target instanceof HTMLElement ? e.target.closest('mu-select-item') : undefined;
    if (item) return this.itemsElementsMap.get(item);
  }

  handleItemsSlotChange() {
    this.activeItem = undefined;
    this.selectedItems = [];
    this.items = [];
    this.itemsElementsMap.clear();

    this.host.querySelectorAll('mu-select-item').forEach((element, index) => {
      const item = { element, index };
      this.items.push(item);
      this.itemsElementsMap.set(element, item);
      element.checkbox = this.checkbox;
      if (element.selected) this.changeSelectState('add', item);
      if (element.active) this.addActiveItemState(item);
    });
  }

  render() {
    return (
      <Host opened={this.opened}>
        <slot onSlotchange={this.handleItemsSlotChange.bind(this)}></slot>
      </Host>
    );
  }
}
