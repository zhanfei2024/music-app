import * as types from './mutation-types'

const mutations = {
  [types.SET_SINGER](state, singer) {
    state.singer = singer
  },
  [types.SET_PLAYING](state, flag) {
    state.playing = flag
  },
  [types.SET_FULLSCREEN](state, flag) {
    state.fullScreen = flag
  },
  [types.SET_PLAYLIST](state, arr) {
    state.playList = arr
  },
  [types.SET_SEQUENCELIST](state, arr) {
    state.sequenceList = arr
  },
  [types.SET_MODE](state, val) {
    state.mode = val
  },
  [types.SET_CURRENINDEX](state, num) {
    state.currentIndex = num
  },
  [types.SET_DISC](state, disc) {
    state.disc = disc
  },
  [types.SET_TOPLIST](state, list) {
    state.topList = list
  }
}

export default mutations