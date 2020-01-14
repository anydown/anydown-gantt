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
      input: `New Task,2020-01-20,2020-01-30
New Task,2020-01-24,2020-02-03
New Task,2020-01-25,2020-02-04
New Task,2020-01-20,2020-01-30
New Task,2020-01-20,2020-01-30
New Task,2020-01-20,2020-01-30
New Task,2020-01-20,2020-01-30
New Task,2020-01-20,2020-01-30`
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
