<template>
  <div>
    <div>
      <textarea v-model="input"></textarea>
    </div>
    <div>
      <gantt :input="input" @change="update"></gantt>
    </div>
  </div>
</template>

<script>
import Gantt from "../src/components/gantt.vue";

function zeropad(str) {
  return ("00" + str).slice(-2);
}

const d = new Date();
const exampleTask1 = `${d.getFullYear()}-${zeropad(d.getMonth() + 1)}-${zeropad(
  d.getDate()
)}`;
d.setDate(d.getDate() + 3);
const exampleTask2 = `${d.getFullYear()}-${zeropad(d.getMonth() + 1)}-${zeropad(
  d.getDate()
)}`;
d.setDate(d.getDate() + 3);
const exampleTask3 = `${d.getFullYear()}-${zeropad(d.getMonth() + 1)}-${zeropad(
  d.getDate()
)}`;

export default {
  data() {
    return {
      input: `New Task1,${exampleTask1},${exampleTask2}
New Task2,${exampleTask2},${exampleTask3}
New Task3,${exampleTask2},${exampleTask3}
`,
    };
  },
  methods: {
    update(value) {
      this.input = value;
    },
  },
  components: {
    Gantt,
  },
};
</script>

<style>
textarea {
  width: 100%;
  height: 10rem;
}
</style>
