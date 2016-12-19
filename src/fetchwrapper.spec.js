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

	describe('on()/off()', () => {
		it('toggles mocking', () => {
			expect(fetchwrap.mocking).toBe(true);
			fetchwrap.off();
			expect(fetchwrap.mocking).toBe(false);
			fetchwrap.on();
			expect(fetchwrap.mocking).toBe(true);
		});
	});

	describe('mock', () => {
		it('builds a structure of mocks', () => {
			expect(fetchwrap.mocks).toEqual({});
			standardMocks();
	        expect(fetchwrap.mocks).toEqual(standardMockStructure);
	        // console.log(JSON.stringify(fetchwrap.mocks));
		});
	});

	describe('fixPayload', () => {
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
	});

	describe('fetch', () => {
		it('mocks a mock', () => {
			const payload = { foo: 'bar' };
			fetchwrap.mock('GET', '/foo', payload);
			fetch('/foo')
				.then(response => response.json())
				.then(response => expect(response).toEqual(payload))
				.catch(error => console.error(error));
		});

		it('executes each matching mock in sequence and then repeats final match', () => {
			standardMocks();
			const firstMatchPayload = standardMockStructure['/foo']['GET'][0];
			const secondMatchPayload = {};
			fetch('/foo').then(response => expect(response).toEqual(firstMatchPayload));
			fetch('/foo').then(response => expect(response).toEqual(secondMatchPayload));
			fetch('/foo').then(response => expect(response).toEqual(secondMatchPayload));
		});
	});

	describe('urlPatternMatches', () => {
		it('matches strings', () => {
			const string = '/foo';
			fetchwrap.mockGet(string);
			expect(fetchwrap.urlPatternMatches(string)).toBe(true);
			expect(fetchwrap.urlPatternMatches('/fidelity')).toBe(false);
		});
		it('matches regex strings', () => {
			const regex = '/bar.*';
			fetchwrap.mockGet(regex);
			expect(fetchwrap.urlPatternMatches('/bar')).toBe(true);
			expect(fetchwrap.urlPatternMatches('/baritone')).toBe(true);
			expect(fetchwrap.urlPatternMatches('/fidelity')).toBe(false);
		});		
	});

	describe('validate', () => {
		it('should allow you to see which mocks were not called', () => {
			standardMocks();
			expect(fetchwrap.validate().length).toBe(4);
			fetch('/foo');
			expect(fetchwrap.validate().length).toBe(3);
			fetch('/foo');
			expect(fetchwrap.validate().length).toBe(2);
			fetch('/foo', { method: 'POST' });
			expect(fetchwrap.validate().length).toBe(1);
			fetch('/bar');
			expect(fetchwrap.validate().length).toBe(0);		
			
		});
	});
});
