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
export default {
  data() {
    return {
      input: `New Task1,2020-04-08,2020-04-20
New Task2,2020-04-17,2020-04-26
New Task3,2020-04-24,2020-05-01
`
    };
  },
  methods: {
    update(value) {
      this.input = value;
    }
  },
  components: {
    Gantt
  }
};
</script>

<style>
textarea {
  width: 100%;
  height: 10rem;
}
</style>
