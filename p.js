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

    const fulfill = (result) => {
      this._state = FULFILLED;
      this._value = result;
      this._handlersQueue.forEach(handlers => runOrQueueHandlers.apply(this, handlers));
    }

    const reject = (reason) => {
      this._state = REJECTED;
      this._value = reason;
      this._handlersQueue.forEach(handlers => runOrQueueHandlers.apply(this, handlers));
    }

    const resolve = (result) => {
      try {
        var then = getThen(result);
        if (then) {
          return initiateResolution(then.bind(result), resolve, reject);
        }
        fulfill(result);
      } catch (e) {
        reject(e);
      }
    }

    initiateResolution(resolverFn, resolve, reject);
  }

  then(onFulfilled, onRejected) {
    if (typeof onFulfilled !== 'function') {
      onFulfilled = x => x;
    }

    if (typeof onRejected !== 'function') {
      onRejected = e => { throw e };
    }

    return new P((resolve, reject) => {
      setTimeout(() => {
        initiateResolution(
          runOrQueueHandlers.bind(this),
          result => {
            try {
              return resolve(onFulfilled(result));
            } catch (e) {
              return reject(e);
            }
          },
          reason => {
            try {
              return resolve(onRejected(reason));
            } catch (e) {
              return reject(e);
            }
          }
        );
      }, 0);
    });
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

// Handle Promise-like objects and
// capture their .then method reference
function getThen(value) {
  let then;

  if (value) {
    then = value.then
  }

  if (typeof then === 'function') {
    return then;
  }

  return null;
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
  setTimeout(() => resolve(42), 1000);
});

p.then(() => 100500).then(() => Promise.resolve(42))
  .then(
    val => console.log('p1 resolved with', val)
  );

var p2 = new P((resolve, reject) => {
  resolve(42);
  throw new Error('damn!');
});

p2.then(
  val => console.log('p2 resolved with', val),
  err => console.log('p2 rejected with', err)
)

var p3 = new P((resolve, reject) => {
  resolve(Promise.resolve('the truth is out there'));
});

p3.then(
  val => console.log('p3 resolved with', val)
);
