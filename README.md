## Introduction

A [Vue](https://vuejs.org/) component of volcano plot based on [D3](https://d3js.org/).

A wrapper with Vue bundled for direct use in browser is available at [dist/wg-volcano-plot.min.js](dist/wg-volcano-plot.min.js), which exposes a global function of WgVolcanoPlot with two parameters:

-   `containerId` **string** DOM ID that the plot will be attached to
-   `options` **Object** options that are passed on, see below

[Bulma](https://bulma.io/) classes are used in toolbox and can be styled with custom themes.

## API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

### WgVolcanoPlot

A component of volcano plot with toolbox of utility functions

#### Parameters

-   `domId` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** ID of the plot container (optional, default `"wg-volcano-container"`)
-   `dimensions` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)?** Dimensions of the plot
    -   `dimensions.width` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** Width of the plot (optional, default `960`)
    -   `dimensions.height` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** Height of the plot (optional, default `500`)
-   `margins` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)?** Margins of the plot
    -   `margins.top` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** Top margin of the plot (optional, default `60`)
    -   `margins.bottom` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** Bottom margin of the plot (optional, default `40`)
    -   `margins.left` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** Left margin of the plot (optional, default `30`)
    -   `margins.right` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** Right margin of the plot (optional, default `30`)
-   `data` **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)>** Array of input data objects
    -   `data.attributes` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)?** Attributes to apply on each data point (SVG circle), which can be used for style customization.
    -   `data.options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)?** Options for each data point.
        -   `data.options.showLabel` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)?** Options to control if label is shown for each data point.
        -   `data.options.showTooltip` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)?** Options to control if tooltip is shown for each data point.
        -   `data.options.callback` **[function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function)?** A callback function to run when the data point is clicked, which is passed the current datum (d), the current index (i), and the current group (nodes) as specified by D3.
    -   `data.id` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** A optional ID used by D3 for data joining when data is changed. (optional, default `index`)
-   `x` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** Key of the input data to plot on X axis
-   `y` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** Key of the input data to plot on Y axis
-   `xlabel` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** Label on the X axis (optional, default `x`)
-   `ylabel` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** Label on the Y axis (optional, default `y`)
-   `labelTypes` **([string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) \| [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>)** Keys of the data that can be selected to label points. Single value or first of the array will be used on initiation. Null will disable it. (optional, default `null`)
-   `xTransform` **[function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function)?** Transformation to perform on X values. Defaults to log2 while forcing 0 to 1. Null equals indentity transformation.
-   `yTransform` **[function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function)?** Transformation to perform on Y values. Defaults to -log10 while first converting 0 to a small number. Null equals indentity transformation.
-   `radius` **([number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) \| [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String))** A fixed number of key of data to be used as the radius of data points. (optional, default `4`)
-   `color` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** A color or key of data to be used as the uniform or gradient color of data points. (optional, default `"black"`)
-   `showAllTooltips` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** Whether to show tooltips for all data points. (optional, default `false`)
-   `tooltipContent` **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>?** The keys of data to appear in tooltips.
-   `showAllLabels` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** Whether to show labels for all data points. (optional, default `false`)
-   `autoPlaceLabels` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** Whether to run a few rounds of simple simulation to place labels on initiation. (optional, default `false`)
-   `showToolbox` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** Whether to show utility toolbox. (optional, default `true`)
