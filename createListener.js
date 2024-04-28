function trigger(e) {
  return e.composedPath()[0];
}

function matchesTrigger(e, selectorString) {
  return trigger(e).matches(selectorString);
}

// create on listener
export function createListener(target) {
  return (eventName, selectorString, event, ops = {}) => {
    target.addEventListener(eventName, (e) => {
      if (selectorString === "" || matchesTrigger(e, selectorString)) event(e);
    }, ops);
  };
}