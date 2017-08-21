<template>
  <div class="slider" ref="slider">
    <ul class="slider-group" ref="sliderGroup">
      <slot>
      </slot>
    </ul>
    <div class="dots">
      <span class="dot" :class="{active: currentPageIndex === index}" v-for="(item, index) in dots"></span>
    </div>
  </div>
</template>

<script type="text/ecmascript-6">
  import BetterScroll from 'better-scroll'
  export default {
    name: 'slider',
    props: {
      loop: {
        type: Boolean,
        default: true
      },
      autoPlay: {
        type: Boolean,
        default: true
      },
      interval: {
        type: Number,
        default: 2000
      }
    },
    data() {
      return {
        dots: [],
        currentPageIndex: 0
      }
    },
    mounted() {
      setTimeout(() => {
        this._setSliderWith()
        this._initslider()
        this._initDots()
        if (this.autoPlay) {
          this._autoPlay()
        }
        window.addEventListener('resize', () => {
          if (!this.slider) {
            return
          }
          this._setSliderWith(true)
          this.slider.refresh()
        })
      }, 20)
    },
    methods: {
      _setSliderWith(isResize) {
        this.children = this.$refs.sliderGroup.children
        let width = 0
        let sliderWidth = this.$refs.slider.clientWidth
        for (let i = 0; i < this.children.length; i++) {
          this.children[i].style.width = sliderWidth + 'px'
          width += sliderWidth
        }
        if (this.loop && !isResize) {
          width += 2 * sliderWidth
        }
        this.$refs.sliderGroup.style.width = width + 'px'
      },
      _initslider() {
        this.slider = new BetterScroll(this.$refs.slider, {
          scrollX: true,
          scrollY: false,
          momentum: false,
          snap: true,
          snapLoop: this.loop,
          snapThreshold: 0.3,
          snapSpeed: 400
        })
        this.slider.on('scrollEnd', () => {
          let pageIndex = this.slider.getCurrentPage().pageX
          if (this.loop) {
            pageIndex -= 1
          }
          this.currentPageIndex = pageIndex
          if (this.autoPlay) {
            clearTimeout(this.timer)
            this._autoPlay()
          }
        })
      },
      _initDots() {
        this.dots = new Array(this.children.length)
      },
      _autoPlay() {
        let pageIndex = this.currentPageIndex + 1
        if (this.loop) {
          pageIndex += 1
        }
        this.timer = setTimeout(() => {
          this.slider.goToPage(pageIndex, 0, 400)
        }, this.interval)
      }
    },
    destroyed() {
      clearTimeout(this.timer)
    }
  }
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"
  .slider
    min-height 1px
    .slider-group
      position relative
      overflow hidden
      white-space nowrap
      .slider-item
        float: left
        box-sizing: border-box
        overflow: hidden
        text-align: center
        a 
          display: block
          width: 100%
          overflow: hidden
          text-decoration: none
        img
          display: block
          width: 100%
    .dots
      position absolute
      left 50%
      top 84%
      margin-left -48px
      .dot
        font-size 0
        display inline-block
        margin 0 4px
        width 10px
        height 10px 
        border-radius 5px
        background-color $color-text
        &:first-child
          margin-left 0
        &.active
          width 20px
          height 10px 
          border-raduis 5px
          background-color $color-text
</style>