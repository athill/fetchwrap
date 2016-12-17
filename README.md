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

