sap.ui.define([
  "demo/control/AiMenuButton",
  "sap/m/Popover",
  "sap/m/VBox",
  "sap/m/TextArea",
  "sap/m/Select",
  "sap/ui/core/Item",
  "sap/m/Label",
  "sap/m/Button",
  "sap/m/Bar"
], function (AiMenuButton, Popover, VBox, TextArea, Select, Item, Label, Button, Bar) {
  "use strict";

  return AiMenuButton.extend("demo.control.AiTranslateButton", {
    
    renderer: "demo.control.AiMenuButtonRenderer",

    metadata: {
      properties: {
        /**
         * Set default language for translation manually
         */
        defaultLanguage: {
          type: "string",
          defaultValue: ""
        }
      },
      events: {
        translate: {
          parameters: {
            sourceText: { type: "string" },
            targetLanguage: { type: "string" },
            targetLanguageName: { type: "string" }
          }
        }
      }
    },

// ============================
// Lifecycle
// ============================

    init: function() {
      if (AiMenuButton.prototype.init) {
        AiMenuButton.prototype.init.apply(this, arguments);
      }

      this.setIcon("e28b");
      this.setAction("translate");
      this.setTooltip("Translate");
      this.setDraggable(true);
      this.setHighlightOnClick(true); 

      this._oTranslatePopover = null;
      this._oTranslationInput = null;
      this._oTranslationOutput = null;
      this._oLanguageSelect = null;
      this._bIsTranslating = false;
      
      this.attachDragStart(this._onDragStart.bind(this));
    },

    exit: function() {
      if (this._oTranslatePopover) {
        this._oTranslatePopover.destroy();
        this._oTranslatePopover = null;
      }
      this._oTranslationInput = null;
      this._oTranslationOutput = null;
      this._oLanguageSelect = null;
      
      if (AiMenuButton.prototype.exit) {
        AiMenuButton.prototype.exit.apply(this, arguments);
      }
    },

// ============================
// Drag & Drop Integration
// ============================

    /**
     * Handle drag start + notify parent core
     */
    _onDragStart: function(oEvent) {
      const oParent = this.getParent();
      if (oParent && oParent.registerDraggedButton) {
        oParent.registerDraggedButton(this);
      }
    },
  
    /**
     * Override findDropTarget for translation specific targets
     * @override
     */
    findDropTarget: function(oElement) {
      // Use parent implementation
      return AiMenuButton.prototype.findDropTarget.call(this, oElement);
    },

    /**
     * Override extractContent for translation specific extraction
     * @override
     */
    extractContent: function(oTarget) {
      return AiMenuButton.prototype.extractContent.call(this, oTarget);
    },

    /**
     * Handle translate action on dropped target
     * @override
     */
    handleAction: function(sContent, oTarget) {
      if (sContent && sContent.trim()) {
        if (!this._oTranslatePopover) {
          this._createTranslatePopover();
        }
        
        this._oTranslationInput.setValue(sContent);
        this._oTranslationOutput.setValue("");
        
        this._oTranslatePopover.openBy(oTarget);
        
        this._triggerTranslation();
      }
    },

// ============================
// Translation Flow
// ============================ 

    /**
     * Trigger translation event
     */
    _triggerTranslation: function() {
      const sContent = this._oTranslationInput.getValue();
      const sLangKey = this._oLanguageSelect.getSelectedKey();
      const sLangText = this._oLanguageSelect.getSelectedItem().getText();
      
      if (!sContent || !sContent.trim()) {
        return;
      }
      
      this._bIsTranslating = true;
      this._oTranslationOutput.setValue("Translating...");
      
      // Fire translate event so parent can handle it
      this.fireTranslate({
        sourceText: sContent,
        targetLanguage: sLangKey,
        targetLanguageName: sLangText
      });
    },

    /**
     * Set the translation result
     */
    setTranslationResult: function(sTranslation) {
      if (this._oTranslationOutput) {
        this._oTranslationOutput.setValue(sTranslation);
        this._bIsTranslating = false;
      }
    },

    isTranslating: function() {
      return this._bIsTranslating;
    },

// ============================
// Translation UI / Popover
// ============================

    _createTranslatePopover: function() {
      const that = this;
      
      // Input Area 
      this._oTranslationInput = new TextArea({
        width: "100%",
        rows: 3,
        editable: false
      });
      
      // Language Selection
      this._oLanguageSelect = new Select({
        width: "100%",
        change: function() {
          that._triggerTranslation();
        },
        items: [
          new Item({ key: "en", text: "English" }),
          new Item({ key: "de", text: "German" }),
          new Item({ key: "fr", text: "French" }),
          new Item({ key: "es", text: "Spanish" }),
          new Item({ key: "it", text: "Italian" }),
          new Item({ key: "pt", text: "Portuguese" }),
          new Item({ key: "nl", text: "Dutch" }),
          new Item({ key: "pl", text: "Polish" }),
          new Item({ key: "ru", text: "Russian" }),
          new Item({ key: "ja", text: "Japanese" }),
          new Item({ key: "zh", text: "Chinese" }),
          new Item({ key: "ko", text: "Korean" }),
          new Item({ key: "ar", text: "Arabic" }),
          new Item({ key: "hi", text: "Hindi" })
        ]
      });
      
      // Set default language
      let sDefaultLang = this.getDefaultLanguage();
      if (!sDefaultLang) {
        // Auto-detect from browser
        const sBrowserLang = navigator.language || navigator.userLanguage;
        sDefaultLang = sBrowserLang.substring(0, 2).toLowerCase();
      }
      
      // Validate and set language
      const aItems = this._oLanguageSelect.getItems();
      const bValidLang = aItems.some(function(oItem) {
        return oItem.getKey() === sDefaultLang;
      });
      
      this._oLanguageSelect.setSelectedKey(bValidLang ? sDefaultLang : "en");
      
      // Output Area
      this._oTranslationOutput = new TextArea({
        width: "100%",
        rows: 3,
        editable: false,
        placeholder: "Translation will appear here..."
      });
      
      const oVBox = new VBox({
        width: "300px",
        items: [
          new Label({ text: "Source Text", design: "Bold" }),
          this._oTranslationInput,
          new Label({ text: "Target Language", design: "Bold" }).addStyleClass("sapUiTinyMarginTop"),
          this._oLanguageSelect,
          new Label({ text: "Translation", design: "Bold" }).addStyleClass("sapUiTinyMarginTop"),
          this._oTranslationOutput
        ]
      }).addStyleClass("sapUiSmallMargin");
      
      const oCloseBtn = new Button({
        icon: "sap-icon://decline",
        type: "Transparent",
        press: function() {
          that._oTranslatePopover.close();
        }
      });
      
      const oHeader = new Bar({
        contentLeft: [
          new sap.m.Title({ text: "Translation" })
        ],
        contentRight: [oCloseBtn]
      });

      this._oTranslatePopover = new Popover({
        customHeader: oHeader,
        placement: "Auto",
        content: [oVBox],
        afterClose: function() {
          that._bIsTranslating = false;
        }
      });
      
      this.addDependent(this._oTranslatePopover);
    }

  });
});