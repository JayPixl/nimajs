export const nimaTemplates = [
    {
        name: "sample-template",
        triggerMode: "replace",
        triggers: {
            "load@self": {
                scale: [1, 1.2],
                duration: "1000ms",
                delay: "200ms",
                direction: "alternate",
                easing: "ease-smooth",
                iterations: "infinite",
                fill: "none",
            },
        },
    },
] as const
