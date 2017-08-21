<template>
  <div class="progress-bar" ref="progressBar" @click="progressClick">
    <div class="bar-inner">
      <div class="progress" ref="progress"></div>
      <div class="progress-btn-wrapper" ref="progressBtn" 
            @touchstart.prevent="progressTouchStart" 
            @touchmove.prevent="progressTouchMove" 
            @touchend="progressTouchEnd"
      >
        <div class="progress-btn"></div>
      </div>
    </div>
  </div>
</template>

<script type="text/ecmascript-6">
  import {prefixStyle} from 'common/js/dom'

  const progressBtnWidth = 16
  const transform = prefixStyle('transform')

  export default {
    props: {
      percent: {
        type: Number,
        default: 0
      }
    },
    created() {
      this.touch = {}
    },
    watch: {
      percent(newPercent) {
        if (newPercent >= 0 && !this.touch.initiated) {
          const barWidth = newPercent * this.$refs.progressBar.clientWidth - progressBtnWidth / 2
          this._setPosition(barWidth)
        }
      }
    },
    methods: {
      progressClick(e) {
        this._setPosition(e.offsetX)
        this._trigger('percentChange')
      },
      progressTouchStart(e) {
        this.touch.initiated = true
        this.touch.startX = e.touches[0].pageX
        this.touch.left = this.$refs.progress.clientWidth
      },
      progressTouchMove(e) {
        if (!this.touch.initiated) {
          return
        }
        this.touch.moveToX = e.touches[0].pageX - this.touch.startX
        this.touch.offsetWidth = Math.max(0, Math.min(this.touch.moveToX + this.touch.left, this.$refs.progressBar.clientWidth - progressBtnWidth))
        this._setPosition(this.touch.offsetWidth)
        this.$emit('percentChanging', this._getPercent())
      },
      progressTouchEnd() {
        this.touch.initiated = false
        this._trigger()
      },
      _setPosition(pos) {
        this.$refs.progress.style.width = `${pos}px`
        this.$refs.progressBtn.style[transform] = `translate3d(${pos}px, 0, 0)`
      },
      _trigger() {
        this.$emit('percentChange', this._getPercent())
      },
      _getPercent() {
        const barWidth = this.$refs.progressBar.clientWidth - progressBtnWidth
        return this.$refs.progress.clientWidth / barWidth
      }
    }
  }
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"
  .progress-bar
    height: 30px
    margin 0 10px
    .bar-inner
      position: relative
      top: 13px
      height: 4px
      background: rgba(0, 0, 0, 0.3)
      .progress
        position: absolute
        height: 100%
        background: $color-theme
      .progress-btn-wrapper
        position: absolute
        left: -8px
        top: -13px
        width: 30px
        height: 30px
        .progress-btn
          position: relative
          top: 7px
          left: 7px
          box-sizing: border-box
          width: 16px
          height: 16px
          border: 3px solid $color-text
          border-radius: 50%
          background: $color-theme
</style>