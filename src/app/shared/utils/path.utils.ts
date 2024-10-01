export interface PathParameter {
  index: number
  parameter: string
}

function sanitizePathString(path: string) {
  path = path.trim()
  if (path.startsWith('/')) {
    path = path.slice(1)
  }
  return path
}

function extractParameterKeysFromPath(path: string): PathParameter[] {
  path = sanitizePathString(path)
  const pathSegments = path.split('/')
  const pathParameters: PathParameter[] = []
  pathSegments.forEach((segment, index) => {
    if (segment.startsWith('{') && segment.endsWith('}')) {
      segment = segment.slice(1, -1)
      pathParameters.push({
        index,
        parameter: segment
      })
    }
  })
  return pathParameters
}

function extractParameterValuesFromPath(parameters: PathParameter[], pathWithValues: string) {
  pathWithValues = sanitizePathString(pathWithValues)
  const pathSegments = pathWithValues.split('/')
  let parameterValues: Record<string, unknown> = {}
  parameters.forEach((param) => {
    parameterValues = {
      ...parameterValues,
      [param.parameter]: pathSegments[param.index]
    }
  })
  return parameterValues
}

export function mapPathSegmentsToPathParemeters(pathPattern: string, path: string) {
  const pathParameters = extractParameterKeysFromPath(pathPattern)
  return extractParameterValuesFromPath(pathParameters, path)
}

export function extractPathAfter(fullString: string, marker: string): string {
  fullString = fullString.endsWith('/') ? fullString.slice(0, -1) : fullString
  marker = marker.endsWith('/') ? marker.slice(0, -1) : marker

  const index = fullString.indexOf(marker)
  if (index !== -1) {
    let substr = fullString.substring(index + marker.length)
    substr = substr.startsWith('/') ? substr : '/' + substr
    return substr
  }
  return fullString.startsWith('/') ? fullString : '/' + fullString
}
