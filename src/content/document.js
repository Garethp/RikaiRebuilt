/*
 * Copyright (C) 2016-2017  Alex Yatskov <alex@foosoft.net>
 * Author: Alex Yatskov <alex@foosoft.net>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import {TextSourceElement, TextSourceRange} from './source';

const REGEX_TRANSPARENT_COLOR = /rgba\s*\([^\)]*,\s*0(?:\.0+)?\s*\)/;

function docSetImposterStyle(style, propertyName, value) {
    style.setProperty(propertyName, value, 'important');
}

function docImposterCreate(element, isTextarea) {
    const elementStyle = window.getComputedStyle(element);
    const elementRect = element.getBoundingClientRect();
    const documentRect = document.documentElement.getBoundingClientRect();
    const left = elementRect.left - documentRect.left;
    const top = elementRect.top - documentRect.top;

    // Container
    const container = document.createElement('div');
    container.className = 'yomichan-imposter';
    const containerStyle = container.style;
    docSetImposterStyle(containerStyle, 'all', 'initial');
    docSetImposterStyle(containerStyle, 'position', 'absolute');
    docSetImposterStyle(containerStyle, 'left', '0');
    docSetImposterStyle(containerStyle, 'top', '0');
    docSetImposterStyle(containerStyle, 'width', `${documentRect.width}px`);
    docSetImposterStyle(containerStyle, 'height', `${documentRect.height}px`);
    docSetImposterStyle(containerStyle, 'overflow', 'hidden');
    docSetImposterStyle(containerStyle, 'opacity', '0');

    docSetImposterStyle(containerStyle, 'pointer-events', 'none');
    docSetImposterStyle(containerStyle, 'z-index', '2147483646');

    // Imposter
    const imposter = document.createElement('div');
    const imposterStyle = imposter.style;

    imposter.innerText = element.value;

    for (let i = 0, ii = elementStyle.length; i < ii; ++i) {
        const property = elementStyle[i];
        docSetImposterStyle(imposterStyle, property, elementStyle.getPropertyValue(property));
    }
    docSetImposterStyle(imposterStyle, 'position', 'absolute');
    docSetImposterStyle(imposterStyle, 'top', `${top}px`);
    docSetImposterStyle(imposterStyle, 'left', `${left}px`);
    docSetImposterStyle(imposterStyle, 'margin', '0');
    docSetImposterStyle(imposterStyle, 'pointer-events', 'auto');

    if (isTextarea) {
        if (elementStyle.overflow === 'visible') {
            docSetImposterStyle(imposterStyle, 'overflow', 'auto');
        }
    } else {
        docSetImposterStyle(imposterStyle, 'overflow', 'hidden');
        docSetImposterStyle(imposterStyle, 'white-space', 'nowrap');
        docSetImposterStyle(imposterStyle, 'line-height', elementStyle.height);
    }

    container.appendChild(imposter);
    document.body.appendChild(container);

    // Adjust size
    const imposterRect = imposter.getBoundingClientRect();
    if (imposterRect.width !== elementRect.width || imposterRect.height !== elementRect.height) {
        const width = parseFloat(elementStyle.width) + (elementRect.width - imposterRect.width);
        const height = parseFloat(elementStyle.height) + (elementRect.height - imposterRect.height);
        docSetImposterStyle(imposterStyle, 'width', `${width}px`);
        docSetImposterStyle(imposterStyle, 'height', `${height}px`);
    }

    imposter.scrollTop = element.scrollTop;
    imposter.scrollLeft = element.scrollLeft;

    return [imposter, container];
}

export function docImposterDestroy() {
    for (const element of document.getElementsByClassName('yomichan-imposter')) {
        element.parentNode.removeChild(element);
    }
}

export function docRangeFromPoint({x, y}, deepDomScan) {
    const elements = document.elementsFromPoint(x, y);
    let imposter = null;
    let imposterContainer = null;
    if (elements.length > 0) {
        const element = elements[0];
        switch (element.nodeName) {
            case 'IMG':
            case 'BUTTON':
                return new TextSourceElement(element);
            case 'INPUT':
                [imposter, imposterContainer] = docImposterCreate(element, false);
                break;
            case 'TEXTAREA':
                [imposter, imposterContainer] = docImposterCreate(element, true);
                break;
        }
    }

    const range = caretRangeFromPointExt(x, y, deepDomScan ? elements : []);
    if (range !== null) {
        if (imposter !== null) {
            docSetImposterStyle(imposterContainer.style, 'z-index', '-2147483646');
            docSetImposterStyle(imposter.style, 'pointer-events', 'none');
        }
        return new TextSourceRange(range, '', imposterContainer);
    } else {
        if (imposterContainer !== null) {
            imposterContainer.parentNode.removeChild(imposterContainer);
        }
        return null;
    }
}

function docSentenceExtract(source, extent) {
    const quotesFwd = {'「': '」', '『': '』', "'": "'", '"': '"'};
    const quotesBwd = {'」': '「', '』': '『', "'": "'", '"': '"'};
    const terminators = '…。．.？?！!';

    const sourceLocal = source.clone();
    const position = sourceLocal.setStartOffset(extent);
    sourceLocal.setEndOffset(position + extent);
    const content = sourceLocal.text();

    let quoteStack = [];

    let startPos = 0;
    for (let i = position; i >= startPos; --i) {
        const c = content[i];

        if (c === '\n') {
            startPos = i + 1;
            break;
        }

        if (quoteStack.length === 0 && (terminators.includes(c) || c in quotesFwd)) {
            startPos = i + 1;
            break;
        }

        if (quoteStack.length > 0 && c === quoteStack[0]) {
            quoteStack.pop();
        } else if (c in quotesBwd) {
            quoteStack.unshift(quotesBwd[c]);
        }
    }

    quoteStack = [];

    let endPos = content.length;
    for (let i = position; i <= endPos; ++i) {
        const c = content[i];

        if (c === '\n') {
            endPos = i + 1;
            break;
        }

        if (quoteStack.length === 0) {
            if (terminators.includes(c)) {
                endPos = i + 1;
                break;
            }
            else if (c in quotesBwd) {
                endPos = i;
                break;
            }
        }

        if (quoteStack.length > 0 && c === quoteStack[0]) {
            quoteStack.pop();
        } else if (c in quotesFwd) {
            quoteStack.unshift(quotesFwd[c]);
        }
    }

    const text = content.substring(startPos, endPos);
    const padding = text.length - text.replace(/^\s+/, '').length;

    return {
        text: text.trim(),
        offset: position - startPos - padding
    };
}

function isPointInRange(x, y, range) {
    // Require a text node to start
    if (range.startContainer.nodeType !== Node.TEXT_NODE) {
        return false;
    }

    // Scan forward
    const nodePre = range.endContainer;
    const offsetPre = range.endOffset;
    try {
        const {node, offset, content} = TextSourceRange.seekForward(range.endContainer, range.endOffset, 1);
        range.setEnd(node, offset);

        if (!isWhitespace(content) && isPointInAnyRect(x, y, range.getClientRects())) {
            return true;
        }
    } finally {
        range.setEnd(nodePre, offsetPre);
    }

    // Scan backward
    const {node, offset, content} = TextSourceRange.seekBackward(range.startContainer, range.startOffset, 1);
    range.setStart(node, offset);

    if (!isWhitespace(content) && isPointInAnyRect(x, y, range.getClientRects())) {
        // This purposefully leaves the starting offset as modified and sets the range length to 0.
        range.setEnd(node, offset);
        return true;
    }

    // No match
    return false;
}

function isWhitespace(string) {
    return string.trim().length === 0;
}

function isPointInAnyRect(x, y, rects) {
    for (const rect of rects) {
        if (isPointInRect(x, y, rect)) {
            return true;
        }
    }
    return false;
}

function isPointInRect(x, y, rect) {
    return (
      x >= rect.left && x < rect.right &&
      y >= rect.top && y < rect.bottom);
}

const caretRangeFromPoint = (() => {
    if (typeof document.caretRangeFromPoint === 'function') {
        // Chrome, Edge
        return (x, y) => document.caretRangeFromPoint(x, y);
    }

    if (typeof document.caretPositionFromPoint === 'function') {
        // Firefox
        return (x, y) => {
            const position = document.caretPositionFromPoint(x, y);
            const node = position.offsetNode;
            if (node === null) {
                return null;
            }

            const range = document.createRange();
            const offset = (node.nodeType === Node.TEXT_NODE ? position.offset : 0);
            range.setStart(node, offset);
            range.setEnd(node, offset);
            return range;
        };
    }

    // No support
    return () => null;
})();

function caretRangeFromPointExt(x, y, elements) {
    const modifications = [];
    try {
        let i = 0;
        let startContinerPre = null;
        while (true) {
            const range = caretRangeFromPoint(x, y);
            if (range === null) {
                return null;
            }

            const startContainer = range.startContainer;
            if (startContinerPre !== startContainer) {
                if (isPointInRange(x, y, range)) {
                    return range;
                }
                startContinerPre = startContainer;
            }

            i = disableTransparentElement(elements, i, modifications);
            if (i < 0) {
                return null;
            }
        }
    } finally {
        if (modifications.length > 0) {
            restoreElementStyleModifications(modifications);
        }
    }
}

function disableTransparentElement(elements, i, modifications) {
    while (true) {
        if (i >= elements.length) {
            return -1;
        }

        const element = elements[i++];
        if (isElementTransparent(element)) {
            const style = element.hasAttribute('style') ? element.getAttribute('style') : null;
            modifications.push({element, style});
            element.style.pointerEvents = 'none';
            return i;
        }
    }
}

function restoreElementStyleModifications(modifications) {
    for (const {element, style} of modifications) {
        if (style === null) {
            element.removeAttribute('style');
        } else {
            element.setAttribute('style', style);
        }
    }
}

function isElementTransparent(element) {
    if (
      element === document.body ||
      element === document.documentElement
    ) {
        return false;
    }
    const style = window.getComputedStyle(element);
    return (
      parseFloat(style.opacity) < 0 ||
      style.visibility === 'hidden' ||
      (style.backgroundImage === 'none' && isColorTransparent(style.backgroundColor))
    );
}

function isColorTransparent(cssColor) {
    return REGEX_TRANSPARENT_COLOR.test(cssColor);
}
