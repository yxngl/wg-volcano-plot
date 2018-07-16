import Vue from 'vue';
import WgVolcanoPlot from './WgVolcanoPlot.vue';

export default function (containerId, options) {
  options["domId"] = containerId + "-plot";
  const vm = new Vue({
    el: "#" + containerId,
    components: {
      WgVolcanoPlot
    },
    render: h => h("WgVolcanoPlot", {props: options})
  })

}
