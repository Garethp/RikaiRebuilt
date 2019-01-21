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

declare function docOffsetCalc(element: HTMLElement): { top: number, left: number };

declare function docImposterCreate(element: HTMLElement): HTMLElement;

declare function docImposterDestroy(): void;

declare function docRangeFromPoint(point: { x: number, y: number }): TextSourceRange;

declare function docSentenceExtract(source, extent): { text: string, offset: number};