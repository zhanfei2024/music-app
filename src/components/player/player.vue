<template>
  <div class="player">
    <transition name="normal">
      <div class="normal-player" v-show="fullScreen">
        <div class="background">
          <img width="100%" height="100%" :src="currentSong.image">
        </div>
        <div class="top">
          <div @click="back" class="back">
            <i class="icon-back"></i>
          </div>
          <h1 class="title" v-html="currentSong.name"></h1>
          <h2 class="subtitle" v-html="currentSong.singer"></h2>
        </div>
        <div class="middle" @touchstart="middleTouchStart" @touchmove="middleTouchMove" @touchend="middleTouchEnd">
          <div class="middle-l" ref="middleL">
            <div class="cd-wrapper">
              <div class="cd" :class="cdCls">
                <img class="image" :src="currentSong.image">
              </div>
            </div>
          </div>
          <scroll class="middle-r" ref="lyriclist" :data="currentLyric && currentLyric.lines">
            <div class="lyric-wrapper">
              <div v-if="currentLyric">
                <p class="text" :class="{'current': currentLineNum === index}" ref="lyricLine" v-for="(line, index) in currentLyric.lines">{{line.txt}}</p>
              </div>
            </div>
          </scroll>
        </div>
        <div class="bottom">
          <div class="dot-wrapper">
            <span class="dot" :class="{'active':currentShow==='cd'}"></span>
            <span class="dot" :class="{'active':currentShow==='lyric'}"></span>
          </div>
          <div class="progress-wrapper">
            <span class="time time-l">{{format(currentTime)}}</span>
            <div class="progress-bar-wrapper">
              <progress-bar :percent="percent" @percentChange="onProgressBarChange" @percentChanging="onProgressBarChanging"></progress-bar>
            </div>
            <span class="time time-r">{{format(currentSong.duration)}}</span>
          </div>
          <div class="operators">
            <div class="icon i-left">
              <i @click="changeMode" :class="iconMode"></i>
            </div>
            <div class="icon i-left">
              <i @click="prev" class="icon-prev" :class="disableCls"></i>
            </div>
            <div class="icon i-center">
              <i @click="togglePlaying" :class="playIcon"></i>
            </div>
            <div class="icon i-right">
              <i @click="next" class="icon-next" :class="disableCls"></i>
            </div>
            <div class="icon i-right">
              <i class="icon icon-not-favorite"></i>
            </div>
          </div>
        </div>
      </div>
    </transition>
    <transition name="mini">
      <div @click="open" class="mini-player" v-show="!fullScreen && currentSong.image">
        <div class="icon">
          <img width="40" height="40" :class="cdCls" :src="currentSong.image">
        </div>
        <div class="text">
          <h2 class="name" v-html="currentSong.name"></h2>
          <p class="desc" v-html="currentSong.singer"></p>
        </div>
        <div class="control">
          <progress-circle :percent="percent">
            <i @click.stop="togglePlaying" :class="miniIcon" class="icon-mini"></i>
          </progress-circle>
        </div>
        <div class="control">
          <i class="icon-playlist"></i>
        </div>
      </div>
    </transition>
    <audio ref="audio" :src="currentSong.url" @canplay="ready" @error="error" @ended="end" @timeupdate="updateTime"></audio>
  </div>
</template>

 <script type="text/ecmascript-6">
import { mapGetters, mapMutations } from 'vuex'  // 从vuex引入mapGetters、mapMutation函数
import ProgressBar from 'base/progress-bar/progress-bar' // 引入组件，并命名为ProgressBar
import ProgressCircle from 'base/progress-circle/progress-circle' // 引入组件，并命名为ProgressCircle
import Scroll from 'base/scroll/scroll' // 引入组件，并命名为Scroll
import { playMode } from 'common/js/config' // 引入常量playMode
import { shuffle } from 'common/js/util' // 引入函数shuffle
import Lyric from 'lyric-parser'  // 引入歌词处理对象Lyric
import { prefixStyle } from 'common/js/dom' // 引入prefixStyle函数

const transform = prefixStyle('transform')
const transitionDuration = prefixStyle('transitionDuration')

export default {
  data() {
    return {
      songReady: false,
      currentTime: 0,
      currentLyric: null,
      currentLineNum: 0,
      currentShow: 'cd'
    }
  },
  created() {
    this.touch = {}
  },
  computed: {
    // 通过计算，得到iconMode的值（icon-sequence、icon-loop、icon-random）
    iconMode() {
      return this.mode === 0 ? 'icon-sequence' : this.mode === 1 ? 'icon-loop' : 'icon-random'
    },
    // 通过计算，得到播放时间百分比percent
    percent() {
      if (this.currentTime > 0) {
        return this.currentTime / this.currentSong.duration
      }
    },
    // 变量disableCls，返回 '':'disable'
    disableCls() {
      return this.songReady ? '' : 'disable'
    },
    // 变量cdCls，返回'play':'pause'
    cdCls() {
      return this.playing ? 'play' : 'pause'
    },
    // 变量playIcon，返回'icon-pause':'icon-play'
    playIcon() {
      return this.playing ? 'icon-pause' : 'icon-play'
    },
    miniIcon() {
      return this.playing ? 'icon-play-mini' : 'icon-pause-mini'
    },

    ...mapGetters([
      'fullScreen',
      'playList',
      'currentSong',
      'playing',
      'currentIndex',
      'mode',
      'sequenceList'
    ])
  },
  methods: {
    // 点击播放模式按钮，调用此函数
    changeMode() {
      let modeChanged = (this.mode + 1) % 3
      let list = null
      this.setMode(modeChanged)
      if (modeChanged === playMode.random) {
        list = shuffle(this.sequenceList)
      } else {
        list = this.sequenceList
      }
      this.setPlayList(list)
      this.resetCurrentIndex(list)
    },
    // 获取同一首歌在打乱之后的数组中的索引
    resetCurrentIndex(list) {
      let index = list.findIndex((item) => {
        return item.id === this.currentSong.id
      })
      this.setCurrentIndex(index)
    },
    // 拖动播放按钮时，设置播放器的播放时间
    onProgressBarChanging(percent) {
      this.currentTime = this.currentSong.duration * percent
      if (this.currentLyric) {
        this.currentLyric.seek(this.currentTime * 1000)
      }
    },
    onProgressBarChange(percent) {
      const currentTime = this.currentSong.duration * percent
      this.currentTime = this.$refs.audio.currentTime = currentTime
      if (this.currentLyric) {
        this.currentLyric.seek(currentTime * 1000)
      }
      if (!this.playing) {
        this.togglePlaying()
      }
    },
    // 点击normalplayer时，调用此函数
    back() {
      this.setFullScreen(false)
    },
    // 点击miniplayer时，调用此函数
    open() {
      this.setFullScreen(true)
    },
    // audio事件更新函数
    updateTime(e) {
      this.currentTime = e.target.currentTime
    },
    ...mapMutations({
      setFullScreen: 'SET_FULLSCREEN',
      setPlaying: 'SET_PLAYING',
      setCurrentIndex: 'SET_CURRENTINDEX',
      setMode: 'SET_MODE',
      setPlayList: 'SET_PLAYLIST'
    }),
    // 播放暂停事件函数
    togglePlaying() {
      if (!this.songReady) {
        return
      }
      this.setPlaying(!this.playing)
      if (this.currentLyric) {
        this.currentLyric.togglePlay()
      }
      console.log(this.songReady)
      console.log(this.playing)
      this.songReady = false
    },
    // 上一首歌事件函数
    prev() {
      if (!this.songReady) {
        return
      }
      let index = this.currentIndex - 1
      if (index === -1) {
        index = this.playList - 1
      }
      this.setCurrentIndex(index)
      this.songReady = false
    },
    // 下一首歌事件函数
    next() {
      if (!this.songReady) {
        return
      }
      let index = this.currentIndex + 1
      if (index === this.playList.length) {
        index = 0
      }
      this.setCurrentIndex(index)
      this.songReady = false
    },
    // audio当前歌曲播放结束调用的事件函数
    end() {
      if (this.mode === playMode.loop) {
        this.loop()
      } else {
        this.next()
      }
    },
    loop() {
      this.$refs.audio.currentTime = 0
      this.$refs.audio.play()
      if (this.currentLyric) {
        this.currentLyric.seek(0)
      }
    },
    // audio资源加载好调用此事件函数
    ready() {
      this.songReady = true
    },
    // audio播放出错时调用此事件函数
    error() {
      this.songReady = true
    },
    // 时间戳初始化函数，把时间戳转成00：00（分：秒）
    format(interval) {
      interval = interval | 0
      let minute = this._pad(interval / 60 | 0)
      let second = this._pad(interval % 60 | 0)
      return `${minute}:${second}`
    },
    // 获取当前歌曲的歌词，开始播放
    getLyric() {
      this.currentSong.getLyric().then((lyric) => {
        this.currentLyric = new Lyric(lyric, this.handleLyric)
        if (this.playing) {
          this.currentLyric.play()
        }
        console.log(this.currentLyric)
      })
    },
    // 开始播放歌词时，调用此回调函数
    handleLyric({ lineNum, txt }) {
      this.currentLineNum = lineNum
      let lienLe = this.$refs.lyricLine[lineNum - 5]
      if (lineNum > 5) {
        this.$refs.lyriclist.scrollToElement(lienLe, 1000)
      } else {
        this.$refs.lyriclist.scrollTo(0, 0, 1000)
      }
    },
    // 手指开始触碰到player时，调用此函数，记录坐标
    middleTouchStart(e) {
      this.touch.initiated = true
      this.touch.startX = e.touches[0].pageX
      this.touch.startY = e.touches[0].pageY
    },
    // 手指移动时，调用此函数，记录移动到的坐标，lyric的页面偏移量，偏移百分比
    middleTouchMove(e) {
      if (!this.touch.initiated) {
        return
      }
      this.touch.deltaX = e.touches[0].pageX
      this.touch.deltaY = e.touches[0].pageY
      const offsetH = this.touch.deltaX - this.touch.startX
      const offsetV = this.touch.deltaY - this.touch.startY
      if (Math.abs(offsetH) < Math.abs(offsetV)) {
        return
      } else {
        const left = this.currentShow === 'cd' ? 0 : -window.innerWidth
        const offsetWidth = Math.min(0, Math.max(-window.innerWidth, left + offsetH))
        this.touch.offsetPercent = Math.abs(offsetWidth / window.innerWidth)
        this.$refs.lyriclist.$el.style[transform] = `translate3d(${offsetWidth}px, 0, 0)`
        this.$refs.middleL.style.opacity = 1 - this.touch.offsetPercent
        this.$refs.lyriclist.$el.style[transitionDuration] = 0
      }
    },
    // 手指抬起时，调用此函数，设置lyric的位置，过度时间，显示状态
    middleTouchEnd() {
      let offsetWidth
      let opacity
      const durationTime = 300
      this.touch.initiated = false
      if (this.currentShow === 'cd') {
        if (this.touch.offsetPercent > 0.1) {
          offsetWidth = -window.innerWidth
          opacity = 0
        } else {
          offsetWidth = 0
          opacity = 1
        }
        this.currentShow = 'lyric'
      } else {
        if (this.touch.offsetPercent < 0.9) {
          offsetWidth = 0
          opacity = 1
        } else {
          offsetWidth = -window.innerWidth
          opacity = 0
        }
        this.currentShow = 'cd'
      }
      this.$refs.lyriclist.$el.style[transform] = `translate3d(${offsetWidth}px, 0, 0)`
      this.$refs.lyriclist.$el.style[transitionDuration] = `${durationTime}ms`
      this.$refs.middleL.style.opacity = opacity
    },
    // 组件私有方法，为不足两位数补0
    _pad(num, n = 2) {
      let len = num.toString().length
      while (len < n) {
        num = '0' + num
        len++
      }
      return num
    }
  },
  // 观察模式，观察组件中的属性值是否改变，如改变，调用函数，可利用原有值和新值
  watch: {
    currentSong(newSong, oldSong) {
      if (newSong.id === oldSong.id) {
        return
      }
      if (this.currentLyric) {
        this.currentLyric.stop()
      }
      this.$nextTick(() => {
        this.$refs.audio.play()
        this.getLyric()
      })
    },
    playing(newPlaying) {
      const audio = this.$refs.audio
      this.$nextTick(() => {
        newPlaying ? audio.play() : audio.pause()
      })
    }
  },
  // 所有import的组件，必须注册
  components: {
    ProgressBar,
    ProgressCircle,
    Scroll
  }
}
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"
  @import "~common/stylus/mixin"
  .player
    .normal-player
      position: fixed
      left: 0
      right: 0
      top: 0
      bottom: 0
      z-index: 150
      background: $color-background
      .background
        position: absolute
        left: 0
        top: 0
        width: 100%
        height: 100%
        z-index: -1
        opacity: 0.6
        filter: blur(20px)
      .top
        position: relative
        margin-bottom: 25px
        .back
          position absolute
          top: 0
          left: 6px
          z-index: 50
          .icon-back
            display: block
            padding: 9px
            font-size: $font-size-large-x
            color: $color-theme
            transform: rotate(-90deg)
        .title
          width: 70%
          margin: 0 auto
          line-height: 40px
          text-align: center
          no-wrap()
          font-size: $font-size-large
          color: $color-text
        .subtitle
          line-height: 20px
          text-align: center
          font-size: $font-size-medium
          color: $color-text
      .middle
        position: fixed
        width: 100%
        top: 80px
        bottom: 170px
        white-space: nowrap
        font-size: 0
        .middle-l
          display: inline-block
          vertical-align: top
          position: relative
          width: 100%
          height: 0
          padding-top: 80%
          .cd-wrapper
            position: absolute
            left: 10%
            top: 0
            width: 80%
            height: 100%
            .cd
              width: 100%
              height: 100%
              box-sizing: border-box
              border: 10px solid rgba(255, 255, 255, 0.1)
              border-radius: 50%
              &.play
                animation: rotate 20s linear infinite
              &.pause
                animation-play-state: paused
              .image
                position: absolute
                left: 0
                top: 0
                width: 100%
                height: 100%
                border-radius: 50%
          .playing-lyric-wrapper
            width: 80%
            margin: 30px auto 0 auto
            overflow: hidden
            text-align: center
            .playing-lyric
              height: 20px
              line-height: 20px
              font-size: $font-size-medium
              color: $color-text-l
        .middle-r
          display: inline-block
          vertical-align: top
          width: 100%
          height: 100%
          overflow: hidden
          .lyric-wrapper
            width: 80%
            margin: 0 auto
            overflow: hidden
            text-align: center
            .text
              line-height: 32px
              color: $color-text-l
              font-size: $font-size-medium
              &.current
                color: $color-text
      .bottom
        position: absolute
        bottom: 50px
        width: 100%
        .dot-wrapper
          text-align: center
          font-size: 0
          .dot
            display: inline-block
            vertical-align: middle
            margin: 0 4px
            width: 8px
            height: 8px
            border-radius: 50%
            background: $color-text-l
            &.active
              width: 20px
              border-radius: 5px
              background: $color-text-ll
        .progress-wrapper
          display: flex
          align-items: center
          width: 80%
          margin: 0px auto
          padding: 10px 0
          .time
            color: $color-text
            font-size: $font-size-small
            flex: 0 0 30px
            line-height: 30px
            width: 30px
            &.time-l
              text-align: left
            &.time-r
              text-align: right
          .progress-bar-wrapper
            flex: 1
        .operators
          display: flex
          align-items: center
          .icon
            flex: 1
            color: $color-theme
            &.disable
              color: $color-theme-d
            i
              font-size: 30px
          .i-left
            text-align: right
          .i-center
            padding: 0 20px
            text-align: center
            i
              font-size: 40px
          .i-right
            text-align: left
          .icon-favorite
            color: $color-sub-theme
      &.normal-enter-active, &.normal-leave-active
        transition: all 0.4s
        .top, .bottom
          transition: all 0.4s cubic-bezier(0.86, 0.18, 0.82, 1.32)
      &.normal-enter, &.normal-leave-to
        opacity: 0
        .top
          transform: translate3d(0, -100px, 0)
        .bottom
          transform: translate3d(0, 100px, 0)
    .mini-player
      display: flex
      align-items: center
      position: fixed
      left: 0
      bottom: 0
      z-index: 180
      width: 100%
      height: 60px
      background: $color-highlight-background
      &.mini-enter-active, &.mini-leave-active
        transition: all 0.4s
      &.mini-enter, &.mini-leave-to
        opacity: 0
      .icon
        flex: 0 0 40px
        width: 40px
        padding: 0 10px 0 20px
        img
          border-radius: 50%
          &.play
            animation: rotate 10s linear infinite
          &.pause
            animation-play-state: paused
      .text
        display: flex
        flex-direction: column
        justify-content: center
        flex: 1
        line-height: 20px
        overflow: hidden
        .name
          margin-bottom: 2px
          no-wrap()
          font-size: $font-size-medium
          color: $color-text
        .desc
          no-wrap()
          font-size: $font-size-small
          color: $color-text-d
      .control
        flex: 0 0 30px
        width: 30px
        padding: 0 10px
        .icon-play-mini, .icon-pause-mini, .icon-playlist
          font-size: 30px
          color: $color-theme-d
        .icon-mini
          font-size: 32px
          position: absolute
          left: 0
          top: 0
  @keyframes rotate
    0%
      transform: rotate(0)
    100%
      transform: rotate(360deg)
</style>