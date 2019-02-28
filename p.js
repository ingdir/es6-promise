const PENDING = Symbol('PENDING');
const FULFILLED = Symbol('FULFILLED');
const REJECTED = Symbol('REJECTED');

class P {
  constructor(resolverFn) {
    this._state = PENDING;
    this._value = undefined;

    const resolve = (result) => {
      this._state = FULFILLED;
      this._value = result;
    }

    const reject = (reason) => {
      this._state = REJECTED;
      this._value = reason;
    }

    initiateResolution(resolverFn, resolve, reject);
  }
}

function initiateResolution(resolverFn, resolve, reject) {
  const [resolveOnce, rejectOnce] = runAnyOnce(resolve, reject);

  try {
    resolverFn(resolveOnce, rejectOnce);
  } catch (e) {
    rejectOnce(e);
  }
}

function runAnyOnce(...fns) {
  let called = false;

  return fns.map(f => function() {
    if (!called) {
      called = true;
      return f.apply(null, arguments);
    }
  });
}

var p = new P((resolve, reject) => {
  resolve(42);
  resolve(100500);  // should be ignored
});

console.log(p);

var p2 = new P((resolve, reject) => {
  reject('good rejection reason');
  // error should be ignored
  throw new Error('damn!');
});

console.log(p2);