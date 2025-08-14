// Minimal module declaration for node-forge to satisfy TypeScript in the client
declare module 'node-forge' {
  const forge: unknown;
  export = forge;
}
