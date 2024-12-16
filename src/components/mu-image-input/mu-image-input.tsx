import { Component, Event, Host, Method, Prop, State, h, type EventEmitter } from '@stencil/core';

@Component({
  tag: 'mu-image-input',
  styleUrl: 'mu-image-input.scss',
  shadow: true,
})
export class MuImageInput {
  async componentWillLoad() {
    if (this.fetchSrc) {
      try {
        const res = await fetch(this.fetchSrc, { mode: 'cors' });
        const blob = await res.blob();
        this.handleImageChange(new File([blob], `fetched-image.${blob.type.split('/').pop()}`, { type: blob.type }), 'fetch');
      } catch (error) {
        throw new (Error as any)(`failed to fetch image from (${this.fetchSrc})`, { cause: error });
      }
    }
  }

  @Prop() accept = 'image/*';
  @Prop() fetchSrc = '';
  @State() thumbnail = '';
  @State() isEmpty = true;
  inputRef: HTMLInputElement | undefined;

  @Method() async clear() {
    URL.revokeObjectURL(this.thumbnail);
    this.thumbnail = '';
    if (this.inputRef) this.inputRef.value = '';
    this.imageChange.emit({ image: null, type: 'clear' });
    this.isEmpty = true;
  }

  handleImageChange(image: File | undefined | null, type: 'input' | 'fetch' | 'clear') {
    if (image && image.type.startsWith('image/')) {
      this.thumbnail = URL.createObjectURL(image);
      this.imageChange.emit({ image, type });
      this.isEmpty = false;
    } else {
      this.clear();
    }
  }

  @Event() imageChange: EventEmitter<{ image: File | null; type: 'input' | 'fetch' | 'clear' }>;

  render() {
    const { thumbnail, isEmpty } = this;
    return (
      <Host empty={isEmpty}>
        <div class={'buttons'} part="buttons">
          <button class={'upload'}>
            <label>
              <input
                ref={el => (this.inputRef = el as HTMLInputElement)}
                onChange={e => {
                  const input = e.currentTarget as HTMLInputElement;
                  const { files } = input;
                  this.handleImageChange(files?.[0], 'input');
                }}
                hidden
                type="file"
                accept={this.accept}
              />
              <slot name="upload">
                <span class={'defaultContent'}>Upload</span>
              </slot>
            </label>
          </button>
          <button class={'clear'} disabled={isEmpty} onClick={() => this.clear()}>
            <slot name="clear">
              <span class={'defaultContent'}>clear</span>
            </slot>
          </button>
        </div>
        <img onError={_ => (this.isEmpty = true)} onLoad={_ => (this.isEmpty = false)} class="image" src={thumbnail} />
      </Host>
    );
  }
}
