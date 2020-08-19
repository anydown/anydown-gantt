<template>
  <div class="gantt__root">
    <svg
      class="gantt"
      :width="svgWidth"
      :height="tasks.length * 32 + 48"
      @pointermove="onDrag"
      @pointerup="stopDrag"
      ref="gantt"
      style="background: white; outline: none;"
      tabindex="0"
      @keydown.ctrl.up="selectMoveUp"
      @keydown.ctrl.down="selectMoveDown"
      @keydown.ctrl.left="selectMoveLeft"
      @keydown.ctrl.right="selectMoveRight"
      @keydown.up.exact="selectUp"
      @keydown.down.exact="selectDown"
      @keydown.delete.exact="selectRemove"
      @keydown.enter="selectEdit"
      @blur="onBlur"
    >
      <!-- 全体を32px下げる（日付用余白） -->
      <g transform="translate(0, 48)">
        <!-- 背景 -->
        <rect
          class="background"
          x="0"
          y="0"
          fill="#eee"
          :width="svgWidth"
          :height="tasks.length * 32"
        />
        <g>
          <!-- 月 -->
          <text
            v-for="(line, index) in lines"
            :x="line.x + 0.5"
            y="-28"
            :key="index"
            class="labelMonth"
            text-anchor="start"
            font-weight="900"
            font-size="0.8rem"
            fill="#55a755"
          >{{line.labelMonth}}</text>
        </g>

        <!-- 本日 -->
        <rect :x="todayX" fill="#DDF" y="-23" width="20" height="20" rx="10" ry="10" />

        <g v-if="!longView">
          <!-- 日付 -->
          <text
            v-for="(line, index) in lines"
            :x="line.x + 10"
            y="-8"
            text-anchor="middle"
            font-size="0.8rem"
            :fill="line.color"
            :key="index"
          >{{line.label}}</text>
        </g>
        <g>
          <!-- 日付区切り線 -->
          <line
            v-for="(line, index) in lines"
            :x1="line.x"
            y1="0"
            :x2="line.x"
            :y2="tasks.length * 32"
            class="gridline"
            stroke="rgb(253, 253, 253)"
            stroke-width="2"
            :key="index"
          />
        </g>
        <!-- タスク -->
        <g>
          <g
            v-for="(task, index) in tasks"
            :transform="`translate(${scale(task.start)}, ${index * 32})`"
            :key="index"
            :class="{'dragging': index === draggingIndex}"
          >
            <rect
              class="task"
              :class="{'selected': index === selectedIndex}"
              fill="#b1b1ff"
              x="0"
              y="4"
              :width="scaleLength(task.end - task.start)"
              height="24"
              @pointerdown="startDrag($event, index)"
              @dblclick="editTask(index)"
            />
            <rect
              class="task-resize"
              @pointerdown="startResize($event, index)"
              :x="scaleLength(task.end - task.start) - 4"
              y="4"
              width="8"
              height="24"
              fill="black"
              opacity="0"
              style="cursor: ew-resize;"
              stroke-width="4"
            />

            <!-- inline editing -->
            <foreignObject
              class="inlineEditing"
              height="24"
              :width="scaleLength(task.end - task.start) < 200 ? 200 : scaleLength(task.end - task.start)"
              v-if="editing === index"
            >
              <form @submit.prevent="endEditing(index)">
                <input class="editingText" v-model="editingText" @blur="endEditing(index)" />
              </form>
            </foreignObject>
          </g>
        </g>
        <rect
          v-if="dragoverIndex > -1 && dragoverIndex !== draggingIndex"
          class="dragover"
          x="0"
          :y="32 * dragoverIndex"
          :width="svgWidth"
          height="32"
        />
        <text
          v-for="(task, index) in tasks"
          :key="index"
          class="taskname"
          :x="(scale(task.start) + 4) > 0 ? (scale(task.start) + 4) : 4"
          :y="index * 32 + 16"
          font-size="12"
          text-anchor="start"
          fill="black"
          line-height="32"
          alignment-baseline="middle"
          pointer-events="none"
          v-show="editing !== index"
        >{{task.name}}</text>
      </g>

      <!-- 印刷時には不可視 -->
      <g class="topNav" style="opacity: 0;">
        <!-- 前へ -->
        <g
          :transform="`translate(${svgWidth - 24 * 3 - 0.5}, 0.5)`"
          @click="moveRange(-1)"
          style="cursor: pointer;"
        >
          <rect fill="white" x="0" y="0" width="20" height="20" rx="4" ry="4" />
          <polyline points="15 5 5 10 15 15" stroke="#999" fill="none" />
        </g>

        <!-- 次へ -->
        <g
          :transform="`translate(${svgWidth - 24 * 2 - 0.5}, 0.5)`"
          @click="moveRange(1)"
          style="cursor: pointer;"
        >
          <rect fill="white" x="0" y="0" width="20" height="20" rx="4" ry="4" />
          <polyline points="5 5 15 10 5 15" stroke="#999" fill="none" />
        </g>

        <!-- タスク追加 -->
        <g
          :transform="`translate(${svgWidth - 24.5}, 0.5)`"
          @click="addTask"
          style="cursor: pointer;"
        >
          <rect fill="white" stroke="#999" x="0" y="0" width="20" height="20" rx="4" ry="4" />
          <line x1="10" x2="10" y1="5" y2="15" stroke="ForestGreen" />
          <line x1="5" x2="15" y1="10" y2="10" stroke="ForestGreen" />
        </g>
      </g>
    </svg>

    <div class="navBottom">
      <label class="navBottom__label">
        <input type="checkbox" v-model="longView" />Long
      </label>
      <button class="navBottom__button" @click="exportPng">Export</button>
    </div>
  </div>
</template>
<script>
import * as gantt from "./gantt-compiler";
import * as util from "./gantt-util.js";
import * as scale from "d3-scale";
const holiday = require("@holiday-jp/holiday_jp");
// import * as holiday from "@holiday-jp/holiday_jp";

export default {
  props: {
    input: String,
  },
  data() {
    return {
      tasks: [],
      taskName: "",
      svgWidth: 600,
      draggingIndex: -1,
      selectedIndex: -1,
      dragOffset: {
        x: 0,
        y: 0,
      },
      dragging: "none",
      dragoverIndex: -1,
      longView: false,
      displayOffset: 0,
      editing: -1,
      editingText: "",
    };
  },
  methods: {
    exportPng() {
      // scale 2x
      util.saveSvgAsPng(document, this.$refs.gantt, 2);
    },
    editTask(index) {
      this.editing = index;
      this.editingText = this.tasks[this.editing].name;
      this.selectedIndex = -1;
      this.$nextTick(() => {
        const el = this.$el.querySelector(".editingText");
        if (el) {
          el.focus();
          el.setSelectionRange(0, el.value.length);
        }
      });
    },
    endEditing() {
      if (this.editing >= 0) {
        this.tasks[this.editing].name = this.editingText;
        this.selectedIndex = this.editing;
        this.editing = -1;
        this.$emit("change", gantt.serialize(this.tasks));

        this.$nextTick(() => {
          const el = this.$el.querySelector(".gantt");
          if (el) {
            el.focus();
          }
        });
      }
    },
    onDrag(e) {
      if (this.dragging === "move") {
        const len = this.draggingItem.end - this.draggingItem.start;
        //差分値を基点に反映
        this.draggingItem.start = this.invert(e.offsetX - this.dragOffset.x);
        this.draggingItem.end = this.draggingItem.start + len;

        this.dragoverIndex = Math.floor((e.offsetY - 48) / 32);
      }
      if (this.dragging === "resize-x") {
        this.draggingItem.end = this.invert(e.offsetX);
      }
    },
    startDrag(e, index) {
      const el = e.currentTarget;
      el.setPointerCapture(e.pointerId);

      this.dragging = "move";
      this.draggingIndex = index;
      this.selectedIndex = index;
      //ページ左上とオブジェクト左上の差分から、ドラッグ開始位置（オブジェクト相対座標）を取得
      this.dragOffset.x = e.offsetX - this.scale(this.draggingItem.start);
      this.dragOffset.y = e.offsetY - index * 32 - 48;

      const len = this.draggingItem.end - this.draggingItem.start;
      this.onDrag(e);
    },
    startResize(e, index) {
      const el = e.currentTarget;
      el.setPointerCapture(e.pointerId);

      this.draggingIndex = index;
      this.selectedIndex = index;
      this.dragOffset.x = e.offsetX - this.scale(this.draggingItem.start);
      this.dragOffset.y = e.offsetY - index * 32 - 48;
      this.dragging = "resize-x";
      this.onDrag(e);
    },
    stopDrag() {
      if (this.dragging !== "none") {
        this.draggingItem.start = util.roundHMSfromEpoc(
          this.draggingItem.start
        );
        this.draggingItem.end = util.roundHMSfromEpoc(this.draggingItem.end);
      }
      if (this.dragging === "move") {
        if (this.draggingIndex !== this.dragoverIndex) {
          const task = this.tasks.splice(this.draggingIndex, 1);
          this.tasks.splice(this.dragoverIndex, 0, task[0]);
          this.selectedIndex = this.dragoverIndex;
        }
      }
      if (this.dragging !== "none") {
        this.$emit("change", gantt.serialize(this.tasks));
      }

      this.dragging = "none";
      this.draggingIndex = -1;
      this.dragoverIndex = -1;
    },
    scaleLength(epocdiff) {
      return (
        ((epocdiff / (24 * 60 * 60 * 1000)) * this.svgWidth) /
        this.displayRangeLength
      );
    },
    scale(epoc) {
      return scale
        .scaleLinear()
        .domain(this.timeRange)
        .range([0, this.svgWidth])(epoc);
    },
    invert(x) {
      return scale
        .scaleLinear()
        .domain(this.timeRange)
        .range([0, this.svgWidth])
        .invert(x);
    },
    setTasks(input) {
      this.tasks = gantt.compile(input);
    },
    addTask(task) {
      this.tasks.push({
        name: "New Task",
        start: util.getRelativeDate(0).getTime(),
        end: util.getRelativeDate(1).getTime(),
      });
      this.$emit("change", gantt.serialize(this.tasks));
      this.editTask(this.tasks.length - 1);
    },
    moveRange(offset) {
      const moveAmount = offset * (this.longView ? 31 : 7);
      this.displayOffset += moveAmount;
    },
    selectMoveDown() {
      if (this.selectedIndex === -1) {
        return;
      }
      if (this.selectedIndex < this.tasks.length - 1) {
        const task = this.tasks.splice(this.selectedIndex, 1);
        this.tasks.splice(this.selectedIndex + 1, 0, task[0]);
        this.selectedIndex = this.selectedIndex + 1;
        this.$emit("change", gantt.serialize(this.tasks));
      }
    },
    selectMoveUp() {
      if (this.selectedIndex === -1) {
        return;
      }
      if (this.selectedIndex > 0) {
        const task = this.tasks.splice(this.selectedIndex, 1);
        this.tasks.splice(this.selectedIndex - 1, 0, task[0]);
        this.selectedIndex = this.selectedIndex - 1;
        this.$emit("change", gantt.serialize(this.tasks));
      }
    },
    selectMoveLeft() {
      if (this.selectedIndex === -1) {
        return;
      }
      this.selectedItem.start -= 24 * 60 * 60 * 1000;
      this.selectedItem.end -= 24 * 60 * 60 * 1000;
      this.$emit("change", gantt.serialize(this.tasks));
    },
    selectMoveRight() {
      if (this.selectedIndex === -1) {
        return;
      }
      this.selectedItem.start += 24 * 60 * 60 * 1000;
      this.selectedItem.end += 24 * 60 * 60 * 1000;
      this.$emit("change", gantt.serialize(this.tasks));
    },
    selectUp() {
      if (this.selectedIndex === -1) {
        return;
      }
      if (this.selectedIndex > 0) {
        this.selectedIndex -= 1;
      }
    },
    selectDown() {
      if (this.selectedIndex === -1) {
        return;
      }
      if (this.selectedIndex < this.tasks.length - 1) {
        this.selectedIndex += 1;
      }
    },
    selectRemove() {
      if (this.selectedIndex === -1) {
        return;
      }
      this.tasks.splice(this.selectedIndex, 1);
      this.$emit("change", gantt.serialize(this.tasks));
    },
    selectEdit(ev) {
      if (this.selectedIndex === -1) {
        return;
      }
      this.$nextTick(() => {
        this.editTask(this.selectedIndex);
      });
      ev.preventDefault();
    },
    onBlur() {
      this.selectedIndex = -1;
    },
  },
  watch: {
    input() {
      this.setTasks(this.input);
    },
  },
  computed: {
    lines() {
      const start = this.timeRange[0];
      const end = this.timeRange[1];
      return generateLineByRange(start, end, this.displayRange, this.svgWidth);
    },
    displayRange() {
      //1つの日付は最低24px
      const columnWidth = this.longView ? 6 : 24;
      const viewRange = Math.floor(this.svgWidth / columnWidth);
      return this.longView
        ? {
            start: 31 * -1 + this.displayOffset,
            end: 31 * -1 + viewRange + this.displayOffset,
          }
        : {
            start: -2 + this.displayOffset,
            end: -2 + viewRange + this.displayOffset,
          };
    },
    draggingItem() {
      return this.tasks[this.draggingIndex];
    },
    selectedItem() {
      return this.tasks[this.selectedIndex];
    },
    timeRange() {
      return [
        util.getRelativeDate(this.displayRange.start).getTime(),
        util.getRelativeDate(this.displayRange.end).getTime(),
      ];
    },
    displayRangeLength() {
      return this.displayRange.end - this.displayRange.start;
    },
    todayX() {
      const start = this.timeRange[0];
      const end = this.timeRange[1];
      const len = end - start;

      const reldate = util.getRelativeDate(0);
      const t = ((reldate.getTime() - start) / len) * this.svgWidth;
      return Math.round(t);
    },
  },
  mounted() {
    this.setTasks(this.input);

    window.addEventListener("resize", () => {
      this.svgWidth = this.$el.clientWidth;
    });
    this.svgWidth = this.$el.clientWidth;
  },
};

function generateLineByRange(start, end, displayRange, svgWidth) {
  let lines = [];
  const len = end - start;
  let month = -1;
  const displayRangeLength = displayRange.end - displayRange.start;
  for (let i = 0; i < displayRangeLength; i++) {
    const reldate = util.getRelativeDate(displayRange.start + i);
    const t = ((reldate.getTime() - start) / len) * svgWidth;
    let color = "#666666";
    if (reldate.getDay() === 0) {
      color = "#FF6666";
    }
    if (reldate.getDay() === 6) {
      color = "#6666FF";
    }

    const isJa = navigator.language.indexOf("ja") >= 0;
    if (isJa && holiday.isHoliday(reldate)) {
      color = "#FF6666";
    }

    let monthStr = "";
    const monthArray = isJa
      ? util.getMonthArray()["ja-JP"]
      : util.getMonthArray()["en"];

    if (month != reldate.getMonth() + 1) {
      month = reldate.getMonth() + 1;
      monthStr = monthArray[reldate.getMonth()];
    }

    lines.push({
      x: Math.round(t),
      label: reldate.getDate(),
      color: color,
      labelMonth: monthStr,
    });
  }
  return lines;
}
</script>
<style>
.task {
  cursor: pointer;
}
.task.selected {
  stroke: black;
}

svg.gantt {
  cursor: default;
  user-select: none;
  touch-action: none;
}
.taskname {
  cursor: default;
}
.dragging {
  opacity: 0.5;
}
.dragover {
  opacity: 0.1;
}

.inlineEditing {
  transform: translate(0px, 4px);
}

.inlineEditing form {
  display: flex;
  height: 100%;
  margin-top: 4;
}
.editingText {
  flex: 1;
  font-size: 12;
}
.navBottom {
  display: flex;
  justify-content: flex-end;
}

.navBottom__label {
  font-size: 0.7em;
}
.navBottom__button {
  border: 1px solid #aaa;
  background: white;
  border-radius: 4px;
  margin-left: 1em;
  font-size: 0.7em;
  cursor: pointer;
}

.topNav {
  opacity: 1 !important;
}
</style>