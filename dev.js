import fs from "fs"
import chokidar from "chokidar"

const paths = {
    "./src/lib/engine/v1.ts": {
        output: "./templates/engine/v1.txt",
        divider: "/* END_IMPORTS */",
        type: "engine",
    },
}

Object.keys(paths).map(key => {
    const watcher = chokidar.watch(key, {
        persistent: true,
        ignoreInitial: false,
    })

    watcher.on("change", async path => {
        console.clear()
        console.log(`File changed: ${path}`)
        const template = fs
            .readFileSync(key)
            .toString()
            .split("/* END_IMPORTS */")
        const target = fs
            .readFileSync(paths[key].output)
            .toString()
            .split("/* END_IMPORTS */")
        fs.writeFileSync(
            paths[key].output,
            [target[0], template[1]].join("/* END_IMPORTS */"),
        )
        console.log("Compilation complete")
    })

    watcher.on("error", error => {
        console.error(`Watcher error: ${error}`)
    })

    process.on("SIGINT", () => {
        watcher.close()
        process.exit()
    })
})
