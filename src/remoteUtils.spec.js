import fetchwrap from './fetchwrapper';
import { getResource } from './remoteUtils';

describe('remoteUtils', () => {
	it('should fetch', () => {
		const payload = { foo: 'bar' };
		fetchwrap.mockGet('/foo', payload);
		const response = getResource('/foo')();
		response.then(response => expect(response).toEqual(payload));
	});
});