<script lang="ts" setup>
import { type PropType, ref, reactive, computed, onMounted, toRaw } from "vue"
import type { MovableView } from "@uni-helper/uni-app-types"
import { onShow } from "@dcloudio/uni-app"

defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: "shared",
  },
})

const props = defineProps({
  position: {
    type: String as PropType<"left-top" | "right-top" | "left-bottom" | "right-bottom">,
    default: "right-bottom",
  },
  gap: {
    type: Object as PropType<{ top: number, left: number, right: number, bottom: number }>,
    default: () => ({ top: 0, left: 16, right: 16, bottom: 0 }),
  },
})

const MovableViewRef = ref<InstanceType<MovableView>>()

const isH5 = process.env.UNI_PLATFORM === "h5"

const inited = ref<boolean>(false) // 是否初始化完成
const isActive = ref<boolean>(false) // 是否激活状态
const isAnimation = ref<boolean>(false) // 是否动画
const horizontalDirection = ref<"left" | "right">("left")

// #region 小球位置缓存操作
const MainBallPosCacheKey = "main-ball-pos-cache"
function loadCahe() {
  const cache = uni.getStorageSync<typeof mainBallPostion>(MainBallPosCacheKey)
  if (cache) {
    mainBallPostion.top = cache.top
    mainBallPostion.left = cache.left
    mainBallPostionBackup.top = cache.top
    mainBallPostionBackup.left = cache.left

    fixDirection()
  }
}
function saveCache({ top, left }: typeof mainBallPostion) {
  uni.setStorageSync(MainBallPosCacheKey, { top, left })
}
// #endregion

const mainBallPostion = reactive({ top: 0, left: 0 })
const mainBallPostionBackup = reactive({ top: 0, left: 0 })
const screen = reactive({ width: 0, height: 0 })

// #region TODO: 样式相关，可根据实际情况调整
/** 小球宽度 */
const fabSize = ref<number>(64)
/** 小球收缩时露出的宽度倍数 */
const shrinkWidth = computed(() => fabSize.value * 3 / 4)
/** 移动区域单边拓展的大小 */
const asideExpandWidth = computed(() => fabSize.value - shrinkWidth.value)
/** 周边小球距离中心的距离 */
const detaDistance = computed(() => fabSize.value * 1.2)
// #endregion

const bounding = reactive({
  minTop: 0,
  minLeft: 0,
  maxTop: 0,
  maxLeft: 0,
})

/** TODO: tabbar 高度 | 原生为 50 */
const tabbarHeight = 50
/** TODO: titlebar 高度 | 原生为 44 */
const titleBarHeight = 44

function getBounding() {
  const sysInfo = uni.getSystemInfoSync()
  const { top, left, right, bottom } = props.gap
  const bottomFix = sysInfo.safeAreaInsets?.bottom ?? 0 + tabbarHeight
  screen.width = sysInfo.windowWidth
  // TODO: 这里需要考虑到非H5的情况 ｜ 有顶部标题栏的存在，视项目而定，本项目是自定义的标题栏（且本项目设定仅在非h5环境下才有标题栏）
  screen.height = sysInfo.windowHeight - sysInfo.windowTop - (isH5 ? 0 : ((sysInfo.statusBarHeight || 0) + titleBarHeight))
  bounding.minLeft = asideExpandWidth.value + left
  bounding.maxLeft = screen.width - shrinkWidth.value - right
  bounding.minTop = asideExpandWidth.value + detaDistance.value + top
  bounding.maxTop = screen.height - shrinkWidth.value - detaDistance.value - bottom - bottomFix
}

function initPosition() {
  const pos = props.position
  const { minLeft, minTop, maxLeft, maxTop } = bounding
  if (pos === "left-top") {
    mainBallPostion.top = minTop
    mainBallPostion.left = minLeft
  }
  else if (pos === "right-top") {
    mainBallPostion.top = minTop
    mainBallPostion.left = maxLeft
  }
  else if (pos === "left-bottom") {
    mainBallPostion.top = maxTop
    mainBallPostion.left = minLeft
  }
  else if (pos === "right-bottom") {
    mainBallPostion.top = maxTop
    mainBallPostion.left = maxLeft
  }
}

onMounted(() => {
  getBounding()
  initPosition()
  loadCahe()
  inited.value = true
})
onShow(() => {
  if (inited.value) {
    getBounding()
    initPosition()
    loadCahe()
  }
})

/** 修正水平方向 */
function fixDirection(left?: number) {
  left = left === undefined ? mainBallPostion.left : left
  if (left < (screen.width / 2 + asideExpandWidth.value - fabSize.value / 2))
    horizontalDirection.value = "left"
  else
    horizontalDirection.value = "right"
}

function ballClick() {
  isActive.value = !isActive.value
  if (!isActive.value) {
    hideBall()
  }
  else {
    if (mainBallPostionBackup.left < bounding.minLeft)
      mainBallPostion.left = bounding.minLeft
    if (mainBallPostionBackup.left > bounding.maxLeft)
      mainBallPostion.left = bounding.maxLeft
    if (mainBallPostionBackup.top < bounding.minTop)
      mainBallPostion.top = bounding.minTop
    if (mainBallPostionBackup.top > bounding.maxTop)
      mainBallPostion.top = bounding.maxTop
  }
}

const ballHideProcess = ref<NodeJS.Timeout | null>(null)

function hideBall(delay?: boolean) {
  if ((!isActive.value && delay) || !delay) {
    isActive.value = false

    mainBallPostion.left = horizontalDirection.value === "left" ? 0 : screen.width
    if (mainBallPostionBackup.top < bounding.minTop)
      mainBallPostion.top = bounding.minTop - detaDistance.value
    if (mainBallPostionBackup.top > bounding.maxTop)
      mainBallPostion.top = bounding.maxTop + detaDistance.value

    setTimeout(() => {
      isAnimation.value = false
    }, 30)
    // 小程序不支持下面的写法
    // requestAnimationFrame(() => {
    //   isAnimation.value = false
    // })
  }
}
function ballHideDelayClear() {
  if (ballHideProcess.value) {
    clearTimeout(ballHideProcess.value)
    ballHideProcess.value = null
  }
}

function handleTouchStart(e: TouchEvent) {
  ballHideDelayClear()
}
function handleTouchEnd() {
  mainBallPostion.top = mainBallPostionBackup.top
  mainBallPostion.left = mainBallPostionBackup.left

  isAnimation.value = true
  ballHideProcess.value = setTimeout(hideBall, 1500, true)
}
const handleTouchMove: InstanceType<MovableView>["onChange"] = (e) => {
  saveCache({ top: e.detail.y, left: e.detail.x })
  mainBallPostionBackup.top = e.detail.y
  mainBallPostionBackup.left = e.detail.x

  fixDirection(mainBallPostionBackup.left)
}

// #region TODO: 工具列表
/** 工具按钮1 */
const toolOne = ref<ITool>({
  name: "工具",
  icon: "icon",
  onClick: () => {
    // TODO: 如果需要点击的时候隐藏小球，可以在这里调用 hideBall()
    hideBall()

    // TODO: 其他操作
    uni.showToast({ title: "工具", icon: "none" })
  }
})
/** 工具按钮2 */
const tools: ITool[] = Array.from({ length: 3 }, (_, i) => ({
  name: `工具${i + 1}`,
  icon: `icon${i + 1}`,
  onClick: () => {
    hideBall()
    uni.showToast({ title: `工具${i + 1}`, icon: "none" })
  }
}))

const toolsList = computed<ITool[]>(() => {
  return [toolOne.value, ...tools]
})
// #endregion
</script>

<script lang="ts">
/** TODO: 工具接口，`onClick` 是必须的，其他随意，可以自行拓展该接口 */
interface ITool {
  name?: string;
  icon?: string;
  onClick: () => void;
}
</script>

<template>
  <movable-area v-if="inited" class="movable-area" :style="{
    '--button-size': `${fabSize}px`,
    '--shrink-width': `${shrinkWidth}px`,
    '--aside-expand-width': `${asideExpandWidth}px`,
    'pointer-events': isActive ? 'all' : 'none',
  }" @click="ballClick">
    <movable-view ref="MovableViewRef" class="movable-view ball-wrap" :animation="isAnimation" :x="mainBallPostion.left"
      :y="mainBallPostion.top" direction="all" @tap.stop="ballClick" @touchstart="handleTouchStart"
      @change="handleTouchMove" @touchend="handleTouchEnd" @touchcancel="handleTouchEnd">
      <view style="position: relative;">
        <view class="ball-core" />
        <view v-if="isActive" class="float-ball-items" :style="`--deta-distance: ${detaDistance}px;`">
          <view v-for="(item, index) in toolsList" :key="index" :data-index="index" class="ball-item" :style="{
            '--item-theta': `${180 / ((toolsList.length - 1) || 1) * index}deg`,
            '--item-x': `${Math.cos((180 / ((toolsList.length - 1) || 1) * index * Math.PI / 180) - Math.PI / 2) * detaDistance * (horizontalDirection === 'right' ? -1 : 1)}px`,
            '--item-y': `${Math.sin((180 / ((toolsList.length - 1) || 1) * index * Math.PI / 180) - Math.PI / 2) * detaDistance * (horizontalDirection === 'right' ? -1 : 1)}px`,
            'left': 'var(--item-x)',
            'top': 'var(--item-y)',
          }" @click.stop="item.onClick">
            <!-- TODO: 自己实现图标渲染方式，或者自行用其他逻辑处理此处，以标识不同的工具小球 -->
            <text>{{ item.icon }}</text>
          </view>
        </view>
      </view>
    </movable-view>
  </movable-area>
</template>

<style lang="scss" scoped>
@keyframes fadein {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes fadeout {
  from {
    opacity: 1;
  }

  to {
    opacity: 0.2;
  }
}

@keyframes rotate {
  from {
    transform: rotate(-90deg);
  }

  to {
    transform: rotate(0deg);
  }
}

.toolone-movable-view {
  width: fit-content;
  height: fit-content;
  // 这个很关键，否则 movable-area 存在 `pointer-events: none;` 样式时，元素无法拖拽
  pointer-events: all;
  // z-index: -1;
}

.movable-area {
  --area-expand-width: calc(var(--aside-expand-width) * 2); // 可拖动区域扩展宽度

  z-index: 101;
  position: fixed !important;
  width: calc(var(--area-expand-width) + 100%);
  height: calc(var(--area-expand-width) + 100%);
  top: calc(var(--aside-expand-width) * -1);
  left: calc(var(--aside-expand-width) * -1);
  /* #ifndef H5 */
  height: calc(var(--area-expand-width) + 100% - var(--wot-window-top));
  top: calc(var(--aside-expand-width) * -1 + var(--wot-window-top));
  /* #endif */

  .ball-wrap {
    position: relative;
    width: fit-content;
    height: fit-content;
    border-radius: 50%;
    pointer-events: all;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    // box-shadow: 0px 0px 12rpx rgba(0, 0, 0, 0.5);

    .ball-core {
      width: var(--button-size);
      height: var(--button-size);
      background-color: grey;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;

      &::before {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 60%;
        height: 60%;
        border: rgba(255, 255, 255, 0.6) solid 2px;
        border-radius: 50%;
      }
    }

    .float-ball-items {
      position: absolute;
      top: 50%;
      left: 50%;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      height: var(--button-size);
      width: var(--button-size);

      animation-name: fadein;
      animation-timing-function: ease-in;
      animation-duration: 0.5s;

      .ball-item {
        position: absolute;
        top: 0;
        left: 0;

        border-radius: 50%;
        height: var(--button-size);
        width: var(--button-size);
        background-color: grey;

        animation-name: rotate;
        animation-timing-function: ease-in;
        animation-duration: 0.5s;

        display: flex;
        justify-content: center;
        align-items: center;
        color: white;
      }
    }
  }
}
</style>
