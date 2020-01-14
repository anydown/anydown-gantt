# anydown-gantt
gantt component for anydown

[![npm version](https://badge.fury.io/js/%40anydown%2Fanydown-gantt.svg)](https://badge.fury.io/js/%40anydown%2Fanydown-gantt)

![image](https://user-images.githubusercontent.com/3132889/72329536-42479c00-36f8-11ea-9ef8-0fd052c54289.png)

# Usage

```vue
<template>
  <div>
    <gantt :input="input"></gantt>
  </div>
</template>
<script>
import Gantt from "@anydown/anydown-gantt"
import '@anydown/anydown-gantt/dist/anydown-gantt.css'

export default {
  components: {
    Gantt
  },
  data() {
    return {
      input: "タスクA,2020-01-30,2020-02-02"
    };
  },
};
</script>
```