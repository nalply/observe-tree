import test from 'ava'
import observeTree from '.'


// Test helpers
// TODO: equiv ignores symbols
const equiv = (v1, v2) => JSON.stringify(v1) === JSON.stringify(v2)
const upd = (p, oldValue, newValue) => ({ path: p.split('.'), oldValue, newValue})
const ins = (p, newValue) => ({ path: p.split('.'), newValue })
const del = (p, oldValue) => ({ path: p.split('.'), oldValue })
function init(observee = {}) {
  const ref = initRef()
  return { ref, observee, observable: observeTree(observee, ref.cb) }
}
const clone = obj => Object.assign({}, obj)
function initRef() {
  const ref = []
  ref.cb = change => ref.push(new Promise(res => res(clone(change))))
  ref.all = () => Promise.all(ref)
  return ref
}


test('simple set', async t => {
  const { ref, observee, observable } = init()

  observable.a = 'alpha'
  t.true(equiv(await ref[0], ins('a', 'alpha')))
  t.true(equiv(observable, observee))
})


test('deep set', async t => {
  const { ref, observee, observable } = init()

  observable.x = {}
  t.true(equiv(await ref.pop(), ins('x', {})))
  observable.x.y = {}
  t.true(equiv(await ref.pop(), ins('x.y', {})))
  observable.x.y.b = 'beta'
  t.true(equiv(await ref.pop(), ins('x.y.b', 'beta')))
  t.true(equiv(observable, observee))
})


test('change record is plain object', async t => {
  const { ref, observee, observable } = init()
  
  observable.c = 'gamma'
  t.is((await ref.pop()).constructor, Object)
})


test('all primitives', async t => {
  const { ref, observee, observable } = init()
  Object.assign(observable, [ 'string', 42, false, Symbol(), null ])
  const changes = await ref.all()
  t.true(equiv(observable, observee))

  // equiv() ignores symbols
  t.is(observable[3], observee[3])
  t.is(typeof observable[3], 'symbol')
})


test('work with complicated objects', async t => {
  const complicatedObject = {
    x: { d: 'delta', e: 'epsilon', },
    y: 'ypsilon',
    z1: { z2: { z3: { z4: {}}}},
  }
  const { ref, observee, observable } = init(complicatedObject)
  
  t.true(equiv(observable, complicatedObject))
  observable.z1.z2.z3.z4.z5 = {}
  t.true(equiv(await ref.pop(), ins('z1.z2.z3.z4.z5', {})))
  t.true(equiv(observable, observee))

  const another = {
    i: 'iota', k: 'kappa', l: 'lambda',
    f: [[['phew']]],
  }
  observable.z1.z2.z3.z4.z5.z6 = another
  t.true(equiv(await ref.pop(), ins('z1.z2.z3.z4.z5.z6', another)))
  t.true(equiv(observable, observee))
  t.is(observee.z1.z2.z3.z4.z5.z6.f[0][0][0], 'phew')

  observable.z1.z2.z3.z4.z5.z6.f.m = 'mu'
  t.true(equiv(await ref.pop(), ins('z1.z2.z3.z4.z5.z6.f.m', 'mu')))

  observable.z1.z2.z3.z4.z5.z6.f[1] = 42
  t.true(equiv(await ref.pop(), ins('z1.z2.z3.z4.z5.z6.f.1', 42)))
})


test.todo('add same subtree twice')
test.todo('alternatingly add in two different subtrees')
test.todo('add a tree with a cycle')
test.todo('start with a tree with a cycle')
test.todo('cycle detection')
test.todo('double observing')
test.todo('wrapped primitives, functions and other non-plain objects')
test.todo('re-add after delete')
test.todo('re-add after replace')
test.todo('two independent overlapping observables')
test.todo('symbols as keys')
