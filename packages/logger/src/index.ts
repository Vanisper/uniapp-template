export const Logger = (message: string) => {
    console.log(`${'Logger - ' + new Date().toISOString() + ': ' + message}`)
}

export default Logger;