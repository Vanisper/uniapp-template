class WindowInfoService {
  private consumerCount = 0
  private isListening = false
  private readonly state = shallowRef(uni.getWindowInfo())

  readonly windowInfo = readonly(this.state)
  readonly safeBottom = computed(() => this.state.value.safeArea.bottom)
  readonly statusBarHeight = computed(() => this.state.value.statusBarHeight)

  use() {
    this.consumerCount += 1
    this.start()

    onResize(this.sync)
    onScopeDispose(this.release)

    return {
      windowInfo: this.windowInfo,
      safeBottom: this.safeBottom,
      statusBarHeight: this.statusBarHeight,
    }
  }

  private readonly sync = () => {
    this.state.value = uni.getWindowInfo()
  }

  private readonly release = () => {
    this.consumerCount = Math.max(0, this.consumerCount - 1)

    if (this.consumerCount === 0) {
      this.stop()
    }
  }

  private start() {
    this.sync()

    if (this.isListening) {
      return
    }

    uni.onWindowResize(this.sync)
    this.isListening = true
  }

  private stop() {
    if (!this.isListening) {
      return
    }

    uni.offWindowResize(this.sync)
    this.isListening = false
  }
}

const windowInfoService = new WindowInfoService()

export function useWindowInfo() {
  return windowInfoService.use()
}

export default useWindowInfo
