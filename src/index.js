import Gantt from "./components/gantt.vue";

export default Gantt;

if (typeof window !== "undefined" && window.Vue) {
  window.Vue.component(Gantt.name, Gantt);
}
