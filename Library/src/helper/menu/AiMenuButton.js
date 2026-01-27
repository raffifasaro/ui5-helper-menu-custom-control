sap.ui.define([
  "sap/ui/core/Control"
], function (Control) {
  "use strict";
  
  return Control.extend("helper.menu.AiMenuButton", {
    
    metadata: {
      properties: {
        /**
         * SAP icons ID (only number part like e024 for lightbulb icon)
         */
        icon: {
          type: "string",
          defaultValue: "e024"
        },
        /**
         * Action identifier for this button
         */
        action: {
          type: "string",
          defaultValue: ""
        },
        /**
         * Tooltip text
         */
        tooltip: {
          type: "string",
          defaultValue: ""
        },
        /**
         * Whether the button is draggable
         */
        draggable: {
          type: "boolean",
          defaultValue: true
        },
        /**
         * X position offset (will be calculated if not provided)
         */
        positionX: {
          type: "int",
          defaultValue: 0
        },
        /**
         * Y position offset (will be calculated if not provided)
         */
        positionY: {
          type: "int",
          defaultValue: 0
        },
        /**
         * Custom background gradient
         */
        backgroundGradient: {
          type: "string",
          defaultValue: ""
        },
        /**
         * Enable click-to-highlight feature for this button
         */
        highlightOnClick: {
          type: "boolean",
          defaultValue: true
        }
      },
      events: {
        dragStart: {},
        press: {}
      }
    },

// ============================
// Lifecycle
// ============================

    init: function() {
      this._bShowingHighlights = false;
      this._aHighlightedElements = [];
      this._oActiveHighlightElement = null;
      this._bIsDragging = false;
      this._iMouseDownTime = 0;
    },

    exit: function() {
      this._clearAllHighlights();
    },

// ============================
// Rendering
// ============================

    renderer: function(oRm, oControl) {
      oRm.openStart("button", oControl);
      oRm.class("aiMenuButton");
      oRm.attr("type", "button");
      
      if (oControl.getDraggable()) {
        oRm.attr("draggable", "true");
      }
      
      if (oControl.getTooltip()) {
        oRm.attr("title", oControl.getTooltip());
      }
      
      const sGradient = oControl.getBackgroundGradient();
      if (sGradient) {
        oRm.style("background", sGradient);
      }
      
      oRm.openEnd();
      
      oRm.openStart("span");
      oRm.class("aiMenuButtonIcon");
      // Pass icon code as CSS variable for ::before pseudo-element
      oRm.style("--icon-code", '"\\' + oControl.getIcon() + '"');
      oRm.openEnd();
      oRm.close("span");
      
      oRm.close("button");
    },

    onAfterRendering: function() {
      if (Control.prototype.onAfterRendering) {
        Control.prototype.onAfterRendering.apply(this, arguments);
      }
      
      const oDomRef = this.getDomRef();
      if (!oDomRef) return;
      
      this._attachEventHandlers(oDomRef);
      this._injectHighlightStyles();
    },

    /**
     * Attach event handlers for drag and click interactions
     */
    _attachEventHandlers: function(oDomRef) {
      if (this.getDraggable()) {
        oDomRef.addEventListener("dragstart", this._onDragStartInternal.bind(this));
        oDomRef.addEventListener("dragend", this._onDragEndInternal.bind(this));
      }
      
      if (this.getHighlightOnClick()) {
        oDomRef.addEventListener("mousedown", this._onMouseDown.bind(this));
        oDomRef.addEventListener("mouseup", this._onMouseUp.bind(this));
      }
    },

// ============================
// Interaction
// ============================

    /**
     * Record mouse down time to distinguish clicks from drags
     */
    _onMouseDown: function() {
      this._iMouseDownTime = Date.now();
      this._bIsDragging = false;
    },

    /**
     * Handle mouse up event and trigger click if not a drag
     */
    _onMouseUp: function(oEvent) {
      const iTimeDiff = Date.now() - this._iMouseDownTime;
      
      // Distinguish click from drag
      if (iTimeDiff < 200 && !this._bIsDragging) {
        this._onClickInternal(oEvent);
      }
      
      this._iMouseDownTime = 0;
    },

    /**
     * Handle button click to toggle highlights and fire press event
     */
    _onClickInternal: function(oEvent) {
      if (this.getHighlightOnClick() && this.getDraggable()) {
        this._toggleHighlight();
      }
      
      this.firePress({
        originalEvent: oEvent
      });
    },

    /**
     * Handle drag start event and show target highlights
     */
    _onDragStartInternal: function(oEvent) {
      this._bIsDragging = true;
      
      oEvent.dataTransfer.effectAllowed = "copy";
      oEvent.dataTransfer.setData("text/plain", this.getAction());
      
      if (!this._bShowingHighlights) {
        this._showHighlights();
      }
      
      this.fireDragStart({
        originalEvent: oEvent
      });
      
      this.fireEvent("dragStart", {
        originalEvent: oEvent
      });
    },

    /**
     * Handle drag end event and clear highlights
     */
    _onDragEndInternal: function() {
      this._bIsDragging = false;
      this._clearAllHighlights();
    },

// ============================
// Highlighting (Template Methods)
// ============================

    /**
     * Inject CSS styles for highlighting
     */
    _injectHighlightStyles: function() {
      const sStyleId = this.getHighlightStyleId();
      if (document.getElementById(sStyleId)) return;
      
      const oStyle = document.createElement("style");
      oStyle.id = sStyleId;
      oStyle.textContent = this.getHighlightCSS();
      document.head.appendChild(oStyle);
    },

    /**
     * Get the style element ID for highlights
     */
    getHighlightStyleId: function() {
      return "aiMenuButtonHighlightStyles";
    },

    /**
     * Get CSS for highlighting
     * Override in derived classes for custom highlight styles
     * @public
     */
    getHighlightCSS: function() {
      return `
        .ai-highlight-target {
          outline: 2px dashed #00B9F2 !important;
          outline-offset: -2px;
          background-color: rgba(0, 185, 242, 0.1) !important;
          cursor: help !important;
          transition: all 0.2s ease;
        }
        
        .ai-highlight-target:hover {
          background-color: rgba(0, 185, 242, 0.2) !important;
          box-shadow: 0 0 10px rgba(0, 185, 242, 0.3);
        }
        
        .ai-highlight-active {
          background-color: rgba(0, 185, 242, 0.3) !important;
          outline-style: solid !important;
          box-shadow: 0 0 15px rgba(0, 185, 242, 0.5);
        }
      `;
    },

    /**
     * Toggle the visibility of target highlights
     */
    _toggleHighlight: function() {
      this._bShowingHighlights = !this._bShowingHighlights;
      
      if (this._bShowingHighlights) {
        this._showHighlights();
      } else {
        this._clearHighlights();
      }
    },

    /**
     * Show highlights on all targetable elements
     */
    _showHighlights: function() {
      const aElements = this.getAllTargetableElements();
      this._aHighlightedElements = aElements;
      
      aElements.forEach(oEl => {
        oEl.classList.add("ai-highlight-target");
      });
      
      this._bShowingHighlights = true;
    },

    /**
     * Clear all target highlights
     */
    _clearHighlights: function() {
      this._aHighlightedElements.forEach(oEl => {
        oEl.classList.remove("ai-highlight-target");
      });
      this._aHighlightedElements = [];
      this._bShowingHighlights = false;
    },
    
    /**
     * Set the active highlight on a specific element during drag
     */
    _setActiveHighlight: function(oElement) {
      if (this._oActiveHighlightElement === oElement) return;
      
      this._clearActiveHighlight();
      this._oActiveHighlightElement = oElement;
      oElement.classList.add("ai-highlight-active");
    },

    /**
     * Clear the active highlight from current element
     */
    _clearActiveHighlight: function() {
      if (this._oActiveHighlightElement) {
        this._oActiveHighlightElement.classList.remove("ai-highlight-active");
        this._oActiveHighlightElement = null;
      }
    },

    /**
     * Clear both target highlights and active highlight
     */
    _clearAllHighlights: function() {
      this._clearActiveHighlight();
      this._clearHighlights();
    },

    /**
     * Get all elements that can be targeted by this button
     * Filters for visibility, excludes nested elements, validates content
     * Override in derived classes for different target types
     * @public
     */
    getAllTargetableElements: function() {
      const sSelectors = "input, textarea, [contenteditable='true'], " +
                        ".sapMInput, .sapMTextArea, .sapMInputBase, " +
                        ".sapMFeedListItem, .sapMLIB, .sapMListTblRow, " +
                        ".sapMText, .sapMLabel, .sapMObjectStatus, .sapMTitle, " +
                        ".sapMFeedListItemText";
      
      const aElements = Array.from(document.querySelectorAll(sSelectors));
      
      const aFiltered = aElements.filter(oEl => {
        if (oEl.offsetParent === null) return false;
        if (this.getDomRef()?.contains(oEl)) return false;
        
        const oTargetInfo = this.findDropTarget(oEl);
        if (!oTargetInfo?.targetElement) return false;
        
        const sContent = this.extractContent(oTargetInfo.targetElement);
        return sContent?.trim().length > 0;
      });
      
      return this._removeNestedElements(aFiltered);
    },

    /**
     * Filter array to exclude elements that are children of other elements in array
     */
    _removeNestedElements: function(aElements) {
      return aElements.filter(oEl => {
        return !aElements.some(oParent => {
          return oParent !== oEl && oParent.contains(oEl);
        });
      });
    },

    /**
     * Find the visual wrapper element for better highlighting
     */
    _findVisualWrapper: function(oElement) {
      let oCurrent = oElement;
      const iMaxDepth = 5;
      
      // Walk up DOM tree to find SAP UI5 input container
      for (let iDepth = 0; oCurrent && iDepth < iMaxDepth; iDepth++) {
        if (oCurrent.classList?.contains("sapMInput") ||
            oCurrent.classList?.contains("sapMTextArea") ||
            oCurrent.classList?.contains("sapMInputBase")) {
          return oCurrent;
        }
        oCurrent = oCurrent.parentElement;
      }
      
      return oElement;
    },

// ============================
// Public Extension Points
// ============================

    /**
     * Find the drop target element for the given element
     * Walks up DOM tree to find valid target
     * Override in derived classes to customize target detection
     * @param {Element} oElement - Element to check
     * @returns {object|null} Object with targetElement and visualElement, or null
     * @public
     */
    findDropTarget: function(oElement) {
      if (!oElement) {
        this._clearActiveHighlight();
        return null;
      }
      
      let oCurrent = oElement;
      const iMaxDepth = 20;
      
      // Walk up DOM tree looking for valid drop target
      for (let iDepth = 0; oCurrent && iDepth < iMaxDepth; iDepth++) {
        const oTarget = this._checkElementAsTarget(oCurrent);
        if (oTarget) {
          // Highlight during drag
          if (this._bIsDragging) {
            this._setActiveHighlight(oTarget.visualElement);
          }
          return oTarget;
        }
        oCurrent = oCurrent.parentElement;
      }
      
      this._clearActiveHighlight();
      return null;
    },

    /**
     * Check if element is a valid drop target
     * Returns target and visual element for highlighting
     */
    _checkElementAsTarget: function(oCurrent) {
      if (oCurrent.classList?.contains("sapMFeedListItem")) {
        return {
          targetElement: oCurrent,
          visualElement: oCurrent
        };
      }
      
      if (oCurrent.tagName === "INPUT" || 
          oCurrent.tagName === "TEXTAREA" ||
          oCurrent.isContentEditable) {
        return {
          targetElement: oCurrent,
          visualElement: this._findVisualWrapper(oCurrent)
        };
      }
      
      // Find actual input/textarea inside wrapper for SAP UI5 input controls
      if (oCurrent.classList?.contains("sapMInput") ||
          oCurrent.classList?.contains("sapMTextArea") ||
          oCurrent.classList?.contains("sapMInputBase")) {
        const oInput = oCurrent.querySelector("input, textarea");
        return {
          targetElement: oInput || oCurrent,
          visualElement: oCurrent
        };
      }
      
      // Find parent item for text/label elements for better context
      if (oCurrent.classList?.contains("sapMFeedListItemText") ||
          oCurrent.classList?.contains("sapMText") ||
          oCurrent.classList?.contains("sapMLabel") ||
          oCurrent.classList?.contains("sapMObjectStatus") ||
          oCurrent.classList?.contains("sapMTitle")) {
        const oParentItem = oCurrent.closest(".sapMFeedListItem, .sapMLIB, .sapMListTblRow");
        if (oParentItem) {
          return {
            targetElement: oParentItem,
            visualElement: oParentItem
          };
        }
        return {
          targetElement: oCurrent,
          visualElement: oCurrent
        };
      }
      
      if (oCurrent.classList?.contains("sapMLIB") ||
          oCurrent.classList?.contains("sapMListTblRow")) {
        return {
          targetElement: oCurrent,
          visualElement: oCurrent
        };
      }
      
      return null;
    },

    /**
     * Extract content from target element for AI processing
     * Handles inputs, contenteditable, and text elements
     * Override in derived classes for custom extraction
     * @param {Element} oTarget - Element to extract from
     * @returns {string} Extracted and normalized content
     * @public
     */
    extractContent: function(oTarget) {
      // Handle form inputs
      if (oTarget.tagName === "INPUT" || oTarget.tagName === "TEXTAREA") {
        return oTarget.value;
      }
      // Handle contenteditable elements
      if (oTarget.isContentEditable) {
        return oTarget.textContent || oTarget.innerText;
      }
      // Handle regular elements: get text and normalize whitespace
      const sContent = oTarget.textContent || oTarget.innerText || "";
      return sContent.trim().replace(/\s+/g, ' ');
    },

    /**
     * Handle action execution on target element
     * Called by parent AiAssistantCore after drop
     * Override in derived classes to implement custom actions
     * @param {string} sContent - Extracted content from target
     * @param {Element} oTarget - The target element
     * @public
     */
    handleAction: function(sContent, oTarget) {
      // Override in derived classes
    }

  });
});