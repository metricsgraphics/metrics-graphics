import { isArrayOfArrays, isArrayOfObjectsOrEmpty } from '../misc/utility'

export default class AbstractChart {
  // base chart fields
  title = 'No Title'
  description = ''
  data = null
  markers = []
  width = 0
  height = 0
  target = null
  xAccessor = d => d
  yAccessor = d => d
  colors = []

  // data type flags
  singleObject = false
  arrayOfObjects = false
  arrayOfArrays = false
  nestedArrayOfArrays = false
  nestedArrayOfObjects = false

  constructor ({ title, description, data, markers, width, height, target, xAccessor, yAccessor, color, colors }) {
    // check that at least some data was specified
    if (!data || !data.length) return console.error('no data specified')

    // check that the target is defined
    if (!target || target === '') return console.error('no target specified')

    // set parameters
    this.title = title
    this.description = description
    this.data = data
    this.markers = markers
    this.width = width
    this.height = height
    this.target = target
    this.xAccessor = xAccessor
    this.yAccessor = yAccessor

    // normalize color and colors arguments
    if (color) {
      this.colors = Array.isArray(color) ? color : [color]
    } else {
      this.colors = Array.isArray(colors) ? colors : [colors]
    }

    this.setDataTypeFlags()
  }

  setDataTypeFlags () {
    // case 1: data is just one object, e.g. for bar chart
    if (!Array.isArray(this.data)) {
      this.singleObject = true
      return
    }

    // case 2: data is array of objects
    if (!isArrayOfArrays(this.data)) {
      this.arrayOfObjects = true
      return
    }

    // case 3: data is at least array of arrays
    this.arrayOfArrays = true

    // case 4: nested array of objects
    this.nestedArrayOfObjects = this.data.every(da => isArrayOfObjectsOrEmpty(da))

    // case 5: nested array of arrays
    this.nestedArrayOfArrays = this.data.every(da => isArrayOfArrays(da))
  }
}
