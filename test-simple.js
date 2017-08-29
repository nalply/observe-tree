import test from 'ava'
import observeTree from '.'


// This test is really simple but tedious.
test.cb('simple set (without test helpers)', t => {
  t.plan(7)
  const observable = observeTree({}, change => {
    // change: an object with the keys path and newValue?
    t.is(Object.keys(change).length, 2)
    t.truthy(change.path)
    t.truthy(change.newValue)
    
    // change.path: an array ['a']?
    t.true(Array.isArray(change.path))
    t.is(change.path.length, 1)
    t.is(change.path[0], 'a')

    // change.newValue: a string 'alpha'?
    t.is(change.newValue, 'alpha')

    t.end()
  })
  observable.a = 'alpha'
})
