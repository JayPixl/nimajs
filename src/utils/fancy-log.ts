import chalk from "chalk"
import { getVersion } from "./get-version.js"

export const fancyLog: (
    message: string,
    type?:
        | "success"
        | "error"
        | "info"
        | "header"
        | "hint"
        | "blank"
        | "warn"
        | "important"
        | "boldinfo",
) => void = (message, type = "info") => {
    switch (type) {
        case "info": {
            console.log(chalk.gray(`✧  ${message}`))
            break
        }
        case "boldinfo": {
            console.log(chalk.rgb(160, 160, 160).bold(`✧  ${message}`))
            break
        }
        case "important": {
            console.log(chalk.white.bold(`✧  ${message}`))
            break
        }
        case "error": {
            console.error(
                chalk.redBright(`✧  ERROR  ◦  ${chalk.italic(message)}`),
            )
            break
        }
        case "warn": {
            console.warn(
                chalk.yellowBright(`✧  WARN  ◦  ${chalk.italic(message)}`),
            )
            break
        }
        case "header": {
            const version = getVersion()
            console.log(
                chalk.cyan.bold.underline(
                    `✧*.        NimaJS ${
                        version ? `v${version} ` : ""
                    }       .*✧\n`,
                ),
            )
            break
        }
        case "hint": {
            console.log(chalk.rgb(160, 160, 160)(`✧  ${chalk.italic(message)}`))
            break
        }
        case "success": {
            console.log(chalk.bold.greenBright(`✧  ${message}`))
            break
        }
        case "blank": {
            console.log(chalk.gray(`✧`))
            break
        }
        default: {
            console.log(`✧ NIMA - ${message}`)
            break
        }
    }
}
