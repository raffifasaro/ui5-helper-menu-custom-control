sap.ui.define([
  "demo/control/AiMenuButton",
  "sap/m/Popover",
  "sap/m/VBox",
  "sap/m/Text",
  "sap/m/Bar",
  "sap/m/Button",
  "sap/m/Title",
  "sap/m/Label",
  "sap/m/HBox",
  "sap/ui/core/Icon"
], function (AiMenuButton, Popover, VBox, Text, Bar, Button, Title, Label, HBox, Icon) {
  "use strict";

// ============================
// Configuration Constants
// ============================
  
  const CONFIG = {
    FLAG_MASK_PII: false,
    MAX_DATA_SAMPLE_ROWS: 20,
    RECOMMENDED_MAX_TOKENS: 400,
    CHART_SELECTOR: ".sapVizFrame, [class*='VizFrame']",
    MAX_DEPTH: 20
  };

  return AiMenuButton.extend("demo.control.AIInsightsButton", {
    
    renderer: "demo.control.AiMenuButtonRenderer",

    metadata: {
      properties: {
        /**
         * Chart selector CSS query for finding charts on page
         */
        chartSelector: {
          type: "string",
          defaultValue: CONFIG.CHART_SELECTOR
        }
      },
      events: {
        insightsRequest: {
          parameters: {
            chartId: { type: "string" },
            chartType: { type: "string" },
            chartTitle: { type: "string" },
            prompt: { type: "string" },
            payload: { type: "object" },
            targetElement: { type: "object" }
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

      this.setIcon("e11f");
      this.setAction("insights");
      this.setTooltip("AI Insights - Click to highlight charts, drag onto a chart to analyze");
      this.setDraggable(true);
      this.setHighlightOnClick(true);

      this._initializeState();
      this.attachDragStart(this._onDragStart.bind(this));
    },

    /**
     * Initialize internal state variables for the insights button
     */
    _initializeState: function() {
      this._oInsightsPopover = null;
      this._oSummaryText = null;
      this._oInsightsList = null;
      this._oConfidenceText = null;
      this._bIsLoading = false;
    },

    exit: function() {
      this._destroyPopover();
      this._clearAllHighlights();
      
      if (AiMenuButton.prototype.exit) {
        AiMenuButton.prototype.exit.apply(this, arguments);
      }
    },

    /**
     * Destroy the insights popover and clear references
     */
    _destroyPopover: function() {
      if (this._oInsightsPopover) {
        this._oInsightsPopover.destroy();
        this._oInsightsPopover = null;
      }
      this._oSummaryText = null;
      this._oInsightsList = null;
      this._oConfidenceText = null;
    },

// ============================
// After Rendering Override
// ============================

    onAfterRendering: function() {
      if (AiMenuButton.prototype.onAfterRendering) {
        AiMenuButton.prototype.onAfterRendering.apply(this, arguments);
      }
      
      const oDomRef = this.getDomRef();
      if (oDomRef && this.getDraggable()) {
        oDomRef.addEventListener("dragend", this._onDragEndHandler.bind(this));
      }
    },

// ============================
// Drag & Drop Integration
// ============================

    _onDragStart: function(oEvent) {
      const oParent = this.getParent();
      if (oParent?.registerDraggedButton) {
        oParent.registerDraggedButton(this);
      }
      
      if (!this._bShowingHighlights) {
        this._showHighlights();
      }
    },

    /**
     * Find the chart drop target from a DOM element
     * @override
     */
    findDropTarget: function(oElement) {
      if (!oElement) {
        this._clearActiveHighlight();
        return null;
      }
      
      const oTarget = this._findChartTarget(oElement);
      
      if (oTarget) {
        this._setActiveHighlight(oTarget);
        return {
          targetElement: oTarget,
          visualElement: oTarget
        };
      }
      
      this._clearActiveHighlight();
      return null;
    },

    /**
     * Traverse DOM hierarchy to find a chart element
     */
    _findChartTarget: function(oElement) {
      let oCurrent = oElement;
      let iDepth = 0;
      
      while (oCurrent && iDepth < CONFIG.MAX_DEPTH) {
        if (this._isChartElement(oCurrent)) {
          return oCurrent;
        }
        
        if (oCurrent.tagName === "SVG") {
          const oVizFrame = oCurrent.closest(".sapVizFrame");
          if (oVizFrame) return oVizFrame;
        }
        
        oCurrent = oCurrent.parentElement;
        iDepth++;
      }
      
      return null;
    },

    /**
     * Check if a DOM element is a chart element
     */
    _isChartElement: function(oElement) {
      if (!oElement.classList) return false;
      
      return oElement.classList.contains("sapVizFrame") ||
             (oElement.id && oElement.id.indexOf("VizFrame") !== -1) ||
             (oElement.tagName && oElement.tagName.toLowerCase().indexOf("viz") !== -1);
    },

    _onDragEndHandler: function() {
      this._clearActiveHighlight();
      this._clearHighlights();
    },

    /**
     * Extract content from a target for display
     * @override
     */
    extractContent: function(oTarget) {
      const oChartData = this._extractChartData(oTarget);
      return oChartData ? 
        `Chart: ${oChartData.title || oChartData.chartId || "Unknown"}` : 
        "";
    },

    /**
      * Handle insights action on dropped target
      * @override
      */
    handleAction: function(sContent, oTarget) {
      this._clearActiveHighlight();
      this._clearHighlights();
      
      const oChartData = this._extractChartData(oTarget);
      
      if (oChartData) {
        const sPrompt = this._buildPrompt(oChartData);
        this._showInsightsPopover(oTarget);
        
        this.fireInsightsRequest({
          chartId: oChartData.chartId,
          chartType: oChartData.chartType,
          chartTitle: oChartData.title,
          prompt: sPrompt,
          payload: oChartData,
          targetElement: oTarget
        });
      }
    },

// ============================
// Chart Highlighting 
// ============================

    /**
     * Override to provide chart-specific style ID
     * @override
     */
    getHighlightStyleId: function() {
      return "aiInsightsChartStyles";
    },

    /**
     * Override to provide chart-specific CSS
     * @override
     */
    getHighlightCSS: function() {
      return `
        .sapVizFrame.ai-highlight-target,
        [class*='VizFrame'].ai-highlight-target {
          outline: 3px dashed #FFB400 !important;
          outline-offset: 4px;
          background-color: rgba(255, 180, 0, 0.08) !important;
          cursor: crosshair !important;
          transition: all 0.2s ease;
        }
        
        .sapVizFrame.ai-highlight-target:hover,
        [class*='VizFrame'].ai-highlight-target:hover {
          background-color: rgba(255, 180, 0, 0.15) !important;
          box-shadow: 0 0 20px rgba(255, 180, 0, 0.4);
        }
        
        .sapVizFrame.ai-highlight-active,
        [class*='VizFrame'].ai-highlight-active {
          background-color: rgba(255, 180, 0, 0.25) !important;
          outline-style: solid !important;
          box-shadow: 0 0 25px rgba(255, 180, 0, 0.5);
        }
      `;
    },

    /**
     * Override to provide chart-specific targetable elements
     * @override
     */
    getAllTargetableElements: function() {
      const sSelectors = this.getChartSelector();
      const aElements = Array.from(document.querySelectorAll(sSelectors));
      
      return aElements.filter(oEl => {
        if (oEl.offsetParent === null) return false;
        if (this.getDomRef()?.contains(oEl)) return false;
        return true;
      });
    },

// ============================
// Chart Data Extraction
// ============================

    /**
     * Extract chart data from target element using the DOM
     */
    _extractChartData: function(oChartDom) {
      if (!oChartDom) return null;

      const oChartData = this._createEmptyChartData(oChartDom);
      const oVizFrame = this._getUI5ControlFromDom(oChartDom);
      
      if (oVizFrame) {
        this._extractFromUI5Control(oVizFrame, oChartData);
      } else {
        this._extractFromDOM(oChartDom, oChartData);
      }

      return CONFIG.FLAG_MASK_PII ? this._maskPII(oChartData) : oChartData;
    },

    /**
     * Create an empty chart data object with default values
     */
    _createEmptyChartData: function(oChartDom) {
      return {
        chartId: oChartDom.id || "unknown-chart",
        chartType: "unknown",
        title: "",
        language: navigator.language || navigator.userLanguage || "en",
        fieldNames: [],
        dataSample: "",
        aggregatedStats: "",
        selectionContext: null,
        dataGapsPresent: false,
        rowCount: 0
      };
    },

    /**
     * Get the UI5 control instance from a DOM reference
     */
    _getUI5ControlFromDom: function(oDomRef) {
      if (!oDomRef?.id) return null;

      try {
        const oControl = sap.ui.getCore().byId(oDomRef.id);
        if (oControl?.getMetadata) {
          const sClassName = oControl.getMetadata().getName();
          if (sClassName.indexOf("VizFrame") !== -1) {
            return oControl;
          }
        }
      } catch (e) {
        console.warn("AIInsightsButton: Could not get UI5 control:", e);
      }

      return null;
    },

    /**
     * Extract chart data from a UI5 VizFrame control
     */
    _extractFromUI5Control: function(oVizFrame, oChartData) {
      try {
        oChartData.chartType = oVizFrame.getVizType() || "unknown";
        this._extractTitle(oVizFrame, oChartData);
        this._extractDatasetInfo(oVizFrame.getDataset(), oChartData);
        this._extractFeedInfo(oVizFrame.getFeeds(), oChartData);
      } catch (e) {
        console.warn("AIInsightsButton: Error extracting from UI5 control:", e);
        oChartData.dataGapsPresent = true;
      }
    },

    /**
     * Extract the chart title from VizFrame properties
     */
    _extractTitle: function(oVizFrame, oChartData) {
      const oVizProperties = oVizFrame.getVizProperties();
      if (oVizProperties?.title?.text) {
        oChartData.title = oVizProperties.title.text;
      }
    },

    /**
     * Extract dataset information including dimensions and measures
     */
    _extractDatasetInfo: function(oDataset, oChartData) {
      if (!oDataset) return;

      try {
        const aDimensions = oDataset.getDimensions?.() || [];
        const aMeasures = oDataset.getMeasures?.() || [];

        oChartData.fieldNames = this._collectFieldNames(aDimensions, aMeasures);
        this._extractDataFromBinding(oDataset, oChartData, aMeasures);
      } catch (e) {
        console.warn("AIInsightsButton: Error extracting dataset info:", e);
        oChartData.dataGapsPresent = true;
      }
    },

    /**
     * Collect field names from dimensions and measures
     */
    _collectFieldNames: function(aDimensions, aMeasures) {
      const aNames = [];
      
      [...aDimensions, ...aMeasures].forEach(oField => {
        const sName = oField.getName?.() || oField.name || 
                     (aDimensions.includes(oField) ? "Dimension" : "Measure");
        aNames.push(sName);
      });
      
      return aNames;
    },

    /**
     * Extract data from dataset binding or model
     */
    _extractDataFromBinding: function(oDataset, oChartData, aMeasures) {
      const oBinding = oDataset.getBinding("data");
      
      if (oBinding) {
        this._extractFromBinding(oBinding, oChartData, aMeasures);
      } else {
        this._extractFromModel(oDataset, oChartData, aMeasures);
      }
    },

    /**
     * Extract data from a binding context
     */
    _extractFromBinding: function(oBinding, oChartData, aMeasures) {
      const aContexts = oBinding.getContexts(0, CONFIG.MAX_DATA_SAMPLE_ROWS);
      const aData = aContexts.map(oContext => oContext.getObject());

      oChartData.rowCount = oBinding.getLength?.() || aData.length;
      
      if (aData.length > 0) {
        oChartData.dataSample = this._buildDataSample(aData, oChartData.fieldNames);
        oChartData.aggregatedStats = this._calculateAggregatedStats(aData, aMeasures);
      } else {
        oChartData.dataGapsPresent = true;
      }
    },

    /**
     * Extract data directly from the model
     */
    _extractFromModel: function(oDataset, oChartData, aMeasures) {
      const oModel = oDataset.getModel();
      const sDataPath = oDataset.data?.path;
      
      if (!oModel || !sDataPath) {
        oChartData.dataGapsPresent = true;
        return;
      }
      
      const aData = oModel.getProperty(sDataPath);
      if (Array.isArray(aData)) {
        oChartData.rowCount = aData.length;
        const aSampleData = aData.slice(0, CONFIG.MAX_DATA_SAMPLE_ROWS);
        oChartData.dataSample = this._buildDataSample(aSampleData, oChartData.fieldNames);
        oChartData.aggregatedStats = this._calculateAggregatedStats(aSampleData, aMeasures);
      } else {
        oChartData.dataGapsPresent = true;
      }
    },

    /**
     * Extract field names from feed information
     */
    _extractFeedInfo: function(aFeeds, oChartData) {
      if (!aFeeds || oChartData.fieldNames.length > 0) return;

      try {
        aFeeds.forEach(oFeed => {
          const aValues = oFeed.getValues?.() || [];
          if (Array.isArray(aValues)) {
            aValues.forEach(sValue => {
              if (!oChartData.fieldNames.includes(sValue)) {
                oChartData.fieldNames.push(sValue);
              }
            });
          }
        });
      } catch (e) {
        console.warn("AIInsightsButton: Error extracting feed info:", e);
      }
    },

    /**
     * Build a text representation of data sample
     */
    _buildDataSample: function(aData, aFieldNames) {
      if (!aData?.length) return "(no data)";

      const aHeaders = aFieldNames.length > 0 ? aFieldNames : Object.keys(aData[0] || {});
      const aRows = [aHeaders.join(" | ")];
      
      aData.slice(0, CONFIG.MAX_DATA_SAMPLE_ROWS).forEach(oRow => {
        const aValues = aHeaders.map(sField => {
          const value = oRow[sField];
          return value == null ? "-" : String(value);
        });
        aRows.push(aValues.join(" | "));
      });

      return aRows.join("\n");
    },

    /**
     * Calculate aggregated statistics for numeric fields
     */
    _calculateAggregatedStats: function(aData, aMeasures) {
      if (!aData?.length) return "(no data for statistics)";

      const aMeasureNames = this._getMeasureNames(aMeasures, aData);
      const aStats = aMeasureNames
        .map(sField => this._calculateFieldStats(aData, sField))
        .filter(Boolean);

      return aStats.length > 0 ? aStats.join("; ") : "(no numeric fields)";
    },

    /**
     * Get measure field names from measures or infer from data
     */
    _getMeasureNames: function(aMeasures, aData) {
      let aNames = [];
      
      if (aMeasures?.length > 0) {
        aNames = aMeasures
          .map(oMeas => oMeas.getName?.() || oMeas.name)
          .filter(Boolean);
      }
      
      if (aNames.length === 0 && aData.length > 0) {
        aNames = Object.keys(aData[0]).filter(sKey => {
          const value = aData[0][sKey];
          return typeof value === "number" || 
                 (!isNaN(parseFloat(value)) && isFinite(value));
        });
      }
      
      return aNames;
    },

    /**
     * Calculate statistics for a single field
     */
    _calculateFieldStats: function(aData, sFieldName) {
      const aValues = aData
        .map(oRow => parseFloat(oRow[sFieldName]))
        .filter(v => !isNaN(v));

      if (aValues.length === 0) return null;

      const oStats = this._computeStats(aValues);
      return `${sFieldName}: min=${oStats.min.toFixed(2)}, ` +
             `max=${oStats.max.toFixed(2)}, mean=${oStats.mean.toFixed(2)}, ` +
             `median=${oStats.median.toFixed(2)}, count=${oStats.count}`;
    },

    /**
     * Compute basic statistics from an array of numeric values
     */
    _computeStats: function(aValues) {
      const iCount = aValues.length;
      const fMin = Math.min(...aValues);
      const fMax = Math.max(...aValues);
      const fSum = aValues.reduce((acc, val) => acc + val, 0);
      const fMean = fSum / iCount;
      
      const aSorted = [...aValues].sort((a, b) => a - b);
      const iMid = Math.floor(aSorted.length / 2);
      const fMedian = aSorted.length % 2 === 0 
        ? (aSorted[iMid - 1] + aSorted[iMid]) / 2 
        : aSorted[iMid];

      return { min: fMin, max: fMax, mean: fMean, median: fMedian, count: iCount };
    },

    /**
     * Fallback extraction when UI5 control is not accessible
     */
    _extractFromDOM: function(oChartDom, oChartData) {
      oChartData.dataGapsPresent = true;
      
      try {
        const oTitleEl = oChartDom.querySelector(".v-m-title, .v-title, [class*='title']");
        if (oTitleEl) {
          oChartData.title = oTitleEl.textContent.trim();
        }

        oChartData.chartType = this._detectChartType(oChartDom.className || "");
        this._extractLegendLabels(oChartDom, oChartData);

        oChartData.dataSample = "(Data extraction via DOM not supported - UI5 control not accessible)";
        oChartData.aggregatedStats = "(Statistics unavailable - UI5 control not accessible)";
      } catch (e) {
        console.warn("AIInsightsButton: Error in DOM fallback extraction:", e);
      }
    },

    /**
     * Detect chart type from CSS classes
     */
    _detectChartType: function(sClasses) {
      if (sClasses.includes("line")) return "line";
      if (sClasses.includes("bar")) return "bar";
      if (sClasses.includes("pie") || sClasses.includes("donut")) return "pie/donut";
      return "unknown";
    },

    /**
     * Extract field names from legend labels
     */
    _extractLegendLabels: function(oChartDom, oChartData) {
      const aLegends = oChartDom.querySelectorAll(".v-legend-item, [class*='legend']");
      aLegends.forEach(oLegend => {
        const sText = oLegend.textContent.trim();
        if (sText && !oChartData.fieldNames.includes(sText)) {
          oChartData.fieldNames.push(sText);
        }
      });
    },

    /**
     * Mask personally identifiable information in chart data
     */
    _maskPII: function(oChartData) {
      console.log("AIInsightsButton: PII masking enabled but not implemented. See _maskPII() method.");
      return oChartData;
    },

// ============================
// Prompt Building
// ============================

    /**
     * Build the AI prompt from extracted chart data
     */
    _buildPrompt: function(oChartData) {
      const sDataGapsNote = oChartData.dataGapsPresent ? 
        " (Note: data gaps present - confidence may be reduced)" : "";
      const sTotalRowsNote = oChartData.rowCount > CONFIG.MAX_DATA_SAMPLE_ROWS 
        ? ` (showing first ${CONFIG.MAX_DATA_SAMPLE_ROWS} of ${oChartData.rowCount} rows)` 
        : "";

      return `Context:
      You are a factual data analyst. Language: ${oChartData.language}. 
      Chart ID: ${oChartData.chartId}. 
      Chart type: ${oChartData.chartType}. 
      Chart title: ${oChartData.title || "(no title)"}.${sDataGapsNote}

      Data:
      Fields: ${oChartData.fieldNames.join(", ") || "(unknown)"}
      Data sample${sTotalRowsNote}:
      ${oChartData.dataSample}

      Aggregated metrics (per numeric field): ${oChartData.aggregatedStats}

      Task:
      Provide your analysis in THREE distinct sections with EXACTLY these delimiters:

      [SUMMARY]
      Write 2-3 sentences describing the main trend or pattern visible in the chart. Keep it concise and business-friendly.
      [/SUMMARY]

      [INSIGHTS]
      Provide up to 3 bullet points (use • character) about notable observations:
      • First insight about increases, decreases, or outliers (1-2 sentences)
      • Second insight about comparisons or patterns (1-2 sentences)
      • Third insight or hypothesis about causes, if applicable (1-2 sentences)
      [/INSIGHTS]

      [CONFIDENCE]
      Provide a percentage (e.g., 85%) based on data completeness and pattern clarity. Then add one sentence explaining the confidence level.
      [/CONFIDENCE]

      Constraints:
      - Use ${oChartData.language} for the response
      - Use plain text only, no tables or JSON
      - Keep tone non-technical and business-friendly
      - Keep total response under ~${CONFIG.RECOMMENDED_MAX_TOKENS} tokens
      - MUST use the exact section delimiters shown above`;
    },

// ============================
// Insights UI / Popover
// ============================

    /**
     * Show the insights popover attached to a target element
     */
    _showInsightsPopover: function(oTarget) {
      if (!this._oInsightsPopover) {
        this._createInsightsPopover();
      }

      this._resetPopoverContent();
      this._oInsightsPopover.setBusy(true);
      this._bIsLoading = true;

      const oOpenBy = this._findOpenByControl(oTarget);
      if (oOpenBy) {
        this._oInsightsPopover.openBy(oOpenBy);
      }
    },

    /**
     * Reset popover content to loading state
     */
    _resetPopoverContent: function() {
      if (this._oSummaryText) {
        this._oSummaryText.setText("Analyzing chart data...");
      }
      if (this._oInsightsList) {
        this._oInsightsList.destroyItems();
      }
      if (this._oConfidenceText) {
        this._oConfidenceText.setText("...");
      }
    },

    /**
     * Find the UI5 control to attach the popover to
     */
    _findOpenByControl: function(oTarget) {
      if (oTarget?.id) {
        const oControl = sap.ui.getCore().byId(oTarget.id);
        if (oControl) return oControl;
      }
      return oTarget;
    },

    /**
     * Update the popover with AI insights results
     */
    setInsightsResult: function(sInsights) {
      const oParsed = this._parseInsightsResponse(sInsights);
      
      if (oParsed.summary) {
        this._oSummaryText.setText(oParsed.summary);
      }
      
      if (oParsed.insights && oParsed.insights.length > 0) {
        this._oInsightsList.destroyItems();
        oParsed.insights.forEach((sInsight, idx) => {
          const oInsightBox = this._createInsightItem(sInsight, idx + 1);
          this._oInsightsList.addItem(oInsightBox);
        });
      }
      
      if (oParsed.confidence) {
        this._oConfidenceText.setText(oParsed.confidence);
        this._updateConfidenceIndicator(oParsed.confidenceValue);
      }
      
      if (this._oInsightsPopover) {
        this._oInsightsPopover.setBusy(false);
      }
      this._bIsLoading = false;
    },

    /**
     * Parse the AI response into structured sections
     */
    _parseInsightsResponse: function(sResponse) {
      const oResult = {
        summary: "",
        insights: [],
        confidence: "",
        confidenceValue: 0
      };

      const summaryMatch = sResponse.match(/\[SUMMARY\]([\s\S]*?)(?=\[|$)/i);
      if (summaryMatch) {
        oResult.summary = summaryMatch[1].trim();
      }

      const insightsMatch = sResponse.match(/\[INSIGHTS\]([\s\S]*?)(?=\[|$)/i);
      if (insightsMatch) {
        const insightsText = insightsMatch[1].trim();
      
        oResult.insights = insightsText
          .split(/\n\s*[•\-\*]\s+|(?<=^)[•\-\*]\s+/) 
          .map(s => s.trim())
          .filter(s => s.length > 0);
      }

      const confidenceMatch = sResponse.match(/\[CONFIDENCE\]([\s\S]*?)(?=\[|$)/i);
      if (confidenceMatch) {
        const confidenceText = confidenceMatch[1].trim();
        oResult.confidence = confidenceText;
        
        const percentMatch = confidenceText.match(/(\d+)%/);
        if (percentMatch) {
          oResult.confidenceValue = parseInt(percentMatch[1], 10);
        }
      }

      if (!oResult.summary && !oResult.insights.length) {
        oResult.summary = sResponse.replace(/\[\/?(SUMMARY|INSIGHTS|CONFIDENCE)\]/gi, '').trim();
      }

      return oResult;
    },

    /**
     * Create a UI element for a single insight
     */
    _createInsightItem: function(sInsightText, iNumber) {
      const oIcon = new Icon({
        src: "sap-icon://lightbulb",
        color: "#0854A0",
        size: "1rem"
      }).addStyleClass("sapUiTinyMarginEnd");

      const oText = new Text({
        text: sInsightText,
        wrapping: true
      }).addStyleClass("sapUiSmallMarginBottom");

      const oBox = new VBox({
        items: [
          new HBox({
            items: [oIcon, new Label({ text: `Insight ${iNumber}`, design: "Bold" })]
          }).addStyleClass("sapUiTinyMarginBottom"),
          oText
        ]
      }).addStyleClass("aiInsightItem sapUiSmallMarginBottom");

      return oBox;
    },

    /**
     * Update the visual confidence indicator based on percentage
     */
    _updateConfidenceIndicator: function(iValue) {
      if (!this._oConfidenceBar) return;
      
      const sDomRef = this._oConfidenceBar.getDomRef();
      if (sDomRef) {
        let sColor = "#5E696E";
        if (iValue >= 80) {
          sColor = "#107E3E";
        } else if (iValue >= 60) {
          sColor = "#E9730C";
        } else if (iValue < 60) {
          sColor = "#B00";
        }
        sDomRef.style.backgroundColor = sColor;
      }
    },

    /**
     * Display an error message in the insights popover
     */
    setInsightsError: function(sErrorMessage) {
      const sMessage = sErrorMessage || "Insights could not be loaded. Please try again.";
      
      if (this._oSummaryText) {
        this._oSummaryText.setText(sMessage);
      }
      if (this._oInsightsList) {
        this._oInsightsList.destroyItems();
      }
      if (this._oConfidenceText) {
        this._oConfidenceText.setText("Error");
      }
      
      if (this._oInsightsPopover) {
        this._oInsightsPopover.setBusy(false);
      }
      this._bIsLoading = false;
    },

    /**
     * Check if insights are currently being loaded
     */
    isLoading: function() {
      return this._bIsLoading;
    },

    /**
     * Close the insights popover
     */
    closeInsights: function() {
      if (this._oInsightsPopover) {
        this._oInsightsPopover.close();
      }
    },

    /**
     * Create the insights popover with all UI sections
     */
    _createInsightsPopover: function() {
      // Summary Section
      const oSummaryIcon = new Icon({
        src: "sap-icon://overview-chart",
        color: "#0854A0",
        size: "1.25rem"
      }).addStyleClass("sapUiTinyMarginEnd");

      this._oSummaryText = new Text({
        text: "",
        wrapping: true
      });

      const oSummarySection = new VBox({
        items: [
          new HBox({
            items: [oSummaryIcon, new Label({ text: "Summary", design: "Bold" })]
          }).addStyleClass("sapUiTinyMarginBottom"),
          this._oSummaryText
        ]
      }).addStyleClass("aiInsightsSection sapUiSmallMarginBottom");

      // Insights Section
      const oInsightsIcon = new Icon({
        src: "sap-icon://business-objects-experience",
        color: "#0854A0",
        size: "1.25rem"
      }).addStyleClass("sapUiTinyMarginEnd");

      this._oInsightsList = new VBox({
        items: []
      });

      const oInsightsSection = new VBox({
        items: [
          new HBox({
            items: [oInsightsIcon, new Label({ text: "Key Insights", design: "Bold" })]
          }).addStyleClass("sapUiTinyMarginBottom"),
          this._oInsightsList
        ]
      }).addStyleClass("aiInsightsSection sapUiSmallMarginBottom");

      // Confidence Section
      const oConfidenceIcon = new Icon({
        src: "sap-icon://complete",
        color: "#0854A0",
        size: "1.25rem"
      }).addStyleClass("sapUiTinyMarginEnd");

      this._oConfidenceText = new Text({
        text: "",
        wrapping: true
      });

      // Confidence bar
      this._oConfidenceBar = new sap.ui.core.HTML({
        content: "<div style='height: 4px; width: 100%; background-color: #5E696E; border-radius: 2px; margin-top: 0.5rem;'></div>"
      });

      const oConfidenceSection = new VBox({
        items: [
          new HBox({
            items: [oConfidenceIcon, new Label({ text: "Confidence", design: "Bold" })]
          }).addStyleClass("sapUiTinyMarginBottom"),
          this._oConfidenceText,
          this._oConfidenceBar
        ]
      }).addStyleClass("aiInsightsSection");

      // Main container
      const oMainVBox = new VBox({
        width: "480px",
        items: [
          oSummarySection,
          oInsightsSection,
          oConfidenceSection
        ]
      }).addStyleClass("sapUiSmallMargin");

      // Header with close button
      const oCloseBtn = new Button({
        icon: "sap-icon://decline",
        type: "Transparent",
        press: () => this._oInsightsPopover.close()
      });

      const oHeader = new Bar({
        contentLeft: [new Title({ text: "AI Chart Insights" })],
        contentRight: [oCloseBtn]
      });

      this._oInsightsPopover = new Popover({
        customHeader: oHeader,
        placement: "Auto",
        contentWidth: "520px",
        content: [oMainVBox],
        afterClose: () => { this._bIsLoading = false; }
      });

      this._addPopoverStyling();

      this.addDependent(this._oInsightsPopover);
    },

    /**
     * Add custom CSS styling for the popover
     */
    _addPopoverStyling: function() {
      const sStyleId = "aiInsightsPopoverStyles";
      if (document.getElementById(sStyleId)) return;

      const oStyle = document.createElement("style");
      oStyle.id = sStyleId;
      oStyle.textContent = `
        .aiInsightsSection {
          padding: 0.75rem;
          border-radius: 0.375rem;
          border-left: 3px solid var(--sapButton_Emphasized_Background, #0854A0);
        }
        
        .aiInsightItem {
          padding: 0.5rem;
          border-radius: 0.25rem;
          border: 1px solid var(--sapGroup_ContentBorderColor, rgba(0, 0, 0, 0.15));
        }
      `;
      document.head.appendChild(oStyle);
    }

  });
});