<template>
  <div class="search">
    <div class="search-box-wrapper">
      <search-box @query="onQueryChange" :placeholder="query"></search-box>
    </div>
    <div class="shortcut-wrapper" v-show="!query">
      <div class="shortcut">
        <div class="hot-key">
          <ul>
            <li @click="onQueryChange(item)" class="item" v-for="item in hotKey">
              <span>{{item}}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div class="search-result" v-show="query">
      <suggest :query="query"></suggest>
    </div>
  </div>
</template>

 <script type="text/ecmascript-6">
  import SearchBox from 'base/search-box/search-box'
  import Suggest from 'components/suggest/suggest'
  import {getHotKey} from 'api/search'
  import {ERR_OK} from 'api/config'
  export default {
    data() {
      return {
        hotKey: [],
        query: ''
      }
    },
    components: {
      SearchBox,
      Suggest
    },
    created() {
      this._getSearchHotKey()
    },
    methods: {
      onQueryChange(query) {
        this.query = query
      },
      _getSearchHotKey() {
        getHotKey().then((res) => {
          if (res.code === ERR_OK) {
            this.hotKey = this._normalization(res.data.hotkey)
          }
        })
      },
      _normalization(list) {
        let ret = []
        list.forEach((item, index) => {
          const hotkey = item.k
          if (index < 10) {
            ret.push(hotkey)
          }
        })
        return ret
      }
    }
  }
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"
  @import "~common/stylus/mixin"
  .search
    .search-box-wrapper
      margin: 20px
    .shortcut-wrapper
      position: fixed
      top: 178px
      bottom: 0
      width: 100%
      .shortcut
        height: 100%
        overflow: hidden
        .hot-key
          margin: 0 20px 20px 20px
          .title
            margin-bottom: 20px
            font-size: $font-size-medium
            color: $color-text-l
          .item
            display: inline-block
            padding: 5px 10px
            margin: 0 20px 10px 0
            border-radius: 6px
            background: $color-highlight-background
            font-size: $font-size-medium
            color: $color-text-d
        .search-history
          position: relative
          margin: 0 20px
          .title
            display: flex
            align-items: center
            height: 40px
            font-size: $font-size-medium
            color: $color-text-l
            .text
              flex: 1
            .clear
              extend-click()
              .icon-clear
                font-size: $font-size-medium
                color: $color-text-d
    .search-result
      position: fixed
      width: 100%
      top: 178px
      bottom: 0
</style>