
'use strict'

/** Deep proxy to observe object tree updates with cycle prevention. Whenever
  * something is changed, call back with a change record. Cycles inside the
  * object graph cause observeTree to throw a type error. Supported data
  * types: Primitives (except undefined), plain objects, arrays and dates.
  *
  * Exact definitions (inspired by Typescript and Flow):
  *   type Primitive = string | number | boolean | symbol | null
  *   type PlainObject = Array | Date | { [string]: PlainObject | Primitive }
  *   type ChangeRecord = { 
  *     path: [ string ],                  // path
  *     newValue: PlainObject | undefined, // undefined on creation
  *     oldValue: PlainObject | undefined, // undefined on deletion
  *   }
  *   type observeTree = (
  *     tree: PlainObject,                 // object tree to be observed
  *     callback: ChangeRecord => void,    // call back on updates in the tree
  *   ) => Proxy<PlainObject>              // return the observed object
*/
module.exports = function observeTree(tree, callback) {
  // Primitives can't be mutated, but they are also recursion leafs. At the
  // top of the recursion however we should throw and not silently do nothing.
  if (isPrimitive(tree)) throwTypeError('primitive')

  // Don't recreate the change record for each callback. However this means
  // that older records will be overwritten by newer records.
  const change = {}  
  function newChange(path, oldv, newv) {
    change.path = path
    isUndefined(oldv) ? delete change.oldValue : change.oldValue = oldv
    isUndefined(newv) ? delete change.newValue : change.newValue = newv
    return change
  }

  const handler = {
    observed: Symbol('observed'),
    map: new Map(), // type: [PlainObject]: [ string ]

    // These are the Proxy traps.
    setPrototypeOf() { throwTypeError('setting prototype') },
    defineProperty() { throwTypeError('defining property') },
    has(target, prop) { return prop === this.observed || prop in target },
    set(target, prop, newValue) {
      const path = this.map.get(target).concat(prop)
      newValue = this.observe(newValue, path)
      callback(newChange(path, target[prop], newValue))
      // this.deletePath(target[prop])
      target[prop] = newValue
      return true
    },
    deleteProperty(target, prop) {
      const path = this.map.get(target).concat(prop)
      callback(newChange(path, target[prop]))
      this.deleteFromTreeSet(target[prop])
      delete target[prop]
      return true
    },

    // Remove deleted or replaced tree nodes from treeSet because they could
    // be readded and cycle detection should then not kick in.
    deletePath(tree) {
      if (isPrimitive(tree)) return
      this.treeSet.delete(tree)
      for (const subTree of tree) deleteTree(subTree)
    },

    // Now finally we have the recursive implementation.
    observe(tree, path) {
      // We can't just pass path because then we would need a closure of the
      // proxy handler over path. Closures are new objects for each recursion.
      // Workaround: The proxy handler gets the path from a map of subtrees to
      // paths. The second task of the map is cycle detection.
      throwTypeErrorOnDisallowedType(tree)
      if (isPrimitive(tree)) return tree
      if (this.observed in tree) throwTypeError('double observing')
      
      const cycle = this.map.get(tree)
      if (cycle) throwTypeError('cycle at ' + cycle.join('.'))
  
      this.map.set(tree, path)
      for (const prop in tree)
        tree[prop] = this.observe(tree[prop], path.concat(prop))

      return new Proxy(tree, this)
    }
  }

  return handler.observe(tree, [])  
}


// Thanks to Stack Overflow 31538091!
function isPrimitive(value) { return value !== Object(value) }


function isUndefined(value) { return 'undefined' === typeof value }


// Wrapped primitives like new Number() aren't allowed because properties can
// be added to them, and this complicates tree management. Similarly for non-
// plain objects. Use Object.assign() if necessary.
// type f = (value: any, msg: string) => void | never
//   return undefined if value is Primitive | PlainObject
function throwTypeErrorOnDisallowedType(value, msg = '') {
  if (isUndefined(value)) throwTypeError(msg + ' undefined')

  if (isPrimitive(value)) return

  if ([ String, Number, Boolean, Symbol ].includes(value.constructor))
    throwTypeError(msg + ' wrapped ' + value.constructor.name.toLowerCase())
  
  if ([Object, Array, Date].includes(value.constructor)) return
  
  throwTypeError(msg + ' object of class ' + value.constructor.name)
}


function throwTypeError(what) {
  throw new TypeError('observeTree() not supported: ' + what)
}