import { Quill } from 'react-quill';

const EmbedBlot = Quill.import('blots/block/embed');
const ATTRIBUTES = ['alt', 'height', 'width'];

class ImageAsset extends EmbedBlot {
  static blotName = 'imageAsset';

  static tagName = 'IMG';

  static create(value: string) {
    const node = super.create(value) as Element;
    if (typeof value === 'string') {
      node.setAttribute('src', this.sanitize(value));
    }
    return node;
  }

  static formats(domNode: Element) {
    return ATTRIBUTES.reduce(
      (formats: Record<string, string | null>, attribute) => {
        if (domNode.hasAttribute(attribute)) {
          formats[attribute] = domNode.getAttribute(attribute);
        }
        return formats;
      },
      {},
    );
  }

  static match(url: string) {
    return /\.(jpe?g|gif|png)$/.test(url) || /^data:image\/.+;base64/.test(url);
  }

  static register() {
    if (/Firefox/i.test(navigator.userAgent)) {
      setTimeout(() => {
        // Disable image resizing in Firefox
        // @ts-expect-error
        document.execCommand('enableObjectResizing', false, false);
      }, 1);
    }
  }

  static sanitize(url: string) {
    return url.startsWith('nn-asset:') ||
      sanitize(url, ['http', 'https', 'data'])
      ? url
      : '//:0';
  }

  static value(domNode: Element) {
    return domNode.getAttribute('src');
  }

  domNode: HTMLImageElement;

  format(name: string, value: string) {
    if (ATTRIBUTES.indexOf(name) > -1) {
      if (value) {
        this.domNode.setAttribute(name, value);
      } else {
        this.domNode.removeAttribute(name);
      }
    } else {
      super.format(name, value);
    }
  }
}

function sanitize(url: string, protocols: string[]) {
  const anchor = document.createElement('a');
  anchor.href = url;
  const protocol = anchor.href.slice(0, anchor.href.indexOf(':'));
  return protocols.indexOf(protocol) > -1;
}

export default ImageAsset;
