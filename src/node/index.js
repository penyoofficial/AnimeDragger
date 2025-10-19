import { readFile } from "fs/promises"
import { dirname, extname } from "path"
import { fileURLToPath } from "url"

async function download(url, name) {
  const rpc = {
    host: "http://localhost",
    port: 16800,
    path: "/jsonrpc",
    token: "114514",
  }

  const resp = await fetch(`${rpc.host}:${rpc.port}${rpc.path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: new Date().getTime(),
      jsonrpc: "2.0",
      method: "aria2.addUri",
      params: [
        `token:${rpc.token}`,
        [url],
        {
          out:
            ((name) => {
              const charMap = {
                "/": "／",
                "\\": "＼",
                ":": "：",
                "*": "＊",
                "?": "？",
                '"': "＂",
                "<": "＜",
                ">": "＞",
                "|": "｜",
              }

              const illegalChars = Object.keys(charMap)
                .map((char) => char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
                .join("|")
              const regex = new RegExp(`[${illegalChars}]`, "g")

              return name.replace(regex, (match) => charMap[match] || "_")
            })(name) + extname(new URL(url).pathname),
        },
      ],
    }),
  })

  if (resp.error) {
    console.error("推送下载失败：", name)
  } else {
    console.debug("推送下载成功：", name)
  }
}

readFile(
  dirname(fileURLToPath(import.meta.url)) +
    "/hanime1.me_index_2025-10-19T10_20_50.118Z.json",
  "utf8"
)
  .then((r) => JSON.parse(r))
  .then((tasks) => tasks.map((t) => download(t.url, t.name)))
