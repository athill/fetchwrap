// import React from 'react';
// import ReactDOM from 'react-dom';
import fetchMock from './fetchwrapper.js';

describe('fetchMock', () =>  {
	afterEach(() => {
		fetchMock.off();
	});
	it('toggles mocking', () => {
		expect(fetchMock.mocking).toBe(true);
		fetchMock.off();
		expect(fetchMock.mocking).toBe(false);
		fetchMock.on();
		expect(fetchMock.mocking).toBe(true);

	});

	it('builds a structure of mocks', () => {
		expect(fetchMock.mocks).toEqual({});
		fetchMock.on();
		fetchMock.mock('GET', '/foo', { foo: 'bar' });
		fetchMock.mockGet('/foo', 200);
		fetchMock.mock('POST', '/foo', { biz: 'bang', status: 400 });
		fetchMock.mock('GET', '/bar', { a: 'b' });
		const expected =  {"/foo":{"GET":[{"body":{"foo":"bar"},"options":{"status":200}},{"options":{"status":200},"body":{}}],"POST":[{"body":{"biz":"bang"},"options":{"status":400}}]},"/bar":{"GET":[{"body":{"a":"b"},"options":{"status":200}}]}};
        // expect(fetchMock.mocks).toEqual(expected);
        console.log(JSON.stringify(fetchMock.mocks));
	});

	it('mocks a mock', () => {
		fetchMock.on();
		fetchMock.mock('GET', '/foo', { foo: 'bar' });
		fetch('/foo')
			.then(response => response.json())
			.then(response => console.log(response))
			.catch(error => console.error(error));;	
	});

	it('does it for real', () => {
		// fetch('https://google.com').then(response => console.log(response)).catch(error => console.error(error));
	});
});
