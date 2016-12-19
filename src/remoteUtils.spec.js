import fetchwrap from './fetchwrap';
import { getResource, submitFormWithCsrf } from './remoteUtils';

describe('remoteUtils', () => {
	it('should fetch', () => {
		const payload = { foo: 'bar' };
		fetchwrap.mockGet('/foo', payload);
		const response = getResource('/foo')();
		response.then(response => expect(response).toEqual(payload));
	});

	it('should fetch with csrf', () => {
		const payload = { foo: 'bar' };
		fetchwrap.mockGet('/csrf/', {
	        "token": "b345c676-2654-4dcd-8c50-100d518aa07a",
	        "parameterName": "_csrf",
	        "headerName": "X-CSRF-TOKEN"
	    });
	    fetchwrap.mockGet('/foo', payload);

	    const result = submitFormWithCsrf('/foo', 'GET')({})
	    	.then(response => expect(response).toEqual(payload))
	    	.catch(error => console.error('error'));
	});
});