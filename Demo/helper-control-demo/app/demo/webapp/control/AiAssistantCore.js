sap.ui.define([
  "sap/ui/core/Control",
  "sap/ui/core/theming/Parameters",
  "./AiMenuButton"
], function (Control, ThemingParameters) {
  "use strict";

  return Control.extend("demo.control.AiAssistantCore", {

    metadata: {
      properties: {
        /**
         * Use theme colors for buttons (auto detects sapBrandColor)
         */
        useThemeColors: {
          type: "boolean",
          defaultValue: true
        },
        /**
         * Custom gradient for main button
         */
        mainButtonGradient: {
          type: "string",
          defaultValue: ""
        },
        /**
         * Custom gradient for menu buttons
         */
        menuButtonGradient: {
          type: "string",
          defaultValue: ""
        },
        /**
         * Active AI provider ID
         */
        activeAiProvider: {
          type: "string",
          defaultValue: "default"
        },
        /**
         * OData model for SAP AI Core default provider
         */
        aiModel: {
          type: "object",
          defaultValue: null
        },
        /**
         * Action path for SAP AI Core
         */
        aiActionPath: {
          type: "string",
          defaultValue: "/callLLM(...)"
        }
      },
      aggregations: {
        /**
         * Custom menu buttons that can be added by developers
         */
        menuButtons: {
          type: "demo.control.AiMenuButton",
          multiple: true,
          singularName: "menuButton"
        }
      },
      events: {
        actionPerformed: {
          parameters: {
            action: { type: "string" },
            targetElement: { type: "object" },
            content: { type: "string" },
            event: { type: "object" }
          }
        },
        aiRequestStarted: {
          parameters: {
            prompt: { type: "string" }
          }
        },
        aiRequestCompleted: {
          parameters: {
            response: { type: "string" }
          }
        },
        aiRequestFailed: {
          parameters: {
            error: { type: "object" }
          }
        }
      }
    },
  
// ============================
// Lifecycle
// ============================

    init: function() {
      this._bMenuOpen = false;
      this._oDraggedButton = null;
      this._oCurrentDropTarget = null;
      this._oCurrentVisualTarget = null;
      this._sThemeColor = null;
      
      this._fnOnDragOver = null;
      this._fnOnDragEnter = null;
      this._fnOnDrop = null;
      this._fnOnDragEnd = null;
      
      this._mAiProviders = {};
      
      this._registerDefaultProvider();
      
      this._setupGlobalDropZone();
      this._detectThemeColor();
    },

    exit: function() {
      this._clearDropTargetHighlight();
      this._removeGlobalEventListeners();
      this._removeInjectedStyles();
      this._cleanupReferences();
    },

    /**
     * Remove all global event listeners for drag and drop
     */
    _removeGlobalEventListeners: function() {
      const aListeners = [
        { fn: this._fnOnDragOver, event: "dragover" },
        { fn: this._fnOnDragEnter, event: "dragenter" },
        { fn: this._fnOnDrop, event: "drop" },
        { fn: this._fnOnDragEnd, event: "dragend" }
      ];

      aListeners.forEach(function(oListener) {
        if (oListener.fn) {
          document.removeEventListener(oListener.event, oListener.fn, true);
        }
      });

      this._fnOnDragOver = null;
      this._fnOnDragEnter = null;
      this._fnOnDrop = null;
      this._fnOnDragEnd = null;
    },

    /**
     * Remove injected CSS styles from the DOM
     */
    _removeInjectedStyles: function() {
      ["aiAssistantCoreStyles", "aiAssistantButtonPositions"].forEach(function(sId) {
        const oStyle = document.getElementById(sId);
        if (oStyle?.parentNode) {
          oStyle.parentNode.removeChild(oStyle);
        }
      });
    },

    /**
     * Clean up internal references and reset state
     */
    _cleanupReferences: function() {
      this._mAiProviders = {};
      this._oDraggedButton = null;
      this._oCurrentDropTarget = null;
      this._oCurrentVisualTarget = null;
      this._sThemeColor = null;
      this._bMenuOpen = false;
    },

// ============================
// AI Provider System
// ============================

    /**
     * Register default SAP AI Core provider
     */
    _registerDefaultProvider: function() {
      const that = this;
      
      this._mAiProviders.default = {
        name: "SAP AI Core",
        sendPrompt: async function(sPrompt, mOptions) {
          const oModel = that.getAiModel();
          const sActionPath = that.getAiActionPath();
          
          if (!oModel) {
            throw new Error("AI Model not configured. Set 'aiModel' property.");
          }
          
          const oActionBinding = oModel.bindContext(sActionPath);
          oActionBinding.setParameter("prompt", sPrompt);
          
          if (mOptions) {
            Object.keys(mOptions).forEach(function(sKey) {
              oActionBinding.setParameter(sKey, mOptions[sKey]);
            });
          }
          
          await oActionBinding.execute();
          const oData = oActionBinding.getBoundContext().getObject();
          
          if (!oData?.response) {
            throw new Error("No response from AI service");
          }
          
          return oData.response;
        }
      };
    },

    /**
     * Register a custom AI provider (override or extend this to add custom providers)
     * @param {string} sId - Provider ID
     * @param {object} oProvider - Provider object with sendPrompt function
     * @param {string} oProvider.name - Provider name
     * @param {function} oProvider.sendPrompt - Function(sPrompt, mOptions) -> Promise<string>
     * @public
     */
    registerAiProvider: function(sId, oProvider) {
      if (!oProvider || typeof oProvider.sendPrompt !== "function") {
        throw new Error("Provider must have a sendPrompt function");
      }
      
      this._mAiProviders[sId] = {
        name: oProvider.name || sId,
        sendPrompt: oProvider.sendPrompt
      };
      
      return this;
    },

    /**
     * Get list of registered provider IDs
     * @returns {string[]} Array of provider IDs
     * @public
     */
    getAiProviderIds: function() {
      return Object.keys(this._mAiProviders);
    },

    /**
     * Send a prompt to the active AI provider
     * @param {string} sPrompt - The prompt to send
     * @param {object} mOptions - Optional parameters
     * @returns {Promise<string>} AI response
     * @public
     */
    sendPrompt: async function(sPrompt, mOptions) {
      const sProviderId = this.getActiveAiProvider();
      const oProvider = this._mAiProviders[sProviderId];
      
      if (!oProvider) {
        throw new Error("No AI provider configured with ID: " + sProviderId);
      }
      
      this.fireEvent("aiRequestStarted", { prompt: sPrompt });
      
      try {
        const sResponse = await oProvider.sendPrompt(sPrompt, mOptions);
        this.fireEvent("aiRequestCompleted", { response: sResponse });
        return sResponse;
      } catch (oError) {
        this.fireEvent("aiRequestFailed", { error: oError });
        throw oError;
      }
    },

// ============================
// Rendering
// ============================

    renderer: function(oRm, oControl) {
      oRm.openStart("div", oControl);
      oRm.class("aiFloatingButtonContainer");
      oRm.openEnd();

      oRm.openStart("div");
      oRm.class("aiMenuButtons");
      oRm.openEnd();
      
      oControl.getMenuButtons().forEach(function(oButton) {
        oRm.renderControl(oButton);
      });
      
      oRm.close("div");

      oRm.openStart("button");
      oRm.class("aiFloatingButton");
      oRm.attr("type", "button");
      oRm.openEnd();
      
      oRm.openStart("span");
      oRm.class("aiFloatingButtonInner");
      oRm.openEnd();
      oRm.close("span");
      
      oRm.close("button");
      oRm.close("div");
    },

    onAfterRendering: function() {
      if (sap.ui.core.Control.prototype.onAfterRendering) {
        sap.ui.core.Control.prototype.onAfterRendering.apply(this, arguments);
      }

      this._attachMainButtonHandler();
      this._injectStyles();
      this._applyThemeColors();
      this._injectButtonPositions();
    },

    /**
     * Attach click handler to the main floating button
     */
    _attachMainButtonHandler: function() {
      const oButton = this.getDomRef()?.querySelector(".aiFloatingButton");
      if (oButton) {
        oButton.addEventListener("click", this._onMainButtonPress.bind(this));
      }
    },

// ============================
// Theme / Color
// ============================

    /**
     * Detect and store the current theme brand color
     */
    _detectThemeColor: function() {
      if (!this.getUseThemeColors()) {
        return;
      }
      
      this._sThemeColor = ThemingParameters.get({ name: "sapBrandColor" }) ||
                          ThemingParameters.get({ name: "sapHighlightColor" }) ||
                          "#1661BE";
    },

    /**
     * Generate a gradient from a theme color by darkening it
     */
    _getComputedGradient: function(sThemeColor) {
      if (!sThemeColor) {
        return "linear-gradient(135deg, #00B9F2 0%, #1661BE 70%)";
      }
      
      const oColor = this._parseColor(sThemeColor);
      const oDarkerColor = this._darkenColor(oColor, 0.2);
      
      return "linear-gradient(135deg, " + sThemeColor + " 0%, " + 
             this._colorToString(oDarkerColor) + " 70%)";
    },

    /**
     * Parse color string (hex or rgb/rgba) to RGB object
     */
    _parseColor: function(sColor) {
      if (sColor.startsWith("#")) {
        let sHex = sColor.substring(1);

        if (sHex.length === 3) {
          sHex = sHex.split('').map(function(c) { return c + c; }).join('');
        }
        return {
          r: parseInt(sHex.substring(0, 2), 16),
          g: parseInt(sHex.substring(2, 4), 16),
          b: parseInt(sHex.substring(4, 6), 16)
        };
      }
      
      // Handle rgb/rgba colors
      const aMatch = sColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (aMatch) {
        return {
          r: parseInt(aMatch[1]),
          g: parseInt(aMatch[2]),
          b: parseInt(aMatch[3])
        };
      }

      // Fallback to default color
      return { r: 22, g: 97, b: 190 };
    },

    /**
     * Darken an RGB color by reducing each channel
     */
    _darkenColor: function(oColor, fFactor) {
      return {
        r: Math.max(0, Math.floor(oColor.r * (1 - fFactor))),
        g: Math.max(0, Math.floor(oColor.g * (1 - fFactor))),
        b: Math.max(0, Math.floor(oColor.b * (1 - fFactor)))
      };
    },

    /**
     * Convert RGB object to CSS rgb() string
     */
    _colorToString: function(oColor) {
      return "rgb(" + oColor.r + ", " + oColor.g + ", " + oColor.b + ")";
    },

    /**
     * Apply theme colors to main and menu buttons
     */
    _applyThemeColors: function() {
      const oDomRef = this.getDomRef();
      if (!oDomRef) {
        return;
      }
      
      this._applyMainButtonGradient(oDomRef);
      this._applyMenuButtonGradients();
    },

    /**
     * Apply gradient to the main floating button
     */
    _applyMainButtonGradient: function(oDomRef) {
      let sMainGradient = this.getMainButtonGradient();
      if (!sMainGradient && this.getUseThemeColors()) {
        sMainGradient = this._getComputedGradient(this._sThemeColor);
      }
      
      if (sMainGradient) {
        const oMainButton = oDomRef.querySelector(".aiFloatingButton");
        if (oMainButton) {
          oMainButton.style.background = sMainGradient;
        }
      }
    },

    /**
     * Apply gradients to all menu buttons
     */
    _applyMenuButtonGradients: function() {
      let sMenuGradient = this.getMenuButtonGradient();
      if (!sMenuGradient && this.getUseThemeColors()) {
        sMenuGradient = this._getComputedGradient(this._sThemeColor);
      }
      
      if (sMenuGradient) {
        this.getMenuButtons().forEach(function(oButton) {
          if (!oButton.getBackgroundGradient()) {
            const oButtonDom = oButton.getDomRef();
            if (oButtonDom) {
              oButtonDom.style.background = sMenuGradient;
            }
          }
        });
      }
    },

// ============================
// Styling / Positioning
// ============================

    /**
     * Inject base CSS styles for the floating button and menu
     */
    _injectStyles: function() {
      if (document.getElementById("aiAssistantCoreStyles")) {
        return;
      }

      const oStyle = document.createElement("style");
      oStyle.id = "aiAssistantCoreStyles";
      oStyle.textContent = `
        .aiFloatingButtonContainer {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          z-index: 9999;
        }

        .aiMenuButtons {
          position: absolute;
          bottom: 0;
          right: 0;
          pointer-events: none;
        }

        .aiMenuButton {
          position: absolute;
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          background: linear-gradient(135deg, #00B9F2 0%, #1661BE 70%);
          border: none;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0;
          transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          opacity: 0;
          transform: scale(0) translate(0, 0);
          pointer-events: none;
          bottom: 0.5rem;
          right: 0.5rem;
        }

        .aiMenuButtonIcon::before {
          font-family: "SAP-icons";
          color: #ffffff;
          font-size: 1.2rem;
          line-height: 1;
          font-weight: normal;
        }

        .aiMenuButtonIcon::before {
          content: var(--icon-code);
          font-family: 'SAP-icons';
        }
        
        .aiFloatingButtonContainer.menu-open .aiMenuButton {
          opacity: 1;
          transform: scale(1);
          pointer-events: auto;
        }

        .aiMenuButton:hover {
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }

        .aiFloatingButton {
          position: relative;
          width: 3.5rem;
          height: 3.5rem;
          border-radius: 50%;
          background: linear-gradient(135deg, #00B9F2 0%, #1661BE 70%);
          border: none;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0;
          transition: transform 0.2s ease;
          z-index: 2;
        }

        .aiFloatingButton:hover {
          transform: scale(1.05);
          animation: aiPulse 1.5s infinite;
        }

        .aiFloatingButton:active {
          transform: scale(0.95);
        }

        .aiFloatingButtonInner::before {
          font-family: "SAP-icons";
          content: "\\e2a5";
          color: #ffffff;
          font-size: 1.6rem;
          line-height: 1;
          font-weight: normal;
        }

        @keyframes aiPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(36, 48, 160, 0.7);
          }
          70% {
            box-shadow: 0 0 0 15px rgba(142, 45, 226, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(142, 45, 226, 0);
          }
        }

        .sapUiBLy,
        .sapUiBlockLayerTabbable {
          opacity: 0 !important;
          background-color: transparent !important;
          pointer-events: none !important;
        }

        .ai-drop-target {
          outline: 2px dashed #007acc;
          outline-offset: -4px;
          background-color: rgba(0, 122, 204, 0.1);
        }

        .ai-drop-target-active {
          background-color: rgba(0, 122, 204, 0.2);
        }
      `;

      document.head.appendChild(oStyle);
    },

    /**
     * Inject CSS for dynamic menu button positions
     */
    _injectButtonPositions: function() {
      const oOldStyle = document.getElementById("aiAssistantButtonPositions");
      if (oOldStyle) {
        oOldStyle.remove();
      }

      const oStyle = document.createElement("style");
      oStyle.id = "aiAssistantButtonPositions";
      oStyle.textContent = this._generateButtonPositionCSS();
      document.head.appendChild(oStyle);
    },

    /**
     * Generate CSS for positioning menu buttons in a radial layout
     */
    _generateButtonPositionCSS: function() {
      const aMenuButtons = this.getMenuButtons();
      
      return aMenuButtons.map(function(oButton, iIndex) {
        const oPosition = this._getButtonPosition(oButton, iIndex, aMenuButtons.length);
        const sSelector = "#" + oButton.getId();
        
        return `
          .aiFloatingButtonContainer.menu-open ${sSelector} {
            transform: scale(1) translate(${oPosition.x}px, ${oPosition.y}px);
          }
          .aiFloatingButtonContainer.menu-open ${sSelector}:hover {
            transform: scale(1.1) translate(${oPosition.x}px, ${oPosition.y}px);
          }
          .aiFloatingButtonContainer.menu-open ${sSelector}:active {
            transform: scale(0.95) translate(${oPosition.x}px, ${oPosition.y}px);
          }
        `;
      }, this).join("");
    },

    /**
     * Get position for a button, using custom coordinates or calculated position
     */
    _getButtonPosition: function(oButton, iIndex, iTotalButtons) {
      const iX = oButton.getPositionX();
      const iY = oButton.getPositionY();
      
      if (iX === 0 && iY === 0) {
        return this._calculateButtonPosition(iIndex, iTotalButtons);
      }
      
      return { x: iX, y: iY };
    },

    /**
     * Calculate radial position for a button in the menu arc
     */
    _calculateButtonPosition: function(iIndex, iTotalButtons) {
      const iInnerRadius = 80;
      const iOuterRadius = 135;
      const iMaxInnerButtons = 5;

      let iRadius = iInnerRadius;
      let iEffectiveIndex = iIndex;
      let iEffectiveTotal = iTotalButtons;

      if (iTotalButtons > iMaxInnerButtons) {
        if (iIndex < iMaxInnerButtons) {
          iRadius = iInnerRadius;
          iEffectiveIndex = iIndex;
          iEffectiveTotal = iMaxInnerButtons;
        } else {
          iRadius = iOuterRadius;
          iEffectiveIndex = iIndex - iMaxInnerButtons;
          iEffectiveTotal = iTotalButtons - iMaxInnerButtons;
        }
      }

      const fCenterAngle = 3 * Math.PI / 4;
      
      let fStep = 35 * (Math.PI / 180);
      
      if (iEffectiveTotal > 1) {
        const fMaxTotalSpread = 110 * (Math.PI / 180);
        const fReqSpread = fStep * (iEffectiveTotal - 1);
        if (fReqSpread > fMaxTotalSpread) {
          fStep = fMaxTotalSpread / (iEffectiveTotal - 1);
        }
      }
      
      const fStartAngle = fCenterAngle - (fStep * (iEffectiveTotal - 1) / 2);
      const fAngle = fStartAngle + (iEffectiveIndex * fStep);
      
      return {
        x: Math.cos(fAngle) * iRadius,
        y: -Math.sin(fAngle) * iRadius
      };
    },

// ============================
// Drag & Drop (Global)
// ============================

    /**
     * Register the button that is currently being dragged
     */
    registerDraggedButton: function(oButton) {
      this._oDraggedButton = oButton;
    },

    /**
     * Set up global drag and drop event listeners
     */
    _setupGlobalDropZone: function() {
      const that = this;
      
      this._fnOnDragOver = function(oEvent) {
        if (!that._oDraggedButton) {
          return;
        }
    
        oEvent.preventDefault();
        oEvent.stopPropagation();
        oEvent.dataTransfer.dropEffect = "copy";
        
        // Find valid drop target by delegating to buttons findDropTarget method
        const oTargetInfo = that._oDraggedButton.findDropTarget?.(oEvent.target);
        
        if (oTargetInfo?.targetElement) {
          // Only highlight if target changed to avoid redundant DOM updates
          if (that._oCurrentDropTarget !== oTargetInfo.targetElement) {
            that._clearDropTargetHighlight();
            that._oCurrentDropTarget = oTargetInfo.targetElement;
            that._oCurrentVisualTarget = oTargetInfo.visualElement || oTargetInfo.targetElement;
            that._highlightDropTarget(that._oCurrentVisualTarget);
          }
        } else {
          that._clearDropTargetHighlight();
        }
      };
      document.addEventListener("dragover", this._fnOnDragOver, true);
      
      this._fnOnDragEnter = function(oEvent) {
        if (!that._oDraggedButton) {
          return;
        }
        oEvent.preventDefault();
        oEvent.stopPropagation();
      };
      document.addEventListener("dragenter", this._fnOnDragEnter, true);
      
      this._fnOnDrop = function(oEvent) {
        if (!that._oDraggedButton) {
          return;
        }
        
        oEvent.preventDefault();
        oEvent.stopPropagation();
        
        const oTargetInfo = that._oDraggedButton.findDropTarget?.(oEvent.target);
        
        if (oTargetInfo?.targetElement) {
          that._performActionOnTarget(that._oDraggedButton, oTargetInfo.targetElement, oEvent);
        }
        
        // Cleanup after drop completes
        that._clearDropTargetHighlight();
        that._oDraggedButton = null;
        that._oCurrentDropTarget = null;
        that._oCurrentVisualTarget = null;
      };
      document.addEventListener("drop", this._fnOnDrop, true);
      
      this._fnOnDragEnd = function() {
        // Cleanup on drag cancel or outside valid drop zone
        that._clearDropTargetHighlight();
        that._oDraggedButton = null;
        that._oCurrentDropTarget = null;
        that._oCurrentVisualTarget = null;
      };
      document.addEventListener("dragend", this._fnOnDragEnd, true);
    },

    /**
     * Highlight a valid drop target element
     */
    _highlightDropTarget: function(oTarget) {
      if (oTarget) {
        oTarget.classList.add("ai-drop-target", "ai-drop-target-active");
      }
    },

    /**
     * Clear drop target highlighting
     */
    _clearDropTargetHighlight: function() {
      if (this._oCurrentVisualTarget) {
        this._oCurrentVisualTarget.classList.remove("ai-drop-target", "ai-drop-target-active");
        this._oCurrentVisualTarget = null;
      }
      this._oCurrentDropTarget = null;
    },

// ============================
// Action / Execution
// ============================

    /**
     * Perform the button's action on the dropped target element
     */
    _performActionOnTarget: function(oButton, oTarget, oEvent) {
      const sTextContent = oButton.extractContent?.(oTarget) || this._extractDefaultContent(oTarget);
      const sAction = oButton.getAction?.() || oButton.action;
      
      this.fireEvent("actionPerformed", {
        action: sAction,
        targetElement: oTarget,
        content: sTextContent,
        event: oEvent
      });
      
      this._closeMenu();
      oButton.handleAction?.(sTextContent, oTarget);
    },

    /**
     * Extract content from dropped target element
     */
    _extractDefaultContent: function(oTarget) {
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

// ============================
// UI Handlers / Menu
// ============================

    /**
     * Handle main button press to toggle menu
     */
    _onMainButtonPress: function() {
      this._toggleMenu();
    },

    /**
     * Toggle the menu open/closed state
     */
    _toggleMenu: function() {
      if (this._bMenuOpen) {
        this._closeMenu();
      } else {
        this._openMenu();
      }
    },

    /**
     * Open the radial menu
     */
    _openMenu: function() {
      const oDomRef = this.getDomRef();
      if (oDomRef) {
        oDomRef.classList.add("menu-open");
        this._bMenuOpen = true;
      }
    },

    /**
     * Close the radial menu
     */
    _closeMenu: function() {
      const oDomRef = this.getDomRef();
      if (oDomRef) {
        oDomRef.classList.remove("menu-open");
        this._bMenuOpen = false;
      }
    }

  });
});