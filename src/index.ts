const transformer: (program: unknown) => unknown = () => {
  throw new Error(
    'This package has been deprecated, change your dependencies to use the one called "@boostercloud/metadata-booster"'
  )
}

export default transformer
