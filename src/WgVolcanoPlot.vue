<template>
<div class="wg-volcano">
<div :id="domId" class="wg-volcano-container"></div>
<div class="wg-volcano-toolbox" v-if="showToolbox">
  <div class="wg-volcano-tool wg-volcano-label"  v-if="Array.isArray(labelTypes) && labelTypes.length > 1">
    <div class="field">
      <label :for="domId + '-label'">Label:</label>
      <div class="select is-outlined is-primary">
        <select :id="domId + '-label'" v-model="labelType">
          <option v-for="type in labelTypes" :value="type">{{type}}</option>
        </select>
      </div>
    </div>
  </div>

  <div class="wg-volcano-tool wg-volcano-download">
    <div class="field has-addons">
      <div class="control">
        <div class="select is-outlined is-primary">
        <select v-model="downloadType" class="select">
          <option value="png">PNG</option>
          <option value="svg">SVG</option>
        </select>
        </div>
      </div>
      <div class="control">
        <button class="button is-outlined is-primary" @click="download()">Download</button>
      </div>
    </div>
  </div>

  <template v-if="labelTypes !== null">
  <div class="wg-volcano-tool wg-volcano-link">
    <button class="button is-outlined is-primary" @click="drawLinkLine()" v-if="!linkShown">Draw Link</button>
    <button class="button is-outlined is-primary" @click="removeLinkLine()" v-if="linkShown">Remove Link</button>
  </div>
  </template>
  <div class="wg-volcano-tool wg-volcano-zoom">
    <div class="field">
      <input :id="domId + '-zoom'" type="checkbox" class="switch" :checked="zoomEnabled" @click="handleZoom"><label :for="domId + '-zoom'">Pan & Zoom</label>
    </div>
  </div>
</div>
<div id="wg-volcano-tooltip" style="visibility: hidden" />
</div>
</template>


<script>
import 'core-js/fn/object/assign';
import 'core-js/fn/math/log10';
import 'core-js/fn/math/log2';
import {scaleLinear, scaleSequential} from 'd3-scale';
import {axisBottom, axisLeft} from 'd3-axis';
import {select, event} from 'd3-selection';
import {extent} from 'd3-array';
import {easeLinear} from 'd3-ease';
import {forceSimulation, forceManyBody, forceCollide, forceLink, forceRadial} from 'd3-force';
import {interrupt} from 'd3-transition';
import {drag} from 'd3-drag';
import {interpolateRgbBasis} from 'd3-interpolate';
import {zoom, zoomTransform} from 'd3-zoom';
import download from 'downloadjs';

const LABEL_SIZE = 0.7;
const STROKE_WIDTH = 1;

/**
 * A component of volcano plot with toolbox of utility functions
 * @param {string} [domId="wg-volcano-container"] - ID of the plot container
 * @param {Object} [dimensions] - Dimensions of the plot
 * @param {number} [dimensions.width=960] - Width of the plot
 * @param {number} [dimensions.height=500] - Height of the plot
 * @param {Object} [margins] - Margins of the plot
 * @param {number} [margins.top=60] - Top margin of the plot
 * @param {number} [margins.bottom=40] - Bottom margin of the plot
 * @param {number} [margins.left=30] - Left margin of the plot
 * @param {number} [margins.right=30] - Right margin of the plot
 * @param {Object[]} data - Array of input data objects
 * @param {Object} [data.attributes] - Attributes to apply on each data point (SVG circle), which can be used for style customization.
 * @param {Object} [data.options] - Options for each data point.
 * @param {boolean} [data.options.showLabel] - Options to control if label is shown for each data point.
 * @param {boolean} [data.options.showTooltip] - Options to control if tooltip is shown for each data point.
 * @param {function} [data.options.callback] - A callback function to run when the data point is clicked, which is passed the current datum (d), the current index (i), and the current group (nodes) as specified by D3.
 * @param {string} [data.id=index] - A optional ID used by D3 for data joining when data is changed.
 * @param {string} x - Key of the input data to plot on X axis
 * @param {string} y - Key of the input data to plot on Y axis
 * @param {string} [xlabel=x] - Label on the X axis
 * @param {string} [ylabel=y] - Label on the Y axis
 * @param {string|string[]} [labelTypes=null] - Keys of the data that can be selected to label points. Single value or first of the array will be used on initiation. Null will disable it.
 * @param {function} [xTransform] - Transformation to perform on X values. Defaults to log2 while forcing 0 to 1. Null equals indentity transformation.
 * @param {function} [yTransform] - Transformation to perform on Y values. Defaults to -log10 while first converting 0 to a small number. Null equals indentity transformation.
 * @param {number|string} [radius=4] - A fixed number of key of data to be used as the radius of data points.
 * @param {string} [color="black"] - A color or key of data to be used as the uniform or gradient color of data points.
 * @param {boolean} [showAllTooltips=false] - Whether to show tooltips for all data points.
 * @param {String[]} [tooltipContent] - The keys of data to appear in tooltips.
 * @param {boolean} [showAllLabels=false] - Whether to show labels for all data points.
 * @param {boolean} [autoPlaceLabels=false] - Whether to run a few rounds of simple simulation to place labels on initiation.
 * @param {boolean} [showToolbox=true] - Whether to show utility toolbox.
 */
export default {
  props: {
    domId: {
      type: String,
      default: "wg-volcano-container"
    },
    dimensions: {
      type: Object,
      default: function() { return { width: 960, height: 500 } }
    },
    margins: {
      type: Object,
      default: function() { return { top: 60, right: 30, bottom: 40, left: 30 } }
    },
    data: {
      type: Array,
      required: true
    },
    labelTypes: {
      type: [Array, String],
      default: null
    },
    x: {
      type: String,
      required: true
    },
    y: {
      type: String,
      required: true
    },
    xLabel: {
      type: String,
    },
    yLabel: {
      type: String,
    },
    xTransform: {
      type: Function,
      default: function(x) {
        return x === 0 ? 1 : Math.log2(x)
      }
    },
    yTransform: {
      type: Function,
    },
    radius: {
      type: [Number, String],
      default: 4
    },
    color: {
      type: String,
      default: "black"
    },
    showAllTooltips: {
      type: Boolean,
      default: false
    },
    tooltipContent: {
      type: Array
    },
    showAllLabels: {
      type: Boolean,
      default: false
    },
    autoPlaceLabels: {
      type: Boolean,
      default: false
    },
    showToolbox: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      labelType: null,
      linkShown: false,
      zoomEnabled: false,
      downloadType: "png"
    }
  },
  computed: {
    processedData: function() {
      const processed = [];
      const getRadius = datum => {
        if (typeof this.radius === "string" && datum.hasOwnProperty(this.radius)) {
          const r = Number(datum[this.radius])
          return Math.min(Math.max(Math.log2(isNaN(r) ? 0 : r), 1) + 1, 15);
        } else {
          return this.radius;
        }
      }
      let yTransform;
      if(this.yTransform === null) yTransform = d => d;
      if (typeof this.yTransform === "undefined") {
        yTransform = function(y) { return -Math.log10(y === 0 ? Number.EPSILON : y) }
      }
      this.data.forEach(d => {
        processed.push(
          Object.assign({}, d,
            {
              y: yTransform(d[this.y]),
              x: this.xTransform !== null ? this.xTransform(d[this.x]) : d[this.x],
              r: getRadius(d)
            }
          )
        );
      });
      return processed;
    },
    xAxisLabel: function() {
      return this.xLabel || "Log2 of " + this.x;
    },
    yAxisLabel: function() {
      return this.yLabel || "-Log10 of " + this.y;
    }
  },
  methods: {
    plotVolcano() {
      if (!this.processedData || this.processedData.length == 0) {
        return;
      }

      const svg = this.svg;
      const canvas = this.canvas;
      const content = this.content;

      //Axis
      const xScale = scaleLinear()
        .range([0, this.dimensions.width])
        .domain(extent(this.processedData, d => d.x)).nice();
      this.xScale = xScale;

      const yScale = scaleLinear()
        .range([this.dimensions.height, 0])
        .domain(extent(this.processedData, d => d.y)).nice();
      this.yScale = yScale;

      this.xAxis = axisBottom(xScale);
      this.yAxis = axisLeft(yScale);

      canvas.select("g.x-axis").remove();
      const xax = canvas.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + this.dimensions.height + ")")
        .call(this.xAxis)
      xax.append("text")
        .attr("class", "x-label")
        .attr("x", this.dimensions.width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .attr("fill", "#000")
        .text(this.xAxisLabel);

      let xPos = xScale(0) > 0 ? xScale(0): 0;
      xPos = xPos < this.dimensions.width ? xPos : this.dimensions.width;
      canvas.select("g.y-axis").remove();
      const yax = canvas.append("g")
        .attr("class", "y-axis")
        .attr("transform", "translate("+ xPos +  ",0)")
        .call(this.yAxis)
      yax.select(".tick:first-of-type").remove()
      yax.append("text")
        .attr("class", "y-label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(this.yAxisLabel)
        .attr("fill", "#000")

      //Set size proportional to one attribute (e.g. gene set size)
      //Roll the color gradient on our own. The built-in single vue pallete is too light at the beginning.
      //Ensentially the same method, interpolating of colors from colorbrewer
      if (this.processedData[0].hasOwnProperty(this.color)) {
        const colorVarRange = extent(this.processedData, d => d[this.color]);
        this.colorScale = scaleSequential(interpolateRgbBasis(["#dadaeb", "#bcbddc", "#9e9ac8", "#807dba", "#6a51a3", "#54278f", "#3f007d"]))
          .domain(colorVarRange)

        //color legend
        svg.select(".legend").remove();
        const legendWrapper = svg.append("g").attr("class", "legend");
        const legend = legendWrapper.append("defs").append("svg:linearGradient").attr("id", "gradient").attr("x1", "0%").attr("y1", "100%").attr("x2", "100%").attr("y2", "100%").attr("spreadMethod", "pad");
        legend.append("stop").attr("offset", "0%").attr("stop-color", "#dadaeb").attr("stop-opacity", 1);
        legend.append("stop").attr("offset", "16.67%").attr("stop-color", "#bcbddc").attr("stop-opacity", 1);
        legend.append("stop").attr("offset", "33.33%").attr("stop-color", "#9e9ac8").attr("stop-opacity", 1);
        legend.append("stop").attr("offset", "50%").attr("stop-color", "#807dba").attr("stop-opacity", 1);
        legend.append("stop").attr("offset", "66.67%").attr("stop-color", "#6a51a3").attr("stop-opacity", 1);
        legend.append("stop").attr("offset", "83.33%").attr("stop-color", "#54278f").attr("stop-opacity", 1);
        legend.append("stop").attr("offset", "100%").attr("stop-color", "#3f007d").attr("stop-opacity", 1);
        legendWrapper.append("rect").attr("width", 100).attr("height", 20).style("fill", "url(#gradient)").attr("transform", "translate(10,0)");
        const legendY = scaleLinear().range([0, 100]).domain(colorVarRange);
        const legendYAxis = axisBottom(legendY).ticks(5);

        legendWrapper.append("g").attr("class", "y-axis").attr("transform", "translate(10,20)").call(legendYAxis)
      }

      this.drawLabel();

      //Plot dots
      const dots = content.selectAll(".wg-volcano-dot").data(this.processedData, (d, i) => (typeof d.id !== "undefined") ? d.id : i);
      dots.enter().append("circle")
        .attr("class", "wg-volcano-dot")
        .attr("r", d => d.r)
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y))
        .attr("fill", d => this.getColor(d))
        //copy and overwrite attribute per data point if available
        //add event handler
        .each((d, i, g) => {
          if (d.hasOwnProperty("attributes") && typeof d.attributes === 'object' && d.attributes.constructor === Object) {
            for (let key in d.attributes) {
              g[i].setAttribute(key, d.attributes[key]);
            }
          }
          const sel = select(g[i]);
          if (this.showAllTooltips) {
              sel.on("mouseenter", showTooltip);
              sel.on("mouseleave", hideTooltip);
          }
          if (d.hasOwnProperty("options") && typeof d.options === 'object' && d.options.constructor === Object) {
            if (!this.showAllTooltips && d.options.hasOwnProperty("showTooltip") && d.options.showTooltip) {
              sel.on("mouseenter", showTooltip);
              sel.on("mouseleave", hideTooltip);
            }
            if (d.options.hasOwnProperty("callback") && typeof d.options.callback === "function") {
              sel.on("click", d.options.callback);
              sel.classed("has-pointer", true);
            }
          }
        })
      dots.exit().remove();


      const createTooltipContent = d => {
        let content = "";
        if (this.tooltipContent) {
          this.tooltipContent.forEach(key => content += `${key}: ${this.formatNumber(d[key])}<br>`);
          return content;
        }

        if (this.labelTypes) {
          this.labelTypes.forEach(l => {
            if (d.hasOwnProperty(l)) {
              content += `${l}: ${d[l]}<br>`;
            }
          });
        }
        content += `${this.x}: ${formatNumber(d[this.x])}<br>`;
        content += `${this.y}: ${formatNumber(d[this.y])}<br>`;
        const excludeList = [this.x, this.y, "x", "y", "options", "attributes", "r"].concat(this.labelTypes);
        for (let key in d) {
          if (excludeList.indexOf(key) === -1) {
            content += `${key}: ${formatNumber(d[key])}<br>`;
          }
        }
        return content;
      }

      const tooltip = select("#wg-volcano-tooltip");
      function showTooltip(d) {
        tooltip.interrupt()
          .html(createTooltipContent(d))
          .style("left", event.x + 20 + "px")
          .style("top", event.y - 60 + "px")
          .transition().duration(100).ease(easeLinear)
            .style("opacity", .8)
            .on("end", function() {
                select(this).style("visibility", "visible")
            })
        }

      function hideTooltip() {
        tooltip.interrupt()
          .transition().duration(500)
          .style("opacity", 0)
          .on("end", function() {
            select(this).style("visibility", "hidden")
          })
      }

    },
    getColor(datum) {
      if (datum.hasOwnProperty(this.color) && this.colorScale !== null) {
        const colorVar = Number(datum[this.color])
        return this.colorScale(isNaN(colorVar) ? 0 : colorVar);
      } else {
        return this.color;
      }
    },
    drawLabel() {
      if (this.labelType === null) return;
      this.canvas.selectAll(".link-line").remove();
      const nodes = this.placeLabel();

      //Enable dragging label for adjustment
      const that = this;
      const dragBehavior = drag()
        .on("drag", function(d, i, g) {
          d.x = event.x;
          d.y = event.y;
          const ele = select(this)
            .attr("x", event.x)
            .attr("y", event.y)
            //update wrapped text
            .selectAll("tspan")
              .attr("x", event.x)

          //update link
          const linkEle = document.querySelector(`#${that.domId} .${d.id}_line`);
          if (linkEle) {
            const coord = that.getLinkCoordinates(this, d);
            linkEle.setAttribute("x1", coord.anchor.x)
            linkEle.setAttribute("y1", coord.anchor.y)
            linkEle.setAttribute("x2", coord.label.x)
            linkEle.setAttribute("y2", coord.label.y)
          }

        })

      //Plot label
      const labels = this.content.selectAll(".dot-label")
        .data(nodes.labels, d => d.id)
        .call(dragBehavior)
      labels.enter()
          .append("text")
          .attr("class", "dot-label has-pointer")
          .attr("text-anchor", "middle")
          .attr("font-size", LABEL_SIZE + "rem")
          .text(d => d[this.labelType])
          .attr("fill", "#000")
          .call(dragBehavior)
      labels.exit().remove();
      this.content.selectAll(".dot-label")
        .attr("x", d => d.x)
        .attr("y", d => d.y)
        .sort((a, b) => a.id < b.id) //needed for the dom to sync with node data to draw lines
        .each((d, i, g) => {
          select(g[i]).selectAll("tspan").attr("x", d.x);
        })

      if (this.linkShown) {
        this.drawLinkLine()
      }
    },
    placeLabel() {
      //use force simulation to place label automatically
      const anchors = this.nodes.anchors;
      const labels = this.nodes.labels;
      const links = this.nodes.links;
      if (anchors.length == 0 && labels.length == 0 && links.length == 0) {
        for (let i = 0, label; i < this.processedData.length; i++) {
          //duplicate, keep anchor fixed on dot position, let labels move
          if (this.showAllLabels || (this.processedData[i].hasOwnProperty("options") &&
              this.processedData[i].options &&
              this.processedData[i].options.hasOwnProperty("showLabel") &&
              this.processedData[i].options.showLabel)) {
            const id = (typeof this.processedData[i].id !== "undefined") ? this.processedData[i].id : i;
            anchors.push({
              "id": `label_${id}_anchor`,
              "fx": this.xScale(this.processedData[i].x),
              "fy": this.yScale(this.processedData[i].y),
              "x": this.xScale(this.processedData[i].x),
              "y": this.yScale(this.processedData[i].y),
              "r": this.processedData[i].r
            });

            label = {"id": `label_${id}`};
            if (Array.isArray(this.labelTypes)) {
              this.labelTypes.forEach(t => label[t] = this.processedData[i][t]);
            } else if (this.labelType !== null) {
              label[this.labelType] = this.processedData[i][this.labelType];
            }
            label["x"] = this.xScale(this.processedData[i].x);
            label["y"] = this.yScale(this.processedData[i].y);
            labels.push(label);

            links.push({
              "source": `label_${id}_anchor`,
              "target": `label_${id}`
            });
          }
        }
      }

      if(this.autoPlaceLabels) {
        const simulation = forceSimulation(anchors.concat(labels))
          .force("charge", forceManyBody().strength(-100))
          .force("radial", forceRadial(Math.min(this.dimensions.width, this.dimensions.height)/2, this.dimensions.width/2, this.dimensions.height/2))
          .force("collision", forceCollide(d => d.fx ? d.r : 10).iterations(10))
          .force("link", forceLink(links).id((d) => d.id).distance(8))
          .stop();
        for (let i = 0, n = 1000 / (1 + Math.sqrt(anchors.length + labels.length)); i < n; ++i) {
          simulation.tick();
        }
      } else {
        for (let i = 0; i < labels.length; i++) {
          labels[i].x += 25
          labels[i].y += 25
        }
      }

      return this.nodes;
    },
    getLinkCoordinates(textDom, data) {
      let ids = this.nodes.labels.map(d => d.id);
      let idx = ids.indexOf(data.id);
      const label = this.nodes.labels[idx];
      ids = this.nodes.anchors.map(d => d.id);
      idx = ids.indexOf(data.id + "_anchor");
      const anchor = this.nodes.anchors[idx];

      let angle = Math.atan((label.y - anchor.y) / (label.x - anchor.x));
      //0.5 to 1.5PI
      angle = label.x > anchor.x ? angle : Math.PI + angle;
      //by default svg coordinates (0, 0) starts from upper left corner
      let x1 = anchor.x + anchor.r * Math.cos(angle)
      let y1 = anchor.y + anchor.r * Math.sin(angle)

      let x2, y2;
      //Find the crossing point of the link line and text box
      const deltax = textDom.getBBox().width / 2;
      const deltay = textDom.getBBox().height / 2;
      //label x,y is along baseline
      const centerx = label.x;
      const centery = textDom.getBBox().y + deltay;

      const crossx1 = centerx + deltax * (centerx > anchor.x ? -1 : 1);
      //use textDom.getBBox().y + deltay instead of label.y, as for text with tspan, label.y is only on the first tspan
      const crossy1 = centery + deltax * Math.abs(Math.tan(angle)) * (centery > anchor.y ? -1 : 1);
      if (crossy1 < centery + deltay && crossy1 > centery - deltay) {
        x2 = crossx1;
        y2 = crossy1;
      } else {
        y2 = centery + deltay * (centery > anchor.y ? -1 : 1);
        x2 = centerx + deltay / Math.abs(Math.tan(angle)) * (centerx > anchor.x ? -1 : 1);
      }
      return {anchor: {x: x1, y: y1}, label: {x: x2, y: y2}}

    },
    drawLinkLine() {
      const that = this;
      this.svg.selectAll(".dot-label")
        .each(function(d, i, g) {
          //this points to DOM element in D3 callback
          const coord = that.getLinkCoordinates(this, d);
          const lineId = d.id + "_line";
          select(this.parentNode)
            .append("line")
            .attr("class", "link-line " + lineId)
            .attr("stroke", "gray")
            //zoom data stores in svg, as behavior needs to trigger when zoom on blank
            //Get scale factor from svg, but transform is applied on content
            .attr("stroke-width", STROKE_WIDTH / zoomTransform(that.svg.node()).k)
            .attr("x1", coord.anchor.x)
            .attr("y1", coord.anchor.y)
            .attr("x2", coord.label.x)
            .attr("y2", coord.label.y)
        })
      if (!this.linkShown) { this.linkShown = true; }
    },
    removeLinkLine() {
      this.svg.selectAll(".link-line").remove();
      if (this.linkShown) { this.linkShown = false; }
    },
    wrap(text, width) {
      text.each(function() {
        const text = select(this);
        const words = text.text().split(/\s+/).reverse();
        var word;
        var line = [];
        const x = text.attr("x");
        var tspan = text.text(null).append("tspan").attr("dy", 0).attr("x", x);
        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > width) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan").attr("dy", 14).attr("x", x).text(word);
          }
        }
      });
    },
    changeLabel() {
      if (this.labelType === null) return;
      this.svg.selectAll(".dot-label")
        .text(d => d[this.labelType])
        .call(this.wrap, 120)
      if (this.linkShown) {
        this.removeLinkLine();
        this.drawLinkLine();
      }
    },
    handleZoom() {
      if (this.zoomEnabled) {
        this.svg.on(".zoom", null);
        this.zoomEnabled = false;
        return;
      }
      const width = this.dimensions.width;
      const zoomed = () => {
        this.content.attr("transform", event.transform);
        //keep apparent font size constant
        this.content.selectAll(".dot-label").attr("font-size", LABEL_SIZE / event.transform.k + "rem");
        this.content.selectAll(".link-line").attr("stroke-width", STROKE_WIDTH / event.transform.k);
        const zeroX = event.transform.applyX(this.xScale(0));
        let xPos = zeroX > 0 ? zeroX : 0;
        xPos = xPos < width ? xPos : width;
        this.canvas.select("g.y-axis").call(this.yAxis.scale(event.transform.rescaleY(this.yScale)))
          .attr("transform", "translate(" + xPos + ",0)");
        this.canvas.select("g.x-axis").call(this.xAxis.scale(event.transform.rescaleX(this.xScale)));
      }

      var zm = zoom()
        .scaleExtent([1, 20])
        .on("zoom", zoomed);
      this.svg.call(zm);
      this.zoomEnabled = true;
    },
    formatNumber(val) {
      if (typeof val !== "number") return val;
      if (val.toString().length > 5) {
        return val.toPrecision(5);
      } else {
        return val;
      }
    },
    download() {
      const width = this.dimensions.width + this.margins.left + this.margins.right;
      const height = this.dimensions.height + this.margins.top + this.margins.bottom;
      const blobData = "data:image/svg+xml;base64," + btoa(`<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${width} ${height}" width="${width * 2}" height="${height * 2}">` + this.svg.html() + '</svg>');
      if (this.downloadType == "svg") {
        download(blobData, "volcanoplot.svg")
      } else if (this.downloadType == "png") {
        const image = new Image;
        image.src = blobData;
        image.onload = function() {
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          canvas.width = width * 2;
          canvas.height = height * 2;
          context.drawImage(image, 0, 0);
          download(canvas.toDataURL("image/png"), "volcanoplot.png")
        }
      }
    },
  },
  watch: {
    //use watch not updated event,
    //as plot is managed by D3 and data is not directly rendered in template
    data: function() {
      const dom = document.getElementById(this.domId);
      if (dom) {
        this.nodes = { anchors: [], labels: [], links: [] }
        this.plotVolcano();
      }
    },
    labelType: function(newlt, oldlt) {
      if (oldlt === null) return;
      this.changeLabel()
    }
  },
  created: function() {
    this.labelType = Array.isArray(this.labelTypes) ? this.labelTypes[0] : this.labelTypes;
    this.svg = null;  //SVG container: canvas + margins. Legend plots on margin
    this.canvas = null; //Plotting area: Axes, content
    this.content = null; //Includes dots, labels. Zoom on content
    this.xScale = null; // x coordinate mapper
    this.yScale = null;
    this.xAxis = null;
    this.yAxis = null;
    this.colorScale = null;
    this.nodes = { anchors: [], labels: [], links: [] } // Data for plotting labels
  },
  mounted: function() {
    //Create SVG container
    const svg = select("#" + this.domId).append("svg")
      .attr("width", this.dimensions.width + this.margins.left + this.margins.right)
      .attr("height", this.dimensions.height + this.margins.top + this.margins.bottom)
    const canvas = svg.append("g")
      .attr("class", "canvas")
      .attr("transform", "translate(" + this.margins.left + "," + this.margins.top + ")");
    const content = canvas.append("g").attr("class", "content");
    this.content = content;
    this.svg = svg;
    this.canvas = canvas;
    this.plotVolcano();
  }
}
</script>

<style scoped>
.wg-volcano-container >>> .has-pointer {
  cursor: pointer;
}
.wg-volcano-toolbox {
  display: flex;
  align-items: center;
}
.wg-volcano-tool {
  margin-left: 10px;
}
.wg-volcano-zoom input[type="checkbox"] {
  margin-right: 3px;
}
.field {
  display: flex;
  align-items: center;
}
.wg-volcano-label label {
  margin-right: 5px;
}
#wg-volcano-tooltip {
  background-color: black;
  border: 1px white solid;
  border-radius: 5px;
  color: white;
  margin: auto;
  opacity: 0;
  padding: 10px;
  position: fixed;
  z-index: 10;
}
</style>
