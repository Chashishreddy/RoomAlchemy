export const buildCspDirectives = () => ({
  directives: {
    defaultSrc: ["'self'"],
    imgSrc: ["'self'", 'blob:', 'data:'],
    connectSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    frameAncestors: ["'none'"]
  }
});
