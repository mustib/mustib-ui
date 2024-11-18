import { AppError } from '@mustib/utils';
import { Component, Host, h, Prop, Element } from '@stencil/core';

function CheckBox() {
  return (
    <span class={'checkbox'}>
      <span class="check-mark"></span>
    </span>
  );
}

@Component({
  tag: 'mu-select-item',
  styleUrl: 'mu-select-item.scss',
  shadow: true,
})
export class MuSelectItem {
  componentWillLoad() {
    if (this.selected) {
      AppError.throw('Unsupported', 'selected must not be set directly by user for mu-select-item, use defaultSelected instead');
    }

    if (this.defaultSelected) this.selected = true;
  }

  componentDidLoad() {
    if (!this.value) {
      console.warn('value is required for mu-select-item', this.host);
    }
  }

  @Element() host: HTMLMuSelectItemElement;
  @Prop({ reflect: true }) value!: string;
  @Prop({ reflect: true }) checkbox?: 'before' | 'after' | '';
  @Prop({ reflect: true }) active = false;

  /**
   * for `internal` usage only, `Must` not be set by user.
   *
   * use `defaultSelected` instead
   */
  @Prop({ reflect: true }) selected = false;

  @Prop() defaultSelected = false;

  render() {
    return (
      <Host tabindex="0">
        {(this.checkbox === '' || this.checkbox === 'before') && <CheckBox />}

        <slot>{this.value}</slot>

        {this.checkbox === 'after' && <CheckBox />}
      </Host>
    );
  }
}
