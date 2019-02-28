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
  try {
    resolverFn(resolve, reject);
  } catch (e) {
    reject(e);
  }
}

var p = new P((resolve, reject) => {
  resolve(42);
});

console.log(p);

var p2 = new P((resolve, reject) => {
  throw new Error('damn!');
});

console.log(p2);