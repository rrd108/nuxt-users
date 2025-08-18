// Utility to handle imports during different phases:
// - Development/Build: Use relative imports
// - Consumer apps: Use the package import

// During build, we need to use relative imports
export * from '../../utils/index'
export * from '../../types'
