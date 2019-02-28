const PENDING = Symbol('PENDING');
const FULFILLED = Symbol('FULFILLED');
const REJECTED = Symbol('REJECTED');

class P {
  constructor(resolverFn) {
    this._state = PENDING;
    this._value = undefined;
    // we will store handlers added with .then() here
    // and will run them as soon as our promise settles
    this._handlersQueue = [];

    const resolve = (result) => {
      this._state = FULFILLED;
      this._value = result;
      this._handlersQueue.forEach(handlers => runOrQueueHandlers.apply(this, handlers));
    }

    const reject = (reason) => {
      this._state = REJECTED;
      this._value = reason;
      this._handlersQueue.forEach(handlers => runOrQueueHandlers.apply(this, handlers));
    }

    initiateResolution(resolverFn, resolve, reject);
  }
}

// if not settled, archive the handlers.
// if settled, run the handler that corresponds to the state.
function runOrQueueHandlers(onFulfilled, onRejected) {
  switch (this._state) {
    case PENDING:
      return this._handlersQueue.push([onFulfilled, onRejected]);
    case FULFILLED:
      return onFulfilled(this._value);
    case REJECTED:
      return onRejected(this._value);
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
  setTimeout(() => resolve(42))
});

console.log(p);

var p2 = new P((resolve, reject) => {
  reject('good rejection reason');
  // error should be ignored
  throw new Error('damn!');
});

console.log(p2);