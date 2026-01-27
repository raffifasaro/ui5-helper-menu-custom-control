# UI5 AI Assistant Menu Framework

A drag-and-drop AI assistant framework for SAP UI5 applications that enables intelligent interactions with UI elements through a floating menu system.

[![npm version](https://img.shields.io/npm/v/@raffifasaro/ui5-helper-menu.svg)](https://www.npmjs.com/package/@raffifasaro/ui5-helper-menu)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![UI5 Version](https://img.shields.io/badge/UI5-1.84%2B-blue)](https://openui5.org/)

[Features](#features) • [Demo](#demo) • [Installation](#installation) • [Quick Start](#quick-start) • [Documentation](#documentation) • [API Reference](#api-reference)

---

## Overview

The UI5 AI Assistant Menu is a custom control framework that adds AI-powered capabilities to SAP UI5 applications through a floating button interface. It enables contextual AI interactions through drag-and-drop gestures, providing a natural way to integrate AI functionality into existing applications.

### Key Capabilities

- **Floating Menu System**: Non-intrusive UI that doesn't interfere with existing layouts
- **Drag & Drop Interface**: Intuitive interaction model for applying AI actions to UI elements
- **Provider Agnostic**: Compatible with SAP AI Core, OpenAI, Anthropic Claude, or custom AI providers
- **Theme Integration**: Automatically matches SAP Fiori theme colors
- **Extensible Architecture**: Base classes for creating custom AI-powered buttons
- **Production Ready**: Enterprise-grade implementation with proper error handling

### Use Cases

- Interactive AI chat assistants embedded in applications
- Multi-language translation for international deployments
- Chart and data analysis with automated insights
- Content summarization for documents and reports
- Custom AI actions tailored to specific business requirements

---

## Features

### Core Framework

**AiAssistantCore**
- Floating menu with radial button layout
- Global drag-and-drop zone management
- Pluggable AI provider system
- Event lifecycle tracking (request start, completion, failure)
- Automatic theme color detection and gradient generation
- Smart button positioning algorithms

**AiMenuButton**
- Base class for custom AI buttons
- Configurable drag-and-drop behavior
- Visual highlighting of drop targets
- Extensible content extraction methods
- Custom CSS injection for styling

### Pre-built Components

The framework includes three production-ready AI buttons (available separately on GitHub):

**AiChatButton**
- Interactive chat dialog with message history
- Multi-turn conversation support
- Customizable window size and appearance
- Drag-and-drop context injection

**AiTranslateButton**
- Translation to 14+ languages (English, German, French, Spanish, Italian, Portuguese, Dutch, Polish, Russian, Japanese, Chinese, Korean, Arabic, Hindi)
- Automatic language detection
- Live translation preview
- Language selector with browser locale auto-detection

**AiInsightsButton**
- Automated chart analysis for SAP VizFrame components
- Statistical computation (min, max, mean, median)
- Data extraction from UI5 bindings
- Structured insights output with confidence scoring
- Support for multiple chart types (line, bar, pie, donut)

---

## Demo

### Screenshots

#### Core Framework
![Floating Menu]()
*Floating AI Assistant Menu - Radial button layout*

![Drag and Drop]()
*Drag and drop interaction with visual highlighting*

#### Custom Buttons

![Chat Interface]()
*Interactive chat dialog*

![Translation]()
*Drag and drop to translate*

![Chart Insights]()
*AI-powered chart analysis with insights popover*

---

## Installation

### Option 1: NPM Installation (Core Framework Only)

Install the package via npm:
```bash
npm install @raffifasaro/ui5-helper-menu
```

**Configure your UI5 application to use the library:**

Add the library to your `manifest.json`:
```json
{
  "sap.ui5": {
    "dependencies": {
      "libs": {
        "helper.menu": {}
      }
    },
    "resourceRoots": {
      "helper.menu": "./node_modules/@raffifasaro/ui5-helper-menu"
    }
  }
}
```

**Package contents:**
- `AiAssistantCore.js` - Main floating menu control
- `AiMenuButton.js` - Base class for creating custom buttons

**Not included:**
- Pre-built buttons (AiChatButton, AiTranslateButton, AiInsightsButton)
- These are available on GitHub

### Option 2: Manual Installation (Complete Framework)

Download the complete framework including all pre-built buttons.

#### Step 1: Download Source Files

**Download ZIP:**
1. Navigate to [GitHub repository](https://github.com/raffifasaro/ui5-helper-menu-custom-control)
2. Click "Code" > "Download ZIP"
3. Extract the contents of the `CoreCustomControls` folder
4. For the pre-built buttons, have a look at the `CustomButtons` folder

**Or clone repository:**
```bash
git clone https://github.com/raffifasaro/ui5-helper-menu-custom-control.git
```

#### Step 2: Project Structure

Copy the button controls to your UI5 application:
```
webapp/
├── control/
│   ├── AiAssistantCore.js
│   ├── AiMenuButton.js
│   ├── AiChatButton.js              (optional)
│   ├── AiTranslateButton.js         (optional)
│   └── AiInsightsButton.js          (optional)
├── controller/
│   └── Your.controller.js
├── view/
│   └── Your.view.xml
└── manifest.json
```

#### Step 3: Configuration

No manifest changes required if controls are in `webapp/control/`. Standard UI5 namespace resolution will work.

---

## Quick Start

### Basic Implementation

**1. Initialize in controller:**
```javascript
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "yourApp/control/AiChatButton",
    "yourApp/control/AiTranslateButton",
    "yourApp/control/AiInsightsButton",
    "yourApp/control/AiAssistantCore",
    "yourApp/control/AiMenuButton"
], function (Controller, AiChatButton, AiTranslateButton, AiInsightsButton, AiAssistantCore, AiMenuButton) {
    "use strict";

    return Controller.extend("yourApp.controller.Main", {
        onInit: function () {
            this._oAiAssistant = this.byId("aiAssistantControl");
            
            if (this._oAiAssistant) {
                
                // Set the OData model for AI (default provider is SAP AI Core)
                this._oAiAssistant.setAiModel(this.getOwnerComponent().getModel());
                
                // Optional: Register custom providers
                //this._registerCustomProviders();
                
                // Init buttons
                this._initializeChatButton();
                this._initializeTranslateButton();
                this._initializeInsightsButton();
                
                // Attach to action performed event for drag drop actions
                this._oAiAssistant.attachEvent("actionPerformed", this.onActionPerformed.bind(this));
                this._oAiAssistant.attachEvent("aiRequestStarted", this.onAiRequestStarted.bind(this));
                this._oAiAssistant.attachEvent("aiRequestCompleted", this.onAiRequestCompleted.bind(this));
                this._oAiAssistant.attachEvent("aiRequestFailed", this.onAiRequestFailed.bind(this));
            }
        },

        onAfterRendering: function() {
        },

        /**
         * Register custom AI providers (optional)
         */
        _registerCustomProviders: function() {
            // Register OpenAI provider
            /*
            this._oAiAssistant.registerAiProvider("openai", {
                name: "OpenAI GPT-4",
                sendPrompt: async function(sPrompt, mOptions) {
                    const oResponse = await fetch("https://api.openai.com/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Bearer YOUR_API_KEY"
                        },
                        body: JSON.stringify({
                            model: "gpt-4",
                            messages: [{ role: "user", content: sPrompt }],
                            max_tokens: mOptions?.maxTokens || 1000
                        })
                    });
                    
                    const oData = await oResponse.json();
                    return oData.choices[0].message.content;
                }
            });
            
            // Switch to OpenAI
            this._oAiAssistant.setActiveAiProvider("openai");
            */
            
            // Register Anthropic Claude provider
            /*
            this._oAiAssistant.registerAiProvider("anthropic", {
                name: "Anthropic Claude",
                sendPrompt: async function(sPrompt, mOptions) {
                    const oResponse = await fetch("https://api.anthropic.com/v1/messages", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "x-api-key": "YOUR_API_KEY",
                            "anthropic-version": "2023-06-01"
                        },
                        body: JSON.stringify({
                            model: "claude-sonnet-4-20250514",
                            max_tokens: mOptions?.maxTokens || 1000,
                            messages: [{ role: "user", content: sPrompt }]
                        })
                    });
                    
                    const oData = await oResponse.json();
                    return oData.content[0].text;
                }
            });
            */
        },

        /**
         * Init chat button
         */
        _initializeChatButton: function() {
            this._oChatButton = new AiChatButton({
                chatWindowTitle: "AI Assistant",
                placeholder: "Ask me anything...",
                chatWindowWidth: "400px",
                chatWindowHeight: "400px", 
                // Set custom gradient for button
                backgroundGradient: "linear-gradient(135deg, #11998e 0%, #38ef7d 70%)",

                send: this.onChatSend.bind(this)
            });
            
            this._oAiAssistant.addMenuButton(this._oChatButton);
        },

        /**
         * Init translate button
         */
        _initializeTranslateButton: function() {
            this._oTranslateButton = new AiTranslateButton({
                defaultLanguage: "en",
                translate: this.onTranslate.bind(this)
            });
            
            this._oAiAssistant.addMenuButton(this._oTranslateButton);
        },

        /**
         * Init insights button for chart analysis
         */
        _initializeInsightsButton: function() {
            this._oInsightsButton = new AiInsightsButton({
                backgroundGradient: "linear-gradient(135deg, #FFB400 0%, #FF8C00 70%)",
                insightsRequest: this.onInsightsRequest.bind(this)
            });
            
            this._oAiAssistant.addMenuButton(this._oInsightsButton);
        },

        /**
         * Handle chat send event
         */
        onChatSend: async function(oEvent) {
            const sPrompt = oEvent.getParameter("prompt");
            
            if (!sPrompt || sPrompt.trim() === "") {
                return;
            }

            this._oChatButton.setResponse("Processing your request...");

            try {
                const sResponse = await this._oAiAssistant.sendPrompt(sPrompt);
                this._oChatButton.setResponse(sResponse || "No response received.");
            } catch (oError) {
                this._oChatButton.setResponse(
                    "Sorry, an error occurred while processing your request. Please try again."
                );
            }
        },

        /**
         * Handle translate event
         */
        onTranslate: async function(oEvent) {
            const sSourceText = oEvent.getParameter("sourceText");
            const sTargetLangName = oEvent.getParameter("targetLanguageName");
            
            const sPrompt = `Translate the following text to ${sTargetLangName}: "${sSourceText}". Only provide the translation, no explanation.`;
            
            try {
                const sTranslation = await this._oAiAssistant.sendPrompt(sPrompt);
                this._oTranslateButton.setTranslationResult(sTranslation || "Translation failed.");
            } catch (oError) {
                this._oTranslateButton.setTranslationResult("Translation failed. Please try again.");
            }
        },

        /**
         * Handle insights request event
         */
        onInsightsRequest: async function (oEvent) {
            const sPrompt = oEvent.getParameter("prompt");
            const sChartId = oEvent.getParameter("chartId");
            const sChartTitle = oEvent.getParameter("chartTitle");

            console.log("Insights requested for chart:", sChartId, sChartTitle);

            try {
                const sInsights = await this._oAiAssistant.sendPrompt(sPrompt);
                
                if (sInsights) {
                    this._oInsightsButton.setInsightsResult(sInsights);
                } else {
                    this._oInsightsButton.setInsightsError("No insights received from the AI service.");
                }
            } catch (oError) {
                this._oInsightsButton.setInsightsError(
                    "Insights could not be loaded. Please try again."
                );
            }
        },

        /**
         * Handle AI request start lifecycle event
         * Shows global loading indicator while the AI processes the request.
         * Pairs with onAiRequestCompleted/onAiRequestFailed to remove the indicator.
         */
        onAiRequestStarted: function(oEvent) {
            const sPrompt = oEvent.getParameter("prompt");
            console.log("AI Request started:", sPrompt);
            this.getView().setBusy(true);
        },

        onAiRequestCompleted: function(oEvent) {
            const sResponse = oEvent.getParameter("response");
            console.log("AI Request completed:", sResponse.substring(0, 100) + "...");
            this.getView().setBusy(false);
        },

        onAiRequestFailed: function(oEvent) {
            const oError = oEvent.getParameter("error");
            console.error("AI Request failed:", oError);
            this.getView().setBusy(false);
            sap.m.MessageToast.show("AI request failed");
        },

        /**
         * Log action performed event from drag drop
         */
        onActionPerformed: function(oEvent) {
            const sAction = oEvent.getParameter("action");
            const sContent = oEvent.getParameter("content");
            const oTargetElement = oEvent.getParameter("targetElement");
            
            console.log("Action performed:", {
                action: sAction,
                content: sContent,
                target: oTargetElement
            });
        }
    });
});
```

**2. Add control to view:**
```xml
<mvc:View
    controllerName="yourApp.controller.Main"
    xmlns:mvc="sap.ui.core.mvc"
    xmlns:custom="yourApp.control">

    <Page id="yourPage">
        <!-- Your page content -->
    </Page>

    <!-- Custom control init in view -->
    <custom:AiAssistantCore id="aiAssistantControl"/>
</mvc:View>
```

---

## Creating Custom AI Buttons

### Example 1: Simple Summary Button
```javascript
sap.ui.define([
  "your/app/control/AiMenuButton"
], function (AiMenuButton) {
  "use strict";

  return AiMenuButton.extend("your.app.control.MySummaryButton", {
    
    renderer: "your.app.control.AiMenuButtonRenderer",

    metadata: {
      properties: {
        maxLength: { type: "int", defaultValue: 100 }
      },
      events: {
        summarize: {
          parameters: {
            text: { type: "string" },
            summary: { type: "string" }
          }
        }
      }
    },

    init: function() {
      if (AiMenuButton.prototype.init) {
        AiMenuButton.prototype.init.apply(this, arguments);
      }

      this.setIcon("e1ca");
      this.setAction("summarize");
      this.setTooltip("Summarize Text");
      this.setDraggable(true);
      this.setHighlightOnClick(true);
    },

    /**
     * Handle action when button is dropped on target
     * @override
     */
    handleAction: function(sContent, oTarget) {
      const oParent = this.getParent();
      const sPrompt = `Summarize the following text in ${this.getMaxLength()} characters or less: "${sContent}"`;
      
      oParent.sendPrompt(sPrompt).then(function(sSummary) {
        this.fireSummarize({
          text: sContent,
          summary: sSummary
        });
      }.bind(this));
    }
  });
});
```

### Example 2: Advanced Analysis Button with Custom UI
```javascript
sap.ui.define([
  "your/app/control/AiMenuButton",
  "sap/m/Popover",
  "sap/m/VBox",
  "sap/m/TextArea",
  "sap/m/Button",
  "sap/m/Bar",
  "sap/m/Title"
], function (AiMenuButton, Popover, VBox, TextArea, Button, Bar, Title) {
  "use strict";

  return AiMenuButton.extend("your.app.control.MyAnalysisButton", {
    
    renderer: "your.app.control.AiMenuButtonRenderer",

    init: function() {
      if (AiMenuButton.prototype.init) {
        AiMenuButton.prototype.init.apply(this, arguments);
      }

      this.setIcon("e0c5");
      this.setAction("analyze");
      this.setTooltip("Analyze Content");
      this.setDraggable(true);
      
      this._oPopover = null;
      this._oResultArea = null;
    },

    /**
     * Restrict targets to tables and lists only
     * @override
     */
    getAllTargetableElements: function() {
      return Array.from(document.querySelectorAll(
        ".sapMList, .sapMTable, .sapUiTable"
      )).filter(oEl => oEl.offsetParent !== null);
    },

    /**
     * Custom highlight color
     * @override
     */
    getHighlightCSS: function() {
      return `
        .ai-highlight-target {
          outline: 3px dashed #00FF00 !important;
          outline-offset: 4px;
          background-color: rgba(0, 255, 0, 0.1) !important;
        }
      `;
    },

    /**
     * Extract table data as text
     * @override
     */
    extractContent: function(oTarget) {
      const aRows = oTarget.querySelectorAll("tr");
      const aContent = [];
      
      aRows.forEach(function(oRow) {
        const aCells = oRow.querySelectorAll("td");
        const aRowData = Array.from(aCells).map(c => c.textContent.trim());
        aContent.push(aRowData.join(" | "));
      });
      
      return aContent.join("\n");
    },

    handleAction: function(sContent, oTarget) {
      if (!this._oPopover) {
        this._createPopover();
      }
      
      this._oResultArea.setValue("Analyzing...");
      this._oPopover.openBy(oTarget);
      
      const sPrompt = `Analyze this table data:\n${sContent}`;
      
      this.getParent().sendPrompt(sPrompt).then(function(sResult) {
        this._oResultArea.setValue(sResult);
      }.bind(this));
    },

    _createPopover: function() {
      this._oResultArea = new TextArea({
        width: "400px",
        rows: 10,
        editable: false
      });

      const oCloseBtn = new Button({
        icon: "sap-icon://decline",
        press: () => this._oPopover.close()
      });

      this._oPopover = new Popover({
        customHeader: new Bar({
          contentLeft: [new Title({ text: "Analysis Results" })],
          contentRight: [oCloseBtn]
        }),
        content: new VBox({
          items: [this._oResultArea]
        }).addStyleClass("sapUiSmallMargin")
      });
      
      this.addDependent(this._oPopover);
    }
  });
});
```

### Extension Points

Override these methods to customize button behavior:

| Method | Purpose | Default Behavior |
|--------|---------|------------------|
| `getAllTargetableElements()` | Define targetable UI elements | Returns inputs, textareas, lists, labels |
| `findDropTarget(oElement)` | Validate drop target | Walks DOM tree to find valid targets |
| `extractContent(oTarget)` | Extract data from target | Gets input values or textContent |
| `handleAction(sContent, oTarget)` | Execute AI action | Empty - must implement |
| `getHighlightCSS()` | Custom highlight styling | Blue dashed outline |
| `getHighlightStyleId()` | Unique style element ID | "aiMenuButtonHighlightStyles" |

---

## AI Provider Configuration

### SAP AI Core (Default Provider)
```javascript
onInit: function() {
    this._oAiAssistant = this.byId("aiAssistantControl");
    
    // Set OData model pointing to AI Core service
    this._oAiAssistant.setAiModel(this.getOwnerComponent().getModel());
    
    // Optional: customize action path
    this._oAiAssistant.setAiActionPath("/callLLM(...)");
}
```

#### Prepare Hybrid Mode
- Log in: `cf login -a <endpoint> -sso`
- Bind the app to the destination service: `cds bind -2 <destination-service-name>`


### OpenAI Integration
```javascript
this._oAiAssistant.registerAiProvider("openai", {
    name: "OpenAI GPT-4",
    sendPrompt: async function(sPrompt, mOptions) {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer YOUR_API_KEY"
            },
            body: JSON.stringify({
                model: "gpt-4",
                messages: [{ role: "user", content: sPrompt }],
                max_tokens: mOptions?.maxTokens || 1000
            })
        });
        
        const data = await response.json();
        return data.choices[0].message.content;
    }
});

// Switch active provider
this._oAiAssistant.setActiveAiProvider("openai");
```

### Anthropic Claude Integration
```javascript
this._oAiAssistant.registerAiProvider("anthropic", {
    name: "Anthropic Claude",
    sendPrompt: async function(sPrompt, mOptions) {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": "YOUR_API_KEY",
                "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: mOptions?.maxTokens || 1000,
                messages: [{ role: "user", content: sPrompt }]
            })
        });
        
        const data = await response.json();
        return data.content[0].text;
    }
});

this._oAiAssistant.setActiveAiProvider("anthropic");
```

### Custom Provider
```javascript
this._oAiAssistant.registerAiProvider("custom", {
    name: "My Custom AI",
    sendPrompt: async function(sPrompt, mOptions) {
        // Your implementation
        const response = await yourAiService.call(sPrompt, mOptions);
        return response.text;
    }
});
```

---

## Customization

### Theme Colors
```javascript
// Use SAP theme colors (default)
this._oAiAssistant.setUseThemeColors(true);

// Disable theme colors (use default blue gradient)
this._oAiAssistant.setUseThemeColors(false);

// Custom gradient for main button
this._oAiAssistant.setMainButtonGradient(
    "linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 70%)"
);

// Custom gradients for all buttons
this._oAiAssistant.setMainButtonGradient(
    "linear-gradient(135deg, #667eea 0%, #764ba2 70%)"
);
this._oAiAssistant.setMenuButtonGradient(
    "linear-gradient(135deg, #f093fb 0%, #f5576c 70%)"
);
```

### Individual Button Styling
```javascript
const oChatButton = new AiChatButton({
    backgroundGradient: "linear-gradient(135deg, #11998e 0%, #38ef7d 70%)",
    chatWindowTitle: "Support Assistant",
    chatWindowWidth: "500px",
    chatWindowHeight: "600px"
});
```

### Button Positioning
```javascript
const oButton = new AiMenuButton({
    positionX: -100,  // Custom X offset in pixels
    positionY: -80,   // Custom Y offset in pixels
    icon: "e024",
    action: "custom"
});

// Automatic radial positioning when both are 0
```

---

## API Reference

### AiAssistantCore

#### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `useThemeColors` | boolean | true | Auto-detect and use SAP theme colors |
| `mainButtonGradient` | string | "" | Custom CSS gradient for main button |
| `menuButtonGradient` | string | "" | Custom CSS gradient for menu buttons |
| `activeAiProvider` | string | "default" | Active AI provider ID |
| `aiModel` | object | null | OData model for SAP AI Core |
| `aiActionPath` | string | "/callLLM(...)" | OData action path for AI requests |

#### Aggregations

| Aggregation | Type | Cardinality | Description |
|-------------|------|-------------|-------------|
| `menuButtons` | AiMenuButton | 0..n | Custom menu buttons |

#### Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `actionPerformed` | action, targetElement, content, event | Fired when drag-drop action completes |
| `aiRequestStarted` | prompt | Fired when AI request begins |
| `aiRequestCompleted` | response | Fired when AI request succeeds |
| `aiRequestFailed` | error | Fired when AI request fails |

#### Methods
```javascript
// Send prompt to active AI provider
sendPrompt(sPrompt, mOptions) : Promise

// Register custom AI provider
registerAiProvider(sId, oProvider) : this

// Get list of registered provider IDs
getAiProviderIds() : string[]

// Add menu button
addMenuButton(oButton) : this

// Remove menu button
removeMenuButton(oButton) : AiMenuButton

// Get all menu buttons
getMenuButtons() : AiMenuButton[]
```

### AiMenuButton

#### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `icon` | string | "e024" | SAP icon code (numeric part only) |
| `action` | string | "" | Action identifier |
| `tooltip` | string | "" | Button tooltip text |
| `draggable` | boolean | true | Enable drag functionality |
| `positionX` | int | 0 | X position offset in pixels |
| `positionY` | int | 0 | Y position offset in pixels |
| `backgroundGradient` | string | "" | Custom CSS gradient |
| `highlightOnClick` | boolean | true | Enable click-to-highlight |

#### Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `dragStart` | originalEvent | Fired when drag starts |
| `press` | originalEvent | Fired when button clicked |

#### Methods (Override in Subclasses)
```javascript
// Get all targetable elements on page
getAllTargetableElements() : Element[]

// Find drop target from element
findDropTarget(oElement) : {targetElement, visualElement} | null

// Extract content from target
extractContent(oTarget) : string

// Handle action on drop
handleAction(sContent, oTarget) : void

// Get CSS for highlighting
getHighlightCSS() : string

// Get unique style element ID
getHighlightStyleId() : string
```

---

## Pre-built Buttons Reference

### AiChatButton

Interactive chat interface with message history.

#### Additional Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `chatWindowTitle` | string | "AI Assistant" | Dialog title |
| `placeholder` | string | "Ask me anything..." | Input placeholder |
| `chatWindowWidth` | CSSSize | "500px" | Dialog width |
| `chatWindowHeight` | CSSSize | "400px" | Dialog height |

#### Events
```javascript
send: {
    parameters: {
        prompt: string  // User message text
    }
}
```

#### Methods
```javascript
// Open chat dialog
openChat() : void

// Close chat dialog
closeChat() : void

// Set AI response (updates or creates new message)
setResponse(sResponse) : void

// Get current AI response text
getResponse() : string

// Clear all chat messages
clearResponse() : void
```

#### Usage Example
```javascript
const oChatButton = new AiChatButton({
    chatWindowTitle: "Support Assistant",
    placeholder: "How can I help you?",
    chatWindowWidth: "450px",
    chatWindowHeight: "500px",
    send: this.onChatSend.bind(this)
});

this._oAiAssistant.addMenuButton(oChatButton);

// Handler
onChatSend: async function(oEvent) {
    const sPrompt = oEvent.getParameter("prompt");
    const sResponse = await this._oAiAssistant.sendPrompt(sPrompt);
    oChatButton.setResponse(sResponse);
}
```

### AiTranslateButton

Multi-language translation with auto-detection.

#### Additional Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `defaultLanguage` | string | "" | Default target language code (auto-detected if empty) |

#### Events
```javascript
translate: {
    parameters: {
        sourceText: string,           // Original text
        targetLanguage: string,       // Language code (en, de, etc.)
        targetLanguageName: string    // Language display name
    }
}
```

#### Methods
```javascript
// Set translation result
setTranslationResult(sTranslation) : void

// Check if translation in progress
isTranslating() : boolean
```

#### Supported Languages

English (en), German (de), French (fr), Spanish (es), Italian (it), Portuguese (pt), Dutch (nl), Polish (pl), Russian (ru), Japanese (ja), Chinese (zh), Korean (ko), Arabic (ar), Hindi (hi)

#### Usage Example
```javascript
const oTranslateButton = new AiTranslateButton({
    defaultLanguage: "de",
    translate: this.onTranslate.bind(this)
});

this._oAiAssistant.addMenuButton(oTranslateButton);

// Handler
onTranslate: async function(oEvent) {
    const sText = oEvent.getParameter("sourceText");
    const sLang = oEvent.getParameter("targetLanguageName");
    
    const sPrompt = `Translate to ${sLang}: "${sText}"`;
    const sTranslation = await this._oAiAssistant.sendPrompt(sPrompt);
    
    oTranslateButton.setTranslationResult(sTranslation);
}
```

### AiInsightsButton

Chart analysis with automated insights.

#### Additional Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `chartSelector` | string | ".sapVizFrame, [class*='VizFrame']" | CSS selector for charts |

#### Events
```javascript
insightsRequest: {
    parameters: {
        chartId: string,          // Chart DOM ID
        chartType: string,        // Chart type (line, bar, pie)
        chartTitle: string,       // Chart title
        prompt: string,           // Generated AI prompt
        payload: object,          // Full chart data
        targetElement: Element    // Chart DOM element
    }
}
```

#### Methods
```javascript
// Display insights in popover
setInsightsResult(sInsights) : void

// Display error message
setInsightsError(sError) : void

// Check if insights loading
isLoading() : boolean

// Close insights popover
closeInsights() : void
```

#### Chart Data Extraction

The button automatically extracts:
- Chart type and title
- Dimension and measure names
- Data sample (first 20 rows)
- Statistical metrics (min, max, mean, median)
- Row count

#### Usage Example
```javascript
const oInsightsButton = new AiInsightsButton({
    chartSelector: ".sapVizFrame",
    insightsRequest: this.onInsightsRequest.bind(this)
});

this._oAiAssistant.addMenuButton(oInsightsButton);

// Handler
onInsightsRequest: async function(oEvent) {
    const sPrompt = oEvent.getParameter("prompt");
    
    try {
        const sInsights = await this._oAiAssistant.sendPrompt(sPrompt);
        oInsightsButton.setInsightsResult(sInsights);
    } catch (oError) {
        oInsightsButton.setInsightsError("Analysis failed");
    }
}
```

---

## Advanced Examples

### Request Lifecycle Handling
```javascript
onInit: function() {
    this._oAiAssistant = this.byId("aiAssistantControl");
    
    // Listen to AI request lifecycle
    this._oAiAssistant.attachEvent("aiRequestStarted", this.onAiRequestStarted.bind(this));
    this._oAiAssistant.attachEvent("aiRequestCompleted", this.onAiRequestCompleted.bind(this));
    this._oAiAssistant.attachEvent("aiRequestFailed", this.onAiRequestFailed.bind(this));
},

onAiRequestStarted: function(oEvent) {
    const sPrompt = oEvent.getParameter("prompt");
    console.log("AI request started:", sPrompt);
    this.getView().setBusy(true);
},

onAiRequestCompleted: function(oEvent) {
    const sResponse = oEvent.getParameter("response");
    console.log("AI request completed");
    this.getView().setBusy(false);
    sap.m.MessageToast.show("AI response received");
},

onAiRequestFailed: function(oEvent) {
    const oError = oEvent.getParameter("error");
    console.error("AI request failed:", oError);
    this.getView().setBusy(false);
    sap.m.MessageBox.error("AI request failed: " + oError.message);
}
```

### Multiple Providers with Switching
```javascript
onInit: function() {
    this._oAiAssistant = this.byId("aiAssistantControl");
    
    // Register multiple providers
    this._registerOpenAI();
    this._registerClaude();
    this._registerAzureOpenAI();
    
    // Default to SAP AI Core
    this._oAiAssistant.setActiveAiProvider("default");
},

_registerOpenAI: function() {
    this._oAiAssistant.registerAiProvider("openai", {
        name: "OpenAI GPT-4",
        sendPrompt: async function(sPrompt, mOptions) {
            // Implementation
        }
    });
},

_registerClaude: function() {
    this._oAiAssistant.registerAiProvider("claude", {
        name: "Anthropic Claude",
        sendPrompt: async function(sPrompt, mOptions) {
            // Implementation
        }
    });
},

// Switch providers dynamically
onProviderChange: function(oEvent) {
    const sProvider = oEvent.getParameter("selectedItem").getKey();
    this._oAiAssistant.setActiveAiProvider(sProvider);
    sap.m.MessageToast.show("Switched to " + sProvider);
}
```

### Custom Button with Settings Dialog
```javascript
sap.ui.define([
  "your/app/control/AiMenuButton",
  "sap/m/Dialog",
  "sap/m/VBox",
  "sap/m/Label",
  "sap/m/Input",
  "sap/m/Button"
], function (AiMenuButton, Dialog, VBox, Label, Input, Button) {
  "use strict";

  return AiMenuButton.extend("your.app.control.ConfigurableButton", {
    
    renderer: "your.app.control.AiMenuButtonRenderer",

    metadata: {
      properties: {
        promptTemplate: { type: "string", defaultValue: "Process: {content}" }
      }
    },

    init: function() {
      if (AiMenuButton.prototype.init) {
        AiMenuButton.prototype.init.apply(this, arguments);
      }

      this.setIcon("e0c7");
      this.setAction("custom");
      this.setTooltip("Custom Action (Right-click to configure)");
      
      this.attachPress(this._onPress.bind(this));
    },

    _onPress: function(oEvent) {
      // Right-click opens settings
      if (oEvent.getParameter("originalEvent").button === 2) {
        this._showSettings();
        return;
      }
      
      // Normal click behavior
    },

    _showSettings: function() {
      const oInput = new Input({
        value: this.getPromptTemplate(),
        placeholder: "Use {content} as placeholder"
      });

      const oDialog = new Dialog({
        title: "Configure Action",
        content: new VBox({
          items: [
            new Label({ text: "Prompt Template:" }),
            oInput
          ]
        }).addStyleClass("sapUiSmallMargin"),
        beginButton: new Button({
          text: "Save",
          press: function() {
            this.setPromptTemplate(oInput.getValue());
            oDialog.close();
          }.bind(this)
        }),
        endButton: new Button({
          text: "Cancel",
          press: function() {
            oDialog.close();
          }
        }),
        afterClose: function() {
          oDialog.destroy();
        }
      });

      oDialog.open();
    },

    handleAction: function(sContent, oTarget) {
      const sPrompt = this.getPromptTemplate().replace("{content}", sContent);
      
      this.getParent().sendPrompt(sPrompt).then(function(sResponse) {
        sap.m.MessageToast.show("Action completed");
      });
    }
  });
});
```

---

## Troubleshooting

### Common Issues

**Issue: Buttons not appearing**
- Verify control is added to view XML
- Check browser console for JavaScript errors
- Ensure control files are in correct directory

**Issue: Drag and drop not working**
- Check that `draggable` property is set to `true`
- Verify browser supports HTML5 drag and drop
- Check for CSS conflicts with existing styles

**Issue: AI requests failing**
- Verify AI model is set correctly
- Check API key configuration for custom providers
- Review browser network tab for error details
- Ensure CORS is configured properly for API endpoints

**Issue: Theme colors not applying**
- Verify `useThemeColors` is set to `true`
- Check that SAP theme is loaded correctly
- Try setting custom gradients as fallback

### Performance Tips

- Limit number of menu buttons to 5-7 for optimal UX
- Use debouncing for frequent AI requests
- Implement caching for repeated prompts
- Monitor API rate limits

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License

---

## Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/raffifasaro/ui5-helper-menu-custom-control/issues)

---

## Acknowledgments
- [flxenk](https://github.com/flxenk) for implementing the insight and translate buttons and helping with other components  
- [nicolasrothmund](https://github.com/nicolasrothmund) for testing and organization  
- [setenayeryasar](https://github.com/setenayeryasar) for design and prototyping
---

## Changelog

### Version 1.0.0 (Latest)
- Initial release
- Core framework with floating menu
- Three pre-built buttons (Chat, Translate, Insights)
- Multi-provider support (SAP AI Core, OpenAI, Claude)
- Theme integration
- Drag and drop functionality

---