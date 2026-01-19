sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
], function (Controller, MessageToast) {
    "use strict";

    return Controller.extend("demo.controller.Dashboard", {

        onInit: function () {
            console.log("Controller loaded!");
        
        },

        onAfterRendering: function() {
            this._configureCharts();
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

            // Add popovers
            const oPopOver = new sap.viz.ui5.controls.Popover({});
            oPopOver.connect(oVizFrameLine.getVizUid());
            oPopOver.connect(oVizFramePie.getVizUid());
        },

        /**
         * Example for tile press event
         */
        onPress: function() {
            MessageToast.show("Tile pressed");
        }
    });
});