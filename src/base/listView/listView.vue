<template>
  <scroll 
  :data="data" 
  class="listview" 
  ref="listview"
  :probeType ="probeType"
  :listenScroll = "listenScroll"
  @scroll="scroll">
    <ul>
      <li v-for="group in data" class="list-group" ref="listGroup">
        <h2 class="list-group-title">{{group.title}}</h2>
        <ul>
          <li @click="selectItem(item)" v-for="(item, index) in group.items" class="list-group-item" :data-index="index">
            <img class="avatar" v-lazy="item.avator">
            <span class="name">{{item.name}}</span>
          </li>
        </uL>
      </li>
    </ul>
    <div class="list-shortcut" @touchstart="onShortCutTouchStart" @touchmove.stop.prevent="onShortCutTouchMove">
      <ul>
        <li v-for="(item, index) in shortCutList" :data-index="index" class="item" :class="{'current': currentIndex === index}">{{item}}</li>
      </ul>
    </div>
    <div class="list-fixed" ref="fixed" v-show="fixedTitle">
      <div class="fixed-title">{{fixedTitle}}</div>
    </div>
    <div v-show="!data.length" class="loading-container">
      <loading></loading>
    </div>
  </scroll>
</template>

<script type="text/ecmascript-6">
  import Scroll from 'base/scroll/scroll'
  import Loading from 'base/loading/loading'
  const stateHeight = 18
  export default {
    props: {
      data: {
        type: Array,
        default: []
      }
    },
    created() {
      this.touch = {}
      this.listenScroll = true
      this.probeType = 3
    },
    data() {
      return {
        scrollY: -1,
        currentIndex: 0
      }
    },
    computed: {
      shortCutList() {
        return this.data.map((group) => {
          return group.title.substr(0, 1)
        })
      },
      fixedTitle() {
        if (this.scrollY > 0) {
          return ''
        }
        return this.data[this.currentIndex] ? this.data[this.currentIndex].title : ''
      }
    },
    methods: {
      selectItem(item) {
        this.$emit('select', item)
      },
      onShortCutTouchStart(event) {
        let currentTouchIndex = event.target.getAttribute('data-index')
        let firstTouch = event.touches[0]
        this.touch.y1 = firstTouch.pageY
        this.touch.currentTouchStartIndex = currentTouchIndex
        this._scrollTo(currentTouchIndex)
      },
      onShortCutTouchMove(event) {
        let firstTouch = event.touches[0]
        this.touch.y2 = firstTouch.pageY
        let currentTouchEndIndex = (this.touch.y2 - this.touch.y1) / stateHeight | 0
        let anchorIndex = parseInt(this.touch.currentTouchStartIndex) + currentTouchEndIndex
        console.log(this.touch.currentTouchStartIndex)
        this._scrollTo(anchorIndex)
      },
      scroll(pos) {
        this.scrollY = pos.y
      },
      _scrollTo(index) {
        if (!index && index !== 0) {
          return
        }
        if (index < 0) {
          this.currentIndex = 0
        } else if (index > this.listHight.length - 1) {
          this.currentIndex = this.listHight.length - 1
        }
        this.scrollY = -this.listHight[index - 1]
        this.$refs.listview.scrollToElement(this.$refs.listGroup[index], 0)
      },
      _calculateHeight() {
        this.listHight = []
        const list = this.$refs.listGroup
        let height = 0
        for (let i = 0; i < list.length; i++) {
          height += list[i].clientHeight
          this.listHight.push(height)
        }
        console.log(this.listHight)
      }
    },
    watch: {
      data() {
        setTimeout(() => {
          this._calculateHeight()
        }, 20)
      },
      scrollY(newY) {
        console.log(newY)
        const listHight = this.listHight
        // 当滚动到顶部时
        if (newY > 0) {
          this.currentIndex = 0
        }
        // 当滚动到中间部分时
        for (let i = 0; i < listHight.length - 1; i++) {
          let height1 = listHight[i]
          let height2 = listHight[i + 1]
          if (-newY < height1) {
            this.currentIndex = i
            return
          } else if (-newY >= height1 && -newY < height2) {
            this.currentIndex = i + 1
            return
          }
        }
        // 当滚动到尾部时
        this.currentIndex = listHight.length - 1
      }
    },
    components: {
      Scroll,
      Loading
    }
  }
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"
  .listview
    position: relative
    width: 100%
    height: 100%
    overflow: hidden
    background: $color-background
    .list-group
      padding-bottom: 30px
      .list-group-title
        height: 30px
        line-height: 30px
        padding-left: 20px
        font-size: $font-size-small
        color: $color-text-l
        background: $color-highlight-background
      .list-group-item
        display: flex
        align-items: center
        padding: 20px 0 0 30px
        .avatar
          width: 50px
          height: 50px
          border-radius: 50%
        .name
          margin-left: 20px
          color: $color-text-l
          font-size: $font-size-medium
    .list-shortcut
      position: absolute
      z-index: 30
      right: 0
      top: 50%
      transform: translateY(-50%)
      width: 20px
      padding: 20px 0
      border-radius: 10px
      text-align: center
      background: $color-background-d
      font-family: Helvetica
      .item
        padding: 3px
        line-height: 1
        color: $color-text-l
        font-size: $font-size-small
        &.current
          color: $color-theme
    .list-fixed
      position: absolute
      top: 0
      left: 0
      width: 100%
      .fixed-title
        height: 30px
        line-height: 30px
        padding-left: 20px
        font-size: $font-size-small
        color: $color-text-l
        background: $color-highlight-background
    .loading-container
      position: absolute
      width: 100%
      top: 50%
      transform: translateY(-50%)
</style>
