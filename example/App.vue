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
      input: "タスクA,2018-03-30,2018-04-02"
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
