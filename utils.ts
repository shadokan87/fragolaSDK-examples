export type ExtractToolHandler<T> = T extends { handler: infer H }
    ? H extends (...args: any[]) => any
        ? H
        : never
    : never;

export type AwaitedReturn<T extends (...args: any[]) => any> = Awaited<ReturnType<T>>;