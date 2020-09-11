const request = require('request');
const url = 'https://mp.jd.com/docs/dev/component/view/view.html'
const fs = require('fs')


const keys = {
  'view-container/view': 'view',
  'view-container/scroll-view': 'scroll-view',
  'view-container/swiper': 'swiper',
  'view-container/swiper-item': 'swiper-item',
  'list/button': 'button',
  'list/checkbox': 'checkbox',
  'list/checkbox-group': 'checkbox-group',
  'list/form': 'form',
  'list/input': 'input',
  'list/label': 'label',
  'list/picker': 'picker',
  'list/picker-view': 'picker-view',
  'list/picker-view-column': 'picker-view-column',
  'list/radio': 'radio',
  'list/radio-group': 'radio-group',
  'list/slider': 'slider',
  'list/switch': 'switch',
  'list/textarea': 'textarea',
  'navigation/navigator': 'navigator',
  'media-component/image': 'image',
  'media-component/video': 'video',
  'media-component/live-player': 'live-player',
  'canvas/canvas': 'canvas',
  'map/map': 'map',
  'open-capacity/web-view': 'web-view',
  'open-capacity/ad': 'ad',
}

async function toJson () {
  let requestList = []
  for (const key in keys) {
    requestList.push(handleRequest(key, keys[key]))
  }
  let result = await Promise.all(requestList)
  fs.writeFileSync('jd.json', JSON.stringify(result))
  console.log('写入完成')
}

toJson()

function handleRequest (key, realKey) {
  return new Promise((resolve, reject) => {
    let url = formKeyToUrl(key)
    request(url, (err, response, body) => {
      if (err) {
        reject({})
      }
      let item = {}
      // console.log(body)
      // let html = body.split('page-meta\n')[1]
      // let content = html.split('\n')[0]
      let reg = /<main.*?>([\s\S]*?)<\/main>/
      let section = reg.exec(body)[0]
      // let tbody = /<tbody.*?>([\s\S]*?)<\/tbody>/
      let tip = /<h\d.*?>[\s\S]*?<\/h\d>/

      let list = section.replace(/<pre.*?>([\s\S]*?)<\/pre>/, '').split(tip)
      let table = list.find(current => current.includes('<table>'))
      if (table) {
        // let table = reg.exec(desc)[1]
        // let body = tbody.exec(table)[1]
        let tableList = formTableToJson(table)
        item.tableList = tableList
      }
      let descriptList = formPtoJson(list[1])
      item.descriptList = descriptList
      // console.log(item, 'ok')
      resolve({[realKey]: item})
    })
  })
}

function formKeyToUrl (key) {
  // return `https://microapp.bytedance.com/docs/zh-CN/mini-app/develop/component/view-container/view/`
  return `https://microapp.bytedance.com/docs/zh-CN/mini-app/develop/component/${key}`
}

function formTableToJson (table) {
  let td = /<td.*?>([\s\S]*?)<\/td>/g
  let tr = /<tr.*?>([\s\S]*?)<\/tr>/g
  let link = /<a.*?>([\s\S]*?)<\/a>/
  let result = {}
  let flag = false
  table.replace(tr, (...args) => {
    if (!flag) {
      flag = true
      return
    }
    let list = []
    args[1].replace(td, (...args) => {
      let val = args[1].replace('<span></span>', '')
      if (link.test(val)) {
        val = link.exec(val)[1]
      }
      list.push(val)
    })
    let [
      attr = '',
      type = '',
      defaultValue = '',
      reqired = '',
      explain = '',
      edition = ''
    ] = list
    result[attr] = [
      `属性：${attr}`,
      `类型：${type}`,
      `默认值：${handleText(defaultValue)}`,
      `必填：${reqired}`,
      `说明：${handleText(explain)}`,
      `最低版本：${edition}`
    ]
  })
  return result
}

function formPtoJson (desc) {
  let p = /<p.*?>([\s\S]*?)<\/p>/g
  let descList = []
  desc.replace(p, (...args) => {
    let val = handleText(args[1])
    descList.push(val)
  })
  return descList
}

function handleText (text) {
  let link = /<a.*?>([\s\S]*?)<\/a>/g
  let code = /<code.*?>([\s\S]*?)<\/code>/g
  let strong = /<strong.*?>([\s\S]*?)<\/strong>/g
  let span = /<span.*?>([\s\S]*?)<\/span>/g
  text = text.replace(/&quot;/g, '')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&#x27;/g, '')
  if (link.test(text)) {
    text = text.replace(link, (...args) => {
      return args[1]
    })
  }
  if (code.test(text)) {
    text = text.replace(code, (...args) => {
      return `\`${args[1].replace(/\s+/g, ' ')}\``
    })
  }
  if (strong.test(text)) {
    text = text.replace(strong, (...args) => {
      return `**${args[1]}**`
    })
  }
  if (span.test(text)) {
    text = text.replace(span, (...args) => {
      return `${args[1]}`
    })
  }
  return text
}