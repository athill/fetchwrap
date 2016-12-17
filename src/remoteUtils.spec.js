import fetchwrap from './fetchwrapper';
import { getResource } from './remoteUtils';

describe('remoteUtils', () => {
	it('should fetch', () => {
		fetchwrap.on();
		fetchwrap.mockGet('/foo', { foo: 'bar' });
		const response = getResource('/foo', error => console.error('fail', error))();
		// console.log(fetch.toString());
	});
});