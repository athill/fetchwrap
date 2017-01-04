# fetchwrap

`fetch` mocking framework

## Usage

```
import fetchwrap from 'fetchwrap';

describe('test', () => {
  it('should mock fetch', () {
    const payload = { foo: 'bar' };
    fetchwrap.mock('GET', '/foo', payload);
      fetch('/foo')
        .then(response => response.json())
        .then(response => expect(response).toEqual(payload));
  });
});
```

## API

### `mock(method, pattern, [response])`

Registers a mock for a given method/pattern. 

- `method` can be any of 'DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH' 
- `pattern` can exactly match a URL or can use a regular expression string, (e.g., "/foo*"). 
- `response` is indicative of what you will be sent back as payload. It can take an integer status code or an object representing the response. If the object has a `status` member, that will be pulled out of the payload

If multiple mocks are registered for the same method/pattern, the mocks will be called in order of registration, with the final matching mock called for subsequent matches.

### `delete(pattern, [response])`, `get(pattern, [response])`, `head(pattern, [response])`, `options(pattern, [response])`, `patch(pattern, [response])`, `post(pattern, [response])`, `put(pattern, [response])`

Convenience methods which call `mock` with the appropriate method

### `clear()`

Clears all registered mocks and tracking information

### `validate()`

Returns an array of unmatched patterns

