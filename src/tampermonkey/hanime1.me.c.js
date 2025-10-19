// ==UserScript==
// @name         HAnime Indexer
// @namespace    https://xrl.im/
// @version      25.10.19
// @description  下载里番！
// @author       krkrxrl
// @match        https://hanime1.me/**
// @icon         https://www.google.com/s2/favicons?sz=64&domain=hanime1.me
// @grant        none
// ==/UserScript==

;(() => {
  async function main() {
    let videos = Array.from(document.querySelectorAll("a"))
      .filter((a) => a.href.match(/^https:\/\/hanime1.me\/watch\?v=(\d+)$/))
      .map((a) => ({
        id: a.href.match(/^https:\/\/hanime1.me\/watch\?v=(\d+)$/)[1],
      }))

    videos = Array.from(new Map(videos.map((v) => [v.id, v])).values())

    for (const v of videos) {
      const videoDL = await open(`https://hanime1.me/download?v=${v.id}`)
      while (videoDL.document.querySelector("h3") === null) {
        await new Promise((r) => setTimeout(r, 100))
      }
      v.name = videoDL.document.querySelector("h3").textContent
      v.date = videoDL.document.querySelector("p").textContent.substring(0, 10)
      v.url = videoDL.document.querySelector(".exoclick-popunder").dataset.url
      videoDL.close()
    }

    downloadJSON(videos, `hanime1.me_index_${new Date().toISOString()}`)
    console.debug("result: ", videos)
  }

  /**
   * @param { string } url
   * @returns { Promise<Window> }
   */
  async function open(url) {
    return new Promise((resolve, reject) => {
      const iframe = document.createElement("iframe")
      iframe.style.display = "none"
      iframe.style.position = "absolute"
      iframe.style.width = "0"
      iframe.style.height = "0"
      iframe.style.border = "none"

      const timeout = 30000
      const timer = setTimeout(() => {
        if (iframe.parentNode) document.body.removeChild(iframe)
        reject(new Error(`加载超时（${timeout}ms）`))
      }, timeout)

      iframe.onload = () => {
        clearTimeout(timer)
        try {
          if (iframe.contentWindow) {
            resolve(iframe.contentWindow)
          } else {
            throw new Error("无法获取iframe的Window对象")
          }
        } catch (err) {
          reject(err)
        }
      }

      iframe.onerror = (err) => {
        clearTimeout(timer)
        if (iframe.parentNode) document.body.removeChild(iframe)
        reject(new Error(`加载失败: ${err.message}`))
      }

      iframe.src = url
      document.body.appendChild(iframe)
    })
  }

  /**
   * @param { Object } data
   * @param { string } name
   */
  function downloadJSON(data, name) {
    try {
      const jsonString = JSON.stringify(data, null, 2)

      const blob = new Blob([jsonString], { type: "application/json" })

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url

      a.download = `${name}.json`

      document.body.appendChild(a)
      a.click()

      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 0)

      return true
    } catch (_) {
      return false
    }
  }

  document.body.appendChild(
    (() => {
      const _ = document.createElement("button")
      _.innerText = "抓取本页"
      _.style.cssText = `
      position: fixed;
      z-index: 99999;
      right: 0;
      bottom: 20vh;
      padding: 10px 20px;
      border-radius: 5px;
      background: #ff4081;
      color: white;
    `
      _.onclick = main
      return _
    })()
  )
})()
