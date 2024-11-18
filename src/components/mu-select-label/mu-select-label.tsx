import { Component, Host, Prop, h } from '@stencil/core';

@Component({
  tag: 'mu-select-label',
  styleUrl: 'mu-select-label.scss',
  shadow: true,
})
export class MuSelectLabel {
  /**
   * **Must** not be defined by the user, it is set by the `mu-select` component.
   */
  @Prop({ reflect: true }) opened = false;

  /**
   * @default 'Please Select Value:'
   */
  @Prop({ reflect: true }) label = 'Please Select Value:';

  /**
   * The selected value.
   *
   * **Must** not be defined by the user, it is set by the `mu-select` component.
   */
  @Prop({ reflect: true }) value: string;

  render() {
    const label = this.value || this.label;
    return (
      <Host title={label} opened={this.opened}>
        <mu-trigger class="container">
          <span part="mu-select-label" class="label">
            {label}
          </span>

          <slot name="arrow">
            <span class={'default-arrow'}>▼</span>
          </slot>
        </mu-trigger>
      </Host>
    );
  }
}
