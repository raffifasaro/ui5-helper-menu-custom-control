sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "demo/control/AiChatButton",
    "demo/control/AiTranslateButton",
    "demo/control/AiInsightsButton",
    "sap/ui/core/Theming"
], function (Controller, MessageToast, AiChatButton, AiTranslateButton, AiInsightsButton, Theming) {
    "use strict";

    return Controller.extend("demo.controller.Dashboard", {

        onInit: function () {
            console.log("Controller loaded!");
            
            if (!Theming.getTheme().includes("dark")) {
                Theming.setTheme("sap_horizon_dark");
            }
            this._isDarkMode = true;
            this._updateThemeIcon();
            this._updateBodyClass();

            this._oAiAssistant = this.byId("aiAssistantControl");
            
            if (this._oAiAssistant) {
                // Disable theme colors and use default blue gradient
                this._oAiAssistant.setUseThemeColors(false);

                // Set the OData model for AI (default provider is SAP AI Core)
                this._oAiAssistant.setAiModel(this.getOwnerComponent().getModel());
                
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
            this._configureCharts();
            this._updateThemeIcon();
            this._updateBodyClass();
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
                // Custom gradient for insights button (golden/amber theme)
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

            // Show loading message
            this._oChatButton.setResponse("Processing your request...");

            try {
                // Control handles everything - no OData boilerplate!
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
         * Handle AI request lifecycle events
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
            MessageToast.show("AI request failed");
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
        },

        /**
         * Toggle between SAP Horizon Dark and Light theme
         */
        onToggleTheme: function () {
            this._isDarkMode = !this._isDarkMode;
            
            if (this._isDarkMode) {
                Theming.setTheme("sap_horizon_dark");
                MessageToast.show("Dark Mode aktiviert");
            } else {
                Theming.setTheme("sap_horizon");
                MessageToast.show("Light Mode aktiviert");
            }
            this._updateThemeIcon();
            this._updateBodyClass();
            this._applyChartThemeColors(this.byId("idLineChart"), this.byId("idPieChart"));
        },

        /**
         * Update body class for CSS dark mode targeting
         */
        _updateBodyClass: function() {
            if (this._isDarkMode) {
                document.body.classList.add("dark-mode");
                document.body.classList.remove("light-mode");
            } else {
                document.body.classList.remove("dark-mode");
                document.body.classList.add("light-mode");
            }
        },

        /**
         * Update the theme toggle button icon
         */
        _updateThemeIcon: function() {
            const oBtn = this.byId("btnThemeToggle");
            if (oBtn) {
                oBtn.setIcon(this._isDarkMode ? "sap-icon://light-mode" : "sap-icon://dark-mode");
            }
        },

        _applyChartThemeColors: function (oVizFrameLine, oVizFramePie) {
            const bDark = Theming.getTheme().includes("dark");

            const aPiePalette = bDark
                ? ["#4DB1FF", "#80CAFF", "#2A5FAD"]
                : ["#2F6FED", "#5B9FFF", "#1E4BA0"];

            const aLinePalette = bDark
                ? ["#4DB1FF"]
                : ["#2F6FED"];

            if (oVizFrameLine) {
                oVizFrameLine.setVizProperties({
                    plotArea: {
                        colorPalette: aLinePalette,
                        dataLabel: { visible: true }
                    }
                });
            }

            if (oVizFramePie) {
                oVizFramePie.setVizProperties({
                    plotArea: {
                        colorPalette: aPiePalette,
                        dataLabel: { visible: true }
                    }
                });
            }
        },

        _configureCharts: function () {
            const oVizFrameLine = this.getView().byId("idLineChart");
            const oVizFramePie = this.getView().byId("idPieChart");

            if (!oVizFrameLine || !oVizFramePie) {
                console.warn("Charts not found yet.");
                return;
            }

            // Set properties
            oVizFrameLine.setVizProperties({
                title: { visible: true, text: "Revenue Trend (6 Months)" },
                plotArea: { dataLabel: { visible: true } }
            });

            oVizFramePie.setVizProperties({
                title: { visible: true, text: "Customer Segmentation" },
                plotArea: { dataLabel: { visible: true } }
            });

            this._applyChartThemeColors(oVizFrameLine, oVizFramePie);

            // Add popovers
            const oPopOver = new sap.viz.ui5.controls.Popover({});
            oPopOver.connect(oVizFrameLine.getVizUid());
            oPopOver.connect(oVizFramePie.getVizUid());
        },
    });
});