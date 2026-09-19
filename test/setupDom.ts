import { JSDOM } from 'jsdom';

export function setupTestEnvironment() {
  const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
    url: 'http://localhost:3000',
  });

  globalThis.window = dom.window as any;
  globalThis.document = dom.window.document;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.HTMLButtonElement = dom.window.HTMLButtonElement;
  globalThis.localStorage = dom.window.localStorage;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;

  // Mock SpeechSynthesis
  if (!('speechSynthesis' in globalThis.window)) {
    (globalThis.window as any).speechSynthesis = {
      speak: () => {},
      cancel: () => {},
    };
  }

  return {
    dom,
    container: dom.window.document.getElementById('root')!,
  };
}
