import { docImposterDestroy, docRangeFromPoint } from "./document";
import { transformNameEntriesToHtml } from "./entryTransformers";
import autobind from "../../lib/autobind";
import defaultConfig, { Config } from "../defaultConfig";
import Utils from "../Utils";
import "../../styles/popup.css";
import { TextSourceRange } from "./source";
import {
  isDictionaryResult,
  isKanjiResult,
  SearchResults,
} from "../interfaces/SearchResults";

type position = {
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
};

type tabData = {
  selText?: string;
  previousRangeOffset?: number;
  pos?: position;
  previousTarget?: HTMLElement;
  previousTextSource?: TextSourceRange;
};

class Rikai {
  private document: Document;
  private tabData: tabData = {};
  private lastFound: SearchResults;
  private enabled: boolean = false;
  private popupId: string = "rikaichan-window";
  private config: Config;
  private keysDown: any[] = [];

  private epwingMode: boolean = false;
  private epwingTotalHits: number = 0;
  private epwingCurrentHit: number = 0;
  private epwingPreviousHit: number = 0;
  private epwingResults: any[] = [];

  private sanseidoFallback: number = 0;
  private sanseidoMode: boolean = false;
  private abortController: AbortController = new AbortController();

  private selectedEntry: number = 0;
  private totalEntries: number = 1;
  private word: string;
  private sentence: string;
  private sentenceWithBlank: string;

  private lastPopupPosition: { left: number; top: number };

  constructor(document: Document) {
    autobind(this);

    this.document = document;
    this.config = defaultConfig;
  }

  enable(): void {
    if (this.enabled) return;

    browser.storage.sync
      .get("config")
      .then((config: Storage & { config: Config }) => {
        this.config = config.config || defaultConfig;
        this.document.documentElement.removeChild(this.getPopup());
      });

    this.document.addEventListener("mousemove", this.onMouseMove);
    this.document.addEventListener("mousedown", this.onMouseDown);
    this.document.addEventListener("keydown", (event: KeyboardEvent) => {
      const shouldStop = this.onKeyDown(event);
      if (shouldStop === true) {
        event.stopPropagation();
        event.preventDefault();
      }
    });
    this.document.addEventListener("keyup", this.onKeyUp);

    browser.storage.onChanged.addListener((changes, areaSet) => {
      if (areaSet !== "sync") return;
      if (typeof changes.config === "undefined") return;

      this.config = changes.config.newValue || defaultConfig;
      this.document.documentElement.removeChild(this.getPopup());
    });

    this.createPopup();

    this.enabled = true;
  }

  disable(): void {
    this.document.removeEventListener("mousemove", this.onMouseMove);
    this.document.removeEventListener("mousedown", this.onMouseDown);
    this.document.removeEventListener("keydown", (event: KeyboardEvent) => {
      const shouldStop = this.onKeyDown(event);
      if (shouldStop === true) {
        event.stopPropagation();
        event.preventDefault();
      }
    });

    this.document.removeEventListener("keyup", this.onKeyUp);

    if (this.hasPopup()) {
      this.document.documentElement.removeChild(this.getPopup());
    }

    this.enabled = false;
  }

  onKeyDown(event: KeyboardEvent): boolean {
    if (event.altKey || event.metaKey || event.ctrlKey) return;
    if (event.shiftKey && event.keyCode !== 16) return;
    if (this.keysDown[event.keyCode]) return;
    if (!this.isVisible()) return;

    const { pos } = this.tabData;

    this.keysDown[event.keyCode] = 1;

    switch (event.keyCode) {
      case this.config.keymap.playAudio:
        return this.playAudio();
      case this.config.keymap.sendToAnki:
        return this.sendToAnki();
      case this.config.keymap.selectNextDictionary:
        this.sendRequest("selectNextDictionary").then(() => {
          setTimeout(() => {
            this.searchAt({ x: pos.clientX, y: pos.clientY }, this.tabData);
          }, 1);
        });
        return;
      case this.config.keymap.toggleSanseidoMode:
        browser.storage.local.set({ sanseidoMode: !this.sanseidoMode });
        setTimeout(() => {
          this.searchAt({ x: pos.clientX, y: pos.clientY }, this.tabData);
        }, 5);
        return true;

      case this.config.keymap.toggleEpwingMode:
        const originalEpwing = this.epwingMode;
        browser.storage.local.set({ epwingMode: !this.epwingMode });
        setTimeout(() => {
          if (this.epwingMode !== originalEpwing) {
            this.searchAt({ x: pos.clientX, y: pos.clientY }, this.tabData);
          }
        }, 5);
        return true;

      case this.config.keymap.epwingNextEntry:
        return this.showNextEpwingEntry();
      case this.config.keymap.epwingPreviousEntry:
        return this.showPreviousEpwingEntry();

      case this.config.keymap.nextDefinition:
        this.selectedEntry++;
        if (this.selectedEntry + 1 > this.totalEntries) {
          this.selectedEntry = 0;
        }

        this.renderPopup();
        return true;

      case this.config.keymap.previousDefinition:
        this.selectedEntry--;
        if (this.selectedEntry < 0) {
          this.selectedEntry = this.totalEntries - 1;
        }

        this.renderPopup();
        return true;
    }

    return false;
  }

  onKeyUp(event: KeyboardEvent) {
    if (this.keysDown[event.keyCode]) this.keysDown[event.keyCode] = 0;
  }

  onMouseDown(): void {
    this.clear();
  }

  async onMouseMove(event: MouseEvent) {
    const tabData = this.tabData;

    if (event.buttons !== 0) return;

    let distance = null;
    if (tabData.pos) {
      const distanceX = tabData.pos.clientX - event.clientX;
      const distanceY = tabData.pos.clientY - event.clientY;
      distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    }

    if (event.target === tabData.previousTarget && distance && distance <= 4) {
      return;
    }

    tabData.previousTarget = <HTMLElement>event.target;
    tabData.pos = {
      clientX: event.clientX,
      clientY: event.clientY,
      pageX: event.pageX,
      pageY: event.pageY,
    };

    return setTimeout(() => {
      this.searchAt({ x: event.clientX, y: event.clientY }, tabData, event);
    }, 1);
  }

  async searchAt(
    point: { x: number; y: number },
    tabData: tabData,
    event?: MouseEvent
  ) {
    const textSource = docRangeFromPoint(point);

    if (
      !textSource ||
      !textSource.range ||
      typeof textSource.range.startContainer.textContent === "undefined"
    ) {
      this.clear();
      return;
    }

    if (
      event &&
      event.target === tabData.previousTarget &&
      textSource.equals(tabData.previousTextSource)
    ) {
      return;
    }

    let charCode = textSource.range.startContainer.textContent.charCodeAt(
      textSource.range.startOffset
    );
    if (
      isNaN(charCode) ||
      (charCode !== 0x25cb &&
        (charCode < 0x3001 || charCode > 0x30ff) &&
        (charCode < 0x3400 || charCode > 0x9fff) &&
        (charCode < 0xf900 || charCode > 0xfaff) &&
        (charCode < 0xff10 || charCode > 0xff9d))
    ) {
      this.clear();
      return -2;
    }

    tabData.previousRangeOffset = textSource.range.startOffset;

    tabData.previousTextSource = textSource;

    const textClone = textSource.clone();
    const sentenceClone = textSource.clone();

    textClone.setEndOffset(20);
    const text = textClone.text();

    sentenceClone.setEndOffsetFromBeginningOfCurrentNode(
      textSource.range.startContainer.textContent.length + 50
    );
    const sentence = sentenceClone.text();

    this.showFromText(
      text,
      sentence,
      textSource.range.startOffset,
      () => {
        textClone.setEndOffset(this.word.length);

        const currentSelection = document.defaultView.getSelection();
        if (
          currentSelection.toString() !== "" &&
          currentSelection.toString() !== tabData.selText
        ) {
          return;
        }
        textClone.select();
        tabData.selText = textClone.text();
      },
      tabData
    );
  }

  getSentenceStuff(
    rangeOffset: number,
    sentence: string
  ): { sentence: string; sentenceStartPos: number; startOffset: number } {
    let i = rangeOffset;

    let sentenceStartPos;
    let sentenceEndPos;

    // Find the last character of the sentence
    while (i < sentence.length) {
      if (
        sentence[i] === "。" ||
        sentence[i] === "\n" ||
        sentence[i] === "？" ||
        sentence[i] === "！"
      ) {
        sentenceEndPos = i;
        break;
      } else if (i === sentence.length - 1) {
        sentenceEndPos = i;
      }

      i++;
    }

    i = rangeOffset;

    // Find the first character of the sentence
    while (i >= 0) {
      if (
        sentence[i] === "。" ||
        sentence[i] === "\n" ||
        sentence[i] === "？" ||
        sentence[i] === "！"
      ) {
        sentenceStartPos = i + 1;
        break;
      } else if (i === 0) {
        sentenceStartPos = i;
      }

      i--;
    }

    // Extract the sentence
    sentence = sentence.substring(sentenceStartPos, sentenceEndPos + 1);

    let startingWhitespaceMatch = sentence.match(/^\s+/);

    // Strip out control characters
    sentence = sentence.replace(/[\n\r\t]/g, "");

    let startOffset = 0;

    // Adjust offset of selected word according to the number of
    // whitespace chars at the beginning of the sentence
    if (startingWhitespaceMatch) {
      startOffset -= startingWhitespaceMatch[0].length;
    }

    // Trim
    sentence = Rikai.trim(sentence);

    return { sentence, sentenceStartPos, startOffset };
  }

  async showFromText(
    text: string,
    sentence: string,
    rangeOffset: number,
    highlightFunction,
    tabData: tabData
  ): Promise<void> {
    const sentenceStuff = this.getSentenceStuff(rangeOffset, sentence);
    sentence = sentenceStuff.sentence;

    this.sentence = sentence;

    if (text.length === 0) {
      this.clear();
      return;
    }

    let entry = <SearchResults | null>(
      await this.sendRequest("wordSearch", text)
    );

    if (!entry) {
      this.clear();
      return;
    }

    if (!entry.matchLen) entry.matchLen = 1;
    this.lastFound = entry;
    this.selectedEntry = 0;
    if (isDictionaryResult(entry)) {
      this.totalEntries = entry.data.length;
    }

    this.word = text.substr(0, entry.matchLen);

    const wordPositionInString = rangeOffset - 1;
    this.sentenceWithBlank =
      sentence.substr(0, wordPositionInString) +
      "___" +
      sentence.substr(wordPositionInString + entry.matchLen, sentence.length);

    // @TODO: Add config check for "shouldHighlight"
    // const shouldHighlight = (!('form' in tabData.previousTarget));
    const shouldHighlight = true;
    if (shouldHighlight) {
      highlightFunction(entry);
    }

    // @TODO: Add audio playing
    // @TODO: Add checks for super sticky

    //Sanseido mode
    if (this.sanseidoMode) {
      this.sanseidoFallback = 0;
      return this.lookupSanseido();
    }

    if (this.epwingMode) {
      let epwingFound = await this.lookupEpwing();
      if (epwingFound === true) {
        return;
      }
    }

    this.showPopup(
      await this.makeHTML(entry),
      tabData.previousTarget,
      tabData.pos
    );
  }

  // Extract the first search term from the highlighted word.
  // Returns search term string or null on error.
  // forceGetReading - true = force this routine to return the reading of the word
  extractSearchTerm(forceGetReading: boolean = false): string {
    if (!this.lastFound) {
      return null;
    }

    // Get the currently hilited entry
    let highlightedEntry = this.lastFound;

    let searchTerm = "";

    // Get the search term to use
    if (isKanjiResult(highlightedEntry)) {
      // A single kanji was selected

      searchTerm = highlightedEntry.kanji;
    } else if (highlightedEntry && highlightedEntry.data[0]) {
      // An entire word was selected

      const entryData = highlightedEntry.data[0][0].match(
        /^(.+?)\s+(?:\[(.*?)\])?\s*\/(.+)\//
      );

      // Example of what data[0][0] looks like (linebreak added by me):
      //   乃 [の] /(prt,uk) indicates possessive/verb and adjective nominalizer (nominaliser)/substituting
      //   for "ga" in subordinate phrases/indicates a confident conclusion/emotional emphasis (sentence end) (fem)/(P)/
      //
      // Extract needed data from the hilited entry
      //   entryData[0] = kanji/kana + kana + definition
      //   entryData[1] = kanji (or kana if no kanji)
      //   entryData[2] = kana (null if no kanji)
      //   entryData[3] = definition

      if (forceGetReading) {
        if (entryData[2]) {
          searchTerm = entryData[2];
        } else {
          searchTerm = entryData[1];
        }
      } else {
        // If the highlighted word is kana, don't use the kanji.
        // Example1: if の is highlighted, use の rather than the kanji equivalent (乃)
        // Example2: if された is highlighted, use される rather then 為れる
        if (entryData[2] && !Utils.containsKanji(this.word)) {
          searchTerm = entryData[2];
        } else {
          searchTerm = entryData[1];
        }
      }
    } else {
      return null;
    }

    return searchTerm;
  }

  async lookupSanseido() {
    let searchTerm;
    const { tabData } = this;

    // Determine if we should use the kanji form or kana form when looking up the word
    if (this.sanseidoFallback === 0) {
      // Get this kanji form if it exists
      searchTerm = this.extractSearchTerm(false);
    } else if (this.sanseidoFallback === 1) {
      // Get the reading
      searchTerm = this.extractSearchTerm(true);
    }

    if (!searchTerm) {
      return;
    }

    // If the kanji form was requested but it returned the kana form anyway, then update the state
    if (this.sanseidoFallback === 0 && !Utils.containsKanji(searchTerm)) {
      this.sanseidoFallback = 1;
    }

    // Show the loading message to the screen while we fetch the entry page
    this.showPopup("Loading...", tabData.previousTarget, tabData.pos);

    this.abortController.abort();
    this.abortController = new AbortController();
    const { signal } = this.abortController;
    return fetch(
      `https://www.sanseido.biz/User/Dic/Index.aspx?TWords=${searchTerm}&st=0&DailyJJ=checkbox`,
      { signal }
    )
      .then((response) => response.text())
      .then((response) => this.parseAndDisplaySanseido(response));
  }

  enableEpwing(): void {
    if (!this.config.epwingDictionaries.length) {
      this.showPopup("No Epwing Dictionary Set");

      browser.storage.local.set({ epwingMode: false });
      return;
    }

    this.epwingTotalHits = 0;
    this.epwingCurrentHit = 0;
    this.epwingPreviousHit = 0;
    this.epwingResults = [];
  }

  async disableEpwing(): Promise<void> {
    this.epwingMode = false;
  }

  async lookupEpwing(): Promise<boolean> {
    const searchTerm = this.extractSearchTerm(false);

    if (!searchTerm) {
      return false;
    }

    let epwingText: string = await this.sendRequest(
      "getEpwingDefinition",
      searchTerm
    );

    if (epwingText === "No results found") {
      return false;
    }

    const entryFields = epwingText.split(/{ENTRY: \d+}\n/);
    let entryList = [];

    for (let i = 0; i < entryFields.length; ++i) {
      const curEntry = entryFields[i];

      if (curEntry.length > 0) {
        let isDuplicate = false;

        for (let j = 0; j < entryList.length; ++j) {
          if (curEntry === entryList[j]) {
            isDuplicate = true;
            break;
          }
        }

        if (!isDuplicate) {
          entryList.push(entryFields[i]);
        }

        // If user wants to limit number of entries, check to see if we have enough
        // if (rcxConfig.epwingshowallentries && (entryList.length >= rcxConfig.epwingmaxentries)) {
        //     break;
        // }
      }
    }

    this.epwingCurrentHit = 0;
    this.epwingPreviousHit = 0;
    this.epwingTotalHits = entryList.length;
    this.epwingResults = entryList;

    this.showEpwingDefinition();
    return true;
  }

  showNextEpwingEntry(): boolean {
    if (!this.epwingMode || this.epwingTotalHits < 2) {
      return false;
    }

    this.epwingCurrentHit++;
    if (this.epwingCurrentHit > this.epwingTotalHits - 1) {
      this.epwingCurrentHit = 0;
    }

    this.showEpwingDefinition();
    return true;
  }

  showPreviousEpwingEntry(): boolean {
    if (!this.epwingMode || this.epwingTotalHits < 2) {
      return false;
    }

    this.epwingCurrentHit--;
    if (this.epwingCurrentHit < 0) {
      this.epwingCurrentHit = this.epwingTotalHits - 1;
    }

    this.showEpwingDefinition();
    return false;
  }

  async showEpwingDefinition() {
    if (!isDictionaryResult(this.lastFound)) return;

    const { epwingCurrentHit, epwingResults, tabData } = this;

    const epwingDefinitionText = epwingResults[epwingCurrentHit];
    const entry = await this.formatEpwingEntry(
      epwingDefinitionText,
      true,
      true
    );

    this.lastFound.data[0][0] = this.lastFound.data[0][0].replace(
      /\/.+\//g,
      "/" + (await this.formatEpwingEntry(epwingDefinitionText)) + "/"
    );

    this.showPopup(entry, tabData.previousTarget, tabData.pos);
  }

  async formatEpwingEntry(
    entryText,
    showHeader?: boolean,
    showEntryNumber?: boolean
  ): Promise<string> {
    //TODO: Add removing user inputted regex
    //TODO: Add "Header" (Color, pitch and so on)
    if (showHeader) {
      //TODO: Add Frequency Information

      let entryNumber = "";
      if (showEntryNumber) {
        entryNumber = `(${this.epwingCurrentHit + 1} / ${
          this.epwingTotalHits
        })`;
      }

      //TODO: Add known word indicator
      //TODO: Add Showing Conjugation
      //TODO: Add showing dictionary title and number
      entryText = `${entryNumber}<br />${entryText}`;
    }

    //TODO: Add Max Lines

    //TODO: Add "epwingStripNewLines" config
    if (false) {
      entryText = entryText.replace(/\n/g, " ");
    } else {
      entryText = entryText.replace(/\n/g, "<br />");
    }

    return entryText;
  }

  async parseAndDisplaySanseido(response) {
    if (!isDictionaryResult(this.lastFound)) return;

    // Create DOM tree from entry page text
    // var domPars = rcxMain.htmlParser(entryPageText);
    const { tabData } = this;
    const parser = new DOMParser();
    const document = parser.parseFromString(response, "text/html");
    let domPars = document.body;

    // Get list of div elements
    const divList = domPars.getElementsByTagName("div");

    // Will be set if the entry page actually contains a definition
    let entryFound = false;

    // Find the div that contains the definition
    for (let divIdx = 0; divIdx < divList.length; divIdx++) {
      // Did we reach the div the contains the definition?
      if (divList[divIdx].className === "NetDicBody") {
        entryFound = true;

        // rcxDebug.echo("Raw definition: " + divList[divIdx].innerHTML);

        // Will contain the final parsed definition text
        let defText = "";

        // A list of all child nodes in the div
        const childList = divList[divIdx].childNodes;

        // Set when we need to end the parse
        let defFinished = false;

        // Extract the definition from the div's child nodes
        for (
          let nodeIdx = 0;
          nodeIdx < childList.length && !defFinished;
          nodeIdx++
        ) {
          // Is this a b element?
          if (childList[nodeIdx].nodeName.toLowerCase() === "b") {
            // How many child nodes does this b element have?
            if (childList[nodeIdx].childNodes.length === 1) {
              // Check for definition number: ［１］, ［２］, ... and add to def
              const defNum =
                childList[nodeIdx].childNodes[0].nodeValue.match(
                  /［([１２３４５６７８９０]+)］/
                );

              if (defNum) {
                defText += "<br />" + RegExp.$1;
              } else {
                // Check for sub-definition number: （１）, （２）, ... and add to def
                const subDefNum =
                  childList[nodeIdx].childNodes[0].nodeValue.match(
                    /（([１２３４５６７８９０]+)）/
                  );

                if (subDefNum) {
                  // Convert sub def number to circled number
                  defText += Utils.convertIntegerToCircledNumStr(
                    Utils.convertJapNumToInteger(RegExp.$1)
                  );
                }
              }
            } // This b element has more than one child node
            else {
              // Check the b children for any spans. A span marks the start
              // of non-definition portion, so end the parse.
              for (
                let bIdx = 0;
                bIdx < childList[nodeIdx].childNodes.length;
                bIdx++
              ) {
                if (
                  childList[nodeIdx].childNodes[bIdx].nodeName.toLowerCase() ===
                  "span"
                ) {
                  defFinished = true;
                }
              }
            }
          }

          // Have we finished parsing the text?
          if (defFinished) {
            break;
          }

          // If the current element is text, add it to the definition
          if (
            childList[nodeIdx].nodeName.toLowerCase() === "#text" &&
            Rikai.trim(childList[nodeIdx].nodeValue) !== ""
          ) {
            defText += childList[nodeIdx].nodeValue;
          }
        }

        // If the definition is blank (search ばかり for example), fallback
        if (defText.length === 0) {
          // Set to a state that will ensure fallback to default JMDICT popup
          this.sanseidoFallback = 1;
          entryFound = false;
          break;
        }

        var jdicCode = "";

        // Get the part-of-speech and other JDIC codes
        this.lastFound.data[0][0].match(/\/(\(.+?\) ).+\//);

        if (RegExp.$1) {
          jdicCode = RegExp.$1;
        }

        // Replace the definition with the one we parsed from sanseido
        this.lastFound.data[0][0] = this.lastFound.data[0][0].replace(
          /\/.+\//g,
          "/" + jdicCode + defText + "/"
        );

        // Remove all words except for the one we just looked up
        this.lastFound.data = [this.lastFound.data[0]];

        // Prevent the "..." from being displayed at the end of the popup text
        this.lastFound.more = false;

        // Show the definition
        this.showPopup(
          await this.makeHTML(this.lastFound),
          tabData.previousTarget,
          tabData.pos
        );

        // Entry found, stop looking
        break;
      }
    }

    // If the entry was not on sanseido, either try to lookup the kana form of the word
    // or display default JMDICT popup
    if (!entryFound) {
      this.sanseidoFallback++;

      if (this.sanseidoFallback < 2) {
        // Set a timer to lookup again using the kana form of the word instead
        window.setTimeout(() => {
          this.lookupSanseido();
        }, 10);
      } else {
        // Fallback to the default non-sanseido dictionary that comes with rikaichan (JMDICT)
        this.showPopup(
          await this.makeHTML(this.lastFound),
          tabData.previousTarget,
          tabData.pos
        );
      }
    }
  }

  static trim(text: string): string {
    return text.replace(/^\s\s*/, "").replace(/\s\s*$/, "");
  }

  clear(): void {
    this.abortController.abort();
    this.abortController = new AbortController();
    setTimeout(() => {
      docImposterDestroy();
    }, 500);
    this.clearPopup();
    this.clearHighlight();
  }

  clearPopup(): void {
    this.getPopup().style.display = "none";
  }

  clearHighlight(): void {
    const tabData = this.tabData;

    const selection = document.defaultView.getSelection();
    //Changed !selection.isCollapsed to selection.toString() !== '' because of Chrome issue with input text boxes
    if (
      selection &&
      selection.toString() !== "" &&
      tabData.selText !== selection.toString()
    ) {
      return;
    }

    if (tabData.previousTextSource) {
      tabData.previousTextSource.deselect();
      tabData.previousTextSource = null;
      return;
    }
  }

  async sendRequest(type: string, content: any = ""): Promise<any> {
    return browser.runtime.sendMessage({ type, content }).then((response) => {
      if (typeof response === "undefined") {
        this.showPopup(
          "If you have the options page for RikaiRebuilt, please close that. Word search" +
            " doesn't work properly when the options tab is open"
        );
        return -1;
      }

      return response.response;
    });
  }

  createPopup(): void {
    if (this.hasPopup()) return;

    const popup = this.document.createElementNS(
      "http://www.w3.org/1999/xhtml",
      "div"
    );
    popup.setAttribute("id", this.popupId);
    popup.setAttribute("style", "display: none;");
    popup.setAttribute("class", `rikai-${this.config.theme}`);
    document.documentElement.appendChild(popup);
  }

  getPopup(): HTMLElement {
    if (!this.hasPopup()) this.createPopup();

    return this.document.getElementById(this.popupId);
  }

  hasPopup(): HTMLElement {
    return this.document.getElementById(this.popupId);
  }

  async renderPopup() {
    return this.showPopup(
      await this.makeHTML(this.lastFound),
      this.tabData.previousTarget,
      this.tabData.pos,
      true
    );
  }

  showPopup(
    textToShow: string,
    previousTarget?: HTMLElement,
    position?: position,
    rerender = false
  ): void {
    let { pageX, pageY, clientX, clientY } = position || {
      pageX: 10,
      pageY: 10,
      clientX: 10,
      clientY: 10,
    };
    const popup = this.getPopup();

    popup.innerHTML = `\n${textToShow}`;
    popup.style.display = "block";
    popup.style.maxWidth = "600px";

    if (
      previousTarget &&
      typeof previousTarget !== "undefined" &&
      previousTarget.parentNode &&
      typeof previousTarget.parentNode !== "undefined"
    ) {
      let width = popup.offsetWidth;
      let height = popup.offsetHeight;

      popup.style.top = "-1000px";
      popup.style.left = "0px";
      popup.style.display = "";

      //TODO: Add alt-views here
      //TODO: Stuff for box object and zoom?
      //TODO: Check for Option Element? What?

      if (clientX + width > window.innerWidth - 20) {
        pageX = window.innerWidth - width - 20;
        if (pageX < 0) pageX = 0;
      }

      let v = 25;
      if (previousTarget.title && previousTarget.title !== "") v += 20;

      if (clientY + v + height > window.innerHeight) {
        let t = pageY - height - 30;
        if (t >= 0) pageY = t;
      } else {
        pageY += v;
      }
    }

    if (rerender) {
      pageX = this.lastPopupPosition.left;
      pageY = this.lastPopupPosition.top;
    }

    popup.style.left = pageX + "px";
    popup.style.top = pageY + "px";

    this.lastPopupPosition = { left: pageX, top: pageY };
  }

  async makeHTML(entries: SearchResults) {
    let k;
    let entry;
    let returnValue = [];
    let c, s;
    let i, j;

    if (entries == null) return "";

    if (isKanjiResult(entries)) {
      let yomi;
      let box;
      let nums;

      yomi = entries.onkun.replace(
        /\.([^\u3001]+)/g,
        '<span class="k-yomi-hi">$1</span>'
      );
      if (entries.nanori.length) {
        yomi += `<br/><span class="k-yomi-ti">\u540D\u4E57\u308A</span> ${entries.nanori}`;
      }
      if (entries.bushumei.length) {
        yomi += `<br/><span class="k-yomi-ti">\u90E8\u9996\u540D</span> ${entries.bushumei}`;
      }

      let kanjiUse = entries.misc["G"];
      switch (kanjiUse) {
        case 8:
          kanjiUse = "general<br/>use";
          break;
        case 9:
          kanjiUse = "name<br/>use";
          break;
        default:
          kanjiUse = isNaN(kanjiUse) ? "-" : "grade<br/>" + kanjiUse;
          break;
      }
      box = `<table class="k-abox-tb"><tr>
                <td class="k-abox-r">radical<br/>${entries.radical.charAt(0)} ${
        entries.radicalNumber
      }</td>
                <td class="k-abox-g">${kanjiUse}</td>
                </tr><tr>
                <td class="k-abox-f">freq<br/>${
                  entries.misc["F"] ? entries.misc["F"] : "-"
                }</td>
                <td class="k-abox-s">strokes<br/>${entries.misc["S"]}</td>
                </tr></table>`;

      if (this.config.showKanjiComponents) {
        k = entries.radical.split("\t");
        box +=
          '<table class="k-bbox-tb">' +
          '<tr><td class="k-bbox-1a">' +
          k[0] +
          "</td>" +
          '<td class="k-bbox-1b">' +
          k[2] +
          "</td>" +
          '<td class="k-bbox-1b">' +
          k[3] +
          "</td></tr>";
        j = 1;
        for (const radical of entries.radicals) {
          k = radical.split("\t");
          c = ' class="k-bbox-' + (j ^= 1);
          box +=
            "<tr><td" +
            c +
            'a">' +
            k[0] +
            "</td>" +
            "<td" +
            c +
            'b">' +
            k[2] +
            "</td>" +
            "<td" +
            c +
            'b">' +
            k[3] +
            "</td></tr>";
        }
        box += "</table>";
      }

      nums = "";
      j = 0;

      const numList = {
        H: ["showKanjiHalpern", "Halpern"],
        L: ["showKanjiHeisig", "Heisig"],
        E: ["showKanjiHenshall", "Henshall"],
        DK: ["showKanjiLearnersDictionary", "Kanji Learners Dictionary"],
        N: ["showKanjiNelson", "Nelson"],
        V: ["showKanjiNewNelson", "New Nelson"],
        Y: ["showKanjiPinYin", "PinYin"],
        P: ["showKanjiSkipPattern", "Skip Pattern"],
        IN: ["showKanjiTurtleAndKana", "Turtle Kanji & Kana"],
        I: ["showKanjiTurtleDictionary", "Turtle Kanji Dictionary"],
        U: ["showKanjiUnicode", "Unicode"],
      };

      for (const i in numList) {
        const configName = numList[i][0];
        const displayName = numList[i][1];

        if (this.config[configName]) {
          s = entries.misc[i]; // The number
          c = ' class="k-mix-td' + (j ^= 1) + '"';

          if (configName === "showKanjiHeisig") {
            const revTkLink =
              "http://kanji.koohii.com/study/kanji/" + entries.kanji;
            nums +=
              "<tr><td" +
              c +
              ">" +
              "<a" +
              c +
              'href="' +
              revTkLink +
              '">Heisig</a>' +
              "</td><td" +
              c +
              ">" +
              "<a" +
              c +
              'href="' +
              revTkLink +
              '">' +
              (s ? s : "-") +
              "</a>" +
              "</td></tr>";
          } else {
            nums +=
              "<tr><td" +
              c +
              ">" +
              displayName +
              "</td><td" +
              c +
              ">" +
              (s ? s : "-") +
              "</td></tr>";
          }
        }
      }
      if (nums.length) nums = '<table class="k-mix-tb">' + nums + "</table>";

      returnValue.push('<table class="k-main-tb"><tr><td valign="top">');
      returnValue.push(box);
      returnValue.push(
        '<span class="k-kanji">' + entries.kanji + "</span><br/>"
      );
      if (!this.config.hideDefinitions)
        returnValue.push('<div class="k-eigo">' + entries.eigo + "</div>");
      returnValue.push('<div class="k-yomi">' + yomi + "</div>");
      returnValue.push("</td></tr><tr><td>" + nums + "</td></tr></table>");
      return `<div>${returnValue.join("")}</div>`;
    }

    let translationText = "";

    if (entries.names) {
      return transformNameEntriesToHtml(entries, this.config);
    }

    if (entries.title) {
      returnValue.push(`<div class="w-title">${entries.title}</div>`);
    }

    type Definition = {
      kanji?: string;
      kana?: string;
      conjugation?: string;
      definitions: string[];
    };
    const transformed = entries.data.reduce(
      (acc: Definition[], entry): Definition[] => {
        const conjugation = entry[1];
        let [_, kanji, kana, definition] = entry[0].match(
          /^(.+?)\s+(?:\[(.*?)\])?\s*\/([\S\s]+)\//
        );

        const existing = acc.find(
          (def) =>
            def.kanji === kanji &&
            def.kana === kana &&
            def.conjugation === conjugation
        );
        if (!existing) {
          acc.push({
            kanji,
            kana,
            definitions: [definition],
            conjugation,
          });
        } else {
          existing.definitions.push(definition);
        }

        return acc;
      },
      []
    );

    const definitionTransformer = (definition: string): string => {
      if (this.config.hideDefinitions) return "";

      definition = definition.replace(/\//g, "; ");

      if (!this.config.showWordTypeIndicator)
        definition = definition.replace(/^\([^)]+\)\s*/, "");
      if (!this.config.showPopularWordIndicator)
        definition = definition.replace("; (P)", "");

      definition = definition.replace(/\n/g, "<br/>");

      if (!definition.length) return "";

      return `<span class="w-def">${definition}</span>`;
    };

    const transformedEntries = await Promise.all(
      transformed.map(
        async ({ kana, kanji, definitions, conjugation }, index) => {
          let title;
          let pitch = "";
          const conjugationString = conjugation
            ? `<span class="w-conj">${conjugation}</span>`
            : "";
          const definitionString = definitions
            .map(definitionTransformer)
            .filter((def) => !!def.length)
            .join("<br />");

          let frequencyString = "";
          if (!kana) {
            title = `<span class="w-kana">${kanji}</span>`;
          } else {
            title = `<span class="w-kanji">${kanji}</span> &#32; <span class="w-kana">${kana}</span>`;
          }

          if (this.config.showPitchAccent) {
            const pitchAccent = await this.sendRequest("getPitch", {
              expression: kanji,
              reading: kana,
            });

            if (pitchAccent && pitchAccent.length > 0) {
              pitch = `<span class="w-conj">${pitchAccent}</span>`;
            }
          }

          if (this.config.showFrequency) {
            const freq = await this.getFrequency(kanji, kana || kanji, i === 0);

            if (freq?.length) {
              const frequencyClass = Rikai.getFrequencyStyle(freq);
              frequencyString = `<span class="${frequencyClass}"> ${freq}</span>`;
            }
          }

          return `<div class="${
            index === this.selectedEntry ? "selected" : ""
          }">${title} ${pitch} ${conjugationString} ${frequencyString}<br />${definitionString}</div>`;
        }
      )
    );

    if (entries.more) {
      transformedEntries.push(`...<br />`);
    }

    return transformedEntries.join("");
  }

  static getFrequencyStyle(inFreqNum) {
    let freqNum = inFreqNum.replace(/_r/g, "");

    let freqStyle = "w-freq-rare";

    if (freqNum <= 5000) {
      freqStyle = "w-freq-very-common";
    } else if (freqNum <= 10000) {
      freqStyle = "w-freq-common";
    } else if (freqNum <= 20000) {
      freqStyle = "w-freq-uncommon";
    }

    return freqStyle;
  }

  async getFrequency(
    inExpression: string,
    inReading: string,
    useHighlightedWord: boolean
  ) {
    const highlightedWord = this.word;
    return this.sendRequest("getFrequency", {
      inExpression,
      inReading,
      useHighlightedWord,
      highlightedWord,
    });
  }

  sendAllSoundToAnki(): boolean {
    const bodyContent = document.body.innerText;
    const dataRegex = /\[sound:(.*?) - (.*?).mp3]/;
    const matches = bodyContent
      .match(/\[sound:(.*? - .*?).mp3]/g)
      .map((soundToMatch) => {
        const [_, reading, kanji] = dataRegex.exec(soundToMatch);

        return {
          reading,
          kanji,
        };
      });

    this.sendRequest("bulkAudioImport", matches);
    return true;
  }

  sendToAnki(): boolean {
    const word = this.word;
    const sentence = this.sentence;
    const sentenceWithBlank = this.sentenceWithBlank;
    const entry = this.lastFound;
    const pageTitle = window.document.title;
    const sourceUrl = window.location.href;

    this.sendRequest("sendToAnki", {
      word,
      sentence,
      sentenceWithBlank,
      entry,
      pageTitle,
      sourceUrl,
      selected: this.selectedEntry,
    });
    return true;
  }

  isVisible(): boolean {
    const popup = this.getPopup();
    return popup && popup.style.display !== "none";
  }

  playAudio(): boolean {
    const { lastFound } = this;

    if (!lastFound) return false;

    this.sendRequest("playAudio", {
      ...lastFound,
      selected: this.selectedEntry,
    });
    return true;
  }

  setSanseidoMode(sanseidoMode: boolean): void {
    this.sanseidoMode = sanseidoMode || false;
  }

  setEpwingMode(epwingMode: boolean): void {
    if (epwingMode) {
      this.enableEpwing();
    } else {
      this.disableEpwing();
    }
  }
}

const rikai = new Rikai(document);
browser.storage.local.get("enabled").then(({ enabled }) => {
  if (enabled) {
    rikai.enable();
  }
});

browser.storage.local
  .get("sanseidoMode")
  .then(({ sanseidoMode }: Storage & { sanseidoMode: boolean }) => {
    rikai.setSanseidoMode(sanseidoMode);
  });

browser.storage.local
  .get("epwingMode")
  .then(({ epwingMode }: Storage & { epwingMode: boolean }) => {
    rikai.setEpwingMode(epwingMode);
  });

browser.storage.onChanged.addListener((change, storageArea) => {
  if (storageArea !== "local") return;
  if (typeof change.enabled !== "undefined") {
    if (change.enabled.newValue === true) {
      rikai.enable();
    } else {
      rikai.disable();
    }
  }

  if (typeof change.sanseidoMode !== "undefined") {
    rikai.setSanseidoMode(change.sanseidoMode.newValue);
  }

  if (typeof change.epwingMode !== "undefined") {
    rikai.setEpwingMode(change.epwingMode.newValue);
  }
});

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "bulkAudioImport") {
    rikai.sendAllSoundToAnki();
    sendResponse({ response: null });
  }
});
