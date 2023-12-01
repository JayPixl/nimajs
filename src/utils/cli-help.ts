import chalk from "chalk"

const titleWidth = 40
const descriptionWidth = 100

const star = chalk.bold.rgb(180, 180, 180)("✧  ")

const title = (input: string) => {
    console.log(`${star}${chalk.bold.rgb(255, 255, 255)(input)}`)
    console.log(star)
}
const blank = () => {
    console.log(star)
}

const header = (input: string) => {
    console.log(`${star}  •  ${chalk.bold.rgb(220, 220, 220)(input)}`)
    console.log(star)
}

const cmd = (input: string) => {
    console.log(`${star}    ${chalk.reset.rgb(200, 200, 200)(input)}`)
}

const note = (input: string) => {
    console.log(`${star}        ${chalk.reset.rgb(200, 200, 200)(input)}`)
}

const italnote = (input: string) => {
    console.log(
        `${star}        ${chalk.reset.italic.rgb(200, 200, 200)(input)}`,
    )
}

const cmmdheader = (header: string, desc: string = "") => {
    console.log(
        `${star}        ${chalk.bold.rgb(230, 230, 230)(header)}${
            desc !== "" ? " - " + chalk.reset.italic(desc) : ""
        }`,
    )
    console.log(star)
}

const flag = (input: string) => {
    return chalk.bgRgb(30, 30, 30)(`${chalk.bgCyan(" ")} ${input}`)
}

const command = (
    command: string,
    description: string,
    defaultOption: boolean = false,
) => {
    let title = `${" ".repeat(
        (defaultOption ? titleWidth - 2 : titleWidth) - command.length,
    )}${defaultOption ? chalk.green("* ") : ""}${command}`
    let descriptionArr = []
    let remainingDesc = description

    while (remainingDesc.length > 0) {
        let workingChunk = remainingDesc.slice(0, descriptionWidth)
        let done = false

        if (remainingDesc.length < descriptionWidth) {
            descriptionArr.push(remainingDesc)
            remainingDesc = ""
        } else {
            while (!done) {
                if (workingChunk[workingChunk.length - 1] === " ") {
                    workingChunk = workingChunk.slice(
                        0,
                        workingChunk.length - 1,
                    )
                    remainingDesc = remainingDesc.slice(workingChunk.length + 1)
                    descriptionArr.push(workingChunk)
                    done = true
                } else {
                    workingChunk = workingChunk.slice(
                        0,
                        workingChunk.length - 1,
                    )
                }
            }
        }
    }

    console.log(
        `${star}${chalk.bold.cyan(title)}  ${chalk.rgb(
            180,
            180,
            180,
        )(descriptionArr[0])}`,
    )

    descriptionArr.slice(1).map(descLine => {
        console.log(
            `${star}${" ".repeat(titleWidth)}  ${chalk.rgb(
                180,
                180,
                180,
            )(descLine)}`,
        )
    })
    console.log(star)
}

export const cliHelp = () => {
    title("CLI Help 💻")
    header("Usage")
    note(
        `\`${chalk.yellow("npx")} ${chalk.yellow("nima")} ${chalk.blue(
            "[command]",
        )} ${chalk.rgb(160, 160, 160)("[flags]")}\``,
    )
    note(chalk.bold("    or"))
    note(
        `\`${chalk.yellow("npx")} ${chalk.yellow("nimajs")} ${chalk.blue(
            "[command]",
        )} ${chalk.rgb(160, 160, 160)("[flags]")}\``,
    )
    blank()
    note(
        flag(
            `If run without a command, defaults to the ${chalk.bold(
                "`build`",
            )} command.`,
        ),
    )
    blank()
    header("Help")
    note("Run this command to access the help menu.")
    blank()
    note(
        `\`${chalk.yellow("npx")} ${chalk.yellow("nima")} ${chalk.rgb(
            160,
            160,
            160,
        )("--help")}\``,
    )
    blank()
    header("Commands")
    cmd(
        `${chalk.blue("init")} ${chalk.rgb(
            160,
            160,
            160,
        )("[format] [output]")}`,
    )
    blank()
    italnote(`Creates a nima config file in your project.`)
    blank()
    cmmdheader("Format", "format of config file")
    command("--js", "js format", true)
    command("--json", "json format")
    command("--ts", "ts format")
    cmmdheader(
        "Output",
        `where to place output file; default ${chalk.cyan("`./`")}`,
    )
    command("--output [dir] | -o [dir]", "js format")
    cmd(
        `${chalk.blue("build")} ${chalk.rgb(
            160,
            160,
            160,
        )("[options] [minify] [format]")}`,
    )
    blank()
    italnote(
        `Runs the build script to generate the Nima Engine at the directory specified in the config file.`,
    )
    blank()
    cmmdheader("Options", "build options")
    command(
        "--watch | -w",
        "Run in watch mode. Watches for changes to input files or config file and reruns the build script automatically.",
    )
    cmmdheader(
        "Minify",
        "CSS and JS minification are automatically set to true by default.",
    )
    command("--minify | -m", "Minify both CSS and JS engine output.")
    command(
        "--minify-css",
        `Minify CSS output. Use ${chalk.cyan(
            "`--no-minify-css`",
        )} to cancel CSS minification.`,
    )
    command(
        "--minify-js",
        `Minify JS output. Use ${chalk.cyan(
            "`--no-minify-js`",
        )} to cancel JS minification.`,
    )
    note(
        "  " +
            flag(
                `Cannot minify when in TypeScript mode! Set the format explicitly with the ${chalk.cyan(
                    "`--ts`",
                )} flag or use ${chalk.cyan(
                    "`--no-minify-js`",
                )} to avoid errors`,
            ),
    )
    note(
        "  " +
            flag(
                `at build time.                                                                                                               `,
            ),
    )
    blank()
    cmmdheader("Format", "format of Nima Engine")
    note(
        "  " +
            flag(
                "Nima will automatically detect whether the engine should be output in TypeScript or JavaScript format. Note that this detection",
            ),
    )
    note(
        "  " +
            flag(
                "mechanism isn't perfect so it's best to use one of these options to explicitly set the output format.                          ",
            ),
    )
    blank()
    command(
        "--js",
        `The Nima engine will be output in ${chalk.cyan(
            "`js`",
        )} format as ${chalk.cyan("`nima-engine.js`")}.`,
    )
    command(
        "--ts",
        `The Nima engine will be output in ${chalk.cyan(
            "`ts`",
        )} format as ${chalk.cyan(
            "`nima-engine.ts`",
        )}. Using this flag automatically sets the JS minification option to false as there is no TypeScript minification option available at the moment.`,
    )
}
