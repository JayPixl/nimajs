export class NimaError extends Error {
    hint?: string

    constructor(message: string, hint?: string) {
        super(message)
        this.name = "NimaError"
        this.hint = hint
    }
}
