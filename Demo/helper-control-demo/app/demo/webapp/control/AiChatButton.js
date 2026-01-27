sap.ui.define([
  "demo/control/AiMenuButton",
  "sap/m/Dialog",
  "sap/m/VBox",
  "sap/m/HBox",
  "sap/m/TextArea",
  "sap/m/Button",
  "sap/m/Text",
  "sap/m/ScrollContainer",
  "sap/m/Bar",
  "sap/ui/core/theming/Parameters",
  "sap/m/FlexItemData"
], function (AiMenuButton, Dialog, VBox, HBox, TextArea, Button, Text, ScrollContainer, Bar, ThemingParameters, FlexItemData) {
  "use strict";

  return AiMenuButton.extend("demo.control.AiChatButton", {
    
    renderer: "demo.control.AiMenuButtonRenderer",

    metadata: {
      properties: {
        /**
         * Title for the chat window
         */
        chatWindowTitle: {
          type: "string",
          defaultValue: "AI Assistant"
        },
        /**
         * Placeholder text for the input field
         */
        placeholder: {
          type: "string",
          defaultValue: "Ask me anything..."
        },
        /**
         * Width of the chat window
         */
        chatWindowWidth: {
          type: "sap.ui.core.CSSSize",
          defaultValue: "500px"
        },
        /**
         * Height of the chat window
         */
        chatWindowHeight: {
          type: "sap.ui.core.CSSSize",
          defaultValue: "400px"
        }
      },
      events: {
        /**
         * Fired when the user sends a message
         */
        send: {
          parameters: {
            prompt: { type: "string" }
          }
        }
      }
    },

// ============================
// Lifecycle
// ============================

    init: function() {
      // Call parent init
      if (AiMenuButton.prototype.init) {
        AiMenuButton.prototype.init.apply(this, arguments);
      }

      this.setIcon("e174");
      this.setAction("chat");
      this.setTooltip("Open Chat");
      this.setDraggable(false);

      this._oDialog = null;
      this._oInput = null;
      this._oMessagesBox = null;
      this._oScrollContainer = null;
      this._bDialogPositioned = false;
      this._oDialogPosition = null;
      
      // Attach to press event to open chat
      this.attachPress(this._onChatPress.bind(this));
    },

    exit: function() {
      if (this._oDialog) {
        this._oDialog.destroy();
        this._oDialog = null;
      }
      this._oInput = null;
      this._oMessagesBox = null;
      this._oScrollContainer = null;
      this._bDialogPositioned = false;
      this._oDialogPosition = null;
      
      // Call parent exit
      if (AiMenuButton.prototype.exit) {
        AiMenuButton.prototype.exit.apply(this, arguments);
      }
    },

    /**
     * Append a chat message bubble to the conversation
     */
    _addMessage: function(sRole, sText) {
      if (!this._oMessagesBox) {
        return;
      }

      const bUser = sRole === "user";

      const oBubbleText = new Text({
        text: sText,
        wrapping: true
      }).addStyleClass("aiBubbleText");

      const oBubble = new VBox({
        items: [oBubbleText],
        renderType: "Bare"
      })
        .addStyleClass("aiBubble")
        .addStyleClass(bUser ? "aiBubbleUser" : "aiBubbleAi");

      const oRow = new HBox({
        width: "100%",
        justifyContent: bUser ? "End" : "Start",
        items: [oBubble]
      })
        .addStyleClass("aiMsgRow")
        .addStyleClass(bUser ? "aiMsgUser" : "aiMsgAi");

      const bStickToBottom = this._isAtBottom();
      this._oMessagesBox.addItem(oRow);
      this._scrollToBottom(bStickToBottom);
    },

    /**
     * Get the scrollable DOM element of the chat messages
     */
    _getScrollEl: function() {
      if (!this._oScrollContainer) {
        return null;
      }
      const oDomRef = this._oScrollContainer.getDomRef();
      if (!oDomRef) {
        return null;
      }
      return oDomRef.querySelector(".sapMScrollCont") || oDomRef;
    },

    /**
     * Check if the chat is scrolled to the bottom
     */
    _isAtBottom: function(iThresholdPx) {
      const oScroll = this._getScrollEl();
      if (!oScroll) {
        return true;
      }
      const iThreshold = typeof iThresholdPx === "number" ? iThresholdPx : 24;
      return (oScroll.scrollTop + oScroll.clientHeight) >= (oScroll.scrollHeight - iThreshold);
    },

    /**
     * Scroll the chat to the bottom of the message list
     */
    _scrollToBottom: function(bForce) {
      if (!this._oScrollContainer) {
        return;
      }
      if (!bForce && !this._isAtBottom()) {
        return;
      }
      requestAnimationFrame(function() {
        const oScroll = this._getScrollEl();
        if (!oScroll) {
          return;
        }
        oScroll.scrollTop = oScroll.scrollHeight;
      }.bind(this));
    },

// ============================
// Chat Functionality
// ============================

    /**
     * Handle button press to open chat dialog
     */
    _onChatPress: function() {
      this.openChat();
    },

    /**
     * Open the chat dialog or close it if already open
     */
    openChat: function() {
      // If dialog is already open, close it
      if (this._oDialog && this._oDialog.isOpen()) {
        this.closeChat();
        return;
      }
      
      // Close the menu when opening chat
      this._closeParentMenu();
      
      if (!this._oDialog) {
        this._createDialog();
      }
      this._oDialog.open();
    },

    /**
     * Close the chat dialog
     */
    closeChat: function() {
      if (this._oDialog) {
        this._oDialog.close();
      }
    },

    /**
     * Set the response text in the chat
     */
    setResponse: function(sResponse) {
      if (sResponse == null || sResponse === "") {
        return;
      }
      if (this._oMessagesBox) {
        const aItems = this._oMessagesBox.getItems();
        if (aItems.length > 0) {
          const oLastRow = aItems[aItems.length - 1];
          if (
            oLastRow.hasStyleClass &&
            oLastRow.hasStyleClass("aiMsgAi") &&
            oLastRow.getItems &&
            oLastRow.getItems().length > 0 &&
            oLastRow.getItems()[0].hasStyleClass &&
            oLastRow.getItems()[0].hasStyleClass("aiBubbleAi") &&
            oLastRow.getItems()[0].getItems &&
            oLastRow.getItems()[0].getItems().length > 0
          ) {
            // Replace the text in the last AI bubble
            const oText = oLastRow.getItems()[0].getItems()[0];
            if (oText && oText.setText) {
              oText.setText(String(sResponse));
              this._scrollToBottom(true);
              return;
            }
          }
        }
      }
      this._addMessage("ai", String(sResponse));
    },

    /**
     * Get the current response text from the last AI message
     */
    getResponse: function() {
      if (!this._oMessagesBox) {
        return "";
      }
      const aItems = this._oMessagesBox.getItems();
      for (let i = aItems.length - 1; i >= 0; i--) {
        const oItem = aItems[i];
        const oBubble = oItem && oItem.getItems && oItem.getItems()[0];
        const oText = oBubble && oBubble.getItems && oBubble.getItems()[0];
        if (oItem.hasStyleClass && oItem.hasStyleClass("aiMsgAi") && oText && oText.getText) {
          return oText.getText();
        }
      }
      return "";
    },

    /**
     * Clear all messages from the chat
     */
    clearResponse: function() {
      if (this._oMessagesBox) {
        this._oMessagesBox.removeAllItems();
      }
    },

    /**
     * Handle send button press to submit user message
     */
    _onSendPress: function() {
      const sPrompt = this._oInput.getValue();
      
      if (!sPrompt || sPrompt.trim() === "") {
        return;
      }

      this._addMessage("user", sPrompt);

      this.fireSend({
        prompt: sPrompt
      });

      this._oInput.setValue("");
    },

// ============================
// Dialog / UI Creation
// ============================

    /**
     * Create the chat dialog UI with all components
     */
    _createDialog: function() {
      const that = this;

      this._oInput = new TextArea({
        placeholder: this.getPlaceholder(),
        width: "100%",
        growing: true,
        growingMaxLines: 3,
        valueLiveUpdate: true
      })
        .addStyleClass("aiChatInput")
        .setLayoutData(new FlexItemData({
          growFactor: 1,
          shrinkFactor: 1,
          baseSize: "0%"
        }));

      this._oInput.addEventDelegate({
        onAfterRendering: function() {
          const oDomRef = this.getDomRef();
          const oTextArea = oDomRef && oDomRef.querySelector("textarea");
          if (!oTextArea) {
            return;
          }

          if (oTextArea.__aiChatBound) {
            return;
          }
          oTextArea.__aiChatBound = true;

          oTextArea.addEventListener("keydown", function(e) {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              that._onSendPress();
            }
          });
        }
      }, this._oInput);

      const oSendButton = new Button({
        icon: "sap-icon://paper-plane",
        type: "Emphasized",
        width: "2.75rem",
        press: function() {
          that._onSendPress();
        }
      })
        .addStyleClass("aiChatSendButton")
        .setLayoutData(new FlexItemData({
          growFactor: 0,
          shrinkFactor: 0
        }));

      this._oMessagesBox = new VBox({
        width: "100%",
        renderType: "Bare"
      }).addStyleClass("aiChatMessagesBox");

      this._oScrollContainer = new ScrollContainer({
        width: "100%",
        height: "82%",
        vertical: true,
        content: this._oMessagesBox
      })
        .addStyleClass("aiChatMessages")
        .setLayoutData(new FlexItemData({
          growFactor: 1,
          shrinkFactor: 1,
          baseSize: "0%"
        }));

      const oScrollContainer = this._oScrollContainer;

      const oInputRow = new HBox({
        width: "100%",
        alignItems: "Center",
        items: [this._oInput, oSendButton]
      }).addStyleClass("aiChatInputRow");

      const oVBox = new VBox({
        height: "100%",
        fitContainer: true,
        items: [
          oScrollContainer,
          oInputRow
        ]
      }).addStyleClass("aiDialogContent");

      const oCloseButton = new Button({
        icon: "sap-icon://decline",
        press: function() {
          that._oDialog.close();
        }
      });

      const oHeader = new Bar({
        contentMiddle: [
          new sap.m.Title({
            text: this.getChatWindowTitle()
          })
        ],
        contentRight: [oCloseButton]
      });

      this._oDialog = new Dialog({
        customHeader: oHeader,
        draggable: true,
        resizable: true,
        verticalScrolling: false,
        horizontalScrolling: false,
        contentWidth: this.getChatWindowWidth(),
        contentHeight: this.getChatWindowHeight(),
        content: oVBox,
        beforeOpen: function() {
          // Hide dialog initially to prevent flash in center
          const oDialogDomRef = that._oDialog.getDomRef();
          if (oDialogDomRef) {
            oDialogDomRef.style.opacity = "0";
            oDialogDomRef.style.transition = "opacity 0.15s ease-in-out";
          }
        },
        afterOpen: function() {
          if (!that._bDialogPositioned) {
            that._positionDialogBottomRight();
            that._bDialogPositioned = true;
          }
          const oDialogDomRef = that._oDialog.getDomRef();
          if (oDialogDomRef) {
            requestAnimationFrame(function() {
              oDialogDomRef.style.opacity = "1";
            });
          }
          // Apply send button color/gradient based on this button's background gradient
          that._applySendButtonStyle();

          // Initial greeting (only once)
          if (that._oMessagesBox && that._oMessagesBox.getItems().length === 0) {
            that._addMessage("ai", "Hi, how can I help you?");
          }
        },
        afterClose: function() {
          that._bDialogPositioned = false;
        }
      });

      this._oDialog.addStyleClass("aiChatDialogHidden");
      this._oDialog.addStyleClass("aiChatDialog");

      this._injectChatDialogStyles();

      this.addDependent(this._oDialog);
    },
    
    /**
     * Position dialog at bottom right of viewport
     */
    _positionDialogBottomRight: function() {
      if (this._oDialog) {
        const oDomRef = this._oDialog.getDomRef();
        if (oDomRef) {
          const iViewportHeight = window.innerHeight;
          const iViewportWidth = window.innerWidth;
          const iDialogHeight = oDomRef.offsetHeight;
          const iDialogWidth = oDomRef.offsetWidth;
          
          const iBottom = 96;
          const iRight = 32;
          
          const iTop = iViewportHeight - iDialogHeight - iBottom;
          const iLeft = iViewportWidth - iDialogWidth - iRight;
          
          this._oDialogPosition = { top: iTop, left: iLeft };
          
          this._applyPosition();
        }
      }
    },

    /**
     * Apply stored position coordinates to dialog DOM element
     */
    _applyPosition: function() {
      if (this._oDialog && this._oDialogPosition) {
        const oDomRef = this._oDialog.getDomRef();
        if (oDomRef) {
          oDomRef.style.top = this._oDialogPosition.top + "px";
          oDomRef.style.left = this._oDialogPosition.left + "px";
          oDomRef.style.bottom = "auto";
          oDomRef.style.right = "auto";
          oDomRef.style.transform = "none";
        }
      }
    },

    /**
     * Apply the send button style to match the main button gradient/color
     */
    _applySendButtonStyle: function() {
      const sGradient = this.getBackgroundGradient();
      const sBrand = ThemingParameters && ThemingParameters.get ? ThemingParameters.get({ name: "sapBrandColor" }) : "#1661BE";
      const sStyle = sGradient || sBrand || "#1661BE";

      if (this._oDialog) {
        const oDomRef = this._oDialog.getDomRef();
        if (oDomRef) {
          const oBtnInner = oDomRef.querySelector('.aiChatSendButton .sapMBtnInner');
          if (oBtnInner) {
            oBtnInner.style.background = sStyle;
            oBtnInner.style.color = "#ffffff";
            oBtnInner.style.border = "none";
            oBtnInner.style.boxShadow = "0 2px 4px rgba(0,0,0,0.08)";
          }
        }
      }
    },

    /**
     * Inject CSS styles for chat dialog layout and appearance
     */
    _injectChatDialogStyles: function() {
      if (document.getElementById("aiChatDialogStyles")) {
        return;
      }

      const oStyle = document.createElement("style");
      oStyle.id = "aiChatDialogStyles";
      oStyle.textContent = `
        .aiChatDialog .sapMDialogScroll,
        .aiChatDialog .sapMDialogScrollCont,
        .aiChatDialog .sapMDialogSection {
          height: 100% !important;
        }

        .aiChatDialog .sapMDialogScrollCont,
        .aiChatDialog .sapMDialogSection {
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        .aiChatDialog .sapMDialogScroll,
        .aiChatDialog .sapMDialogScrollCont,
        .aiChatDialog .sapMDialogSection {
          overflow: hidden !important;
        }

        .aiDialogContent {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .aiChatMessages {
          flex: 1 1 auto;
          min-height: 0; 
          overflow: hidden;
          box-sizing: border-box;
        }

        .aiChatMessages .sapMScrollCont {
          height: 100% !important;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        .aiChatMessagesBox {
          padding: 0.75rem;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .aiMsgRow {
          width: 100%;
        }

        .aiBubble {
          max-width: 78%;
          padding: 0.6rem 0.75rem;
          border-radius: 0.85rem;
          box-shadow: 0 1px 2px rgba(0,0,0,0.08);
          border: 1px solid var(--sapGroup_ContentBorderColor, rgba(0,0,0,0.06));
          box-sizing: border-box;
          word-break: break-word;
        }

        .aiBubbleUser {
          background: var(--sapButton_Lite_Background, rgba(255,255,255,0.92));
        }

        .aiBubbleAi {
          background: var(--sapList_Background, rgba(240,240,240,0.95));
        }

        .aiBubbleText {
          line-height: 1.35;
        }

        .aiChatDialogHidden {
          opacity: 0;
          transition: opacity 0.15s ease-in-out;
        }

        /* Prevent dialog from being centered by transform */
        .aiChatDialogHidden .sapMDialog {
          transform: none !important;
        }

        .aiChatInputRow {
          width: 100%;
          display: flex;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          align-items: center;
          border-top: 1px solid var(--sapGroup_ContentBorderColor, rgba(0,0,0,0.08));
          box-sizing: border-box;
          background: var(--sapGroup_ContentBackground, transparent);
          flex: 0 0 auto;
          position: sticky;
          bottom: 0;
          z-index: 2;
        }

        .aiChatInput {
          min-width: 0; /* prevents overflow in flex layouts */
          width: 100%;
        }
        .aiChatInput textarea {
          resize: none;
          overflow-y: auto;
        }

        .aiChatSendButton {
          flex: 0 0 auto;
        }

        .aiChatSendButton .sapMBtnInner {
          width: 2rem;
          height: 2rem;
          min-width: 2rem;
          border-radius: 9999px;
          padding: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .aiChatSendButton .sapMBtnIcon {
          font-size: 1.1rem;
          line-height: 1;
        }
      `;
      document.head.appendChild(oStyle);
    },

    /**
     * Close the parent AiAssistantCore menu
     */
    _closeParentMenu: function() {
      let oParent = this.getParent();
      oParent._closeMenu();
    }

  });
});