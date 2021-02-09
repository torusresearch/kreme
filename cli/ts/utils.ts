const genCircuitFilePrefix = (component: string, params: number[]) => {
    return `${component}-${params.join('_')}`
}

export {
    genCircuitFilePrefix,
}
