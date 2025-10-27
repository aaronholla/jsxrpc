/**
 * Copyright (c) Nicolas Gallagher.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
// Modified to make sure css is always injected after all other head style elements. Also removed the option to pass in a shadow root (always uses document).

const canUseDOM: boolean = !!(
  typeof window !== "undefined" &&
  window.document &&
  window.document.createElement
);

export default function createCSSStyleSheet(id: string, textContent?: string) {
  if (canUseDOM) {
    let element = document.getElementById(id);
    if (element == null) {
      element = document.createElement("style");
      element.setAttribute("id", id);
      if (typeof textContent === "string") {
        element.appendChild(document.createTextNode(textContent));
      }

      const head = document.head;
      if (head) {
        head.appendChild(element);
      }
    }
    return textContent;
  } else {
    return null;
  }
}
