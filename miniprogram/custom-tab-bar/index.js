Component({
  data: {
    selected: 0,
    color: "#ceb1b1",
    selectedColor: "#3cc51f",
    list: [{
      pagePath: "/pages/index/index",
      // iconPath: "/image/icon_component.png",
      // selectedIconPath: "/image/icon_component_HL.png",
      text: "聊天模式"
    }, {
      pagePath: "/pages/duihua/index",
      // iconPath: "/image/icon_API.png",
      // selectedIconPath: "/image/icon_API_HL.png",
      text: "情景对话"
    }, {
      pagePath: "/pages/kouyu/index",
      // iconPath: "/image/icon_API.png",
      // selectedIconPath: "/image/icon_API_HL.png",
      text: "雅思口语"
    }]
  },
  attached() {
  },
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset
      // if (data.index === this.data.selected) {
      //   return;
      // }
      const url = data.path
      console.log('data=>', data)
      wx.switchTab({ url })
      this.setData({
        selected: data.index
      })
    }
  }
})