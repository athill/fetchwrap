import fetchwrap from './fetchwrapper.js';

describe('fetchwrap', () =>  {
	const standardMockStructure =  {"/bar": {"GET": [{"a": "b"}]}, "/foo": {"GET": [{"foo": "bar"}, 200], "POST": [{"biz": "bang", "status": 400}]}};
	const standardMockFixedStructure =  {"/foo":{"GET":[{"body":{"foo":"bar"},"options":{"url":"/foo","status":200,"statusText":"OK"}},{"options":{"status":200,"statusText":"OK"},"body":{}}],"POST":[{"body":{"biz":"bang"},"options":{"url":"/foo","status":400,"statusText":"Bad Request"}}]},"/bar":{"GET":[{"body":{"a":"b"},"options":{"url":"/bar","status":200,"statusText":"OK"}}]}};;

	const standardMocks = () => {
		fetchwrap.mock('GET', '/foo', { foo: 'bar' });
		fetchwrap.mockGet('/foo', 200);
		fetchwrap.mock('POST', '/foo', { biz: 'bang', status: 400 });
		fetchwrap.mock('GET', '/bar', { a: 'b' });
	};

	afterEach(() => {
		fetchwrap.clear();
	});
	it('toggles mocking', () => {
		expect(fetchwrap.mocking).toBe(true);
		fetchwrap.off();
		expect(fetchwrap.mocking).toBe(false);
		fetchwrap.on();
		expect(fetchwrap.mocking).toBe(true);

	});

	it('builds a structure of mocks', () => {
		expect(fetchwrap.mocks).toEqual({});
		standardMocks();
		
        expect(fetchwrap.mocks).toEqual(standardMockStructure);
        // console.log(JSON.stringify(fetchwrap.mocks));
	});

	it('fixes the payload', () => {
		standardMocks();
		Object.getOwnPropertyNames(standardMockStructure).forEach(url => {
			Object.getOwnPropertyNames(standardMockFixedStructure[url]).forEach(method => {
				standardMockStructure[url][method].forEach((payload, index) => {
					expect(fetchwrap.fixPayload(url, payload)).toEqual(standardMockFixedStructure[url][method][index]);
				});
			});
		});
	});

	it('mocks a mock', () => {
		const payload = { foo: 'bar' };
		fetchwrap.mock('GET', '/foo', payload);
		fetch('/foo')
			.then(response => response.json())
			.then(response => expect(response).toEqual(payload))
			.catch(error => console.error(error));
	});

	it('should allow you to see which mocks were not called', () => {
		standardMocks();
		fetchwrap.validate();
		// console.log(uncalled);
	});
});
